// import nodemailer from "nodemailer";
// import fs from "fs";
// import path from "path";
// import moment from "moment";
// import {
//   responseHandler,
//   errorHandler,
//   statusMaker,
//   apiMessages,
//   checkEmptyArray,
//   Notification,
//   redeemSchema,
//   couponSchema,
//   customer,
// } from "./index";
// import axios from "axios";

// //whatsapp notifications
// // export const sendWhatsAppMessage = async (redeemDetails) => {
// //   try {
// //     // Extract necessary information
// //     const userid = redeemDetails.api_key;
// //     console.log(userid);
// //     const passwordd = redeemDetails.password;
// //     // console.log(password);
// //     const phone_number = redeemDetails.phone_number;
// //     console.log(phone_number); // Extracted from redeemDetails
// //     const userName = redeemDetails.first_name || "Customer"; // From customer collection
// //     const rewardItem = redeemDetails.rewardItem || "Reward Item"; // From redeemSchema
// //     const usedPoints = redeemDetails.usedPoints || 0; // From redeemSchema
// //     const balancePoints = redeemDetails.balance_point || 0; // From customer collection

// //     // Populate the template
// //     const gupshupTemplate = `
// //         Dear ${userName}, thanks for redeeming ${rewardItem} from the Rajniganda Reward Catalogue! 🎉 
// //         You've used ${usedPoints} points, and your current balance is now ${balancePoints}. 
// //         Keep earning loyalty points and enjoy more rewards! - Team DS Group
// //       `;
// //     //   console.log(gupshupTemplate);
// //     //   const gupshupTemplate= `
// //     //   Dear+${userName}%2C+thanks+for+redeeming+${rewardItem}+from+the+Rajniganda+Reward+Catalogue%21++You%27ve+used+${usedPoints}+points%2C+and+your+current+balance+is+now+${balancePoints}.+Keep+earning+loyalty+points+and+enjoy+more+rewards%21+-+Team+DS+Group&isTemplate=true&header=Reward+Points+Redeemed
// //     //   `;
// //     console.log(gupshupTemplate);
// //     const url = `https://media.smsgupshup.com/GatewayAPI/rest?userid=${userid}&password=${passwordd}&send_to=${phone_number}&v=1.1&format=json&msg_type=TEXT&method=sendMessage&msg=${gupshupTemplate}`;

// //     //   // Send the request
// //     const response = await axios.get(url);

// //     // Handle success response
// //     if (response.data.response.status === "success") {
// //       console.log("WhatsApp message sent successfully:", response.data);
// //       return {
// //         status: "success",
// //         message: "WhatsApp message sent successfully!",
// //       };
// //     } else {
// //       throw new Error(
// //         response.data.response.details || "Unknown error occurred"
// //       );
// //     }
// //   } catch (error) {
// //     // Handle errors
// //     console.error("Error sending WhatsApp message:", error.message);
// //     return {
// //       status: "error",
// //       message: "Failed to send WhatsApp message.",
// //       error: error.message,
// //     };
// //   }
// // };

// // // Fetch data and call the function
// // const sendNotifications = async () => {
// //   try {
// //     const notificationData = await Notification.findOne({
// //         where: { notification_type: "WhatsApp"}
// //        });
// //        console.log("Notification Data:", notificationData); // Check if this returns the expected document
       
// //      if (!notificationData) {
// //        throw new Error(
// //          "WhatsApp notification settings not found in the Notification table"
// //        );
// //      }
// //      // const { api_key, password } = notificationData;
// //      const { api_key, password } = notificationData || {};
// //     console.log("API Key:", api_key); // Should log the value of api_key
// //     console.log("Password:", password);
// //     const customers = await customer.findOne();
// //     for (const cust of customers) {
// //       const redeemDetails = await redeemSchema.findOne({
// //         account_number: cust.account_number,
// //       });

// //       if (redeemDetails) {
// //         const details = {
// //           phone_number: cust.phone_number,
// //           first_name: cust.first_name,
// //           balance_point: cust.balance_point,
// //           usedPoints: redeemDetails.points,
// //           rewardItem: redeemDetails.productName,
// //           api_key,
// //           password
// //         };
// //         console.log("redeemDetails",redeemDetails);
// //         await sendWhatsAppMessage(details);
// //     }
// //     }
// //   } catch (error) {
// //     console.error("Error fetching data or sending messages:", error.message);
// //   }
// // };
// export const sendWhatsAppMessage = async (redeemDetails) => {
//     try {
//         const { api_key, password, phone_number, first_name, rewardItem, usedPoints,balancePoints } = redeemDetails;
//         const userName = first_name || "Customer";
//     //   const api_key= redeemDetails.api_key;
//     //   console.log("API Key:", api_key); // Check API Key value
//     //   const password= redeemDetails.password;
//     //   console.log("Password:", password); // Check Password value
  
//     //   const phone_number = redeemDetails.phone_number;
//     //   console.log("Phone Number:", phone_number); // Log the phone number
  
//     //   const userName = redeemDetails.first_name || "Customer";
//     //   const rewardItem = redeemDetails.rewardItem || "Reward Item";
//     //   const usedPoints = redeemDetails.usedPoints || 0;
//     //   const balancePoints = redeemDetails.balance_point || 0;
  
//       const gupshupTemplate = `
//           Dear ${userName}, thanks for redeeming ${rewardItem} from the Rajniganda Reward Catalogue! 🎉 
//           You've used ${usedPoints} points, and your current balance is now ${balancePoints}. 
//           Keep earning loyalty points and enjoy more rewards! - Team DS Group
//         `;
//     //   console.log("Message Template:", gupshupTemplate);
  
//       const url = `https://media.smsgupshup.com/GatewayAPI/rest?userid=${api_key}&password=${password}&send_to=${phone_number}&v=1.1&format=json&msg_type=TEXT&method=sendMessage&msg=${encodeURIComponent(gupshupTemplate)}`;
  
//       const response = await axios.get(url);
//     //   console.log(response);
  
//       if (response.data.response.status === "success") {
//         // console.log("WhatsApp message sent successfully:", response.data);
//         return {
//           status: "success",
//           message: "WhatsApp message sent successfully!",
//         };
//       } else {
//         throw new Error(response.data.response.details || "Unknown error occurred");
//       }
//     } catch (error) {
//       console.error("Error sending WhatsApp message:", error.message);
//       return {
//         status: "error",
//         message: "Failed to send WhatsApp message.",
//         error: error.message,
//       };
//     }
//   };
  
//   // Fetch data and call the function
//   const sendNotifications = async () => {
//     try {
//         const { api_key, password } = await getApiCredentials();
//     //   console.log("API Key:", api_key); // Log API Key
//     //   console.log("Password:", password);
  
//       if (!api_key || !password) {
//         throw new Error("API Key or Password are missing.");
//       }
  
//       // Fetch redeem details and proceed
//       const redeemDetailsList = await redeemSchema.findAll();
//     //   console.log("Redeem Details List:", redeemDetailsList);
  
//       if (!redeemDetailsList || redeemDetailsList.length === 0) {
//         // console.log("No redeem details found.");
//         return; // Exit early if no redeem details
//       }
  
//       for (const redeemDetails of redeemDetailsList) {
//         const customerData = await customer.findOne({
//           where: { account_number: redeemDetails.account_number },
//           attributes: ["id", "customer_id", "account_number", "first_name", "email", "phone_number", "earned_point", "redeem_point", "expiry_point"]
//         });
  
//         if (customerData) {
//         //   console.log("Customer Data:", customerData);
  
//           const details = {
//             phone_number: customerData.phone_number,
//             first_name: customerData.first_name,
//             balance_point: customerData.earned_point - customerData.redeem_point - customerData.expiry_point,
//             usedPoints: redeemDetails.points,
//             rewardItem: redeemDetails.product,
//             api_key,
//             password
//           };
  
//         //   console.log("Sending WhatsApp message with details:", details);
  
//           const messageStatus = await sendWhatsAppMessage(details);
//         //   console.log("Message Status:", messageStatus);
//         }
//       }
  
//     } catch (error) {
//       console.error("Error occurred during processing:", error.message); // Log any error that occurs
//     }
//   };
  
//   // Function to fetch API key and password
// const getApiCredentials = async () => {
//     try {
//       const notificationData = await Notification.findOne({
//         where: { notification_type: "WhatsApp" }
//       });
  
//       if (!notificationData) {
//         throw new Error("WhatsApp notification settings not found in the Notification table");
//       }
  
//       const { api_key, password } = notificationData;
      
//       if (!api_key || !password) {
//         throw new Error("API Key or Password are missing.");
//       }
  
//       return { api_key, password };
//     } catch (error) {
//     //   console.error("Error fetching API credentials:", error.message);
//       throw error;  // Re-throw the error for further handling
//     }
//   };
  
  
  

// // Call the function
// sendNotifications();
// getApiCredentials();
