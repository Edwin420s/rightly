const Clip = require('../models/Clip');
const Receipt = require('../models/Receipt');
const User = require('../models/User');
const logger = require('../utils/logger');

class AnalyticsService {
  async getPlatformStats() {
    try {
      const [
        totalClips,
        totalSales,
        totalUsers,
        activeClips
      ] = await Promise.all([
        Clip.countDocuments(),
        Receipt.countDocuments(),
        User.countDocuments(),
        Clip.countDocuments({ active: true })
      ]);

      // Calculate total volume
      const salesData = await Receipt.aggregate([
        {
          $group: {
            _id: null,
            totalVolume: { $sum: { $toDouble: '$price' } }
          }
        }
      ]);

      const totalVolume = salesData.length > 0 ? salesData[0].totalVolume : 0;

      return {
        totalClips,
        totalSales,
        totalUsers,
        activeClips,
        totalVolume: totalVolume.toString()
      };
    } catch (error) {
      logger.error('Error getting platform stats:', error);
      throw error;
    }
  }

  async getUserStats(walletAddress) {
    try {
      const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
      
      if (!user) {
        throw new Error('User not found');
      }

      // Get creator stats
      const creatorClips = await Clip.find({ creator: walletAddress.toLowerCase() });
      const clipIds = creatorClips.map(clip => clip._id);

      const creatorSales = await Receipt.aggregate([
        { $match: { clipId: { $in: clipIds } } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalEarnings: { $sum: { $toDouble: '$price' } }
          }
        }
      ]);

      // Get buyer stats
      const buyerStats = await Receipt.aggregate([
        { $match: { buyer: walletAddress.toLowerCase() } },
        {
          $group: {
            _id: null,
            totalPurchases: { $sum: 1 },
            totalSpent: { $sum: { $toDouble: '$price' } }
          }
        }
      ]);

      return {
        creator: {
          totalClips: creatorClips.length,
          totalSales: creatorSales.length > 0 ? creatorSales[0].totalSales : 0,
          totalEarnings: creatorSales.length > 0 ? creatorSales[0].totalEarnings.toString() : '0'
        },
        buyer: {
          totalPurchases: buyerStats.length > 0 ? buyerStats[0].totalPurchases : 0,
          totalSpent: buyerStats.length > 0 ? buyerStats[0].totalSpent.toString() : '0'
        }
      };
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw error;
    }
  }

  async getSalesTrends(timeframe = '7d') {
    try {
      let dateFilter = new Date();
      
      switch (timeframe) {
        case '24h':
          dateFilter.setDate(dateFilter.getDate() - 1);
          break;
        case '7d':
          dateFilter.setDate(dateFilter.getDate() - 7);
          break;
        case '30d':
          dateFilter.setDate(dateFilter.getDate() - 30);
          break;
        default:
          dateFilter.setDate(dateFilter.getDate() - 7);
      }

      const salesTrend = await Receipt.aggregate([
        {
          $match: {
            createdAt: { $gte: dateFilter }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            salesCount: { $sum: 1 },
            salesVolume: { $sum: { $toDouble: '$price' } }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      return salesTrend;
    } catch (error) {
      logger.error('Error getting sales trends:', error);
      throw error;
    }
  }

  async getTopCreators(limit = 10) {
    try {
      const topCreators = await Receipt.aggregate([
        {
          $lookup: {
            from: 'clips',
            localField: 'clipId',
            foreignField: '_id',
            as: 'clip'
          }
        },
        {
          $unwind: '$clip'
        },
        {
          $group: {
            _id: '$clip.creator',
            totalSales: { $sum: 1 },
            totalEarnings: { $sum: { $toDouble: '$price' } },
            avgSalePrice: { $avg: { $toDouble: '$price' } }
          }
        },
        {
          $sort: { totalEarnings: -1 }
        },
        {
          $limit: limit
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: 'walletAddress',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            walletAddress: '$_id',
            username: '$user.username',
            totalSales: 1,
            totalEarnings: 1,
            avgSalePrice: 1
          }
        }
      ]);

      return topCreators;
    } catch (error) {
      logger.error('Error getting top creators:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();