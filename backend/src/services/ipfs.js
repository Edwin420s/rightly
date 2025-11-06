const pinataSDK = require('@pinata/sdk');
const pinata = new pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET
);

class IPFSService {
  async pinJSON(data) {
    try {
      const result = await pinata.pinJSONToIPFS(data);
      return result.IpfsHash;
    } catch (error) {
      console.error('IPFS pinning error:', error);
      throw new Error('Failed to pin data to IPFS');
    }
  }

  async pinFile(fileBuffer, filename) {
    try {
      const result = await pinata.pinFileToIPFS(fileBuffer, {
        pinataMetadata: { name: filename }
      });
      return result.IpfsHash;
    } catch (error) {
      console.error('IPFS file pinning error:', error);
      throw new Error('Failed to pin file to IPFS');
    }
  }

  getGatewayURL(cid) {
    return `https://ipfs.io/ipfs/${cid}`;
  }
}

module.exports = new IPFSService();