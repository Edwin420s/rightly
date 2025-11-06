const pinataSDK = require('@pinata/sdk');

let pinata;
if (process.env.PINATA_API_KEY && process.env.PINATA_SECRET) {
  pinata = new pinataSDK(
    process.env.PINATA_API_KEY,
    process.env.PINATA_SECRET
  );
}

class IPFSService {
  async pinJSON(data) {
    try {
      if (!pinata) {
        // For development without Pinata credentials
        const mockCid = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log('Mock IPFS pinning:', mockCid);
        return mockCid;
      }

      const result = await pinata.pinJSONToIPFS(data);
      return result.IpfsHash;
    } catch (error) {
      console.error('IPFS pinning error:', error);
      throw new Error('Failed to pin data to IPFS');
    }
  }

  async pinFile(fileBuffer, filename) {
    try {
      if (!pinata) {
        const mockCid = `mock-file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log('Mock file IPFS pinning:', mockCid);
        return mockCid;
      }

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