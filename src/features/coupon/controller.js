import {
  responseHandler,
  errorHandler,
  statusMaker,
  apiMessages,
  checkEmptyArray,
  couponSchema,
  customer,
  createTransaction,
  genrateQrcode,
  storeHandler,
  RuleSetModified,
  handleNotifications,
  tier_mangement,
  transition,
  config
} from "./index";

// import { handleNotifications } from "../../helpers/smstemplate";


import csv from "csv-parser";
import fs, { unlinkSync } from "fs";
import path from "path";
import moment from "moment";
import xlsx from "xlsx";
import cron from "node-cron";
import Sequelize from "sequelize";
import { Op, QueryTypes } from "sequelize";
import axios from "axios";
import sequelize from "../../config/db";
import _ from "lodash";
import DeviceDetector from "device-detector-js";

// import { sendWhatsAppMessage } from "../mailTemplate/controller";

// Schedule the cron job to run every day at midnight
// cron.schedule("*/1 * * * *", () => {
//   console.log("Running coupon expiry check every 5 minutes...");
//   expireCoupons();
// });
cron.schedule("2 16 * * *", () => {
  console.log("Running daily coupon expiry check...");
  expireCoupons();
});

// export const startCouponExpiryCron = () => {
//   cron.schedule("0 0 * * *", () => {
//     console.log("Running daily coupon expiry check...");
//     expireCoupons();
//   });
// };

// const expireCoupons = async () => {
//   const currentDate = new Date();

//   try {
//     const expiredCoupons = await couponSchema.findAll({
//       where: {
//         expiryStatus: "Active",
//       },
//     });

//     const couponsToUpdate = expiredCoupons.filter((coupon) => {
//       const [endDay, endMonth, endYear] = coupon.enddate.split("/");
//       const endDate = new Date(`${endYear}-${endMonth}-${endDay}`);

//       return endDate < currentDate;
//     });

//     console.log(`Found ${couponsToUpdate.length} expired coupons to update`);

//     await Promise.all(
//       couponsToUpdate.map(async (coupon) => {
//         await coupon.update({
//           expiryStatus: "Expired",
//           expiryDate: currentDate.toISOString().split("T")[0],
//         });
//       })
//     );

//     console.log("Expired coupons and their statuses updated successfully.");
//   } catch (error) {
//     console.error("Error updating expired coupons:", error.message);
//   }
// };
const expireCoupons = async () => {
  const currentDate = new Date();

  try {
    // Find all active coupons
    const expiredCoupons = await couponSchema.findAll({
      where: {
        status: "Active",
      },
    });

    // Filter coupons that have expired
    const couponsToUpdate = expiredCoupons.filter((coupon) => {
      const [endDay, endMonth, endYear] = coupon.enddate.split("/");
      const endDate = new Date(`${endYear}-${endMonth}-${endDay}`);
      return endDate < currentDate;
    });

    console.log(`Found ${couponsToUpdate.length} expired coupons to process`);

    // Process each expired coupon
    await Promise.all(
      couponsToUpdate.map(async (coupon) => {
        try {       
          await couponSchema.update({
            status: "Expired",
            expiryDate: currentDate.toISOString().split("T")[0],
          },{
            where:{id:coupon.id}
          });
          console.log(
            `Processed expired coupon: ${couponData.sno} - ${couponData.code}`
          );
        } catch (error) {
          console.error(`Error processing coupon ${coupon.sno}:`, error);
          // Continue with other coupons even if one fails
        }
      })
    );

    console.log(
      "Expired coupons processed successfully: moved to expiredSchema and deleted from couponSchema"
    );
  } catch (error) {
    console.error("Error in expireCoupons function:", error.message);
    throw error; // Rethrow to handle in the cron job
  }
};

const convertExcelDate = (excelDate) => {
  if (typeof excelDate === "number") {
    return moment("1899-12-30").add(excelDate, "days");
  }
  return moment(excelDate, ["DD/MM/YYYY", "YYYY-MM-DD"]);
};
function calculateExpiryDate(startDate) {
  const date = moment(startDate);
  if (!date.isValid()) {
    return "Invalid Date";
  }
  date.add(18, "months");
  return date.format("DD/MM/YYYY");
}

////////////////chlta hua code aajka
// export const couponImport = async (req, res) => {
//   const { store } = req.body;
//   const file = req.file;
//   const BATCH_SIZE = 5000;
//   let transaction;
//   let isCommitted = false;
//   let totalSheetRecords = 0;  // Flag to track if the transaction is committed

//   if (!file) {
//     return res.status(400).json({ message: "No file uploaded" });
//   }

//   const filePath = path.resolve(file.path);

//   try {
//     transaction = await sequelize.transaction();

//     // Process store before handling file
//     const processedStore = await storeHandler(store);

//     // Get a new batch ID
//     const currentBatchId = ((await couponSchema.max("couponBatchId", { transaction })) || 0) + 1;

//     const processRow = async (row) => {
//       try {
//         const startDate = convertExcelDate(row["startDate"] || row["stdate"]);
//         const endDate = convertExcelDate(row["endDate"] || row["enddate"]);
//         const qrCode = await genrateQrcode(row["serialNo"], row["code"]);
//         const expiryDate = calculateExpiryDate(startDate);
//         const QRCodes = `https://demo.rajnigandha.com/account?value=EarnPoints/${row["serialNo"]}/${row["code"]}`;

//         return {
//           sno: row["serialNo"],
//           couponBatchId: currentBatchId,
//           code: row["code"],
//           QRcode: qrCode,
//           points: row["rewardPoint"],
//           stdate: startDate.format("DD/MM/YYYY"),
//           enddate: endDate.format("DD/MM/YYYY"),
//           account_number: row["customerid"],
//           cstatus: row["cstatus"],
//           product: row["Product Name"],
//           source_id: row["source_id"],
//           store: processedStore,
//           expiryDate,
//           productSKU: row["Product SKU"],
//           QRCodes,
//           noOfCoupon: 0,
//           description: row["description"],
//           startTime: row["startTime"],
//           endTime: row["endTime"],
//         };
//       } catch (error) {
//         console.error(`Error processing row: ${error.message}`);
//         throw error;
//       }
//     };

//     const saveBatch = async (batch) => {
//       try {
//         // Create a set of `sno` and `code` combinations to check for duplicates
//         const existingSNOsAndcodes = batch.map(record => ({
//           sno: record.sno,
//           code: record.code
//         }));

//         // Check for duplicates in the database
//         const existingRecords = await couponSchema.findAll({
//           where: {
//             [Sequelize.Op.or]: existingSNOsAndcodes.map(record => ({
//               [Sequelize.Op.and]: [
//                 { sno: record.sno },
//                 { code: record.code }
//               ]
//             }))
//           },
//           transaction
//         });

//         if (existingRecords.length > 0) {
//           // Gather duplicates into a list to send in the error message
//           const duplicates = existingRecords.map(record => ({
//             sno: record.sno,
//             code: record.code
//           }));

//           // Throw error with duplicate details
//           return res.status(400).json({
//             message: `Duplicate serial numbers found in the uploaded sheet: ${JSON.stringify(duplicates)}`,
//             duplicates: duplicates.map((dup) => ({
//               sno: dup.sno,
//               code: dup.code
//             })),
//           });
//         }

//         // If no duplicates found, proceed to insert the batch
//         await couponSchema.bulkCreate(batch, {
//           transaction,
//           logging: false
//         });

//       } catch (error) {
//         console.error(`Error saving batch: ${error.message}`);
//         throw error;
//       }
//     };

//     if (file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
//       const workbook = xlsx.readFile(filePath);
//       const sheet = workbook.Sheets[workbook.SheetNames[0]];
//       const jsonData = xlsx.utils.sheet_to_json(sheet);
//       totalSheetRecords = jsonData.length;
//       let totalProcessed = 0;

//       for (let i = 0; i < jsonData.length; i += BATCH_SIZE) {
//         const batch = jsonData.slice(i, i + BATCH_SIZE);
//         const processedBatch = await Promise.all(
//           batch.map(row => processRow(row).catch(error => {
//             console.error(`Error processing row: ${error.message}`);
//             return null;
//           }))
//         );

//         const validRecords = processedBatch.filter(record => record !== null);

//         if (validRecords.length > 0) {
//           // Check for duplicates and save batch
//           await saveBatch(validRecords);
//           totalProcessed += validRecords.length;
//         }

//         const progress = Math.round((i + batch.length) / jsonData.length * 100);
//         console.log(`Processing progress: ${progress}%`);
//       }

//       await couponSchema.update(
//         { noOfCoupon: totalProcessed },
//         {
//           where: { couponBatchId: currentBatchId },
//           transaction
//         }
//       );

//     } else {
//       let totalRecords = 0;
//       let currentBatch = [];

//       await new Promise((resolve, reject) => {
//         fs.createReadStream(filePath)
//           .pipe(csv())
//           .on("data", async (row) => {
//             try {
//               const processedRow = await processRow(row);
//               if (processedRow) {
//                 currentBatch.push(processedRow);

//                 if (currentBatch.length >= BATCH_SIZE) {
//                   // Check for duplicates and save the batch
//                   await saveBatch(currentBatch);
//                   totalRecords += currentBatch.length;
//                   console.log(`Processed ${totalRecords} records`);
//                   currentBatch = [];
//                 }
//               }
//             } catch (error) {
//               console.error(`Error processing CSV row: ${error.message}`);
//             }
//           })
//           .on("end", async () => {
//             try {
//               if (currentBatch.length > 0) {
//                 // Check for duplicates and save final batch
//                 await saveBatch(currentBatch);
//                 totalRecords += currentBatch.length;
//               }

//               await couponSchema.update(
//                 { noOfCoupon: totalRecords },
//                 {
//                   where: { couponBatchId: currentBatchId },
//                   transaction
//                 }
//               );

//               resolve();
//             } catch (error) {
//               reject(error);
//             }
//           })
//           .on("error", reject);
//       });
//     }

//     await transaction.commit();
//     isCommitted = true;  // Set the flag after commit

//     await fs.promises.unlink(filePath).catch(err =>
//       console.error("Error deleting temporary file:", err)
//     );
//     if (!res.headersSent) {
//       const response = responseHandler(
//         statusMaker.created,
//         "Coupons imported successfully",
//         {
//           totalSheetRecords,
//           batchId: currentBatchId,
//         }
//       );

//       return res.status(statusMaker.created).json(response);
//     }

//     // Ensure this response is sent only once
//     // if (!res.headersSent) {
//     //   return res.status(200).json({
//     //     message: "Coupons imported successfully",
//     //     totalSheetRecords,
//     //     batchId: currentBatchId
//     //   });
//     // }

//   } catch (error) {
//     if (!isCommitted) {  // Only rollback if transaction hasn't been committed
//       await transaction.rollback();
//     }

//     console.error("Error during coupon import:", error);

//     await fs.promises.unlink(filePath).catch(err =>
//       console.error("Error deleting temporary file:", err)
//     );

//     // Ensure this error response is sent only once
//     if (!res.headersSent) {
//       return res.status(500).json({
//         status: "error",
//         message: error.message || "Error during coupon import"
//       });
//     }
//   }
// };
////////////////////////chlta hua code aajka

// export const couponImport = async (req, res) => {
//   const { store } = req.body;
//   const file = req.file;
//   const BATCH_SIZE = 10000;
//   let transaction;
//   let isCommitted = false;
//   let totalSheetRecords = 0;

//   if (!file) {
//     return res.status(400).json({ message: "No file uploaded" });
//   }

//   const filePath = path.resolve(file.path);

//   // Improved duplicate check function for sheet
//   const checkDuplicatesInSheet = (data) => {
//     const seen = new Set();
//     const duplicates = [];

//     for (const row of data) {
//       const serialNo = row.serialNo;
//       const code = row.code;

//       if (seen.has(serialNo)) {
//         duplicates.push({
//           sno: serialNo,
//           code: code
//         });
//       }
//       seen.add(serialNo);
//     }
//     return duplicates;
//   };

//   try {
//     transaction = await sequelize.transaction();
//     const processedStore = await storeHandler(store);
//     const currentBatchId = ((await couponSchema.max("couponBatchId", { transaction })) || 0) + 1;

//     const processRow = async (row) => {
//       try {
//         const startDate = convertExcelDate(row.startDate);
//         const endDate = convertExcelDate(row.endDate);
//         const qrCode = await genrateQrcode(row.serialNo, row.code);
//         const expiryDate = calculateExpiryDate(startDate);
//         const QRCodes = `https://demo.rajnigandha.com/account?value=EarnPoints/${row.serialNo}/${row.code}`;

//         return {
//           sno: row.serialNo,
//           couponBatchId: currentBatchId,
//           code: row.code,
//           QRcode: qrCode,
//           points: row.rewardPoint,
//           stdate: startDate.format("DD/MM/YYYY"),
//           enddate: endDate.format("DD/MM/YYYY"),
//           account_number: row.customerid,
//           cstatus: row.cstatus,
//           product: row["Product Name"],
//           source_id: row.source_id,
//           store: processedStore,
//           expiryDate,
//           productSKU: row["Product SKU"],
//           QRCodes,
//           noOfCoupon: 0,
//           description: row.description,
//           startTime: row.startTime,
//           endTime: row.endTime,
//         };
//       } catch (error) {
//         console.error(`Error processing row: ${error.message}`);
//         throw error;
//       }
//     };

//     const checkDatabaseDuplicates = async (records) => {
//       const validRecords = records.map(record => ({
//         sno: record.serialNo,
//         code: record.code
//       }));

//       if (validRecords.length === 0) {
//         throw new Error("No valid records found in sheet");
//       }

//       const existingRecords = await couponSchema.findAll({
//         where: {
//           [Sequelize.Op.or]: validRecords.map(record => ({
//             [Sequelize.Op.and]: [
//               { sno: record.sno },
//               { code: record.code }
//             ]
//           }))
//         },
//         transaction
//       });

//       return existingRecords.map(record => ({
//         sno: record.sno,
//         code: record.code
//       }));
//     };

//     if (file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
//       const workbook = xlsx.readFile(filePath);
//       const sheet = workbook.Sheets[workbook.SheetNames[0]];
//       const jsonData = xlsx.utils.sheet_to_json(sheet);

//       console.log("Total records in sheet:", jsonData.length);
//       totalSheetRecords = jsonData.length;

//       // First check: Sheet duplicates
//       const sheetDuplicates = checkDuplicatesInSheet(jsonData);
//       if (sheetDuplicates.length > 0) {
//         await fs.promises.unlink(filePath).catch(err =>
//           console.error("Error deleting temporary file:", err)
//         );
//         return res.status(400).json({
//           status: "error",
//           message: `Found ${sheetDuplicates.length} duplicate serial numbers in uploaded sheet`,
//           duplicates: sheetDuplicates
//         });
//       }

//       // Second check: Database duplicates
//       try {
//         const dbDuplicates = await checkDatabaseDuplicates(jsonData);
//         if (dbDuplicates.length > 0) {
//           await fs.promises.unlink(filePath).catch(err =>
//             console.error("Error deleting temporary file:", err)
//           );
//           return res.status(400).json({
//             status: "error",
//             message: "Entries already exist in database",
//             duplicates: dbDuplicates
//           });
//         }
//       } catch (error) {
//         await fs.promises.unlink(filePath);
//         return res.status(400).json({
//           status: "error",
//           message: error.message
//         });
//       }

//       let totalProcessed = 0;
//       for (let i = 0; i < jsonData.length; i += BATCH_SIZE) {
//         const batch = jsonData.slice(i, i + BATCH_SIZE);
//         const processedBatch = await Promise.all(
//           batch.map(row => processRow(row))
//         );

//         await couponSchema.bulkCreate(processedBatch, {
//           transaction,
//           logging: false
//         });

//         totalProcessed += processedBatch.length;
//         console.log(`Processed ${totalProcessed}/${jsonData.length} records`);
//       }

//       await couponSchema.update(
//         { noOfCoupon: totalProcessed },
//         {
//           where: { couponBatchId: currentBatchId },
//           transaction
//         }
//       );
//     } else {
//       // For CSV files
//       const csvData = [];
//       await new Promise((resolve, reject) => {
//         fs.createReadStream(filePath)
//           .pipe(csv())
//           .on('data', (row) => csvData.push(row))
//           .on('end', resolve)
//           .on('error', reject);
//       });

//       // First check: Sheet duplicates
//       const sheetDuplicates = checkDuplicatesInSheet(csvData);
//       if (sheetDuplicates.length > 0) {
//         await fs.promises.unlink(filePath).catch(err =>
//           console.error("Error deleting temporary file:", err)
//         );
//         return res.status(400).json({
//           status: "error",
//           message: `Found ${sheetDuplicates.length} duplicate serial numbers in uploaded sheet`,
//           duplicates: sheetDuplicates
//         });
//       }

//       // Second check: Database duplicates
//       try {
//         const dbDuplicates = await checkDatabaseDuplicates(csvData);
//         if (dbDuplicates.length > 0) {
//           await fs.promises.unlink(filePath).catch(err =>
//             console.error("Error deleting temporary file:", err)
//           );
//           return res.status(400).json({
//             status: "error",
//             message: "Entries already exist in database",
//             duplicates: dbDuplicates
//           });
//         }
//       } catch (error) {
//         await fs.promises.unlink(filePath);
//         return res.status(400).json({
//           status: "error",
//           message: error.message
//         });
//       }

//       let totalRecords = 0;
//       for (let i = 0; i < csvData.length; i += BATCH_SIZE) {
//         const batch = csvData.slice(i, i + BATCH_SIZE);
//         const processedBatch = await Promise.all(
//           batch.map(row => processRow(row))
//         );

//         await couponSchema.bulkCreate(processedBatch, {
//           transaction,
//           logging: false
//         });

//         totalRecords += processedBatch.length;
//         console.log(`Processed ${totalRecords}/${csvData.length} records`);
//       }

//       await couponSchema.update(
//         { noOfCoupon: totalRecords },
//         {
//           where: { couponBatchId: currentBatchId },
//           transaction
//         }
//       );
//     }

//     await transaction.commit();
//     isCommitted = true;

//     await fs.promises.unlink(filePath).catch(err =>
//       console.error("Error deleting temporary file:", err)
//     );

//     return res.status(statusMaker.created).json(
//       responseHandler(statusMaker.created, "Coupons imported successfully", {
//         totalRecords: totalSheetRecords,
//         batchId: currentBatchId
//       })
//     );

//   } catch (error) {
//     if (!isCommitted) {
//       await transaction.rollback();
//     }

//     console.error("Error during coupon import:", error);
//     await fs.promises.unlink(filePath).catch(err =>
//       console.error("Error deleting temporary file:", err)
//     );

//     return res.status(500).json({
//       status: "error",
//       message: error.message || "Error during coupon import"
//     });
//   }
// };

// export const couponImport = async (req, res) => {
//   const { store } = req.body;
//   const file = req.file;
//   const CHUNK_SIZE = 50000;
//   let transaction;
//   let isCommitted = false;
//   let totalSheetRecords = 0;

//   if (!file) {
//     return res.status(400).json({ message: "No file uploaded" });
//   }

//   const filePath = path.resolve(file.path);

//   // Enhanced duplicate checker that checks both serialNo and code
//   const checkDuplicatesInSheet = (sheetData) => {
//     const _ = require('lodash');

//     // Initialize arrays to store duplicates
//     const duplicateSerialNumbers = [];
//     const duplicateCodes = [];

//     // Group by serial numbers to find duplicates
//     const serialGroups = _.groupBy(sheetData, 'serialNo');
//     Object.entries(serialGroups).forEach(([serialNo, group]) => {
//       if (group.length > 1) {
//         duplicateSerialNumbers.push({
//           value: serialNo,
//           count: group.length,
//           rows: group.map(item => ({
//             rowIndex: item.rowIndex,
//             serialNo: item.serialNo

//           }))
//         });
//       }
//     });

//     // Group by codes to find duplicates
//     const codeGroups = _.groupBy(sheetData, 'code');
//     Object.entries(codeGroups).forEach(([code, group]) => {
//       if (group.length > 1) {
//         duplicateCodes.push({
//           value: code,
//           count: group.length,
//           rows: group.map(item => ({
//             rowIndex: item.rowIndex,
//             code: item.code
//           }))
//         });
//       }
//     });

//     return {
//       hasDuplicates: duplicateSerialNumbers.length > 0 || duplicateCodes.length > 0,
//       serialNumbers: duplicateSerialNumbers,
//       codes: duplicateCodes,
//       totalDuplicates: duplicateSerialNumbers.length + duplicateCodes.length
//     };
//   };

//   const checkDatabaseDuplicates = async (records) => {
//     const validRecords = records.map(record => ({
//       sno: record.serialNo,
//       code: record.code
//     }));

//     if (validRecords.length === 0) {
//       throw new Error("No valid records found in sheet");
//     }

//     const existingRecords = await couponSchema.findAll({
//       where: {
//         [Sequelize.Op.or]: validRecords.map(record => ({
//           [Sequelize.Op.and]: [
//             { sno: record.sno },
//             { code: record.code }
//           ]
//         }))
//       },
//       transaction
//     });

//     return existingRecords.map(record => ({
//       sno: record.sno,
//       code: record.code
//     }));
//   };

//   try {
//     transaction = await sequelize.transaction();
//     const processedStore = await storeHandler(store);
//     const currentBatchId = ((await couponSchema.max("couponBatchId", { transaction })) || 0) + 1;

//     const processRow = async (row) => {
//       try {
//         const startDate = convertExcelDate(row.startDate);
//         const endDate = convertExcelDate(row.endDate);
//         const qrCode = await genrateQrcode(row.serialNo, row.code);
//         const expiryDate = calculateExpiryDate(startDate);
//         const QRCodes = `https://demo.rajnigandha.com/account?value=EarnPoints/${row.serialNo}/${row.code}`;

//         return {
//           sno: row.serialNo,
//           couponBatchId: currentBatchId,
//           code: row.code,
//           QRcode: qrCode,
//           points: row.rewardPoint,
//           stdate: startDate.format("DD/MM/YYYY"),
//           enddate: endDate.format("DD/MM/YYYY"),
//           account_number: row.customerid,
//           cstatus: row.cstatus,
//           product: row["Product Name"],
//           source_id: row.source_id,
//           store: processedStore,
//           expiryDate,
//           productSKU: row["Product SKU"],
//           QRCodes,
//           noOfCoupon: 0,
//           description: row.description,
//           startTime: row.startTime,
//           endTime: row.endTime,
//         };
//       } catch (error) {
//         console.error(`Error processing row: ${error.message}`);
//         throw error;
//       }
//     };

//     let dataToProcess = [];

//     if (file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
//       const workbook = xlsx.readFile(filePath);
//       const sheet = workbook.Sheets[workbook.SheetNames[0]];
//       const jsonData = xlsx.utils.sheet_to_json(sheet);

//       console.log("Total records in sheet:", jsonData.length);
//       totalSheetRecords = jsonData.length;

//       // Add row indices to the data
//       dataToProcess = jsonData.map((row, index) => ({
//         ...row,
//         rowIndex: index + 2  // Adding 2 because Excel rows start from 1 and we have header
//       }));
//     } else {
//       // For CSV files
//       const csvData = [];
//       await new Promise((resolve, reject) => {
//         fs.createReadStream(filePath)
//           .pipe(csv())
//           .on('data', (row) => csvData.push(row))
//           .on('end', resolve)
//           .on('error', reject);
//       });

//       totalSheetRecords = csvData.length;

//       // Add row indices to the data
//       dataToProcess = csvData.map((row, index) => ({
//         ...row,
//         rowIndex: index + 2
//       }));
//     }

//     // Check for duplicates in the sheet
//     const duplicateResults = checkDuplicatesInSheet(dataToProcess);
//     if (duplicateResults.hasDuplicates) {
//       await fs.promises.unlink(filePath).catch(err =>
//         console.error("Error deleting temporary file:", err)
//       );

//       return res.status(400).json({
//         status: "error",
//         message: `Found ${duplicateResults.totalDuplicates} duplicates (${duplicateResults.serialNumbers.length} serial numbers, ${duplicateResults.codes.length} codes)`,
//         duplicates: duplicateResults
//       });
//     }

//     // Check for duplicates in the database
//     try {
//       const dbDuplicates = await checkDatabaseDuplicates(dataToProcess);
//       if (dbDuplicates.length > 0) {
//         await fs.promises.unlink(filePath).catch(err =>
//           console.error("Error deleting temporary file:", err)
//         );
//         return res.status(400).json({
//           status: "error",
//           message: "Entries already exist in database",
//           duplicates: dbDuplicates
//         });
//       }
//     } catch (error) {
//       await fs.promises.unlink(filePath);
//       return res.status(400).json({
//         status: "error",
//         message: error.message
//       });
//     }

//     // Process in chunks
//     let totalProcessed = 0;
//     for (let i = 0; i < dataToProcess.length; i += CHUNK_SIZE) {
//       const chunk = dataToProcess.slice(i, i + CHUNK_SIZE);
//       const processedChunk = await Promise.all(
//         chunk.map(row => processRow(row))
//       );

//       await couponSchema.bulkCreate(processedChunk, {
//         transaction,
//         logging: false
//       });

//       totalProcessed += processedChunk.length;
//       console.log(`Processed ${totalProcessed}/${dataToProcess.length} records`);
//     }

//     await couponSchema.update(
//       { noOfCoupon: totalProcessed },
//       {
//         where: { couponBatchId: currentBatchId },
//         transaction
//       }
//     );

//     await transaction.commit();
//     isCommitted = true;

//     await fs.promises.unlink(filePath).catch(err =>
//       console.error("Error deleting temporary file:", err)
//     );

//     return res.status(statusMaker.created).json(
//       responseHandler(statusMaker.created, "Coupons imported successfully", {
//         totalRecords: totalSheetRecords,
//         batchId: currentBatchId
//       })
//     );

//   } catch (error) {
//     if (!isCommitted) {
//       await transaction.rollback();
//     }

//     console.error("Error during coupon import:", error);
//     await fs.promises.unlink(filePath).catch(err =>
//       console.error("Error deleting temporary file:", err)
//     );

//     return res.status(500).json({
//       status: "error",
//       message: error.message || "Error during coupon import"
//     });
//   }
// };

// export const couponImport = async (req, res) => {
//   const { store } = req.body;
//   const file = req.file;
//   const CHUNK_SIZE = 500; // Optimized chunk size for MSSQL
//   let transaction;
//   let isCommitted = false;
//   let totalSheetRecords = 0;

//   if (!file) {
//     return res.status(400).json({ message: "No file uploaded" });
//   }

//   const filePath = path.resolve(file.path);

//   // Optimized duplicate checker using Set for better performance
//   const checkDuplicatesInSheet = (sheetData) => {
//     const serialSet = new Set();
//     const codeSet = new Set();
//     const duplicateSerialNumbers = [];
//     const duplicateCodes = [];

//     sheetData.forEach((row, index) => {
//       if (serialSet.has(row.serialNo)) {
//         duplicateSerialNumbers.push({
//           value: row.serialNo,
//           rowIndex: index + 1,
//           code: row.code
//         });
//       } else {
//         serialSet.add(row.serialNo);
//       }

//       if (codeSet.has(row.code)) {
//         duplicateCodes.push({
//           value: row.code,
//           rowIndex: index + 1,
//           serialNo: row.serialNo
//         });
//       } else {
//         codeSet.add(row.code);
//       }
//     });

//     return {
//       hasDuplicates: duplicateSerialNumbers.length > 0 || duplicateCodes.length > 0,
//       serialNumbers: duplicateSerialNumbers,
//       codes: duplicateCodes,
//       totalDuplicates: duplicateSerialNumbers.length + duplicateCodes.length
//     };
//   };

//   // Optimized database duplicate checker
//   const checkDatabaseDuplicates = async (records, batchSize = 1000) => {
//     const validRecords = records
//       .filter(record => record.serialNo && record.code)
//       .map(record => ({
//         sno: String(record.serialNo).trim(),
//         code: String(record.code).trim()
//       }));

//     if (validRecords.length === 0) {
//       throw new Error("No valid records found in sheet");
//     }

//     // Check duplicates in batches to prevent memory issues
//     const existingRecords = [];
//     for (let i = 0; i < validRecords.length; i += batchSize) {
//       const batch = validRecords.slice(i, i + batchSize);
//       const batchResults = await couponSchema.findAll({
//         where: {
//           [Sequelize.Op.or]: batch.map(record => ({
//             [Sequelize.Op.and]: [
//               { sno: record.sno },
//               { code: record.code }
//             ]
//           }))
//         },
//         transaction,
//         raw: true // For faster querying
//       });
//       existingRecords.push(...batchResults);
//     }

//     return existingRecords.map(record => ({
//       sno: record.sno,
//       code: record.code
//     }));
//   };

//   try {
//     transaction = await sequelize.transaction();
//     const processedStore = await storeHandler(store);
//     const currentBatchId = ((await couponSchema.max("couponBatchId", { transaction })) || 0) + 1;

//     // Optimized row processor
//     const processRow = (row) => ({
//       sno: String(row.serialNo).trim(),
//       couponBatchId: currentBatchId,
//       code: String(row.code).trim(),
//       QRcode: `https://demo.rajnigandha.com/qr/${row.serialNo}/${row.code}`, // Simplified QR generation
//       points: row.rewardPoint,
//       stdate: convertExcelDate(row.startDate).format("DD/MM/YYYY"),
//       enddate: convertExcelDate(row.endDate).format("DD/MM/YYYY"),
//       account_number: row.customerid,
//       cstatus: row.cstatus,
//       product: row["Product Name"],
//       source_id: row.source_id,
//       store: processedStore,
//       expiryDate: calculateExpiryDate(convertExcelDate(row.startDate)),
//       productSKU: row["Product SKU"],
//       QRCodes: `https://demo.rajnigandha.com/account?value=EarnPoints/${row.serialNo}/${row.code}`,
//       noOfCoupon: 0,
//       description: row.description,
//       startTime: row.startTime,
//       endTime: row.endTime,
//     });

//     let rawData = [];

//     // Optimized file reading
//     if (file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
//       const workbook = xlsx.readFile(filePath, {
//         cellDates: true,
//         cellNF: false,
//         cellText: false
//       });
//       const sheet = workbook.Sheets[workbook.SheetNames[0]];
//       rawData = xlsx.utils.sheet_to_json(sheet, {
//         raw: true,
//         defval: null,
//         blankrows: false
//       });
//     } else {
//       rawData = await new Promise((resolve, reject) => {
//         const csvData = [];
//         fs.createReadStream(filePath)
//           .pipe(csv({
//             skipEmptyLines: true,
//             trim: true
//           }))
//           .on('data', (row) => csvData.push(row))
//           .on('end', () => resolve(csvData))
//           .on('error', reject);
//       });
//     }

//     console.log("Total records in sheet:", rawData.length);
//     totalSheetRecords = rawData.length;

//     if (rawData.length === 0) {
//       await fs.promises.unlink(filePath);
//       return res.status(400).json({
//         status: "error",
//         message: "No data found in uploaded file"
//       });
//     }

//     // Transform data efficiently
//     const dataToProcess = rawData.map((row, index) => ({
//       ...row,
//       rowIndex: index + 1,
//       serialNo: row.serialNo?.toString().trim(),
//       code: row.code?.toString().trim()
//     }));

//     // Quick validation for required fields
//     const invalidRows = dataToProcess.filter(row => !row.serialNo || !row.code);
//     if (invalidRows.length > 0) {
//       await fs.promises.unlink(filePath);
//       return res.status(400).json({
//         status: "error",
//         message: "Found rows with missing required fields",
//         invalidRows: invalidRows.slice(0, 10) // Only return first 10 invalid rows
//       });
//     }

//     // Optimized processing in smaller chunks
//     let totalProcessed = 0;
//     for (let i = 0; i < dataToProcess.length; i += CHUNK_SIZE) {
//       const chunk = dataToProcess.slice(i, i + CHUNK_SIZE);
//       const processedChunk = chunk.map(processRow); // Removed Promise.all since processRow is now synchronous

//       await couponSchema.bulkCreate(processedChunk, {
//         transaction,
//         logging: false
//       });

//       totalProcessed += processedChunk.length;
//       console.log(`Processed ${totalProcessed}/${dataToProcess.length} records`);
//     }

//     // Update batch count
//     await couponSchema.update(
//       { noOfCoupon: totalProcessed },
//       {
//         where: { couponBatchId: currentBatchId },
//         transaction
//       }
//     );

//     await transaction.commit();
//     isCommitted = true;

//     // Cleanup
//     await fs.promises.unlink(filePath);

//     return res.status(statusMaker.created).json(
//       responseHandler(statusMaker.created, "Coupons imported successfully", {
//         totalRecords: totalSheetRecords,
//         batchId: currentBatchId
//       })
//     );

//   } catch (error) {
//     if (!isCommitted) {
//       await transaction.rollback();
//     }

//     console.error("Error during coupon import:", error);
//     await fs.promises.unlink(filePath).catch(err =>
//       console.error("Error deleting temporary file:", err)
//     );

//     return res.status(500).json({
//       status: "error",
//       message: error.message || "Error during coupon import"
//     });
//   }
// };

// export const couponImport = async (req, res) => {
//   const { store } = req.body;
//   const file = req.file;
//   const CHUNK_SIZE = 1000;
//   let transaction = null;

//   if (!file) {
//     return res.status(400).json({ message: "No file uploaded" });
//   }

//   if (file.mimetype !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
//     return res.status(400).json({ message: "Please upload only Excel (.xlsx) files" });
//   }

//   const filePath = path.resolve(file.path);

//   try {
//     transaction = await sequelize.transaction({
//       autocommit: false
//     });

//     const processedStore = await storeHandler(store);
//     const currentBatchId = ((await couponSchema.max("couponBatchId", { transaction })) || 0) + 1;

//     // Updated Excel reading configuration for 50,000 rows
//     const workbook = xlsx.readFile(filePath, {
//       cellDates: true,
//       cellNF: false,
//       cellText: false,
//       sheetRows: 30001  // Changed to 50,001 to allow 50,000 rows plus header
//     });

//     if (!workbook.SheetNames.length) {
//       throw new Error("Excel file contains no sheets");
//     }

//     const sheet = workbook.Sheets[workbook.SheetNames[0]];
//     const rawData = xlsx.utils.sheet_to_json(sheet, {
//       raw: true,
//       defval: null,
//       blankrows: false
//     });

//     const totalSheetRecords = rawData.length;
//     console.log("Total records in sheet:", totalSheetRecords);

//     if (totalSheetRecords === 0) {
//       throw new Error("No data found in uploaded file");
//     }

//     // Updated maximum records check
//     if (totalSheetRecords > 30000) {
//       throw new Error("Maximum 50,000 records allowed per upload");
//     }

//     // Rest of the code remains the same...
//     // Validate required columns
//     const requiredColumns = ['serialNo', 'code', 'startDate', 'endDate', 'rewardPoint'];
//     const firstRow = rawData[0];
//     const missingColumns = requiredColumns.filter(col => !(col in firstRow));

//     if (missingColumns.length > 0) {
//       throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
//     }

//     // Check for duplicates
//     const serialNoMap = new Map();
//     const codeMap = new Map();
//     const invalidRows = [];

//     rawData.forEach((row, index) => {
//       const serialNo = String(row.serialNo).trim();
//       const code = String(row.code).trim();

//       if (!serialNo || !code) {
//         invalidRows.push({
//           rowNumber: index + 2,
//           serialNo,
//           code,
//           reason: "Missing required fields"
//         });
//         return;
//       }

//       if (serialNoMap.has(serialNo)) {
//         invalidRows.push({
//           rowNumber: index + 2,
//           serialNo,
//           code,
//           reason: `Duplicate Serial Number - Also appears in row ${serialNoMap.get(serialNo)}`
//         });
//       } else {
//         serialNoMap.set(serialNo, index + 2);
//       }

//       if (codeMap.has(code)) {
//         invalidRows.push({
//           rowNumber: index + 2,
//           serialNo,
//           code,
//           reason: `Duplicate Code - Also appears in row ${codeMap.get(code)}`
//         });
//       } else {
//         codeMap.set(code, index + 2);
//       }
//     });

//     if (invalidRows.length > 0) {
//       const error = new Error("Validation failed");
//       error.details = {
//         message: `Found ${invalidRows.length} invalid or duplicate entries`,
//         invalidRows: invalidRows.slice(0, 20),
//         totalIssues: invalidRows.length
//       };
//       throw error;
//     }

//     // Database duplicate check
//     const dbDuplicates = [];
//     const serialNos = Array.from(serialNoMap.keys());
//     const codes = Array.from(codeMap.keys());

//     for (let i = 0; i < serialNos.length; i += CHUNK_SIZE) {
//       const serialNoChunk = serialNos.slice(i, i + CHUNK_SIZE);
//       const codeChunk = codes.slice(i, i + CHUNK_SIZE);

//       const duplicates = await couponSchema.findAll({
//         where: {
//           [Sequelize.Op.or]: [
//             { sno: { [Sequelize.Op.in]: serialNoChunk } },
//             { code: { [Sequelize.Op.in]: codeChunk } }
//           ]
//         },
//         attributes: ['sno', 'code'],
//         raw: true,
//         transaction
//       });

//       duplicates.forEach(dup => {
//         const rowNum = serialNoMap.get(dup.sno) || codeMap.get(dup.code);
//         dbDuplicates.push({
//           rowNumber: rowNum,
//           serialNo: dup.sno,
//           code: dup.code,
//           reason: 'Already exists in database'
//         });
//       });
//     }

//     if (dbDuplicates.length > 0) {
//       const error = new Error("Database duplicates found");
//       error.details = {
//         message: `Found ${dbDuplicates.length} entries that already exist in database`,
//         duplicates: dbDuplicates.slice(0, 20),
//         totalDuplicates: dbDuplicates.length
//       };
//       throw error;
//     }

//     // Process records in chunks
//     let totalProcessed = 0;
//     for (let i = 0; i < rawData.length; i += CHUNK_SIZE) {
//       const chunk = rawData.slice(i, i + CHUNK_SIZE);
//       const processedChunk = chunk.map(row => ({
//         sno: String(row.serialNo).trim(),
//         couponBatchId: currentBatchId,
//         code: String(row.code).trim(),
//         QRcode: `https://demo.rajnigandha.com/qr/${row.serialNo}/${row.code}`,
//         points: row.rewardPoint,
//         stdate: convertExcelDate(row.startDate).format("DD/MM/YYYY"),
//         enddate: convertExcelDate(row.endDate).format("DD/MM/YYYY"),
//         account_number: row.customerid || null,
//         cstatus: 1, // Set as integer instead of string
//         product: row["Product Name"] || null,
//         source_id: row.source_id || null,
//         store: processedStore,
//         expiryDate: calculateExpiryDate(convertExcelDate(row.startDate)),
//         productSKU: row["Product SKU"] || null,
//         QRCodes: `https://demo.rajnigandha.com/account?value=EarnPoints/${row.serialNo}/${row.code}`,
//         noOfCoupon: 0,
//         description: row.description || null,
//         startTime: row.startTime || null,
//         endTime: row.endTime || null,
//         expiryStatus: "Active",
//         source_of_device: "rajnigandha",
//         couponAccessed: "desktop",
//         source: "website",
//         createdBy: "superadmin",
//       }));

//       await couponSchema.bulkCreate(processedChunk, {
//         transaction,
//         logging: false
//       });

//       totalProcessed += processedChunk.length;
//       console.log(`Processed ${totalProcessed}/${rawData.length} records`);
//     }

//     // Update batch count
//     await couponSchema.update(
//       { noOfCoupon: totalProcessed },
//       {
//         where: { couponBatchId: currentBatchId },
//         transaction
//       }
//     );

//     await transaction.commit();

//     // Cleanup
//     await fs.promises.unlink(filePath).catch(err => {
//       console.error("Error deleting file:", err);
//     });

// return res.status(statusMaker.created).json(
//   responseHandler(statusMaker.created, "Coupons imported successfully", {
//     totalRecords: totalSheetRecords,
//     batchId: currentBatchId
//   })
// );

//   } catch (error) {
//     console.error("Error during coupon import:", error);

//     if (transaction) {
//       try {
//         await transaction.rollback();
//       } catch (rollbackError) {
//         console.error("Rollback failed:", rollbackError);
//       }
//     }

//     try {
//       await fs.promises.unlink(filePath);
//     } catch (unlinkError) {
//       console.error("Error deleting temporary file:", unlinkError);
//     }

//     const errorResponse = {
//       status: "error",
//       message: error.message || "Error during coupon import"
//     };

//     if (error.details) {
//       Object.assign(errorResponse, error.details);
//     }

//     return res.status(500).json(errorResponse);
//   }
// };

export const checkCouponDuplicates = async (req, res) => {
  const file = req.file;
  const CHUNK_SIZE = 1000;
  if (!file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  const filePath = path.resolve(file.path);
  if (
    file.mimetype !==
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    unlinkSync(filePath);
    return res
      .status(400)
      .json({ message: "Please upload only Excel (.xlsx) files" });
  }
  try {
    const workbook = xlsx.readFile(filePath, {
      cellDates: true,
      cellNF: false,
      cellText: false,
    });
    if (!workbook.SheetNames.length) {
      unlinkSync(filePath);
      throw new Error("Excel file contains no sheets");
    }
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = xlsx.utils.sheet_to_json(sheet, {
      raw: true,
      defval: null,
      blankrows: false,
    });
    // console.log("Raw Data :::>>", rawData);
    const totalSheetRecords = rawData.length;
    console.log("Total records in sheet:", totalSheetRecords);
    if (totalSheetRecords === 0) {
      throw new Error("No data found in uploaded file");
    }
    if (totalSheetRecords > 50000) {
      unlinkSync(filePath);
      return res.status(403).json({
        success:false,
        limitExceed:true,
        message:'Maximum 50,000 records allowed per upload'
      });
    }
    const requiredColumns = [
      "serialNo",
      "code",
      "startDate",
      "endDate",
      "rewardPoint",
    ];
    const firstRow = rawData[0];
    const missingColumns = requiredColumns.filter((col) => !(col in firstRow));

    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(", ")}`);
    }
    const serialNoMap = new Map();
    const codeMap = new Map();
    const invalidRows = [];
    rawData.forEach((row, index) => {
      const serialNo = String(row.serialNo).trim();
      const code = String(row.code).trim();

      if (!serialNo || !code) {
        invalidRows.push({
          rowNumber: index + 2,
          serialNo,
          code,
          reason: "Missing required fields",
        });
        return;
      }

      if (serialNoMap.has(serialNo)) {
        invalidRows.push({
          rowNumber: index + 2,
          serialNo,
          code,
          reason: `Duplicate Serial Number - Also appears in row ${serialNoMap.get(
            serialNo
          )}`,
        });
      } else {
        serialNoMap.set(serialNo, index + 2);
      }
      if (codeMap.has(code)) {
        invalidRows.push({
          rowNumber: index + 2,
          serialNo,
          code,
          reason: `Duplicate Code - Also appears in row ${codeMap.get(code)}`,
        });
      } else {
        codeMap.set(code, index + 2);
      }
    });
    if (invalidRows.length > 0) {
      const error = new Error("Validation failed");
      error.details = {
        message: `Found ${invalidRows.length} invalid or duplicate entries`,
        invalidRows: invalidRows,
        totalIssues: invalidRows.length,
      };
      throw error;
    }
    const dbDuplicates = [];
    const serialNos = Array.from(serialNoMap.keys());
    const codes = Array.from(codeMap.keys());
    for (let i = 0; i < serialNos.length; i += CHUNK_SIZE) {
      const serialNoChunk = serialNos.slice(i, i + CHUNK_SIZE);
      const codeChunk = codes.slice(i, i + CHUNK_SIZE);

      const duplicates = await couponSchema.findAll({
        where: {
          [Sequelize.Op.or]: [
            { sno: { [Sequelize.Op.in]: serialNoChunk } },
            { code: { [Sequelize.Op.in]: codeChunk } },
          ],
        },
        attributes: ["sno", "code"],
        raw: true,
      });

      duplicates.forEach((dup) => {
        const rowNum = serialNoMap.get(dup.sno) || codeMap.get(dup.code);
        dbDuplicates.push({
          rowNumber: rowNum,
          serialNo: dup.sno,
          code: dup.code,
          reason: "Already exists in database",
        });
      });
    }

    if (dbDuplicates.length > 0) {
      const error = new Error("Database duplicates found");
      error.details = {
        message: `Found ${dbDuplicates.length} entries that already exist in database`,
        duplicates: dbDuplicates,
        totalDuplicates: dbDuplicates.length,
      };
      throw error;
    }
    return res.status(200).json({
      error: false,
      message: "File scanned Successfully Now you can import the file!",
      data: file,
      filePath: filePath,
    });
  } catch (unlinkError) {
    try {
      await fs.promises.unlink(filePath);
    } catch (unlinkError) {
      console.error("Error deleting temporary file:", unlinkError);
    }
    const errorResponse = {
      status: "error",
      message: unlinkError.message || "Error during coupon import",
    };
    if (unlinkError.details) {
      Object.assign(errorResponse, unlinkError.details);
    }
    return res.status(500).json(errorResponse);
  }
};

const excelDateToJSDate = (serial) => {
  const startDate = new Date(1899, 11, 30); // Excel's base date (1900 system)
  const millisecondsPerDay = 86400000; // 24 * 60 * 60 * 1000

  // Truncate fractional part of the serial number
  const days = Math.floor(serial);

  // Calculate the actual date
  const date = new Date(startDate.getTime() + days * millisecondsPerDay);
  date.setHours(0, 0, 0, 0);
  // Return the date in YYYY-MM-DD format
  return date;
};
const convertExcelTime = (timeDecimal) => {
  const totalSeconds = (timeDecimal % 1) * 86400; // Isolate fractional day and convert to seconds
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  // Format hours, minutes, and seconds to ensure two digits
  const formattedHours = String(hours).padStart(2, "0");
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(seconds).padStart(2, "0");

  // Return formatted time (HH:MM or HH:MM:SS)
  return `${formattedHours}:${formattedMinutes}`;
};

export const type1CouponImport = async (req, res) => {
  const { store, couponFile } = req.body;
  const CHUNK_SIZE = 1000;
  let transaction = null;
  let totalProcessed = 0;
  const filePath = path.resolve(couponFile.filePath);
  try {
    transaction = await sequelize.transaction({
      autocommit: false,
    });
    const processedStore = await storeHandler(store);
    const currentBatchId =
      ((await couponSchema.max("couponBatchId", { transaction })) || 0) + 1;
    const workbook = xlsx.readFile(filePath, {
      cellNF: false,
      cellText: false,
      sheetRows: 50001,
    });

    if (!workbook.SheetNames.length) {
      throw new Error("Excel file contains no sheets");
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = xlsx.utils.sheet_to_json(sheet, {
      raw: true,
      defval: null,
      blankrows: false,
    });
    const totalSheetRecords = rawData.length;
    // console.log("Total records in sheet:", totalSheetRecords);

    if (totalSheetRecords === 0) {
      throw new Error("No data found in uploaded file");
    }
    if (totalSheetRecords > 50000) {
      throw new Error("Maximum 50,000 records allowed per upload");
    }
    if(totalSheetRecords>1000){
      res.status(statusMaker.created).json(
        responseHandler(
          statusMaker.created,
          `Coupon generation process initiated successfully. It will take approximately ${(Math.round(Number(0.012 * totalSheetRecords) + 120) / 60)} minutes to complete!`,
          {
            totalRecords: totalSheetRecords,
            batchId: currentBatchId,
            timeTaken: Number(0.012 * totalSheetRecords) + 120
          }
        )
      );
    }
    for (let i = 0; i < rawData.length; i += CHUNK_SIZE) {
      const chunk = rawData.slice(i, i + CHUNK_SIZE);
      const processedChunk = await Promise.all(
        chunk.map(async (row) => {
          // console.log("row", row);
          const qrCode = await genrateQrcode(row.serialNo, row.code);
          const startDate = excelDateToJSDate(row.startDate);
          const endDate = excelDateToJSDate(row.endDate);
          const startTime = convertExcelTime(row?.startTime);
          const endTime = convertExcelTime(row?.endTime);
          const couponEndDateString = convertExcelDate(endDate).format("DD/MM/YYYY"); // Replace with your database value
          const couponEndDate = moment(
            `${couponEndDateString} ${endTime}`,
            "DD/MM/YYYY HH:mm"
          );
          const currentDate = moment().utcOffset("+05:30");
          const checkExpireCoupon = couponEndDate.isBefore(currentDate);
            return {
              sno: String(row.serialNo).trim(),
              couponBatchId: currentBatchId,
              code: String(row.code).trim(),
              QRcode: qrCode,
              points: row.rewardPoint,
              stdate: convertExcelDate(startDate).format("DD/MM/YYYY"),
              enddate: convertExcelDate(endDate).format("DD/MM/YYYY"),
              account_number: row.customerid || null,
              product: row["Product Name"] || null,
              source_id: row.source_id || null,
              store: processedStore,
              expiryDate: convertExcelDate(calculateExpiryDate(startDate)).format(
                "DD-MM-YYYY"
              ),
              productSKU: row["Product SKU"] || null,
              QRCodes: `https://demo.rajnigandha.com/account?value=EarnPoints/${row.serialNo}/${row.code}`,
              noOfCoupon: 0,
              description: row.description || null,
              startTime: startTime,
              endTime: endTime,
              status: checkExpireCoupon ? "Expired" :"Active",
              source_of_device: "rajnigandha",
              source: "website",
              createdBy: "superadmin",
            };
        })
      );
      await couponSchema.bulkCreate(processedChunk, {
        transaction,
        logging: false,
      });
      // console.log("processedChunk", processedChunk);
      totalProcessed += processedChunk.length;
      console.log(`Processed ${totalProcessed}/${rawData.length} records`);
    }
    await couponSchema.update(
      { noOfCoupon: totalProcessed },
      {
        where: { couponBatchId: currentBatchId },
        transaction,
      }
    );
    await transaction.commit();
    fs.promises.unlink(filePath).catch((err) => {
      console.error("Error deleting file:", err);
    });
    if(totalSheetRecords<=1000){
      res.status(statusMaker.created).json(
        responseHandler(
          statusMaker.created,
          `Coupon generation process initiated successfully. It will take approximately 1 minutes to complete!`,
          {
            totalRecords: totalSheetRecords,
            batchId: currentBatchId,
            timeTaken: 0
          }
        )
      );
    }
  } catch (error) {
    console.error("Error during coupon import:", error);

    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }
    }

    try {
      await fs.promises.unlink(filePath);
    } catch (unlinkError) {
      console.error("Error deleting temporary file:", unlinkError);
    }

    const errorResponse = {
      status: "error",
      message: error.message || "Error during coupon import",
    };

    if (error.details) {
      Object.assign(errorResponse, error.details);
    }

    return res.status(500).json(errorResponse);
  }
};

export const couponImport = async (req, res) => {
  const { store } = req.body;
  const file = req.file;
  const CHUNK_SIZE = 1000;
  let transaction = null;
  let totalProcessed = 0;

  if (!file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  if (
    file.mimetype !==
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return res
      .status(400)
      .json({ message: "Please upload only Excel (.xlsx) files" });
  }

  const filePath = path.resolve(file.path);

  try {
    transaction = await sequelize.transaction({
      autocommit: false,
    });

    const processedStore = await storeHandler(store);
    const currentBatchId =
      ((await couponSchema.max("couponBatchId", { transaction })) || 0) + 1;

    // Updated Excel reading configuration
    const workbook = xlsx.readFile(filePath, {
      cellDates: true,
      cellNF: false,
      cellText: false,
      sheetRows: 30001, // Allow 30,000 rows plus header
    });

    if (!workbook.SheetNames.length) {
      throw new Error("Excel file contains no sheets");
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = xlsx.utils.sheet_to_json(sheet, {
      raw: true,
      defval: null,
      blankrows: false,
    });

    const totalSheetRecords = rawData.length;
    console.log("Total records in sheet:", totalSheetRecords);

    if (totalSheetRecords === 0) {
      throw new Error("No data found in uploaded file");
    }

    if (totalSheetRecords > 30000) {
      throw new Error("Maximum 30,000 records allowed per upload");
    }

    // Validate required columns
    const requiredColumns = [
      "serialNo",
      "code",
      "startDate",
      "endDate",
      "rewardPoint",
    ];
    const firstRow = rawData[0];
    const missingColumns = requiredColumns.filter((col) => !(col in firstRow));

    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(", ")}`);
    }

    // Check for duplicates
    const serialNoMap = new Map();
    const codeMap = new Map();
    const invalidRows = [];

    rawData.forEach((row, index) => {
      const serialNo = String(row.serialNo).trim();
      const code = String(row.code).trim();

      if (!serialNo || !code) {
        invalidRows.push({
          rowNumber: index + 2,
          serialNo,
          code,
          reason: "Missing required fields",
        });
        return;
      }

      if (serialNoMap.has(serialNo)) {
        invalidRows.push({
          rowNumber: index + 2,
          serialNo,
          code,
          reason: `Duplicate Serial Number - Also appears in row ${serialNoMap.get(
            serialNo
          )}`,
        });
      } else {
        serialNoMap.set(serialNo, index + 2);
      }

      if (codeMap.has(code)) {
        invalidRows.push({
          rowNumber: index + 2,
          serialNo,
          code,
          reason: `Duplicate Code - Also appears in row ${codeMap.get(code)}`,
        });
      } else {
        codeMap.set(code, index + 2);
      }
    });

    if (invalidRows.length > 0) {
      const error = new Error("Validation failed");
      error.details = {
        message: `Found ${invalidRows.length} invalid or duplicate entries`,
        invalidRows: invalidRows.slice(0, 20),
        totalIssues: invalidRows.length,
      };
      throw error;
    }

    // Database duplicate check
    const dbDuplicates = [];
    const serialNos = Array.from(serialNoMap.keys());
    const codes = Array.from(codeMap.keys());

    for (let i = 0; i < serialNos.length; i += CHUNK_SIZE) {
      const serialNoChunk = serialNos.slice(i, i + CHUNK_SIZE);
      const codeChunk = codes.slice(i, i + CHUNK_SIZE);

      const duplicates = await couponSchema.findAll({
        where: {
          [Sequelize.Op.or]: [
            { sno: { [Sequelize.Op.in]: serialNoChunk } },
            { code: { [Sequelize.Op.in]: codeChunk } },
          ],
        },
        attributes: ["sno", "code"],
        raw: true,
        transaction,
      });

      duplicates.forEach((dup) => {
        const rowNum = serialNoMap.get(dup.sno) || codeMap.get(dup.code);
        dbDuplicates.push({
          rowNumber: rowNum,
          serialNo: dup.sno,
          code: dup.code,
          reason: "Already exists in database",
        });
      });
    }

    if (dbDuplicates.length > 0) {
      const error = new Error("Database duplicates found");
      error.details = {
        message: `Found ${dbDuplicates.length} entries that already exist in database`,
        duplicates: dbDuplicates.slice(0, 20),
        totalDuplicates: dbDuplicates.length,
      };
      throw error;
    }

    // Process records in chunks with QR code generation
    for (let i = 0; i < rawData.length; i += CHUNK_SIZE) {
      const chunk = rawData.slice(i, i + CHUNK_SIZE);

      // Process all QR codes for the chunk first
      const processedChunk = await Promise.all(
        chunk.map(async (row) => {
          // Generate QR code and wait for it to complete
          const qrCode = await genrateQrcode(row.serialNo, row.code);

          return {
            sno: String(row.serialNo).trim(),
            couponBatchId: currentBatchId,
            code: String(row.code).trim(),
            QRcode: qrCode,
            points: row.rewardPoint,
            stdate: convertExcelDate(row.startDate).format("DD/MM/YYYY"),
            enddate: convertExcelDate(row.endDate).format("DD/MM/YYYY"),
            account_number: row.customerid || null,
            cstatus: 1,
            product: row["Product Name"] || null,
            source_id: row.source_id || null,
            store: processedStore,
            expiryDate: calculateExpiryDate(convertExcelDate(row.startDate)),
            productSKU: row["Product SKU"] || null,
            QRCodes: `https://demo.rajnigandha.com/account?value=EarnPoints/${row.serialNo}/${row.code}`,
            noOfCoupon: 0,
            description: row.description || null,
            startTime: row.startTime || null,
            endTime: row.endTime || null,
            expiryStatus: "Active",
            source_of_device: "rajnigandha",
            couponAccessed: "desktop",
            source: "website",
            createdBy: "superadmin",
          };
        })
      );

      await couponSchema.bulkCreate(processedChunk, {
        transaction,
        logging: false,
      });

      totalProcessed += processedChunk.length;
      console.log(`Processed ${totalProcessed}/${rawData.length} records`);
    }

    // Update batch count
    await couponSchema.update(
      { noOfCoupon: totalProcessed },
      {
        where: { couponBatchId: currentBatchId },
        transaction,
      }
    );

    await transaction.commit();

    // Cleanup
    await fs.promises.unlink(filePath).catch((err) => {
      console.error("Error deleting file:", err);
    });

    return res.status(statusMaker.created).json(
      responseHandler(statusMaker.created, "Coupons imported successfully", {
        totalRecords: totalSheetRecords,
        batchId: currentBatchId,
      })
    );
  } catch (error) {
    console.error("Error during coupon import:", error);

    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }
    }

    try {
      await fs.promises.unlink(filePath);
    } catch (unlinkError) {
      console.error("Error deleting temporary file:", unlinkError);
    }

    const errorResponse = {
      status: "error",
      message: error.message || "Error during coupon import",
    };

    if (error.details) {
      Object.assign(errorResponse, error.details);
    }

    return res.status(500).json(errorResponse);
  }
};
export const getBetchID = async (req, res) => {
  try {
    const { couponBatchId } = req.query;
    const existingData = await couponSchema.findAll({
      where: {
        couponBatchId,
        status: "Active",
      },
      order: [["createdAt", "ASC"]],
      limit: 1000,
    });
    if (!existingData) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingData
      );
      return res.status(statusMaker.notFound).json(response);
    }
    const response = responseHandler(
      statusMaker.found,
      apiMessages.found,
      existingData
    );
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

const createMetafieldHelperFunction = async (customerId, metafieldsData) => {
  try {
    const metafields = [
      {
        namespace: "custom",
        key: "rclub_reward_points",
        value: metafieldsData.rclupoint.toString(),
        type: "single_line_text_field",
        ownerId: `gid://shopify/Customer/${customerId}`,
      },
      {
        namespace: "custom",
        key: "rajnigandha_reward_points",
        value: metafieldsData.rajnigandha_point.toString(),
        type: "single_line_text_field",
        ownerId: `gid://shopify/Customer/${customerId}`,
      },
    ];

    const data = JSON.stringify({
      query: `
        mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              key
              namespace
              value
              createdAt
              updatedAt
            }
            userErrors {
              field
              message
              code
            }
          }
        }
      `,
      variables: { metafields },
    });

    const configData = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://lakmestaging.myshopify.com/admin/api/2024-07/graphql.json",
      headers: {
        "X-Shopify-Access-Token": config.shopify_token,
        "Content-Type": "application/json",
      },
      data,
    };
    const response = await axios.request(configData);
    // console.log("Metafields created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating metafields:", error);
    throw new Error("Failed to create metafields");
  }
};
// Helper function to convert DD/MM/YYYY to YYYY-MM-DD
const convertDateFormat = (dateStr) => {
  const [day, month, year] = dateStr.split("/");
  return `${year}-${month}-${day}`;
};

// export const couponRedeem = async (req, res) => {
//   try {
//     const { customer_id, account_number, code, sno, store, method } = req.body;
//     // Set isMethod based on the method value
//     const isMethod = method === 'scan' ? 'scan' : 'manual';

//     console.log(store);
//     const processedStore = await storeHandler(store);
//     console.log(processedStore, "processed store");
//     if (!processedStore) {
//       return res.status(statusMaker.notFound).json(apiMessages.notFound);
//     }

//     const ruleset = await RuleSetModified.findOne({
//       where: { store: processedStore },
//       attributes: ["coupon"],
//     });

//     const rulesetValues = ruleset?.coupon?.value || [];
//     console.log("Ruleset Values:", rulesetValues);

//     const rulesetStatus = ruleset?.coupon?.status === "active";

//     const customerData = await customer.findOne({
//       where: { account_number },
//       attributes: [
//         "id",
//         "customer_id",
//         "account_number",
//         "phone_number",
//         "first_name",
//         "email",
//         "city",
//         "State",
//         "phone_number",
//         "earned_point",
//         "redeem_point",
//         "expiry_point",
//       ],
//     });

//     if (!customerData) {
//       return res.status(404).json({ message: "Customer not found" });
//     }
//     const coupon = await couponSchema.findOne({
//       where: { code, sno, cstatus: 1 },
//     });

//     if (
//       !coupon ||
//       coupon.expiryStatus === "Used" ||
//       coupon.expiryStatus === "Expired"
//     ) {
//       return res.status(400).json({ message: "Invalid or expired coupon" });
//     }
//     const couponData = {
//       ...coupon.toJSON(),
//       expiryStatus: "Used"
//     }
//     const matchingRule = rulesetValues.find(
//       (rule) =>
//         rule.productName === coupon.product && rule.skuNo === coupon.productSKU
//     );

//     const isMatchingProduct = !!matchingRule;
//     const rulesetPoints = matchingRule ? parseInt(matchingRule.points, 10) : 0;

//     console.log("Ruleset Points:", rulesetPoints);
//     const currentDate = new Date();
//     await couponSchema.destroy({
//       where: {
//         code: couponData.code,
//         sno: couponData.sno
//       }
//     });
//     // Update coupon with isMethod
//     // await coupon.update({
//     //   expiryStatus: "Used",
//     //   isMethod: isMethod  // Save the method type
//     // });

//     const totalPoints = parseInt(coupon.points, 10) + (rulesetStatus && isMatchingProduct && rulesetPoints ? parseInt(rulesetPoints, 10) : 0);
//     console.log("total points", totalPoints);
//     const earnedPoints =
//       (parseInt(customerData.earned_point, 10) || 0) + totalPoints;
//     await customerData.update({ earned_point: earnedPoints });

//     const redeemPoints = parseInt(customerData.redeem_point, 10) || 0;
//     const expiryPoints = parseInt(customerData.expiry_point, 10) || 0;
//     const balancePoints = earnedPoints - redeemPoints - expiryPoints;

//     await customerData.update({
//       redeem_point: redeemPoints,
//       expiry_point: expiryPoints,
//       balance_point: balancePoints,
//     });

//     await createTransaction({
//       customerData: { customer_id, account_number },
//       points: totalPoints,
//       expiryDate: coupon.enddate,
//       transition_status: "credit",
//       transition_category: "coupon",
//       store: processedStore,
//       name: customerData.first_name,
//       mobile_no: customerData.phone_number,
//       state: customerData.State,
//       city: customerData.city,
//       serial_no: coupon.sno,
//       coupon_code: coupon.code,
//       scan_manual: method // Add method to transaction
//     });

//     await createMetafieldHelperFunction(customerData.customer_id, {
//       rclupoint: "0",
//       rajnigandha_point: balancePoints.toString(),
//     });

//     await redeemSchema.create({
//       account_number,
//       customer_id,
//       code,
//       sno,
//       product: coupon.product,
//       productSKU: coupon.productSKU,
//       productweighatge: coupon.productweighatge,
//       stdate: coupon.stdate,
//       enddate: coupon.enddate,
//       points: coupon.points,
//       status: "Used",
//       rdate: currentDate,
//       redemedBy: customerData.first_name,
//       email: customerData.email,
//       phone_number: customerData.phone_number,
//       couponBatchId: coupon.couponBatchId,
//       CouponAccessed: 'desktop',  // Added missing field
//       source: 'website',
//       isMethod: isMethod  // Save the method type in redeem schema
//     });

//     const whatsappDetails = {
//       phone_number: customerData.phone_number,
//       first_name: customerData.first_name,
//       balance_point: balancePoints,
//       usedPoints: coupon.points,
//       rewardItem: coupon.product,
//     };

//     await handleNotifications("reward-points-earned", store, whatsappDetails);

//     res.status(201).json({
//       status: "201",
//       message:
//         "Coupon redeemed successfully and points credited to the customer",
//       newPointsBalance: {
//         earned_point: earnedPoints,
//         redeem_point: redeemPoints,
//         expiry_point: expiryPoints,
//         balance_point: balancePoints,
//         store: processedStore,
//       },
//     });
//   } catch (error) {
//     console.log("line 683", error.message);
//     const response = errorHandler(error);
//     return res.status(statusMaker.internalError).json(response);
//   }
// };

export const couponRedeem = async (req, res) => {
  try {
    const { customer_id, account_number, code, sno, store, method } = req.body;
    // Set isMethod based on the method value
    const isMethod = method === "scan" ? "scan" : "manual";

    console.log(store);
    const processedStore = await storeHandler(store);
    console.log(processedStore, "processed store");
    if (!processedStore) {
      return res.status(statusMaker.notFound).json(apiMessages.notFound);
    }

    const ruleset = await RuleSetModified.findOne({
      attributes: ["coupon"],
      where: { store: processedStore },
    });
    const rulesetValues = ruleset?.coupon?.value || [];

    const rulesetStatus = ruleset?.coupon?.status === "active";

    const customerData = await customer.findOne({
      where: { account_number },
      attributes: [
        "id",
        "customer_id",
        "account_number",
        "phone_number",
        "first_name",
        "email",
        "city",
        "State",
        "phone_number",
        "earned_point",
        "redeem_point",
        "expiry_point",
      ],
      raw: true,
    });
    if (!customerData) {
      return res.status(404).json({ message: "Customer not found" });
    }
    // const nowDate = new Date();
    // const currentDate = new Date(nowDate.getTime() + (5 * 60 + 30) * 60 * 1000);
    const coupon = await couponSchema.findOne({
      where: { code, sno },
      raw: true,
    });
    if (
      !coupon || coupon.status === "Expired"
    ) {
      return res.status(400).json({ message: "Already Used Coupon!" });
    }
    if(coupon.status === "Used"){
        return res.status(400).json({ message: "Invalid or expired coupon" });
    }
    if (coupon?.status === "Inactive") {
      return res.status(400).json({ message: "Coupon is not active yet" });
    }
    const convertExcelDate = (excelDate) => {
      if (typeof excelDate === "number") {
        // Add the number of days to the Excel epoch start date
        return moment("1899-12-30").add(excelDate, "days").startOf("day");
      }
      // Parse string dates into moment objects
      return moment(excelDate, ["DD/MM/YYYY", "YYYY-MM-DD"]).startOf("day");
    };

    const couponEndDateString = coupon?.enddate; // Replace with your database value
    const couponEndTimeString = coupon?.endTime; // Replace with your database value
    const couponStartDateString = coupon?.stdate; // Replace with your database value
    const couponStartTimeString = coupon?.startTime; // Replace with your database value

    const couponStartDate = moment(
      `${couponStartDateString} ${couponStartTimeString}`,
      "DD/MM/YYYY HH:mm"
    );;
    const couponEndDate = moment(
      `${couponEndDateString} ${couponEndTimeString}`,
      "DD/MM/YYYY HH:mm"
    );
    const currentDate = moment().utcOffset("+05:30");
    const newDate = currentDate.clone().add(18, "months");
    console.log(coupon, "coupon");
    // console.log("currentDate", currentDate);
    // console.log("couponEndDate", couponEndDate);
    // console.log("couponStartDate", couponStartDate);
    // console.log("newDate", newDate);
    // console.log("couponEndDate.isBefore(currentDate)", couponStartDate.isAfter(currentDate));
    if (couponEndDate.isBefore(currentDate)) {
      return res.status(403).json({
        message: "Invalid or expired coupon",
      });
    }
    else if (couponStartDate.isAfter(currentDate)) {
      console.log("Invalid coupon")
      return res.status(403).json({
        message: `Coupon is not active yet`,
      });
    } else {
      const matchingRule = rulesetValues.find(
        (rule) =>
          rule.productName === coupon.product && rule.skuNo === coupon.productSKU
      );

      const isMatchingProduct = !!matchingRule;
      const rulesetPoints = matchingRule ? parseInt(matchingRule.points, 10) : 0;
      const totalPoints =
        parseInt(coupon.points, 10) +
        (rulesetStatus && isMatchingProduct && rulesetPoints
          ? parseInt(rulesetPoints, 10)
          : 0);
      const earnedPoints =
        (parseInt(customerData.earned_point, 10) || 0) + totalPoints;
      const redeemPoints = parseInt(customerData.redeem_point, 10) || 0;
      const expiryPoints = parseInt(customerData.expiry_point, 10) || 0;
      const balancePoints = earnedPoints - redeemPoints - expiryPoints;
      await customer.update(
        {
          earned_point: earnedPoints,
          redeem_point: redeemPoints,
          expiry_point: expiryPoints,
          balance_point: balancePoints,
        },
        {
          where: {
            customer_id: customerData.customer_id,
          },
        }
      );
      await createTransaction({
        customerData: { customer_id: customerData.customer_id, account_number },
        points: coupon.points,
        expiryDate: newDate.format("DD-MM-YYYY"),
        transition_status: "credit",
        transition_category: "Retail Coupon",
        store: processedStore,
        name: customerData.first_name,
        mobile_no: customerData.phone_number,
        state: customerData.State,
        city: customerData.city,
        serial_no: coupon.sno,
        coupon_code: coupon.code,
        scan_manual: method, // Add method to transaction
      });
      await createMetafieldHelperFunction(customerData.customer_id, {
        rclupoint: "0",
        rajnigandha_point: balancePoints.toString(),
      });
      const result = await updateCustomerTierFunc(
        customerData.customer_id,
        "rajnigandha"
      );
      const userAgent = req.get('User-Agent');
      const deviceDetector = new DeviceDetector();
      const deviceInfo = deviceDetector.parse(userAgent);
      await couponSchema.update({
        account_number:customerData.account_number,
        customer_id:customerData.customer_id,
        status: "Used",
        rdate: currentDate,
        redemedBy: customerData.first_name,
        email: customerData.email,
        phone_number: customerData.phone_number,
        couponBatchId: coupon.couponBatchId,
        couponAccessed: deviceInfo.device?.type || "desktop",
        source: "website",
        isMethod: isMethod,
        createdBy:coupon.createdBy
      },{
        where:{id:coupon.id}
      });

      const whatsappDetails = {
        phone_number: customerData.phone_number,
        first_name: customerData.first_name,
        balance_point: balancePoints,
        usedPoints: coupon.points,
        rewardItem: coupon.product,
        email: customerData.email,
      };
      await handleNotifications("reward-points-earned", store, whatsappDetails);
      res.status(201).json({
        status: "201",
        message:
          "Coupon redeemed successfully and points credited to the customer",
        newPointsBalance: {
          earned_point: earnedPoints,
          redeem_point: redeemPoints,
          expiry_point: expiryPoints,
          balance_point: balancePoints,
          store: processedStore,
        },
      });
    }
  } catch (error) {
    console.log("Error ::>>", error);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

const generateTransitionId = (transitionCategory) => {
  const datePart = moment().format("YYYYMMDDHHmmss");
  const randomPart = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(10, "0");
  return `${transitionCategory}${datePart}${randomPart}`;
};

// const updateCustomerTierFunc = async (customer_id, store) => {
//   try {
//     console.log("customer_id", customer_id);
//     console.log("store", store);
//     const customerIdString = customer_id;

//     if (!customer_id || !store) {
//       return {
//         status: 400,
//         message: "Please provide both customer_id and store.",
//       };
//     }

//     // Fetch customer data
//     const customerData = await customer.findOne({
//       where: { customer_id: customerIdString, store },
//       attributes: [
//         "earned_point",
//         "redeem_point",
//         "expiry_point",
//         "balance_point",
//         "membership_tier",
//         "account_number",
//         "first_name",
//         "phone_number",
//         "State",
//         "city",
//       ],
//     });

//     if (!customerData) {
//       return {
//         status: 404,
//         message: `No customer found with customer_id: ${customer_id}.`,
//       };
//     }

//     // Fetch tier management data
//     const tierData = await tier_mangement.findOne({
//       where: { store },
//     });

//     if (!tierData) {
//       return {
//         status: 404,
//         message: `No tier management data found for store: ${store}.`,
//       };
//     }

//     const startManagement = tierData.start_mangement;
//     const tierBenefits = tierData.tier_benefits;

//     const currentTier = customerData.membership_tier;
//     const oldEarnedPoint = parseInt(customerData.earned_point, 10);
//     const oldRedeemPoint = parseInt(customerData.redeem_point, 10);
//     const oldExpiryPoint = parseInt(customerData.expiry_point, 10);
//     const balancePoint = parseInt(customerData.balance_point, 10);

//     // Determine the new tier
//     let newTier = currentTier;
//     let tierPoints = 0;
//     let expiryDate = null;

//     for (const [tier, range] of Object.entries(startManagement)) {
//       const start = parseInt(range.start_point, 10) || 0;
//       const end = parseInt(range.end_point, 10) || Infinity;

//       if (balancePoint >= start && balancePoint <= end) {
//         newTier = tier;
//         tierPoints = parseInt(tierBenefits[tier]?.point || "0", 10);
//         // expiryDate = tierBenefits[tier]?.expiry_date || null;
//         const expiryDays = parseInt(tierBenefits[tier]?.expiry || "0", 10);
//         console.log("expiryDays 8993", expiryDays);

//         expiryDate = moment().add(expiryDays, "days").format("DD-MM-YY");
//         console.log("expiryDate 8997", expiryDate);
//         break;
//       }
//     }

//     // Recalculate points
//     const updatedEarnedPoint = oldEarnedPoint + tierPoints;
//     const updatedBalancePoint =
//       updatedEarnedPoint - oldRedeemPoint - oldExpiryPoint;

//     // Check if the tier is upgraded
//     if (newTier !== currentTier) {
//       if (
//         Object.keys(startManagement).indexOf(newTier) >
//         Object.keys(startManagement).indexOf(currentTier)
//       ) {
//         // Tier upgraded, update customer data and create a transaction
//         const transitionId = generateTransitionId("tier_update");

//         await customer.update(
//           {
//             membership_tier: newTier,
//             earned_point: updatedEarnedPoint,
//             balance_point: updatedBalancePoint,
//           },
//           { where: { customer_id, store } }
//         );

//         await transition.create({
//           customer_Id: customer_id,
//           transition_id: transitionId,
//           account_number: customerData.account_number,
//           transition_category: "tier_update",
//           transition_status: "credit",
//           medium: "desktop",
//           point: tierPoints,
//           expiry_date: expiryDate,
//           order_id: "",
//           product_detail: "",
//           note: "Tier upgraded to " + newTier,
//           domain: "rajnigandha.com",
//           name: customerData.first_name,
//           mobile_no: customerData.phone_number,
//           state: customerData.State,
//           city: customerData.city,
//           serial_no: "",
//           coupon_code: "",
//           scan_manual: "",
//         });

//         // Update points in metafield
//         await createMetafieldHelperFunction(customer_id, {
//           rclupoint: "0",
//           rajnigandha_point: updatedBalancePoint.toString(),
//         });

//         return {
//           status: 200,
//           message: "Customer tier updated successfully.",
//           customer: {
//             previous_tier: currentTier,
//             new_tier: newTier,
//             points_given: tierPoints,
//             expiry_date: expiryDate,
//             balance_point: updatedBalancePoint,
//           },
//         };
//       } else {
//         // Tier downgrade detected but no update
//         return {
//           status: 200,
//           message:
//             "Customer tier downgrade detected. No update performed or points given.",
//           customer: {
//             current_tier: currentTier,
//             balance_point: balancePoint,
//           },
//         };
//       }
//     } else {
//       // No tier change
//       return {
//         status: 200,
//         message: "No tier change. Customer retains their current tier.",
//         customer: {
//           current_tier: currentTier,
//           balance_point: balancePoint,
//         },
//       };
//     }
//   } catch (error) {
//     console.error("Error in updateCustomerTier:", error);
//     return {
//       status: 500,
//       message: "Error updating customer tier.",
//       error: error.message,
//     };
//   }
// };

// export const couponRedeem = async (req, res) => {
//   try {
//     const { customer_id, account_number, code, sno, store } = req.body;
//     console.log(store);
//     const processedStore = await storeHandler(store);
//     console.log(processedStore, "processed store");
//     if (!processedStore) {
//       return res.status(statusMaker.notFound).json(apiMessages.notFound);
//     }
//     // const ruleset = await RuleSetModified.findOne({
//     //   where: { store: processedStore },
//     //   attributes: ["coupon"],
//     // });
//     const ruleset = await RuleSetModified.findOne({
//       where: { store: processedStore },
//       attributes: ["coupon"], // Fetches the entire coupon object
//     });

//     const rulesetValues = ruleset?.coupon?.value || [];
//     console.log("Ruleset Values:", rulesetValues);

//     const rulesetStatus = ruleset?.coupon?.status === "active";

//     // Find matching product rule

//     const customerData = await customer.findOne({
//       where: { account_number },
//       attributes: [
//         "id",
//         "customer_id",
//         "account_number",
//         "phone_number",
//         "first_name",
//         "email",
//         "city",
//         "State",
//         "phone_number",
//         "earned_point",
//         "redeem_point",
//         "expiry_point",
//       ],
//     });

//     if (!customerData) {
//       return res.status(404).json({ message: "Customer not found" });
//     }
//     const coupon = await couponSchema.findOne({
//       where: { code, sno, cstatus: 1 },
//     });

//     if (
//       !coupon ||
//       coupon.expiryStatus === "Used" ||
//       coupon.expiryStatus === "Expired"
//     ) {
//       return res.status(400).json({ message: "Invalid or expired coupon" });
//     }
//     const matchingRule = rulesetValues.find(
//       (rule) =>
//         rule.productName === coupon.product && rule.skuNo === coupon.productSKU
//     );

//     const isMatchingProduct = !!matchingRule; // True if a matching rule is found
//     const rulesetPoints = matchingRule ? parseInt(matchingRule.points, 10) : 0;

//     console.log("Ruleset Points:", rulesetPoints);
//     const currentDate = new Date();
//     await coupon.update({ expiryStatus: "Used" });

//     const totalPoints = parseInt(coupon.points, 10) + (rulesetStatus && isMatchingProduct && rulesetPoints ? parseInt(rulesetPoints, 10) : 0);
//     console.log("total points", totalPoints);
//     const earnedPoints =
//       (parseInt(customerData.earned_point, 10) || 0) + totalPoints;
//     await customerData.update({ earned_point: earnedPoints });

//     const redeemPoints = parseInt(customerData.redeem_point, 10) || 0;
//     const expiryPoints = parseInt(customerData.expiry_point, 10) || 0;
//     const balancePoints = earnedPoints - redeemPoints - expiryPoints;

//     await customerData.update({
//       redeem_point: redeemPoints,
//       expiry_point: expiryPoints,
//       balance_point: balancePoints,
//     });
//     await createTransaction({
//       customerData: { customer_id, account_number },
//       points: totalPoints,
//       expiryDate: coupon.enddate,
//       transition_status: "credit",
//       transition_category: "coupon",
//       store: processedStore,
//       name:customerData.first_name,
//       mobile_no:customerData.phone_number,
//       state:customerData.State,
//       city: customerData.city,
//       serial_no: coupon.sno,
//       coupon_code: coupon.code,
//       scan_manual:"scan_manual"
//     });
//     console.log("createTransaction",createTransaction);

//     await createMetafieldHelperFunction(customerData.customer_id, {
//       rclupoint: "0",
//       rajnigandha_point: balancePoints.toString(),
//     });
//     // const startDateFormatted = startDate.toISOString();
//     // const endDateFormatted = endDate.toISOString();
//     await redeemSchema.create({
//       account_number,
//       customer_id,
//       code,
//       sno,
//       product: coupon.product,
//       productSKU: coupon.productSKU,
//       productweighatge: coupon.productweighatge,
//       stdate: coupon.stdate,
//       enddate: coupon.enddate,
//       points: earnedPoints,
//       status: coupon.expiryStatus,
//       rdate: currentDate,
//       redemedBy: customerData.first_name,
//       email: customerData.email,
//       phone_number: customerData.phone_number,
//       couponBatchId: coupon.couponBatchId,
//     });
//     const whatsappDetails = {
//       phone_number: customerData.phone_number,
//       first_name: customerData.first_name,
//       balance_point: balancePoints,
//       usedPoints: coupon.points,
//       rewardItem: coupon.product,
//     };
//     await handleNotifications("reward-points-earned", store, whatsappDetails);
//     // await Promise.all(promises);
//     res.status(201).json({
//       status: "201",
//       message:
//         "Coupon redeemed successfully and points credited to the customer",
//       newPointsBalance: {
//         earned_point: earnedPoints,
//         redeem_point: redeemPoints,
//         expiry_point: expiryPoints,
//         balance_point: balancePoints,
//         store: processedStore,
//       },
//     });
//   } catch (error) {
//     console.log("line 683", error.message);
//     const response = errorHandler(error);
//     return res.status(statusMaker.internalError).json(response);
//   }
// };



const updateCustomerTierFunc = async (customer_id, store) => {
  try {
    console.log("customer_id", customer_id);
    console.log("store", store);
    const customerIdString = customer_id;

    if (!customer_id || !store) {
      return {
        status: 400,
        message: "Please provide both customer_id and store.",
      };
    }

    // Fetch customer data
    const customerData = await customer.findOne({
      where: { customer_id: customerIdString, store },
      attributes: [
        "earned_point",
        "balance_point",
        "membership_tier",
        "account_number",
        "first_name",
        "phone_number",
        "State",
        "city",
      ],
    });

    if (!customerData) {
      return {
        status: 404,
        message: `No customer found with customer_id: ${customer_id}.`,
      };
    }

    console.log("updatedEarnedPoint",oldEarnedPoint)

    // Fetch tier management data
    const tierData = await tier_mangement.findOne({
      where: { store },
    });

    if (!tierData) {
      return {
        status: 404,
        message: `No tier management data found for store: ${store}.`,
      };
    }

    const startManagement = tierData.start_mangement;
    const currentTier = customerData.membership_tier || "";
    const oldEarnedPoint = parseInt(customerData.earned_point, 10);
    const oldRedeemPoint = parseInt(customerData.redeem_point, 10) || 0;;
    const oldExpiryPoint = parseInt(customerData.expiry_point, 10) || 0;;

    let newTier = currentTier;

    // Determine the new tier
    for (const [tier, range] of Object.entries(startManagement)) {
      const start = parseInt(range.start_point, 10) || 0;
      const end = parseInt(range.end_point, 10) || Infinity;

      if (oldEarnedPoint >= start && oldEarnedPoint <= end) {
        newTier = tier;
        break;
      }
    }

    if (!newTier || newTier === currentTier) {
      // No tier change required
      return {
        status: 200,
        message: "Customer remains in the same tier.",
        customer: {
          current_tier: currentTier,
          earned_point: oldEarnedPoint,
        },
      };
    }

    if (
      Object.keys(startManagement).indexOf(newTier) >
      Object.keys(startManagement).indexOf(currentTier)
    ) {
      // Tier upgrade detected
      const tierBenefits = tierData.tier_benefits || {};
      const tierPoints = parseInt(tierBenefits[newTier]?.point || "0", 10);
      const expiryDays = parseInt(tierBenefits[newTier]?.expiry || "0", 10);
      const expiryDate = moment().add(expiryDays, "days").format("DD-MM-YYYY");

      const updatedEarnedPoint = oldEarnedPoint + tierPoints;
      const updatedBalancePoint = updatedEarnedPoint - oldRedeemPoint - oldExpiryPoint;
      //const updatedBalancePoint = updatedEarnedPoint;

      // Update customer data
      const transitionId = generateTransitionId("tier_update");

      await customer.update(
        {
          membership_tier: newTier,
          earned_point: updatedEarnedPoint,
          balance_point: updatedBalancePoint,
        },
        { where: { customer_id, store } }
      );

      await transition.create({
        customer_Id: customer_id,
        transition_id: transitionId,
        account_number: customerData.account_number,
        transition_category: "tier_update",
        transition_status: "credit",
        medium: "desktop",
        point: tierPoints,
        expiry_date: expiryDate,
        order_id: "",
        product_detail: "",
        note: "Tier upgraded to " + newTier,
        domain: "rajnigandha.com",
        name: customerData.first_name,
        mobile_no: customerData.phone_number,
        state: customerData.State,
        city: customerData.city,
        serial_no: "",
        coupon_code: "",
        scan_manual: "",
      });

      await createMetafieldHelperFunction(customer_id, {
        rclupoint: "0",
        rajnigandha_point: updatedBalancePoint.toString(),
      });

       // Trigger notification for tier upgrade
       await handleNotifications("tier-upgrade", "rajnigandha", {
        first_name: customerData.first_name,
        newTier: newTier,
        phone_number: customerData.phone_number,
        email: customerData.email,
      });

      return {
        status: 200,
        message: "Customer tier upgraded successfully.",
        customer: {
          previous_tier: currentTier,
          new_tier: newTier,
          points_given: tierPoints,
          expiry_date: expiryDate,
          balance_point: updatedBalancePoint,
        },
      };
    } else {
      // Points fall in a lower tier (no downgrade performed)
      return {
        status: 200,
        message: "Customer points fall in a lower tier. No action required.",
        customer: {
          current_tier: currentTier,
          earned_point: oldEarnedPoint,
        },
      };
    }
  } catch (error) {
    console.error("Error in updateCustomerTierFunc:", error);
    return {
      status: 500,
      message: "Error updating customer tier.",
      error: error.message,
    };
  }
};


export const filterCouponCodes = async (req, res) => {
  try {
    const { start_date, end_date, store, expiryStatus } = req.query;

    const filter = {};

    // Process the store only if it's provided
    if (store) {
      const processedStore = await storeHandler(store);
      filter.store = processedStore;
    }

    // Handle expiryStatus filter
    if (expiryStatus) {
      filter.expiryStatus = expiryStatus;
    }

    // Handle date range filtering
    if (start_date && end_date) {
      const formattedStartDate = moment(start_date, "DD/MM/YYYY").format(
        "YYYY-MM-DD"
      );
      const formattedEndDate = moment(end_date, "DD/MM/YYYY").format(
        "YYYY-MM-DD"
      );

      filter.stdate = {
        [Sequelize.Op.gte]: formattedStartDate,
      };
      filter.enddate = {
        [Sequelize.Op.lte]: formattedEndDate,
      };
    }

    console.log("Filter applied:", filter);

    // Fetch the filtered data
    const list = await couponSchema.findAll({
      where: filter,
      order: [
        ["stdate", "ASC"],
        ["enddate", "ASC"],
      ],
    });

    if (!list.length) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        list
      );
      return res.status(statusMaker.notFound).json(response);
    }

    const response = responseHandler(
      statusMaker.found,
      apiMessages.found,
      list
    );
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    console.error("Error:", error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const list = async (req, res) => {
  try {
    const { search, status='Active', start_date, end_date } = req.query;
    let filterApplied = false;
    let filterStatus = [];
    let whereConditions= {};
    if (status) {
      filterStatus = [`${status}`];
    }
    if (search) {
      filterApplied = true;
      whereConditions[Sequelize.Op.or] = [
        { product: { [Sequelize.Op.like]: `%${search}%` } },
        { sno: { [Sequelize.Op.like]: `%${search}%` } },
        { code: { [Sequelize.Op.like]: `%${search}%` } },
      ];
    }
    if (start_date) {
      whereConditions.stdate = Sequelize.literal(`CONVERT(DATE, stdate, 103) >= '${start_date}'`);
    }
    if (end_date) {
      whereConditions.enddate = Sequelize.literal(`CONVERT(DATE, enddate, 103) <= '${end_date}'`);
    }
    whereConditions.status = {
        [Sequelize.Op.in]: filterStatus,
    };
    const couponSchemaObj = {
      where: whereConditions,
      order: [["createdAt", "DESC"]],
    };
    if (!filterApplied) {
      filterApplied = true;
      couponSchemaObj.limit = 1000;
    }
    console.log("Coupon Schema obj ::>>", couponSchemaObj);
    const ActiveList = await couponSchema.findAll(couponSchemaObj);
    const response = responseHandler(statusMaker.found, apiMessages.found, {
      totalCoupons: ActiveList.length,
      data: ActiveList,
    });
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

// export const list = async (req, res) => {
//   try {
//     const ActiveList = await couponSchema.findAll({
//       where: {
//         expiryStatus: "Active",
//       }
//     });
//     if (checkEmptyArray(ActiveList)) {
//       const response = responseHandler(
//         statusMaker.notFound,
//         apiMessages.notFound,
//         ActiveList
//       );
//       return res.status(statusMaker.notFound).json(response);
//     }
//     const response = responseHandler(
//       statusMaker.found,
//       apiMessages.found,
//       ActiveList
//     );
//     return res.status(statusMaker.found).json(response);
//   } catch (error) {
//     console.log(error.message);
//     const response = errorHandler(error);
//     return res.status(statusMaker.internalError).json(response);
//   }
// };

export const usedCouponList = async (req, res) => {
  try {
    const { start_date, end_date, search, store } = req.query;
    const processedStore = await storeHandler(store);
    const whereConditions = {
      store: processedStore,
      status: "Used",
    };
    if (search) {
      whereConditions[Sequelize.Op.or] = [
        { account_number: { [Sequelize.Op.like]: `%${search}%` } },
        { phone_number: { [Sequelize.Op.like]: `%${search}%` } },
        { sno: { [Sequelize.Op.like]: `%${search}%` } },
        { code: { [Sequelize.Op.like]: `%${search}%` } },
      ];
    }
    let makeEndDate;
    if(end_date){
      const endDate = new Date(end_date);
      endDate.setDate(endDate.getDate()+1)
      makeEndDate = endDate.toISOString().split("T")[0];
    }
    if (start_date && end_date) {
    whereConditions.rdate = Sequelize.literal(
      `rdate >= '${start_date}' AND rdate <= '${makeEndDate}'`
      );
    } else if (start_date) {
      whereConditions.rdate = Sequelize.literal(
        `rdate >= '${start_date}'`
      );
    } else if (end_date) {
      whereConditions.rdate = Sequelize.literal(
        `rdate <= '${makeEndDate}'`
      );
    }
    console.log("Where conditions ::>>>", whereConditions);
    const usedcouponData = await couponSchema.findAll({
      where: whereConditions,
      order: [
        ["rdate", "DESC"],
      ],
    });

    const response = responseHandler(
      statusMaker.found,
      apiMessages.found,
      usedcouponData
    );
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    console.error("used Coupon list ::>>>",error);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const expiredCouponList = async (req, res) => {
  try {
    const { search, store, start_date, end_date } = req.query;
    const processedStore = await storeHandler(store);
    const whereConditions = {
      store: processedStore,
      status: "Expired",
    };
    if (search) {
      whereConditions[Sequelize.Op.or] = [
        { product: { [Sequelize.Op.like]: `%${search}%` } },
        { sno: { [Sequelize.Op.like]: `%${search}%` } },
        { code: { [Sequelize.Op.like]: `%${search}%` } },
      ];
    }
    if (start_date) {
      whereConditions.stdate = Sequelize.literal(`CONVERT(DATE, stdate, 103) >= '${start_date}'`);
    }
    if (end_date) {
      whereConditions.enddate = Sequelize.literal(`CONVERT(DATE, enddate, 103) <= '${end_date}'`);
    }
    const expiredData = await couponSchema.findAll({
      where: whereConditions,
      order:[
        ['id','DESC']
      ]
    });
    const response = responseHandler(
      statusMaker.found,
      apiMessages.found,
      expiredData
    );
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    console.error(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const couponSearch = async (req, res) => {
  try {
    const { query } = req.query;
    const searchConditions = {
      status: "active",
      ...(query && {
        [Op.or]: [
          { account_number: { [Op.like]: `%${query}%` } },
          { phone_number: { [Op.like]: `%${query}%` } },
          { code: { [Op.like]: `%${query}%` } },
          { sno: { [Op.like]: `%${query}%` } },
          { product: { [Op.like]: `%${query}%` } },
        ],
      }),
    };
    const couponData = await couponSchema.findAll({
      where: searchConditions,
    });
    if (checkEmptyArray(couponData)) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        []
      );
      return res.status(statusMaker.notFound).json(response);
    }

    const response = responseHandler(
      statusMaker.found,
      apiMessages.found,
      couponData
    );
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    console.error("Error during coupon search:", error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const usedcouponSearch = async (req, res) => {
  try {
    const { query } = req.query;
    const searchConditions = {
      // expiryStatus: "inactive",
      ...(query && {
        [Op.or]: [
          // { code: { [Op.like]: `%${query}%` } },
          { account_number: { [Op.like]: `%${query}%` } },
          { phone_number: { [Op.like]: `%${query}%` } },
          // { sno: { [Op.like]: `%${query}%` } },
          // { product: { [Op.like]: `%${query}%` } },
          // { email: { [Op.like]: `%${query}%` } },
          // { customer_id: { [Op.like]: `%${query}%` } },
          // { redemedBy: { [Op.like]: `%${query}%` } },
        ],
      }),
    };
    const couponData = await couponSchema.findAll({
      where: searchConditions,
    });
    if (checkEmptyArray(couponData)) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        []
      );
      return res.status(statusMaker.notFound).json(response);
    }

    const response = responseHandler(
      statusMaker.found,
      apiMessages.found,
      couponData
    );
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    console.error("Error during coupon search:", error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const expiredcouponSearch = async (req, res) => {
  try {
    const { query } = req.query;
    const searchConditions = {
      expiryStatus: "expired",
      ...(query && {
        [Op.or]: [
          { phone_number: { [Op.like]: `%${query}%` } },
          { account_number: { [Op.like]: `%${query}%` } },
          // { code: { [Op.like]: `%${query}%` } },
          // { sno: { [Op.like]: `%${query}%` } },
          // { product: { [Op.like]: `%${query}%` } },
          // { expiryDate: { [Op.like]: `%${query}%` } },
        ],
      }),
    };
    const couponData = await couponSchema.findAll({
      where: searchConditions,
    });
    if (checkEmptyArray(couponData)) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        []
      );
      return res.status(statusMaker.notFound).json(response);
    }

    const response = responseHandler(
      statusMaker.found,
      apiMessages.found,
      couponData
    );
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    console.error("Error during coupon search:", error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const getById = async (req, res) => {
  try {
    const { customer_id, account_number } = req.query;
    const existingData = await couponSchema.findAll({
      where: { customer_id: customer_id, account_number: account_number },
    });
    if (!existingData) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingData
      );
      return res.status(statusMaker.notFound).json(response);
    }
    const response = responseHandler(
      statusMaker.found,
      apiMessages.found,
      existingData
    );
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    console.error("Error", error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.query;
    const { status } = req.body;
    const existingCoupon = await couponSchema.findOne({ where: { id } });
    if (!existingCoupon) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        null
      );
      return res.status(statusMaker.notFound).json(response);
    }
    await couponSchema.update({ status: status }, { where: { id } });
    const updatedCoupon = await couponSchema.findOne({ where: { id } });

    const response = responseHandler(
      statusMaker.updated,
      apiMessages.update,
      updatedCoupon
    );
    res.status(statusMaker.updated).json(response);
  } catch (error) {
    const response = errorHandler(error);
    res.status(statusMaker.internalError).json(response);
  }
};

export const getInactive = async (req, res) => {
  try {
    // const { store } = req.query;
    // const processedStore = await storeHandler(store);
    const inactiveList = await couponSchema.findAll({
      where: {
        expiryStatus: "Inactive",
      },
    });
    if (checkEmptyArray(inactiveList)) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        inactiveList
      );
      return res.status(statusMaker.notFound).json(response);
    }
    const response = responseHandler(
      statusMaker.found,
      apiMessages.found,
      inactiveList
    );
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    res.status(statusMaker.internalError).json(response);
  }
};

// export const editExpiredCoupon = async (req, res) => {
//   try {
//     const { id, start_date, end_date } = req.query;
//     if (!id || !start_date || !end_date) {
//       const response = responseHandler(
//         statusMaker.badRequest,
//         "start_date, and end_date are required."
//       );
//       return res.status(statusMaker.badRequest).json(response);
//     }
//     const coupon = await expiredSchema.findOne({
//       where: {
//         id: id,
//         expiryStatus: "Expired",
//       },
//     });

//     if (!coupon) {
//       const response = responseHandler(
//         statusMaker.notFound,
//         "No expired coupon found with the given ID.",
//         null
//       );
//       return res.status(statusMaker.notFound).json(response);
//     }
//     const updatedCoupon = await coupon.update({
//       stdate: start_date,
//       enddate: end_date,
//       expiryStatus: "Active",
//     });

//     const response = responseHandler(
//       statusMaker.success,
//       "Coupon updated successfully to Active.",
//       updatedCoupon
//     );
//     return res.status(statusMaker.success).json(response);
//   } catch (error) {
//     console.error("Error in editExpiredCoupon:", error.message);
//     const response = errorHandler(error);
//     res.status(statusMaker.internalError).json(response);
//   }
// };
// TO BE cover in phase 2
// export const editExpiredCoupon = async (req, res) => {
//   try {
//     const { id, start_date, end_date } = req.query;

//     // Input validation
//     if (!id || !start_date || !end_date) {
//       const response = responseHandler(
//         statusMaker.badRequest,
//         "id, start_date, and end_date are required."
//       );
//       return res.status(statusMaker.badRequest).json(response);
//     }

//     // Find the expired coupon
//     const expiredCoupon = await expiredSchema.findOne({
//       where: {
//         id: id,
//         expiryStatus: "Expired",
//       },
//     });

//     if (!expiredCoupon) {
//       const response = responseHandler(
//         statusMaker.notFound,
//         "No expired coupon found with the given ID.",
//         null
//       );
//       return res.status(statusMaker.notFound).json(response);
//     }
//     console.log("expired coupon", expiredCoupon);
//     // Get the data from expired coupon but exclude id and timestamps
//     const couponData = expiredCoupon.toJSON();
//     delete couponData.id; // Remove id to avoid conflict
//     delete couponData.createdAt;
//     delete couponData.updatedAt;

//     // Create new coupon in couponSchema with updated dates and status
//     const movedCoupon = await couponSchema.create({
//       ...couponData,
//       stdate: start_date,
//       enddate: end_date,
//       startTime: new Date(start_date),
//       endTime: new Date(end_date),
//       expiryStatus: "Active",
//       expiryDate: null, // Reset expiry date since it's now active
//     });

//     // Only delete from expiredSchema if creation in couponSchema was successful
//     if (movedCoupon) {
//       await expiredSchema.destroy({
//         where: { id: expiredCoupon.id },
//       });

//       // Log successful operation
//       console.log(
//         `Coupon ${movedCoupon.sno} successfully moved from expired to active`
//       );

//       const response = responseHandler(
//         statusMaker.success,
//         "Coupon successfully reactivated and moved to active coupons.",
//         {
//           coupon: movedCoupon,
//           message: "Coupon is now active",
//           sno: movedCoupon.sno,
//           code: movedCoupon.code,
//           newStartDate: start_date,
//           newEndDate: end_date,
//         }
//       );
//       return res.status(statusMaker.success).json(response);
//     } else {
//       throw new Error("Failed to create coupon in active schema");
//     }
//   } catch (error) {
//     console.error("Error in editExpiredCoupon:", error);

//     // Check for specific error types
//     if (error.name === "SequelizeUniqueConstraintError") {
//       const response = responseHandler(
//         statusMaker.conflict,
//         "This coupon code or serial number already exists in active coupons.",
//         null
//       );
//       return res.status(statusMaker.conflict).json(response);
//     }

//     // Handle other errors
//     const response = errorHandler(error);
//     return res.status(statusMaker.internalError).json(response);
//   }
// };

export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.query;

    const coupon = await couponSchema.findAll({
      where: {
        id: id,
      },
    });

    if (!coupon) {
      const response = responseHandler(
        statusMaker.notFound,
        "No coupon found with the given ID.",
        null
      );
      return res.status(statusMaker.notFound).json(response);
    }
    const couponDeleted = await couponSchema?.destroy({
      where: { id },
    });
    console.log("couponDeleted", couponDeleted);

    const response = responseHandler(statusMaker?.deleted, apiMessages?.deleted, {
      id,
    });

    console.log("expired coupon", couponDeleted);
    // Get the data from expired coupon but exclude id and timestamps
    return res.status(statusMaker.success).json(response);
  } catch (error) {
    console.error("Error in editExpiredCoupon:", error);
    return res.status(statusMaker.internalError).json(error);
  }
};

export const deleteExpiredCoupon = async (req, res) => {
  try {
    const { id } = req.query;

    // Find the expired coupon
    const expiredCoupon = await couponSchema.findOne({
      where: {
        id: id,
        status:'Expired'
      },
    });

    if (!expiredCoupon) {
      const response = responseHandler(
        statusMaker.notFound,
        "No expired coupon found with the given ID.",
        null
      );
      return res.status(statusMaker.notFound).json(response);
    }

    const deleted = await couponSchema?.destroy({
      where: { id },
    });

    const response = responseHandler(statusMaker?.deleted, apiMessages?.deleted, {
      id,
    });

    console.log("expired coupon", deleted);
    // Get the data from expired coupon but exclude id and timestamps
    return res.status(statusMaker.success).json(response);
  } catch (error) {
    console.error("Error in editExpiredCoupon:", error);
    return res.status(statusMaker.internalError).json(error);
  }
};

export const couponSearchCouponExpired = async (req, res) => {
  try {
    const { query } = req.query;
    console.log("query", query);

    const searchConditions = {
      status: "active",
      ...(query && {
        [Op.or]: [
          { code: { [Op.like]: `%${query}%` } },
          { sno: { [Op.like]: `%${query}%` } },
          { product: { [Op.like]: `%${query}%` } },
        ],
      }),
    };

    console.log("searchConditions", searchConditions);

    const couponData = await couponSchema.findAll({
      where: searchConditions,
    });
    if (checkEmptyArray(couponData)) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        []
      );
      return res.status(statusMaker.notFound).json(response);
    }

    const response = responseHandler(
      statusMaker.found,
      apiMessages.found,
      couponData
    );
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    console.error("Error during coupon search:", error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

// Fixed Upload Coupons Function

export const uploadCoupons = async (req, res) => {
  try {
    const CHUNK_SIZE = 1000;
    const results = [];
    let processedCount = 0;

    // Create a promise to handle the stream processing
    const processStream = new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", async (data) => {
          try {
            const csvData = await processRow(data);
            results.push(csvData);
            processedCount++;

            // Process in chunks when we reach the CHUNK_SIZE
            if (results.length === CHUNK_SIZE) {
              try {
                await couponSchema.bulkCreate(results);
                // Clear the results array after successful save
                results.length = 0;
              } catch (error) {
                console.error("Error saving chunk:", error);
                reject(error);
              }
            }
          } catch (error) {
            console.error("Error processing row:", error);
            reject(error);
          }
        })
        .on("end", async () => {
          try {
            // Save any remaining records
            if (results.length > 0) {
              await couponSchema.bulkCreate(results);
            }
            resolve(processedCount);
          } catch (error) {
            console.error("Error saving final chunk:", error);
            reject(error);
          }
        })
        .on("error", (error) => {
          console.error("Error reading CSV:", error);
          reject(error);
        });
    });

    // Wait for the stream to be processed
    const totalProcessed = await processStream;

    return res.status(200).send({
      success: true,
      message: `Successfully processed ${totalProcessed} records`,
      totalRecords: totalProcessed,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).send({
      success: false,
      error: error.message,
    });
  }
};
