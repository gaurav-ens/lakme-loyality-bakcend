import {
  // customer,
  responseHandler,
  errorHandler,
  statusMaker,
  apiMessages,
  // checkEmptyArray,
  accessSchema,
  storeHandler,
  customersNEW
} from "./index";
import Papa from 'papaparse';
import path from 'path';
import fs from 'fs/promises';
import fs1 from 'fs'
import { Op } from "sequelize";
import Sequelize from "sequelize";
import axios from "axios";
import { pipeline } from 'stream';
import { promisify } from 'util';
import { transactionNew,kajalnewCustomer2 } from "../../../models/transaction_new";
const CUSTOMER_BATCH_SIZE = 250;
const METAFIELDS_PER_CUSTOMER = 50;

const mapMetafieldsToCustomer = (metafieldEdges, customerBaseData) => {
  if (!Array.isArray(metafieldEdges)) {
    console.warn(`Invalid metafields structure for customer ${customerBaseData.customer_id}`);
    return customerBaseData;
  }

  const customerData = { ...customerBaseData };

  metafieldEdges.forEach(edge => {
    const { key, value } = edge.node || {};
    if (!key || value === undefined) return;

    switch (key) {
      case "hobby":
        customerData.hobby = value;
        break;
      case "brandtob":
        customerData.brand_tob = value;
        break;
      case "smoker":
        customerData.smoker = value;
        break;
      case "income":
        customerData.income = value;
        break;
      case "birthplace":
        customerData.birthplace = value;
        break;
      case "account_number":
        customerData.account_number = value;
        break;
      case "full_name":
        const [firstName, lastName] = value.split(" ");
        customerData.first_name = firstName || customerData.first_name;
        customerData.last_name = lastName || customerData.last_name;
        break;
      case "date_of_birth": {
        const dateValue = new Date(value);

        if (!isNaN(dateValue.getTime())) {
          // Format the date as YYYY-MM-DD
          const formattedDate = dateValue.toISOString().split('T')[0];
          customerData.date_of_birth = formattedDate;
          // console.log("Formatted Date of Birth:", customerData.date_of_birth);
        } else {
          console.warn("Invalid date format for date_of_birth:", value);
        }
        break;
      }
      case "gender":
        if (value != null) {
          customerData.gender = value;
        } else {
          customerData.gender = value;
        }

        break;
      case "mlevel":
        customerData.membership_tier = value;
        if (value) {
          customerData.membership_status = "active";
        }
        break;
      case "marital_status":
        if (value != null) {
          customerData.maritial_status = value;
        }
        else {
          customerData.maritial_status = null;
        }
        break;
      case "marriage_anniversary_date":
        customerData.marriage_anniversary = value;
        break;
      case "rajnigandha_reward_points":
        customerData.balance_point = value;
        break;
      case "Redeem Points":
        customerData.redeem_point = value;
        break;
      case "enjsince":
        customerData.engagement_since = value;
        break;
      case "user_created_date_time": {
        if (value) {
          // console.log("value-------------",value);
          const dateValue = new Date(value);
          if (!isNaN(dateValue.getTime())) {
            const registrationDate = dateValue.toLocaleDateString('en-CA');
            const registrationTime = dateValue.toLocaleTimeString('en-GB', { hour12: false });
            let time = registrationTime
            if (time == "00:00:00") {
              time = "12:00:00"
            }
            customerData.registration_date = registrationDate;
            customerData.registration_time = time;

            // console.log("Final Registration Date:", customerData.registration_date);
            // console.log("Final Registration Time:", customerData.registration_time);
          } else {
            console.warn("Invalid date format for user_created_date_time:", value);
          }
        } else {
          console.warn("Missing value for user_created_date_time");
        }
        break;
      }
      default:
        // console.log("key-------",key);
        console.log(`Unhandled metafield: ${key}`);
        break;
    }
  });

  return customerData;
};

const formatAddress = (address) => {
  if (!address) return null;
  return {
    first_name: address.firstName || '',
    last_name: address.lastName || '',
    zip: address.zip ? address.zip : null,
    country: address.country || '',
    province: address.province || '',
    city: address.city ? address.city : null,
    phone: address.phone || '',
    country_code: address.countryCodeV2 || '',
    province_code: address.provinceCode || '',
    address1: address.address1 || '',
    address2: address.address2 || '',
    formatted_area: address.formattedArea || '',
    State: address.province || '',
    Distrtict: address.city ? address.city : ''
  };
};

const fetchCustomerPage = async (shopname, access_token, cursor = null) => {
  const query = `
      query GetCustomersWithMetafields ${cursor ? '($cursor: String!)' : ''} {
        customers(first: ${CUSTOMER_BATCH_SIZE} ${cursor ? ', after: $cursor' : ''}) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              firstName
              lastName
              email
              phone
              defaultAddress {
                firstName
                lastName
                zip
                country
                province
                city
                phone
                countryCodeV2
                provinceCode
                address1
                address2
                formattedArea
              }
              metafields(first: ${METAFIELDS_PER_CUSTOMER}) {
                edges {
                  node {
                    namespace
                    key
                    value
                  }
                }
              }
            }
          }
        }
      }
    `;

  const variables = cursor ? { cursor } : undefined;

  const response = await axios({
    url: `https://${shopname}/admin/api/2025-01/graphql.json`,
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': access_token,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    data: JSON.stringify({ query, variables })
  });
  // console.log("response---------",response.data.data?.customers);

  return response.data?.data?.customers;
};

const processCustomers = (customers) => {
  return customers.edges.map(({ node: customer }) => {
    const customer_id = customer.id.split('/').pop();

    // Create base customer data
    const baseCustomerData = {
      customer_id,
      first_name: customer.firstName || '',
      last_name: customer.lastName || '',
      email: customer.email || '',
      phone_number: customer.phone || '',
      store: 'rajnigandha',
      // Spread the address fields directly into customer data
      ...formatAddress(customer.defaultAddress)
    };

    // Log the customer data for debugging
    // console.log('Processing customer:', customer_id);
    // console.log('Customer data before metafields:', baseCustomerData);

    // Process metafields and combine with base data
    const customerWithMetafields = mapMetafieldsToCustomer(
      customer.metafields?.edges || [],
      baseCustomerData
    );

    // console.log('Final customer data:', customerWithMetafields);
    return customerWithMetafields;
  });
};

const saveCustomerBatch = async (customers) => {
  const results = await Promise.allSettled(
    customers.map(async (customerData) => {
      try {
        await customersNEW.create(customerData);
        console.log(`Customer ${customerData.customer_id} saved successfully`);
        return { success: true, id: customerData.customer_id };
      } catch (error) {
        console.error(`Error saving customer ${customerData.customer_id}:`, error);
        return { success: false, id: customerData.customer_id, error: error.message };
      }
    })
  );

  return {
    succeeded: results.filter(r => r.status === 'fulfilled' && r.value.success).length,
    failed: results.filter(r => r.status === 'rejected' || !r.value.success).length
  };
};

export const syncShopifyCustomerMetafields = async (req, res) => {
  try {
    const { store } = req.query;
    if (!store) {
      return res.status(400).json({ message: 'Store query parameter is required.' });
    }

    const processedStore = await storeHandler(store);
    const storeCredentials = await accessSchema.findOne({
      where: { store: processedStore }
    });

    if (!storeCredentials) {
      return res.status(404).json({ message: 'Store credentials not found.' });
    }

    const { shopname, access_token } = storeCredentials;

    let hasNextPage = true;
    let cursor = null;
    let totalProcessed = 0;
    let totalSucceeded = 0;
    let totalFailed = 0;

    while (hasNextPage) {
      console.log(`Fetching customers batch after cursor: ${cursor}`);

      const customersPage = await fetchCustomerPage(shopname, access_token, cursor);

      if (!customersPage?.edges?.length) {
        console.log('No more customers found');
        break;
      }

      const processedCustomers = processCustomers(customersPage);
      console.log(`Processing batch of ${processedCustomers.length} customers`);

      const { succeeded, failed } = await saveCustomerBatch(processedCustomers);

      totalProcessed += processedCustomers.length;
      totalSucceeded += succeeded;
      totalFailed += failed;

      console.log(`Batch processed. Succeeded: ${succeeded}, Failed: ${failed}`);

      hasNextPage = customersPage.pageInfo.hasNextPage;
      cursor = customersPage.pageInfo.endCursor;
    }

    return res.status(200).json({
      message: 'Customer synchronization completed',
      summary: {
        total_processed: totalProcessed,
        total_succeeded: totalSucceeded,
        total_failed: totalFailed
      }
    });

  } catch (error) {
    console.error('Error in customer sync:', error);
    return res.status(500).json({
      message: 'Failed to sync customer data',
      error: error.message
    });
  }
};
export const syncPointsFromCSV = async (req, res) => {
  try {
    const { filename } = req.query;
    console.log("body-----", filename);

    if (!filename) {
      return res.status(400).json({
        message: 'Filename is required'
      });
    }

    const filePath = path.join(process.cwd(), 'uploads', filename);
    console.log('Reading file from:', filePath);

    const csvContent = await fs.readFile(filePath, 'utf-8');

    const parseResult = await new Promise((resolve) => {
      Papa.parse(csvContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (result) => resolve(result),
      });
    });

    console.log(`Found ${parseResult.data.length} records in CSV`);

    const results = {
      total: parseResult.data.length,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    for (const row of parseResult.data) {
      try {
        const refNo = row.refno?.toString();
        if (!refNo) {
          results.skipped++;
          continue;
        }

        // Find customer with exact refno match
        const customer1 = await customersNEW.findOne({
          where: { account_number: refNo }
        });

        if (!customer1) {
          results.failed++;
          results.errors.push({
            refNo,
            error: 'Customer not found in database'
          });
          continue;
        }

        const csvTbal = row.tbal ? parseInt(row.tbal, 10) : 0;
        const csvBalance = row.balance ? parseInt(row.balance, 10) : 0;
        const csvExpiry = row.expiry_point ? parseInt(row.expiry_point, 10) : 0;
        const newRedeemPoints = csvTbal - csvBalance;

        console.log(`Updating points for customer ${refNo}:`, {
          total_earned: csvTbal,
          current_balance: csvBalance,
          redeemed: newRedeemPoints,
          expiry: csvExpiry
        });
        await customer1.update({
          earned_point: csvTbal.toString(),
          balance_point: csvBalance.toString(),
          redeem_point: newRedeemPoints.toString(),
          expiry_point: csvExpiry.toString(),
        });
        results.succeeded++;

      } catch (error) {
        console.error('Error processing row:', error);
        results.failed++;
        results.errors.push({
          refNo: row.refno,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      message: 'Points synchronization completed',
      summary: {
        total_records: results.total,
        updated: results.succeeded,
        not_found: results.failed,
        skipped: results.skipped,
        errors: results.errors
      }
    });
  } catch (error) {
    console.error('Error in points sync:', error);
    return res.status(500).json({
      message: 'Failed to sync points data',
      error: error.message,
      stack: error.stack
    });
  }
};

export const customerName = async (req, res) => {
  try {
    const { start_date, end_date, limit = 500, offset = 0, store } = req.query;
    const filter = {};

    if (start_date || end_date) {
      filter.createdAt = {};
      if (start_date) {
        filter.createdAt[Sequelize.Op.gte] = new Date(start_date); // Start of the start_date
      }
      if (end_date) {
        const endDateWithTime = new Date(end_date);
        endDateWithTime.setHours(23, 59, 59, 999); // End of the end_date
        filter.createdAt[Sequelize.Op.lte] = endDateWithTime;
      }
    }

    if (store) {
      filter.store = store;
    }

    const { count, rows } = await customersNEW.findAndCountAll({
      where: filter,
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    if (!rows.length) {
      return res.status(404).json({
        message: "No transactions found",
        status: 404,
      });
    }
    const formattedRows = rows.map((customer) => {
      return Object.fromEntries(
        Object.entries(customer.toJSON()).map(([key, value]) => [
          key,
          value === "NULL" ? null : value,
        ])
      );
    });
    return res.json({
      message: "Transactions retrieved successfully",
      data: formattedRows,
      totalRecords: count,
      status: 200,
    });
  } catch (error) {
    console.error("Error retrieving transactions:", error);
    return res.status(500).json({
      message: "An error occurred while retrieving transactions",
      error,
    });
  }
};

export const searchApiCustomer = async (req, res) => {
  try {
    const { search_value, store } = req.query;

    if (!search_value || !store) {
      return res.status(400).json({
        message:
          "Please provide both a search value and a store name to find customers.",
        status: 400,
      });
    }

    // const sanitizedSearchValue = search_value.replace(/\D/g, "");
    // const customers = await customersNEW.findAll({
    //   where: {
    //     store: store,
    //     [Op.or]: [
    //       { account_number: search_value },
    //       Sequelize.where(
    //         Sequelize.fn(
    //           "REPLACE",
    //           Sequelize.fn(
    //             "REPLACE",
    //             Sequelize.fn(
    //               "REPLACE",
    //               Sequelize.fn(
    //                 "REPLACE",
    //                 Sequelize.col("phone_number"),
    //                 "+",
    //                 ""
    //               ),
    //               " ",
    //               ""
    //             ),
    //             "-",
    //             ""
    //           ),
    //           "",
    //           ""
    //         ),
    //         { [Op.like]: `%${sanitizedSearchValue}%` }
    //       ),

    //       {
    //         first_name: Sequelize.where(
    //           Sequelize.fn("LOWER", Sequelize.col("first_name")),
    //           "LIKE",
    //           `%${search_value.toLowerCase()}%`
    //         ),
    //       },

    //       {
    //         last_name: Sequelize.where(
    //           Sequelize.fn("LOWER", Sequelize.col("last_name")),
    //           "LIKE",
    //           `%${search_value.toLowerCase()}%`
    //         ),
    //       },
    //     ],
    //   },
    // });
    // [Op.or]: [
    //   { phone_number: { [Op.like]: `%${search}%` } },
    //   { accountNumber: { [Op.like]: `%${search}%` } },
    // ]
    const customers = await customersNEW.findAll({
      where: {
        store: store, [Op.or]: [
          { phone_number: { [Op.like]: `%${search_value}%` } },
          { account_number: { [Op.like]: `%${search_value}%` } },
        ]
      }
    })

    if (!customers || customers.length === 0) {
      return res.status(404).json({
        message:
          "No customers found matching the provided search value in the specified store.",
        status: 404,
      });
    }

    return res.status(200).json({
      message: "Customers retrieved successfully.",
      data: customers,
      status: 200,
    });
  } catch (error) {
    console.error("Error retrieving customers:", error);
    return res.status(500).json({
      message: "An error occurred while searching for customers.",
    });
  }
}

const BATCH_SIZE = 500;

async function fetchCustomersInBatches(customerIds) {
  const customerMap = new Map();
  console.log(`Fetching customer details in batches of ${BATCH_SIZE}...`);
  const customerIdArray = [...customerIds];
  for (let i = 0; i < customerIdArray.length; i += BATCH_SIZE) {
    const batch = customerIdArray.slice(i, i + BATCH_SIZE);
    console.log(`Fetching batch ${i / BATCH_SIZE + 1} (${batch.length} records)...`);

    try {
      const customers = await customersNEW.findAll({
        where: { account_number: batch },
        attributes: ['account_number', 'customer_id', 'first_name', 'last_name', 'phone_number', 'State', 'city']
      });

      customers.forEach(cust => {
        customerMap.set(cust.account_number, cust);
      });

    } catch (error) {
      console.error(`Error fetching batch ${i / BATCH_SIZE + 1}:`, error.message);
    }
  }

  console.log(`Total customers fetched: ${customerMap.size}`);
  return customerMap;
}

export const syncTransaction = async (req, res) => {
  try {
    const { filename } = req.query;
    if (!filename) return res.status(400).json({ message: "Filename is required" });

    const filePath = path.join(process.cwd(), "uploads", filename);
    if (!fs1.existsSync(filePath)) return res.status(404).json({ message: "File not found" });

    const fileContent = fs1.readFileSync(filePath, "utf-8");

    console.log("Starting CSV Parsing...");

    const transactions = [];
    const customerIds = new Set();
    const failedRecords = []; 

    Papa.parse(fileContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      complete: async (result) => {
        console.log(`Total rows parsed: ${result.data.length}`);
        result.data.forEach((row) => {
          if (row.custid) customerIds.add(row.custid);
        });

        console.log(`Fetching details for ${customerIds.size} customers in batches...`);
        const customerMap = await fetchCustomersInBatches(customerIds);

        let insertedCount = 0;
        let skippedCount = 0;
        for (const row of result.data) {
          if (!row.custid) {
            skippedCount++;
            continue;
          }
        
          try {
            if (row.transaction_id) {
              const existingTransaction = await transactionNew.findOne({
                where: { transition_id: row.transaction_id },
              });
        
              if (existingTransaction) {
                skippedCount++;
                continue; 
              }
            }
            const customer = customerMap.get(row.custid);
            let transitionCategory = row.source_name;
            if (transitionCategory == "Coupon") transitionCategory = "Retail Coupon";
            if (transitionCategory == "REDEEM PRODUCTS") transitionCategory = "Redeem_point";
            if (transitionCategory == "REG") transitionCategory = "register";
            if (transitionCategory == "REDEEM E-VOUCHERS") transitionCategory = "Voucher";
            if (transitionCategory == "BONUS") transitionCategory = "customer_benefits";
            if (transitionCategory == "PAY WITH REWARD") transitionCategory = "paywithrewards";
        
            transactions.push({
              customer_Id: customer?.customer_id || null,
              transition_id: row.transaction_id || null, 
              account_number: row.custid,
              transition_category: transitionCategory,
              transition_status: row.transaction_type,
              point: row.points ? String(row.points) : "0",
              order_id: row.order_id ? String(row.order_id) : null,
              product_detail: row.product_id ? String(row.product_id) : null,
              expiry_date: row.expire_date ? String(row.expire_date) : null,
              credit_days: null,
              createdAt: row.created_dt ? String(row.created_dt) : null,
              store: "rajnigandha",
              name: customer ? `${customer.first_name} ${customer.last_name}` : "Unknown",
              mobile_no: customer?.phone_number || null,
              state: customer?.State || null,
              city: customer?.city || null,
            });
        
            if (transactions.length >= BATCH_SIZE) {
              await insertBatch(transactions, failedRecords);
              insertedCount += transactions.length;
              transactions.length = 0;
            }
          } catch (error) {
            console.error(`Error processing row with transaction_id ${row.transaction_id}:`, error.message);
            failedRecords.push({ row, error: error.message });
          }
        }

        if (transactions.length > 0) {
          await insertBatch(transactions, failedRecords);
          insertedCount += transactions.length;
        }

        console.log(`CSV Processing Complete! Inserted: ${insertedCount}, Skipped: ${skippedCount}, Failed: ${failedRecords.length}`);
        return res.status(200).json({
          message: "Transaction sync completed",
          total_records: result.data.length,
          inserted: insertedCount,
          skipped: skippedCount,
          failed: failedRecords.length,
          failed_records: failedRecords,
        });
      },
    });
  } catch (error) {
    console.error("Error syncing transactions:", error);
    return res.status(500).json({ message: "Failed to sync transactions", error: error.message });
  }
};

async function insertBatch(transactions, failedRecords) {
  try {
    await transactionNew.bulkCreate(transactions, {
      validate: false, 
      individualHooks: false, 
    });
    console.log(`Inserted ${transactions.length} records`);
  } catch (error) {
    console.error("Bulk Insert Error:", error);
    transactions.forEach((transaction) => {
      failedRecords.push({ row: transaction, error: "Bulk insert error" });
    });
  }
}

export const getMigratedTransactions = async (req, res) => {
  try {
    const { store } = req.query
    const processedStore = await storeHandler(store)
    const data = await transactionNew.findAll({ where: { store: processedStore } ,limit:500,order: [["createdAt", "DESC"]],})
    const rep = responseHandler(statusMaker.found, apiMessages.found, data)
    return res.status(statusMaker.found).json(rep)
  } catch (error) {
    const rep = errorHandler(error.message)
    return res.status(statusMaker.internalError).json(rep)
  }
}

// export const matchTransaction = async (req, res) => {
//   try {
//     let matchedTransaction = [], mismatchTransaction = [];

//     // Fetch customers with their points details
//     const findCustomers = await kajalnewCustomer2.findAll({
//       limit: 500,
//       where: { store: 'rajnigandha' },
//       attributes: ['customer_id', 'account_number', 'earned_point', 'balance_point', 'redeem_point']
//     });

//     for (let customerdata of findCustomers) {
//       // Fetch all transactions related to the customer's account_number
//       const transactions = await transactionNew.findAll({
//         where: { account_number: customerdata.account_number }
//       });

//       let balance = 0; // Calculated balance from transactions
//       let redeemPoint = 0;
//       let earnedPoint = 0; // New earned points tracker
//       let totalTransactionPoints = 0; 

//       for (let transaction of transactions) {
//         let points = Number(transaction.point) || 0;
//         totalTransactionPoints += points;

//         switch (transaction.transition_status.toLowerCase()) {
//           case "credit":
//             balance += points;
//             earnedPoint += points;  // Earned points update
//             break;
//           case "debit":
//             balance -= points;
//             break;
//           case "refund":
//             balance += points;
//             break;
//           case "redeem":
//             redeemPoint += points;
//             break;
//           default:
//             console.log(`Unknown transaction type: ${transaction.transition_status}`);
//             break;
//         }
//       }

//       // Check if balance, redeem, and earned points match
//       if (
//         Number(customerdata.balance_point) === balance &&
//         Number(customerdata.redeem_point) === redeemPoint &&
//         Number(customerdata.earned_point) === earnedPoint
//       ) {
//         matchedTransaction.push({
//           account_number: customerdata.account_number,
//           balance_point: customerdata.balance_point,
//           redeem_point: customerdata.redeem_point,
//           earned_point: customerdata.earned_point
//         });
//       } else {
//         mismatchTransaction.push({
//           account_number: customerdata.account_number,
//           stored_balance_point: customerdata.balance_point,
//           calculated_balance_point: balance,
//           stored_redeem_point: customerdata.redeem_point,
//           calculated_redeem_point: redeemPoint,
//           stored_earned_point: customerdata.earned_point,
//           calculated_earned_point: earnedPoint,
//           total_transaction_points: totalTransactionPoints
//         });
//       }
//     }

//     const rep = responseHandler(statusMaker.success, "Customer transactions processed successfully", {
//       matchedTransaction,
//       mismatchTransaction,
//       matchCount: matchedTransaction.length,
//       mismatchCount: mismatchTransaction.length
//     });

//     return res.status(statusMaker.success).json(rep);
//   } catch (error) {
//     console.error("Error processing transactions:", error.message);
//     const rep = errorHandler(error.message);
//     return res.status(statusMaker.internalError).json(rep);
//   }
// };

const matchTransactions = async () => {
  try {
    console.log("Starting transaction matching...");

    let matchedTransaction = [], mismatchTransaction = [];

    // Fetch customers with their points details
    const findCustomers = await kajalnewCustomer2.findAll({
      where: { store: 'rajnigandha' },
      attributes: ['customer_id', 'account_number', 'earned_point', 'balance_point', 'redeem_point']
    });

    console.log(`Fetched ${findCustomers.length} customers`);

    for (let customerdata of findCustomers) {
      // Fetch all transactions related to the customer's account_number
      const transactions = await transactionNew.findAll({
        where: { account_number: customerdata.account_number }
      });

      let balance = 0; 
      let redeemPoint = 0;
      let earnedPoint = 0; 
      let totalTransactionPoints = 0; 

      for (let transaction of transactions) {
        let points = Number(transaction.point) || 0;
        totalTransactionPoints += points;

        switch (transaction.transition_status.toLowerCase()) {
          case "credit":
            balance += points;
            earnedPoint += points;  // Earned points update
            break;
          case "debit":
            balance -= points;
            break;
          case "refund":
            balance += points;
            break;
          case "redeem":
            redeemPoint += points;
            break;
          default:
            console.log(`Unknown transaction type: ${transaction.transition_status}`);
            break;
        }
      }

      // Check if balance, redeem, and earned points match
      if (
        Number(customerdata.balance_point) === balance &&
        Number(customerdata.redeem_point) === redeemPoint &&
        Number(customerdata.earned_point) === earnedPoint
      ) {
        matchedTransaction.push({
          account_number: customerdata.account_number,
          balance_point: customerdata.balance_point,
          redeem_point: customerdata.redeem_point,
          earned_point: customerdata.earned_point
        });
      } else {
        mismatchTransaction.push({
          account_number: customerdata.account_number,
          stored_balance_point: customerdata.balance_point,
          calculated_balance_point: balance,
          stored_redeem_point: customerdata.redeem_point,
          calculated_redeem_point: redeemPoint,
          stored_earned_point: customerdata.earned_point,
          calculated_earned_point: earnedPoint,
          total_transaction_points: totalTransactionPoints
        });
      }
    }

    console.log("Transaction Matching Completed!");
    console.log(`Matched Transactions: ${matchedTransaction.length}`);
    console.log(`Mismatched Transactions: ${mismatchTransaction.length}`);
    try {
      fs1.writeFileSync(
        "transactionResults.json",
        JSON.stringify({ matchedTransaction:matchedTransaction, mismatchTransaction: mismatchTransaction,
          matchCount:matchedTransaction.length,
          mismatchCount:mismatchTransaction.length
         }, null, 2)
      );
      console.log("Results saved successfully!");
    } catch (error) {
      console.error("Error writing to file:", error.message);
    }

    console.log("Results saved to transactionResults.json");

  } catch (error) {
    console.error("Error processing transactions:", error.message);
  }
};

// Run the function
// matchTransactions();

export const searchTransactionData = async (req, res) => {
  try {
    const { search, store } = req.query
    const processedStore = await storeHandler(store)
    if (!search) {
      const rep = responseHandler(statusMaker.badRequest, "Missing required fields")
      return res.status(statusMaker.badRequest).json(rep)
    }
    const searchData = await transactionNew.findAll({
      where: {
        store: processedStore,
        [Op.or]: [
          { account_number: { [Op.like]: `%${search}%` } },
          { mobile_no: { [Op.like]: `%${search}%` } },
          { name: { [Op.like]: `%${search}%` } },
          { transition_id: { [Op.like]: `%${search}%` } },
        ]
      },
      limit:500
    })

    const resp = responseHandler(statusMaker.success, apiMessages.found, searchData)
    return res.status(statusMaker.success).json(resp)

  } catch (error) {
    const rep = errorHandler(error.message)
    return res.status(statusMaker.internalError).json(rep)
  }
}

export const filterTransactionData = async(req,res)=>{
  try {
    const {startDate,endDate,store} = req.query
    const processedStore = await storeHandler(store)
    let filter = {store:processedStore}
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt[Sequelize.Op.gte] = new Date(startDate); // Start of the start_date
      }
      if (endDate) {
        const endDateWithTime = new Date(endDate);
        endDateWithTime.setHours(23, 59, 59, 999); // End of the end_date
        filter.createdAt[Sequelize.Op.lte] = endDateWithTime;
      }
    }

    const filteredData = await transactionNew.findAll({
      where: filter
    })
    const rep = responseHandler(statusMaker.success,apiMessages.found,filteredData)
    return res.status(statusMaker.success).json(rep)
  } catch (error) {
    const rep = errorHandler(error.message)
    return res.status(statusMaker.internalError).json(rep)
  }
}