import  QRCode from "qrcode";

export const genrateQrcode = async (serialNo, coupon_code) => {
    try {
      // Combine the serial number and coupon code into a data string
      const data = `https://demo.rajnigandha.com/account?value=EarnPoints/${coupon_code}/${serialNo}`;
  
      // Generate a QR code as a base64 string
      const qrCodeBase64 = await QRCode.toDataURL(data); // Using toDataURL instead of toBuffer
  
      // Return the generated QR code as a base64 string
      return qrCodeBase64;
    } catch (error) {
      console.error("Error generating QR code:", error);
      throw new Error("Failed to generate QR code");
    }
  };