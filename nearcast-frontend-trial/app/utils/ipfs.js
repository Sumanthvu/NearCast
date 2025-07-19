import axios from "axios";

/**
 * Upload any File to IPFS via Pinata pinFileToIPFS API.
 * Returns the CID on success.
 */
export async function uploadToPinata(file) {
  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
  const data = new FormData();
  data.append("file", file);

  // Replace these with your Pinata API keys:
  const PINATA_API_KEY = "YOUR_PINATA_API_KEY";
  const PINATA_API_SECRET = "YOUR_PINATA_SECRET_API_KEY";

  const response = await axios.post(url, data, {
    maxContentLength: "Infinity",
    headers: {
      "Content-Type": "multipart/form-data",
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_API_SECRET
    }
  });

  // The unique IPFS hash (CID) for the pinned file
  return response.data.IpfsHash;
}
