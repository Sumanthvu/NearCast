// Your actual Pinata credentials
const PINATA_API_KEY ="bb9b035b08e41bd6eb01"
const PINATA_SECRET_KEY ="ef52ed3b926391c695ff724fede32db48457ee13f9ad1374fb068347b61249b6"

export const uploadToIPFS = async (file) => {
  try {
    const formData = new FormData()
    formData.append("file", file)

    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        uploadedBy: "NEARCast",
        timestamp: Date.now().toString(),
      },
    })
    formData.append("pinataMetadata", metadata)

    const options = JSON.stringify({
      cidVersion: 0,
    })
    formData.append("pinataOptions", options)

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Pinata API Error:", errorText)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log("IPFS Upload Success:", result)
    return result
  } catch (error) {
    console.error("Error uploading to IPFS:", error)
    throw new Error(`Failed to upload to IPFS: ${error.message}`)
  }
}
