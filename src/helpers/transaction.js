import moment from 'moment';
import { transition, point } from "../../models/index";

const generateTransactionId = (transactionCategory) => {
  const datePart = moment().format("YYYYMMDDHHmmss");
  const randomPart = Math.floor(Math.random() * 1_000_000_000)
    .toString()
    .padStart(10, "0");
  return `${transactionCategory}${datePart}${randomPart}`;
};

export const createTransaction = async ({
  customerData,
  // transactionCategory,
  transition_status,
  transition_category,
  points,
  expiryDate,
  medium = "desktop",
  sourceOfDevice = "website",
  store,
  name,
  mobile_no,
  state,
  city,
  serial_no,
  coupon_code,
  scan_manual,
}) => {
  if (!customerData?.customer_id || !customerData?.account_number) {
    throw new Error("Invalid customer data provided.");
  }

  if (!points || points <= 0) {
    throw new Error("Points must be a positive number.");
  }

  const transactionId = generateTransactionId(transition_category);
  console.log(transactionId,"transaction");

  console.log(expiryDate,"expiryDate");

  const creditAfterValue = "0";


  
const update_expiry_date = expiryDate.replace(/\//g, "-");

console.log(update_expiry_date,"expiryDate"); 
  

  const transactionData = {
    customer_Id: customerData.customer_id,
    transition_id: transactionId,
    account_number: customerData.account_number,
    transition_category: transition_category,
    transition_status,
    medium,
    point: points,
    expiry_date: update_expiry_date || "18months",
    order_id: "",
    product_detail: "",
    source_of_device: sourceOfDevice,
    store,
    name,
  mobile_no,
  state,
  city,
  serial_no,
  coupon_code,
  scan_manual,
  };

  const pointData = {
    customer_Id: customerData.customer_id,
    transition_id: transactionId,
    account_number: customerData.account_number,
    point: points,
    transition_status,
    transition_category,
    store,
    expiry_date: update_expiry_date,
    credit_after: creditAfterValue,
  };

  await Promise.all([
    transition.create(transactionData),
    point.create(pointData),
  ]);
};


// export const createTransaction = async ({
//   customerData,
//   transactionCategory = "coupon",
//   points,
//   expiryDate,
//   medium = "desktop",
//   sourceOfDevice = "rajnigandha.com",
// }) => {
//   if (!customerData?.customer_id || !customerData?.account_number) {
//     throw new Error("Invalid customer data provided.");
//   }

//   if (!points || points <= 0) {
//     throw new Error("Points must be a positive number.");
//   }

//   const transactionId = generateTransactionId(transactionCategory);
//   console.log(transactionId);
//   const creditAfterValue = "0";

//   const transactionData = {
//     customer_Id: customerData.customer_id,
//     transition_id: transactionId,
//     account_number: customerData.account_number,
//     transaction_category: transactionCategory,
//     transaction_status,
//     medium,
//     point: points,
//     expiry_date: expiryDate || "18months",
//     order_id: "",
//     product_detail: "",
//     source_of_device: sourceOfDevice,
//   };

//   const pointData = {
//     customer_Id: customerData.customer_id,
//     transition_id: transactionId, // Ensure this is passed to match the `NOT NULL` constraint
//     account_number: customerData.account_number,
//     point: points,
//     transition_status, // Set this field to avoid null errors
//     expiry_date: expiryDate,
//     credit_after: creditAfterValue,
//   };

//   await Promise.all([
//     transition.create(transactionData),
//     point.create(pointData),
//   ]);
// };



// const generateTransactionId = (transactionCategory) => {
//     const datePart = moment().format("YYYYMMDDHHmmss");
//     const randomPart = Math.floor(Math.random() * 1_000_000_000)
//       .toString()
//       .padStart(10, "0");
//     return `${transactionCategory}${datePart}${randomPart}`;
//   };
  
// export const createTransaction = async ({
//     customerData,
//     transactionCategory = "coupon",
//     points,
//     expiryDate,
//     medium = "desktop",
//     sourceOfDevice = "rajnigandha.com",
//   }) => {
//     if (!customerData?.customer_id || !customerData?.account_number) {
//       throw new Error("Invalid customer data provided.");
//     }
  
//     if (!points || points <= 0) {
//       throw new Error("Points must be a positive number.");
//     }
  
//     const transactionId = generateTransactionId(transactionCategory);
//     const creditAfterValue = "0";
  
//     const transactionData = {
//       customer_Id: customerData.customer_id,
//       transaction_id: transactionId,
//       account_number: customerData.account_number,
//       transaction_category: transactionCategory,
//       transition_status,
//       medium,
//       point: points,
//       expiry_date: expiryDate || "18months",
//       order_id: "",
//       product_detail: "",
//       source_of_device: sourceOfDevice,
//     };
  
//     const pointData = {
//       customer_Id: customerData.customer_id,
//       transaction_id: transactionId,
//       account_number: customerData.account_number,
//       point: points,
//       transaction_status,
//       expiry_date: expiryDate,
//       credit_after: creditAfterValue,
//     };
  
//     await Promise.all([
//       transition.create(transactionData),
//       point.create(pointData),
//     ]);
//   };
