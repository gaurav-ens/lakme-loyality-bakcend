import {
  responseHandler,
  errorHandler,
  statusMaker,
  apiMessages,
  customer,
  tier_mangement,
  RuleSetModified,
  cmm,
  transition,
  point,
  registration,
  // customerImport,
  customerPointCalculation,
  accessSchema,
  storeHandler,
  // customersNEW,
  config
} from "./index";
import Sequelize from "sequelize";
import { handleNotifications } from "../../helpers/smstemplate";
import { Op } from "sequelize";
import axios from "axios";
import moment from "moment";
import { addMonths } from "date-fns";
import { customerTransaction } from "../../utils/constant";
// const shopName = "lakmestaging.myshopify.com";
// import { response } from "express";
// import multer from "multer";
// import csv from "csv-parser";
// import fs, { stat } from "fs";

// const upload = multer({ dest: 'uploads/' });

// const otpSMS = (phoneNo, first_name) => {
//   const userName = "dsgroup.api";
//   const userPassword = "dsgroup@$123";
//   const userFrom = "ReShop";
//   const userPhone = phoneNo.replace(/^\+91/, "");

//   //const userMessage = `Dear ${account_number}, 555555 is the OTP to reset your credentials and is valid for 666666 minutes. For further assistance, please contact system administrator. Team DiSha By DS Group`;
//   const userMessage = `Dear ${first_name}, Welcome to Rajnigandha Reward Program - An exclusive loyalty program for Rajnigandha connoisseurs to enjoy the distinctive rewards - DS Group`;

//   console.log("userMessage", userMessage);

//   const url = `https://api2.growwsaas.com/fe/api/v1/multiSend?username=${userName}&password=${userPassword}&unicode=false&from=${userFrom}&to=${userPhone}&text=${encodeURIComponent(
//     userMessage
//   )}`;
//   console.log("userPhone", userPhone);
//   console.log("url", url);

//   let config = {
//     method: "post",
//     maxBodyLength: Infinity,
//     url: url,
//     headers: {
//       "Content-Type": "application/json",
//     },
//   };

//   axios
//     .request(config)
//     .then((response) => {
//       console.log("API call was successful. Response data:", response.data);
//     })
//     .catch((error) => {
//       console.log("Error:", error);
//     });
// };

const generateTransitionId = (transitionCategory) => {
  const datePart = moment().format("YYYYMMDDHHmmss");
  const randomPart = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(10, "0");
  return `${transitionCategory}${datePart}${randomPart}`;
};

// const createMetafield = async (customerId, account_number, metafieldsData) => {
//   try {
//     // Prepare the metafields data for the mutation
//     const metafields = [
//       {
//         namespace: "custom",
//         key: "account_number",
//         value: account_number,
//         type: "single_line_text_field",
//         ownerId: `gid://shopify/Customer/${customerId}`,
//       },
//       {
//         namespace: "custom",
//         key: "tier",
//         value: metafieldsData.membership_tier,
//         type: "single_line_text_field",
//         ownerId: `gid://shopify/Customer/${customerId}`,
//       },
//       {
//         namespace: "custom",
//         key: "rajnigandha_reward_points",
//         value: metafieldsData.rajnigandha_point.toString(),
//         type: "single_line_text_field",
//         ownerId: `gid://shopify/Customer/${customerId}`,
//       },
//     ];

//     const data = JSON.stringify({
//       query: `
//         mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
//           metafieldsSet(metafields: $metafields) {
//             metafields {
//               key
//               namespace
//               value
//               createdAt
//               updatedAt
//             }
//             userErrors {
//               field
//               message
//               code
//             }
//           }
//         }
//       `,
//       variables: { metafields },
//     });

//     const configRes = {
//       method: "post",
//       maxBodyLength: Infinity,
//       url: "https://lakmestaging.myshopify.com/admin/api/2024-07/graphql.json",
//       headers: {
//         "X-Shopify-Access-Token":  config.shopify_token,
//         "Content-Type": "application/json",
//       },
//       data,
//     };

//     const response = await axios.request(configRes);
//     console.log("Metafields created successfully:", response.data);
//     return response.data;
//   } catch (error) {
//     console.error("Error creating metafields:", error);
//     throw new Error("Failed to create metafields");
//   }
// };

function parseJSONField(field) {
  if (typeof field === "string") {
    try {
      return JSON.parse(field);
    } catch (error) {
      console.warn("Error parsing JSON field:", error);
      return field;
    }
  }
  return field;
}

export const getActiveRules = async () => {
  try {
    const ruleSets = await RuleSetModified.findAll();
    const activeRules = {};

    ruleSets.forEach((ruleSet) => {
      const ruleTypes = [
        "point_conversion_online_purchase",
        "point_conversion_based_on_sku",
        "point_conversion_based_on_category",
        "bonus_point",
        "coupon",
        "twox_reward_online",
        "twox_reward_offline",
        "campaign",
        "registration",
      ];

      ruleTypes.forEach((ruleType) => {
        const ruleData = parseJSONField(ruleSet[ruleType]);
        if (
          ruleData &&
          ruleData.status === "active" &&
          Array.isArray(ruleData.value)
        ) {
          activeRules[ruleType] = ruleData.value; // Directly assign the array if it exists
        }
      });
    });
    return activeRules;
  } catch (error) {
    console.error("Error fetching active rules:", error.message);
    throw new Error("Error fetching active rules");
  }
};

// export const customerRegistration = async (req, res) => {
//   try {
//     const {
//       id: customer_id,
//       email,
//       first_name,
//       last_name,
//       phone,
//       default_address,
//     } = req.body;

//     console.log("customerId:", customer_id);
//     const customerIdString = String(customer_id);

//     const existingCustomer = await customer.findOne({
//       where: { customer_id: customerIdString },
//     });
//     if (existingCustomer) {
//       return res.status(400).json({
//         message: "Customer already exists",
//         customer: existingCustomer,
//       });
//     }

//     const registrationData = await registration.findOne({ where: { id: 1 } });
//     if (!registrationData) {
//       return res.status(404).json({ message: "Registration data not found" });
//     }

//     const points = parseInt(registrationData.point, 10) || 0;
//     const creditAfter = parseInt(registrationData.credit_after, 10) || 0;
//     const expiryDate = registrationData.expiry_date || null;

//     // const calculateExpiryDate = (expiryDate) => {
//     //   const [value, unit] = expiryDate.split(" ");
//     //   const duration = parseInt(value, 10);
//     //   if (isNaN(duration) || (unit !== "days" && unit !== "months")) {
//     //     throw new Error("Invalid expiry date format. Use 'X days' or 'X months'.");
//     //   }

//     //   return moment().add(duration, unit).format("YYYY-MM-DD");
//     // };

//     // // Calculate the new expiry date
//     // const newExpiryDate = calculateExpiryDate(expiryDate);

//     const expiresOn = creditAfter === 0 ? expiryDate : null;
//     const account_number = `RC${customer_id}`;
//     const firstName = first_name || default_address?.first_name;
//     const lastName = last_name || default_address?.last_name;
//     const phoneNumber = phone || default_address?.phone;
//     const todayDate = moment().format("YYYY-MM-DD");
//     const todayTime = moment().format("HH:mm:ss");

//     const newCustomer = await customer.create({
//       account_number,
//       customer_id,
//       phone_number: phoneNumber,
//       email,
//       first_name: firstName,
//       last_name: lastName,
//       address1: default_address?.address1,
//       address2: default_address?.address2,
//       city: default_address?.city,
//       country: default_address?.country,
//       zip: default_address?.zip,
//       State:default_address?.province,
//       Distrtict:default_address?.city,
//       earned_point: creditAfter === 0 ? points : 0,
//       redeem_point: 0,
//       expiry_point: 0,
//       balance_point: creditAfter === 0 ? points : 0,
//       membership_tier: "welcome",
//       membership_status: "active",
//       registration_date: todayDate,
//       registration_time: todayTime,
//       store: "rajnigandha",
//     });

//     const transitionCategory = "register";
//     const transitionId = generateTransitionId(transitionCategory);
//     const transitionData = {
//       customer_Id: customer_id,
//       transition_id: transitionId,
//       account_number,
//       transition_category: transitionCategory,
//       transition_status: creditAfter == 0 ? "credit" : "hold",
//       medium: "desktop",
//       point: points,
//       expiry_date: expiresOn,
//       credit_days: creditAfter,
//       order_id: "",
//       product_detail: "",
//       store: "rajnigandha",
//       note: "registration",
//     };

//     const pointData = {
//       customer_Id: customer_id,
//       transition_id: transitionId,
//       account_number,
//       point: points,
//       store: "rajnigandha",
//       transition_status: creditAfter == 0 ? "credit" : "hold",
//       expiry_date: expiresOn,
//       credit_after: creditAfter,
//       note: "registration",
//     };

//     const [newTransition, newPoint] = await Promise.all([
//       transition.create(transitionData),
//       point.create(pointData),
//     ]);

//     const metafieldData = {
//       membership_tier: "welcome",
//       rclupoint: creditAfter == 0 ? "0" : points.toString(),
//       rajnigandha_point: creditAfter == 0 ? points.toString() : "0",
//     };

//     await createMetafield(customer_id, account_number, metafieldData);

//     // Send OTP
//     otpSMS(phoneNumber, first_name);

//     const response = responseHandler(statusMaker.created, apiMessages.create, {
//       customer: newCustomer,
//       transition: newTransition,
//       point: newPoint,
//     });
//     return res.status(statusMaker.created).json(response);
//   } catch (error) {
//     console.error("Error during customer registration:", error);
//     const response = errorHandler(error);
//     return res.status(statusMaker.internalError).json(response);
//   }
// };

// export const customerRegistration = async (req, res) => {
//   try {
//     const {
//       id: customer_id,
//       email,
//       first_name,
//       last_name,
//       phone,
//       default_address,
//     } = req.body;

//     console.log("customerId:", customer_id);
//     const customerIdString = String(customer_id);

//     // Check if the customer already exists
//     const existingCustomer = await customer.findOne({
//       where: { customer_id: customerIdString },
//     });
//     if (existingCustomer) {
//       return res.status(400).json({
//         message: "Customer already exists",
//         customer: existingCustomer,
//       });
//     }

//     // Retrieve registration data
//     const registrationData = await registration.findOne({ where: { id: 1 } });
//     if (!registrationData) {
//       return res.status(404).json({ message: "Registration data not found" });
//     }

//     const points = parseInt(registrationData.point, 10) || 0;
//     const creditAfter = parseInt(registrationData.credit_after, 10) || 0;
//     const expiryDate = registrationData.expiry_date || null;
//     const expiresOn = creditAfter === 0 ? expiryDate : null;
//     const expiry_notes=registrationData.remarks || null

//     // Prepare customer data
//     const account_number = `RC${customer_id}`;
//     const firstName = first_name || default_address?.first_name;
//     const lastName = last_name || default_address?.last_name;
//     const phoneNumber = phone || default_address?.phone;
//     const todayDate = moment().format("YYYY-MM-DD");
//     const todayTime = moment().format("HH:mm:ss");

//     // Create new customer
//     const newCustomer = await customer.create({
//       account_number,
//       customer_id,
//       phone_number: phoneNumber,
//       email,
//       first_name: firstName,
//       last_name: lastName,
//       address1: default_address?.address1,
//       address2: default_address?.address2,
//       city: default_address?.city,
//       country: default_address?.country,
//       zip: default_address?.zip,
//       State: default_address?.province,
//       Distrtict: default_address?.city,
//       earned_point: 0,
//       redeem_point: 0,
//       expiry_point: 0,
//       balance_point: 0,
//       membership_tier: "welcome",
//       membership_status: "active",
//       registration_date: todayDate,
//       registration_time: todayTime,
//       store: "rajnigandha",
//     });

//     // Handle transition logic
//     let transition_status;
//     if (points === 0) {
//       transition_status = "credit";
//     } else if (creditAfter === 0) {
//       // Credit transition immediately
//       transition_status = "credit";
//       await customer.update(
//         {
//           earned_point: points,
//           redeem_point: 0,
//           expiry_point: 0,
//           balance_point: points,
//         },
//         { where: { customer_id: customerIdString } }
//       );
//     } else {
//       // Hold transition if creditAfter > 0
//       transition_status = "hold";

//     }

//     const transitionCategory = "register";
//     const transitionId = generateTransitionId(transitionCategory);
//     const transitionData = {
//       customer_Id: customer_id,
//       transition_id: transitionId,
//       account_number,
//       transition_category: transitionCategory,
//       transition_status,
//       medium: "desktop",
//       point: points,
//       expiry_date: expiryDate,
//       credit_days: creditAfter,
//       order_id: "",
//       product_detail: "",
//       store: "rajnigandha",
//       note:expiry_notes,
//     };

//     const pointData = {
//       customer_Id: customer_id,
//       transition_id: transitionId,
//       account_number,
//       point: points,
//       store: "rajnigandha",
//       transition_status,
//       expiry_date: expiryDate,
//       credit_after: creditAfter,
//       note:expiry_notes,
//     };

//     // Create transition and point data
//     const [newTransition, newPoint] = await Promise.all([
//       transition.create(transitionData),
//       point.create(pointData),
//     ]);

//     // Create metafield if points are credited
//     if (transition_status === "credit") {
//       const metafieldData = {
//         membership_tier: "welcome",
//         rclupoint: "0",
//         rajnigandha_point: points.toString(),
//       };

//       await createMetafield(customer_id, account_number, metafieldData);
//     }

//     // Send OTP
//     otpSMS(phoneNumber, first_name);

//     // Return response
//     const response = responseHandler(statusMaker.created, apiMessages.create, {
//       customer: newCustomer,
//       transition: newTransition,
//       point: newPoint,
//     });
//     return res.status(statusMaker.created).json(response);
//   } catch (error) {
//     console.error("Error during customer registration:", error);
//     const response = errorHandler(error);
//     return res.status(statusMaker.internalError).json(response);
//   }
// };

export const customerRegistration = async (req, res) => {
  try {
    const {
      id: customer_id,
      email,
      first_name,
      last_name,
      phone,
      default_address,
    } = req.body;

    console.log("customerId:", customer_id);
    const customerIdString = String(customer_id);

    // Check if the customer already exists
    const existingCustomer = await customer.findOne({
      where: { customer_id: customerIdString },
    });
    if (existingCustomer) {
      return res.status(400).json({
        message: "Customer already exists",
        customer: existingCustomer,
      });
    }

    // Retrieve registration data
    const registrationData = await registration.findOne({ where: { id: 1 } });
    if (!registrationData) {
      return res.status(404).json({ message: "Registration data not found" });
    }

    const points = parseInt(registrationData.point, 10) || 0;
    const creditAfter = parseInt(registrationData.credit_after, 10) || 0;
    const expiryDate = registrationData.expiry_date || null;
    // const expiresOn = creditAfter === 0 ? expiryDate : null;
    const expiry_notes = registrationData.remarks || null;

    // Prepare customer data
    const account_number = `RC${customer_id}`;
    const firstName = first_name || default_address?.first_name;
    const lastName = last_name || default_address?.last_name;
    const phoneNumber = phone || default_address?.phone;
    const todayDate = moment().format("YYYY-MM-DD");
    const todayTime = moment().format("HH:mm:ss");

    // Create new customer
    const newCustomer = await customer.create({
      account_number,
      customer_id,
      phone_number: phoneNumber,
      email,
      first_name: firstName,
      last_name: lastName,
      address1: default_address?.address1,
      address2: default_address?.address2,
      city: default_address?.city,
      country: default_address?.country,
      zip: default_address?.zip,
      State: default_address?.province,
      Distrtict: default_address?.city,
      earned_point: 0,
      redeem_point: 0,
      expiry_point: 0,
      balance_point: 0,
      membership_tier: "welcome",
      membership_status: "active",
      registration_date: todayDate,
      registration_time: todayTime,
      store: "lakme",
    });

    // Handle transition logic
    let transition_status;
    if (points === 0) {
      transition_status = "credit";
    } else if (creditAfter === 0) {
      // Credit transition immediately
      transition_status = "credit";
      await customer.update(
        {
          earned_point: points,
          redeem_point: 0,
          expiry_point: 0,
          balance_point: points,
        },
        { where: { customer_id: customerIdString } }
      );
    } else {
      // Hold transition if creditAfter > 0
      transition_status = "hold";
    }

    const transitionCategory = "register";
    const transitionId = generateTransitionId(transitionCategory);
    const transitionData = {
      customer_Id: customer_id,
      transition_id: transitionId,
      account_number,
      transition_category: transitionCategory,
      transition_status,
      medium: "desktop",
      point: points,
      expiry_date: expiryDate,
      credit_days: creditAfter,
      order_id: "",
      product_detail: "",
      store: "lakme",
      note: expiry_notes,
      name: firstName,
      source_of_device: "website",
      mobile_no: phoneNumber,
      state: default_address?.province,
      city: default_address?.city,
      serial_no: "",
      coupon_code: "",
      scan_manual: "",
    };

    const pointData = {
      customer_Id: customer_id,
      transition_id: transitionId,
      account_number,
      point: points,
      store: "lakme",
      transition_status,
      expiry_date: expiryDate,
      credit_after: creditAfter,
      note: expiry_notes,
    };

    // Create transition and point data
    const [newTransition, newPoint] = await Promise.all([
      transition.create(transitionData),
      point.create(pointData),
    ]);

    // Create metafield regardless of transition_status
    // const metafieldData = {
    //   membership_tier: "welcome",
    //   rclupoint: "0",
    //   rajnigandha_point: points.toString(),
    // };

    // await createMetafield(customer_id, account_number, metafieldData);

    // Send OTP
    // otpSMS(phoneNumber, first_name);

    // Return response
    const response = responseHandler(statusMaker.created, apiMessages.create, {
      customer: newCustomer,
      transition: newTransition,
      point: newPoint,
    });
    return res.status(statusMaker.created).json(response);
  } catch (error) {
    console.error("Error during customer registration:", error);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const customerUpdate = async (req, res) => {
  try {
    const { id, customer_id, store } = req.query;
    const {
      phone_number,
      email,
      first_name,
      last_name,
      date_of_birth,
      address1,
      address2,
      membership_tier,
      zip,
      gender,
      status,
    } = req.body;
    const processedStore = await storeHandler(store);
    const existimgCustomerdata = await customer.findOne({
      where: { id, store: processedStore, customer_id },
    });

    if (!existimgCustomerdata) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existimgCustomerdata
      );
      return res.status(statusMaker.notFound).json(response);
    }
    const updatedModule = await customer.update(
      {
        phone_number,
        email,
        first_name,
        last_name,
        date_of_birth,
        address1,
        address2,
        membership_tier,
        zip,
        gender,
        status,
      },
      {
        where: { id, store: processedStore, customer_id },
      }
    );
    const storeCredentials = await accessSchema.findOne({
      where: { store: processedStore },
    });

    if (!storeCredentials) {
      return res.status(statusMaker.notFound).json({
        message: "Store credentials not found.",
      });
    }

    const { shopname, access_token } = storeCredentials;
    const shopifyResponse = await axios({
      url: `https://${shopname}/admin/api/2024-10/customers/${customer_id}.json`,
      method: "PUT",
      headers: {
        "X-Shopify-Access-Token": access_token,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      data: {
        customer: {
          id: customer_id,
          email,
          first_name,
          last_name,
          phone: phone_number,
          addresses: [
            {
              address1,
              address2,
              zip,
            },
          ],
          tags: membership_tier,
        },
      },
    });

    // Respond with success
    const response = responseHandler(statusMaker.updated, apiMessages.update, {
      databaseUpdate: updatedModule,
      shopifyUpdate: shopifyResponse.data,
    });
    res.status(statusMaker.updated).json(response);
  } catch (error) {
    console.error("Error during customer update:", error);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

// export const customerRegistration = async (req, res) => {
//   try {
//     const {
//       id: customer_id,
//       email,
//       first_name,
//       last_name,
//       phone,
//       default_address,
//     } = req.body;

//     const registrationData = await registration.findOne({ where: { id: 1 } });
//     if (!registrationData) {
//       return res.status(404).json({ message: "Registration data not found" });
//     }

//     const points = registrationData.point;
//     const expiresOn =
//       registrationData.expiry_date !== "0" ? registrationData.expiry_date : null;
//     const account_number = `RC${customer_id}`;
//     const firstName = first_name || default_address?.first_name;
//     const lastName = last_name || default_address?.last_name;
//     const phoneNumber = phone || default_address?.phone;
//     const todayDate = moment().format("YYYY-MM-DD");
//     const todayTime = moment().format("HH:mm:ss");

//     const newCustomer = await customer.create({
//       account_number,
//       customer_id,
//       phone_number: phoneNumber,
//       email,
//       first_name: firstName,
//       last_name: lastName,
//       address1: default_address?.address1,
//       address2: default_address?.address2,
//       city: default_address?.city,
//       country: default_address?.country,
//       zip: default_address?.zip,
//       earned_point: points,
//       redeem_point: 0,
//       expiry_point: 0,
//       balance_point: points,
//       membership_tier: "welcome",
//       membership_status: "active",
//       registration_date: todayDate,
//       registration_time: todayTime,
//     });

//     // Call createMetafield with initial data
//     await createMetafield(customer_id, account_number, {
//       membership_tier: "welcome",
//       rclupoint: "0",
//       rajnigandha_point: points.toString(),
//     });

//     let newTransition = null;
//     let newPoint = null;
//     const creditAfter = registrationData.credit_after;

//     // If credit_after is "0", no points will be credited and no metafield update
//     if (creditAfter === "0") {
//       newTransition = await transition.create({
//         customer_Id: customer_id,
//         transition_id: generateTransitionId("register"),
//         account_number,
//         transition_category: "register",
//         transition_status: "register",
//         medium: "desktop",
//         point: points,
//         expiry_date: expiresOn,
//         order_id: "",
//         product_detail: "",
//       });
//     } else {
//       // If credit_after is "1" or greater, set the status to "hold_register", and update points and metafield
//       const transitionCategory = "register";
//       const transitionId = generateTransitionId(transitionCategory);

//       // Create transition and points
//       [newTransition, newPoint] = await Promise.all([
//         transition.create({
//           customer_Id: customer_id,
//           transition_id: transitionId,
//           account_number,
//           transition_category: transitionCategory,
//           transition_status: "hold_register", // Status is "hold_register" when credit_after > "0"
//           medium: "desktop",
//           point: points,
//           expiry_date: expiresOn,
//           order_id: "",
//           product_detail: "",
//         }),
//         point.create({
//           customer_Id: customer_id,
//           transition_id: transitionId,
//           account_number,
//           point: points,
//           transition_status: "hold_register",
//           expiry_date: expiresOn,
//           credit_after: registrationData.credit_after,
//         }),
//       ]);

//       // Update metafield with the new points
//       await createMetafield(customer_id, account_number, {
//         membership_tier: "welcome",
//         rclupoint: "0",
//         rajnigandha_point: points.toString(),
//       });
//     }

//     // Send OTP SMS
//     otpSMS(phoneNumber, account_number);

//     // Prepare response
//     const response = responseHandler(statusMaker.created, apiMessages.create, {
//       customer: newCustomer,
//       transition: newTransition,
//       point: newPoint,
//     });
//     return res.status(statusMaker.created).json(response);
//   } catch (error) {
//     console.error("Error during customer registration:", error);
//     const response = errorHandler(error);
//     return res.status(statusMaker.internalError).json(response);
//   }
// };

export const getByAPE = async (req, res) => {
  try {
    const { account_number = "" } = req.query;

    if (!account_number) {
      return res
        .status(statusMaker.badRequest)
        .json(responseHandler(statusMaker.badRequest, `Account number ${apiMessages.required}`));
    }

    const existingUser = await customer.findOne({
      where: {
        account_number,
      },
    });
    if (!existingUser) {
      return res
        .status(statusMaker.notFound)
        .json(responseHandler(statusMaker.notFound, apiMessages.notFound));
    }
    return res
      .status(statusMaker.found)
      .json(
        responseHandler(statusMaker.found, apiMessages.found, existingUser)
      );
  } catch (error) {
    return res.status(statusMaker.internalError).json(errorHandler(error));
  }
};

export const getByAccountNumber = async (req, res) => {
  try {
    const { customer_Id } = req.query;

    // Fetch data from `customer` table
    const customers = await customer.findAll({
      where: {
        customer_Id,
      },
    });

    // Fetch data from `cmm` table
    const cmmData = await cmm.findAll({
      where: {
        customer_Id,
      },
    });

    // Check if data exists in either `customer` or `cmm` table
    if (customers.length === 0 && cmmData.length === 0) {
      return res
        .status(statusMaker.notFound)
        .json(responseHandler(statusMaker.notFound, apiMessages.notFound));
    }

    // Check for duplicates in `customer` table
    if (customers.length > 1) {
      return res
        .status(statusMaker.conflict)
        .json(
          responseHandler(
            statusMaker.conflict,
            "Duplicate account_number found in customer table"
          )
        );
    }

    // Check for duplicates in `cmm` table
    if (cmmData.length > 1) {
      return res
        .status(statusMaker.conflict)
        .json(
          responseHandler(
            statusMaker.conflict,
            "Duplicate account_number found in cmm table"
          )
        );
    }

    // Combine data from `customer` and `cmm` tables into a single object
    const combinedData = {
      ...customers[0]?.dataValues, // Include `customer` table fields if available
      ...cmmData[0]?.dataValues, // Overwrite/add `cmm` table fields if available
    };

    return res
      .status(statusMaker.found)
      .json(
        responseHandler(statusMaker.found, apiMessages.found, combinedData)
      );
  } catch (error) {
    console.error("Error fetching data:", error.message);
    return res.status(statusMaker.internalError).json(errorHandler(error));
  }
};

//rajnigandha customer create

// const createMetafieldRajnigandha = async (customerId, account_number) => {
//   try {
//     const metafield = {
//       namespace: "custom",
//       key: "account_number",
//       value: JSON.stringify({ account_number }),
//       type: "single_line_text_field",
//     };

//     const response = await axios.post(
//       `https://lakmestaging.myshopify.com/admin/api/2024-01/customers/${customerId}/metafields.json`,
//       { metafield },
//       {
//         headers: {
//           "X-Shopify-Access-Token":  config.shopify_token,
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     console.log("Metafield created successfully:", response.data);
//   } catch (error) {
//     console.error("Error creating metafield:", error);
//   }
// };

// Customer Registration Handler
export const customerRegistrationRajnigandha = async (req, res) => {
  try {
    const {
      id: customer_id,
      email,
      first_name,
      last_name,
      phone,
      default_address,
    } = req.body;
    const registrationData = await registration.findOne({ where: { id: 1 } });
    if (!registrationData) {
      return res.status(404).json({ message: "Registration data not found" });
    }
    const points = registrationData.point;
    const expiresOn =
      registrationData.expiry_date !== "0"
        ? registrationData.expiry_date
        : null;
    const account_number = `RC${customer_id}`;
    const firstName = first_name || default_address?.first_name;
    const lastName = last_name || default_address?.last_name;
    const phoneNumber = phone || default_address?.phone;
    const todayDate = moment().format("YYYY-MM-DD");
    const todayTime = moment().format("HH:mm:ss");
    const newCustomer = await customer.create({
      account_number,
      customer_id,
      phone_number: phoneNumber,
      email,
      first_name: firstName,
      last_name: lastName,
      address1: default_address?.address1,
      address2: default_address?.address2,
      city: default_address?.city,
      country: default_address?.country,
      zip: default_address?.zip,
      earned_point: points,
      redeem_point: 0,
      expiry_point: 0,
      balance_point: points,
      membership_tier: "welcome",
      membership_status: "active",
      registration_date: todayDate,
      registration_time: todayTime,
    });

    let newTransition = null;
    let newPoint = null;
    if (parseInt(points, 10) > 0) {
      const transitionCategory = "register";
      const transitionId = generateTransitionId(transitionCategory);
      [newTransition, newPoint] = await Promise.all([
        transition.create({
          customer_Id: customer_id,
          transition_id: transitionId,
          account_number,
          transition_category: transitionCategory,
          transition_status: "register",
          medium: "desktop",
          point: points,
          expiry_date: expiresOn,
          order_id: "",
          product_detail: "",
        }),
        point.create({
          customer_Id: customer_id,
          transition_id: transitionId,
          account_number,
          point: points,
          transition_status: "register",
          expiry_date: expiresOn,
          credit_after: registrationData.credit_after,
        }),
      ]);
    }
    // await createMetafieldRajnigandha(customer_id, account_number);
    // otpSMS(phoneNumber, account_number);
    const response = responseHandler(statusMaker.created, apiMessages.create, {
      customer: newCustomer,
      transition: newTransition,
      point: newPoint,
    });
    return res.status(statusMaker.created).json(response);
  } catch (error) {
    console.error("Error during customer registration:", error);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

//end

// export const profileUpdate = async (req, res) => {
//   try {
//     const { account_number, date_of_birth } = req.body;
//     const customerData = await customer.findOne({ where: { account_number } });
//     console.log("customerData",customerData);

//     if (!customerData) {
//       return res.status(statusMaker.notFound).json({ message: "Customer not found" });
//     }
//     await customerData.update({ date_of_birth });
//     const tierData = await tier_mangement.findOne({ where: { id: 1 } });
//     const profileUpdateData = JSON.parse(tierData.dataValues.profile_update);
//     console.log("profileUpdateData",profileUpdateData);

//     const profileUpdateStatus = profileUpdateData.status;
//     console.log("profileUpdateStatus",profileUpdateStatus);

//     // if (profileUpdateStatus !== "active") {
//     //   return res.status(statusMaker.success).json({
//     //     message: "Profile update completed, but points were not added due to inactive status.",
//     //   });
//     // }
//     const membershipTier = customerData.membership_tier.toLowerCase();
//     const points = parseInt(profileUpdateData[membershipTier] || 0, 10);
//     if (points > 0) {
//       const currentEarnedPoints = parseInt(customerData.earned_point, 10);
//       const updatedEarnedPoints = currentEarnedPoints + points;

//       const updatedBalancePoints = updatedEarnedPoints;
//       await customerData.update({
//         earned_point: updatedEarnedPoints,
//         redeem_point: customerData.redeem_point,
//         expiry_point: customerData.expiry_point,
//         balance_point: updatedBalancePoints,
//       });
//       const transitionId = generateTransitionId("profile_update");
//       const [newTransition, newPoint] = await Promise.all([
//         transition.create({
//           customer_Id: customerData.customer_id,
//           transition_id: transitionId,
//           account_number: customerData.account_number,
//           transition_category: "profile_update",
//           transition_status: "credit",
//           medium: "desktop",
//           point: points,
//           expiry_date: "18months",
//           order_id: "",
//           product_detail: "",
//         }),
//         point.create({
//           customer_Id: customerData.customer_id,
//           transition_id: transitionId,
//           account_number: customerData.account_number,
//           point: points,
//           transition_status: "credit",
//           expiry_date: "18months",
//         }),
//       ]);
//       const response = responseHandler(statusMaker.success, apiMessages.update, {
//         customer: customerData,
//         transition: newTransition,
//         point: newPoint,
//       });
//       return res.status(statusMaker.success).json(response);
//     } else {
//       return res.status(statusMaker.success).json({
//         message: "Profile update completed, but no points were added for this membership tier.",
//       });
//     }
//   } catch (error) {
//     console.error("Error updating customer data and points:", error);
//     const response = errorHandler(error);
//     return res.status(statusMaker.internalError).json(response);
//   }
// };

const createMetafieldHelperFunction = async (customerId, metafieldsData) => {
  try {
    // Prepare the metafields data for the mutation
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
    console.log("Metafields created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating metafields:", error);
    throw new Error("Failed to create metafields");
  }
};

// export const profileUpdate = async (req, res) => {
//   try {
//     const {
//       account_number,
//       date_of_birth,
//       gender,
//       maritial_status,
//       marriage_anniversary,
//     } = req.body;

//     // Fetch the customer data
//     const customerData = await customer.findOne({ where: { account_number } });
//     if (!customerData) {
//       return res.status(404).json({ message: "Customer not found" });
//     }
//     const isProfileAlreadyUpdated =
//       customerData.date_of_birth ||
//       customerData.gender ||
//       customerData.maritial_status ||
//       customerData.marriage_anniversary;
//     await customerData.update({
//       date_of_birth,
//       gender,
//       maritial_status,
//       marriage_anniversary,
//     });
//     if (isProfileAlreadyUpdated) {
//       return res.status(200).json({
//         message: "Profile updated successfully, no points credited.",
//       });
//     }
//     const tierData = await tier_mangement.findOne({ where: { id: 1 } });
//     if (!tierData) {
//       return res
//         .status(404)
//         .json({ message: "Tier management data not found" });
//     }

//     const profileUpdateData = JSON.parse(tierData.dataValues.profile_update);
//     const membershipTier = customerData.membership_tier.toLowerCase();
//     const points = parseInt(profileUpdateData[membershipTier] || 0, 10);

//     if (points > 0) {
//       const updatedPoints = customerPointCalculation({
//         earned_point: parseInt(customerData.earned_point, 10) + points,
//         redeem_point: customerData.redeem_point,
//         expiry_point: customerData.expiry_point,
//       });

//       await customerData.update(updatedPoints);

//       const transitionId = generateTransitionId("profile_update");
//       const addMonths = (date, months) => {
//         date.setMonth(date.getMonth() + months);
//         return date;
//       };

//       const expiryDate = addMonths(new Date(), 18);
//       const formattedDate = `${String(expiryDate.getDate()).padStart(
//         2,
//         "0"
//       )}-${String(expiryDate.getMonth() + 1).padStart(2, "0")}-${String(
//         expiryDate.getFullYear()
//       ).slice(-2)}`;

//       console.log("formattedDate line 968", formattedDate);

//       const [newTransition, newPoint] = await Promise.all([
//         transition.create({
//           customer_Id: customerData.customer_id,
//           transition_id: transitionId,
//           account_number: customerData.account_number,
//           transition_category: "profile_update",
//           transition_status: "credit",
//           medium: "desktop",
//           point: points,
//           expiry_date: formattedDate,
//           order_id: "",
//           product_detail: "",
//         }),
//         point.create({
//           customer_Id: customerData.customer_id,
//           transition_id: transitionId,
//           account_number: customerData.account_number,
//           point: points,
//           transition_status: "credit",
//           expiry_date: formattedDate,
//         }),
//       ]);

//       // Update the metafields
//       await createMetafieldHelperFunction(customerData.customer_id, {
//         rclupoint: "0",
//         rajnigandha_point: updatedPoints.balance_point.toString(),
//       });

//       return res.status(200).json({
//         message: "Profile updated successfully, points credited.",
//         customer: customerData,
//         transition: newTransition,
//         point: newPoint,
//       });
//     } else {
//       return res.status(200).json({
//         message:
//           "Profile updated successfully, but no points were allocated for this membership tier.",
//       });
//     }
//   } catch (error) {
//     console.error("Error updating customer data and points:", error);
//     return res.status(500).json({ message: "An internal error occurred" });
//   }
// };

export const profileUpdate = async (req, res) => {
  try {
    const {
      account_number,
      date_of_birth,
      gender,
      maritial_status,
      marriage_anniversary,
    } = req.body;

    // Fetch the customer data
    const customerData = await customer.findOne({ where: { account_number } });
    if (!customerData) {
      return res.status(404).json({ message: "Customer not found" });
    }

    //Check if the profile is already updated
    const isProfileAlreadyUpdated =
      customerData.date_of_birth ||
      customerData.gender ||
      customerData.maritial_status ||
      customerData.marriage_anniversary;

    // Update customer profile details
    await customerData.update({
      date_of_birth,
      gender,
      maritial_status,
      marriage_anniversary,
    });

    if (isProfileAlreadyUpdated) {
      return res.status(200).json({
        message: "Profile updated successfully, no points credited.",
      });
    }

    // Fetch tier management data
    const tierData = await tier_mangement.findOne({ where: { id: 1 } });
    if (!tierData) {
      return res
        .status(404)
        .json({ message: "Tier management data not found" });
    }

    // Parse profile_update data
    const profileUpdateData = JSON.parse(tierData.dataValues.profile_update);
    if (profileUpdateData.status !== "active") {
      return res.status(200).json({
        message: "Profile update points are not active.",
      });
    }

    // Get customer tier and corresponding point and expiry_date
    const membershipTier = customerData.membership_tier.toLowerCase();
    const tierDetails = profileUpdateData[membershipTier];
    if (!tierDetails || !tierDetails.point) {
      return res.status(200).json({
        message: `No points allocated for the membership tier: ${membershipTier}.`,
      });
    }

    const points = parseInt(tierDetails.point, 10) || 0;
    // const expiryDate = tierDetails.expiry_date;

    const expiryDays = parseInt(tierDetails.expiry, 10) || 0;
    console.log("expiryDays 8997", expiryDays);

    const expiryDate = moment().add(expiryDays, "days").format("DD-MM-YYYY");
    console.log("expiryDate 8997", expiryDate);

    // Credit points if applicable
    if (points > 0) {
      // Calculate updated points for the customer
      const updatedPoints = customerPointCalculation({
        earned_point: parseInt(customerData.earned_point, 10) + points,
        redeem_point: customerData.redeem_point,
        expiry_point: customerData.expiry_point,
      });

      // Update customer points
      await customerData.update(updatedPoints);

      // Generate transition ID
      const transitionId = generateTransitionId("profile_update");

      // Create transition and point records
      const [newTransition, newPoint] = await Promise.all([
        transition.create({
          customer_Id: customerData.customer_id,
          transition_id: transitionId,
          account_number: customerData.account_number,
          transition_category: "profile_update",
          transition_status: "credit",
          medium: "desktop",
          point: points,
          expiry_date: expiryDate,
          order_id: "",
          product_detail: "",
          name: customerData.first_name,
          mobile_no: customerData.phone_number,
          state: customerData.State,
          city: customerData.city,
          serial_no: "",
          coupon_code: "",
          scan_manual: "",
        }),
        point.create({
          customer_Id: customerData.customer_id,
          transition_id: transitionId,
          account_number: customerData.account_number,
          point: points,
          transition_status: "credit",
          expiry_date: expiryDate,
        }),
      ]);

      // Update metafield
      // await createMetafieldHelperFunction(customerData.customer_id, {
      //   rclupoint: "0",
      //   rajnigandha_point: updatedPoints.balance_point.toString(),
      // });

      const result = await updateCustomerTierFunc(
        customerData.customer_id,
        "rajnigandha"
      );
      console.log("result", result);



      return res.status(200).json({
        message: "Profile updated successfully, points credited.",
        customer: customerData,
        transition: newTransition,
        point: newPoint,
      });
    } else {
      return res.status(200).json({
        message:
          "Profile updated successfully, but no points were allocated for this membership tier.",
      });
    }
  } catch (error) {
    console.error("Error updating customer data and points:", error);
    return res.status(500).json({ message: "An internal error occurred" });
  }
};

export const birthdayUpdate = async (req, res) => {
  try {
    const today = new Date();
    const formattedToday = `${String(today.getDate()).padStart(
      2,
      "0"
    )}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const birthdayCustomers = await customer.findAll({
      where: {
        date_of_birth: {
          [Op.like]: `${formattedToday}-%`,
        },
      },
    });

    console.log("birthdayCustomers", birthdayCustomers);

    if (birthdayCustomers.length === 0) {
      return res
        .status(statusMaker.notFound)
        .json({ message: "No birthdays found today." });
    }

    const tierData = await tier_mangement.findOne({ where: { id: 1 } });
    const profileUpdateData = JSON.parse(tierData.dataValues.benefits);
    console.log("profileUpdateData", profileUpdateData);
    console.log("profileUpdateData", profileUpdateData.status);
    const benefits = profileUpdateData.status;
    console.log("benefits", benefits);
    if (profileUpdateData.status !== "active") {
      return res
        .status(statusMaker.success)
        .json({ message: "Benefits are not active." });
    }

    const updatedCustomers = [];
    for (const customerData of birthdayCustomers) {
      const memberStatus = customerData.membership_tier.toLowerCase();
      const benefitData = profileUpdateData[memberStatus];
      console.log("benefitData line 396", benefitData);

      if (benefitData && benefitData.benefit && benefitData.expiry_date) {
        const benefitPoints = parseInt(benefitData.benefit, 10);
        const expiryDate = new Date(benefitData.expiry_date);
        if (benefitPoints > 0 && expiryDate > today) {
          const currentEarnedPoints = parseInt(customerData.earned_point, 10);
          const updatedEarnedPoints = currentEarnedPoints + benefitPoints;
          await customerData.update({
            earned_point: updatedEarnedPoints,
            balance_point: updatedEarnedPoints,
          });
          const transitionId = generateTransitionId("birthday_benefits");
          const [newTransition, newPoint] = await Promise.all([
            transition.create({
              customer_Id: customerData.customer_id,
              transition_id: transitionId,
              account_number: customerData.account_number,
              transition_category: "benefits",
              transition_status: "credit",
              medium: "desktop",
              point: benefitPoints,
              expiry_date: benefitData.expiry_date,
              order_id: "",
              product_detail: "",
              name: customerData.first_name,
              mobile_no: customerData.phone_number,
              state: customerData.State,
              city: customerData.city,
              serial_no: "",
              coupon_code: "",
              scan_manual: "",
            }),
            point.create({
              customer_Id: customerData.customer_id,
              transition_id: transitionId,
              account_number: customerData.account_number,
              point: benefitPoints,
              transition_status: "credit",
              expiry_date: benefitData.expiry_date,
            }),
          ]);

          updatedCustomers.push({
            customer: customerData,
            transition: newTransition,
            point: newPoint,
          });
        } else {
          console.log(`No active benefit found for ${memberStatus} member.`);
        }
      } else {
        console.log(`No benefit data found for tier ${memberStatus}.`);
      }
    }

    const response = responseHandler(
      statusMaker.success,
      "Birthday benefits applied successfully.",
      updatedCustomers
    );
    return res.status(statusMaker.success).json(response);
  } catch (error) {
    console.error("Error applying birthday benefits:", error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const applyBirthdayBenefits = async (req, res) => {
  try {
    const { date } = req.body;

    let today;
    if (date) {
      const [day, month, year] = date.split("-");
      today = new Date(`${year}-${month}-${day}`);
    } else {
      today = new Date();
    }

    console.log("Today Date for Processing:", today);
    const formattedToday = `${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(today.getDate()).padStart(2, "0")}`;

    console.log("Formatted Today:", formattedToday);
    const birthdayCustomers = await customer.findAll({
      where: {
        date_of_birth: {
          [Op.like]: `%-${formattedToday}`,
        },
      },
    });

    console.log("Birthday Customers:", birthdayCustomers);

    if (birthdayCustomers.length === 0) {
      return res
        .status(statusMaker.notFound)
        .json({ message: "No birthdays found for the given date." });
    }

    const tierData = await tier_mangement.findOne({ where: { id: 1 } });
    const profileUpdateData = JSON.parse(tierData.dataValues.benefits);

    const updatedCustomers = [];
    for (const customerData of birthdayCustomers) {
      const memberStatus = customerData.membership_tier.toLowerCase();
      const benefitData = profileUpdateData[memberStatus];

      if (benefitData && benefitData.benefit && benefitData.expiry_date) {
        const benefitPoints = parseInt(benefitData.benefit, 10);
        const expiryDate = new Date(benefitData.expiry_date);

        if (benefitPoints > 0 && expiryDate > today) {
          const oldEarnedPoint = parseInt(customerData.earned_point || "0", 10);
          const oldRedeemPoint = parseInt(customerData.redeem_point || "0", 10);
          const oldExpiryPoint = parseInt(customerData.expiry_point || "0", 10);

          const updatedEarnedPoint = oldEarnedPoint + benefitPoints;
          const updatedRedeemPoint = oldRedeemPoint;
          const updatedExpiryPoint = oldExpiryPoint;
          const updatedBalancePoint =
            updatedEarnedPoint - updatedRedeemPoint - updatedExpiryPoint;
          await customer.update(
            {
              balance_point: updatedBalancePoint.toString(),
              earned_point: updatedEarnedPoint.toString(),
              redeem_point: updatedRedeemPoint.toString(),
              expiry_point: updatedExpiryPoint.toString(),
            },
            { where: { customer_id: customerData.customer_id } }
          );

          const transitionId = generateTransitionId("birthday_benefits");
          const [newTransition, newPoint] = await Promise.all([
            transition.create({
              customer_Id: customerData.customer_id,
              transition_id: transitionId,
              account_number: customerData.account_number,
              transition_category: "benefits",
              transition_status: "credit",
              medium: "desktop",
              point: benefitPoints,
              expiry_date: benefitData.expiry_date,
              order_id: "",
              product_detail: "",
              name: customerData.first_name,
              mobile_no: customerData.phone_number,
              state: customerData.State,
              city: customerData.city,
              serial_no: "",
              coupon_code: "",
              scan_manual: "",
            }),
            point.create({
              customer_Id: customerData.customer_id,
              transition_id: transitionId,
              account_number: customerData.account_number,
              point: benefitPoints,
              transition_status: "credit",
              expiry_date: benefitData.expiry_date,
            }),
          ]);

          updatedCustomers.push({
            customer: customerData,
            transition: newTransition,
            point: newPoint,
          });
        } else {
          console.log(`No active benefit found for ${memberStatus} member.`);
        }
      } else {
        console.log(`No benefit data found for tier ${memberStatus}.`);
      }
    }

    const response = responseHandler(
      statusMaker.success,
      "Birthday benefits applied successfully.",
      updatedCustomers
    );
    return res.status(statusMaker.success).json(response);
  } catch (error) {
    console.error("Error applying birthday benefits:", error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const member_status_update = async (req, res) => {
  const customer_Id = req.body.id;

  try {
    const customerCMM = await customer.findOne({
      where: { customer_id: customer_Id },
    });

    if (!customerCMM) {
      return res
        .status(statusMaker.notFound)
        .json({ message: "Customer not found." });
    }
    const totalRewardPoints = parseInt(customerCMM.earned_point, 10);
    const currentStatus = customerCMM.membership_tier.trim().toLowerCase();
    const tierData = await tier_mangement.findOne();

    if (!tierData || !tierData.start_mangement || !tierData.bonus_benefits) {
      return res
        .status(statusMaker.notFound)
        .json({ message: "Tier management or bonus benefits data not found." });
    }

    const startManagement = tierData.start_mangement;
    // const tierBenefits = tierData.tier_benefits;
    let newStatus = currentStatus;
    if (totalRewardPoints < parseInt(startManagement.blue.start_point, 10)) {
      newStatus = "welcome";
    } else if (
      totalRewardPoints < parseInt(startManagement.silver.start_point, 10)
    ) {
      newStatus = "blue";
    } else if (
      totalRewardPoints < parseInt(startManagement.gold.start_point, 10)
    ) {
      newStatus = "silver";
    } else if (
      totalRewardPoints < parseInt(startManagement.platinum.start_point, 10)
    ) {
      newStatus = "gold";
    } else {
      newStatus = "platinum";
    }
    let pointsToAdd = 0;
    let newTierPoints;
    let newTransition;
    let newPoint;

    if (newStatus !== currentStatus) {
      const currentTierPoints = parseInt(
        tierData.tier_benefits[currentStatus],
        10
      );
      newTierPoints = parseInt(tierData.tier_benefits[newStatus], 10);
      pointsToAdd = newTierPoints + currentTierPoints;
    }
    if (newStatus !== currentStatus || pointsToAdd > 0) {
      customerCMM.membership_tier = newStatus;
      customerCMM.earned_point = (
        parseInt(customerCMM.earned_point, 10) + pointsToAdd
      ).toString();
      customerCMM.balance_point = (
        parseInt(customerCMM.balance_point, 10) + pointsToAdd
      ).toString();
      await customer.update(
        {
          membership_tier: newStatus,
          earned_point: customerCMM.earned_point,
          balance_point: customerCMM.earned_point,
        },
        { where: { customer_id: customer_Id } }
      );
      const transitionId = generateTransitionId("tier_update");
      [newTransition, newPoint] = await Promise.all([
        transition.create({
          customer_Id: customer_Id,
          transition_id: transitionId,
          account_number: customerCMM.account_number,
          transition_category: "tier_update",
          transition_status: "credit",
          medium: "desktop",
          point: newTierPoints,
          expiry_date: "18months",
          order_id: "",
          product_detail: "",
          domain: "lakme",
          name: customerCMM.first_name,
          mobile_no: customerCMM.phone_number,
          state: customerCMM.State,
          city: customerCMM.city,
          serial_no: "",
          coupon_code: "",
          scan_manual: "",
        }),
        point.create({
          customer_Id: customer_Id,
          transition_id: transitionId,
          account_number: customerCMM.account_number,
          point: newTierPoints,
          transition_status: "credit",
          expiry_date: "18months",
        }),
      ]);
    }
    const response = responseHandler(
      statusMaker.success,
      "Member status updated successfully, including bonus points.",
      {
        customer: customerCMM,
        newTransition: newTransition,
        newPoint: newPoint,
      }
    );
    return res.status(statusMaker.success).json(response);
  } catch (error) {
    console.error("Error updating member status:", error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const survey_point = async (req, res) => {
  const { customer_Id, survey_data } = req.body;
  try {
    const customerCMM = await cmm.findOne({ where: { customer_Id } });
    if (!customerCMM) {
      return res
        .status(statusMaker.notFound)
        .json({ message: "Customer not found." });
    }

    const tierData = await tier_mangement.findOne();
    if (!tierData || !tierData.survey_management) {
      return res
        .status(statusMaker.notFound)
        .json({ message: "Survey management data not found." });
    }

    const surveyPoints = parseInt(tierData.survey_management, 10);
    if (survey_data) {
      customerCMM.reward_points = (
        parseInt(customerCMM.reward_points, 10) + surveyPoints
      ).toString();

      customerCMM.total_reward_points = (
        parseInt(customerCMM.total_reward_points, 10) + surveyPoints
      ).toString();
      await customerCMM.save();
    }

    const response = responseHandler(
      statusMaker.success,
      "Survey feedback received. Points added to customer.",
      customerCMM
    );
    return res.status(statusMaker.success).json(response);
  } catch (error) {
    console.error("Error updating survey points:", error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

const generateTransitionIdBonus = (transitionCategory) => {
  const datePart = moment().format("YYYYMMDDHHmmss");
  const randomPart = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(10, "0");
  return `${transitionCategory}${datePart}${randomPart}`;
};

const createTransactionRecords = async (
  customerData,
  transitionId,
  points,
  action,
  category,
  store,
  note,
  transition_status,
  credit_days,
  formattedDate
) => {
  const creditAfterValue = credit_days || "0"; // Default creditAfterValue to "0" if not provided
  const expiryDate =
    formattedDate || addMonths(new Date(), 18).toISOString().split("T")[0]; // Default expiry date to 18 months later if not provided

  await Promise.all([
    transition.create({
      customer_Id: customerData.customer_id,
      transition_id: transitionId,
      account_number: customerData.account_number,
      transition_category: category,
      transition_status, // Dynamic status
      medium: "desktop",
      point: points,
      expiry_date: expiryDate,
      order_id: note,
      product_detail: "",
      store,
      note,
      credit_days,
      name: customerData.first_name,
      mobile_no: customerData.phone_number,
      state: customerData.State,
      city: customerData.city,
      serial_no: "",
      coupon_code: "",
      scan_manual: "",
    }),
    point.create({
      customer_Id: customerData.customer_id,
      transition_id: transitionId,
      account_number: customerData.account_number,
      store,
      point: points,
      transition_status, // Dynamic status
      note,
      expiry_date: expiryDate,
      credit_after: creditAfterValue,
    }),
  ]);
};

export const admintransaction = async (req, res) => {
  try {
    const {
      customer_id,
      amount,
      action,
      store,
      note,
      credit_days,
      expiry_date,
    } = req.body;
    console.log("Input Data:", { customer_id, amount, action, credit_days });

    const formattedDate = expiry_date;

    console.log("formattedDate", formattedDate);

    const category = "customer_benefits";

    if (!["credit", "debit"].includes(action)) {
      return res.status(400).json({ message: "Invalid action specified" });
    }

    const customerData = await customer.findOne({ where: { customer_id } });
    if (!customerData) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const points = parseInt(amount, 10);
    const currentEarnedPoints = parseInt(customerData.earned_point, 10);
    if (action === "debit") {
      if (currentEarnedPoints < points) {
        return res
          .status(400)
          .json({ message: "Insufficient points for debit operation" });
      }

      // Update customer points for debit action
      // const updatedEarnedPoints = currentEarnedPoints - points;
      // const updatedBalancePoints = updatedEarnedPoints;

      const updatedEarnedPoints =
        parseInt(customerData.earned_point, 10) - points;
      const updatedBalancePoints =
        updatedEarnedPoints -
        parseInt(customerData.redeem_point || "0", 10) -
        parseInt(customerData.expiry_point || "0", 10);

      await customerData.update({
        earned_point: updatedEarnedPoints,
        balance_point: updatedBalancePoints,
      });

      const transitionId = generateTransitionIdBonus(category);
      await createTransactionRecords(
        customerData,
        transitionId,
        points,
        action,
        category,
        store,
        note,
        "debit", // Transition status for debit
        null,
        null
      );

      await createMetafieldHelperFunction(customerData.customer_id, {
        rclupoint: "0",
        rajnigandha_point: updatedBalancePoints.toString(),
      });

      return res.status(200).json({
        message: "Points debited successfully",
        updatedCustomerData: customerData,
        status: 200,
      });
    }

    // Handle credit logic
    let transition_status = "credit";
    if (credit_days && parseInt(credit_days, 10) > 0) {
      transition_status = "hold"; // Put points on hold if credit_days > 0
    }

    if (transition_status === "credit") {
      // const updatedEarnedPoints = currentEarnedPoints + points;
      // const updatedBalancePoints = updatedEarnedPoints;

      const updatedEarnedPoints =
        parseInt(customerData.earned_point, 10) + points;
      const updatedBalancePoints =
        updatedEarnedPoints -
        parseInt(customerData.redeem_point || "0", 10) -
        parseInt(customerData.expiry_point || "0", 10);

      await customerData.update({
        earned_point: updatedEarnedPoints,
        balance_point: updatedBalancePoints,
      });

      await createMetafieldHelperFunction(customerData.customer_id, {
        rclupoint: "0",
        rajnigandha_point: updatedBalancePoints.toString(),
      });

      const result = await updateCustomerTierFunc(
        customerData.customer_id,
        "rajnigandha"
      );
      console.log("result", result);
    }

    const transitionId = generateTransitionIdBonus(category);
    await createTransactionRecords(
      customerData,
      transitionId,
      points,
      action,
      category,
      store,
      note,
      transition_status,
      credit_days,
      formattedDate
    );

    res.status(200).json({
      message: `Points ${transition_status === "hold" ? "put on hold" : "credited"
        } successfully`,
      transition_status,
      updatedCustomerData: customerData,
      status: 200,
    });
  } catch (error) {
    console.error("Error in admintransaction:", error.message);
    res.status(500).json({ message: "An error occurred", error });
  }
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
//     console.log("currentTier",currentTier);

//     const oldEarnedPoint = parseInt(customerData.earned_point, 10);
//     console.log("currentTier",currentTier);

//     const oldRedeemPoint = parseInt(customerData.redeem_point, 10);
//     console.log("oldEarnedPoint",oldEarnedPoint);

//     const oldExpiryPoint = parseInt(customerData.expiry_point, 10);
//     console.log("oldExpiryPoint",oldExpiryPoint);

//     const balancePoint = parseInt(customerData.balance_point, 10);
//     console.log("balancePoint",balancePoint);


//     // Determine the new tier
//     let newTier = currentTier;
//     let tierPoints = 0;
//     let expiryDate = null;

//     for (const [tier, range] of Object.entries(startManagement)) {
//       const start = parseInt(range.start_point, 10) || 0;
//       console.log("start",start);

//       const end = parseInt(range.end_point, 10) || Infinity;
//       console.log("end",end);


//       if (oldEarnedPoint >= start && oldEarnedPoint <= end) {
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
//     console.log("startManagement", startManagement);

//     const tierBenefits = tierData.tier_benefits;

//     const currentTier = customerData.membership_tier;
//     console.log("currentTier", currentTier);

//     const oldEarnedPoint = parseInt(customerData.earned_point, 10);
//     console.log("oldEarnedPoint", oldEarnedPoint);

//     const oldRedeemPoint = parseInt(customerData.redeem_point, 10);
//     const oldExpiryPoint = parseInt(customerData.expiry_point, 10);
//     const balancePoint = parseInt(customerData.balance_point, 10);
//     console.log("balancePoint", balancePoint);

//     // Determine the new tier
//     let newTier = currentTier;
//     let tierPoints = 0;
//     let expiryDate = null;
//     let lastTier = null; // Keep track of the last tier

//     for (const [tier, range] of Object.entries(startManagement)) {
//       const start = parseInt(range.start_point, 10) || 0;
//       const end = parseInt(range.end_point, 10) || Infinity;

//       lastTier = tier; // Update the last tier in the loop

//       if (oldEarnedPoint >= start && oldEarnedPoint <= end) {
//         newTier = tier;
//         tierPoints = parseInt(tierBenefits[tier]?.point || "0", 10);

//         const expiryDays = parseInt(tierBenefits[tier]?.expiry || "0", 10);
//         expiryDate = moment().add(expiryDays, "days").format("DD-MM-YY");
//       }
//     }

//     // Assign to the highest tier if points exceed the highest range
//     const highestTierEnd = parseInt(startManagement[lastTier]?.end_point, 10) || 0;
//     if (oldEarnedPoint > highestTierEnd) {
//       newTier = lastTier;
//       tierPoints = parseInt(tierBenefits[lastTier]?.point || "0", 10);

//       const expiryDays = parseInt(tierBenefits[lastTier]?.expiry || "0", 10);
//       expiryDate = moment().add(expiryDays, "days").format("DD-MM-YY");
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

    console.log("updatedEarnedPoint", oldEarnedPoint)

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

      // await createMetafieldHelperFunction(customer_id, {
      //   rclupoint: "0",
      //   rajnigandha_point: updatedBalancePoint.toString(),
      // });

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

    const { count, rows } = await customer.findAndCountAll({
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

    return res.json({
      message: "Transactions retrieved successfully",
      data: rows,
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

export const customerTransactions = async (req, res) => {
  try {
    const { account_number } = req.body;
    console.log("account_number", account_number);

    if (!account_number) {
      return res.status(400).json({ message: "Account number is required" });
    }
    const transactions = await transition.findAll({
      where: { account_number },
      order: [["createdAt", "DESC"]],
    });

    if (transactions.length === 0) {
      return res
        .status(404)
        .json({ message: "No transactions found for this account number" });
    }
    return res.json({
      message: "Transactions retrieved successfully",
      transactions,
      status: 200,
    });
  } catch (error) {
    console.error("Error retrieving transactions:", error);
    return res.status(500).json({ message: "Error retrieving transactions" });
  }
};

export const allTransition = async (req, res) => {
  try {
    const { start_date, end_date, limit = 500, offset = 0, store } = req.query;
    const filter = {};

    if (start_date || end_date) {
      filter.createdAt = {};
      if (start_date) {
        filter.createdAt[Sequelize.Op.gte] = new Date(start_date);
      }
      if (end_date) {
        const endDateWithTime = new Date(end_date);
        endDateWithTime.setHours(23, 59, 59, 999);
        filter.createdAt[Sequelize.Op.lte] = endDateWithTime;
      }
    }

    if (store) {
      filter.store = store;
    }

    const { count, rows } = await transition.findAndCountAll({
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

    return res.json({
      message: "Transactions retrieved successfully",
      data: rows,
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

export const getcustomerData = async (req, res) => {
  try {
    const { account_number, customer_id } = req.query;
    if (!account_number) {
      return res.status(statusMaker.badRequest).json({
        message: "account_number are required.",
      });
    }
    const customerData = await customer.findOne({
      where: {
        [Op.or]: [
          { account_number: account_number },
          { customer_id: customer_id },
        ],
      },
    });

    if (!customerData) {
      return res.status(statusMaker.notFound).json(apiMessages.notFound);
    }
    const transitionData = await transition.findAll({
      where: {
        [Op.or]: [
          { account_number: account_number },
          { customer_Id: customer_id },
        ],
      },
    });
    if (!transitionData) {
      return res.status(statusMaker.notFound).json(apiMessages.notFound);
    }
    const responseData = {
      customer: customerData,
      transitions: transitionData,
    };
    return res.status(statusMaker.success).json(responseData);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const customerListTransition = async (req, res) => {
  try {
    const { account_number, customer_id } = req.query;
    if (!account_number || !customer_id) {
      return res.status(statusMaker.badRequest).json({
        message: "account_number are required.",
      });
    }
    const transactionData = await transition.findOne({
      where: {
        account_number: account_number,
        customer_Id: customer_id,
      },
    });
    if (!transactionData) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        transactionData
      );
      return res.status(statusMaker.notFound).json(response);
    }
    const response = responseHandler(
      statusMaker.found,
      apiMessages.found,
      transactionData
    );
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const list = async (req, res) => {
  try {
    const customerData = await customer.findAll();
    if (!customerData) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        customerData
      );
      return res.status(statusMaker.notFound).json(response);
    }
    const response = responseHandler(
      statusMaker.found,
      apiMessages.found,
      customerData
    );
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const member_tier_upgrade = async (req, res) => {
  try {
    const tierData = await tier_mangement.findOne();
    // const financial_year = tierData.financial_year;
    const startManagement = tierData.start_mangement;
    const customers = await customer.findAll();
    const updatedCustomers = await Promise.all(
      customers.map(async (customer) => {
        const newBalancePoint = customer.balance_point;
        let newTier = customer.membership_tier;
        if (newBalancePoint >= parseInt(startManagement.platinum.start_point)) {
          newTier = "platinum";
        } else if (
          newBalancePoint >= parseInt(startManagement.gold.start_point)
        ) {
          newTier = "gold";
        } else if (
          newBalancePoint >= parseInt(startManagement.silver.start_point)
        ) {
          newTier = "silver";
        } else if (
          newBalancePoint >= parseInt(startManagement.blue.start_point)
        ) {
          newTier = "blue";
        } else {
          newTier = "welcome";
        }
        if (newTier !== customer.membership_tier) {
          await customer.update(
            {
              earned_point: newBalancePoint,
              redeem_point: "0",
              expiry_point: "0",
              balance_point: newBalancePoint,
              membership_tier: newTier,
            },
            { where: { id: customer.id } }
          );
        } else {
          await customer.update(
            {
              earned_point: newBalancePoint,
              redeem_point: "0",
              expiry_point: "0",
              balance_point: newBalancePoint,
            },
            { where: { id: customer.id } }
          );
        }

        return {
          ...customer.toJSON(),
          balance_point: newBalancePoint,
          membership_tier: newTier,
        };
      })
    );

    const response = responseHandler(
      statusMaker.success,
      "Customer financial details updated",
      updatedCustomers
    );
    return res.status(statusMaker.success).json(response);
  } catch (error) {
    console.error("Error updating customer financial details", error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

// export const customerTransactionsShopify = async (req, res) => {
//   try {
//     const { account_number, transaction_search, start_date, end_date } =
//       req.body;

//     if (!account_number) {
//       return res.status(400).json({ message: "Account number is required" });
//     }
//     let whereCondition = { account_number };
//     if (transaction_search === "upcoming_pointt") {
//       whereCondition.transition_status = "hold";
//     } else if (transaction_search === "point_earning") {
//       whereCondition.transition_status = ["credit", "register"];
//     } else if (
//       transaction_search === "reedempoint" ||
//       transaction_search === "expiry"
//     ) {
//       return res.status(200).json({
//         message: "No data available",
//         transactions: [],
//         status: 200,
//       });
//     }
//     if (start_date && end_date) {
//       whereCondition.createdAt = {
//         [Sequelize.Op.between]: [new Date(start_date), new Date(end_date)],
//       };
//     }
//     const customerData = await customer.findOne({
//       where: { account_number },
//       attributes: ["redeem_point", "expiry_point", "balance_point"],
//     });

//     if (!customerData) {
//       return res.status(404).json({
//         message: "Customer not found",
//         transactions: [],
//         status: 404,
//       });
//     }

//     const { redeem_point, expiry_point, balance_point } = customerData;
//     const transactions = await transition.findAll({
//       where: whereCondition,
//       order: [["createdAt", "DESC"]],
//     });

//     const upcomingPoints = transactions
//       .filter((txn) => txn.transition_status === "hold")
//       .reduce((sum, txn) => sum + parseInt(txn.point, 10), 0);
//     if (transactions.length === 0) {
//       return res.status(404).json({
//         message: "No transactions found for this account number",
//         transactions: [],
//         redeem_point,
//         expiry_point,
//         balance_point,
//         upcoming_point: upcomingPoints,
//         status: 404,
//       });
//     }
//     return res.json({
//       message: "Transactions retrieved successfully",
//       transactions,
//       redeem_point,
//       expiry_point,
//       balance_point,
//       upcoming_point: upcomingPoints,
//       status: 200,
//     });
//   } catch (error) {
//     console.error("Error retrieving transactions:", error);
//     return res.status(500).json({ message: "Error retrieving transactions" });
//   }
// };

// export const customerImportDATA =  async (req,res) =>{
//     const filePath = req.file.path;
//     const results = [];
//     fs.createReadStream(filePath)
//       .pipe(csv())
//       .on('data', (row) => {
//         custid
// marital
// gender
// anndate
// selfed
// spouseed
// selfocc
// income
// birthdate
// birthplace
// enjsince
// preraj
// smoker
// consraj
// brandtob
// hobby
// mlevel
//         const mappedData = {
//           customer_id: row['custid'],
//           first_name: row['First Name'],
//           last_name: row['Last Name'],
//           date_of_birth: row['Date of Birth'],
//           address1: row['Address 1'],
//           address2: row['Address 2'],
//           city: row['City'],
//           country: row['Country'],
//           zip: row['Zip'],
//           earned_point: row['Earned Point'],
//           redeem_point: row['Redeem Point'],
//           expiry_point: row['Expiry Point'],
//           balance_point: row['Balance Point'],
//           membership_tier: row['Membership Tier'],
//           membership_status: row['Membership Status'],
//           registration_date: row['Registration Date'],
//           registration_time: row['Registration Time'],
//           marital: row['Marital Status'],
//           gender: row['Gender'],
//           anndate: row['Anniversary Date'],
//           selfed: row['Self Education'],
//           selfocc: row['Self Occupation'],
//           income: row['Income'],
//           birthdate: row['Birthdate'],
//         };
//         results.push(mappedData);
//       })
//       .on('end', async () => {
//         try {
//           await customerImport.bulkCreate(results);
//           fs.unlinkSync(filePath);
//           return res.status(statusMaker.created)
//         } catch (error) {
//           console.log(error.message);
//           const response = errorHandler(error);
//           return res.status(statusMaker.internalError).json(response)
//         }
//       });
// };

// export const customerTransactionsShopify = async (req, res) => {
//   try {
//     const { account_number, transaction_search, start_date, end_date } =
//       req.body;

//     if (!account_number) {
//       return res.status(400).json({ message: "Account number is required" });
//     }

//     let whereCondition = { account_number };

//     if (transaction_search === "upcoming_pointt") {
//       whereCondition.transition_status = "hold";
//     } else if (transaction_search === "point_earning") {
//       whereCondition.transition_status = ["credit", "register"];
//     } else if (
//       transaction_search === "reedempoint"
//     ) {
//       whereCondition.transition_status = ["redeem", "register"];
//     }else if( transaction_search === "expiry"){
//       // whereCondition.transition_status = ["redeem", "register"];
//       return res.status(404).json({
//         message: "Data not found",
//         transactions: [],
//         status: 404,
//       });
//     }

//     if (start_date && end_date) {
//       whereCondition.createdAt = {
//         [Sequelize.Op.between]: [new Date(start_date), new Date(end_date)],
//       };
//     }

//     const customerData = await customer.findOne({
//       where: { account_number },
//       attributes: [
//         "redeem_point",
//         "expiry_point",
//         "balance_point",
//         "earned_point",
//       ],
//     });

//     if (!customerData) {
//       return res.status(404).json({
//         message: "Customer not found",
//         transactions: [],
//         status: 404,
//       });
//     }

//     const { earned_point, redeem_point, expiry_point } = customerData;

//     // Parse the points and calculate balance
//     const earnedPoints = parseInt(earned_point, 10) || 0;
//     const redeemedPoints = parseInt(redeem_point, 10) || 0;
//     const expiredPoints = parseInt(expiry_point, 10) || 0;
//     const balancePoint = earnedPoints - redeemedPoints - expiredPoints;

//     const transactions = await transition.findAll({
//       where: whereCondition,
//       order: [["createdAt", "DESC"]],
//     });

//     // Filter "hold" transactions based on the "order_cancel" logic
//     const filteredTransactions = transactions.filter((txn) => {
//       if (txn.transition_status === "hold") {
//         const hasOrderCancel = transactions.some(
//           (cancelTxn) =>
//             cancelTxn.transition_status === "order_cancel" &&
//             cancelTxn.order_id === txn.order_id &&
//             cancelTxn.product_detail === txn.product_detail
//         );
//         return !hasOrderCancel;
//       }
//       return true;
//     });

//     // Calculate upcoming points based on filtered transactions
//     const upcomingPoints = filteredTransactions
//       .filter((txn) => txn.transition_status === "hold")
//       .reduce((sum, txn) => sum + parseInt(txn.point, 10), 0);

//     if (filteredTransactions.length === 0) {
//       return res.status(404).json({
//         message: "No transactions found for this account number",
//         transactions: [],
//         redeem_point,
//         expiry_point,
//         balancePoint, // Correctly calculated balance
//         upcoming_point: upcomingPoints,
//         status: 404,
//       });
//     }

//     return res.json({
//       message: "Transactions retrieved successfully",
//       transactions: filteredTransactions,
//       redeem_point,
//       expiry_point,
//       balancePoint, // Correctly calculated balance
//       upcoming_point: upcomingPoints,
//       status: 200,
//     });
//   } catch (error) {
//     console.error("Error retrieving transactions:", error);
//     return res.status(500).json({ message: "Error retrieving transactions" });
//   }
// };

export const customerTransactionsShopify = async (req, res) => {
  try {
    const { account_number, transaction_search, start_date, end_date } = req.body;

    if (!account_number) {
      return res.status(400).json({ message: "Account number is required" });
    }

    let whereCondition = { account_number };

    if (transaction_search === "upcoming_pointt") {
      whereCondition.transition_status = "hold";
    } else if (transaction_search === "point_earning") {
      whereCondition.transition_status = ["credit", "register"];
    } else if (transaction_search === "reedempoint") {
      whereCondition.transition_status = ["redeem"];
    } else if (transaction_search === "coupon") {
      whereCondition.transition_category = ["Retail Coupon"];
    } else if (transaction_search === "expiry") {
      const today = new Date();
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(today.getDate() + 15);

      // Filter transactions with expiry_date within the next 7 days
      const transactions = await transition.findAll({
        where: {
          account_number,
        },
        attributes: ["expiry_date", "transition_status", "point", "createdAt", "transition_category", "transition_status","store"],
      });


      const expiringTransactions = transactions.filter((txn) => {
        if (txn?.expiry_date && txn.transition_status === customerTransaction?.CREDIT) {
          const txnExpiryDate = new Date(
            txn?.expiry_date?.split("-")?.reverse()?.join("-")
          ); // Convert DD-MM-YYYY to YYYY-MM-DD
          return txnExpiryDate >= today && txnExpiryDate <= sevenDaysLater;
        }
        return false;
      });

      if (expiringTransactions.length === 0) {
        return res.status(404).json({
          message: "No transactions with expiring points found",
          transactions: [],
          status: 404,
        });
      }

      return res.json({
        message: "Expiring transactions retrieved successfully",
        transactions: expiringTransactions,
        status: 200,
      });
    }

    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      // Set end date to the end of the day (23:59:59.999)
      endDate.setHours(23, 59, 59, 999);

      whereCondition.createdAt = {
        [Sequelize.Op.between]: [startDate, endDate],
      };
    }

    const customerData = await customer.findOne({
      where: { account_number },
      attributes: [
        "redeem_point",
        "expiry_point",
        "balance_point",
        "earned_point",
      ],
    });

    if (!customerData) {
      return res.status(404).json({
        message: "Customer not found",
        transactions: [],
        status: 404,
      });
    }

    const { earned_point, redeem_point, expiry_point } = customerData;

    // Parse the points and calculate balance
    const earnedPoints = parseInt(earned_point, 10) || 0;
    const redeemedPoints = parseInt(redeem_point, 10) || 0;
    const expiredPoints = parseInt(expiry_point, 10) || 0;
    const balancePoint = earnedPoints - redeemedPoints - expiredPoints;

    const transactions = await transition.findAll({
      where: whereCondition,
      order: [["createdAt", "DESC"]],
    });

    // Filter "hold" transactions based on the "order_cancel" logic
    const filteredTransactions = transactions.filter((txn) => {
      if (txn.transition_status === "hold") {
        const hasOrderCancel = transactions.some(
          (cancelTxn) =>
            cancelTxn.transition_status === "order_cancel" &&
            cancelTxn.order_id === txn.order_id &&
            cancelTxn.product_detail === txn.product_detail
        );
        return !hasOrderCancel;
      }
      return true;
    });

    // Calculate upcoming points and add hold_transition_credit_days for "hold" transactions
    const upcomingPoints = filteredTransactions
      .filter((txn) => txn.transition_status === "hold")
      .reduce((sum, txn) => sum + parseInt(txn.point, 10), 0);

    const enhancedTransactions = filteredTransactions.map((txn) => {
      if (txn.transition_status === "hold" && txn.credit_days) {
        const creditDays = parseInt(txn.credit_days, 10);
        const creditDate = new Date();
        creditDate.setDate(creditDate.getDate() + creditDays);

        txn = {
          ...txn.toJSON(), // Ensure the instance is converted to a plain object
          hold_transition_credit_days: creditDate.toISOString().split("T")[0],
        };
      }
      return txn;
    });

    if (enhancedTransactions.length === 0) {
      return res.status(404).json({
        message: "No transactions found for this account number",
        transactions: [],
        redeem_point,
        expiry_point,
        balancePoint,
        upcoming_point: upcomingPoints,
        status: 404,
      });
    }

    return res.json({
      message: "Transactions retrieved successfully",
      transactions: enhancedTransactions,
      redeem_point,
      expiry_point,
      balancePoint,
      upcoming_point: upcomingPoints,
      status: 200,
    });
  } catch (error) {
    console.error("Error retrieving transactions:", error);
    return res.status(500).json({ message: "Error retrieving transactions" });
  }
};


export const customerTransactionsCouponShopify = async (req, res) => {
  try {
    const { account_number, transaction_search, start_date, end_date } =
      req.query;

    if (!account_number) {
      return res.status(400).json({ message: "Account number is required" });
    }

    const whereCondition = { account_number };

    if (transaction_search === "coupon") {
      whereCondition.transition_category = ["Retail Coupon"];
    }

    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      endDate.setHours(23, 59, 59, 999);

      whereCondition.createdAt = {
        [Sequelize.Op.between]: [startDate, endDate],
      };
    }

    const customerData = await customer.findOne({
      where: { account_number },
      attributes: [
        "redeem_point",
        "expiry_point",
        "balance_point",
        "earned_point",
      ],
    });

    if (!customerData) {
      return res.status(404).json({
        message: "Customer not found",
        transactions: [],
        status: 404,
      });
    }

    const {
      earned_point = 0,
      redeem_point = 0,
      expiry_point = 0,
    } = customerData;
    const earnedPoints = parseInt(earned_point, 10) || 0;
    const redeemedPoints = parseInt(redeem_point, 10) || 0;
    const expiredPoints = parseInt(expiry_point, 10) || 0;
    const balancePoint = earnedPoints - redeemedPoints - expiredPoints;

    const transactions = await transition.findAll({
      where: whereCondition,
      order: [["createdAt", "DESC"]],
    });

    if (!transactions || transactions.length === 0) {
      return res.status(404).json({
        message: "No transactions found for this account number",
        transactions: [],
        redeem_point,
        expiry_point,
        balancePoint,
        upcoming_point: 0,
        total_point_coupon: 0,
        status: 404,
      });
    }

    // Filtering required fields
    const filteredTransactions = transactions.map((t) => ({
      point: parseInt(t.point, 10) || 0,
      serial_no: t.serial_no,
      coupon_code: t.coupon_code,
      scan_manual: t.scan_manual,
      createdAt: t.createdAt,
      source_of_device: t.source_of_device,
    }));

    // Calculating total_point_coupon (sum of all points)
    const total_point_coupon = filteredTransactions.reduce(
      (sum, transaction) => sum + transaction.point,
      0
    );

    return res.status(200).json({
      message: "Transactions retrieved successfully",
      transactions: filteredTransactions,
      redeem_point,
      expiry_point,
      balancePoint,
      upcoming_point: 0,
      total_point_coupon,
      status: 200,
    });
  } catch (error) {
    console.error("Error retrieving transactions:", error);
    return res.status(500).json({ message: "Error retrieving transactions" });
  }
};

export const fetchShopifyCustomersCust = async (req, res) => {
  try {
    let { store } = req.query;
    if (!store) {
      return res.status(statusMaker.badRequest).json({
        message: "Store query parameter is required.",
      });
    }
    const processedStore = await storeHandler(store);
    const storeCredentials = await accessSchema.findOne({
      where: { store: processedStore },
    });

    if (!storeCredentials) {
      return res.status(statusMaker.notFound).json({
        message: "Store credentials not found.",
      });
    }

    const { shopname, access_token } = storeCredentials;
    const { page_info, limit = 50 } = req.query;
    const baseUrl = `https://${shopname}/admin/api/2021-01/customers.json`;

    const url = page_info
      ? `${baseUrl}?limit=${limit}&page_info=${page_info}`
      : `${baseUrl}?limit=${limit}`;

    const customersData = await axios({
      url,
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": access_token,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const customers = customersData.data.customers || [];
    const length = customers.length;

    const linkHeader = customersData.headers.link;
    const nextPageInfo = linkHeader?.match(
      /<.*page_info=(.*?)>; rel="next"/
    )?.[1];
    const prevPageInfo = linkHeader?.match(
      /<.*page_info=(.*?)>; rel="previous"/
    )?.[1];

    return res.status(statusMaker.found).json({
      status: statusMaker.found,
      length,
      data: customers,
      pagination: {
        next: nextPageInfo || null,
        previous: prevPageInfo || null,
      },
    });
  } catch (error) {
    console.error("Error fetching Shopify customers:", error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

// New customer code

export const customerShopifyUpdate = async (req, res) => {
  try {
    console.log("req.bidy", req.body);
  } catch (error) {
    console.error("Error during customer registration:", error);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const customerShopifyDelete = async (req, res) => {
  try {
    console.log("req.bidy", req.body);
  } catch (error) {
    console.error("Error during customer registration:", error);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

//   const customerData = {};

//   metafields.forEach((metafield) => {
//     const { key, value } = metafield;
//     switch (key) {
//       case "hobby":
//         customerData.hobby = value;
//         break;
//       case "brandtob":
//         customerData.brand_tob = value;
//         break;
//       case "smoker":
//         customerData.smoker = value;
//         break;
//       case "income":
//         customerData.income = value;
//         break;
//       case "birthplace":
//         customerData.birthplace = value;
//         break;
//       case "account_number":
//         customerData.account_number = value;
//         break;
//       case "full_name":
//         const [firstName, lastName] = value.split(" ");
//         customerData.first_name = firstName;
//         customerData.last_name = lastName || "";
//         break;
//       case "date_of_birth":
//         customerData.date_of_birth = value;
//         break;
//       case "gender":
//         customerData.gender = value;
//         break;
//       case "mlevel":
//         customerData.membership_tier = value;
//         break;
//       case "marital_status":
//         customerData.marital_status = value;
//         break;
//       case "marriage_anniversary_date":
//         customerData.marriage_anniversary = value;
//         break;
//       case "rajnigandha_reward_points":
//         customerData.earned_point = value;
//         break;
//       case "Redeem Points":
//         customerData.redeem_point = value;
//         break;
//       default:
//         break;
//     }
//   });

//   return customerData;
// };

// const saveCustomerData = async (customerData) => {
//   try {
//     const existingCustomer = await customer.findOne({
//       where: { customer_id: customerData.customer_id },
//     });

//     if (existingCustomer) {
//       await existingCustomer.update(customerData);
//       console.log("Customer updated successfully:", existingCustomer);
//     } else {
//       const newCustomer = await customer.create(customerData);
//       console.log("Customer created successfully:", newCustomer);
//     }
//   } catch (error) {
//     console.error("Error saving customer data:", error);
//   }
// };

// export const syncShopifyCustomerMetafields = async (req, res) => {
//   try {
//     let { store } = req.query;
//     if (!store) {
//       return res.status(statusMaker.badRequest).json({
//         message: "Store query parameter is required.",
//       });
//     }
//     const processedStore = await storeHandler(store);
//     const storeCredentials = await accessSchema.findOne({
//       where: { store: processedStore },
//     });

//     if (!storeCredentials) {
//       return res.status(statusMaker.notFound).json({
//         message: "Store credentials not found.",
//       });
//     }

//     const { shopname, access_token } = storeCredentials;

//     const query = `
//       query {
//         ${customerIds.map(
//           (id, index) => `
//           customer${index}: customer(id: "${id}") {
//             id
//             email
//             phone
//             firstName
//             lastName
//             defaultAddress {
//               address1
//               address2
//               city
//               country
//               zip
//             }
//             metafields(first: 250) {
//               nodes {
//                 key
//                 value
//               }
//             }
//           }
//         `
//         ).join("\n")}
//       }
//     `;

//     const response = await axios.post(
//       `https://${shopname}/admin/api/2025-01/graphql.json`,
//       { query },
//       {
//         headers: {
//           "X-Shopify-Access-Token": access_token,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     const data = response.data.data;

//     for (const key in data) {
//       const customerData = data[key];
//       const metafields = customerData.metafields.nodes;
//       const mappedData = mapMetafieldsToCustomer(metafields);

//       const completeCustomerData = {
//         customer_id: customerData.id,
//         email: customerData.email,
//         phone_number: customerData.phone,
//         first_name: customerData.firstName,
//         last_name: customerData.lastName,
//         address1: customerData.defaultAddress?.address1,
//         address2: customerData.defaultAddress?.address2,
//         city: customerData.defaultAddress?.city,
//         country: customerData.defaultAddress?.country,
//         zip: customerData.defaultAddress?.zip,
//         ...mappedData,
//       };

//       await saveCustomerData(completeCustomerData);
//     }

//     res.status(200).json({ message: "Customer data synchronized successfully." });
//   } catch (error) {
//     console.error("Error syncing Shopify customer metafields:", error.message);
//     res.status(500).json({ message: "Error syncing Shopify customer metafields." });
//   }
// };
