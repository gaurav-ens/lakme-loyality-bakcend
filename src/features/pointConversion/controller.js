import {
  responseHandler,
  errorHandler,
  statusMaker,
  apiMessages,
  ruleSetSchema,
  RuleSetModified,
  paywithrewards,
  point_checkout,
  customer,
  transition,
  point,
  checkEmptyArray,
  registration,
  storeHandler,
  accessSchema,
  campaign,
  tier_mangement,
  Notification,
  customer_redeem_rule,
  order_redeem_product,
  campaign_new,
  customer_campaign_data,
  // customerPointCalculation
  config
} from "./index";
import axios from "axios";
import Sequelize from "sequelize";
import cron from "node-cron";
import sequelize from "../../../src/config/db";
import xlsx from "xlsx";
// import multer from "multer";
import fs from "fs";

import { Op, QueryTypes } from "sequelize";
import { calculateAmountEquivalent } from "../../helpers/calculateAmountEquivalent";
import moment from "moment";
import _ from "lodash";

import { handleNotifications } from "../../helpers/smstemplate";


// import { product } from "../product";

// const shopName = "lakmestaging.myshopify.com";


// cron.schedule("0 1 * * *", async () => {
//   try {
//     console.log("Starting daily held transition processing...");
//     await updateCustomerHeldTransitions();
//     await updateExpiryPoints();
//     await birthdayGiftPoint();
//     console.log("Daily held transition processing completed.");
//   } catch (error) {
//     console.error("Error in daily held transition processing:", error.message);
//   }
// }); 00 12 * * *

// cron.schedule("0 1 * * *", async () => {
//   try {
//     console.log("Starting daily held transition processing...");
//     await updateCustomerHeldTransitions();
//     await updateExpiryPoints();
//     await birthdayGiftPoint();
//     console.log("Daily held transition processing completed.");
//   } catch (error) {
//     console.error("Error in daily held transition processing:", error.message);
//   }
// });

// cron.schedule("0 1 * * *", async () => {
//   try {
//     console.log("Starting daily held transition processing...");
//     await updateExpiryPoints();
//     console.log("Daily held transition processing completed.");
//   } catch (error) {
//     console.error("Error in daily held transition processing:", error.message);
//   }
// });

cron.schedule("0 2 * * *", async () => {
  console.log("Running daily birthday cron check...");
  updateExpiryPointsFun();
  updateCustomerHeldTransitionsFun();
  updateIsRedeemCustomerFun();
  getTodaysBirthdaysFun2();
});

export const create = async (req, res) => {
  try {
    const {
      ruleType = "online_purchase",
      purchaseValue,
      points,
      remarks,
      store,
    } = req.body;
    const processedStore = await storeHandler(store);
    if (!purchaseValue || !points) {
      return res.status(statusMaker.badRequest).json({
        message: "purchaseValue and pointsAwarded are required.",
      });
    }
    const amountEquivalent = await calculateAmountEquivalent(points);

    console.log(
      "Formatted Amount Equivalent:",
      amountEquivalent,
      "Type:",
      typeof amountEquivalent
    );

    const pointsData = await ruleSetSchema.create({
      ruleType,
      purchaseValue,
      points,
      amountEquivalent: amountEquivalent,
      remarks,
      store: processedStore,
    });

    const response = responseHandler(
      statusMaker.created,
      apiMessages.create,
      pointsData
    );

    return res.status(statusMaker.created).json(response);
  } catch (error) {
    console.error(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const update = async (req, res) => {
  try {
    const { id, store } = req.query;
    const processedStore = await storeHandler(store);
    const {
      ruleType = "online_purchase",
      purchaseValue,
      points,
      status,
      remarks,
    } = req.body;
    const existingData = await ruleSetSchema.findOne({
      where: { id, ruleType, store: processedStore },
    });

    if (!existingData) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingData
      );
      return res.status(statusMaker.notFound).json(response);
    }
    let amountEquivalent = existingData.amountEquivalent;
    if (points) {
      amountEquivalent = await calculateAmountEquivalent(points);
      console.log("Updated Amount Equivalent:", amountEquivalent);
    }
    await ruleSetSchema.update(
      {
        purchaseValue,
        points,
        status,
        remarks,
        amountEquivalent,
      },
      {
        where: { id, store: processedStore },
      }
    );
    const updatedData = await ruleSetSchema.findOne({
      where: { id },
    });

    const response = responseHandler(
      statusMaker.updated,
      apiMessages.update,
      updatedData
    );

    return res.status(statusMaker.updated).json(response);
  } catch (error) {
    console.error(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};
export const list = async (req, res) => {
  try {
    const { ruleType, store } = req.query;
    const processedStore = await storeHandler(store);
    const queryOptions = ruleType ? { where: { ruleType } } : {};
    const pointsData = await ruleSetSchema.findAll({
      queryOptions,
      store: processedStore,
    });
    if (checkEmptyArray(pointsData)) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        pointsData
      );
      return res.status(statusMaker.notFound).json(response);
    }
    const response = responseHandler(
      statusMaker.found,
      apiMessages.found,
      pointsData
    );
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

// export const list = async (req, res) => {
//   try {
//     const pointsData = await ruleSetSchema.findAll();
//     if (checkEmptyArray(pointsData)) {
//       const response = responseHandler(
//         statusMaker.notFound,
//         apiMessages.notFound,
//         pointsData
//       );
//       return res.status(statusMaker.notFound).json(response);
//     }
//     const response = responseHandler(
//       statusMaker.found,
//       apiMessages.found,
//       pointsData
//     );
//     return res.status(statusMaker.found).json(response);
//   } catch (error) {
//     const response = errorHandler(error);
//     return res.status(statusMaker.internalError).json(response);
//   }
// };

export const deleted = async (req, res) => {
  try {
    const { id } = req.query;
    const existingData = await ruleSetSchema.findOne({ where: { id } });
    if (!existingData) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingData
      );
      return res.status(statusMaker.notFound).json(response);
    }
    await ruleSetSchema.destroy({
      where: { id },
    });
    const response = responseHandler(statusMaker.deleted, apiMessages.deleted, {
      id,
    });
    return res.status(statusMaker.deleted).json(response);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const getById = async (req, res) => {
  try {
    const { id, ruleType } = req.query;
    const existingData = await ruleSetSchema.findOne({
      where: { id: id, ruleType: ruleType },
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
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const fetchShopifyProducts = async (req, res) => {
  try {
    const { store } = req.query;
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

    const { shopname, access_token, apiVersion } = storeCredentials;
    const productsData = await axios({
      url: `https://${shopname}/admin/api/${apiVersion}/products.json?status=active`,
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": access_token,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    console.log(
      "productsData",
      `https://${shopname}/admin/api/${apiVersion}/products.json?status=active`
    );
    console.log("productsData", productsData.data);
    return res
      .status(statusMaker.found)
      .json({ status: statusMaker.found, data: productsData.data });
  } catch (error) {
    console.error(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const pointsSpecificSKUBasedCreate = async (req, res) => {
  try {
    const { store } = req.body;
    const processedStore = await storeHandler(store);
    const {
      ruleType = "sku_specific",
      skuNo,
      productName,
      points,
      remarks,
    } = req.body;
    if (!skuNo || !points || !productName) {
      return res.status(statusMaker.badRequest).json({
        message: "skuNo,productName and points are required.",
      });
    }
    const amountEquivalent = await calculateAmountEquivalent(points);
    const SKUData = await ruleSetSchema.create({
      ruleType,
      skuNo,
      productName,
      points,
      amountEquivalent,
      remarks,
      store: processedStore,
    });
    const response = responseHandler(
      statusMaker.created,
      apiMessages.create,
      SKUData
    );
    return res.status(statusMaker.created).json(response);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const pointsSpecificSKUBasedUpdate = async (req, res) => {
  try {
    const { id, store } = req.query;
    const processedStore = await storeHandler(store);
    const { ruleType = "sku_specific", points, status, remarks } = req.body;
    const existingData = await ruleSetSchema.findOne({
      where: { id, ruleType, store: processedStore },
    });

    if (!existingData) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingData
      );
      return res.status(statusMaker.notFound).json(response);
    }
    let amountEquivalent = existingData.amountEquivalent;
    if (points) {
      amountEquivalent = await calculateAmountEquivalent(points);
      console.log("Updated Amount Equivalent:", amountEquivalent);
    }
    await ruleSetSchema.update(
      {
        points,
        status,
        remarks,
        amountEquivalent,
      },
      {
        where: { id, store: processedStore },
      }
    );
    const updatedPointsData = await ruleSetSchema.findOne({
      where: { id, store: processedStore },
    });

    const response = responseHandler(
      statusMaker.updated,
      apiMessages.update,
      updatedPointsData
    );

    return res.status(statusMaker.updated).json(response);
  } catch (error) {
    console.error(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const pointsSpecificSKUBasedlist = async (req, res) => {
  try {
    const { store } = req.query;
    const processedStore = await storeHandler(store);
    const data = await ruleSetSchema.findAll({ store: processedStore });
    if (checkEmptyArray(data)) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        data
      );
      return res.status(statusMaker.notFound).json(response);
    }
    const response = responseHandler(
      statusMaker.found,
      apiMessages.found,
      data
    );
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    console.error(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const pointsSpecificSKUBasedgetByID = async (req, res) => {
  try {
    const { id, ruleType } = req.query;
    const existingData = await ruleSetSchema.findOne({
      where: { id: id, ruleType: ruleType },
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
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

//after 50 nodes//pagination

// export const fetchCategories = async (req, res) => {
//   try {
//     let allCollections = [];
//     let hasNextPage = true;
//     let endCursor = null;
//     while (hasNextPage) {
//       const query = `
//         query {
//           collections(first: 50 ${endCursor ? `, after: "${endCursor}"` : ""}) {
//             nodes {
//               id
//               title
//             }
//             pageInfo {
//               hasNextPage
//               endCursor
//             }
//           }
//         }
//       `;

//       const response = await axios({
//         url: `https://${shopName}/admin/api/2024-04/graphql.json`,
//         method: "POST",
//         headers: {
//           "X-Shopify-Access-Token": shopToken,
//           Accept: "application/json",
//           "Content-Type": "application/json",
//           "Cookie": "request_method=POST; request_method=POST"
//         },
//         data: JSON.stringify({ query })
//       });

//       const { data } = response.data;
//       allCollections = allCollections.concat(data.collections.nodes);
//       hasNextPage = data.collections.pageInfo.hasNextPage;
//       endCursor = data.collections.pageInfo.endCursor;
//     }
//     return res.status(200).json({ status: "success", data: allCollections });
//   } catch (error) {
//     console.error("Error fetching categories:", error.message);
//     const response = errorHandler(error);
//     return res.status(500).json(response);
//   }
// };

//end 50 nodes//pagination

// export const fetchCategories = async (req, res) => {
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
//         collections(first: 50) {
//           nodes {
//             id
//             title
//           }
//         }
//       }
//     `;
//     const categoiesData = await axios({
//       url: `https://${shopname}/admin/api/2021-01/graphql.json`,
//       method: "POST",
//       headers: {
//         "X-Shopify-Access-Token": access_token,
//         Accept: "application/json",
//         "Content-Type": "application/json",
//         Cookie: "request_method=POST; request_method=POST",
//       },
//       data: JSON.stringify({ query }),
//     });
//     return res.status(statusMaker.found).json(categoiesData.data);
//   } catch (error) {
//     console.log(error.message);
//     const response = errorHandler(error);
//     return res.status(statusMaker.internalError).json(response);
//   }
// };

export const fetchCategories = async (req, res) => {
  try {
    let { store } = req.query;

    // Validate the store query parameter
    if (!store) {
      return res.status(statusMaker.badRequest).json({
        message: "Store query parameter is required.",
      });
    }

    // Process store and fetch credentials
    const processedStore = await storeHandler(store);
    const storeCredentials = await accessSchema.findOne({
      where: { store: processedStore },
    });

    // Check if store credentials exist
    if (!storeCredentials) {
      return res.status(statusMaker.notFound).json({
        message: "Store credentials not found.",
      });
    }

    const { shopname, access_token } = storeCredentials;

    // GraphQL query to fetch collections
    const query = `
      query {
        collections(first: 50) {
          nodes {
            id
            title
            handle
          }
        }
      }
    `;

    // Make the request to Shopify API
    const response = await axios({
      url: `https://${shopname}/admin/api/2021-01/graphql.json`,
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": access_token,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      data: JSON.stringify({ query }),
    });
    console.log("Response", response);
    // Transform the titles to lowercase
    const collections = response.data.data.collections.nodes.map(
      (collection) => ({
        id: collection.id,
        title: collection.title.toLowerCase(),
        handle: collection.handle.toLowerCase(),
      })
    );

    // Return the transformed data
    return res.status(statusMaker.found).json({
      collections,
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching categories:", error.message);

    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const categoriesCreate = async (req, res) => {
  try {
    const {
      ruleType = "category",
      category,
      points,
      remarks,
      store,
    } = req.body;
    const processedStore = await storeHandler(store);
    if (!ruleType || !category || !points) {
      return res.status(statusMaker.badRequest).json({
        message: "ruleType,category and points are required.",
      });
    }
    const amountEquivalent = await calculateAmountEquivalent(points);

    const categoryData = await ruleSetSchema.create({
      ruleType,
      category,
      points,
      amountEquivalent,
      remarks,
      store: processedStore,
    });

    const response = responseHandler(
      statusMaker.created,
      apiMessages.create,
      categoryData
    );

    return res.status(statusMaker.created).json(response);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const categoriesUpdate = async (req, res) => {
  try {
    const { id, store } = req.query;
    const processedStore = await storeHandler(store);
    const {
      ruleType = "category",
      category,
      points,
      status,
      remarks,
    } = req.body;
    const existingData = await ruleSetSchema.findOne({
      where: { id, ruleType, store: processedStore },
    });

    if (!existingData) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingData
      );
      return res.status(statusMaker.notFound).json(response);
    }
    let amountEquivalent = existingData.amountEquivalent;
    if (points) {
      amountEquivalent = await calculateAmountEquivalent(points);
      console.log("Updated Amount Equivalent:", amountEquivalent);
    }
    await ruleSetSchema.update(
      {
        category,
        points,
        status,
        remarks,
        amountEquivalent,
      },
      {
        where: { id, store: processedStore },
      }
    );
    const updatedPointsData = await ruleSetSchema.findOne({
      where: { id, store: processedStore },
    });

    const response = responseHandler(
      statusMaker.updated,
      apiMessages.update,
      updatedPointsData
    );

    return res.status(statusMaker.updated).json(response);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const retailCouponCreate = async (req, res) => {
  try {
    const {
      ruleType = "retail_coupon",
      skuNo,
      productName,
      points,
      remarks,
      store,
    } = req.body;
    const processedStore = await storeHandler(store);
    // if (!skuNo || !points || !productName) {
    //   return res.status(statusMaker.badRequest).json({
    //     message: "skuNo,productName and points are required.",
    //   });
    // }
    const amountEquivalent = await calculateAmountEquivalent(points);
    const SKUData = await ruleSetSchema.create({
      ruleType,
      skuNo,
      productName,
      points,
      amountEquivalent,
      remarks,
      store: processedStore,
    });
    const response = responseHandler(
      statusMaker.created,
      apiMessages.create,
      SKUData
    );
    return res.status(statusMaker.created).json(response);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const retailCouponUpdate = async (req, res) => {
  try {
    const { id, store } = req.query;
    const processedStore = await storeHandler(store);
    const { ruleType = "retail_coupon", points, status, remarks } = req.body;
    const existingData = await ruleSetSchema.findOne({
      where: { id, ruleType, store: processedStore },
    });

    if (!existingData) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingData
      );
      return res.status(statusMaker.notFound).json(response);
    }
    let amountEquivalent = existingData.amountEquivalent;
    if (points) {
      amountEquivalent = await calculateAmountEquivalent(points);
      console.log("Updated Amount Equivalent:", amountEquivalent);
    }
    await ruleSetSchema.update(
      {
        points,
        status,
        remarks,
        amountEquivalent,
      },
      {
        where: { id, store: processedStore },
      }
    );
    const updatedPointsData = await ruleSetSchema.findOne({
      where: { id, store: processedStore },
    });

    const response = responseHandler(
      statusMaker.updated,
      apiMessages.update,
      updatedPointsData
    );

    return res.status(statusMaker.updated).json(response);
  } catch (error) {
    console.error(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const bonusPointCreate = async (req, res) => {
  try {
    const {
      ruleType = "bonus_campaign",
      purchaseValue,
      productName,
      category,
      points,
      remarks,
      store,
    } = req.body;
    const processedStore = await storeHandler(store);
    // if (!purchaseValue || !points || !productName) {
    //   return res.status(statusMaker.badRequest).json({
    //     message: "purchaseValue,productName and points are required.",
    //   });
    // }
    const amountEquivalent = await calculateAmountEquivalent(points);

    console.log(
      "Formatted Amount Equivalent:",
      amountEquivalent,
      "Type:",
      typeof amountEquivalent
    );

    const bonusPointData = await ruleSetSchema.create({
      ruleType,
      purchaseValue,
      productName,
      category,
      points,
      amountEquivalent,
      remarks,
      store: processedStore,
    });
    const response = responseHandler(
      statusMaker.created,
      apiMessages.create,
      bonusPointData
    );
    return res.status(statusMaker.created).json(response);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const bonusPointUpdate = async (req, res) => {
  try {
    const { id, store } = req.query;
    const processedStore = await storeHandler(store);
    const {
      ruleType = "bonus_campaign",
      purchaseValue,
      productName,
      category,
      points,
      remarks,
      status,
    } = req.body;
    // if (!purchaseValue || !points || !productName) {
    //   return res.status(statusMaker.badRequest).json({
    //     message: "purchaseValue,productName and points are required.",
    //   });
    // }
    const existingData = await ruleSetSchema.findOne({
      where: { id, ruleType, store: processedStore },
    });

    if (!existingData) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingData
      );
      return res.status(statusMaker.notFound).json(response);
    }
    let amountEquivalent = existingData.amountEquivalent;
    if (points) {
      amountEquivalent = await calculateAmountEquivalent(points);
      console.log("Updated Amount Equivalent:", amountEquivalent);
    }
    await ruleSetSchema.update(
      {
        purchaseValue,
        productName,
        category,
        points,
        status,
        remarks,
        amountEquivalent,
      },
      {
        where: { id, store: processedStore },
      }
    );
    const bonusPointUpdatedData = await ruleSetSchema.findOne({
      where: { id, store: processedStore },
    });

    const response = responseHandler(
      statusMaker.updated,
      apiMessages.update,
      bonusPointUpdatedData
    );

    return res.status(statusMaker.updated).json(response);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const registerbasedCreate = async (req, res) => {
  try {
    const {
      ruleType = "registration_based",
      points = 0,
      remarks,
      store,
    } = req.body;
    const processedStore = await storeHandler(store);
    if (!ruleType) {
      return res.status(statusMaker.badRequest).json({
        message: "ruleType is required.",
      });
    }
    const registerData = await ruleSetSchema.create({
      ruleType,
      points,
      remarks,
      store: processedStore,
    });
    const response = responseHandler(
      statusMaker.created,
      apiMessages.create,
      registerData
    );
    return res.status(statusMaker.created).json(response);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const registerbasedUpdate = async (req, res) => {
  try {
    const { id, store } = req.query;
    const processedStore = await storeHandler(store);
    const {
      ruleType = "registration_based",
      points,
      status,
      remarks,
    } = req.body;
    const existingData = await ruleSetSchema.findOne({
      where: { id, ruleType, store: processedStore },
    });

    if (!existingData) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingData
      );
      return res.status(statusMaker.notFound).json(response);
    }
    await ruleSetSchema.update(
      {
        points,
        status,
        remarks,
      },
      {
        where: { id, store: processedStore },
      }
    );
    const updateRegisterData = await ruleSetSchema.findOne({
      where: { id, store: processedStore },
    });

    const response = responseHandler(
      statusMaker.updated,
      apiMessages.update,
      updateRegisterData
    );

    return res.status(statusMaker.updated).json(response);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const expiryCreate = async (req, res) => {
  try {
    const { ruleType = "expiry", remarks, store } = req.body;
    const processedStore = await storeHandler(store);
    if (!ruleType) {
      return res.status(statusMaker.badRequest).json({
        message: "ruleType is required.",
      });
    }
    const registerData = await ruleSetSchema.create({
      ruleType,
      remarks,
      store: processedStore,
    });
    const response = responseHandler(
      statusMaker.created,
      apiMessages.create,
      registerData
    );
    return res.status(statusMaker.created).json(response);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const expiryUpdate = async (req, res) => {
  try {
    const { id, store } = req.query;
    const processedStore = await storeHandler(store);
    const { ruleType = "expiry", expiresOn } = req.body;
    const existingData = await ruleSetSchema.findOne({
      where: { id, ruleType, store: processedStore },
    });

    if (!existingData) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingData
      );
      return res.status(statusMaker.notFound).json(response);
    }
    await ruleSetSchema.update(
      {
        expiresOn,
      },
      {
        where: { id, store: processedStore },
      }
    );
    const updateRegisterData = await ruleSetSchema.findOne({
      where: { id, store: processedStore },
    });

    const response = responseHandler(
      statusMaker.updated,
      apiMessages.update,
      updateRegisterData
    );

    return res.status(statusMaker.updated).json(response);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const pointsSpecificSKUBasedDelete = async (req, res) => {
  try {
    const { id, ruleType = "sku_specific" } = req.query;
    const existingData = await ruleSetSchema.findOne({
      where: { id: id, ruleType: ruleType },
    });
    if (!existingData) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingData
      );
      return res.status(statusMaker.notFound).json(response);
    }
    await ruleSetSchema.destroy({
      where: { id },
    });
    const response = responseHandler(statusMaker.deleted, apiMessages.deleted, {
      id,
    });
    return res.status(statusMaker.deleted).json(response);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const bonusPointDelete = async (req, res) => {
  try {
    const { id, ruleType = "bonus_campaign" } = req.query;
    const existingData = await ruleSetSchema.findOne({
      where: { id: id, ruleType: ruleType },
    });
    if (!existingData) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingData
      );
      return res.status(statusMaker.notFound).json(response);
    }
    await ruleSetSchema.destroy({
      where: { id },
    });
    const response = responseHandler(statusMaker.deleted, apiMessages.deleted, {
      id,
    });
    return res.status(statusMaker.deleted).json(response);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const categoriesDelete = async (req, res) => {
  try {
    const { id, ruleType = "category" } = req.query;
    const existingData = await ruleSetSchema.findOne({
      where: { id: id, ruleType: ruleType },
    });
    if (!existingData) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingData
      );
      return res.status(statusMaker.notFound).json(response);
    }
    await ruleSetSchema.destroy({
      where: { id },
    });
    const response = responseHandler(statusMaker.deleted, apiMessages.deleted, {
      id,
    });
    return res.status(statusMaker.deleted).json(response);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const registerbasedDelete = async (req, res) => {
  try {
    const { id, ruleType = "registration_based" } = req.query;
    const existingData = await ruleSetSchema.findOne({
      where: { id: id, ruleType: ruleType },
    });
    if (!existingData) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingData
      );
      return res.status(statusMaker.notFound).json(response);
    }
    await ruleSetSchema.destroy({
      where: { id },
    });
    const response = responseHandler(statusMaker.deleted, apiMessages.deleted, {
      id,
    });
    return res.status(statusMaker.deleted).json(response);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};
export const retailCouponDelete = async (req, res) => {
  try {
    const { id, ruleType = "retail_coupon" } = req.query;
    const existingData = await ruleSetSchema.findOne({
      where: { id: id, ruleType: ruleType },
    });
    if (!existingData) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingData
      );
      return res.status(statusMaker.notFound).json(response);
    }
    await ruleSetSchema.destroy({
      where: { id },
    });
    const response = responseHandler(statusMaker.deleted, apiMessages.deleted, {
      id,
    });
    return res.status(statusMaker.deleted).json(response);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const redemptionBasedCreate = async (req, res) => {
  try {
    const {
      ruleType = "redemption",
      points,
      minValue,
      maxValue,
      remarks,
      store,
    } = req.body;
    const processedStore = await storeHandler(store);
    if (!minValue || !maxValue) {
      return res.status(statusMaker.badRequest).json({
        message: "minValue and maxValue are required.",
      });
    }
    const redemptedData = await ruleSetSchema.create({
      ruleType,
      points,
      minValue,
      maxValue,
      remarks,
      store: processedStore,
    });

    const response = responseHandler(
      statusMaker.created,
      apiMessages.create,
      redemptedData
    );

    return res.status(statusMaker.created).json(response);
  } catch (error) {
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const redemptionBasedUpdate = async (req, res) => {
  try {
    const { id, store } = req.query;
    const processedStore = await storeHandler(store);
    const {
      ruleType = "redemption",
      points,
      minValue,
      maxValue,
      remarks,
      status,
    } = req.body;
    if (!ruleType) {
      return res.status(statusMaker.badRequest).json({
        message: "ruleType are required.",
      });
    }
    const existingData = await ruleSetSchema.findOne({
      where: { id, ruleType, store: processedStore },
    });
    if (!existingData) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingData
      );
      return res.status(statusMaker.notFound).json(response);
    }
    await ruleSetSchema.update(
      {
        ruleType,
        points,
        minValue,
        maxValue,
        status,
        remarks,
      },
      {
        where: { id, store: processedStore },
      }
    );
    const updatedData = await ruleSetSchema.findOne({
      where: { id, store: processedStore },
    });
    const response = responseHandler(
      statusMaker.created,
      apiMessages.create,
      updatedData
    );

    return res.status(statusMaker.created).json(response);
  } catch (error) {
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const paywithRewardsCreate = async (req, res) => {
  try {
    const {
      ruleType = "paywithrewards",
      redemption_type,
      points,
      purchasethroughpay,
      minValue,
      maxValue,
      maximumPoint,
      remarks,
      store,
    } = req.body;
    const processedStore = await storeHandler(store);
    if (!points) {
      return res.status(statusMaker.badRequest).json({
        message: "points are required.",
      });
    }
    const amountEquivalent = await calculateAmountEquivalent(points);

    console.log(
      "Formatted Amount Equivalent:",
      amountEquivalent,
      "Type:",
      typeof amountEquivalent
    );
    const validatedRedemablePoints = redemablePoints
      ? redemablePoints % 6 === 0
        ? redemablePoints
        : Math.ceil(redemablePoints / 6) * 6
      : 6;
    const rewardsData = await ruleSetSchema.create({
      ruleType,
      redemption_type,
      points,
      purchasethroughpay,
      minValue,
      maxValue,
      maximumPoint,
      amountEquivalent,
      remarks,
      store: processedStore,
    });

    const response = responseHandler(
      statusMaker.created,
      apiMessages.create,
      rewardsData
    );

    return res.status(statusMaker.created).json(response);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const paywithRewardsUpdate = async (req, res) => {
  try {
    const { id, store } = req.query;
    const processedStore = await storeHandler(store);
    const {
      ruleType = "paywithrewards",
      redemption_type,
      points,
      purchasethroughpay,
      minValue,
      maxValue,
      maximumPoint,
      minimumRedemption,
      limitationofRedemptionperday,
      status,
      remarks,
    } = req.body;
    const existingData = await ruleSetSchema.findOne({
      where: { id, ruleType, store, processedStore },
    });

    if (!existingData) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingData
      );
      return res.status(statusMaker.notFound).json(response);
    }
    let amountEquivalent = existingData.amountEquivalent;
    if (points) {
      amountEquivalent = await calculateAmountEquivalent(points);
      console.log("Updated Amount Equivalent:", amountEquivalent);
    }
    await ruleSetSchema.update(
      {
        ruleType,
        redemption_type,
        points,
        purchasethroughpay,
        minValue,
        maxValue,
        maximumPoint,
        status,
        remarks,
        amountEquivalent,
      },
      {
        where: { id, store: processedStore },
      }
    );
    const updatedData = await ruleSetSchema.findOne({
      where: { id, store: processedStore },
    });

    const response = responseHandler(
      statusMaker.updated,
      apiMessages.update,
      updatedData
    );

    return res.status(statusMaker.updated).json(response);
  } catch (error) {
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const addOrUpdateRuleSet = async (req, res) => {
  try {
    const {
      id,
      point_conversion_online_purchase,
      point_conversion_based_on_sku,
      point_conversion_based_on_category,
      bonus_point,
      coupon,
      twox_reward_online,
      twox_reward_offline,
      campaign,
      registration,
      createdBy,
      store,
    } = req.body;
    const processedStore = await storeHandler(store);
    if (
      !point_conversion_online_purchase ||
      !point_conversion_based_on_sku ||
      !point_conversion_based_on_category ||
      !bonus_point ||
      !coupon ||
      !twox_reward_online ||
      !twox_reward_offline ||
      !campaign ||
      !registration ||
      !createdBy
    ) {
      return res.status(400).json({
        message: "Missing required fields.",
      });
    }

    const stringifyJson = (field) =>
      typeof field === "string" ? field : JSON.stringify(field);

    const updatedData = {
      point_conversion_online_purchase: stringifyJson(
        point_conversion_online_purchase
      ),
      point_conversion_based_on_sku: stringifyJson(
        point_conversion_based_on_sku
      ),
      point_conversion_based_on_category: stringifyJson(
        point_conversion_based_on_category
      ),
      bonus_point: stringifyJson(bonus_point),
      coupon: stringifyJson(coupon),
      twox_reward_online: stringifyJson(twox_reward_online),
      twox_reward_offline: stringifyJson(twox_reward_offline),
      campaign: stringifyJson(campaign),
      registration: stringifyJson(registration),
      createdBy: stringifyJson(createdBy),
      store: processedStore,
    };
    let ruleSet = await RuleSetModified.findByPk(id);

    if (ruleSet) {
      await ruleSet.update(updatedData);

      return res.status(200).json({
        message: "Rule set updated successfully.",
        data: ruleSet,
        status: 200,
      });
    } else {
      ruleSet = await RuleSetModified.create(updatedData);
      return res.status(201).json({
        message: "Rule set created successfully.",
        data: ruleSet,
      });
    }
  } catch (error) {
    console.error("Error in create or update rule set:", error.message);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
      status: 201,
    });
  }
};

export const deleteValue = async (req, res) => {
  try {
    const { id, type, value_id } = req.body;
    console.log("id, type, value_id", id, type, value_id);
    // const ruleSet = await RuleSetModified.findOne({ id });
    const ruleSet = await RuleSetModified.findOne({ where: { id } });
    console.log("ruleSet", ruleSet);

    if (!ruleSet) {
      return res.status(404).json({ message: "Rule set not found" });
    }
    let typeData = ruleSet[type];
    if (typeof typeData === "string") {
      typeData = JSON.parse(typeData);
    }

    if (!typeData || !typeData.value) {
      return res.status(400).json({
        message: `Type ${type} does not exist or is invalid in the rule set`,
      });
    }
    if (value_id) {
      typeData.value = typeData.value.filter(
        (item) => item.value_id !== value_id
      );
    } else {
      typeData.value = [];
    }
    ruleSet[type] = JSON.stringify(typeData);
    await ruleSet.save();
    res.status(200).json({
      message: "Value deleted successfully",
      status: 200,
      updatedRuleSet: ruleSet,
    });
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error });
  }
};

export const editValue = async (req, res) => {
  try {
    const { id, type, value_id, updatedData } = req.body;
    // const processedStore = await storeHandler(store);
    console.log(
      "id, type, value_id, updatedData",
      id,
      type,
      value_id,
      updatedData
    );
    const ruleSet = await RuleSetModified.findOne({ id });
    console.log("ruleSet", ruleSet);

    if (!ruleSet) {
      return res.status(404).json({ message: "Rule set not found" });
    }
    let typeData = ruleSet[type];
    if (typeof typeData === "string") {
      typeData = JSON.parse(typeData);
    }

    if (!typeData || !typeData.value) {
      return res.status(400).json({
        message: `Type ${type} does not exist or is invalid in the rule set`,
      });
    }
    let itemIndex = typeData.value.findIndex(
      (item) => item.value_id === value_id
    );
    if (itemIndex === -1) {
      return res
        .status(404)
        .json({ message: `Item with value_id ${value_id} not found` });
    }
    typeData.value[itemIndex] = {
      ...typeData.value[itemIndex],
      ...updatedData,
    };
    ruleSet[type] = JSON.stringify(typeData);
    // ruleSet.store = processedStore
    await ruleSet.save();

    res
      .status(200)
      .json({ message: "Value edited successfully", updatedRuleSet: ruleSet });
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error });
  }
};

let currentValueId = 1;

const generateValueId = () => {
  const valueId = currentValueId;
  currentValueId++;
  return valueId.toString();
};

export const addValue = async (req, res) => {
  try {
    const { id, type, newValue } = req.body;
    const ruleSet = await RuleSetModified.findOne({ id });

    if (!ruleSet) {
      return res.status(404).json({ message: "Rule set not found" });
    }

    let typeData = ruleSet[type];
    if (typeof typeData === "string") {
      typeData = JSON.parse(typeData);
    }

    if (!typeData || !Array.isArray(typeData.value)) {
      return res.status(400).json({
        message: `Type ${type} does not exist or is invalid in the rule set`,
      });
    }

    if (!newValue.value_id) {
      newValue.value_id = generateValueId();
    }

    typeData.value.push(newValue);
    ruleSet[type] = JSON.stringify(typeData);
    await ruleSet.save();

    res.status(200).json({
      message: "Value added successfully",
      updatedRuleSet: ruleSet,
      status: 200,
      newValueId: newValue.value_id,
    });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "An error occurred", error });
  }
};

export const updateValue = async (req, res) => {
  try {
    const { id, type, newValue } = req.body;
    const ruleSet = await RuleSetModified.findOne({ where: { id } });
    if (!ruleSet) {
      return res.status(404).json({ message: "Rule set not found" });
    }

    let typeData = ruleSet[type];
    if (typeof typeData === "string") {
      typeData = JSON.parse(typeData);
    }

    if (!typeData || !Array.isArray(typeData.value)) {
      return res.status(400).json({
        message: `Type ${type} does not exist or is invalid in the rule set`,
      });
    }

    const itemIndex = typeData.value.findIndex(
      (item) => item.value_id === newValue.value_id
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        message: `Item with value_id ${newValue.value_id} not found in type ${type}`,
      });
    }
    typeData.value[itemIndex] = { ...typeData.value[itemIndex], ...newValue };

    ruleSet[type] = JSON.stringify(typeData);
    await ruleSet.save();

    res.status(200).json({
      message: "Value updated successfully",
      status: 200,
      updatedRuleSet: ruleSet,
    });
  } catch (error) {
    console.error("Error updating value:", error);
    res.status(500).json({ message: "An error occurred", error });
  }
};

export const getAll = async (req, res) => {
  try {
    const { store } = req.query;
    const processedStore = await storeHandler(store);
    const ruleSets = await RuleSetModified.findAll({
      where: {
        store: processedStore,
      },
    });
    if (ruleSets.length === 0) {
      return res.status(404).json({
        message: "No rule sets found.",
      });
    }
    return res.status(200).json({
      message: "Rule sets fetched successfully.",
      status: 200,
      data: ruleSets,
    });
  } catch (error) {
    console.error("Error fetching rule sets:", error.message);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};

export const createOrUpdateRedemption = async (req, res) => {
  try {
    const {
      id,
      enable,
      redemption_type,
      point_conversion_rate,
      reward_point_awarded_on_purchase,
      remarks,
      minValue,
      maxValue,
      max_point_limit,
      customer_redeem_point_multiple,
      createdBy,
      store,
    } = req.body;
    // const processedStore = await storeHandler(store);
    if (id) {
      // Check if the redemption record with the given id exists
      const existingRedemption = await paywithrewards.findByPk(id);
      if (existingRedemption) {
        // Update the existing redemption record
        await existingRedemption.update({
          enable,
          redemption_type,
          point_conversion_rate,
          reward_point_awarded_on_purchase,
          remarks,
          minValue,
          maxValue,
          max_point_limit,
          customer_redeem_point_multiple,
          createdBy,
          store,
        });

        return res.status(200).json({
          message: "Redemption record updated successfully.",
          data: existingRedemption,
          status: 200,
        });
      } else {
        return res.status(404).json({
          message: "Redemption record not found.",
        });
      }
    } else {
      // Create a new redemption record if no id is provided
      const newRedemption = await paywithrewards.create({
        enable,
        redemption_type,
        point_conversion_rate,
        reward_point_awarded_on_purchase,
        remarks,
        minValue,
        maxValue,
        max_point_limit,
        customer_redeem_point_multiple,
        createdBy,
        store,
      });

      return res.status(201).json({
        message: "Redemption record created successfully.",
        data: newRedemption,
        status: 200,
      });
    }
  } catch (error) {
    console.error(
      "Error in create or update redemption record:",
      error.message
    );
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};

export const getAllPWR = async (req, res) => {
  try {
    const { store } = req.query;
    const processedStore = await storeHandler(store);
    const redemptions = await paywithrewards.findAll({
      where: {
        store: processedStore,
      },
    });
    if (redemptions.length === 0) {
      return res.status(404).json({
        message: "No redemption records found.",
      });
    }
    return res.status(200).json({
      message: "Redemption records fetched successfully.",
      data: redemptions,
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching redemption records:", error.message);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};

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
    const ruleSets = await RuleSetModified.findAll({
      where: {
        store: "lakme",
      },
    });
    console.log("ruleSets", ruleSets);

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
          activeRules[ruleType] = ruleData.value;
        }
      });
    });
    return activeRules;
  } catch (error) {
    console.error("Error fetching active rules:", error.message);
    throw new Error("Error fetching active rules");
  }
};

export const checkoutDataPointcalculate = async (req, res) => {
  try {
    const { id, email, customer, line_items, subtotal_price, total_price } =
      req.body;
    const lineItemDetails = line_items.map((item) => ({
      product_id: item.product_id,
      line_price: parseFloat(item.line_price),
      price: parseFloat(item.price),
      sku: item.sku,
      title: item.title,
    }));

    console.log("lineItemDetails", lineItemDetails);

    // Fetch active rules
    const activeRules = await getActiveRules();
    console.log("Active Rules:", activeRules);

    let overallCalculatedPoints = 0;
    let calculatedPoints = [];
    const skuRules = activeRules.point_conversion_based_on_sku;

    if (skuRules) {
      lineItemDetails.forEach((item) => {
        let skuMatched = false;

        skuRules.forEach((rule) => {
          if (!rule.product_sku?.trim()) {
            console.warn("Rule with empty SKU skipped:", rule);
            return; // Skip rules with no SKU
          }

          console.log(
            `Comparing SKU: "${item.sku
              ?.trim()
              .toLowerCase()}" with Rule SKU: "${rule.product_sku
              ?.trim()
              .toLowerCase()}"`
          );

          if (
            rule.product_sku?.trim().toLowerCase() ===
            item.sku?.trim().toLowerCase()
          ) {
            skuMatched = true;
            const itemPoints = parseFloat(rule.points) || 0;
            overallCalculatedPoints += itemPoints;

            calculatedPoints.push({
              product: item.title,
              sku: item.sku,
              calculated_point: itemPoints,
              pointExpiry: rule.expiresOn || null,
              creditAfterDays: parseInt(rule.credit_after_days, 10) || 0,
              remarks: rule.remarks || "No remarks provided",
            });

            console.log(
              `Matched SKU Rule: ${rule.remarks}, SKU: ${item.sku}, Points: ${itemPoints}`
            );
          }
        });

        if (!skuMatched) {
          calculatedPoints.push({
            product: item.title,
            sku: item.sku,
            calculated_point: 0,
            message: "No converted points, SKU not matched",
          });
          console.log(`No matching SKU rule found for item SKU: ${item.sku}`);
        }
      });
    } else if (activeRules.point_conversion_online_purchase) {
      // Purchase-value-based point conversion logic
      activeRules.point_conversion_online_purchase.forEach((rule) => {
        const purchaseValue = parseFloat(rule.purchaseValue) || 1;
        const points = parseFloat(rule.points) || 0;

        if (purchaseValue > 0 && points > 0) {
          const rulePoints = Math.floor((total_price / purchaseValue) * points);
          overallCalculatedPoints += rulePoints;

          calculatedPoints.push({
            rule: rule.remarks || "No remarks provided",
            calculated_point: rulePoints,
            pointExpiry: rule.expiresOn || null,
            creditAfterDays: parseInt(rule.credit_after_days, 10) || 0,
          });

          console.log(
            `Rule: ${rule.remarks}, Calculated Points: ${rulePoints}`
          );
        }
      });
    }

    // Construct response object
    const response = {
      id,
      email,
      customerId: customer.id,
      store: "lakme",
      lineItems: lineItemDetails,
      subtotalPrice: subtotal_price,
      totalPrice: total_price,
      overallCalculatedPoints,
      calculatedPoints,
      pointExpiry: skuRules?.[0]?.expiresOn || null,
      creditAfterDays: parseInt(skuRules?.[0]?.credit_after_days, 10) || 0,
    };

    console.log("Response Data:", response); // Log response data for debugging

    // Save to database
    const existingCheckout = await point_checkout.findOne({
      where: { checkout_id: id },
    });

    if (existingCheckout) {
      await existingCheckout.update({
        store: "lakme",
        customerId: customer.id,
        lineItems: JSON.stringify(lineItemDetails),
        subtotalPrice: subtotal_price,
        totalPrice: total_price,
        overallCalculatedPoints,
        calculatedPoints: JSON.stringify(calculatedPoints),
        pointExpiry: response.pointExpiry,
        creditAfterDays: response.creditAfterDays,
      });
    } else {
      await point_checkout.create({
        checkout_id: id,
        store: "lakme",
        customerId: customer.id,
        lineItems: JSON.stringify(lineItemDetails),
        subtotalPrice: subtotal_price,
        totalPrice: total_price,
        overallCalculatedPoints,
        calculatedPoints: JSON.stringify(calculatedPoints),
        pointExpiry: response.pointExpiry,
        creditAfterDays: response.creditAfterDays,
      });
    }

    // Return response
    return res.json(response);
  } catch (error) {
    console.error("Error processing the request:", error);
    return res.status(500).json({ message: "Error processing the request" });
  }
};

// export const pointCalculate = async (req, res) => {
//   try {
//     const { customer_id, line_items, store } = req.body;

//     const checker = await paywithrewards.findOne({
//       where: {
//         store: store,
//       },
//     });

//     if (!checker) {
//       return res.status(404).json({
//         message: "No paywithrewards data found for the specified store",
//       });
//     }

//     const pwrSetting = {
//       redemption_type: checker.redemption_type,
//       point_conversion_rate: checker.point_conversion_rate,
//       reward_point_awarded_on_purchase:
//         checker.reward_point_awarded_on_purchase,
//       minValue: checker.minValue,
//       maxValue: checker.maxValue,
//       customer_redeem_point_multiple: checker.customer_redeem_point_multiple,
//       enable: checker.enable,
//     };

//     // Fetch customer data
//     const customerData = await customer.findOne({ where: { customer_id } });
//     if (!customerData) {
//       return res.json({
//         message: "Customer not found",
//         pwrSetting,
//       });
//     }

//     const customerInfo = {
//       earned_point: customerData.earned_point,
//       redeem_point: customerData.redeem_point,
//       expiry_point: customerData.expiry_point,
//       balance_point: customerData.balance_point,
//       membership_tier: customerData.membership_tier,
//       membership_status: customerData.membership_status,
//     };

//     // If Pay with Rewards is disabled
//     if (checker.enable !== "yes") {
//       return res.json({
//         message: "Pay with rewards is disabled",
//         customerData: customerInfo,
//         overallCalculatedPoints: 0,
//         calculatedPoints: [],
//         pwrSetting,
//       });
//     }

//     // Fetch active rules
//     const activeRules = await getActiveRules();
//     console.log("Active Rules:", activeRules);

//     let overallCalculatedPoints = 0;
//     const calculatedPoints = [];
//     const skuRules = activeRules.point_conversion_based_on_sku;

//     // SKU-based point conversion logic
//     if (skuRules) {
//       line_items.forEach((item) => {
//         const matchedRule = skuRules.find(
//           (rule) =>
//             rule.product_sku?.trim().toLowerCase() ===
//             item.sku?.trim().toLowerCase()
//         );

//         if (matchedRule) {
//           const points = parseFloat(matchedRule.points) || 0;
//           overallCalculatedPoints += points;

//           calculatedPoints.push({
//             product: item.title,
//             sku: item.sku,
//             calculated_point: points,
//             pointExpiry: matchedRule.expiresOn || null,
//             creditAfterDays: parseInt(matchedRule.credit_after_days, 10) || 0,
//             remarks: matchedRule.remarks || "No remarks provided",
//           });

//           console.log(
//             `Matched SKU Rule: ${matchedRule.remarks}, SKU: ${item.sku}, Points: ${points}`
//           );
//         } else {
//           calculatedPoints.push({
//             product: item.title,
//             sku: item.sku,
//             calculated_point: 0,
//             message: "No converted points, SKU not matched",
//           });
//           console.log(`No matching SKU rule found for SKU: ${item.sku}`);
//         }
//       });
//     }

//     // Purchase-value-based point conversion logic
//     const purchaseRules = activeRules.point_conversion_online_purchase;
//     if (purchaseRules) {
//       const total_price = line_items.reduce(
//         (acc, item) => acc + parseFloat(item.line_price),
//         0
//       );
//       purchaseRules.forEach((rule) => {
//         const purchaseValue = parseFloat(rule.purchaseValue) || 1;
//         const points = parseFloat(rule.points) || 0;

//         if (purchaseValue > 0 && points > 0) {
//           const rulePoints = Math.floor((total_price / purchaseValue) * points);
//           overallCalculatedPoints += rulePoints;

//           calculatedPoints.push({
//             rule: rule.remarks || "No remarks provided",
//             calculated_point: rulePoints,
//             pointExpiry: rule.expiresOn || null,
//             creditAfterDays: parseInt(rule.credit_after_days, 10) || 0,
//           });

//           console.log(
//             `Rule: ${rule.remarks}, Calculated Points: ${rulePoints}`
//           );
//         }
//       });
//     }

//     // Final response
//     return res.json({
//       message: "Points calculated successfully",
//       customerData: customerInfo,
//       overallCalculatedPoints,
//       calculatedPoints,
//       pwrSetting,
//     });
//   } catch (error) {
//     console.error("Error calculating points:", error);
//     return res
//       .status(500)
//       .json({ message: "Error processing points calculation." });
//   }
// };

export const pointCalculate = async (req, res) => {
  try {
    const { customer_id, line_items, store } = req.body;

    console.log("line_items", line_items);

    const fetchProductTags = async (productId) => {
      try {
        const configData = {
          method: "get",
          maxBodyLength: Infinity,
          url: `https://lakmestaging.myshopify.com/admin/api/2024-01/products/${productId}.json`,
          headers: {
            "X-Shopify-Access-Token": shopify_token,
          },
        };
        const response = await axios.request(configData);
        console.log("line 2162", response.data.product.tags);
        return response.data.product.tags || "";
      } catch (error) {
        console.error(`Error fetching tags for product ${productId}:`, error);
        return "";
      }
    };

    const checker = await paywithrewards.findOne({ where: { store } });

    if (!checker) {
      return res.status(404).json({
        message: "No paywithrewards data found for the specified store",
      });
    }

    const pwrSetting = {
      redemption_type: checker.redemption_type,
      point_conversion_rate: checker.point_conversion_rate,
      reward_point_awarded_on_purchase:
        checker.reward_point_awarded_on_purchase,
      minValue: checker.minValue,
      maxValue: checker.maxValue,
      customer_redeem_point_multiple: checker.customer_redeem_point_multiple,
      enable: checker.enable,
      max_point_limit: checker.max_point_limit,
    };

    const customerData = await customer.findOne({ where: { customer_id } });
    if (!customerData) {
      return res.json({
        message: "Customer not found",
        pwrSetting,
      });
    }

    const customerInfo = {
      earned_point: customerData.earned_point,
      redeem_point: customerData.redeem_point,
      expiry_point: customerData.expiry_point,
      balance_point: customerData.balance_point,
      membership_tier: customerData.membership_tier,
      membership_status: customerData.membership_status,
    };

    // if (checker.enable !== "yes") {
    //   return res.json({
    //     message: "Pay with rewards is disabled",
    //     customerData: customerInfo,
    //     overallCalculatedPoints: 0,
    //     calculatedPoints: [],
    //     pwrSetting,
    //   });
    // }

    const activeRules = await getActiveRules();
    // console.log("Active Rules:", activeRules);

    // Ensure only one active rule set is applied
    let ruleSet = null;
    if (activeRules.point_conversion_online_purchase?.length) {
      ruleSet = {
        type: "online_purchase",
        rules: activeRules.point_conversion_online_purchase,
      };
    } else if (activeRules.point_conversion_based_on_sku?.length) {
      ruleSet = {
        type: "sku",
        rules: activeRules.point_conversion_based_on_sku,
      };
    } else if (activeRules.point_conversion_based_on_category?.length) {
      ruleSet = {
        type: "category",
        rules: activeRules.point_conversion_based_on_category,
      };
    }

    if (!ruleSet) {
      return res
        .status(400)
        .json({ message: "No active rules available for calculation." });
    }

    const calculateExpiryAndCreditDelay = (rule) => {
      const pointExpiry = rule.expiresOn ? new Date(rule.expiresOn) : null;
      const creditAfterDays = parseInt(rule.credit_after_days, 10) || 0;
      return { pointExpiry, creditAfterDays };
    };

    const applyRules = (item, ruleSet, total_price) => {
      let points = 0;
      let expiryDetails = [];

      ruleSet.rules.forEach((rule) => {
        if (ruleSet.type === "online_purchase") {
          const purchaseValue = parseFloat(rule.purchaseValue) || 1;
          console.log("purchaseValue", purchaseValue);

          const rulePoints = Math.ceil(
            (total_price / purchaseValue) * (parseFloat(rule.points) || 0)
          );

          // console.log("rulePoints",rulePoints);

          // points += Math.round((item.line_price / total_price) * rulePoints);

          points += Math.round(
            (item.line_price / total_price) *
              ((total_price / purchaseValue) * parseFloat(rule.points || 0))
          );
        } else if (ruleSet.type === "sku") {
          console.log(">>>>>>>>ruleSet", ruleSet);
          console.log(">>>>>>>>item", item);
          console.log(">>>>>>>>rule", rule);
          console.log(
            ">>>>>condition",
            rule.product_sku?.trim().toLowerCase() ===
              item.sku?.trim().toLowerCase()
          );

          if (
            rule.product_sku?.trim().toLowerCase() ===
            item.sku?.trim().toLowerCase()
          ) {
            points += (parseFloat(rule.points) || 0) * item.quantity;
          }
        } else if (ruleSet.type === "category") {
          console.log("inside category");

          if (item.tags.includes(rule.category)) {
            points += (parseFloat(rule.points) || 0) * item.quantity;
          }
        }
        expiryDetails.push(calculateExpiryAndCreditDelay(rule));
      });
      console.log("points", points);
      const finalExpiry = expiryDetails.reduce((latest, current) => {
        if (!current.pointExpiry) return latest;
        return !latest || current.pointExpiry > latest
          ? current.pointExpiry
          : latest;
      }, null);

      const finalCreditAfterDays = expiryDetails.reduce(
        (maxDelay, current) => Math.max(maxDelay, current.creditAfterDays),
        0
      );

      return {
        points,
        pointExpiry: finalExpiry,
        creditAfterDays: finalCreditAfterDays,
      };
    };

    const total_price = line_items.reduce(
      (acc, item) => acc + parseFloat(item.line_price),
      0
    );
    let overallCalculatedPoints = 0;
    const calculatedPoints = [];

    for (const item of line_items) {
      const productTags = await fetchProductTags(item.product_id);
      const { points, pointExpiry, creditAfterDays } = applyRules(
        { ...item, tags: productTags },
        ruleSet,
        total_price
      );

      overallCalculatedPoints += points;

      calculatedPoints.push({
        product: item.title,
        sku: item.sku,
        calculated_point: points,
        pointExpiry,
        creditAfterDays,
        remarks: "Points calculated based on active rules",
      });
    }

    return res.json({
      message: "Points calculated successfully",
      customerData: customerInfo,
      overallCalculatedPoints,
      calculatedPoints,
      pwrSetting,
    });
  } catch (error) {
    console.error("Error calculating points:", error);
    return res
      .status(500)
      .json({ message: "Error processing points calculation." });
  }
};

// export const checkoutDataPointcalculate = async (req, res) => {
//   try {
//     const { id, email, customer, line_items, subtotal_price, total_price,store } = req.body;
//     const processedStore = await storeHandler(store);
//     const lineItemDetails = line_items.map((item) => ({
//       product_id: item.product_id,
//       line_price: parseFloat(item.line_price),
//       price: parseFloat(item.price),
//       sku: item.sku,
//       title: item.title,
//     }));

//     console.log("lineItemDetails", lineItemDetails);
//     const activeRules = await getActiveRules();
//     console.log("Active Rules:", activeRules);
//     let overallCalculatedPoints = 0;
//     let calculatedPoints = [];
//     const skuRules = activeRules.point_conversion_based_on_sku;
//     if (skuRules) {
//       lineItemDetails.forEach((item) => {
//         let skuMatched = false;

//         skuRules.forEach((rule) => {
//           if (!rule.product_sku?.trim()) {
//             console.warn("Rule with empty SKU skipped:", rule);
//             return; // Skip rules with no SKU
//           }

//           console.log(
//             `Comparing SKU: "${item.sku?.trim().toLowerCase()}" with Rule SKU: "${rule.product_sku?.trim().toLowerCase()}"`
//           );

//           if (rule.product_sku?.trim().toLowerCase() === item.sku?.trim().toLowerCase()) {
//             skuMatched = true;
//             const itemPoints = parseFloat(rule.points) || 0;
//             overallCalculatedPoints += itemPoints;

//             calculatedPoints.push({
//               product: item.title,
//               sku: item.sku,
//               calculated_point: itemPoints,
//               pointExpiry: rule.expiresOn || null,
//               creditAfterDays: parseInt(rule.credit_after_days, 10) || 0,
//               remarks: rule.remarks || "No remarks provided",
//             });

//             console.log(
//               `Matched SKU Rule: ${rule.remarks}, SKU: ${item.sku}, Points: ${itemPoints}`
//             );
//           }
//         });

//         if (!skuMatched) {
//           calculatedPoints.push({
//             product: item.title,
//             sku: item.sku,
//             calculated_point: 0,
//             message: "No converted points, SKU not matched",
//           });
//           console.log(`No matching SKU rule found for item SKU: ${item.sku}`);
//         }
//       });
//     }
//      else if (activeRules.point_conversion_online_purchase) {
//       // Purchase-value-based point conversion logic
//       activeRules.point_conversion_online_purchase.forEach((rule) => {
//         const purchaseValue = parseFloat(rule.purchaseValue) || 1; // Avoid division by zero
//         const points = parseFloat(rule.points) || 0;

//         if (purchaseValue > 0 && points > 0) {
//           const rulePoints = Math.floor((total_price / purchaseValue) * points);
//           overallCalculatedPoints += rulePoints;

//           calculatedPoints.push({
//             rule: rule.remarks || "No remarks provided",
//             calculated_point: rulePoints,
//             pointExpiry: rule.expiresOn || null,
//             creditAfterDays: parseInt(rule.credit_after_days, 10) || 0,
//           });

//           console.log(`Rule: ${rule.remarks}, Calculated Points: ${rulePoints}`);
//         }
//       });
//     }

//     // Construct response object
//     const response = {
//       id,
//       email,
//       customerId: customer.id,
//       lineItems: lineItemDetails,
//       subtotalPrice: subtotal_price,
//       totalPrice: total_price,
//       overallCalculatedPoints,
//       calculatedPoints,
//       pointExpiry: skuRules?.[0]?.expiresOn || null,
//       creditAfterDays: parseInt(skuRules?.[0]?.credit_after_days, 10) || 0,
//     };

//     console.log("Response Data:", response); // Log response data for debugging

//     // Save to database
//     const existingCheckout = await point_checkout.findOne({
//       where: { checkout_id: id },
//     });

//     if (existingCheckout) {
//       await existingCheckout.update({
//         customerId: customer.id,
//         lineItems: JSON.stringify(lineItemDetails),
//         subtotalPrice: subtotal_price,
//         totalPrice: total_price,
//         overallCalculatedPoints,
//         calculatedPoints: JSON.stringify(calculatedPoints),
//         pointExpiry: response.pointExpiry,
//         creditAfterDays: response.creditAfterDays,
//       });
//     } else {
//       await point_checkout.create({
//         checkout_id: id,
//         customerId: customer.id,
//         lineItems: JSON.stringify(lineItemDetails),
//         subtotalPrice: subtotal_price,
//         totalPrice: total_price,
//         overallCalculatedPoints,
//         calculatedPoints: JSON.stringify(calculatedPoints),
//         pointExpiry: response.pointExpiry,
//         creditAfterDays: response.creditAfterDays,
//       });
//     }

//     // Return response
//     return res.json(response);
//   } catch (error) {
//     console.error("Error processing the request:", error);
//     return res.status(500).json({ message: "Error processing the request" });
//   }
// };

// export const pointCalculate = async (req, res) => {
//   try {
//     const { customer_id, line_items,store } = req.body;
//     const processedStore = await storeHandler(store);
//     const checker = await paywithrewards.findOne({
//       where: {
//         store: processedStore
//       }
//     });
//     if (!checker) {
//       return res.status(404).json({ message: "No paywithrewards data found" });
//     }
//     const pwrSetting = {
//       redemption_type: checker.redemption_type,
//       point_conversion_rate: checker.point_conversion_rate,
//       reward_point_awarded_on_purchase: checker.reward_point_awarded_on_purchase,
//       minValue: checker.minValue,
//       maxValue: checker.maxValue,
//       customer_redeem_point_multiple: checker.customer_redeem_point_multiple,
//       enable: checker.enable,
//     };
//     const customerData = await customer.findOne({ where: { customer_id } });
//     if (!customerData) {
//       return res.json({
//         message: "Customer not found",
//         pwrSetting,
//       });
//     }

//     const customerInfo = {
//       earned_point: customerData.earned_point,
//       redeem_point: customerData.redeem_point,
//       expiry_point: customerData.expiry_point,
//       balance_point: customerData.balance_point,
//       membership_tier: customerData.membership_tier,
//       membership_status: customerData.membership_status,
//     };

//     if (checker.enable !== "yes") {
//       return res.json({
//         message: "Pay with rewards is disabled",
//         customerData: customerInfo,
//         overallCalculatedPoints: 0,
//         calculatedPoints: [],
//         pwrSetting,
//       });
//     }
//     const activeRules = await getActiveRules();
//     console.log("Active Rules:", activeRules);
//     let overallCalculatedPoints = 0;
//     const calculatedPoints = [];
//     const skuRules = activeRules.point_conversion_based_on_sku;
//     if (skuRules) {
//       line_items.forEach((item) => {
//         const matchedRule = skuRules.find(
//           (rule) =>
//             rule.product_sku?.trim().toLowerCase() === item.sku?.trim().toLowerCase()
//         );

//         if (matchedRule) {
//           const points = parseFloat(matchedRule.points) || 0;
//           overallCalculatedPoints += points;

//           calculatedPoints.push({
//             product: item.title,
//             sku: item.sku,
//             calculated_point: points,
//             pointExpiry: matchedRule.expiresOn || null,
//             creditAfterDays: parseInt(matchedRule.credit_after_days, 10) || 0,
//             remarks: matchedRule.remarks || "No remarks provided",
//           });

//           console.log(
//             `Matched SKU Rule: ${matchedRule.remarks}, SKU: ${item.sku}, Points: ${points}`
//           );
//         } else {
//           calculatedPoints.push({
//             product: item.title,
//             sku: item.sku,
//             calculated_point: 0,
//             message: "No converted points, SKU not matched",
//           });
//           console.log(`No matching SKU rule found for SKU: ${item.sku}`);
//         }
//       });
//     }
//     const purchaseRules = activeRules.point_conversion_online_purchase;
//     if (purchaseRules) {
//       const total_price = line_items.reduce((acc, item) => acc + parseFloat(item.line_price), 0);
//       purchaseRules.forEach((rule) => {
//         const purchaseValue = parseFloat(rule.purchaseValue) || 1;
//         const points = parseFloat(rule.points) || 0;

//         if (purchaseValue > 0 && points > 0) {
//           const rulePoints = Math.floor((total_price / purchaseValue) * points);
//           overallCalculatedPoints += rulePoints;

//           calculatedPoints.push({
//             rule: rule.remarks || "No remarks provided",
//             calculated_point: rulePoints,
//             pointExpiry: rule.expiresOn || null,
//             creditAfterDays: parseInt(rule.credit_after_days, 10) || 0,
//           });

//           console.log(`Rule: ${rule.remarks}, Calculated Points: ${rulePoints}`);
//         }
//       });
//     }
//     return res.json({
//       message: "Points calculated successfully",
//       customerData: customerInfo,
//       overallCalculatedPoints,
//       calculatedPoints,
//       pwrSetting,
//     });
//   } catch (error) {
//     console.error("Error calculating points:", error);
//     return res.status(500).json({ message: "Error processing points calculation." });
//   }
// };

const generateTransitionId = (transitionCategory) => {
  const datePart = moment().format("YYYYMMDDHHmmss");
  const randomPart = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(10, "0");
  return `${transitionCategory}${datePart}${randomPart}`;
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
        key: "lakme_reward_points",
        value: metafieldsData.lakme_point.toString(),
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

    const configRes = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://lakmestaging.myshopify.com/admin/api/2024-07/graphql.json",
      headers: {
        "X-Shopify-Access-Token": shopify_token,
        "Content-Type": "application/json",
      },
      data,
    };
    const response = await axios.request(configRes);
    console.log("Metafields created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating metafields:", error);
    throw new Error("Failed to create metafields");
  }
};

const processPointsUpdate = async (
  customerData,
  pointsToAdd,
  pointExpiry,
  creditAfterDays,
  transitionId,
  orderId,
  productDetail = "",
  transitionCategory
) => {
  const oldEarnedPoint = parseInt(customerData.earned_point, 10) || 0;
  const oldRedeemPoint = parseInt(customerData.redeem_point, 10) || 0;
  const oldExpiryPoint = parseInt(customerData.expiry_point, 10) || 0;

  const updatedEarnedPoints = oldEarnedPoint + pointsToAdd;
  const updatedBalancePoints =
    updatedEarnedPoints - oldRedeemPoint - oldExpiryPoint;
  let expiryDate = null;

  if (typeof pointExpiry === "string") {
    if (pointExpiry.includes("day") || pointExpiry.includes("month")) {
      const [value, unit] = pointExpiry.split(" ");
      const duration = parseInt(value, 10);

      if (unit.includes("day")) {
        expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + duration);
      } else if (unit.includes("month")) {
        expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + duration);
      }
    } else {
      expiryDate = new Date(pointExpiry);
    }
  }

  if (!expiryDate || isNaN(expiryDate.getTime())) {
    expiryDate = null;
  }

  // Format the date as DD-MM-YYYY
  const formattedDate = expiryDate
    ? `${String(expiryDate.getDate()).padStart(2, "0")}-${String(
        expiryDate.getMonth() + 1
      ).padStart(2, "0")}-${expiryDate.getFullYear()}`
    : null;

  console.log("Formatted Date:", formattedDate);

  if (creditAfterDays == 0 || creditAfterDays == null) {
    await customerData.update({
      earned_point: updatedEarnedPoints,
      redeem_point: oldRedeemPoint,
      expiry_point: oldExpiryPoint,
      balance_point: updatedBalancePoints,
    });

    await Promise.all([
      transition.create({
        customer_Id: customerData.customer_id,
        transition_id: transitionId,
        account_number: customerData.account_number,
        transition_category: transitionCategory,
        transition_status: "credit",
        medium: "desktop",
        point: pointsToAdd,
        expiry_date: formattedDate,
        order_id: orderId,
        product_detail: productDetail,
        store: "lakme",
        credit_days: creditAfterDays,
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
        point: pointsToAdd,
        transition_status: "credit",
        store: "lakme",
        credit_after: creditAfterDays,
        expiry_date: formattedDate,
      }),
    ]);

    // await createMetafieldHelperFunction(customerData.customer_id, {
    //   rclupoint: "0",
    //   lakme_point: updatedBalancePoints.toString(),
    // });
  } else {
    await Promise.all([
      transition.create({
        customer_Id: customerData.customer_id,
        transition_id: transitionId,
        account_number: customerData.account_number,
        transition_category: transitionCategory,
        transition_status: "hold",
        medium: "desktop",
        point: pointsToAdd,
        expiry_date: formattedDate,
        order_id: orderId,
        store: "lakme",
        product_detail: productDetail,
        credit_days: creditAfterDays,
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
        point: pointsToAdd,
        transition_status: "hold",
        store: "lakme",
        credit_after: creditAfterDays,
        expiry_date: formattedDate,
      }),
    ]);
  }
};

export const orderReward = async (req, res) => {
  try {
    const { checkout_id, id: orderId } = req.body;
    const checkoutData = await point_checkout.findOne({
      where: { checkout_id },
    });
    console.log("checkoutData", "checkoutData");

    if (!checkoutData)
      return res.status(404).json({ message: "Checkout data not found" });

    const customerData = await customer.findOne({
      where: { customer_id: checkoutData.customerId },
    });
    console.log("customerData", "customerData");

    if (!customerData)
      return res.status(404).json({ message: "Customer not found" });

    const processTransition = async (
      pointsToAdd,
      pointExpiry,
      creditAfterDays,
      productDetail = ""
    ) => {
      const transitionId = generateTransitionId("reward_point");
      await processPointsUpdate(
        customerData,
        pointsToAdd,
        pointExpiry,
        creditAfterDays,
        transitionId,
        orderId,
        productDetail
      );
    };

    // if (checkoutData.overallCalculatedPoints) {
    //   const pointsToAdd = parseInt(checkoutData.overallCalculatedPoints, 10) || 0;
    //   const { pointExpiry, creditAfterDays } = checkoutData;
    //   await processTransition(pointsToAdd, pointExpiry, creditAfterDays);
    //   return res.json({ message: "Points processed successfully for overall points." });
    // }

    if (
      Array.isArray(checkoutData.calculatedPoints) &&
      checkoutData.calculatedPoints.length > 0
    ) {
      for (const item of checkoutData.calculatedPoints) {
        const { product, calculated_point, pointExpiry, creditAfterDays } =
          item;
        const pointsToAdd = parseInt(calculated_point, 10) || 0;
        await processTransition(
          pointsToAdd,
          pointExpiry,
          creditAfterDays,
          product
        );
      }
      return res.json({
        message: "Points processed successfully for each calculated point.",
      });
    }

    return res
      .status(400)
      .json({ message: "No points data found in checkout." });
  } catch (error) {
    console.error("Error processing order reward:", error);
    return res.status(500).json({
      message: "An error occurred while processing order reward.",
      error,
    });
  }
};

// export const orderReward = async (req, res) => {
//   try {
//     const { checkout_id, id: orderId } = req.body;

//     // Retrieve paywithrewards settings
//     const checker = await paywithrewards.findOne();
//     if (!checker) {
//       return res.status(404).json({ message: "No paywithrewards data found" });
//     }

//     const pwrSetting = {
//       redemption_type: checker.dataValues.redemption_type,
//       point_conversion_rate: checker.dataValues.point_conversion_rate,
//       reward_point_awarded_on_purchase: checker.dataValues.reward_point_awarded_on_purchase,
//       minValue: checker.dataValues.minValue,
//       maxValue: checker.dataValues.maxValue,
//       customer_redeem_point_multiple: checker.dataValues.customer_redeem_point_multiple,
//       enable: checker.dataValues.enable,
//     };

//     // Check if reward points can be awarded
//     if (pwrSetting.reward_point_awarded_on_purchase === "yes") {
//       // Retrieve checkout data
//       const checkoutData = await point_checkout.findOne({ where: { checkout_id } });
//       if (!checkoutData) {
//         return res.status(404).json({ message: "Checkout data not found" });
//       }

//       // Retrieve customer data
//       const customerData = await customer.findOne({ where: { customer_id: checkoutData.customerId } });
//       if (!customerData) {
//         return res.status(404).json({ message: "Customer not found" });
//       }

//       // Process reward points
//       if (Array.isArray(checkoutData.calculatedPoints) && checkoutData.calculatedPoints.length > 0) {
//         for (const item of checkoutData.calculatedPoints) {
//           const { product, calculated_point, pointExpiry, creditAfterDays } = item;
//           const pointsToAdd = parseInt(calculated_point, 10) || 0;
//           const transitionId = generateTransitionId("reward_point");

//           // Process point update
//           await processPointsUpdate(
//             customerData,
//             pointsToAdd,
//             pointExpiry,
//             creditAfterDays,
//             transitionId,
//             orderId,
//             product
//           );
//         }
//         return res.json({ message: "Points processed successfully for each calculated point." });
//       }

//       return res.status(400).json({ message: "No points data found in checkout." });
//     } else if (pwrSetting.reward_point_awarded_on_purchase === "no") {
//       return res.status(200).json({
//         message: "Reward points are not awarded when purchasing with reward points.",
//       });
//     }

//     return res.status(400).json({ message: "Invalid reward point setting configuration." });
//   } catch (error) {
//     console.error("Error processing order reward:", error);
//     return res.status(500).json({ message: "An error occurred while processing order reward.", error });
//   }
// };

export const createOrUpdateRegistration = async (req, res) => {
  try {
    const { id, point, store, expiry_day, credit_day, remarks } = req.body;
    const processedStore = await storeHandler(store);
    const expiry_date = req.body.expiry_date || "18 months";
    const credit_after = req.body.credit_after || "0";
    let existingRecord = null;
    if (id) {
      existingRecord = await registration.findOne({ where: { id } });
    }

    if (existingRecord) {
      existingRecord.point = point !== undefined ? point : existingRecord.point;
      existingRecord.expiry_date =
        expiry_date !== undefined ? expiry_date : existingRecord.expiry_date;
      existingRecord.credit_after =
        credit_after !== undefined ? credit_after : existingRecord.credit_after;
      existingRecord.expiry_day = expiry_day; // Update expiry_day
      existingRecord.credit_day = credit_day; // Update credit_day
      existingRecord.remarks = remarks; // Update remarks
      existingRecord.updatedAt = new Date();

      await existingRecord.save();

      return res.status(200).json({
        message: "Registration record updated successfully",
        data: existingRecord,
        status: 200,
      });
    } else {
      const newRegistration = await registration.create({
        point,
        expiry_date,
        credit_after,
        store: processedStore,
        expiry_day,
        credit_day,
        remarks,
      });

      return res.status(201).json({
        message: "Registration record created successfully",
        data: newRegistration,
        status: 201,
      });
    }
  } catch (error) {
    console.error("Error in createOrUpdateRegistration:", error);
    return res.status(500).json({
      message: "Error creating or updating registration",
      error: error.message,
    });
  }
};

// export const createOrUpdateRegistration = async (req, res) => {
//   try {
//     const { id, point } = req.body;
//     const expiry_date = req.body.expiry_date || "18 months";
//     const credit_after = req.body.credit_after || "0";
//     let existingRecord = null;
//     if (id) {
//       existingRecord = await registration.findOne({ where: { id } });
//     }

//     if (existingRecord) {
//       existingRecord.point = point !== undefined ? point : existingRecord.point;
//       existingRecord.expiry_date = expiry_date !== undefined ? expiry_date : existingRecord.expiry_date;
//       existingRecord.credit_after = credit_after !== undefined ? credit_after : existingRecord.credit_after;
//       existingRecord.updatedAt = new Date();

//       await existingRecord.save();

//       return res.status(200).json({
//         message: "Registration record updated successfully",
//         data: existingRecord,
//       });
//     } else {
//       const newRegistration = await registration.create({
//         point,
//         expiry_date,
//         credit_after,
//       });

//       return res.status(201).json({
//         message: "Registration record created successfully",
//         data: newRegistration,
//       });
//     }
//   } catch (error) {
//     console.error("Error in createOrUpdateRegistration:", error);
//     return res.status(500).json({
//       message: "Error creating or updating registration",
//       error: error.message,
//     });
//   }
// };

//commit

export const getRegistrationPoint = async (req, res) => {
  try {
    const { store } = req.query;
    const processedStore = await storeHandler(store);
    const redemptions = await registration.findAll({
      where: {
        store: processedStore,
      },
    });
    if (redemptions.length === 0) {
      return res.status(404).json({
        message: "No registration records found.",
      });
    }
    return res.status(200).json({
      message: "registration records fetched successfully.",
      data: redemptions,
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching registration records:", error.message);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};

export const sendNotificationsReedem = async (templateType, store, details) => {
  try {
    console.log("details", details, store, templateType);

    // Validate required fields
    if (!templateType || !store || !details) {
      return { status: 400, error: "Missing required fields." };
    }

    const {
      first_name,
      phone,
      redeem_point,
      balance_point,
      product_line_item,
    } = details;

    console.log(
      "first_name, phone, redeem_point, balance_point, product_line_item ",
      first_name,
      phone,
      redeem_point,
      balance_point,
      product_line_item
    );

    if (
      !first_name ||
      !phone ||
      !redeem_point ||
      !balance_point ||
      !product_line_item
    ) {
      return { status: 400, error: "Missing required details." };
    }

    // Fetch notifications for both WhatsApp and SMS
    const notifications = await Notification.findAll({
      where: { store },
    });

    if (!notifications || notifications.length === 0) {
      return {
        status: 404,
        error: `Notification details not found for store: ${store}`,
      };
    }

    let whatsappSent = false;
    let smsSent = false;

    // Process WhatsApp Notification
    const whatsappNotification = notifications.find(
      (n) =>
        n.notification_type === "WhatsApp" && n.templateType === templateType
    );
    if (whatsappNotification) {
      const { api_key, password, header } = whatsappNotification;
      let whatsappText = header;

      // Convert product_line_item array to string
      const productLineItemString = Array.isArray(product_line_item)
        ? product_line_item.join(", ")
        : product_line_item;

      // Replace placeholders in the WhatsApp template
      whatsappText = whatsappText
        .replace("{#var#}", `${first_name}`)
        .replace("{#var#}", `${redeem_point}`)
        .replace("{#var#}", `${balance_point}`)
        .replace("{#var#}", `${productLineItemString}`);

      const whatsappUrl = `https://media.smsgupshup.com/GatewayAPI/rest?userid=${api_key}&password=${password}&send_to=${phone}&v=1.1&format=json&msg_type=TEXT&method=sendMessage&msg=${encodeURIComponent(
        whatsappText
      )}`;
      console.log("WhatsApp URL:", whatsappUrl);

      const whatsappResponse = await axios.get(whatsappUrl);
      console.log(
        "WhatsApp notification sent successfully:",
        whatsappResponse.data
      );
      whatsappSent = true;
    } else {
      console.warn("WhatsApp template not found for the given type.");
    }

    // Process SMS Notification
    const smsNotification = notifications.find(
      (n) => n.notification_type === "SMS" && n.templateType === templateType
    );
    if (smsNotification) {
      const { username, password, header } = smsNotification;

      console.log("header", header);
      console.log("password", password);
      console.log("username", username);

      let smsText = header;

      console.log("smsText", smsText);

      // Convert product_line_item array to string
      const productLineItemString = Array.isArray(product_line_item)
        ? product_line_item.join(", ")
        : product_line_item;

      // Replace placeholders in the SMS template
      smsText = smsText
        .replace("{#var#}", `${first_name}`)
        .replace("{#var#}", `${redeem_point}`)
        .replace("{#var#}", `${balance_point}`)
        .replace("{#var#}", `${productLineItemString}`);

      const smsUrl = `https://api2.growwsaas.com/fe/api/v1/send`;
      const from = "ReShop";

      console.log("smsText2", smsText);

      // Sending SMS via API
      const smsResponse = await axios.get(smsUrl, {
        params: {
          username,
          password,
          unicode: false,
          from,
          to: phone,
          text: smsText,
          dltContentId: "1007866970822561361", // Replace with actual DLT Content ID
        },
      });
      console.log("SMS notification sent successfully:", smsResponse.data);
      smsSent = true;
    } else {
      console.warn("SMS template not found for the given type.");
    }

    const response = {
      message: "Notification process completed.",
      whatsappSent,
      smsSent,
    };

    return { status: 200, data: response };
  } catch (error) {
    console.error("Error sending notifications:", error.message);
    return { status: 500, error: "Internal server error." };
  }
};

export const customerReedemPoint = async (req, res) => {
  try {
    const {
      note_attributes,
      customer: customerReq,
      id: order_id,
      line_items,
      tags,
    } = req.body;
    const processedStore = "lakme";

    console.log("tags", tags);

    // If the tag includes "redeempoints", skip transition creation and points processing
    if (tags?.includes("redeempoints")) {
      return res.json({
        message:
          "Order tagged with 'redeempoints'. No transition or points processed.",
      });
    }

    // console.log("line_items",line_items);
    const titles = line_items.map((item) => item.title);

    console.log("Titles:", titles);

    console.log("Redeem Points Request:", {
      note_attributes,
      customer: customerReq,
    });
    const loyaltyRewardAttribute = note_attributes?.find(
      (attr) => attr.name === "loyalty_reward"
    );
    if (!loyaltyRewardAttribute) {
      return res
        .status(400)
        .json({ message: "Loyalty reward not provided in note attributes" });
    }

    const pointGiven = parseFloat(loyaltyRewardAttribute.value);
    console.log("Points to redeem (from loyalty_reward):", pointGiven);

    const customerIdString = String(customerReq?.id);
    console.log("Customer ID:", customerIdString);

    if (!customerIdString) {
      return res
        .status(400)
        .json({ message: "Customer ID is missing in the request" });
    }
    const customerData = await customer.findOne({
      where: { customer_id: customerIdString, store: processedStore },
    });

    if (!customerData) {
      return res.status(404).json({ message: "Customer not found" });
    }
    const points = parseInt(pointGiven, 10);
    if (isNaN(points) || points <= 0) {
      return res.status(400).json({ message: "Invalid point value provided" });
    }

    const oldEarnedPoints = parseInt(customerData.earned_point, 10) || 0;
    const oldRedeemPoints = parseInt(customerData.redeem_point, 10) || 0;
    const oldExpiryPoints = parseInt(customerData.expiry_point, 10) || 0;
    const currentBalancePoints =
      oldEarnedPoints - oldRedeemPoints - oldExpiryPoints;

    if (points > currentBalancePoints) {
      return res.status(400).json({ message: "Insufficient points to redeem" });
    }

    // const generateTransitionId = (transitionCategory) => {
    //   const datePart = moment().format("YYYYMMDDHHmmss");
    //   const randomPart = Math.floor(Math.random() * 1000000000)
    //     .toString()
    //     .padStart(10, "0");
    //   return `${transitionCategory}${datePart}${randomPart}`;
    // };
    // const transactionId = generateTransitionId("redeem_point");
    // console.log("Generated Transaction ID:", transactionId);

    const transitionId = `reward_point${order_id}`;
    console.log("transitionId", transitionId);

    const updatedRedeemPoints = oldRedeemPoints + points;
    const updatedBalancePoints =
      oldEarnedPoints - updatedRedeemPoints - oldExpiryPoints;
    const transactionData = {
      customer_Id: customerData.customer_id,
      transition_id: transitionId,
      account_number: customerData.account_number,
      transition_category: "paywithrewards",
      transition_status: "redeem",
      medium: "desktop",
      point: points,
      expiry_date: "",
      order_id,
      product_detail: "",
      sourceOfDevice: "lakme.com",
      store: processedStore,
      name: customerData.first_name,
      mobile_no: customerData.phone_number,
      state: customerData.State,
      city: customerData.city,
      serial_no: "",
      coupon_code: "",
      scan_manual: "",
    };

    const pointData = {
      customer_Id: customerData.customer_id,
      transition_id: transitionId,
      account_number: customerData.account_number,
      point: points,
      transition_status: "redeem",
      expiry_date: "",
      credit_after: "",
      store: processedStore,
    };
    await customerData.update({
      earned_point: oldEarnedPoints,
      redeem_point: updatedRedeemPoints,
      expiry_point: oldExpiryPoints,
      balance_point: updatedBalancePoints,
    });
    // Create transaction and point records
    await Promise.all([
      transition.create(transactionData),
      point.create(pointData),
    ]);
    // await createMetafieldHelperFunction(customerData.customer_id, {
    //   rclupoint: "0",
    //   lakme_point: updatedBalancePoints.toString(),
    // });

    await redeemCustomerPointsFun(customerIdString, points);

    const result = await sendNotificationsReedem(
      "reward-points-redeemed",
      "lakme",
      {
        first_name: customerData.first_name,
        phone: customerData.phone_number,
        redeem_point: points,
        balance_point: customerData.balance_point,
        product_line_item: titles,
      }
    );

    console.log("sendNotificationsReedem", result);

    const whatsappDetails = {
      first_name: customerData.first_name,
      phone_number: customerData.phone_number,
      redeemablePoints: points,  
      redeemPoint: customerData.redeem_point,  
      balancePoint: customerData.balance_point,  
      email: customerData.email
    }

    await handleNotifications("reward-points-redeemed", "lakme", whatsappDetails)

    return res.status(200).json({
      message: "Points redeemed successfully",
      customer: {
        earned_point: oldEarnedPoints,
        redeem_point: updatedRedeemPoints,
        expiry_point: oldExpiryPoints,
        balance_point: updatedBalancePoints,
      },
      transaction: transactionData,
      point: pointData,
    });
  } catch (error) {
    console.error("Error redeeming points:", error.message);
    return res.status(500).json({
      message: "An error occurred while redeeming points",
      error: error.message,
    });
  }
};

export const updatePointStatus = async (req, res) => {
  try {
    const pendingTransitions = await point.findAll({
      where: { transition_status: "hold" },
    });

    if (!pendingTransitions || pendingTransitions.length === 0) {
      return res.status(404).json({ message: "No pending transitions found." });
    }

    const now = moment(); // Current date
    const updatedCustomers = [];

    for (const transition of pendingTransitions) {
      const {
        id,
        customer_Id,
        account_number,
        rewardPoints,
        credit_after,
        createdAt,
        transaction_id,
      } = transition;

      const createdAtMoment = moment(createdAt);
      const creditAfterDays = parseInt(credit_after, 10) || 0;

      // Check if the required credit_after days are complete
      if (now.diff(createdAtMoment, "days") >= creditAfterDays) {
        // Update transition status to "credit"
        await point.update({ transition_status: "credit" }, { where: { id } });

        // Fetch customer data
        const customerData = await customer.findOne({
          where: { customer_id: customer_Id, account_number },
        });

        if (!customerData) {
          console.warn(`Customer not found for ID: ${customer_Id}`);
          continue;
        }

        const oldEarnedPoints = parseInt(customerData.earned_point, 10) || 0;
        const oldRedeemPoints = parseInt(customerData.redeem_point, 10) || 0;
        const oldExpiryPoints = parseInt(customerData.expiry_point, 10) || 0;

        const pointsToAdd = parseInt(rewardPoints, 10) || 0;
        const updatedEarnedPoints = oldEarnedPoints + pointsToAdd;
        const updatedBalancePoints =
          updatedEarnedPoints - oldRedeemPoints - oldExpiryPoints;

        // Update customer points
        await customer.update(
          {
            earned_point: updatedEarnedPoints.toString(),
            balance_point: updatedBalancePoints.toString(),
          },
          { where: { customer_id: customer_Id } }
        );

        // Update metafields
        // await createMetafieldHelperFunction(customer_Id, {
        //   rclupoint: "0",
        //   lakme_point: updatedBalancePoints.toString(),
        // });

        // Add transaction details to the updatedCustomers list
        updatedCustomers.push({
          transaction_id,
          customer_id: customer_Id,
          account_number,
          updated_earned_points: updatedEarnedPoints,
          updated_balance_points: updatedBalancePoints,
        });
      }
    }

    if (updatedCustomers.length === 0) {
      return res.json({
        message: "No statuses were updated.",
        updatedCustomers,
      });
    }

    return res.json({
      message: "Point statuses updated successfully.",
      updatedCustomers,
    });
  } catch (error) {
    console.error("Error updating point statuses:", error);
    return res.status(500).json({
      message: "An error occurred while updating point statuses.",
      error,
    });
  }
};

const generateTransactionId = (transactionCategory) => {
  const datePart = moment().format("YYYYMMDDHHmmss");
  const randomPart = Math.floor(Math.random() * 1_000_000_000)
    .toString()
    .padStart(10, "0");
  return `${transactionCategory}${datePart}${randomPart}`;
};

export const ordertest = async (req, res) => {
  try {
    const {
      id,
      email,
      line_items,
      total_price,
      tags,
      note_attributes,
      shipping_address,
      created_at,
      billing_address,
      number,
      order_number,
      name,
      customer: customerReq,
    } = req.body;

    //  const tags='redeempoints'
    //  console.log("req.body",req.body);

    if (tags?.includes("redeempoints")) {
      console.log("inside the redeempoints");
      const orderIdStringRedeem = String(id);

      const loyaltyRewardAttribute = note_attributes?.find(
        (attr) => attr.name === "loyalty_reward"
      );

      const existingOrder = await order_redeem_product.findOne({
        where: { order_id: orderIdStringRedeem },
      });

      if (existingOrder) {
        return res.status(200).json({
          message: "Redeem points already processed for this order.",
          existingOrder,
        });
      }

      if (!loyaltyRewardAttribute) {
        return res.status(400).json({
          message: "Missing 'loyalty_reward' in note attributes.",
        });
      }

      const point = parseInt(loyaltyRewardAttribute.value, 10);

      if (isNaN(point)) {
        return res.status(400).json({
          message: "Invalid 'loyalty_reward' value.",
        });
      }

      const customerData = await customer.findOne({
        where: { customer_id: String(customerReq?.id) },
      });

      if (!customerData) {
        return res.status(404).json({
          message: "Customer not found.",
        });
      }

      // Check if the customer has enough balance points
      const balancePoint = parseInt(customerData.balance_point || "0", 10);

      if (balancePoint < point) {
        return res.status(400).json({
          message: "Customer does not have enough points to redeem.",
          required_points: point,
          available_points: balancePoint,
        });
      }

      // const transactionId = generateTransactionId("redeem_point");
      const transitionId = `reward_point${id}`;

      const transactionData = {
        customer_Id: customerData.customer_id,
        transition_id: transitionId,
        account_number: customerData.account_number,
        transition_category: "redeem_point",
        transition_status: "redeem",
        medium: "desktop",
        point: point,
        expiry_date: "",
        order_id: orderIdStringRedeem,
        product_detail: "",
        sourceOfDevice: "website",
        store: "lakme",
        name: customerData.first_name,
        mobile_no: customerData.phone_number,
        state: customerData.State,
        city: customerData.city,
        serial_no: "",
        coupon_code: "",
        scan_manual: "",
      };

      await transition.create(transactionData);

      // Calculate updated points
      const oldEarnedPoint = parseInt(customerData.earned_point || "0", 10);
      const oldRedeemPoint = parseInt(customerData.redeem_point || "0", 10);
      const oldExpiryPoint = parseInt(customerData.expiry_point || "0", 10);
      const updatedRedeemPoint = oldRedeemPoint + point;
      const updatedBalancePoint =
        oldEarnedPoint - updatedRedeemPoint - oldExpiryPoint;

      const currentProductRedeem = parseInt(
        customerData.is_product_redeem || "0",
        10
      );
      const updatedProductRedeem = currentProductRedeem + 1;
      // Update customer data
      await customerData.update({
        earned_point: oldEarnedPoint,
        redeem_point: updatedRedeemPoint,
        expiry_point: oldExpiryPoint,
        balance_point: updatedBalancePoint,
        is_product_redeem: updatedProductRedeem,
      });

      const customerID = String(customerReq?.id);

      const data = {
        account_number: customerData.account_number,
        name: shipping_address?.first_name || customer?.first_name || "",
        contact_no:
          customerData.phone_number ||
          customer?.phone ||
          shipping_address?.phone ||
          "",
        email: email || customer.email,
        order_id: req.body.id || "",
        product_name: JSON.stringify(
          line_items.map((item, index) => ({
            [`p${index + 1}`]: item.name,
          }))
        ),
        product_sku: JSON.stringify(
          line_items.map((item, index) => ({
            [`p${index + 1}`]: item.sku,
          }))
        ),
        product_quantity: JSON.stringify(
          line_items.map((item, index) => ({
            [`p${index + 1}`]: item.current_quantity,
          }))
        ),
        product_redeem_point: JSON.stringify(
          line_items.map((item, index) => ({
            [`p${index + 1}`]: item.price * item.current_quantity,
          }))
        ),
        product_actual_point: JSON.stringify(
          line_items.map((item, index) => ({
            [`p${index + 1}`]: item.price,
          }))
        ),
        order_name: name,
        order_number: order_number,
        pincode: shipping_address?.zip,
        redeem_points: point,
        billing_address: billing_address.address1 || "",
        status: "",
        redeem_date: created_at || new Date().toISOString(),
        store: "lakme",
        source_of_device: "website",
      };

      // Insert data into the database
      const newOrderRedeemProduct = await order_redeem_product.create(data);

      // await createMetafieldHelperFunction(customerID, {
      //   rclupoint: "0",
      //   lakme_point: updatedBalancePoint.toString(),
      // });

      await updateOrderNoteHelper(id);
      await redeemCustomerPointsFun(customerID, point);


    const whatsappDetails = {
      first_name: customerData.first_name,
      phone_number: customerData.phone_number,
      redeemablePoints: point,  
      redeemPoint: customerData.redeem_point,  
      balancePoint: customerData.balance_point,  
      email: customerData.email
    }

    await handleNotifications("reward-points-redeemed", "lakme", whatsappDetails)

      return res.json({
        message: "Redeem points processed successfully.",
        transactionData,
        updatedCustomer: {
          earned_point: oldEarnedPoint,
          redeem_point: updatedRedeemPoint,
          expiry_point: oldExpiryPoint,
          balance_point: updatedBalancePoint,
        },
      });
    }

    const orderIdString = String(id);
    const findTransitionForId = await transition.findAll({
      where: { order_id: orderIdString },
    });

    console.log("findTransitionForId", findTransitionForId);

    if (findTransitionForId.length > 0) {
      return res.json({
        message: "Order ID already exists. No transition or SMS will occur.",
      });
    }

    // Determine if the order is a subscription
    const tag = tags || [];
    console.log("tag", tag);

    const isSubscription = tag.includes("subscription");

    console.log("isSubscription", isSubscription);

    // Process loyalty points usage
    let pointUsedOnPurchase = "no";
    if (note_attributes && Array.isArray(note_attributes)) {
      const loyaltyAttribute = note_attributes.find(
        (attr) => attr.name === "loyalty"
      );
      if (loyaltyAttribute) {
        const loyaltyValue = parseInt(loyaltyAttribute.value, 10);
        pointUsedOnPurchase = loyaltyValue > 0 ? "yes" : "no";
      }
    }

    const rewardData = await paywithrewards.findOne({ where: { id: 1 } });
    const purchaseOnWithReward =
      rewardData?.dataValues?.reward_point_awarded_on_purchase || "no";

    const fetchProductTags = async (productId) => {
      try {
        const response = await axios.get(
          `https://lakmestaging.myshopify.com/admin/api/2024-01/products/${productId}.json`,
          {
            headers: {
              "X-Shopify-Access-Token":
                shopify_token,
            },
          }
        );
        return response.data.product.tags || "";
      } catch (error) {
        console.error(`Error fetching tags for product ${productId}:`, error);
        return "";
      }
    };

    const calculatePointsFromRuleSet = (
      lineItem,
      rules,
      ruleSet,
      total_price
    ) => {
      let points = 0;
      let pointExpiry = null;
      let creditAfterDays = 0;

      rules.forEach((rule) => {
        const matchRule = {
          point_conversion_online_purchase: () =>
            parseFloat(rule.purchaseValue) > 0,
          point_conversion_based_on_sku: () =>
            rule.product_sku?.trim().toLowerCase() ===
            lineItem.sku?.trim().toLowerCase(),
          point_conversion_based_on_category: () =>
            lineItem.tags.includes(rule.category),
          twox_reward_online: () =>
            rule.product_sku?.trim().toLowerCase() ===
            lineItem.sku?.trim().toLowerCase(),
        };

        if (matchRule[ruleSet]?.()) {
          const purchaseValue = parseFloat(rule.purchaseValue) || 1;
          if (ruleSet === "point_conversion_online_purchase") {
            points += Math.round(
              (lineItem.line_price / total_price) *
                ((total_price / purchaseValue) * parseFloat(rule.points || 0))
            );
          } else if (
            ruleSet === "point_conversion_based_on_sku" ||
            ruleSet === "point_conversion_based_on_category"
          ) {
            // Multiply points by the quantity for sku and category rules
            points += (parseFloat(rule.points) || 0) * (lineItem.quantity || 1);
          } else {
            points += parseFloat(rule.points) || 0;
          }

          pointExpiry = rule.expiresAfter
            ? `${rule.expiresAfter} ${rule.expiresType}`
            : rule.expiresOn;
          creditAfterDays = parseInt(rule.credit_after_days, 10) || 0;
        }
      });

      return { points, pointExpiry, creditAfterDays };
    };

    const applyPointsBasedOnRuleSet = (
      lineItem,
      activeRules,
      total_price,
      isSubscription
    ) => {
      const applicableRuleSets = isSubscription
        ? ["twox_reward_online"]
        : [
            "point_conversion_online_purchase",
            "point_conversion_based_on_sku",
            "point_conversion_based_on_category",
          ];

      // "point_conversion_online_purchase"

      for (const ruleSet of applicableRuleSets) {
        if (activeRules[ruleSet]?.length > 0) {
          const result = calculatePointsFromRuleSet(
            lineItem,
            activeRules[ruleSet],
            ruleSet,
            total_price
          );
          if (result.points > 0) {
            return {
              points: result.points,
              pointExpiry: result.pointExpiry,
              creditAfterDays: result.creditAfterDays,
              appliedRuleSet: ruleSet,
            };
          }
        }
      }

      return { points: 0, pointExpiry: null, creditAfterDays: 0 };
    };

    // const processPoints = async () => {
    //   console.log("processPoints inside processPoints");

    //   const lineItemDetails = await Promise.all(
    //     line_items.map(async (item) => {
    //       const productTags = await fetchProductTags(item.product_id);
    //       return {
    //         product_id: item.product_id || null,
    //         line_price: item.line_price || item.price * (item.quantity || 1),
    //         price: parseFloat(item.price),
    //         sku: item.sku || "N/A",
    //         title: item.title || "Unnamed Product",
    //         tags: productTags || "Unnamed Tags",
    //         quantity: item.quantity || 1,
    //       };
    //     })
    //   );

    //   const activeRules = await getActiveRules();
    //   let overallCalculatedPoints = 0;
    //   const calculatedPoints = [];

    //   for (const item of lineItemDetails) {
    //     const { points, pointExpiry, creditAfterDays, appliedRuleSet } =
    //       applyPointsBasedOnRuleSet(
    //         item,
    //         activeRules,
    //         total_price,
    //         isSubscription
    //       );

    //     console.log(
    //       "points, pointExpiry, creditAfterDays, appliedRuleSet",
    //       points,
    //       pointExpiry,
    //       creditAfterDays,
    //       appliedRuleSet
    //     );

    //     if (points > 0) {
    //       const transitionCategory = isSubscription ? "Subscription" : "Buy";
    //       calculatedPoints.push({
    //         product: item.title,
    //         sku: item.sku,
    //         product_id: item.product_id,
    //         tags: item.tags,
    //         calculated_point: points,
    //         pointExpiry,
    //         creditAfterDays,
    //         remarks: `Points calculated using ${appliedRuleSet}`,
    //         transitionCategory,
    //       });
    //       overallCalculatedPoints += points;
    //     }
    //   }

    //   const customerData = await customer.findOne({
    //     where: { customer_id: String(customerReq?.id) },
    //   });

    //   console.log("customerData", customerData);

    //   if (!customerData) {
    //     return { error: "Customer not found" };
    //   }

    //   for (const item of calculatedPoints) {
    //     if (item.calculated_point > 0) {
    //       const transitionId = `reward_point${id}`;
    //       await processPointsUpdate(
    //         customerData,
    //         item.calculated_point,
    //         item.pointExpiry,
    //         item.creditAfterDays,
    //         transitionId,
    //         // generateTransitionId("reward_point"),
    //         //generateTransitionId(isSubscription ? "Subscription" : "Buy"),
    //         id,
    //         item.product_id,
    //         item.transitionCategory
    //       );
    //     }
    //   }

    //   const updatedEarnedPoints =
    //     (parseInt(customerData.earned_point, 10) || 0) +
    //     overallCalculatedPoints;

    //   console.log("updatedEarnedPoints", updatedEarnedPoints);

    //   const updatedBalancePoints =
    //     updatedEarnedPoints -
    //     ((parseInt(customerData.redeem_point, 10) || 0) -
    //       (parseInt(customerData.expiry_point, 10) || 0));

    //   console.log("updatedBalancePoints", updatedBalancePoints);

    //   await createMetafieldHelperFunction(customerReq?.id, {
    //     rclupoint: "0",
    //     lakme_point: updatedBalancePoints.toString(),
    //   });

    //   await updateCampaignPointsFunction(customerReq?.id, id);
    //   await updateOrderNoteHelper(id);
    //   const bb_point = parseInt(customerData.balance_point, 10) || 0;

    //   await sendNotificationsEarnedFun("reward-points-earned", "lakme", {
    //     first_name: customerData.first_name,
    //     phone: customerData.phone_number,
    //     earn_point: overallCalculatedPoints,
    //     balance_point: bb_point,
    //   });

    //   await handleNotifications("reward-points-earned", "lakme", {
    //     email: customerData.email,
    //     first_name: customerData.first_name,
    //     usedPoints: overallCalculatedPoints,
    //     balance_point: bb_point,
    //   });

    //   const result = await updateCustomerTierFunc(
    //     customerReq?.id,
    //     "lakme"
    //   );
    //   console.log("result", result);

    //   //  await sendEmailConfig("reward-points-earned", "lakme", {

    //   //  })

    //   return {
    //     calculatedPoints,
    //     overallCalculatedPoints,
    //     updatedEarnedPoints,
    //     updatedBalancePoints,
    //   };
    // };

    // const processPoints = async () => {
    //   console.log("processPoints inside processPoints");

    //   const lineItemDetails = await Promise.all(
    //     line_items.map(async (item) => {
    //       const productTags = await fetchProductTags(item.product_id);

    //       // Calculate the final price based on discount_allocations
    //       const discountAllocation = item.discount_allocations?.[0]?.amount || 0;
    //       const finalPrice = item.price - parseFloat(discountAllocation);

    //       return {
    //         product_id: item.product_id || null,
    //         line_price: item.line_price || finalPrice * (item.quantity || 1),
    //         price: parseFloat(item.price),
    //         final_price: finalPrice, // Add final price for rule calculations
    //         sku: item.sku || "N/A",
    //         title: item.title || "Unnamed Product",
    //         tags: productTags || "Unnamed Tags",
    //         quantity: item.quantity || 1,
    //         discount_allocations: item.discount_allocations || [], // Include discount info
    //       };
    //     })
    //   );

    //   const activeRules = await getActiveRules();
    //   let overallCalculatedPoints = 0;
    //   const calculatedPoints = [];

    //   for (const item of lineItemDetails) {
    //     const { points, pointExpiry, creditAfterDays, appliedRuleSet } =
    //       applyPointsBasedOnRuleSet(
    //         {
    //           ...item,
    //           price: item.discount_allocations.length
    //             ? item.final_price
    //             : item.price, // Use discounted price for online purchases
    //         },
    //         activeRules,
    //         total_price,
    //         isSubscription
    //       );

    //     console.log(
    //       "points, pointExpiry, creditAfterDays, appliedRuleSet",
    //       points,
    //       pointExpiry,
    //       creditAfterDays,
    //       appliedRuleSet
    //     );

    //     if (points > 0) {
    //       const transitionCategory = isSubscription ? "Subscription" : "Buy";
    //       calculatedPoints.push({
    //         product: item.title,
    //         sku: item.sku,
    //         product_id: item.product_id,
    //         tags: item.tags,
    //         calculated_point: points,
    //         pointExpiry,
    //         creditAfterDays,
    //         remarks: `Points calculated using ${appliedRuleSet}`,
    //         transitionCategory,
    //       });
    //       overallCalculatedPoints += points;
    //     }
    //   }

    //   const customerData = await customer.findOne({
    //     where: { customer_id: String(customerReq?.id) },
    //   });

    //   console.log("customerData", customerData);

    //   if (!customerData) {
    //     return { error: "Customer not found" };
    //   }

    //   for (const item of calculatedPoints) {
    //     if (item.calculated_point > 0) {
    //       const transitionId = `reward_point${id}`;
    //       await processPointsUpdate(
    //         customerData,
    //         item.calculated_point,
    //         item.pointExpiry,
    //         item.creditAfterDays,
    //         transitionId,
    //         id,
    //         item.product_id,
    //         item.transitionCategory
    //       );
    //     }
    //   }

    //   const updatedEarnedPoints =
    //     (parseInt(customerData.earned_point, 10) || 0) + overallCalculatedPoints;

    //   console.log("updatedEarnedPoints", updatedEarnedPoints);

    //   const updatedBalancePoints =
    //     updatedEarnedPoints -
    //     ((parseInt(customerData.redeem_point, 10) || 0) -
    //       (parseInt(customerData.expiry_point, 10) || 0));

    //   console.log("updatedBalancePoints", updatedBalancePoints);

    //   await createMetafieldHelperFunction(customerReq?.id, {
    //     rclupoint: "0",
    //     lakme_point: updatedBalancePoints.toString(),
    //   });

    //   await updateCampaignPointsFunction(customerReq?.id, id);
    //   await updateOrderNoteHelper(id);
    //   const bb_point = parseInt(customerData.balance_point, 10) || 0;

    //   await sendNotificationsEarnedFun("reward-points-earned", "lakme", {
    //     first_name: customerData.first_name,
    //     phone: customerData.phone_number,
    //     earn_point: overallCalculatedPoints,
    //     balance_point: bb_point,
    //   });

    //   await handleNotifications("reward-points-earned", "lakme", {
    //     email: customerData.email,
    //     first_name: customerData.first_name,
    //     usedPoints: overallCalculatedPoints,
    //     balance_point: bb_point,
    //   });

    //   const result = await updateCustomerTierFunc(
    //     customerReq?.id,
    //     "lakme"
    //   );
    //   console.log("result", result);

    //   return {
    //     calculatedPoints,
    //     overallCalculatedPoints,
    //     updatedEarnedPoints,
    //     updatedBalancePoints,
    //   };
    // };

    const processPoints = async () => {
      console.log("processPoints inside processPoints");

      const lineItemDetails = await Promise.all(
        line_items.map(async (item) => {
          const productTags = await fetchProductTags(item.product_id);

          // Calculate the total discount amount from discount_allocations
          const totalDiscountAllocation = (
            item.discount_allocations || []
          ).reduce(
            (sum, discount) => sum + parseFloat(discount.amount || 0),
            0
          );

          // Calculate the final price based on price, quantity, and total discount
          const finalPrice =
            item.price * (item.quantity || 1) - totalDiscountAllocation;

          return {
            product_id: item.product_id || null,
            line_price: finalPrice, // Updated line price calculation
            price: parseFloat(item.price),
            final_price: finalPrice, // Add final price for rule calculations
            sku: item.sku || "N/A",
            title: item.title || "Unnamed Product",
            tags: productTags || "Unnamed Tags",
            quantity: item.quantity || 1,
            discount_allocations: item.discount_allocations || [], // Include discount info
            total_discount: totalDiscountAllocation, // Total discount for this item
          };
        })
      );

      const activeRules = await getActiveRules();
      let overallCalculatedPoints = 0;
      const calculatedPoints = [];

      for (const item of lineItemDetails) {
        const { points, pointExpiry, creditAfterDays, appliedRuleSet } =
          applyPointsBasedOnRuleSet(
            {
              ...item,
              price: item.final_price, // Use discounted price for rule calculations
            },
            activeRules,
            total_price,
            isSubscription
          );

        console.log(
          "points, pointExpiry, creditAfterDays, appliedRuleSet",
          points,
          pointExpiry,
          creditAfterDays,
          appliedRuleSet
        );

        if (points > 0) {
          const transitionCategory = isSubscription ? "Subscription" : "Buy";
          calculatedPoints.push({
            product: item.title,
            sku: item.sku,
            product_id: item.product_id,
            tags: item.tags,
            calculated_point: points,
            pointExpiry,
            creditAfterDays,
            remarks: `Points calculated using ${appliedRuleSet}`,
            transitionCategory,
          });
          overallCalculatedPoints += points;
        }
      }

      const customerData = await customer.findOne({
        where: { customer_id: String(customerReq?.id) },
      });

      console.log("customerData", customerData);

      if (!customerData) {
        return { error: "Customer not found" };
      }

      for (const item of calculatedPoints) {
        if (item.calculated_point > 0) {
          const transitionId = `reward_point${id}`;
          await processPointsUpdate(
            customerData,
            item.calculated_point,
            item.pointExpiry,
            item.creditAfterDays,
            transitionId,
            id,
            item.product_id,
            item.transitionCategory
          );
        }
      }

      const updatedEarnedPoints =
        (parseInt(customerData.earned_point, 10) || 0) +
        overallCalculatedPoints;

      console.log("updatedEarnedPoints", updatedEarnedPoints);

      const updatedBalancePoints =
        updatedEarnedPoints -
        ((parseInt(customerData.redeem_point, 10) || 0) -
          (parseInt(customerData.expiry_point, 10) || 0));

      console.log("updatedBalancePoints", updatedBalancePoints);

      // await createMetafieldHelperFunction(customerReq?.id, {
      //   rclupoint: "0",
      //   lakme_point: updatedBalancePoints.toString(),
      // });

      await updateCampaignPointsFunction(customerReq?.id, id);
      await updateOrderNoteHelper(id);
      const bb_point = parseInt(customerData.balance_point, 10) || 0;

      // await sendNotificationsEarnedFun("reward-points-earned", "lakme", {
      //   first_name: customerData.first_name,
      //   phone: customerData.phone_number,
      //   earn_point: overallCalculatedPoints,
      //   balance_point: bb_point,
      // });

      // await handleNotifications("reward-points-earned", "lakme", {
      //   email: customerData.email,
      //   first_name: customerData.first_name,
      //   usedPoints: overallCalculatedPoints,
      //   balance_point: bb_point,
      // });

      const result = await updateCustomerTierFunc(
        customerReq?.id,
        "lakme"
      );
      console.log("result", result);

      return {
        calculatedPoints,
        overallCalculatedPoints,
        updatedEarnedPoints,
        updatedBalancePoints,
      };
    };

    if (pointUsedOnPurchase === "yes" && purchaseOnWithReward === "yes") {
      console.log("inside yes and yes");
      const result = await processPoints();
      if (result.error) return res.status(404).json({ message: result.error });
      return res.json({ message: "Points processed successfully.", ...result });
    }

    if (pointUsedOnPurchase === "yes" && purchaseOnWithReward === "no") {
      console.log("inside yes and no");

      return res.json({
        message:
          "No points credited as reward point awarding on purchase is disabled.",
      });
    }

    if (pointUsedOnPurchase === "no") {
      console.log("inside no no");

      const result = await processPoints();
      if (result.error) return res.status(404).json({ message: result.error });
      return res.json({ message: "Points processed successfully.", ...result });
    }
    return res.json({
      message: "No points processed due to missing conditions.",
    });
  } catch (error) {
    console.error("Error processing order points:", error);
    return res.status(500).json({ message: "An error occurred.", error });
  }
};

// const updateOrderNoteHelper = async (orderId) => {
//   try {
//     const orderIdString = String(orderId);
//     const findTransitionForId = await transition.findAll({
//       where: { order_id: orderIdString },
//     });

//     console.log("findTransitionForId", findTransitionForId);

//     let totalPointString;

//     if (findTransitionForId.length === 0) {
//       // Default value when no transitions are found
//       totalPointString = JSON.stringify([{ message: "No transition found" }]);
//     } else {
//       // Map transitions to build the note content
//       const total_point = findTransitionForId.map((transition) => ({
//         product_id: transition.dataValues.product_detail,
//         transition_category: transition.dataValues.transition_category,
//         transition_status: transition.dataValues.transition_status,
//         point: transition.dataValues.point,
//       }));

//       totalPointString = JSON.stringify(total_point);
//     }

//     // Update the Shopify order note
//     const updateOrderConfig = {
//       method: "put",
//       maxBodyLength: Infinity,
//       url: `https://lakmestaging.myshopify.com/admin/api/2024-10/orders/${orderId}.json`,
//       headers: {
//         "X-Shopify-Access-Token": shopify_token,
//         "Content-Type": "application/json",
//       },
//       data: JSON.stringify({
//         order: {
//           id: orderId,
//           note: totalPointString,
//         },
//       }),
//     };

//     await axios.request(updateOrderConfig);

//     console.log("Order note updated successfully for order:", orderId);
//     return { message: "Order note updated successfully." };
//   } catch (error) {
//     console.error("Error updating order note:", error.message);
//     return { error: "Failed to update the order note." };
//   }
// };

// const updateOrderNoteHelper = async (orderId) => {
//   try {
//     const orderIdString = String(orderId);

//     // Fetch the transitions for the given order ID
//     const findTransitionForId = await transition.findAll({
//       where: { order_id: orderIdString },
//     });

//     console.log("findTransitionForId", findTransitionForId);

//     let totalPointArray = [];

//     if (findTransitionForId.length === 0) {
//       // Default value when no transitions are found
//       totalPointArray = [{ message: "No transition found" }];
//     } else {
//       // Map transitions to build the note content
//       totalPointArray = findTransitionForId.map((transition) => ({
//         product_id: transition.dataValues.product_detail,
//         transition_category: transition.dataValues.transition_category,
//         transition_status: transition.dataValues.transition_status,
//         point: transition.dataValues.point,
//         transition_id: transition.dataValues.transition_id,
//       }));
//     }

//     // Base Axios configuration
//     const axiosInstance = axios.create({
//       baseURL: "https://lakmestaging.myshopify.com/admin/api/2024-10",
//       headers: {
//         "X-Shopify-Access-Token": shopify_token,
//         "Content-Type": "application/json",
//       },
//     });

//     // Fetch the existing order
//     const fetchConfig = {
//       method: "get",
//       url: `/orders/${orderIdString}.json`,
//     };

//     const response = await axiosInstance(fetchConfig);
//     const existingOrder = response.data.order;

//     if (!existingOrder) {
//       throw new Error("Order not found.");
//     }

//     // Handle the existing note
//     let updatedNoteString = "";

//     if (existingOrder.note) {
//       try {
//         // Parse the existing note if it is a valid JSON array
//         let existingNoteArray = JSON.parse(existingOrder.note);

//         // Ensure it's an array before appending
//         if (Array.isArray(existingNoteArray)) {
//           existingNoteArray = existingNoteArray.concat(totalPointArray);
//           updatedNoteString = JSON.stringify(existingNoteArray);
//         } else {
//           // If not an array, append new notes as a string
//           updatedNoteString =
//             existingOrder.note + "\n" + JSON.stringify(totalPointArray);
//         }
//       } catch (error) {
//         console.warn(
//           "Existing note is not a valid JSON array. Treating it as a string."
//         );
//         updatedNoteString =
//           existingOrder.note + "\n" + JSON.stringify(totalPointArray);
//       }
//     } else {
//       // If no existing note, initialize with totalPointArray
//       updatedNoteString = JSON.stringify(totalPointArray);
//     }

//     // Update the Shopify order note
//     const updateOrderConfig = {
//       method: "put",
//       url: `/orders/${orderIdString}.json`,
//       data: {
//         order: {
//           id: orderIdString,
//           note: updatedNoteString,
//         },
//       },
//     };

//     await axiosInstance(updateOrderConfig);

//     console.log("Order note updated successfully for order:", orderIdString);
//     return { message: "Order note updated successfully." };
//   } catch (error) {
//     console.error("Error updating order note:", error.message);

//     // Return meaningful error response
//     if (error.response) {
//       return { error: error.response.data || "Error from Shopify API" };
//     } else {
//       return { error: "Failed to update the order note." };
//     }
//   }
// };

const updateOrderNoteHelper = async (orderId) => {
  try {
    const orderIdString = String(orderId);

    // Fetch the transitions for the given order ID
    const findTransitionForId = await transition.findAll({
      where: { order_id: orderIdString },
    });

    console.log("findTransitionForId", findTransitionForId);

    if (findTransitionForId.length === 0) {
      console.log("No transition found, skipping order note update.");
      return { message: "No transition found, no update needed." };
    }

    // Map transitions to build the note content
    const totalPointArray = findTransitionForId.map((transition) => ({
      product_id: transition.dataValues.product_detail,
      transition_category: transition.dataValues.transition_category,
      transition_status: transition.dataValues.transition_status,
      point: transition.dataValues.point,
      transition_id: transition.dataValues.transition_id,
    }));

    // Base Axios configuration
    const axiosInstance = axios.create({
      baseURL: "https://lakmestaging.myshopify.com/admin/api/2024-10",
      headers: {
        "X-Shopify-Access-Token": shopify_token,
        "Content-Type": "application/json",
      },
    });

    // Fetch the existing order
    const fetchConfig = {
      method: "get",
      url: `/orders/${orderIdString}.json`,
    };

    const response = await axiosInstance(fetchConfig);
    const existingOrder = response.data.order;

    if (!existingOrder) {
      throw new Error("Order not found.");
    }

    // Handle the existing note
    let updatedNoteString = "";

    if (existingOrder.note) {
      try {
        // Parse the existing note if it is a valid JSON array
        let existingNoteArray = JSON.parse(existingOrder.note);

        // Ensure it's an array before appending
        if (Array.isArray(existingNoteArray)) {
          existingNoteArray = existingNoteArray.concat(totalPointArray);
          updatedNoteString = JSON.stringify(existingNoteArray);
        } else {
          // If not an array, append new notes as a string
          updatedNoteString =
            existingOrder.note + "\n" + JSON.stringify(totalPointArray);
        }
      } catch (error) {
        console.warn(
          "Existing note is not a valid JSON array. Treating it as a string."
        );
        updatedNoteString =
          existingOrder.note + "\n" + JSON.stringify(totalPointArray);
      }
    } else {
      // If no existing note, initialize with totalPointArray
      updatedNoteString = JSON.stringify(totalPointArray);
    }

    // Update the Shopify order note
    const updateOrderConfig = {
      method: "put",
      url: `/orders/${orderIdString}.json`,
      data: {
        order: {
          id: orderIdString,
          note: updatedNoteString,
        },
      },
    };

    await axiosInstance(updateOrderConfig);

    console.log("Order note updated successfully for order:", orderIdString);
    return { message: "Order note updated successfully." };
  } catch (error) {
    console.error("Error updating order note:", error.message);

    // Return meaningful error response
    if (error.response) {
      return { error: error.response.data || "Error from Shopify API" };
    } else {
      return { error: "Failed to update the order note." };
    }
  }
};

export const updateOrderNote = async (req, res) => {
  try {
    // Validate orderId from query parameters
    const { orderId } = req.query;
    if (!orderId) {
      return res
        .status(400)
        .json({ error: "Missing or invalid 'orderId' in request." });
    }

    const orderIdString = String(orderId);

    // New note (dummyNote) to append
    const dummyNote = [
      {
        product_id: "DUMMY_PRODUCT_12werwe3",
        transition_category: "Duwemmy Category",
        transition_status: "Duwemmy Status",
        point: 0,
      },
      {
        product_id: "DUMMY_PRODUCwerT_456",
        transition_category: "Another Dweummy Category",
        transition_status: "Another Duwemmy Status",
        point: 10,
      },
    ];

    // Base Axios configuration
    const axiosInstance = axios.create({
      baseURL: "https://lakmestaging.myshopify.com/admin/api/2024-10",
      headers: {
        "X-Shopify-Access-Token": shopify_token,
        "Content-Type": "application/json",
      },
    });

    // Step 1: Fetch the existing order
    const fetchConfig = {
      method: "get",
      url: `/orders/${orderIdString}.json`,
    };

    const response = await axiosInstance(fetchConfig);
    const existingOrder = response.data.order;

    if (!existingOrder) {
      return res.status(404).json({ error: "Order not found." });
    }

    // Step 2: Handle the existing note
    let updatedNoteString = "";

    if (existingOrder.note) {
      try {
        // Parse the existing note if it is a valid JSON array
        let existingNoteArray = JSON.parse(existingOrder.note);

        // Ensure it's an array before appending
        if (Array.isArray(existingNoteArray)) {
          existingNoteArray = existingNoteArray.concat(dummyNote);
          updatedNoteString = JSON.stringify(existingNoteArray);
        } else {
          // If not an array, append new notes as a string
          updatedNoteString =
            existingOrder.note + "\n" + JSON.stringify(dummyNote);
        }
      } catch (error) {
        console.warn(
          "Existing note is not a valid JSON array. Treating it as a string."
        );
        updatedNoteString =
          existingOrder.note + "\n" + JSON.stringify(dummyNote);
      }
    } else {
      // If no existing note, initialize with dummyNote
      updatedNoteString = JSON.stringify(dummyNote);
    }

    // Step 3: Update the order note
    const updateOrderConfig = {
      method: "put",
      url: `/orders/${orderIdString}.json`,
      data: {
        order: {
          id: orderIdString,
          note: updatedNoteString,
        },
      },
    };

    await axiosInstance(updateOrderConfig);

    console.log("Order note updated successfully for order:", orderIdString);
    res
      .status(200)
      .json({ message: "Order note updated successfully with new data." });
  } catch (error) {
    console.error("Error updating order note:", error.message);

    // Send meaningful error messages
    if (error.response) {
      res
        .status(error.response.status)
        .json({ error: error.response.data || "Error from Shopify API" });
    } else {
      res.status(500).json({ error: "Failed to update the order note." });
    }
  }
};

// export const ordertest = async (req, res) => {
//   try {
//     const {
//       id,
//       email,
//       line_items,
//       total_price,
//       tags,
//       note_attributes,
//       customer: customerReq,
//     } = req.body;

//     // Set default tag for testing if tags are not provided
//     // || "subscription";
//     const tag = tags;
//     const isSubscription = tag.includes("subscription");

//     console.log("note_attributes", note_attributes);

//     console.log("Tags from request body:", tag);
//     console.log("Is Subscription Order:", isSubscription);

//     const fetchProductTags = async (productId) => {
//       try {
//         const config = {
//           method: "get",
//           maxBodyLength: Infinity,
//           url: `https://lakmestaging.myshopify.com/admin/api/2024-01/products/${productId}.json`,
//           headers: {
//             "X-Shopify-Access-Token": shopify_token,
//           },
//         };
//         const response = await axios.request(config);
//         return response.data.product.tags || "";
//       } catch (error) {
//         console.error(`Error fetching tags for product ${productId}:`, error);
//         return "";
//       }
//     };

//     const calculatePointsFromRuleSet = (
//       lineItem,
//       rules,
//       ruleSet,
//       total_price
//     ) => {
//       let points = 0;
//       let pointExpiry = null;
//       let creditAfterDays = 0;

//       rules.forEach((rule) => {
//         if (
//           ruleSet === "point_conversion_online_purchase" &&
//           parseFloat(rule.purchaseValue) > 0
//         ) {
//           const purchaseValue = parseFloat(rule.purchaseValue) || 1;
//           points += Math.floor(
//             (lineItem.line_price / total_price) *
//               ((total_price / purchaseValue) * parseFloat(rule.points || 0))
//           );
//           // points += parseFloat(rule.points) || 0;

//           // Use expiry and credit info from matched SKU
//           pointExpiry = rule.expiresAfter
//             ? `${rule.expiresAfter} ${rule.expiresType}`
//             : rule.expiresOn;
//           creditAfterDays = parseInt(rule.credit_after_days, 10) || 0;
//         } else if (
//           ruleSet === "point_conversion_based_on_sku" &&
//           rule.product_sku?.trim().toLowerCase() ===
//             lineItem.sku?.trim().toLowerCase()
//         ) {
//           points += parseFloat(rule.points) || 0;

//           // Use expiry and credit info from matched SKU
//           pointExpiry = rule.expiresAfter
//             ? `${rule.expiresAfter} ${rule.expiresType}`
//             : rule.expiresOn;
//           creditAfterDays = parseInt(rule.credit_after_days, 10) || 0;
//         } else if (
//           ruleSet === "point_conversion_based_on_category" &&
//           lineItem.tags.includes(rule.category)
//         ) {
//           points += parseFloat(rule.points) || 0;
//           pointExpiry = rule.expiresAfter
//             ? `${rule.expiresAfter} ${rule.expiresType}`
//             : rule.expiresOn;
//           creditAfterDays = parseInt(rule.credit_after_days, 10) || 0;
//         } else if (
//           ruleSet === "twox_reward_online" &&
//           rule.product_sku?.trim().toLowerCase() ===
//             lineItem.sku?.trim().toLowerCase()
//         ) {
//           points += parseFloat(rule.points) || 0;
//           pointExpiry = rule.expiresAfter
//             ? `${rule.expiresAfter} ${rule.expiresType}`
//             : rule.expiresOn;
//           creditAfterDays = parseInt(rule.credit_after_days, 10) || 0;
//         }
//       });

//       return { points, pointExpiry, creditAfterDays };
//     };

//     const applyPointsBasedOnRuleSet = (
//       lineItem,
//       activeRules,
//       total_price,
//       isSubscription
//     ) => {
//       let applicableRuleSets = [];

//       if (isSubscription) {
//         // Check if `twox_reward_online` exists
//         if (activeRules["twox_reward_online"]?.length > 0) {
//           applicableRuleSets = ["twox_reward_online"];
//         } else {
//           // Fallback to other rule sets if `twox_reward_online` is not available
//           applicableRuleSets = [
//             "point_conversion_online_purchase",
//             "point_conversion_based_on_sku",
//             "point_conversion_based_on_category",
//           ];
//         }
//       } else {
//         // For non-subscription orders, exclude `twox_reward_online`
//         applicableRuleSets = [
//           "point_conversion_online_purchase",
//           "point_conversion_based_on_sku",
//           "point_conversion_based_on_category",
//         ];
//       }

//       for (const ruleSet of applicableRuleSets) {
//         if (activeRules[ruleSet]?.length > 0) {
//           const result = calculatePointsFromRuleSet(
//             lineItem,
//             activeRules[ruleSet],
//             ruleSet,
//             total_price
//           );
//           if (result.points > 0) {
//             return {
//               points: result.points,
//               pointExpiry: result.pointExpiry,
//               creditAfterDays: result.creditAfterDays,
//               appliedRuleSet: ruleSet,
//             };
//           }
//         }
//       }

//       return {
//         points: 0,
//         pointExpiry: null,
//         creditAfterDays: 0,
//         appliedRuleSet: null,
//       };
//     };

//     const processPoints = async () => {
//       const lineItemDetails = await Promise.all(
//         line_items.map(async (item) => {
//           const productTags = await fetchProductTags(item.product_id);
//           return {
//             product_id: item.product_id || null,
//             line_price: item.line_price
//               ? parseFloat(item.line_price)
//               : parseFloat(item.price) * (item.quantity || 1),
//             price: parseFloat(item.price),
//             sku: item.sku || "N/A",
//             title: item.title || "Unnamed Product",
//             tags: productTags || "Unnamed Tags",
//           };
//         })
//       );

//       const activeRules = await getActiveRules(); // Assume this fetches active rules as provided in the input
//       let overallCalculatedPoints = 0;
//       const calculatedPoints = [];

//       for (const item of lineItemDetails) {
//         const { points, pointExpiry, creditAfterDays, appliedRuleSet } =
//           applyPointsBasedOnRuleSet(
//             item,
//             activeRules,
//             total_price,
//             isSubscription
//           );

//         if (points > 0) {
//           calculatedPoints.push({
//             product: item.title,
//             sku: item.sku,
//             product_id: item.product_id,
//             tags: item.tags,
//             calculated_point: points,
//             pointExpiry,
//             creditAfterDays,
//             remarks: `Points calculated using ${appliedRuleSet}`,
//           });

//           overallCalculatedPoints += points;
//         }
//       }

//       const customerData = await customer.findOne({
//         where: { customer_id: String(req.body.customer?.id) },
//       });

//       if (!customerData) {
//         return { error: "Customer not found" };
//       }

//       for (const item of calculatedPoints) {
//         const { calculated_point, pointExpiry, creditAfterDays, product_id } =
//           item;
//         if (calculated_point > 0) {
//           const transitionId = generateTransitionId("reward_point");
//           await processPointsUpdate(
//             customerData,
//             calculated_point,
//             pointExpiry,
//             creditAfterDays,
//             transitionId,
//             id,
//             product_id
//           );
//         }
//       }

//       const updatedEarnedPoints =
//         (parseInt(customerData.earned_point, 10) || 0) +
//         overallCalculatedPoints;
//       const updatedBalancePoints =
//         updatedEarnedPoints - (parseInt(customerData.redeem_point, 10) || 0); - (parseInt(customerData.expiry_point, 10) || 0);

//       await createMetafieldHelperFunction(req.body.customer?.id, {
//         rclupoint: "0",
//         lakme_point: updatedBalancePoints.toString(),
//       });

//       await updateCampaignPointsFunction(customerReq?.id, id);
//       await updateOrderNoteHelper(id);

//       const result = await sendNotificationsEarnedFun(
//         "reward-points-earned",
//         "lakme",
//         {
//           "first_name": customerData.first_name,
//           "phone": customerData.phone_number,
//           "earn_point": overallCalculatedPoints,
//           "balance_point": customerData.balance_point
//         }
//       );

//        console.log("sendNotificationsReedem",result);

//       return {
//         calculatedPoints,
//         overallCalculatedPoints,
//         updatedEarnedPoints,
//         updatedBalancePoints,
//       };
//     };

//     const result = await processPoints();

//     if (result.error) {
//       return res.status(404).json({ message: result.error });
//     }

//     return res.json({ message: "Points processed successfully.", ...result });
//   } catch (error) {
//     console.error("Error processing order points:", error);
//     return res.status(500).json({ message: "An error occurred.", error });
//   }
// };

// const updateCampaignPointsFunction = async (customer_id, order_id) => {
//   try {
//     console.log("Customer ID:", customer_id);
//     console.log("Order ID:", order_id);

//     if (!customer_id || !order_id) {
//       return {
//         message: "Customer ID and Order ID are required.",
//         status: 400,
//       };
//     }

//     const currentISTTime = moment().tz("Asia/Kolkata");
//     const activeCampaigns = await campaign_new.findAll({
//       where: {
//         status: "active",
//         startDate: { [Op.lte]: currentISTTime.format("YYYY-MM-DD") },
//         endDate: { [Op.gte]: currentISTTime.format("YYYY-MM-DD") },
//       },
//     });

//     if (!activeCampaigns || activeCampaigns.length === 0) {
//       console.log("No active campaigns found.");
//       return {
//         message: "No active campaigns found.",
//         status: 404,
//       };
//     }

//     console.log("Active Campaigns:", activeCampaigns);

//     const updatedTransitions = [];
//     const customerIdString = String(customer_id);
//     const orderIdString = String(order_id);

//     for (const campaign of activeCampaigns) {
//       const {
//         startDate,
//         endDate,
//         startTime,
//         endTime,
//         product_detail,
//         pointType,
//         welcome,
//         blue,
//         silver,
//         gold,
//         platinum,
//       } = campaign;

//       const tierPointsMap = { welcome, blue, silver, gold, platinum };

//       // Ensure `product_detail` is parsed correctly
//       const productDetails =
//         typeof product_detail === "string"
//           ? JSON.parse(product_detail)
//           : product_detail;

//       if (!productDetails || typeof productDetails !== "object") {
//         console.log(
//           `Invalid product_detail format for campaign ID ${campaign.id}.`
//         );
//         continue;
//       }

//       // Extract product IDs from `product_detail`
//       const productIds = Object.values(productDetails).map((p) => p.product_id);

//       const transitionsToUpdate = await transition.findAll({
//         where: {
//           transition_status: { [Op.in]: ["credit", "hold"] },
//           product_detail: { [Op.in]: productIds },
//           customer_Id: customerIdString,
//           order_Id: orderIdString,
//         },
//       });

//       if (!transitionsToUpdate || transitionsToUpdate.length === 0) {
//         console.log(`No transitions found for campaign ID ${campaign.id}.`);
//         continue;
//       }

//       for (const txn of transitionsToUpdate) {
//         const customerData = await customer.findOne({
//           where: { customer_id: txn.customer_Id },
//         });

//         if (!customerData) {
//           console.log(`Customer with ID ${txn.customer_Id} not found.`);
//           continue;
//         }

//         const membershipTier = customerData.membership_tier?.toLowerCase();
//         const tierPoints = tierPointsMap[membershipTier];

//         if (!tierPoints) {
//           console.log(`No points configured for tier: ${membershipTier}`);
//           continue;
//         }

//         const oldPoints = parseInt(txn.point, 10);
//         console.log("Old Points:", oldPoints);

//         const newPoints =
//           pointType === "Points"
//             ? oldPoints + tierPoints
//             : oldPoints * tierPoints;
//         console.log("New Points:", newPoints);

//         // Update transaction points
//         await transition.update(
//           { point: newPoints },
//           { where: { id: txn.id } }
//         );

//         if (txn.transition_status === "credit") {
//           const oldEarnedPoint = parseInt(customerData.earned_point, 10) || 0;
//           const oldRedeemPoint = parseInt(customerData.redeem_point, 10) || 0;
//           const oldExpiryPoint = parseInt(customerData.expiry_point, 10) || 0;

//           const updatedEarnedPoints = oldEarnedPoint + (newPoints - oldPoints);
//           const updatedBalancePoints =
//             updatedEarnedPoints - oldRedeemPoint - oldExpiryPoint;

//           await customer.update(
//             {
//               earned_point: updatedEarnedPoints,
//               balance_point: updatedBalancePoints,
//             },
//             { where: { customer_id: txn.customer_Id } }
//           );

//           console.log(
//             `Updated Customer Points: Earned: ${updatedEarnedPoints}, Balance: ${updatedBalancePoints}`
//           );
//         }

//         updatedTransitions.push({
//           transitionId: txn.id,
//           oldPoints,
//           newPoints,
//         });
//       }
//     }

//     if (updatedTransitions.length === 0) {
//       return {
//         message: "No eligible campaigns or transitions found for update.",
//         status: 404,
//       };
//     }

//     return {
//       message: "Campaign points updated successfully.",
//       updatedTransitions,
//       status: 200,
//     };
//   } catch (error) {
//     console.error("Error updating campaign points:", error);
//     return {
//       message: "An error occurred while updating campaign points.",
//       error: error.message,
//       status: 500,
//     };
//   }
// };

const updateCampaignPointsFunction = async (customer_id, order_id) => {
  try {
    console.log("Customer ID:", customer_id);
    console.log("Order ID:", order_id);

    if (!customer_id || !order_id) {
      return {
        message: "Customer ID and Order ID are required.",
        status: 400,
      };
    }

    const currentISTTime = moment().tz("Asia/Kolkata");
    const currentTime = currentISTTime.format("HH:mm");

    // Find active campaigns with startTime and endTime checks
    const activeCampaigns = await campaign_new.findAll({
      where: {
        status: "active",
        startDate: { [Op.lte]: currentISTTime.format("YYYY-MM-DD") },
        endDate: { [Op.gte]: currentISTTime.format("YYYY-MM-DD") },
        startTime: { [Op.lte]: currentTime },
        endTime: { [Op.gte]: currentTime },
      },
    });

    if (!activeCampaigns || activeCampaigns.length === 0) {
      console.log("No active campaigns found.");
      return {
        message: "No active campaigns found.",
        status: 404,
      };
    }

    console.log("Active Campaigns:", activeCampaigns);

    const updatedTransitions = [];
    const customerIdString = String(customer_id);
    const orderIdString = String(order_id);

    for (const campaign of activeCampaigns) {
      const {
        product_detail,
        pointType,
        welcome,
        blue,
        silver,
        gold,
        platinum,
        id,
        name,
        description,
        startDate,
        endDate,
        startTime,
        endTime,
      } = campaign;

      const tierPointsMap = { welcome, blue, silver, gold, platinum };

      // Parse product details if required
      const productDetails =
        typeof product_detail === "string"
          ? JSON.parse(product_detail)
          : product_detail;

      if (!productDetails || typeof productDetails !== "object") {
        console.log(
          `Invalid product_detail format for campaign ID ${campaign.id}.`
        );
        continue;
      }

      // Extract product IDs from product details
      const productIds = Object.values(productDetails).map((p) => p.product_id);

      const transitionsToUpdate = await transition.findAll({
        where: {
          transition_status: { [Op.in]: ["credit", "hold"] },
          product_detail: { [Op.in]: productIds },
          customer_Id: customerIdString,
          order_Id: orderIdString,
        },
      });

      if (!transitionsToUpdate || transitionsToUpdate.length === 0) {
        console.log(`No transitions found for campaign ID ${campaign.id}.`);
        continue;
      }

      for (const txn of transitionsToUpdate) {
        const customerData = await customer.findOne({
          where: { customer_id: txn.customer_Id },
        });

        if (!customerData) {
          console.log(`Customer with ID ${txn.customer_Id} not found.`);
          continue;
        }

        const membershipTier = customerData.membership_tier?.toLowerCase();
        const tierPoints = tierPointsMap[membershipTier];

        if (!tierPoints) {
          console.log(`No points configured for tier: ${membershipTier}`);
          continue;
        }

        // Skip if pointType is "Multiplier" and tierPoints is 1
        if (pointType === "Multiplier" && tierPoints === 1) {
          console.log(
            `Skipping transition for customer ${txn.customer_Id} as tierPoints is 1 with Multiplier`
          );
          continue;
        }

        const oldPoints = parseInt(txn.point, 10);
        console.log("Old Points:", oldPoints);

        //? testing
        const adjustedTierPoints =
          pointType === "Multiplier" && tierPoints > 1
            ? tierPoints - 1
            : tierPoints;

        const newPoints =
          pointType === "Points" ? tierPoints : oldPoints * adjustedTierPoints;

        console.log("Adjusted Tier Points:", adjustedTierPoints);
        console.log("New Points:", newPoints);
        //? testing

        //! original
        // const newPoints =
        //   pointType === "Points"
        //     ? tierPoints
        //     : oldPoints * tierPoints;
        //! original

        // console.log("New Points:", newPoints);

        //   const newPoints =
        //   pointType === "Points"
        //     ? oldPoints + tierPoints
        //     : oldPoints * tierPoints;

        // console.log("New Points:", newPoints);

        // Create a new transition
        const transactionData = {
          customer_Id: txn.customer_Id,
          transition_id: txn.transition_id,
          account_number: txn.account_number,
          transition_category: "campaign",
          transition_status: "credit",
          medium: "desktop",
          point: newPoints,
          expiry_date: txn.expiry_date,
          order_id: txn.order_id,
          product_detail: txn.product_detail,
          sourceOfDevice: "website",
          store: "lakme",
          name: txn.name,
          mobile_no: txn.mobile_no,
          state: txn.state,
          city: txn.city,
          serial_no: "",
          coupon_code: "",
          scan_manual: "",
        };

        await transition.create(transactionData);
        console.log("campaign 5419==>",campaign)

        const customer_campaign_anlytic_Data = {
          account_number: customerData.account_number,
          customer_id: txn.customer_Id,
          phone_number: customerData.phone_number,
          campaign_point: newPoints,
          email: customerData.email,
          name: customerData.first_name,
          date_of_birth: customerData.date_of_birth,
          earned_point: customerData.earned_point,
          redeem_point: customerData.redeem_point,
          expiry_point: customerData.expiry_point,
          balance_point: customerData.balance_point,
          membership_tier: customerData.membership_tier,
          gender: customerData.gender,
          source_of_device: "website",
          store: "lakme",
          campagin_name: campaign.name,             
          campagin_id: campaign.id,                 
          campagin_description:campaign.description, 
          campagin_startDate:campaign.startDate,    
          campagin_endDate: campaign.endDate,        
          campagin_startTime: campaign.startTime,    
          campagin_endTime: campaign.endTime         
        };

   
        await customer_campaign_data.create(customer_campaign_anlytic_Data);


        const oldEarnedPoint = parseInt(customerData.earned_point, 10) || 0;
        const oldRedeemPoint = parseInt(customerData.redeem_point, 10) || 0;
        const oldExpiryPoint = parseInt(customerData.expiry_point, 10) || 0;

        const updatedEarnedPoints = oldEarnedPoint + newPoints;
        const updatedBalancePoints =
          updatedEarnedPoints - oldRedeemPoint - oldExpiryPoint;

        // Update customer points
        await customer.update(
          {
            earned_point: updatedEarnedPoints,
            balance_point: updatedBalancePoints,
          },
          { where: { customer_id: txn.customer_Id } }
        );

        // await createMetafieldHelperFunction(customer_id, {
        //   rclupoint: "0",
        //   lakme_point: updatedBalancePoints.toString(),
        // });

        // Send notifications
        const bb_point = parseInt(customerData.balance_point, 10) || 0;
        // await sendNotificationsEarnedFun(
        //   "reward-points-earned",
        //   "lakme",
        //   {
        //     first_name: customerData.first_name,
        //     phone: customerData.phone_number,
        //     earn_point: newPoints,
        //     balance_point: bb_point,
        //   }
        // );

        // await handleNotifications("reward-points-earned", "lakme", {
        //   email: customerData.email,
        //   first_name: customerData.first_name,
        //   usedPoints: newPoints,
        //   balance_point: bb_point,
        // });

        // Update customer tier
        await updateCustomerTierFunc(customer_id, "lakme");

        console.log(
          `Updated Customer Points: Earned: ${updatedEarnedPoints}, Balance: ${updatedBalancePoints}`
        );

        updatedTransitions.push({
          transitionId: txn.id,
          oldPoints,
          newPoints,
        });
      }
    }

    if (updatedTransitions.length === 0) {
      return {
        message: "No eligible campaigns or transitions found for update.",
        status: 404,
      };
    }

    return {
      message: "Campaign points updated successfully.",
      updatedTransitions,
      status: 200,
    };
  } catch (error) {
    console.error("Error updating campaign points:", error);
    return {
      message: "An error occurred while updating campaign points.",
      error: error.message,
      status: 500,
    };
  }
};

// export const updateCampaignPoints = async (req, res) => {
//   try {
//     const { customer_id } = req.body;

//     if (!customer_id) {
//       return res.status(400).json({
//         message: "Customer ID is required.",
//         status: 400,
//       });
//     }

//     const currentISTTime = moment().tz("Asia/Kolkata");
//     const campaigns = await campaign.findAll({
//       where: {
//         status: "active",
//         startDate: { [Op.lte]: currentISTTime.format("YYYY-MM-DD") },
//         endDate: { [Op.gte]: currentISTTime.format("YYYY-MM-DD") },
//       },
//     });

//     if (!campaigns || campaigns.length === 0) {
//       console.log("No active campaigns found.");
//       return res.status(404).json({
//         message: "No active campaigns found.",
//         status: 404,
//       });
//     }

//     console.log("Active Campaigns:", campaigns);

//     const updatedTransitions = [];

//     for (const campaign of campaigns) {
//       const { startTime, endTime, product_id, pointType, welcome, blue, silver, gold, platinum } = campaign;

//       console.log("Tier Points: Welcome", welcome, "Blue", blue, "Silver", silver, "Gold", gold, "Platinum", platinum);

//       const tierPointsMap = {
//         welcome: welcome,
//         blue: blue,
//         silver: silver,
//         gold: gold,
//         platinum: platinum,
//       };

//       const campaignStartDateTime = moment(`${campaign.startDate} ${startTime}`, "YYYY-MM-DD HH:mm").toISOString();
//       const campaignEndDateTime = moment(`${campaign.endDate} ${endTime}`, "YYYY-MM-DD HH:mm").toISOString();
//       const transitionsToUpdate = await transition.findAll({
//         where: {
//           transition_status: { [Op.in]: ["credit", "hold"] },
//           product_detail: product_id,
//           customer_Id: customer_id,
//           createdAt: {
//             [Op.between]: [campaignStartDateTime, campaignEndDateTime],
//           },
//         },
//       });

//       if (!transitionsToUpdate || transitionsToUpdate.length === 0) {
//         console.log(`No transitions found for campaign ID ${campaign.id} within the active period.`);
//         continue;
//       }

//       for (const txn of transitionsToUpdate) {
//         const customerData = await customer.findOne({ where: { customer_id: txn.customer_Id } });

//         if (!customerData) {
//           console.log(`Customer with ID ${txn.customer_Id} not found.`);
//           continue;
//         }

//         const tierPoints = tierPointsMap[customerData.membership_tier.toLowerCase()];
//         console.log("tierPoints",tierPoints);

//         if (!tierPoints) {
//           console.log(`No points configured for tier: ${customerData.membership_tier}`);
//           continue; // Skip if no points configured for the tier
//         }

//         let updatedPoints = parseInt(txn.point, 10);

//         if (pointType === "Points") {
//           updatedPoints += tierPoints;
//         } else if (pointType === "Multiplier") {
//           updatedPoints *= tierPoints;
//         }

//         // Update the transaction points
//         await transition.update(
//           { point: updatedPoints },
//           { where: { id: txn.id } }
//         );

//         updatedTransitions.push({
//           transitionId: txn.id,
//           oldPoints: txn.point,
//           newPoints: updatedPoints,
//         });
//       }
//     }

//     if (updatedTransitions.length === 0) {
//       return res.status(404).json({
//         message: "No eligible campaigns or transitions found for update.",
//         status: 404,
//       });
//     }

//     return res.status(200).json({
//       message: "Campaign points updated successfully.",
//       updatedTransitions,
//       status: 200,
//     });
//   } catch (error) {
//     console.error("Error updating campaign points:", error);
//     return res.status(500).json({
//       message: "An error occurred while updating campaign points.",
//       error,
//     });
//   }
// };

// export const updateCampaignPoints = async (req, res) => {
//   try {
//     const { customer_id, order_id } = req.body;

//     if (!customer_id || !order_id) {
//       return res.status(400).json({
//         message: "Customer ID and Order ID are required.",
//         status: 400,
//       });
//     }

//     const currentISTTime = moment().tz("Asia/Kolkata");
//     const campaigns = await campaign.findAll({
//       where: {
//         status: "active",
//         startDate: { [Op.lte]: currentISTTime.format("YYYY-MM-DD") },
//         endDate: { [Op.gte]: currentISTTime.format("YYYY-MM-DD") },
//       },
//     });

//     if (!campaigns || campaigns.length === 0) {
//       console.log("No active campaigns found.");
//       return res.status(404).json({
//         message: "No active campaigns found.",
//         status: 404,
//       });
//     }

//     console.log("Active Campaigns:", campaigns);

//     const updatedTransitions = [];

//     for (const campaign of campaigns) {
//       const {
//         startTime,
//         endTime,
//         product_id,
//         pointType,
//         welcome,
//         blue,
//         silver,
//         gold,
//         platinum,
//       } = campaign;

//       const tierPointsMap = {
//         welcome,
//         blue,
//         silver,
//         gold,
//         platinum,
//       };

//       const campaignStartDateTime = moment(
//         `${campaign.startDate} ${startTime}`,
//         "YYYY-MM-DD HH:mm"
//       ).toISOString();
//       const campaignEndDateTime = moment(
//         `${campaign.endDate} ${endTime}`,
//         "YYYY-MM-DD HH:mm"
//       ).toISOString();

//       const transitionsToUpdate = await transition.findAll({
//         where: {
//           transition_status: { [Op.in]: ["credit", "hold"] },
//           product_detail: product_id,
//           customer_Id: customer_id,
//           order_Id: order_id,
//           createdAt: {
//             [Op.between]: [campaignStartDateTime, campaignEndDateTime],
//           },
//         },
//       });

//       if (!transitionsToUpdate || transitionsToUpdate.length === 0) {
//         console.log(
//           `No transitions found for campaign ID ${campaign.id} within the active period.`
//         );
//         continue;
//       }

//       for (const txn of transitionsToUpdate) {
//         const customerData = await customer.findOne({
//           where: { customer_id: txn.customer_Id },
//         });

//         if (!customerData) {
//           console.log(`Customer with ID ${txn.customer_Id} not found.`);
//           continue;
//         }

//         const tierPoints =
//           tierPointsMap[customerData.membership_tier.toLowerCase()];
//         if (!tierPoints) {
//           console.log(
//             `No points configured for tier: ${customerData.membership_tier}`
//           );
//           continue; // Skip if no points configured for the tier
//         }

//         let updatedPoints = parseInt(txn.point, 10);

//         if (pointType === "Points") {
//           updatedPoints += tierPoints;
//         } else if (pointType === "Multiplier") {
//           updatedPoints *= tierPoints;
//         }

//         // Update the transaction points
//         await transition.update(
//           { point: updatedPoints },
//           { where: { id: txn.id } }
//         );

//         updatedTransitions.push({
//           transitionId: txn.id,
//           oldPoints: txn.point,
//           newPoints: updatedPoints,
//         });
//       }
//     }

//     if (updatedTransitions.length === 0) {
//       return res.status(404).json({
//         message: "No eligible campaigns or transitions found for update.",
//         status: 404,
//       });
//     }

//     return res.status(200).json({
//       message: "Campaign points updated successfully.",
//       updatedTransitions,
//       status: 200,
//     });
//   } catch (error) {
//     console.error("Error updating campaign points:", error);
//     return res.status(500).json({
//       message: "An error occurred while updating campaign points.",
//       error,
//     });
//   }
// };

// export const orderCancelRefund = async (req, res) => {
//   try {
//     const orderId = req.body.id;

//     if (!orderId) {
//       return res.status(400).json({ message: "Order ID is required." });
//     }

//     console.log("Processing refund for Order ID:", orderId);
//     const orderIdString = String(orderId);
//     const transitionEntries = await transition.findAll({
//       where: { order_id: orderIdString },
//     });

//     if (!transitionEntries || transitionEntries.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "No transition found for this order ID." });
//     }

//     console.log("Transition entries found:", transitionEntries);

//     let refundResults = [];
//     for (const entry of transitionEntries) {
//       const {
//         transition_id,
//         transition_status,
//         point,
//         customer_Id,
//         transition_category,
//         account_number,
//         medium,
//         expiry_date,
//         order_id,
//         product_detail,
//         store,
//       } = entry;

//       if (transition_category === "reward_point") {
//         if (transition_status === "hold") {
//           console.log("Transition is 'hold', creating a new 'order_cancel' transition.");
//           await transition.create({
//             customer_Id,
//             transition_id: generateTransitionId("order_cancel"),
//             transition_status: "order_cancel",
//             account_number,
//             transition_category,
//             medium,
//             point,
//             expiry_date,
//             order_id,
//             product_detail,
//             store,
//           });

//           refundResults.push({
//             message: "Refund processed for 'hold' status. New transition created.",
//           });
//         } else if (transition_status === "credit") {
//           const customerData = await customer.findOne({
//             where: { customer_id: customer_Id },
//           });

//           if (!customerData) {
//             return res.status(404).json({ message: "Customer not found." });
//           }

//           const oldBalancePoints = parseInt(customerData.balance_point, 10) || 0;
//           const pointsToDeduct = parseInt(point, 10) || 0;
//           const updatedEarnedPoints =
//             (parseInt(customerData.earned_point, 10) || 0) - pointsToDeduct;
//           const updatedBalancePoints = oldBalancePoints - pointsToDeduct;

//           await customer.update(
//             {
//               balance_point: updatedBalancePoints.toString(),
//               earned_point: updatedEarnedPoints.toString(),
//             },
//             { where: { customer_id: customer_Id } }
//           );
//           await createMetafieldHelperFunction(customer_Id, {
//             rclupoint: "0",
//             lakme_point: updatedBalancePoints.toString(),
//           });

//           await transition.create({
//             customer_Id,
//             transition_id: generateTransitionId("order_cancel"),
//             transition_status: "order_cancel",
//             account_number,
//             transition_category,
//             medium,
//             point,
//             expiry_date,
//             order_id,
//             product_detail,
//             store,
//           });

//           refundResults.push({
//             message: "Refund processed for 'credit' status. New transition created.",
//             updatedBalancePoints,
//             updatedEarnedPoints,
//           });
//         }
//       } else if (transition_category === "redeem_point") {
//         if (transition_status === "redeem") {
//           // Process refund for "redeem" status
//           const customerData = await customer.findOne({
//             where: { customer_id: customer_Id },
//           });

//           if (!customerData) {
//             return res.status(404).json({ message: "Customer not found." });
//           }

//           const oldBalancePoints = parseInt(customerData.redeem_point, 10) || 0;
//           const pointsToAdd = parseInt(point, 10) || 0;
//           const updatedBalancePoints = oldBalancePoints - pointsToAdd;

//           await customer.update(
//             {
//               redeem_point: updatedBalancePoints.toString(),
//             },
//             { where: { customer_id: customer_Id } }
//           );
//           await createMetafieldHelperFunction(customer_Id, {
//             rclupoint: "0",
//             lakme_point: updatedBalancePoints.toString(),
//           });

//           await transition.create({
//             customer_Id,
//             transition_id: generateTransitionId("refund"),
//             transition_status: "refund",
//             account_number,
//             transition_category,
//             medium,
//             point,
//             expiry_date,
//             order_id,
//             product_detail,
//             store,
//           });

//           refundResults.push({
//             message: "Refund processed for 'redeem' status. New transition created.",
//             updatedBalancePoints,
//           });
//         }
//       } else {
//         refundResults.push({
//           message: "Invalid transition category for refund processing.",
//         });
//       }
//     }

//     console.log("refundResults", refundResults);

//     return res.json({
//       message: "Refund processing completed.",
//       results: refundResults,
//     });
//   } catch (error) {
//     console.error("Error processing refund:", error);
//     return res.status(500).json({
//       message: "An error occurred while processing the refund.",
//       error,
//     });
//   }
// };

export const updateCampaignPoints = async (req, res) => {
  try {
    const { customer_id, order_id } = req.body;

    if (!customer_id || !order_id) {
      return res.status(400).json({
        message: "Customer ID and Order ID are required.",
        status: 400,
      });
    }

    const currentISTTime = moment().tz("Asia/Kolkata");
    const campaigns = await campaign.findAll({
      where: {
        status: "active",
        startDate: { [Op.lte]: currentISTTime.format("YYYY-MM-DD") },
        endDate: { [Op.gte]: currentISTTime.format("YYYY-MM-DD") },
      },
    });

    if (!campaigns || campaigns.length === 0) {
      console.log("No active campaigns found.");
      return res.status(404).json({
        message: "No active campaigns found.",
        status: 404,
      });
    }

    console.log("Active Campaigns:", campaigns);

    const updatedTransitions = [];

    for (const campaign of campaigns) {
      const {
        startTime,
        endTime,
        product_detail,
        pointType,
        welcome,
        blue,
        silver,
        gold,
        platinum,
      } = campaign;

      const tierPointsMap = {
        welcome,
        blue,
        silver,
        gold,
        platinum,
      };

      const campaignStartDateTime = moment(
        `${campaign.startDate} ${startTime}`,
        "YYYY-MM-DD HH:mm"
      ).toISOString();
      const campaignEndDateTime = moment(
        `${campaign.endDate} ${endTime}`,
        "YYYY-MM-DD HH:mm"
      ).toISOString();

      // Parse the product_detail to extract all product IDs
      const productDetails = JSON.parse(product_detail);
      const productIds = Object.values(productDetails).map((p) => p.product_id);

      const transitionsToUpdate = await transition.findAll({
        where: {
          transition_status: { [Op.in]: ["credit", "hold"] },
          product_detail: { [Op.in]: productIds }, // Match with all product IDs
          customer_Id: customer_id,
          order_Id: order_id,
          createdAt: {
            [Op.between]: [campaignStartDateTime, campaignEndDateTime],
          },
        },
      });

      if (!transitionsToUpdate || transitionsToUpdate.length === 0) {
        console.log(
          `No transitions found for campaign ID ${campaign.id} within the active period.`
        );
        continue;
      }

      for (const txn of transitionsToUpdate) {
        const customerData = await customer.findOne({
          where: { customer_id: txn.customer_Id },
        });

        if (!customerData) {
          console.log(`Customer with ID ${txn.customer_Id} not found.`);
          continue;
        }

        const tierPoints =
          tierPointsMap[customerData.membership_tier.toLowerCase()];
        if (!tierPoints) {
          console.log(
            `No points configured for tier: ${customerData.membership_tier}`
          );
          continue; // Skip if no points configured for the tier
        }

        let updatedPoints = parseInt(txn.point, 10);

        if (pointType === "Points") {
          updatedPoints += tierPoints;
        } else if (pointType === "Multiplier") {
          updatedPoints *= tierPoints;
        }

        // Update the transaction points
        await transition.update(
          { point: updatedPoints },
          { where: { id: txn.id } }
        );

        updatedTransitions.push({
          transitionId: txn.id,
          oldPoints: txn.point,
          newPoints: updatedPoints,
        });
      }
    }

    if (updatedTransitions.length === 0) {
      return res.status(404).json({
        message: "No eligible campaigns or transitions found for update.",
        status: 404,
      });
    }

    return res.status(200).json({
      message: "Campaign points updated successfully.",
      updatedTransitions,
      status: 200,
    });
  } catch (error) {
    console.error("Error updating campaign points:", error);
    return res.status(500).json({
      message: "An error occurred while updating campaign points.",
      error,
    });
  }
};

const calculateBalancePoints = (earnedPoints, redeemPoints, expiryPoints) => {
  return earnedPoints - redeemPoints - expiryPoints;
};

const processRewardPointRefund = async (entry, refundResults) => {
  const {
    transition_status,
    point,
    customer_Id,
    transition_category,
    account_number,
    medium,
    expiry_date,
    order_id,
    product_detail,
    store,
    name,
    mobile_no,
    state,
    city,
    serial_no,
    coupon_code,
    scan_manual,
  } = entry;

  if (transition_status === "hold") {
    console.log(
      "Transition is 'hold', creating a new 'order_cancel' transition."
    );

    const existingTransition = await transition.findOne({
      where: { order_id, customer_Id, transition_status: "hold" },
    });

    if (existingTransition) {
      await transition.update(
        { transition_status: "Order_Canceled" },
        { where: { id: existingTransition.id } }
      );
    }

    await transition.create({
      customer_Id,
      transition_id: generateTransitionId("order_cancel"),
      transition_status: "debit",
      account_number,
      transition_category: "Order canceled",
      medium,
      point,
      expiry_date,
      order_id,
      product_detail,
      store,
      name,
      mobile_no,
      state,
      city,
      serial_no,
      coupon_code,
      scan_manual,
    });

    refundResults.push({
      message: "Refund processed for 'hold' status. New transition created.",
    });
  } else if (transition_status === "credit") {
    const customerData = await customer.findOne({
      where: { customer_id: customer_Id },
    });

    if (!customerData) {
      console.log(`Customer with ID ${customer_Id} not found.`);
      refundResults.push({
        message: `Customer with ID ${customer_Id} not found.`,
      });
      return;
    }

    const oldBalancePoints = parseInt(customerData.balance_point, 10) || 0;
    const pointsToDeduct = parseInt(point, 10) || 0;
    const updatedEarnedPoints =
      (parseInt(customerData.earned_point, 10) || 0) - pointsToDeduct;
    const updatedBalancePoints = oldBalancePoints - pointsToDeduct;

    await customer.update(
      {
        balance_point: updatedBalancePoints.toString(),
        earned_point: updatedEarnedPoints.toString(),
      },
      { where: { customer_id: customer_Id } }
    );

    await createMetafieldHelperFunction(customer_Id, {
      rclupoint: "0",
      lakme_point: updatedBalancePoints.toString(),
    });

    await transition.create({
      customer_Id,
      transition_id: generateTransitionId("order_cancel"),
      transition_status: "debit",
      account_number,
      transition_category: "Order canceled",
      medium,
      point,
      expiry_date,
      order_id,
      product_detail,
      store,
      name,
      mobile_no,
      state,
      city,
      serial_no,
      coupon_code,
      scan_manual,
    });

    const existingTransition = await transition.findOne({
      where: { order_id, customer_Id, transition_status: "credit" },
    });

    if (existingTransition) {
      await transition.update(
        { transition_status: "Order_Canceled" },
        { where: { id: existingTransition.id } }
      );
    }

    refundResults.push({
      message: "Refund processed for 'credit' status. New transition created.",
      updatedBalancePoints,
      updatedEarnedPoints,
    });
  }
};

const processRedeemPointRefund = async (entry, refundResults) => {
  const {
    point,
    customer_Id,
    account_number,
    transition_category,
    medium,
    expiry_date,
    order_id,
    product_detail,
    store,
    name,
    mobile_no,
    state,
    city,
    serial_no,
    coupon_code,
    scan_manual,
  } = entry;

  const customerData = await customer.findOne({
    where: { customer_id: customer_Id },
  });

  if (!customerData) {
    console.log(`Customer with ID ${customer_Id} not found.`);
    refundResults.push({
      message: `Customer with ID ${customer_Id} not found.`,
    });
    return;
  }

  const oldRedeemPoint = parseInt(customerData.redeem_point, 10) || 0;
  const pointsToAdd = parseInt(point, 10) || 0;
  const updatedRedeemPoints = oldRedeemPoint - pointsToAdd;

  const oldEarnedPoint = parseInt(customerData.earned_point, 10) || 0;
  const oldExpiryPoint = parseInt(customerData.expiry_point, 10) || 0;
  const updatedBalancePoints = calculateBalancePoints(
    oldEarnedPoint,
    updatedRedeemPoints,
    oldExpiryPoint
  );

  await customer.update(
    {
      redeem_point: updatedRedeemPoints.toString(),
      balance_point: updatedBalancePoints.toString(),
    },
    { where: { customer_id: customer_Id } }
  );

  await createMetafieldHelperFunction(customer_Id, {
    rclupoint: "0",
    lakme_point: updatedBalancePoints.toString(),
  });

  await transition.create({
    customer_Id,
    transition_id: generateTransitionId("refund"),
    transition_status: "refund",
    account_number,
    transition_category: "Order canceled",
    medium,
    point,
    expiry_date,
    order_id,
    product_detail,
    store,
    name,
    mobile_no,
    state,
    city,
    serial_no,
    coupon_code,
    scan_manual,
  });

  refundResults.push({
    message: "Refund processed for 'redeem' status. New transition created.",
    updatedBalancePoints,
  });
};

export const orderCancelRefund = async (req, res) => {
  try {
    const orderId = req.body.id;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required." });
    }

    console.log("Processing refund for Order ID:", orderId);
    const orderIdString = String(orderId);
    const transitionEntries = await transition.findAll({
      where: { order_id: orderIdString },
    });

    if (!transitionEntries || transitionEntries.length === 0) {
      return res
        .status(404)
        .json({ message: "No transition found for this order ID." });
    }

    console.log("Transition entries found:", transitionEntries);

    let refundResults = [];

    for (const entry of transitionEntries) {
      const { transition_category } = entry;

      if (
        transition_category === "Buy" ||
        transition_category === "Subscription" ||
        transition_category === "campaign"
      ) {
        await processRewardPointRefund(entry, refundResults);
      } else if (transition_category === "paywithrewards") {
        await processRedeemPointRefund(entry, refundResults);
      } else {
        refundResults.push({
          message: "Invalid transition category for refund processing.",
        });
      }
    }

    console.log("Refund Results:", refundResults);

    return res.json({
      message: "Refund processing completed.",
      results: refundResults,
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    return res.status(500).json({
      message: "An error occurred while processing the refund.",
      error,
    });
  }
};

export const subscribedProducts = async (req, res) => {
  try {
    const { store } = req.query;
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
    const response = await axios({
      url: `https://${shopname}/admin/api/2021-01/products.json?status=active`,
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": access_token,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const productsData = response.data.products;
    const subscriptionProducts = productsData.filter((product) =>
      product.tags.includes("subscription")
    );

    return res
      .status(statusMaker.found)
      .json({ status: statusMaker.found, data: subscriptionProducts });
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const orderNoteUpdate = async (req, res) => {
  const { order_id, new_note } = req.body;

  if (!order_id || !new_note) {
    return res
      .status(400)
      .json({ message: "Order ID and new note are required." });
  }

  try {
    // Find transitions related to the given order ID
    const findTransitionforId = await transition.findAll({
      where: { order_id: order_id },
    });

    console.log("findTransitionforId", findTransitionforId);

    // Map through transitions to build the total_point array
    const total_point = findTransitionforId.map((transition) => {
      return {
        product_id: transition.dataValues.product_detail,
        transition_category: transition.dataValues.transition_category,
        transition_status: transition.dataValues.transition_status,
        point: transition.dataValues.point,
      };
    });

    console.log("total_point", total_point);

    // Convert total_point to a string
    const totalPointString = JSON.stringify(total_point);

    // Fetch the existing order details
    const getOrderConfig = {
      method: "get",
      maxBodyLength: Infinity,
      url: `https://lakmestaging.myshopify.com/admin/api/2024-10/orders/${order_id}.json`,
      headers: {
        "X-Shopify-Access-Token": shopify_token,
      },
    };

    const getOrderResponse = await axios.request(getOrderConfig);
    const existingOrder = getOrderResponse.data.order;

    if (!existingOrder) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Replace new_note with total_point string
    const updatedNote = totalPointString;

    // Update the order with the new note
    const updateOrderConfig = {
      method: "put",
      maxBodyLength: Infinity,
      url: `https://lakmestaging.myshopify.com/admin/api/2024-10/orders/${order_id}.json`,
      headers: {
        "X-Shopify-Access-Token": shopify_token,
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        order: {
          id: order_id,
          note: updatedNote,
        },
      }),
    };

    await axios.request(updateOrderConfig);

    res.status(200).json({
      message: "Order note updated successfully.",
      order_id,
      updated_note: updatedNote,
    });
  } catch (error) {
    console.error("Error updating order note:", error.message);
    res.status(500).json({
      message: "Failed to update the order note.",
      error: error.message,
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

    const sanitizedSearchValue = search_value.replace(/\D/g, "");
    const customers = await customer.findAll({
      where: {
        store: store,
        [Op.or]: [
          { account_number: search_value },
          Sequelize.where(
            Sequelize.fn(
              "REPLACE",
              Sequelize.fn(
                "REPLACE",
                Sequelize.fn(
                  "REPLACE",
                  Sequelize.fn(
                    "REPLACE",
                    Sequelize.col("phone_number"),
                    "+",
                    ""
                  ),
                  " ",
                  ""
                ),
                "-",
                ""
              ),
              "",
              ""
            ),
            { [Op.like]: `%${sanitizedSearchValue}%` }
          ),

          {
            first_name: Sequelize.where(
              Sequelize.fn("LOWER", Sequelize.col("first_name")),
              "LIKE",
              `%${search_value.toLowerCase()}%`
            ),
          },

          {
            last_name: Sequelize.where(
              Sequelize.fn("LOWER", Sequelize.col("last_name")),
              "LIKE",
              `%${search_value.toLowerCase()}%`
            ),
          },
        ],
      },
    });

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
};

// export const searchApiTransition = async (req, res) => {
//   try {
//     const { search_value, store } = req.query;

//     if (!search_value || !store) {
//       return res.status(400).json({
//         message:
//           "Please provide both a search value and a store name to find transitions.",
//         status: 400,
//       });
//     }

//     // Remove spaces and ensure search_value is case-insensitive
//     const sanitizedSearchValue = search_value.replace(/\s+/g, "");

//     // Find transitions with partial and case-insensitive matching
//     const transitionData = await transition.findAll({
//       where: {
//         store: store,
//         [Op.or]: [
//           Sequelize.where(
//             Sequelize.fn("LOWER", Sequelize.col("transition_id")),
//             "LIKE",
//             `%${sanitizedSearchValue.toLowerCase()}%`
//           ),
//           Sequelize.where(
//             Sequelize.fn("LOWER", Sequelize.col("account_number")),
//             "LIKE",
//             `%${sanitizedSearchValue.toLowerCase()}%`
//           ),
//           Sequelize.where(
//             Sequelize.fn("LOWER", Sequelize.col("name")),
//             "LIKE",
//             `%${search_value.toLowerCase()}%`
//           ),
//         ],
//       },
//     });

//     if (!transitionData || transitionData.length === 0) {
//       return res.status(404).json({
//         message:
//           "No transitions found matching the provided search value in the specified store.",
//         status: 404,
//       });
//     }

//     return res.status(200).json({
//       message: "Transitions retrieved successfully.",
//       data: transitionData,
//       status: 200,
//     });
//   } catch (error) {
//     console.error("Error retrieving transitions:", error);
//     return res.status(500).json({
//       message: "An error occurred while searching for transitions.",
//     });
//   }
// };

export const searchApiTransition = async (req, res) => {
  try {
    const { search_value, store } = req.query;

    if (!search_value || !store) {
      return res.status(400).json({
        message:
          "Please provide both a search value and a store name to find transitions.",
        status: 400,
      });
    }

    // Remove spaces and ensure search_value is case-insensitive
    const sanitizedSearchValue = search_value.replace(/\s+/g, "");

    // Find transitions with partial and case-insensitive matching
    const transitionData = await transition.findAll({
      where: {
        store: store,
        [Op.or]: [
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("transition_id")),
            "LIKE",
            `%${sanitizedSearchValue.toLowerCase()}%`
          ),
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("account_number")),
            "LIKE",
            `%${sanitizedSearchValue.toLowerCase()}%`
          ),
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("name")),
            "LIKE",
            `%${sanitizedSearchValue.toLowerCase()}%`
          ),
          Sequelize.where(
            Sequelize.fn(
              "LOWER",
              Sequelize.fn("REPLACE", Sequelize.col("mobile_no"), "+", "")
            ),
            "LIKE",
            `%${sanitizedSearchValue.toLowerCase()}%`
          ),
        ],
      },
    });

    if (!transitionData || transitionData.length === 0) {
      return res.status(404).json({
        message:
          "No transitions found matching the provided search value in the specified store.",
        status: 404,
      });
    }

    return res.status(200).json({
      message: "Transitions retrieved successfully.",
      data: transitionData,
      status: 200,
    });
  } catch (error) {
    console.error("Error retrieving transitions:", error);
    return res.status(500).json({
      message: "An error occurred while searching for transitions.",
    });
  }
};

// export const searchApiTransition = async (req, res) => {
//   try {
//     const { search_value, store } = req.query;

//     if (!search_value || !store) {
//       return res.status(400).json({
//         message:
//           "Please provide both a search value and a store name to find customers.",
//         status: 400,
//       });
//     }

//     const transitionData = await transition.findAll({
//       where: {
//         store: store,
//         [Op.or]: [
//           // { customer_Id: search_value },
//           { transition_id: search_value },
//           { name: search_value },
//           { account_number: search_value },
//         ],
//       },
//     });

//     // Handle no results
//     if (transitionData.length === 0) {
//       return res.status(404).json({
//         message:
//           "No customers found matching the provided search value in the specified store.",
//         status: 404,
//       });
//     }
//     return res.json({
//       message: "transition retrieved successfully.",
//       data: transitionData,
//       status: 200,
//     });
//   } catch (error) {
//     console.error("Error retrieving transitionData:", error);
//     return res.status(500).json({
//       message: "An error occurred while searching for transition.",
//     });
//   }
// };

export const createTransaction = async (req, res) => {
  try {
    const {
      customer_Id,
      transition_id,
      account_number,
      transition_category,
      transition_status,
      medium,
      point,
      point_used,
      point_remaing_used,
      expiry_date,
      order_id,
      product_detail,
      credit_days,
      note,
      name,
      mobile_no,
      state,
      city,
      serial_no,
      coupon_code,
      scan_manual,
    } = req.body;

    // Convert `point` to integer
    const pointValue = parseInt(point || "0", 10); // Safely handle string-to-integer conversion

    // Create the new transition
    const createTransition = await transition.create({
      customer_Id,
      transition_id,
      account_number,
      transition_category,
      transition_status,
      medium,
      point: pointValue.toString(), // Ensure point is stored as a string
      point_used,
      point_remaing_used,
      expiry_date,
      order_id,
      product_detail,
      credit_days,
      note,
      name,
      mobile_no,
      state,
      city,
      serial_no,
      coupon_code,
      scan_manual,
    });

    if (createTransition) {
      // Only update customer data if the transition_status is "credit"
      if (transition_status === "credit") {
        // Fetch the customer's current point details
        const customerData = await customer.findOne({ where: { customer_Id } });

        if (!customerData) {
          return res.status(404).json({ message: "Customer not found." });
        }

        // Convert string fields to integers for calculations
        const oldEarnedPoint = parseInt(customerData.earned_point || "0", 10);
        const oldRedeemPoint = parseInt(customerData.redeem_point || "0", 10);
        const oldExpiryPoint = parseInt(customerData.expiry_point || "0", 10);

        // Update point calculations
        const updatedEarnedPoint = oldEarnedPoint + pointValue;
        const updatedRedeemPoint = oldRedeemPoint; // No redemption in this transaction
        const updatedExpiryPoint = oldExpiryPoint; // No expiry in this transaction
        const updatedBalancePoint =
          updatedEarnedPoint - updatedRedeemPoint - updatedExpiryPoint;

        // Update the customer data
        await customer.update(
          {
            earned_point: updatedEarnedPoint.toString(), // Store back as string
            balance_point: updatedBalancePoint.toString(),
          },
          { where: { customer_Id } }
        );
      }

      return res.status(201).json({
        message: "Transaction created successfully",
        data: createTransition,
      });
    }

    return res.status(400).json({ message: "Transaction not created." });
  } catch (error) {
    console.error("Error in createTransaction:", error);
    return res
      .status(500)
      .json({ message: "Something went wrong!", error: error.message });
  }
};

export const redeemCustomerPoints = async (req, res) => {
  try {
    const { customerId, redeemPoints } = req.body;

    if (!customerId || !redeemPoints || redeemPoints <= 0) {
      return res
        .status(400)
        .json({ message: "Invalid customer ID or redeem points." });
    }

    const customerData = await customer.findOne({
      where: { customer_Id: customerId },
    });

    if (!customerData) {
      return res.status(404).json({ message: "Customer not found." });
    }

    const currentRedeemablePoints = parseInt(
      customerData.balance_point || "0",
      10
    );

    if (currentRedeemablePoints < redeemPoints) {
      return res
        .status(400)
        .json({ message: "Insufficient redeemable points." });
    }

    // Fetch eligible transitions for the customer
    const transitions = await transition.findAll({
      where: {
        customer_Id: customerId,
        transition_status: "credit",
        point: { [Op.gt]: 0 },
      },
      order: [["createdAt", "ASC"]],
    });

    if (!transitions || transitions.length === 0) {
      return res.status(404).json({
        message: "No points available for redemption.",
        remainingPoints: redeemPoints,
      });
    }

    let pointsToRedeem = redeemPoints;
    const updatedTransitions = [];

    // Helper function to update a transition
    const updateTransition = async (entry, pointUsed, remainingPoints) => {
      await entry.update({
        point_used: remainingPoints > 0 ? "partial_used" : "full_used",
        point_remaing_used: remainingPoints.toString(),
      });

      updatedTransitions.push({
        id: entry.id,
        point_used: remainingPoints > 0 ? "partial_used" : "full_used",
        point_remaing_used: remainingPoints.toString(),
      });
    };

    // Process transitions
    for (const entry of transitions) {
      if (entry.point_used === "full_used") continue; // Skip fully used transitions

      const availablePoints =
        entry.point_used === "partial_used"
          ? parseInt(entry.point_remaing_used, 10) || 0
          : parseInt(entry.point, 10) || 0;

      if (pointsToRedeem <= 0) break;

      if (pointsToRedeem >= availablePoints) {
        pointsToRedeem -= availablePoints;
        await updateTransition(entry, availablePoints, 0);
      } else {
        const remainingPoints = availablePoints - pointsToRedeem;
        pointsToRedeem = 0;
        await updateTransition(entry, availablePoints, remainingPoints);
      }
    }

    // Update customer data
    const updatedRedeemPoint =
      parseInt(customerData.redeem_point || "0", 10) + redeemPoints;
    const updatedBalancePoint = currentRedeemablePoints - redeemPoints;

    // await customer.update(
    //   {
    //     balance_point: updatedBalancePoint.toString(),
    //     redeem_point: updatedRedeemPoint.toString(),
    //   },
    //   { where: { customer_Id: customerId } }
    // );

    return res.status(200).json({
      message:
        pointsToRedeem > 0
          ? "Not enough points to fully redeem."
          : "Points redeemed successfully.",
      redeemedPoints: redeemPoints - pointsToRedeem,
      remainingPointsToRedeem: pointsToRedeem,
      updatedTransitions,
    });
  } catch (error) {
    console.error("Error redeeming points:", error);
    return res.status(500).json({
      message: "An error occurred while redeeming points.",
      error: error.message,
    });
  }
};

export const redeemCustomerPointsFun = async (customerId, redeemPoints) => {
  try {
    if (!customerId || !redeemPoints || redeemPoints <= 0) {
      return { message: "Invalid customer ID or redeem points." };
    }

    const customerData = await customer.findOne({
      where: { customer_Id: customerId },
    });

    if (!customerData) {
      return { message: "Customer not found." };
    }

    const currentRedeemablePoints = parseInt(
      customerData.balance_point || "0",
      10
    );

    if (currentRedeemablePoints < redeemPoints) {
      return { message: "Insufficient redeemable points." };
    }

    // Fetch eligible transitions for the customer
    const transitions = await transition.findAll({
      where: {
        customer_Id: customerId,
        transition_status: "credit",
        point: { [Op.gt]: 0 },
      },
      order: [["createdAt", "ASC"]],
    });

    if (!transitions || transitions.length === 0) {
      return {
        message: "No points available for redemption.",
        remainingPoints: redeemPoints,
      };
    }

    let pointsToRedeem = redeemPoints;
    const updatedTransitions = [];

    // Helper function to update a transition
    const updateTransition = async (entry, pointUsed, remainingPoints) => {
      await entry.update({
        point_used: remainingPoints > 0 ? "partial_used" : "full_used",
        point_remaing_used: remainingPoints.toString(),
      });

      updatedTransitions.push({
        id: entry.id,
        point_used: remainingPoints > 0 ? "partial_used" : "full_used",
        point_remaing_used: remainingPoints.toString(),
      });
    };
    // Process transitions
    for (const entry of transitions) {
      if (entry.point_used === "full_used") continue; // Skip fully used transitions

      const availablePoints =
        entry.point_used === "partial_used"
          ? parseInt(entry.point_remaing_used, 10) || 0
          : parseInt(entry.point, 10) || 0;

      if (pointsToRedeem <= 0) break;

      if (pointsToRedeem >= availablePoints) {
        pointsToRedeem -= availablePoints;
        await updateTransition(entry, availablePoints, 0);
      } else {
        const remainingPoints = availablePoints - pointsToRedeem;
        pointsToRedeem = 0;
        await updateTransition(entry, availablePoints, remainingPoints);
      }
    }

    // Update customer data
    const updatedRedeemPoint =
      parseInt(customerData.redeem_point || "0", 10) + redeemPoints;
    const updatedBalancePoint = currentRedeemablePoints - redeemPoints;

    // await customer.update(
    //   {
    //     balance_point: updatedBalancePoint.toString(),
    //     redeem_point: updatedRedeemPoint.toString(),
    //   },
    //   { where: { customer_Id: customerId } }
    // );

    return {
      message:
        pointsToRedeem > 0
          ? "Not enough points to fully redeem."
          : "Points redeemed successfully.",
      redeemedPoints: redeemPoints - pointsToRedeem,
      remainingPointsToRedeem: pointsToRedeem,
      updatedTransitions,
    };
  } catch (error) {
    console.error("Error redeeming points:", error);
    return {
      message: "An error occurred while redeeming points.",
      error: error.message,
    };
  }
};

// export const updateExpiryPoints = async (req, res) => {
//   try {
//     const { customerId, date } = req.body;
//     console.log("customerId", customerId, date);

//     // Validate inputs
//     if (!customerId || !date) {
//       return res.status(400).json({ message: "Invalid customer ID or date." });
//     }

//     // Fetch transitions for the customer with expiry_date
//     const transitions = await transition.findAll({
//       where: {
//         customer_Id: customerId, // Fetch transitions for this specific customer
//         expiry_date: date, // Matching expiry date
//         point_used: "partial_used", // Only consider transitions that are partially used
//         transition_status: "credit",
//       },
//     });
//     console.log("transitions", transitions);

//     if (!transitions || transitions.length === 0) {
//       return res.status(404).json({
//         message: "No partial used points found for the given date.",
//       });
//     }

//     let totalExpiryPoints = 0;
//     for (const entry of transitions) {
//       if (entry.expiry_status === "True") {
//         console.log(
//           `Skipping transition ${entry.id} as it's already marked as expired.`
//         );
//         continue;
//       }

//       const pointRemainingUsed = parseInt(entry.point_remaing_used, 10) || 0;

//       if (pointRemainingUsed > 0) {
//         await entry.update({
//           expiry_status: "True",
//           expiry_point: pointRemainingUsed.toString(),
//         });

//         totalExpiryPoints += pointRemainingUsed;
//       }
//     }

//     // Fetch current customer data
//     const customerData = await customer.findOne({
//       where: { customer_Id: customerId },
//     });
//     if (!customerData) {
//       return res.status(404).json({ message: "Customer not found." });
//     }

//     const oldEarnedPoint = parseInt(customerData.earned_point || "0", 10);
//     const oldRedeemPoint = parseInt(customerData.redeem_point || "0", 10);
//     const oldExpiryPoint = parseInt(customerData.expiry_point || "0", 10);
//     const updatedEarnedPoint = oldEarnedPoint; // No change in earned points for this transaction
//     const updatedRedeemPoint = oldRedeemPoint; // No change in redeemed points
//     const updatedExpiryPoint = oldExpiryPoint + totalExpiryPoints; // Add the total expiry points
//     const updatedBalancePoint =
//       updatedEarnedPoint - updatedRedeemPoint - updatedExpiryPoint;

//     // Update the customer data with the new values
//     await customer.update(
//       {
//         // Store as string
//         balance_point: updatedBalancePoint.toString(),
//         expiry_point: updatedExpiryPoint.toString(), // Updated expiry points
//       },
//       { where: { customer_Id: customerId } }
//     );

//     return res.status(200).json({
//       message: "Expiry points updated successfully.",
//       totalExpiryPoints,
//     });
//   } catch (error) {
//     console.error("Error updating expiry points:", error);
//     return res.status(500).json({
//       message: "An error occurred while updating expiry points.",
//       error: error.message,
//     });
//   }
// };

// expiry cron function

// export const updateExpiryPoints = async (req, res) => {
//   try {
//     const expiredPoints = await sequelize.query(
//       `SELECT id, created_at, expiry_date, point, point_used, point_remaing_used, expiry_status, account_number FROM expiry_points_view`,
//       { type: QueryTypes.SELECT }
//     );

//     if (expiredPoints.length === 0) {
//       return res.status(200).json({ message: "No expired points for today." });
//     }
//     for (const point of expiredPoints) {
//       const {
//         point_used,
//         point_remaing_used,
//         point: totalPoint,
//         account_number,
//         transition_status,
//       } = point;

//       // Skip processing if the transition_status is not "credit"
//       if (transition_status !== "credit") {
//         continue;
//       }

//       // Skip processing if the points are fully used
//       if (point_used === "full_used") {
//         continue;
//       }
//       const customerData = await customer.findOne({
//         where: { account_number: account_number },
//       });

//       if (!customerData) {
//         return res.status(404).json({
//           message: `Customer with account number ${account_number} not found.`,
//         });
//       }
//       let totalExpiryPoints;
//       if (point_used === "partial_used") {
//         totalExpiryPoints = parseInt(point_remaing_used || "0", 10);
//       } else if (point_used === null) {
//         totalExpiryPoints = parseInt(totalPoint || "0", 10);
//       }
//       const oldEarnedPoint = parseInt(customerData.earned_point || "0", 10);
//       const oldRedeemPoint = parseInt(customerData.redeem_point || "0", 10);
//       const oldExpiryPoint = parseInt(customerData.expiry_point || "0", 10);
//       const updatedExpiryPoint = oldExpiryPoint + totalExpiryPoints;
//       const updatedBalancePoint =
//         oldEarnedPoint - oldRedeemPoint - updatedExpiryPoint;
//       await customer.update(
//         {
//           balance_point: updatedBalancePoint.toString(),
//           expiry_point: updatedExpiryPoint.toString(),
//         },
//         { where: { account_number: account_number } }
//       );
//     }
//     res.status(200).json({
//       message: "Expired points processed successfully.",
//       data: expiredPoints,
//     });
//   } catch (error) {
//     console.error("Error processing expired points:", error);
//     res.status(500).json({ error: "Internal server error." });
//   }
// };

// end expiry cron function

// Birthday cron function

export const birthdayGiftPoint = async (req, res) => {
  try {
    // Step 1: Query the `birthday_view` to get today's birthday customers
    const birthdayCustomers = await sequelize.query(
      `SELECT id, date_of_birth, account_number, customer_id,membership_tier FROM birthday_view`,
      { type: QueryTypes.SELECT }
    );

    console.log("birthdayCustomers", birthdayCustomers);

    if (birthdayCustomers.length === 0) {
      return res.status(200).json({ message: "No birthdays today." });
    }

    // Step 2: Fetch the tier management data
    const tierData = await tier_mangement.findOne({ where: { id: 1 } });
    // console.log("tierData",tierData)

    const profileUpdateData = JSON.parse(tierData.dataValues.benefits);
    console.log("profileUpdateData", profileUpdateData);

    // Step 3: Iterate over the customers to process birthday benefits
    const today = new Date(); // Current date
    const updatedCustomers = [];

    for (const customerData of birthdayCustomers) {
      const { customer_id, account_number, membership_tier } = customerData;

      console.log("customer_id", customer_id);
      console.log("account_number", account_number);
      console.log("membership_tier", membership_tier);

      // Determine membership tier and benefit details
      const memberStatus = membership_tier?.toLowerCase();
      const benefitData = profileUpdateData[memberStatus];

      console.log("benefitData", benefitData);

      if (benefitData && benefitData.benefit && benefitData.expiry_date) {
        const benefitPoints = parseInt(benefitData.benefit, 10);
        const expiryDate = new Date(benefitData.expiry_date);

        if (benefitPoints > 0 && expiryDate > today) {
          // Fetch customer data
          const customerFetch = await customer.findOne({
            where: { customer_id },
          });
          if (!customerFetch) {
            return res
              .status(404)
              .json({ message: `Customer with ID ${customer_id} not found.` });
          }

          // Calculate updated points
          const oldEarnedPoint = parseInt(
            customerFetch.earned_point || "0",
            10
          );
          const oldRedeemPoint = parseInt(
            customerFetch.redeem_point || "0",
            10
          );
          const oldExpiryPoint = parseInt(
            customerFetch.expiry_point || "0",
            10
          );

          const updatedEarnedPoint = oldEarnedPoint + benefitPoints;
          const updatedRedeemPoint = oldRedeemPoint;
          const updatedExpiryPoint = oldExpiryPoint;
          const updatedBalancePoint =
            updatedEarnedPoint - updatedRedeemPoint - updatedExpiryPoint;

          // Update the customer points
          await customer.update(
            {
              balance_point: updatedBalancePoint.toString(),
              earned_point: updatedEarnedPoint.toString(),
              redeem_point: updatedRedeemPoint.toString(),
              expiry_point: updatedExpiryPoint.toString(),
            },
            { where: { customer_id } }
          );

          // Generate a transition ID and create transition and point entries
          const transitionId = generateTransitionId("birthday_benefits");
          const [newTransition, newPoint] = await Promise.all([
            transition.create({
              customer_Id: customer_id,
              transition_id: transitionId,
              account_number,
              transition_category: "benefits",
              transition_status: "credit",
              medium: "desktop",
              point: benefitPoints,
              expiry_date: benefitData.expiry_date,
              order_id: "",
              product_detail: "",
              store: "lakme",
              state: customerFetch.State,
              city: customerFetch.city,
              serial_no: null,
              coupon_code: null,
              scan_manual: null,
            }),
            point.create({
              customer_Id: customer_id,
              transition_id: transitionId,
              account_number,
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
        }
      }
    }

    // Step 4: Return the updated customers and success message
    res.status(200).json({
      message: "Birthday points processed successfully.",
      data: updatedCustomers,
    });
  } catch (error) {
    console.error("Error processing birthday points:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// end birthday cron function
// const redeemCustomerPoints = async (customerId, redeemPoints) => {
//   try {
//     if (!customerId || !redeemPoints || redeemPoints <= 0) {
//       throw new Error("Invalid customer ID or redeem points.");
//     }

//     const transitions = await transition.findAll({
//       where: {
//         customer_Id: customerId,
//         transition_status: "credit",
//         point: { [Op.gt]: 0 },
//       },
//       order: [["createdAt", "ASC"]],
//     });

//     if (!transitions || transitions.length === 0) {
//       return {
//         success: false,
//         message: "No points available for redemption.",
//         remainingPoints: redeemPoints,
//       };
//     }

//     let pointsToRedeem = redeemPoints;
//     let updatedTransitions = [];

//     for (const entry of transitions) {
//       const availablePoints = parseInt(entry.point, 10) || 0;

//       if (pointsToRedeem <= 0) break;

//       if (pointsToRedeem >= availablePoints) {
//         // Fully use points from this transition
//         await entry.update({
//           point_used: "full_used",
//           point_remaing_used: "0",
//         });

//         pointsToRedeem -= availablePoints;
//         updatedTransitions.push({
//           id: entry.id,
//           point_used: "full_used",
//           point_remaing_used: "0",
//         });
//       } else {
//         // Partially use points from this transition
//         const remainingPoints = availablePoints - pointsToRedeem;
//         await entry.update({
//           point_used: "partial_used",
//           point_remaing_used: remainingPoints.toString(),
//         });

//         updatedTransitions.push({
//           id: entry.id,
//           point_used: "partial_used",
//           point_remaing_used: remainingPoints.toString(),
//         });

//         pointsToRedeem = 0;
//       }
//     }

//     const customerData = await customer.findOne({ where: { customer_Id: customerId } });
//     if (!customerData) {
//       throw new Error("Customer not found.");
//     }

//     const oldEarnedPoint = parseInt(customerData.earned_point || "0", 10);
//     const oldRedeemPoint = parseInt(customerData.redeem_point || "0", 10);
//     const oldExpiryPoint = parseInt(customerData.expiry_point || "0", 10);

//     const updatedEarnedPoint = oldEarnedPoint;
//     const updatedRedeemPoint = oldRedeemPoint + (redeemPoints - pointsToRedeem);
//     const updatedExpiryPoint = oldExpiryPoint;
//     const updatedBalancePoint = updatedEarnedPoint - updatedRedeemPoint - updatedExpiryPoint;

//     await customer.update(
//       {
//         earned_point: updatedEarnedPoint.toString(),
//         balance_point: updatedBalancePoint.toString(),
//         redeem_point: updatedRedeemPoint.toString(),
//       },
//       { where: { customer_Id: customerId } }
//     );

//     return {
//       success: true,
//       message: pointsToRedeem > 0 ? "Not enough points to fully redeem." : "Points redeemed successfully.",
//       redeemedPoints: redeemPoints - pointsToRedeem,
//       remainingPointsToRedeem: pointsToRedeem,
//       updatedTransitions,
//     };
//   } catch (error) {
//     console.error("Error redeeming points:", error);
//     return {
//       success: false,
//       message: "An error occurred while redeeming points.",
//       error: error.message,
//     };
//   }
// };

//? customer tier update

//

const determineNewTier = (earnedPoints, startManagement, tierBenefits) => {
  let newTier = "";
  let newTierPoints = 0;
  let newExpiryDate = null;

  for (const [tier, range] of Object.entries(startManagement)) {
    const startPoint = parseInt(range.start_point, 10);
    const endPoint = range.end_point ? parseInt(range.end_point, 10) : Infinity;

    if (earnedPoints >= startPoint && earnedPoints <= endPoint) {
      newTier = tier;
      newTierPoints = parseInt(tierBenefits[tier]?.point || "0", 10); // Ensure points are numeric
      newExpiryDate = tierBenefits[tier]?.expiry_date || null; // Get expiry date
      break;
    }
  }

  return { newTier, newTierPoints, newExpiryDate };
};

const calculateBalancePointsManagement = (earnedPoints, customer) => {
  const redeemPoints = parseInt(customer.redeem_point || "0", 10);
  const expiryPoints = parseInt(customer.expiry_point || "0", 10);
  return earnedPoints - redeemPoints - expiryPoints;
};

// export const update_tier_management = async (req, res) => {
//   try {
//     const { customerId } = req.body;
//     if (!customerId) {
//       return res.status(400).json({ error: "Customer ID is required." });
//     }
//     const customerData = await customer.findOne({
//       where: { customer_id: customerId },
//     });
//     if (!customerData) {
//       return res.status(404).json({ error: "Customer not found." });
//     }

//     const { earned_point, membership_tier } = customerData;
//     const tierData = await tier_mangement.findOne({ where: { id: 1 } });
//     if (!tierData) {
//       return res.status(404).json({ error: "Tier management data not found." });
//     }

//     const { start_mangement, tier_benefits } = tierData;
//     const earnedPoints = parseInt(earned_point, 10);
//     const { newTier, newTierPoints } = determineNewTier(
//       earnedPoints,
//       start_mangement,
//       tier_benefits
//     );
//     if (membership_tier === newTier) {
//       return res.status(200).json({ message: "No tier update required." });
//     }

//     const updatedEarnedPoints = earnedPoints + newTierPoints;
//     const updatedBalancePoints = calculateBalancePointsManagement(
//       updatedEarnedPoints,
//       customerData
//     );
//     await customer.update(
//       {
//         earned_point: updatedEarnedPoints.toString(),
//         balance_point: updatedBalancePoints.toString(),
//         membership_tier: newTier,
//       },
//       { where: { customer_id: customerId } }
//     );

//     console.log("newTierPoints", newTierPoints);

//     const expiryDate = "18 months";
//     const calculateExpiryDate = (expiryDate) => {
//       const [value, unit] = expiryDate.split(" ");
//       const duration = parseInt(value, 10);

//       if (isNaN(duration) || (unit !== "days" && unit !== "months")) {
//         throw new Error(
//           "Invalid expiry date format. Use 'X days' or 'X months'."
//         );
//       }

//       // Return the date formatted as DD-MM-YYYY
//       return moment().add(duration, unit).format("DD-MM-YYYY");
//     };

//     console.log(calculateExpiryDate(expiryDate));

//     // Calculate the new expiry date
//     const newExpiryDate = calculateExpiryDate(expiryDate);

//     if (newTierPoints > 0) {
//       const transitionId = generateTransitionId("tier_update");
//       await transition.create({
//         customer_Id: customerId,
//         transition_id: transitionId,
//         account_number: customerData.account_number,
//         transition_category: "tier_update",
//         transition_status: "credit",
//         medium: "desktop",
//         point: newTierPoints,
//         expiry_date: newExpiryDate,
//         order_id: "",
//         product_detail: "",
//         note: "tier_update",
//         domain: "lakme.com",
//       });
//     }

//     // Update metafield
//     await createMetafieldHelperFunction(customerId, {
//       rclupoint: "0",
//       lakme_point: updatedBalancePoints.toString(),
//     });

//     // Respond with success (convert all numerical values to strings)
//     res.status(200).json({
//       message: "Customer tier updated successfully.",
//       newTier,
//       updatedEarnedPoints: updatedEarnedPoints.toString(),
//       updatedBalancePoints: updatedBalancePoints.toString(),
//     });
//   } catch (error) {
//     console.error("Error updating customer tier:", error);
//     res.status(500).json({ error: "Internal server error." });
//   }
// };

export const update_tier_management = async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId) {
      return res.status(400).json({ error: "Customer ID is required." });
    }

    const customerData = await customer.findOne({
      where: { customer_id: customerId },
    });
    if (!customerData) {
      return res.status(404).json({ error: "Customer not found." });
    }

    const { earned_point, membership_tier } = customerData;
    const tierData = await tier_mangement.findOne({ where: { id: 1 } });
    if (!tierData) {
      return res.status(404).json({ error: "Tier management data not found." });
    }

    const { start_mangement, tier_benefits } = tierData;

    if (tier_benefits.status !== "active") {
      return res.status(200).json({ message: "Tier benefits are not active." });
    }

    const earnedPoints = parseInt(earned_point, 10);
    const { newTier, newTierPoints, newExpiryDate } = determineNewTier(
      earnedPoints,
      start_mangement,
      tier_benefits
    );

    if (membership_tier === newTier) {
      return res.status(200).json({ message: "No tier update required." });
    }

    const updatedEarnedPoints = earnedPoints + newTierPoints;
    const updatedBalancePoints = calculateBalancePointsManagement(
      updatedEarnedPoints,
      customerData
    );

    await customer.update(
      {
        earned_point: updatedEarnedPoints.toString(),
        balance_point: updatedBalancePoints.toString(),
        membership_tier: newTier,
      },
      { where: { customer_id: customerId } }
    );

    if (newTierPoints > 0) {
      const transitionId = generateTransitionId("tier_update");
      await transition.create({
        customer_Id: customerId,
        transition_id: transitionId,
        account_number: customerData.account_number,
        transition_category: "tier_update",
        transition_status: "credit",
        medium: "desktop",
        point: newTierPoints,
        expiry_date: newExpiryDate,
        order_id: "",
        product_detail: "",
        note: "tier_update",
        domain: "lakme.com",
        name: customerData.first_name,
        mobile_no: customerData.phone_number,
        state: customerData.State,
        city: customerData.city,
        serial_no: "",
        coupon_code: "",
        scan_manual: "",
      });
    }

    // Update metafield
    await createMetafieldHelperFunction(customerId, {
      rclupoint: "0",
      lakme_point: updatedBalancePoints.toString(),
    });

    res.status(200).json({
      message: "Customer tier updated successfully.",
      newTier,
      updatedEarnedPoints: updatedEarnedPoints.toString(),
      updatedBalancePoints: updatedBalancePoints.toString(),
    });
  } catch (error) {
    console.error("Error updating customer tier:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const updateTierManagement = async (customerId) => {
  try {
    const customerIdString = String(customerId);
    if (!customerIdString) {
      throw new Error("Customer ID is required.");
    }

    const customerData = await customer.findOne({
      where: { customer_id: customerIdString },
    });
    if (!customerData) {
      throw new Error("Customer not found.");
    }

    const { earned_point, membership_tier } = customerData;
    const tierData = await tier_mangement.findOne({ where: { id: 1 } });
    if (!tierData) {
      throw new Error("Tier management data not found.");
    }

    const { start_mangement, tier_benefits } = tierData;

    if (tier_benefits.status !== "active") {
      return { message: "Tier benefits are not active." };
    }

    const earnedPoints = parseInt(earned_point, 10);
    const { newTier, newTierPoints, newExpiryDate } = determineNewTier(
      earnedPoints,
      start_mangement,
      tier_benefits
    );

    if (membership_tier === newTier) {
      return { message: "No tier update required." };
    }

    const updatedEarnedPoints = earnedPoints + newTierPoints;
    const updatedBalancePoints = calculateBalancePointsManagement(
      updatedEarnedPoints,
      customerData
    );

    await customer.update(
      {
        earned_point: updatedEarnedPoints.toString(),
        balance_point: updatedBalancePoints.toString(),
        membership_tier: newTier,
      },
      { where: { customer_id: customerId } }
    );

    if (newTierPoints > 0) {
      const transitionId = generateTransitionId("tier_update");
      await transition.create({
        customer_Id: customerId,
        transition_id: transitionId,
        account_number: customerData.account_number,
        transition_category: "tier_update",
        transition_status: "credit",
        medium: "desktop",
        point: newTierPoints,
        expiry_date: newExpiryDate,
        order_id: "",
        product_detail: "",
        note: "tier_update",
        domain: "lakme.com",
        name: customerData.first_name,
        mobile_no: customerData.phone_number,
        state: customerData.State,
        city: customerData.city,
        serial_no: "",
        coupon_code: "",
        scan_manual: "",
      });
    }

    // Update metafield
    await createMetafieldHelperFunction(customerId, {
      rclupoint: "0",
      lakme_point: updatedBalancePoints.toString(),
    });

    return {
      message: "Customer tier updated successfully.",
      newTier,
      updatedEarnedPoints: updatedEarnedPoints.toString(),
      updatedBalancePoints: updatedBalancePoints.toString(),
    };
  } catch (error) {
    console.error("Error updating customer tier:", error);
    throw new Error("Internal server error.");
  }
};

// export const updateTierManagement = async (customerId) => {
//   try {
//     const customerIdString = String(customerId);

//     if (!customerIdString) {
//       throw new Error("Customer ID is required.");
//     }
//     const customerData = await customer.findOne({
//       where: { customer_id: customerIdString },

//     });
//     if (!customerData) {
//       throw new Error("Customer not found.");
//     }

//     const { earned_point, membership_tier } = customerData;
//     const tierData = await tier_mangement.findOne({ where: { id: 1 } });
//     if (!tierData) {
//       throw new Error("Tier management data not found.");
//     }

//     const { start_mangement, tier_benefits } = tierData;
//     const earnedPoints = parseInt(earned_point, 10);
//     const { newTier, newTierPoints } = determineNewTier(
//       earnedPoints,
//       start_mangement,
//       tier_benefits
//     );
//     if (membership_tier === newTier) {
//       return {
//         message: "No tier update required.",
//         newTier,
//         updatedEarnedPoints: earned_point,
//         updatedBalancePoints: customerData.balance_point,
//       };
//     }
//     const updatedEarnedPoints = earnedPoints + newTierPoints;
//     const updatedBalancePoints = calculateBalancePointsManagement(
//       updatedEarnedPoints,
//       customerData
//     );
//     await customer.update(
//       {
//         earned_point: updatedEarnedPoints.toString(),
//         balance_point: updatedBalancePoints.toString(),
//         membership_tier: newTier,
//       },
//       { where: { customer_id: customerId } }
//     );

//     console.log("newTierPoints", newTierPoints);
//     if (newTierPoints > 0) {
//       const transitionId = generateTransitionId("tier_update");
//       await transition.create({
//         customer_Id: customerId,
//         transition_id: transitionId,
//         account_number: customerData.account_number,
//         transition_category: "tier_update",
//         transition_status: "credit",
//         medium: "desktop",
//         point: newTierPoints,
//         expiry_date: "18months",
//         order_id: "",
//         product_detail: "",
//         domain: "lakme.com",
//       });
//     }

//     await createMetafieldHelperFunction(customerId, {
//       rclupoint: "0",
//       lakme_point: updatedBalancePoints.toString(),
//     });

//     return {
//       message: "Customer tier updated successfully.",
//       newTier,
//       updatedEarnedPoints: updatedEarnedPoints.toString(),
//       updatedBalancePoints: updatedBalancePoints.toString(),
//     };
//   } catch (error) {
//     console.error("Error updating customer tier:", error);
//     throw new Error(error.message || "Internal server error.");
//   }
// };

//? customer tier update

// update hold transition

// export const updateCustomerHeldTransitions = async (req, res) => {
//   try {
//     const { customerId, date } = req.body; // Extract customerId and date from the request
//     if (!customerId || !date) {
//       return res
//         .status(400)
//         .json({ message: "Customer ID and date are required." });
//     }
//     const testingDate = new Date(date.split("-").reverse().join("-"));
//     console.log("Testing Date:", testingDate);
//     const transitions = await transition.findAll({
//       where: {
//         customer_Id: customerId,
//         transition_status: "hold",
//         point: { [Op.gt]: 0 },
//       },
//       order: [["createdAt", "ASC"]],
//     });

//     if (!transitions || transitions.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "No held transitions found for the customer." });
//     }
//     const customerData = await customer.findOne({
//       where: { customer_id: customerId },
//     });
//     if (!customerData) {
//       return res.status(404).json({ message: "Customer not found." });
//     }

//     let totalPointsToCredit = 0;
//     for (const trans of transitions) {
//       const createdAt = new Date(trans.createdAt);
//       const creditDays = parseInt(trans.credit_days || "0", 10);
//       const creditEligibleDate = new Date(createdAt);
//       creditEligibleDate.setDate(creditEligibleDate.getDate() + creditDays);

//       console.log(
//         `Transition ID: ${trans.id}, Created At: ${createdAt}, Credit Days: ${creditDays}, Credit Eligible Date: ${creditEligibleDate}`
//       );
//       if (testingDate >= creditEligibleDate) {
//         totalPointsToCredit += parseInt(trans.point, 10);

//         await transition.update(
//           { transition_status: "credit" },
//           { where: { id: trans.id } }
//         );
//       }
//     }

//     if (totalPointsToCredit === 0) {
//       return res
//         .status(200)
//         .json({
//           message: "No transitions eligible for credit for the given date.",
//         });
//     }

//     const oldEarnedPoint = parseInt(customerData.earned_point || "0", 10);
//     const oldRedeemPoint = parseInt(customerData.redeem_point || "0", 10);
//     const oldExpiryPoint = parseInt(customerData.expiry_point || "0", 10);

//     const updatedEarnedPoint = oldEarnedPoint + totalPointsToCredit;
//     const updatedBalancePoint =
//       updatedEarnedPoint - oldRedeemPoint - oldExpiryPoint;
//     await customer.update(
//       {
//         balance_point: updatedBalancePoint.toString(),
//         earned_point: updatedEarnedPoint.toString(),
//       },
//       { where: { customer_id: customerId } }
//     );

//     res.status(200).json({
//       message: "Held transitions updated to credit successfully.",
//       totalPointsCredited: totalPointsToCredit,
//       updatedCustomerPoints: {
//         earned_point: updatedEarnedPoint.toString(),
//         balance_point: updatedBalancePoint.toString(),
//       },
//     });
//   } catch (error) {
//     console.error("Error updating held transitions:", error.message);
//     res
//       .status(500)
//       .json({ message: "An error occurred", error: error.message });
//   }
// };

// export const updateCustomerHeldTransitions = async (req, res) => {
//   try {
//     // Get the current date
//     const currentDate = new Date();
//     currentDate.setHours(0, 0, 0, 0); // Reset time to midnight

//     console.log("currentDate", currentDate);

//     // Fetch all customers
//     const customers = await customer.findAll();
//     if (!customers || customers.length === 0) {
//       return res.status(404).json({ message: "No customers found." });
//     }

//     // Fetch all transitions with 'hold' status in a single query for optimization
//     const heldTransitions = await transition.findAll({
//       where: {
//         transition_status: "hold",
//         point: { [Op.gt]: 0 },
//       },
//       order: [["createdAt", "ASC"]],
//     });

//     if (!heldTransitions || heldTransitions.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "No held transitions found for any customer." });
//     }

//     let totalPointsProcessed = 0;
//     const processedCustomers = [];

//     // Use Lodash to group transitions by customer ID
//     const groupedTransitions = _.groupBy(heldTransitions, "customer_Id");

//     for (const customerData of customers) {
//       const customerId = customerData.customer_id;

//       // Get transitions for the current customer
//       const customerTransitions = groupedTransitions[customerId] || [];

//       let customerPointsToCredit = 0;
//       for (const trans of customerTransitions) {
//         const createdAt = new Date(trans.createdAt);
//         const creditDays = parseInt(trans.credit_days || "0", 10);
//         const creditEligibleDate = new Date(createdAt);
//         creditEligibleDate.setDate(creditEligibleDate.getDate() + creditDays);

//         if (currentDate >= creditEligibleDate) {
//           customerPointsToCredit += parseInt(trans.point, 10);

//           // Update transition status to 'credit'
//           await transition.update(
//             { transition_status: "credit" },
//             { where: { id: trans.id } }
//           );
//         }
//       }

//       if (customerPointsToCredit > 0) {
//         const oldEarnedPoint = parseInt(customerData.earned_point || "0", 10);
//         const oldRedeemPoint = parseInt(customerData.redeem_point || "0", 10);
//         const oldExpiryPoint = parseInt(customerData.expiry_point || "0", 10);

//         const updatedEarnedPoint = oldEarnedPoint + customerPointsToCredit;
//         const updatedBalancePoint =
//           updatedEarnedPoint - oldRedeemPoint - oldExpiryPoint;

//         // Update customer points
//         await customer.update(
//           {
//             balance_point: updatedBalancePoint.toString(),
//             earned_point: updatedEarnedPoint.toString(),
//           },
//           { where: { customer_id: customerId } }
//         );

//         totalPointsProcessed += customerPointsToCredit;
//         processedCustomers.push({
//           customerId,
//           pointsCredited: customerPointsToCredit,
//           updatedPoints: {
//             earned_point: updatedEarnedPoint,
//             balance_point: updatedBalancePoint,
//           },
//         });
//       }
//     }

//     if (processedCustomers.length === 0) {
//       return res
//         .status(200)
//         .json({
//           message: "No eligible transitions found for the current date.",
//         });
//     }

//     res.status(200).json({
//       message: "Held transitions processed successfully.",
//       totalPointsCredited: totalPointsProcessed,
//       processedCustomers,
//     });
//   } catch (error) {
//     console.error("Error processing held transitions:", error.message);
//     res
//       .status(500)
//       .json({ message: "An error occurred", error: error.message });
//   }
// };

// end update hold transition

//test reedem message

export const sendNotifications = async (req, res) => {
  try {
    const { templateType, store, details } = req.body;

    console.log("details", details, store, templateType);

    // Validate required fields
    if (!templateType || !store || !details) {
      return res
        .status(400)
        .json({ error: "Missing required fields in the request body." });
    }

    const {
      first_name,
      phone,
      redeem_point,
      balance_point,
      product_line_item,
    } = details;

    console.log(
      "first_name, phone, redeem_point, balance_point, product_line_item ",
      first_name,
      phone,
      redeem_point,
      balance_point,
      product_line_item
    );

    if (
      !first_name ||
      !phone ||
      !redeem_point ||
      !balance_point ||
      !product_line_item
    ) {
      return res
        .status(400)
        .json({ error: "Missing required details in the request body." });
    }

    // Fetch notifications for both WhatsApp and SMS
    const notifications = await Notification.findAll({
      where: { store },
    });

    // console.log("notifications",notifications);

    if (!notifications || notifications.length === 0) {
      return res
        .status(404)
        .json({ error: `Notification details not found for store: ${store}` });
    }

    let whatsappSent = false;
    let smsSent = false;

    // Process WhatsApp Notification
    const whatsappNotification = notifications.find(
      (n) =>
        n.notification_type === "WhatsApp" && n.templateType === templateType
    );
    if (whatsappNotification) {
      const { api_key, password, header } = whatsappNotification;
      let whatsappText = header;

      // Replace placeholders in the WhatsApp template
      whatsappText = whatsappText
        .replace("{#var#}", `${first_name}`)
        .replace("{#var#}", `${redeem_point}`)
        .replace("{#var#}", `${balance_point}`)
        .replace("{#var#}", `${product_line_item}`);

      const whatsappUrl = `https://media.smsgupshup.com/GatewayAPI/rest?userid=${api_key}&password=${password}&send_to=${phone}&v=1.1&format=json&msg_type=TEXT&method=sendMessage&msg=${encodeURIComponent(
        whatsappText
      )}`;
      console.log("WhatsApp URL:", whatsappUrl);

      const whatsappResponse = await axios.get(whatsappUrl);
      console.log(
        "WhatsApp notification sent successfully:",
        whatsappResponse.data
      );
      whatsappSent = true;
    } else {
      console.warn("WhatsApp template not found for the given type.");
    }

    // Process SMS Notification
    const smsNotification = notifications.find(
      (n) => n.notification_type === "SMS" && n.templateType === templateType
    );
    if (smsNotification) {
      const { username, password, header } = smsNotification;

      console.log("header", header);
      console.log("password", password);
      console.log("username", username);

      let smsText = header;

      console.log("smsText", smsText);

      // Replace placeholders in the SMS template
      smsText = smsText
        .replace("{#var#}", `${first_name}`)
        .replace("{#var#}", `${redeem_point}`)
        .replace("{#var#}", `${balance_point}`)
        .replace("{#var#}", `${product_line_item}`);

      const smsUrl = `https://api2.growwsaas.com/fe/api/v1/send`;
      const from = "ReShop";

      console.log("smsText2", smsText);

      // Sending SMS via API
      const smsResponse = await axios.get(smsUrl, {
        params: {
          username,
          password,
          unicode: false,
          from,
          to: phone,
          text: smsText,
          dltContentId: "1007866970822561361", // Replace with actual DLT Content ID
        },
      });
      console.log("SMS notification sent successfully:", smsResponse.data);
      smsSent = true;
    } else {
      console.warn("SMS template not found for the given type.");
    }

    const response = {
      message: "Notification process completed.",
      whatsappSent,
      smsSent,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error sending notifications:", error.message);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const sendNotificationsEarned = async (req, res) => {
  try {
    const { templateType, store, details } = req.body;

    console.log("details", details, store, templateType);

    // Validate required fields
    if (!templateType || !store || !details) {
      return res
        .status(400)
        .json({ error: "Missing required fields in the request body." });
    }

    const { first_name, phone, earn_point, balance_point } = details;

    console.log(
      "first_name, phone, earn_point, balance_point ",
      first_name,
      phone,
      earn_point,
      balance_point
    );

    if (!first_name || !phone || !earn_point || !balance_point) {
      return res
        .status(400)
        .json({ error: "Missing required details in the request body." });
    }

    // Fetch notifications for both WhatsApp and SMS
    const notifications = await Notification.findAll({
      where: { store },
    });

    // console.log("notifications",notifications);

    if (!notifications || notifications.length === 0) {
      return res
        .status(404)
        .json({ error: `Notification details not found for store: ${store}` });
    }

    let whatsappSent = false;
    let smsSent = false;

    // Process WhatsApp Notification
    const whatsappNotification = notifications.find(
      (n) =>
        n.notification_type === "WhatsApp" && n.templateType === templateType
    );
    if (whatsappNotification) {
      const { api_key, password, header } = whatsappNotification;
      let whatsappText = header;

      // Replace placeholders in the WhatsApp template
      whatsappText = whatsappText
        .replace("{#var#}", `${first_name}`)
        .replace("{#var#}", `${earn_point}`)
        .replace("{#var#}", `${balance_point}`);

      const whatsappUrl = `https://media.smsgupshup.com/GatewayAPI/rest?userid=${api_key}&password=${password}&send_to=${phone}&v=1.1&format=json&msg_type=TEXT&method=sendMessage&msg=${encodeURIComponent(
        whatsappText
      )}`;
      console.log("WhatsApp URL:", whatsappUrl);

      const whatsappResponse = await axios.get(whatsappUrl);
      console.log(
        "WhatsApp notification sent successfully:",
        whatsappResponse.data
      );
      whatsappSent = true;
    } else {
      console.warn("WhatsApp template not found for the given type.");
    }

    // Process SMS Notification
    const smsNotification = notifications.find(
      (n) => n.notification_type === "SMS" && n.templateType === templateType
    );
    if (smsNotification) {
      const { username, password, header } = smsNotification;

      console.log("header", header);
      console.log("password", password);
      console.log("username", username);

      let smsText = header;

      console.log("smsText", smsText);

      // Replace placeholders in the SMS template
      smsText = smsText
        .replace("{#var#}", `${earn_point}`)
        .replace("{#var#}", `${balance_point}`);

      const smsUrl = `https://api2.growwsaas.com/fe/api/v1/send`;
      const from = "ReShop";

      console.log("smsText2", smsText);

      // Sending SMS via API
      const smsResponse = await axios.get(smsUrl, {
        params: {
          username,
          password,
          unicode: false,
          from,
          to: phone,
          text: smsText,
          dltContentId: "1007653284425747534", // Replace with actual DLT Content ID
        },
      });
      console.log("SMS notification sent successfully:", smsResponse.data);
      smsSent = true;
    } else {
      console.warn("SMS template not found for the given type.");
    }

    const response = {
      message: "Notification process completed.",
      whatsappSent,
      smsSent,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error sending notifications:", error.message);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const sendNotificationsEarnedFun = async (
  templateType,
  store,
  details
) => {
  try {
    console.log("details", details, store, templateType);

    // Validate required fields
    if (!templateType || !store || !details) {
      throw new Error("Missing required fields in the input.");
    }

    const { first_name, phone, earn_point, balance_point } = details;

    console.log(
      "first_name, phone, earn_point, balance_point",
      first_name,
      phone,
      earn_point,
      balance_point
    );

    if (!first_name || !phone || !earn_point || !balance_point) {
      throw new Error("Missing required details in the input.");
    }

    // Fetch notifications for both WhatsApp and SMS
    const notifications = await Notification.findAll({
      where: { store },
    });

    if (!notifications || notifications.length === 0) {
      throw new Error(`Notification details not found for store: ${store}`);
    }

    let whatsappSent = false;
    let smsSent = false;

    // Process WhatsApp Notification
    const whatsappNotification = notifications.find(
      (n) =>
        n.notification_type === "WhatsApp" && n.templateType === templateType
    );
    if (whatsappNotification) {
      const { api_key, password, header } = whatsappNotification;
      let whatsappText = header;

      // Replace placeholders in the WhatsApp template
      whatsappText = whatsappText
        .replace("{#var#}", `${first_name}`)
        .replace("{#var#}", `${earn_point}`)
        .replace("{#var#}", `${balance_point}`);

      const whatsappUrl = `https://media.smsgupshup.com/GatewayAPI/rest?userid=${api_key}&password=${password}&send_to=${phone}&v=1.1&format=json&msg_type=TEXT&method=sendMessage&msg=${encodeURIComponent(
        whatsappText
      )}`;
      console.log("WhatsApp URL:", whatsappUrl);

      const whatsappResponse = await axios.get(whatsappUrl);
      console.log(
        "WhatsApp notification sent successfully:",
        whatsappResponse.data
      );
      whatsappSent = true;
    } else {
      console.warn("WhatsApp template not found for the given type.");
    }

    // Process SMS Notification
    const smsNotification = notifications.find(
      (n) => n.notification_type === "SMS" && n.templateType === templateType
    );
    if (smsNotification) {
      const { username, password, header } = smsNotification;

      console.log("header", header);
      console.log("password", password);
      console.log("username", username);

      let smsText = header;

      console.log("smsText", smsText);

      // Replace placeholders in the SMS template
      smsText = smsText
        .replace("{#var#}", `${earn_point}`)
        .replace("{#var#}", `${balance_point}`);

      const smsUrl = `https://api2.growwsaas.com/fe/api/v1/send`;
      const from = "ReShop";

      console.log("smsText2", smsText);

      // Sending SMS via API
      const smsResponse = await axios.get(smsUrl, {
        params: {
          username,
          password,
          unicode: false,
          from,
          to: phone,
          text: smsText,
          dltContentId: "1007653284425747534", // Replace with actual DLT Content ID
        },
      });
      console.log("SMS notification sent successfully:", smsResponse.data);
      smsSent = true;
    } else {
      console.warn("SMS template not found for the given type.");
    }

    return {
      message: "Notification process completed.",
      whatsappSent,
      smsSent,
    };
  } catch (error) {
    console.error("Error sending notifications:", error.message);
    throw new Error(error.message);
  }
};

// export const fetchCustomer = async (req, res) => {
//   try {
//     let allCustomers = [];
//     let hasNextPage = true;
//     let endCursor = null;

//     while (hasNextPage) {
//       const query = `
//         query {
//           customers(first: 5 ${endCursor ? `, after: "${endCursor}"` : ""}) {
//             edges {
//               node {
//                 id
//                 firstName
//                 lastName
//                 email
//                 phone
//                 numberOfOrders
//                 amountSpent {
//                   amount
//                   currencyCode
//                 }
//                 createdAt
//                 updatedAt
//                 note
//                 verifiedEmail
//                 validEmailAddress
//                 tags
//                 lifetimeDuration
//                 defaultAddress {
//                   formattedArea
//                   address1
//                 }
//                 addresses {
//                   address1
//                 }
//                 image {
//                   src
//                 }
//                 metafield(namespace: "custom", key: "account_number") {
//                   key
//                   namespace
//                   value
//                 }
//               }
//             }
//             pageInfo {
//               hasNextPage
//               endCursor
//             }
//           }
//         }
//       `;

//       const response = await axios({
//         url: `https://lakmestaging.myshopify.com/admin/api/2024-04/graphql.json`,
//         method: "POST",
//         headers: {
//           "X-Shopify-Access-Token": shopify_token,
//           Accept: "application/json",
//           "Content-Type": "application/json",
//         },
//         data: JSON.stringify({ query }),
//       });

//       const { data } = response.data;

//       // Debugging logs
//       console.log("Response Data:", JSON.stringify(data, null, 2));

//       // Extract data and pagination info
//       const customers = data.customers.edges.map(edge => edge.node);
//       allCustomers = allCustomers.concat(customers);
//       hasNextPage = data.customers.pageInfo.hasNextPage;
//       endCursor = data.customers.pageInfo.endCursor;

//       console.log(`Fetched ${allCustomers.length} customers so far...`);
//     }

//     return res.status(200).json({ status: "success", data: allCustomers });
//   } catch (error) {
//     console.error("Error fetching customers:", error.message);
//     return res.status(500).json({ status: "error", message: error.message });
//   }
// };

export const fetchCustomer = async (req, res) => {
  try {
    // Check if a file is uploaded
    if (!req.file) {
      return res
        .status(400)
        .json({ status: "error", message: "No file uploaded" });
    }
    const workbook = xlsx.readFile(req.file.path);
    const sheetNames = workbook.SheetNames;
    const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);
    const chunkSize = 10000;
    const totalRecords = jsonData.length;

    console.log(`Starting to process ${totalRecords} records...`);
    const processedData = [];

    for (let i = 0; i < totalRecords; i += chunkSize) {
      const chunk = jsonData.slice(i, i + chunkSize);
      console.log(
        `Processed chunk ${i / chunkSize + 1} (${i + 1}-${Math.min(
          i + chunkSize,
          totalRecords
        )}) successfully.`
      );
      processedData.push(...chunk);
    }
    return res.status(200).json({
      status: "success",
      total: totalRecords,
      chunkSize,
      chunks: Math.ceil(totalRecords / chunkSize),
      // data: processedData, // Include all processed data in the response
    });
  } catch (error) {
    console.error("Error processing file:", error.message);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to process .xlsx file" });
  }
};

export const findOrderCustomer = async (req, res) => {
  try {
    // Extract customer_id and type from the request body
    const { customer_id, type } = req.body;

    // Validate customer_id
    if (!customer_id || isNaN(customer_id)) {
      return res.status(400).json({
        status: 400,
        message: "Valid customer_id is required in the request body",
      });
    }

    // Configuration for the Shopify API request
    const configRes = {
      method: "get",
      maxBodyLength: Infinity,
      url: `https://lakmestaging.myshopify.com/admin/orders.json?customer_id=${customer_id}&status=any`,
      headers: {
        "X-Shopify-Access-Token": shopify_token,
      },
    };

    // Make the request to Shopify API
    const { data } = await axios.request(configRes);

    // Extract and map orders to include only id and financial_status
    let orders = data.orders.map((order) => ({
      id: order.id,
      financial_status: order.financial_status,
    }));

    // Filter orders based on the type parameter
    if (type === "refunded") {
      orders = orders.filter((order) => order.financial_status === "refunded");
    }

    // Respond with the filtered orders data
    return res.status(200).json({
      status: 200,
      message: "Orders retrieved successfully",
      data: orders,
    });
  } catch (error) {
    // Enhanced error handling and logging
    console.error("Error fetching customer orders:", error.message, {
      responseData: error.response?.data,
    });

    if (error.response) {
      return res.status(error.response.status).json({
        status: error.response.status,
        message: error.response.data.errors || "Error from Shopify API",
      });
    }

    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
};

export const createRedemptionRuleCustomer = async (req, res) => {
  try {
    const {
      id,
      minimum_redemption,
      limitation_per_day,
      vochuer_limitation_per_day,
      store,
    } = req.body;
    let existingRecord = null;

    // Check if updating an existing record
    if (id) {
      existingRecord = await customer_redeem_rule.findOne({ where: { id } });

      if (!existingRecord) {
        return res.status(404).json({
          message: `No record found with ID ${id}. Unable to update.`,
        });
      }
    }

    if (existingRecord) {
      // Update existing record
      await existingRecord.update({
        minimum_redemption,
        limitation_per_day,
        vochuer_limitation_per_day,
        store,
      });

      return res.status(200).json({
        message: "Redemption rule updated successfully.",
        data: existingRecord,
        status: 200,
      });
    } else {
      // Create new record
      const newRecord = await customer_redeem_rule.create({
        minimum_redemption,
        limitation_per_day,
        vochuer_limitation_per_day,
        store,
      });

      return res.status(201).json({
        message: "Redemption rule created successfully.",
        data: newRecord,
        status: 201,
      });
    }
  } catch (error) {
    console.error("Error in createRedemptionRuleCustomer:", error);
    return res.status(500).json({
      message: "Error creating or updating redemption rule.",
      error: error.message,
    });
  }
};

export const getCreateRedemptionRuleCustomer = async (req, res) => {
  try {
    const { store } = req.query;
    const processedStore = await storeHandler(store);
    const redemptions = await customer_redeem_rule.findAll({
      where: {
        store: processedStore,
      },
    });
    if (redemptions.length === 0) {
      return res.status(404).json({
        message: "No registration records found.",
      });
    }
    return res.status(200).json({
      message: "registration records fetched successfully.",
      data: redemptions,
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching registration records:", error.message);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};

export const getProductRedeemRule = async (req, res) => {
  try {
    const { store } = req.query;
    const processedStore = await storeHandler(store);
    const redemptions = await customer_redeem_rule.findAll({
      where: {
        store: processedStore,
      },
    });
    if (redemptions.length === 0) {
      return res.status(404).json({
        message: "No registration records found.",
      });
    }
    return res.status(200).json({
      message: "registration records fetched successfully.",
      data: redemptions,
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching registration records:", error.message);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};

export const getProductRedeemCustomerRule = async (req, res) => {
  try {
    const { customer_id, store } = req.body;

    if (!customer_id || !store) {
      return res.status(400).json({
        message: "Please provide both customer_id and store.",
      });
    }

    // Fetch customer data
    const customerData = await customer.findOne({
      where: { customer_id, store },
      attributes: [
        "earned_point",
        "redeem_point",
        "expiry_point",
        "balance_point",
        "membership_tier",
        "is_product_redeem",
        "is_voucher_redeem",
      ],
    });

    if (!customerData) {
      return res.status(404).json({
        message: `No customer found with customer_id: ${customer_id}.`,
      });
    }

    // Fetch redemption rule
    const redemptionRule = await customer_redeem_rule.findOne({
      where: { store },
    });

    if (!redemptionRule) {
      return res.status(404).json({
        message: `No redemption rule found for store: ${store}.`,
      });
    }

    // Check if product redemption for the day is allowed
    const isRedeemForDay =
      parseInt(customerData.is_product_redeem || "0", 10) >=
      parseInt(redemptionRule.limitation_per_day || "0", 10)
        ? "yes"
        : "no";

    // Check if voucher redemption for the day is allowed
    const isVoucherForDay =
      parseInt(customerData.is_voucher_redeem || "0", 10) >=
      parseInt(redemptionRule.vochuer_limitation_per_day || "0", 10)
        ? "yes"
        : "no";

    return res.status(200).json({
      message: "Data retrieved successfully.",
      customer: {
        ...customerData.dataValues,
        is_redeem_for_day: isRedeemForDay,
        is_voucher_for_day: isVoucherForDay,
      },
      redemptionRule,
    });
  } catch (error) {
    console.error("Error in getProductRedeemCustomerRule:", error);
    return res.status(500).json({
      message: "Error retrieving product redemption rule.",
      error: error.message,
    });
  }
};

export const updateIsRedeemCustomer = async (req, res) => {
  try {
    // Step 1: Update all customers to set is_product_redeem and is_voucher_redeem to 0
    const [updatedCount] = await customer.update(
      {
        is_product_redeem: "0", // Set is_product_redeem to 0
        is_voucher_redeem: "0", // Set is_voucher_redeem to 0
      },
      {
        where: {}, // Empty where condition means "update all rows"
      }
    );

    // Step 2: Check if any rows were affected
    if (updatedCount === 0) {
      return res.status(200).json({ message: "No customers were updated." });
    }

    // Step 3: Return success response
    res.status(200).json({
      message: `${updatedCount} customers' redeem status has been updated successfully.`,
    });
  } catch (error) {
    console.error("Error updating redeem status:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const updateCustomerTier = async (req, res) => {
  try {
    const { customer_id, store } = req.body;
    if (!customer_id || !store) {
      return res.status(400).json({
        message: "Please provide both customer_id and store.",
      });
    }

    // Fetch customer data
    const customerData = await customer.findOne({
      where: { customer_id, store },
      attributes: [
        "earned_point",
        "redeem_point",
        "expiry_point",
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
      return res.status(404).json({
        message: `No customer found with customer_id: ${customer_id}.`,
      });
    }

    // Fetch tier management data
    const tierData = await tier_mangement.findOne({
      where: { store },
    });

    if (!tierData) {
      return res.status(404).json({
        message: `No tier management data found for store: ${store}.`,
      });
    }

    const startManagement = tierData.start_mangement;
    console.log("startManagement", startManagement);

    const tierBenefits = tierData.tier_benefits;
    console.log("tierBenefits", tierBenefits);

    const currentTier = customerData.membership_tier;
    console.log("currentTier", currentTier);

    const balancePoint = parseInt(customerData.balance_point, 10);
    console.log("balancePoint", balancePoint);

    const oldEarnedPoint = parseInt(customerData.earned_point, 10);
    console.log("oldEarnedPoint", oldEarnedPoint);

    const oldRedeemPoint = parseInt(customerData.redeem_point, 10);
    console.log("oldRedeemPoint", oldRedeemPoint);

    const oldExpiryPoint = parseInt(customerData.expiry_point, 10);
    console.log("oldExpiryPoint", oldExpiryPoint);

    // Determine the new tier
    let newTier = currentTier;
    let tierPoints = 0;
    let expiryDate = null;

    for (const [tier, range] of Object.entries(startManagement)) {
      const start = parseInt(range.start_point, 10) || 0;
      console.log("start", start);

      const end = parseInt(range.end_point, 10) || Infinity;
      console.log("end", end);

      if (balancePoint >= start && balancePoint <= end) {
        newTier = tier;
        tierPoints = parseInt(tierBenefits[tier]?.point || "0", 10);
        // expiryDate = tierBenefits[tier]?.expiry_date || null;
        const expiryDays = parseInt(tierBenefits[tier]?.expiry || "0", 10);
        console.log("expiryDays 8993", expiryDays);

        expiryDate = moment().add(expiryDays, "days").format("DD-MM-YYYY");
        console.log("expiryDate 8997", expiryDate);
        break;
      }
    }

    // Check if the tier is upgraded
    if (newTier !== currentTier) {
      if (
        Object.keys(startManagement).indexOf(newTier) >
        Object.keys(startManagement).indexOf(currentTier)
      ) {
        const updatedEarnedPoint = oldEarnedPoint + tierPoints;
        const updatedBalancePoint =
          updatedEarnedPoint - oldRedeemPoint - oldExpiryPoint;

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
          domain: "lakme.com",
          name: customerData.first_name,
          mobile_no: customerData.phone_number,
          state: customerData.State,
          city: customerData.city,
          serial_no: "",
          coupon_code: "",
          scan_manual: "",
        });

        return res.status(200).json({
          message: "Customer tier updated successfully.",
          customer: {
            previous_tier: currentTier,
            new_tier: newTier,
            points_given: tierPoints,
            expiry_date: expiryDate,
          },
        });
      } else {
        // Tier downgrade detected but no update
        return res.status(200).json({
          message:
            "Customer tier downgrade detected. No update performed or points given.",
          customer: {
            current_tier: currentTier,
            balance_point: balancePoint,
          },
        });
      }
    } else {
      // No tier change
      return res.status(200).json({
        message: "No tier change. Customer retains their current tier.",
        customer: {
          current_tier: currentTier,
          balance_point: balancePoint,
        },
      });
    }
  } catch (error) {
    console.error("Error in updateCustomerTier:", error);
    return res.status(500).json({
      message: "Error updating customer tier.",
      error: error.message,
    });
  }
};

// const updateCustomerTierFunc = async (customer_id, store) => {
//   try {
//     console.log("customer_id", customer_id);
//     console.log("store", store);
//     const customerIdString = String(customer_id);

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
//           domain: "lakme.com",
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
//           lakme_point: updatedBalancePoint.toString(),
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
//     const customerIdString = String(customer_id);

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

//     let maxTier = null;
//     let maxTierPoints = 0;

//     for (const [tier, range] of Object.entries(startManagement)) {
//       const start = parseInt(range.start_point, 10) || 0;
//       const end = parseInt(range.end_point, 10) || Infinity;

//       if (oldEarnedPoint >= start && oldEarnedPoint <= end) {
//         newTier = tier;
//         tierPoints = parseInt(tierBenefits[tier]?.point || "0", 10);
//         const expiryDays = parseInt(tierBenefits[tier]?.expiry || "0", 10);
//         expiryDate = moment().add(expiryDays, "days").format("DD-MM-YY");
//         break;
//       }

//       // Track the highest tier for points exceeding all ranges
//       maxTier = tier;
//       maxTierPoints = parseInt(tierBenefits[tier]?.point || "0", 10);
//     }

//     // Assign the highest tier if earned points exceed all defined ranges
//     if (oldEarnedPoint > parseInt(startManagement[maxTier]?.end_point || 0, 10)) {
//       newTier = maxTier;
//       tierPoints = maxTierPoints;
//       const expiryDays = parseInt(tierBenefits[maxTier]?.expiry || "0", 10);
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
//           domain: "lakme.com",
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
//           lakme_point: updatedBalancePoint.toString(),
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
    const customerIdString = String(customer_id);

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
        "email",
      ],
    });

    if (!customerData) {
      return {
        status: 404,
        message: `No customer found with customer_id: ${customer_id}.`,
      };
    }

    const currentTier = customerData.membership_tier || "";
    console.log("currentTier", currentTier);

    const oldEarnedPoint = parseInt(customerData.earned_point, 10);
    console.log("oldEarnedPoint", oldEarnedPoint);

    const oldRedeemPoint = parseInt(customerData.redeem_point, 10) || 0;
    console.log("oldRedeemPoint", oldRedeemPoint);

    const oldExpiryPoint = parseInt(customerData.expiry_point, 10) || 0;
    console.log("oldExpiryPoint", oldExpiryPoint);

    // Fetch tier management data
    const tierData = await tier_mangement.findOne({ where: { store } });
    console.log("tierData", tierData);

    if (!tierData) {
      return {
        status: 404,
        message: `No tier management data found for store: ${store}.`,
      };
    }

    const startManagement = tierData.start_mangement;
    console.log("startManagement", startManagement);

    let newTier = currentTier;
    console.log("newTier", newTier);

    // Determine the new tier
    for (const [tier, range] of Object.entries(startManagement)) {
      const start = parseInt(range.start_point, 10) || 0;
      console.log("start", start);

      const end = parseInt(range.end_point, 10) || Infinity;
      console.log("end", end);

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

    console.log("9315", Object.keys(startManagement).indexOf(newTier));
    console.log("9317", Object.keys(startManagement).indexOf(currentTier));

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
      const updatedBalancePoint =
        updatedEarnedPoint - oldRedeemPoint - oldExpiryPoint;

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
        domain: "lakme.com",
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
      //   lakme_point: updatedBalancePoint.toString(),
      // });

      // // Trigger notification for tier upgrade
      // await handleNotifications("tier-upgrade", "lakme", {
      //   first_name: customerData.first_name,
      //   newTier: newTier,
      //   phone_number: customerData.phone_number,
      //   email: customerData.email,
      // });

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

export const customerShopifyUpdateWebhook = async (req, res) => {
  try {
    console.log("req.body", req.body);

    const customerIdString = String(req.body.id);
    const updatedData = {
      phone_number: req.body.phone,
      email: req.body.email,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
    };
    const updatedCustomer = await customer.update(updatedData, {
      where: { customer_id: customerIdString },
    });

    if (updatedCustomer[0] > 0) {
      console.log("Customer updated successfully:", updatedData);
      return res.status(200).json({
        message: "Customer data updated successfully.",
        updatedCustomer: updatedData,
      });
    } else {
      console.log("No customer found with the given ID:", customerIdString);
      return res.status(404).json({
        message: `No customer found with customer_id: ${customerIdString}.`,
      });
    }
  } catch (error) {
    console.error("Error during customer update:", error);

    return res.status(500).json({
      message: "Error updating customer data.",
      error: error.message,
    });
  }
};

// export const customerShopifyDeleteWebhook = async (req, res) => {
//   try {
//     console.log("req.body", req.body);

//     // Extract customer ID from request body
//     const customerIdString = String(req.body.id);

//     // Find the customer in the database
//     const customerRecord = await customer.findOne({
//       where: { customer_id: customerIdString },
//     });

//     if (!customerRecord) {
//       console.log(`No customer found with ID: ${customerIdString}`);
//       return res.status(404).json({
//         message: `No customer found with ID: ${customerIdString}.`,
//       });
//     }

//     // Delete the customer record
//     await customer.destroy({
//       where: { customer_id: customerIdString },
//     });

//     console.log(`Customer with ID ${customerIdString} deleted successfully.`);
//     return res.status(200).json({
//       message: `Customer with ID ${customerIdString} deleted successfully.`,
//     });
//   } catch (error) {
//     console.error("Error during customer deletion:", error);

//     // Use error handler for consistent error responses
//     const response = errorHandler(error);
//     return res.status(statusMaker.internalError).json(response);
//   }
// };

export const customerShopifyDeleteWebhook = async (req, res) => {
  try {
    console.log("req.body", req.body);

    // Extract customer ID from request body
    const customerIdString = String(req.body.id);
    const customerRecord = await customer.findOne({
      where: { customer_id: customerIdString },
    });

    if (!customerRecord) {
      console.log(`No customer found with ID: ${customerIdString}`);
      return res.status(404).json({
        message: `No customer found with ID: ${customerIdString}.`,
      });
    }

    // Delete all transitions associated with this customer ID
    const deletedTransitions = await transition.destroy({
      where: { customer_Id: customerIdString },
    });
    console.log(
      `Deleted ${deletedTransitions} transitions for customer ID: ${customerIdString}`
    );

    // Delete the customer record
    await customer.destroy({
      where: { customer_id: customerIdString },
    });

    console.log(`Customer with ID ${customerIdString} deleted successfully.`);
    return res.status(200).json({
      message: `Customer with ID ${customerIdString} and their transitions deleted successfully.`,
    });
  } catch (error) {
    console.error("Error during customer deletion:", error);

    // Use error handler for consistent error responses
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const redeemOrderList = async (req, res) => {
  try {
    const { store } = req.query;
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
    console.log("Store Name and Token:", shopname, access_token);

    const query = `
      query GetOrders($first: Int, $after: String) {
          orders(first: $first, after: $after) {
              edges {
                  node {
                      id
                      name
                      email
                      tags
                      totalPrice
                      lineItems(first: 10) {
                          edges {
                              node {
                                  title
                                  quantity
                              }
                          }
                      }
                      createdAt
                      customer {
                          id
                          displayName
                      }
                  }
              }
              pageInfo {
                  hasNextPage
                  endCursor
              }
          }
      }`;

    let allOrders = [];
    let hasNextPage = true;
    let endCursor = null;

    while (hasNextPage) {
      const response = await axios({
        url: `https://${shopname}/admin/api/2024-10/graphql.json`,
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": access_token,
          "Content-Type": "application/json",
        },
        data: {
          query,
          variables: {
            first: 250,
            after: endCursor,
          },
        },
      });
      const data = response.data.data.orders;
      const edges = data.edges;
      allOrders = allOrders.concat(edges.map((edge) => edge.node));
      hasNextPage = data.pageInfo.hasNextPage;
      endCursor = data.pageInfo.endCursor;
    }
    const redemptionOrders = allOrders.filter((order) =>
      order.tags.includes("redeempoints")
    );
    const resp = responseHandler(
      statusMaker.success,
      "Orders fetched successfully",
      redemptionOrders
    );
    return res.status(statusMaker.success).json(resp);
  } catch (error) {
    console.error(
      "Error fetching orders:",
      error.response?.data || error.message
    );
    const resp = errorHandler(error.message);
    return res.status(statusMaker.internalError).json(resp);
  }
};

export const getOrderRedeemRule = async (req, res) => {
  try {
    const { store } = req.query;
    const processedStore = await storeHandler(store);
    const redemptions = await order_redeem_product.findAll({
      where: {
        store: processedStore,
      },
      order: [["createdAt", "DESC"]],
    });
    if (redemptions.length === 0) {
      return res.status(404).json({
        message: "No order redeem records found.",
      });
    }
    return res.status(200).json({
      message: "order reedeem records fetched successfully.",
      data: redemptions,
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching order redeem records:", error.message);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};

export const getOrderRedeemFilter = async (req, res) => {
  try {
    const { start_date, end_date, store } = req.query;
    const whereCondition = {};
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      endDate.setHours(23, 59, 59, 999);

      whereCondition.createdAt = {
        [Sequelize.Op.between]: [startDate, endDate],
      };
    }
    if (store) {
      whereCondition.store = store;
    }
    const orders = await order_redeem_product.findAll({
      where: whereCondition,
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "Filtered orders retrieved successfully.",
      status: 200,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching filtered orders:", error);
    return res.status(500).json({
      message: "An error occurred while fetching the orders.",
      error: error.message,
    });
  }
};

export const searchApiOrderRedeem = async (req, res) => {
  try {
    const { search_value, store } = req.query;

    // Validate input
    if (!search_value || !store) {
      return res.status(400).json({
        message:
          "Please provide both a search value and a store name to find order.",
        status: 400,
      });
    }

    // Remove spaces and ensure search_value is case-insensitive
    const sanitizedSearchValue = search_value.replace(/\s+/g, "").toLowerCase();

    // Search for records matching the given store and search value
    const searchData = await order_redeem_product.findAll({
      where: {
        store, // Match the store
        [Op.or]: [
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("order_id")),
            "LIKE",
            `%${sanitizedSearchValue}%`
          ),
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("account_number")),
            "LIKE",
            `%${sanitizedSearchValue}%`
          ),
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("name")),
            "LIKE",
            `%${sanitizedSearchValue}%`
          ),
        ],
      },
      order: [["createdAt", "DESC"]], // Sort results by creation date in descending order
    });

    // Return results
    if (searchData.length === 0) {
      return res.status(404).json({
        message: "No matching records found.",
        status: 404,
      });
    }

    return res.status(200).json({
      message: "Search results retrieved successfully.",
      data: searchData,
      status: 200,
    });
  } catch (error) {
    console.error("Error in searchApiOrderRedeem:", error);
    return res.status(500).json({
      message: "An error occurred while searching for orders.",
      error: error.message,
      status: 500,
    });
  }
};

// export const getTodaysBirthdays = async (req, res) => {
//   try {
//     // Get today's date in MM-DD format
//     const today = moment().format("MM-DD");
//     const customersWithBirthdays = await customer.findAll({
//       where: Sequelize.where(
//         Sequelize.fn("SUBSTRING", Sequelize.col("date_of_birth"), 6, 5),
//         today
//       ),
//     });

//     if (!customersWithBirthdays || customersWithBirthdays.length === 0) {
//       return res.status(404).json({
//         message: "No customers have a birthday today.",
//         status: 404,
//       });
//     }

//     return res.status(200).json({
//       message: "Customers with birthdays today retrieved successfully.",
//       data: customersWithBirthdays,
//       status: 200,
//     });
//   } catch (error) {
//     console.error("Error fetching customers with birthdays:", error);
//     return res.status(500).json({
//       message: "An error occurred while fetching birthdays.",
//       error: error.message,
//       status: 500,
//     });
//   }
// };

export const getTodaysBirthdays = async (req, res) => {
  try {
    // Get today's date in MM-DD format
    const today = moment().format("MM-DD");

    // Fetch customers with today's birthday
    const customersWithBirthdays = await customer.findAll({
      where: Sequelize.where(
        Sequelize.fn("SUBSTRING", Sequelize.col("date_of_birth"), 6, 5),
        today
      ),
    });

    if (!customersWithBirthdays || customersWithBirthdays.length === 0) {
      return res.status(404).json({
        message: "No customers have a birthday today.",
        status: 404,
      });
    }

    // Fetch tier management data for the store
    const store = req.query.store; // Assuming the store is provided via query parameter
    const tierData = await tier_mangement.findOne({
      where: { store },
    });

    if (!tierData) {
      return res.status(404).json({
        message: `No tier management data found for store: ${store}.`,
        status: 404,
      });
    }

    const benefits = tierData.benefits;

    // Iterate through customers with birthdays
    for (const customerData of customersWithBirthdays) {
      const currentTier = customerData.membership_tier;
      const oldEarnedPoint = parseInt(customerData.earned_point, 10);
      const oldRedeemPoint = parseInt(customerData.redeem_point, 10);
      const oldExpiryPoint = parseInt(customerData.expiry_point, 10);
      const balancePoint = parseInt(customerData.balance_point, 10);

      // Determine the benefit points and expiry days based on the customer's tier
      const tierBenefit = benefits[currentTier];

      if (tierBenefit) {
        const tierPoints = parseInt(tierBenefit.benefit, 10);
        const expiryDays = parseInt(tierBenefit.expiry, 10);
        console.log("expiryDays 8993", expiryDays);

        // Calculate the expiry date by adding expiryDays to the current date
        const expiryDate = moment()
          .add(expiryDays, "days")
          .format("DD-MM-YYYY");
        console.log("expiryDateexpiryDate 8997", expiryDate);

        // Recalculate earned and balance points after adding birthday points
        const updatedEarnedPoint = oldEarnedPoint + tierPoints;
        const updatedBalancePoint =
          updatedEarnedPoint - oldRedeemPoint - oldExpiryPoint;

        // Update the customer's earned and balance points
        const transitionId = generateTransitionId("benefit_point");

        await customer.update(
          {
            earned_point: updatedEarnedPoint,
            balance_point: updatedBalancePoint,
          },
          { where: { customer_id: customerData.customer_id, store } }
        );

        // Create transition record for the birthday points
        await transition.create({
          customer_Id: customerData.customer_id,
          transition_id: transitionId,
          account_number: customerData.account_number,
          transition_category: "birthday_points",
          transition_status: "credit",
          medium: "desktop",
          point: tierPoints,
          expiry_date: expiryDate,
          note: `Birthday points credited for tier: ${currentTier}`,
          domain: "lakme.com",
          name: customerData.first_name,
          mobile_no: customerData.phone_number,
          state: customerData.State,
          city: customerData.city,
        });

        // Optionally update metafields for the customer
        // await createMetafieldHelperFunction(customerData.customer_id, {
        //   rclupoint: "0",
        //   lakme_point: updatedBalancePoint.toString(),
        // });

        // const message = await handleNotifications(
        //   "happy-birthday",
        //   "lakme",
        //   {
        //     first_name: customerData.first_name,
        //     email: customerData.email,
        //     phone_number: customerData.phone_number,
        //   }
        // );

        // console.log("Birthday message sent:", message);

        const result = await updateCustomerTierFunc(
          customerData.customer_id,
          "lakme"
        );
        console.log("Customer Tier Updated:", result);

        return res.status(200).json({
          message: "Customer points updated with birthday benefit.",
          data: {
            tier: currentTier,
            points_given: tierPoints,
            expiry_date: expiryDate,
            balance_point: updatedBalancePoint,
          },
          status: 200,
        });
      }
    }

    return res.status(200).json({
      message: "No tier benefits found for the customer's current tier.",
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching customers with birthdays:", error);
    return res.status(500).json({
      message: "An error occurred while processing birthday points.",
      error: error.message,
      status: 500,
    });
  }
};

// export const getTodaysBirthdaysFun = async (store) => {
//   try {
//     // Get today's date in MM-DD format
//     const today = moment().format("MM-DD");

//     // Fetch customers with today's birthday
//     const customersWithBirthdays = await customer.findAll({
//       where: Sequelize.where(
//         Sequelize.fn("SUBSTRING", Sequelize.col("date_of_birth"), 6, 5),
//         today
//       ),
//     });

//     if (!customersWithBirthdays || customersWithBirthdays.length === 0) {
//       return {
//         message: "No customers have a birthday today.",
//         status: 404,
//       };
//     }

//     // Fetch tier management data for the store
//     const tierData = await tier_mangement.findOne({
//       where: { store },
//     });

//     if (!tierData) {
//       return {
//         message: `No tier management data found for store: ${store}.`,
//         status: 404,
//       };
//     }

//     const benefits = tierData.benefits;
//     const processedCustomers = [];

//     // Iterate through customers with birthdays
//     for (const customerData of customersWithBirthdays) {
//       const currentTier = customerData.membership_tier;
//       const oldEarnedPoint = parseInt(customerData.earned_point, 10);
//       const oldRedeemPoint = parseInt(customerData.redeem_point, 10);
//       const oldExpiryPoint = parseInt(customerData.expiry_point, 10);

//       // Determine the benefit points based on the customer's tier
//       const tierBenefit = benefits[currentTier];

//       if (tierBenefit) {
//         const tierPoints = parseInt(tierBenefit.benefit, 10);
//         const expiryDays = parseInt(tierBenefit.expiry, 10);

//         // Calculate the expiry date by adding expiryDays to the current date
//         const expiryDate = moment().add(expiryDays, "days").format("DD-MM-YY");

//         // Recalculate earned and balance points after adding birthday points
//         const updatedEarnedPoint = oldEarnedPoint + tierPoints;
//         const updatedBalancePoint =
//           updatedEarnedPoint - oldRedeemPoint - oldExpiryPoint;

//         // Update the customer's earned and balance points
//         const transitionId = generateTransitionId("benefit_point");

//         await customer.update(
//           {
//             earned_point: updatedEarnedPoint,
//             balance_point: updatedBalancePoint,
//           },
//           { where: { customer_id: customerData.customer_id, store } }
//         );

//         // Create transition record for the birthday points
//         await transition.create({
//           customer_Id: customerData.customer_id,
//           transition_id: transitionId,
//           account_number: customerData.account_number,
//           transition_category: "birthday_points",
//           transition_status: "credit",
//           medium: "desktop",
//           point: tierPoints,
//           expiry_date: expiryDate,
//           note: `Birthday points credited for tier: ${currentTier}`,
//           domain: "lakme.com",
//           name: customerData.first_name,
//           mobile_no: customerData.phone_number,
//           state: customerData.State,
//           city: customerData.city,
//         });

//         // Optionally update metafields for the customer
//         await createMetafieldHelperFunction(customerData.customer_id, {
//           rclupoint: "0",
//           lakme_point: updatedBalancePoint.toString(),
//         });

//         // Trigger a birthday notification
//         const message = await handleNotifications(
//           "happy-birthday",
//           "lakme",
//           {
//             first_name: customerData.first_name,
//             email: customerData.email,
//             phone_number: customerData.phone_number,
//           }
//         );

//         console.log("Birthday message sent:", message);

//         processedCustomers.push({
//           customer_id: customerData.customer_id,
//           tier: currentTier,
//           points_given: tierPoints,
//           expiry_date: expiryDate,
//           balance_point: updatedBalancePoint,
//         });
//       }
//     }

//     if (processedCustomers.length === 0) {
//       return {
//         message: "No tier benefits found for the customers' current tiers.",
//         status: 200,
//       };
//     }

//     return {
//       message: "Customer points updated with birthday benefits.",
//       data: processedCustomers,
//       status: 200,
//     };
//   } catch (error) {
//     console.error("Error fetching customers with birthdays:", error);
//     throw new Error("An error occurred while processing birthday points.");
//   }
// };

export const getTodaysBirthdaysFun = async (store) => {
  try {
    const today = moment().format("MM-DD");

    const customersWithBirthdays = await customer.findAll({
      where: Sequelize.where(
        Sequelize.fn("SUBSTRING", Sequelize.col("date_of_birth"), 6, 5),
        today
      ),
    });

    if (!customersWithBirthdays || customersWithBirthdays.length === 0) {
      return {
        message: "No customers have a birthday today.",
        status: 404,
      };
    }

    const tierData = await tier_mangement.findOne({
      where: { store },
    });

    if (!tierData) {
      return {
        message: `No tier management data found for store: ${store}.`,
        status: 404,
      };
    }

    const benefits = tierData.benefits;
    const processedCustomers = [];

    for (const customerData of customersWithBirthdays) {
      const currentTier = customerData.membership_tier;
      const oldEarnedPoint = parseInt(customerData.earned_point, 10);
      const oldRedeemPoint = parseInt(customerData.redeem_point, 10);
      const oldExpiryPoint = parseInt(customerData.expiry_point, 10);

      const tierBenefit = benefits[currentTier];

      if (tierBenefit) {
        const tierPoints = parseInt(tierBenefit.benefit, 10);
        const expiryDays = parseInt(tierBenefit.expiry, 10);

        const expiryDate = moment()
          .add(expiryDays, "days")
          .format("DD-MM-YYYY");

        const updatedEarnedPoint = oldEarnedPoint + tierPoints;
        const updatedBalancePoint =
          updatedEarnedPoint - oldRedeemPoint - oldExpiryPoint;

        const transitionId = generateTransitionId("benefit_point");

        await customer.update(
          {
            earned_point: updatedEarnedPoint,
            balance_point: updatedBalancePoint,
          },
          { where: { customer_id: customerData.customer_id, store } }
        );

        await transition.create({
          customer_Id: customerData.customer_id,
          transition_id: transitionId,
          account_number: customerData.account_number,
          transition_category: "birthday_points",
          transition_status: "credit",
          medium: "desktop",
          point: tierPoints,
          expiry_date: expiryDate,
          note: `Birthday points credited for tier: ${currentTier}`,
          domain: "lakme.com",
          name: customerData.first_name,
          mobile_no: customerData.phone_number,
          state: customerData.State,
          city: customerData.city,
        });

        // await createMetafieldHelperFunction(customerData.customer_id, {
        //   rclupoint: "0",
        //   lakme_point: updatedBalancePoint.toString(),
        // });

        // const message = await handleNotifications(
        //   "happy-birthday",
        //   "lakme",
        //   {
        //     first_name: customerData.first_name,
        //     email: customerData.email,
        //     phone_number: customerData.phone_number,
        //   }
        // );

        // console.log("Birthday message sent:", message);

        processedCustomers.push({
          customer_id: customerData.customer_id,
          tier: currentTier,
          points_given: tierPoints,
          expiry_date: expiryDate,
          balance_point: updatedBalancePoint,
        });

        // 🔹 Call updateCustomerTierFunc only when points are given
        const result = await updateCustomerTierFunc(
          customerData.customer_id,
          "lakme"
        );
        console.log("Customer Tier Updated:", result);
      }
    }

    if (processedCustomers.length === 0) {
      return {
        message: "No tier benefits found for the customers' current tiers.",
        status: 200,
      };
    }

    return {
      message: "Customer points updated with birthday benefits.",
      data: processedCustomers,
      status: 200,
    };
  } catch (error) {
    console.error("Error fetching customers with birthdays:", error);
    throw new Error("An error occurred while processing birthday points.");
  }
};

// const calculatePointsFromRuleSet = (
//   lineItem,
//   rules,
//   ruleSet,
//   total_price
// ) => {
//   let points = 0;
//   let pointExpiry = null;
//   let creditAfterDays = 0;

//   rules.forEach((rule) => {
//     const matchRule = {
//       point_conversion_online_purchase: () =>
//         parseFloat(rule.purchaseValue) > 0,
//       point_conversion_based_on_sku: () =>
//         rule.product_sku?.trim().toLowerCase() ===
//         lineItem.sku?.trim().toLowerCase(),
//       point_conversion_based_on_category: () =>
//         lineItem.tags.includes(rule.category),
//       twox_reward_online: () =>
//         rule.product_sku?.trim().toLowerCase() ===
//         lineItem.sku?.trim().toLowerCase(),
//     };

//     if (matchRule[ruleSet]?.()) {
//       const purchaseValue = parseFloat(rule.purchaseValue) || 1;
//       points +=
//         ruleSet === "point_conversion_online_purchase"
//           ? Math.floor(
//               (lineItem.line_price / total_price) *
//                 ((total_price / purchaseValue) * parseFloat(rule.points || 0))
//             )
//           : parseFloat(rule.points) || 0;

//       pointExpiry = rule.expiresAfter
//         ? `${rule.expiresAfter} ${rule.expiresType}`
//         : rule.expiresOn;
//       creditAfterDays = parseInt(rule.credit_after_days, 10) || 0;
//     }
//   });

//   return { points, pointExpiry, creditAfterDays };
// };

export const updateCustomerHeldTransitions = async (req, res) => {
  try {
    // Set the current date to 26-02-2025
    // const currentDate = new Date(2025, 1, 26); // Month is 0-indexed, so 1 represents February
    // currentDate.setHours(0, 0, 0, 0); // Reset time to midnight

    // console.log("currentDate", currentDate);

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Reset time to midnight

    console.log("currentDate", currentDate);

    // Fetch all customers
    const customers = await customer.findAll();
    if (!customers || customers.length === 0) {
      return res.status(404).json({ message: "No customers found." });
    }

    // Fetch all transitions with 'hold' status in a single query for optimization
    const heldTransitions = await transition.findAll({
      where: {
        transition_status: "hold",
        point: { [Op.gt]: 0 },
      },
      order: [["createdAt", "ASC"]],
    });

    if (!heldTransitions || heldTransitions.length === 0) {
      return res
        .status(404)
        .json({ message: "No held transitions found for any customer." });
    }

    let totalPointsProcessed = 0;
    const processedCustomers = [];

    // Use Lodash to group transitions by customer ID
    const groupedTransitions = _.groupBy(heldTransitions, "customer_Id");

    for (const customerData of customers) {
      const customerId = customerData.customer_id;

      // Get transitions for the current customer
      const customerTransitions = groupedTransitions[customerId] || [];

      let customerPointsToCredit = 0;
      for (const trans of customerTransitions) {
        const createdAt = new Date(trans.createdAt);
        const creditDays = parseInt(trans.credit_days || "0", 10);
        const creditEligibleDate = new Date(createdAt);
        creditEligibleDate.setDate(creditEligibleDate.getDate() + creditDays);

        if (currentDate >= creditEligibleDate) {
          customerPointsToCredit += parseInt(trans.point, 10);

          // Update transition status to 'credit'
          await transition.update(
            { transition_status: "credit" },
            { where: { id: trans.id } }
          );
        }
      }

      if (customerPointsToCredit > 0) {
        const oldEarnedPoint = parseInt(customerData.earned_point || "0", 10);
        const oldRedeemPoint = parseInt(customerData.redeem_point || "0", 10);
        const oldExpiryPoint = parseInt(customerData.expiry_point || "0", 10);

        const updatedEarnedPoint = oldEarnedPoint + customerPointsToCredit;
        const updatedBalancePoint =
          updatedEarnedPoint - oldRedeemPoint - oldExpiryPoint;

        // Update customer points
        await customer.update(
          {
            balance_point: updatedBalancePoint.toString(),
            earned_point: updatedEarnedPoint.toString(),
          },
          { where: { customer_id: customerId } }
        );

        totalPointsProcessed += customerPointsToCredit;
        processedCustomers.push({
          customerId,
          pointsCredited: customerPointsToCredit,
          updatedPoints: {
            earned_point: updatedEarnedPoint,
            balance_point: updatedBalancePoint,
          },
        });
      }
    }

    if (processedCustomers.length === 0) {
      return res.status(200).json({
        message: "No eligible transitions found for the current date.",
      });
    }

    res.status(200).json({
      message: "Held transitions processed successfully.",
      totalPointsCredited: totalPointsProcessed,
      processedCustomers,
    });
  } catch (error) {
    console.error("Error processing held transitions:", error.message);
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

// export const updateCustomerMembershipTierFinacialYear = async (req, res) => {
//   try {
//     const { store } = req.query; // Assume the store ID or identifier is passed in the query

//     // Fetch tier management data for the specified store
//     const tierData = await tier_mangement.findOne({ where: { store } });
//     if (!tierData) {
//       return res.status(404).json({ message: "Tier management data not found." });
//     }

//     // Ensure start_mangement is parsed correctly
//     const tierManagement =
//       typeof tierData.start_mangement === "string"
//         ? JSON.parse(tierData.start_mangement)
//         : tierData.start_mangement;

//     if (!tierManagement || !tierManagement.welcome) {
//       return res
//         .status(500)
//         .json({ message: "Invalid tier management configuration." });
//     }

//     // Define the date range (October 1st - March 31st)
//     const startDate = new Date(new Date().getFullYear() - 1, 9, 1); // October 1st
//     const endDate = new Date(new Date().getFullYear(), 2, 31); // March 31st

//     // Fetch all customers
//     const customers = await customer.findAll();
//     if (!customers || customers.length === 0) {
//       return res.status(404).json({ message: "No customers found." });
//     }

//     const updatedCustomers = [];

//     for (const customerData of customers) {
//       const customerId = customerData.customer_id;

//       // Fetch transitions for the customer within the date range and required statuses
//       const transitions = await transition.findAll({
//         where: {
//           customer_Id: customerId,
//           transition_status: { [Op.in]: ["credit", "hold"] },
//           createdAt: { [Op.between]: [startDate, endDate] },
//         },
//       });

//       if (!transitions || transitions.length === 0) {
//         console.log(`No transitions found for customer ID: ${customerId}`);
//         continue;
//       }

//       // Calculate the total points from these transitions
//       const totalPoints = transitions.reduce(
//         (sum, trans) => sum + parseInt(trans.point, 10),
//         0
//       );

//       // Determine the new tier based on total points
//       const newTier = Object.keys(tierManagement).find((tier) => {
//         const { start_point, end_point } = tierManagement[tier];
//         return totalPoints >= start_point && totalPoints <= end_point;
//       });

//       if (!newTier) {
//         console.log(`No tier matches for customer ID: ${customerId}`);
//         continue;
//       }

//       // Update the customer's tier if it's different
//       if (customerData.membership_tier.toLowerCase() !== newTier.toLowerCase()) {
//         await customer.update(
//           { membership_tier: newTier },
//           { where: { customer_id: customerId } }
//         );

//         updatedCustomers.push({
//           customerId,
//           previousTier: customerData.membership_tier,
//           newTier,
//           totalPoints,
//         });
//       }
//     }

//     if (updatedCustomers.length === 0) {
//       return res.status(200).json({
//         message: "No customers required tier updates.",
//       });
//     }

//     res.status(200).json({
//       message: "Customer membership tiers updated successfully.",
//       updatedCustomers,
//     });
//   } catch (error) {
//     console.error("Error updating customer membership tiers:", error.message);
//     res.status(500).json({ message: "An error occurred", error: error.message });
//   }
// };

// export const updateCustomerMembershipTierFinacialYear = async (req, res) => {
//   try {
//     const { store } = req.query; // Assume the store ID or identifier is passed in the query

//     // Fetch tier management data for the specified store
//     const tierData = await tier_mangement.findOne({ where: { store } });
//     if (!tierData) {
//       return res.status(404).json({ message: "Tier management data not found." });
//     }

//     const tierManagement =
//       typeof tierData.start_mangement === "string"
//         ? JSON.parse(tierData.start_mangement)
//         : tierData.start_mangement;

//     if (!tierManagement || !tierManagement.welcome) {
//       return res
//         .status(500)
//         .json({ message: "Invalid tier management configuration." });
//     }

//     // Define the date range (October 1st - March 31st)
//     const startDate = new Date(new Date().getFullYear() - 1, 9, 1); // October 1st
//     const endDate = new Date(new Date().getFullYear(), 2, 31); // March 31st

//     // Fetch aggregated points for all customers
//     const aggregatedPoints = await transition.findAll({
//       attributes: [
//         "customer_Id",
//         [
//           Sequelize.literal("SUM(CAST(point AS INT))"), // Convert point from string to integer
//           "totalPoints",
//         ],
//       ],
//       where: {
//         transition_status: { [Op.in]: ["credit"] },
//         createdAt: { [Op.between]: [startDate, endDate] },
//       },
//       group: ["customer_Id"],
//     });

//     if (!aggregatedPoints || aggregatedPoints.length === 0) {
//       return res.status(404).json({ message: "No transitions found for the specified period." });
//     }

//     // Fetch all customers
//     const customers = await customer.findAll();
//     if (!customers || customers.length === 0) {
//       return res.status(404).json({ message: "No customers found." });
//     }

//     // Map aggregated points by customer ID
//     const customerPointsMap = aggregatedPoints.reduce((map, item) => {
//       map[item.customer_Id] = parseInt(item.getDataValue("totalPoints"), 10);
//       return map;
//     }, {});

//     const updatedCustomers = [];

//     for (const customerData of customers) {
//       const customerId = customerData.customer_id;

//       // Get total points for the customer
//       const totalPoints = customerPointsMap[customerId] || 0;

//       // Determine the new tier based on total points
//       const newTier = Object.keys(tierManagement).find((tier) => {
//         const { start_point, end_point } = tierManagement[tier];
//         return totalPoints >= start_point && totalPoints <= end_point;
//       });

//       if (!newTier) {
//         console.log(`No tier matches for customer ID: ${customerId}`);
//         continue;
//       }

//       // Get the current membership tier safely
//       const currentTier = customerData.membership_tier
//         ? customerData.membership_tier.toLowerCase()
//         : "";

//       // Update the customer's tier if it's different
//       if (currentTier !== newTier.toLowerCase()) {
//         await customer.update(
//           { membership_tier: newTier },
//           { where: { customer_id: customerId } }
//         );

//         updatedCustomers.push({
//           customerId,
//           previousTier: customerData.membership_tier || "None",
//           newTier,
//           totalPoints,
//         });
//       }
//     }

//     if (updatedCustomers.length === 0) {
//       return res.status(200).json({
//         message: "No customers required tier updates.",
//       });
//     }

//     res.status(200).json({
//       message: "Customer membership tiers updated successfully.",
//       updatedCustomers,
//     });
//   } catch (error) {
//     console.error("Error updating customer membership tiers:", error.message);
//     res.status(500).json({ message: "An error occurred", error: error.message });
//   }
// };

export const updateCustomerMembershipTierFinacialYear = async (req, res) => {
  try {
    const { store } = req.query; // Assume the store ID or identifier is passed in the query

    // Fetch tier management data for the specified store
    const tierData = await tier_mangement.findOne({ where: { store } });
    if (!tierData) {
      return res
        .status(404)
        .json({ message: "Tier management data not found." });
    }

    const tierManagement =
      typeof tierData.start_mangement === "string"
        ? JSON.parse(tierData.start_mangement)
        : tierData.start_mangement;

    if (!tierManagement || !tierManagement.welcome) {
      return res
        .status(500)
        .json({ message: "Invalid tier management configuration." });
    }

    // Define the date range (October 1st - March 31st)
    const startDate = new Date(new Date().getFullYear() - 1, 9, 1); // October 1st
    const endDate = new Date(new Date().getFullYear(), 2, 31); // March 31st

    // Fetch aggregated points for all customers
    const aggregatedPoints = await transition.findAll({
      attributes: [
        "customer_Id",
        [
          Sequelize.literal("SUM(CAST(point AS INT))"), // Convert point from string to integer
          "totalPoints",
        ],
      ],
      where: {
        transition_status: { [Op.in]: ["credit"] },
        createdAt: { [Op.between]: [startDate, endDate] },
      },
      group: ["customer_Id"],
    });

    if (!aggregatedPoints || aggregatedPoints.length === 0) {
      return res
        .status(404)
        .json({ message: "No transitions found for the specified period." });
    }

    // Fetch all customers
    const customers = await customer.findAll();
    if (!customers || customers.length === 0) {
      return res.status(404).json({ message: "No customers found." });
    }

    // Map aggregated points by customer ID
    const customerPointsMap = aggregatedPoints.reduce((map, item) => {
      map[item.customer_Id] = parseInt(item.getDataValue("totalPoints"), 10);
      return map;
    }, {});

    const updatedCustomers = [];
    const downgradedCustomers = [];

    for (const customerData of customers) {
      const customerId = customerData.customer_id;

      // Get total points for the customer
      const totalPoints = customerPointsMap[customerId] || 0;

      // Determine the new tier based on total points
      const newTier = Object.keys(tierManagement).find((tier) => {
        const { start_point, end_point } = tierManagement[tier];
        return totalPoints >= start_point && totalPoints <= end_point;
      });

      if (!newTier) {
        console.log(`No tier matches for customer ID: ${customerId}`);
        continue;
      }

      // Get the current membership tier safely
      const currentTier = customerData.membership_tier
        ? customerData.membership_tier.toLowerCase()
        : "";

      // Update the customer's tier if it's different
      if (currentTier !== newTier.toLowerCase()) {
        await customer.update(
          { membership_tier: newTier },
          { where: { customer_id: customerId } }
        );

        updatedCustomers.push({
          customerId,
          previousTier: customerData.membership_tier || "None",
          newTier,
          totalPoints,
        });

        // Check for tier downgrade
        if (
          currentTier &&
          Object.keys(tierManagement).indexOf(currentTier) >
            Object.keys(tierManagement).indexOf(newTier)
        ) {
          downgradedCustomers.push({
            first_name: customerData.first_name,
            newTier,
            phone_number: customerData.phone_number,
            email: customerData.email,
          });
        }
      }
    }

    // Send notifications for downgraded customers
    for (const customer of downgradedCustomers) {
      await handleNotifications("tier-downgrade", "lakme", {
        first_name: customer.first_name || "",
        newTier: customer.newTier || "",
        phone_number: customer.phone_number || "",
        email: customer.email || "",
      });
    }

    if (updatedCustomers.length === 0) {
      return res.status(200).json({
        message: "No customers required tier updates.",
      });
    }

    res.status(200).json({
      message: "Customer membership tiers updated successfully.",
      updatedCustomers,
      downgradedCustomers,
    });
  } catch (error) {
    console.error("Error updating customer membership tiers:", error.message);
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

// export const updateExpiryPoints = async (req, res) => {
//   try {
//     const expiredPoints = await sequelize.query(
//       `SELECT id, created_at, expiry_date, point, point_used, point_remaing_used, expiry_status, account_number FROM expiry_points_view`,
//       { type: QueryTypes.SELECT }
//     );

//     if (expiredPoints.length === 0) {
//       return res.status(200).json({ message: "No expired points for today." });
//     }
//     for (const point of expiredPoints) {
//       const {
//         point_used,
//         point_remaing_used,
//         point: totalPoint,
//         account_number,
//         transition_status,
//       } = point;

//       // Skip processing if the transition_status is not "credit"
//       if (transition_status !== "credit") {
//         continue;
//       }

//       // Skip processing if the points are fully used
//       if (point_used === "full_used") {
//         continue;
//       }
//       const customerData = await customer.findOne({
//         where: { account_number: account_number },
//       });

//       if (!customerData) {
//         return res.status(404).json({
//           message: `Customer with account number ${account_number} not found.`,
//         });
//       }
//       let totalExpiryPoints;
//       if (point_used === "partial_used") {
//         totalExpiryPoints = parseInt(point_remaing_used || "0", 10);
//       } else if (point_used === null) {
//         totalExpiryPoints = parseInt(totalPoint || "0", 10);
//       }
//       const oldEarnedPoint = parseInt(customerData.earned_point || "0", 10);
//       const oldRedeemPoint = parseInt(customerData.redeem_point || "0", 10);
//       const oldExpiryPoint = parseInt(customerData.expiry_point || "0", 10);
//       const updatedExpiryPoint = oldExpiryPoint + totalExpiryPoints;
//       const updatedBalancePoint =
//         oldEarnedPoint - oldRedeemPoint - updatedExpiryPoint;
//       await customer.update(
//         {
//           balance_point: updatedBalancePoint.toString(),
//           expiry_point: updatedExpiryPoint.toString(),
//         },
//         { where: { account_number: account_number } }
//       );
//     }
//     res.status(200).json({
//       message: "Expired points processed successfully.",
//       data: expiredPoints,
//     });
//   } catch (error) {
//     console.error("Error processing expired points:", error);
//     res.status(500).json({ error: "Internal server error." });
//   }
// };

// export const updateExpiryPoints = async (req, res) => {
//   try {
//     // Hardcoded date for testing
//     const testingDate = moment("2025-02-04", "YYYY-MM-DD").format("YYYY-MM-DD");
//     console.log("Testing Date (for comparison):", testingDate);

//     // Fetch all transitions and normalize `expiry_date`
//     const allTransitions = await transition.findAll({
//       where: {
//         [Op.or]: [
//           { expiry_status: { [Op.ne]: "processed" } }, // Not processed
//           { expiry_status: null }, // Include null values
//         ],
//       },
//       attributes: [
//         "id",
//         "created_at",
//         "expiry_date",
//         "point",
//         "point_used",
//         "point_remaing_used",
//         "expiry_status",
//         "account_number",
//         "transition_status",
//       ],
//     });

//     // Filter transitions where `expiry_date` is less than or equal to the testing date
//     const expiredPoints = allTransitions.filter((point) => {
//       const formattedExpiryDate = moment(point.expiry_date, "DD-MM-YYYY").format(
//         "YYYY-MM-DD"
//       );
//       return moment(formattedExpiryDate).isSameOrBefore(testingDate);
//     });

//     console.log("Expired Points Query Result:", expiredPoints);

//     if (expiredPoints.length === 0) {
//       return res.status(200).json({ message: "No expired points for today." });
//     }

//     for (const point of expiredPoints) {
//       const {
//         point_used,
//         point_remaing_used,
//         point: totalPoint,
//         account_number,
//         transition_status,
//       } = point;

//       if (transition_status !== "credit") {
//         continue;
//       }

//       if (point_used === "full_used") {
//         continue;
//       }

//       const customerData = await customer.findOne({
//         where: { account_number },
//       });

//       if (!customerData) {
//         console.warn(
//           `Customer with account number ${account_number} not found. Skipping.`
//         );
//         continue;
//       }

//       let totalExpiryPoints;
//       if (point_used === "partial_used") {
//         totalExpiryPoints = parseInt(point_remaing_used || "0", 10);
//       } else if (!point_used) {
//         totalExpiryPoints = parseInt(totalPoint || "0", 10);
//       }

//       const oldEarnedPoint = parseInt(customerData.earned_point || "0", 10);
//       const oldRedeemPoint = parseInt(customerData.redeem_point || "0", 10);
//       const oldExpiryPoint = parseInt(customerData.expiry_point || "0", 10);

//       const updatedExpiryPoint = oldExpiryPoint + totalExpiryPoints;
//       const updatedBalancePoint =
//         oldEarnedPoint - oldRedeemPoint - updatedExpiryPoint;

//       await customer.update(
//         {
//           balance_point: updatedBalancePoint.toString(),
//           expiry_point: updatedExpiryPoint.toString(),
//         },
//         { where: { account_number } }
//       );

//       await transition.update(
//         { expiry_status: "processed" },
//         { where: { id: point.id } }
//       );
//     }

//     res.status(200).json({
//       message: "Expired points processed successfully.",
//       data: expiredPoints,
//     });
//   } catch (error) {
//     console.error("Error processing expired points:", error);
//     res.status(500).json({ error: "Internal server error." });
//   }
// };

export const updateExpiryPoints = async (req, res) => {
  try {
    // Get today's date dynamically in "YYYY-MM-DD" format
    const todayDate = moment().format("YYYY-MM-DD");
    console.log("Today's Date (for comparison):", todayDate);

    // Fetch all transitions where expiry_status is not "processed" or is NULL
    const allTransitions = await transition.findAll({
      where: {
        [Op.or]: [
          { expiry_status: { [Op.ne]: "processed" } },
          { expiry_status: null },
        ],
      },
      attributes: [
        "id",
        "created_at",
        "expiry_date",
        "point",
        "point_used",
        "point_remaing_used",
        "expiry_status",
        "account_number",
        "transition_status",
      ],
    });

    // Convert expiry_date to "YYYY-MM-DD" and filter expired points
    const expiredPoints = allTransitions.filter((point) => {
      if (!point.expiry_date) return false; // Skip if expiry_date is null or undefined

      // Convert "DD-MM-YY" or "DD-MM-YYYY" to "YYYY-MM-DD"
      const formattedExpiryDate = moment(point.expiry_date, [
        "DD-MM-YY",
        "DD-MM-YYYY",
      ]).format("YYYY-MM-DD");

      // Compare with today's date
      return moment(formattedExpiryDate).isSameOrBefore(todayDate);
    });

    console.log("Expired Points Query Result:", expiredPoints);

    if (expiredPoints.length === 0) {
      return res.status(200).json({ message: "No expired points for today." });
    }

    for (const point of expiredPoints) {
      const {
        point_used,
        point_remaing_used,
        point: totalPoint,
        account_number,
        transition_status,
      } = point;

      // // Skip non-credit transactions
      // if (transition_status != "credit") continue;

      // // Skip fully used points
      // if (point_used == "full_used") continue;

      // ✅ Fix: Convert to lowercase for accurate comparison
      if (transition_status.toLowerCase() !== "credit") {
        console.log(
          `Skipping transition ${point.id} (Not a credit transaction)`
        );
        continue;
      }

      // ✅ Fix: Check both point_used & point_remaing_used for "full_used"
      if (point_used === "full_used") {
        console.log(`Skipping transition ${point.id} (Fully used points)`);
        continue;
      }

      const customerData = await customer.findOne({
        where: { account_number },
      });

      if (!customerData) {
        console.warn(
          `Customer with account number ${account_number} not found. Skipping.`
        );
        continue;
      }

      let totalExpiryPoints = 0;
      if (point_used === "partial_used") {
        totalExpiryPoints = parseInt(point_remaing_used || "0", 10);
      } else if (!point_used) {
        totalExpiryPoints = parseInt(totalPoint || "0", 10);
      }

      const oldEarnedPoint = parseInt(customerData.earned_point || "0", 10);
      const oldRedeemPoint = parseInt(customerData.redeem_point || "0", 10);
      const oldExpiryPoint = parseInt(customerData.expiry_point || "0", 10);

      const updatedExpiryPoint = oldExpiryPoint + totalExpiryPoints;
      const updatedBalancePoint =
        oldEarnedPoint - oldRedeemPoint - updatedExpiryPoint;

      // Update customer points
      await customer.update(
        {
          balance_point: updatedBalancePoint.toString(),
          expiry_point: updatedExpiryPoint.toString(),
        },
        { where: { account_number } }
      );

      // Mark the transition as processed
      await transition.update(
        {
          expiry_status: "processed",
          transition_status: "expired",
        },

        { where: { id: point.id } }
      );
    }

    res.status(200).json({
      message: "Expired points processed successfully.",
      data: expiredPoints,
    });
  } catch (error) {
    console.error("Error processing expired points:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const getSubcriptionCheck = async (req, res) => {
  try {
    // Retrieve RuleSetModified data from the database
    const ruleSet = await RuleSetModified.findOne({
      where: { store: "lakme" }, // Filter by store or other criteria
    });

    if (!ruleSet) {
      return res.status(404).json({
        success: false,
        message: "RuleSetModified data not found.",
      });
    }

    // Access twox_reward_online directly (parsed by the getter method)
    const twox_reward_online = ruleSet.twox_reward_online;

    if (!twox_reward_online) {
      return res.status(404).json({
        success: false,
        message: "twox_reward_online data not found in RuleSetModified.",
      });
    }

    // Determine the metafield value based on the status
    const status = twox_reward_online.status;
    const value = status === "active" ? "true" : "false";

    // GraphQL mutation payload
    const data = JSON.stringify({
      query: `mutation {
        productUpdate(input: {
          id: "gid://shopify/Product/8934260506855",
          metafields: [
            {
              namespace: "custom",
              key: "issubscriptionruleset",
              value: "${value}",
              type: "single_line_text_field"
            }
          ]
        }) {
          product {
            metafield(namespace: "custom", key: "issubscriptionruleset") {
              value
              type
            }
          }
        }
      }`,
      variables: {},
    });

    // Axios config for Shopify API
    const configData = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://lakmestaging.myshopify.com/admin/api/2024-07/graphql.json",
      headers: {
        "X-Shopify-Access-Token": shopify_token,
        "Content-Type": "application/json",
        Cookie: "request_method=POST",
      },
      data: data,
    };

    // Execute the Shopify API request
    const response = await axios.request(configData);

    console.log("Shopify Response:", JSON.stringify(response.data));

    // Return success response
    res.status(200).json({
      success: true,
      data: response.data,
      metafield_value: value,
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getMessageCheck = async (req, res) => {
  try {
    // Example data for testing
    const notificationType = "happy-birthday";
    const domain = "lakme";
    const testData = {
      first_name: "Vikas",
      // newTier: "blue",
      phone_number: "+919315229335",
      email: "vikas.swain@ens.enterprises",
    };

    // Call the handleNotifications function
    const response = await handleNotifications(
      notificationType,
      domain,
      testData
    );

    // Respond with success and details
    return res.status(200).json({
      message: "Notification sent successfully.",
      data: response,
    });
  } catch (error) {
    console.error("Error in getMessageCheck:", error.message);
    // Respond with error details
    return res.status(500).json({
      message: "Failed to send notification.",
      error: error.message,
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

//all cron function

const updateExpiryPointsFun = async () => {
  try {
    const todayDate = moment().format("YYYY-MM-DD");
    console.log("Today's Date (for comparison):", todayDate);

    const allTransitions = await transition.findAll({
      where: {
        [Op.or]: [
          { expiry_status: { [Op.ne]: "processed" } },
          { expiry_status: null },
        ],
      },
      attributes: [
        "id",
        "created_at",
        "expiry_date",
        "point",
        "point_used",
        "point_remaing_used",
        "expiry_status",
        "account_number",
        "transition_status",
      ],
    });

    const expiredPoints = allTransitions.filter((point) => {
      if (!point.expiry_date) return false;
      const formattedExpiryDate = moment(point.expiry_date, [
        "DD-MM-YY",
        "DD-MM-YYYY",
      ]).format("YYYY-MM-DD");
      return moment(formattedExpiryDate).isSameOrBefore(todayDate);
    });

    console.log("Expired Points Query Result:", expiredPoints);
    if (expiredPoints.length === 0)
      return { message: "No expired points for today." };

    for (const point of expiredPoints) {
      const {
        point_used,
        point_remaing_used,
        point: totalPoint,
        account_number,
        transition_status,
      } = point;

      if (transition_status.toLowerCase() !== "credit") continue;
      if (point_used === "full_used") continue;

      const customerData = await customer.findOne({
        where: { account_number },
      });
      if (!customerData) continue;

      let totalExpiryPoints =
        point_used === "partial_used"
          ? parseInt(point_remaing_used || "0", 10)
          : parseInt(totalPoint || "0", 10);

      const oldEarnedPoint = parseInt(customerData.earned_point || "0", 10);
      const oldRedeemPoint = parseInt(customerData.redeem_point || "0", 10);
      const oldExpiryPoint = parseInt(customerData.expiry_point || "0", 10);

      const updatedExpiryPoint = oldExpiryPoint + totalExpiryPoints;
      const updatedBalancePoint =
        oldEarnedPoint - oldRedeemPoint - updatedExpiryPoint;

      await customer.update(
        {
          balance_point: updatedBalancePoint.toString(),
          expiry_point: updatedExpiryPoint.toString(),
        },
        { where: { account_number } }
      );

      await transition.update(
        { expiry_status: "processed", transition_status: "expired" },
        { where: { id: point.id } }
      );
    }

    return {
      message: "Expired points processed successfully.",
      data: expiredPoints,
    };
  } catch (error) {
    console.error("Error processing expired points:", error);
    return { error: "Internal server error." };
  }
};

const updateCustomerHeldTransitionsFun = async () => {
  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Reset time to midnight

    console.log("currentDate", currentDate);

    // Fetch all customers
    const customers = await customer.findAll();
    if (!customers || customers.length === 0) {
      console.log("No customers found.");
      return { message: "No customers found." };
    }

    // Fetch all transitions with 'hold' status in a single query for optimization
    const heldTransitions = await transition.findAll({
      where: {
        transition_status: "hold",
        point: { [Op.gt]: 0 },
      },
      order: [["createdAt", "ASC"]],
    });

    if (!heldTransitions || heldTransitions.length === 0) {
      console.log("No held transitions found for any customer.");
      return { message: "No held transitions found for any customer." };
    }

    let totalPointsProcessed = 0;
    const processedCustomers = [];

    // Use Lodash to group transitions by customer ID
    const groupedTransitions = _.groupBy(heldTransitions, "customer_Id");

    for (const customerData of customers) {
      const customerId = customerData.customer_id;

      // Get transitions for the current customer
      const customerTransitions = groupedTransitions[customerId] || [];

      let customerPointsToCredit = 0;
      for (const trans of customerTransitions) {
        const createdAt = new Date(trans.createdAt);
        const creditDays = parseInt(trans.credit_days || "0", 10);
        const creditEligibleDate = new Date(createdAt);
        creditEligibleDate.setDate(creditEligibleDate.getDate() + creditDays);

        if (currentDate >= creditEligibleDate) {
          customerPointsToCredit += parseInt(trans.point, 10);

          // Update transition status to 'credit'
          await transition.update(
            { transition_status: "credit" },
            { where: { id: trans.id } }
          );
        }
      }

      if (customerPointsToCredit > 0) {
        const oldEarnedPoint = parseInt(customerData.earned_point || "0", 10);
        const oldRedeemPoint = parseInt(customerData.redeem_point || "0", 10);
        const oldExpiryPoint = parseInt(customerData.expiry_point || "0", 10);

        const updatedEarnedPoint = oldEarnedPoint + customerPointsToCredit;
        const updatedBalancePoint =
          updatedEarnedPoint - oldRedeemPoint - oldExpiryPoint;

        // Update customer points
        await customer.update(
          {
            balance_point: updatedBalancePoint.toString(),
            earned_point: updatedEarnedPoint.toString(),
          },
          { where: { customer_id: customerId } }
        );

        totalPointsProcessed += customerPointsToCredit;
        processedCustomers.push({
          customerId,
          pointsCredited: customerPointsToCredit,
          updatedPoints: {
            earned_point: updatedEarnedPoint,
            balance_point: updatedBalancePoint,
          },
        });
      }
    }

    if (processedCustomers.length === 0) {
      console.log("No eligible transitions found for the current date.");
      return { message: "No eligible transitions found for the current date." };
    }

    console.log("Held transitions processed successfully.");
    return {
      message: "Held transitions processed successfully.",
      totalPointsCredited: totalPointsProcessed,
      processedCustomers,
    };
  } catch (error) {
    console.error("Error processing held transitions:", error.message);
    throw new Error("An error occurred: " + error.message);
  }
};

const updateIsRedeemCustomerFun = async () => {
  try {
    // Step 1: Update all customers to set is_product_redeem and is_voucher_redeem to 0
    const [updatedCount] = await customer.update(
      {
        is_product_redeem: "0", // Set is_product_redeem to 0
        is_voucher_redeem: "0", // Set is_voucher_redeem to 0
      },
      {
        where: {}, // Empty where condition means "update all rows"
      }
    );

    // Step 2: Return result
    if (updatedCount === 0) {
      return { message: "No customers were updated." };
    }

    return {
      message: `${updatedCount} customers' redeem status has been updated successfully.`,
    };
  } catch (error) {
    console.error("Error updating redeem status:", error);
    return { error: "Internal server error." };
  }
};

const getTodaysBirthdaysFun2 = async () => {
  try {
    // Get today's date in MM-DD format
    const today = moment().format("MM-DD");
    const store = "lakme";

    // Fetch customers with today's birthday
    const customersWithBirthdays = await customer.findAll({
      where: Sequelize.where(
        Sequelize.fn("SUBSTRING", Sequelize.col("date_of_birth"), 6, 5),
        today
      ),
    });

    if (!customersWithBirthdays || customersWithBirthdays.length === 0) {
      return {
        message: "No customers have a birthday today.",
        status: 404,
      };
    }

    // Fetch tier management data for the store
    const tierData = await tier_mangement.findOne({ where: { store } });

    if (!tierData) {
      return {
        message: `No tier management data found for store: ${store}.`,
        status: 404,
      };
    }

    const benefits = tierData.benefits;
    let processedCustomers = [];

    // Iterate through customers with birthdays
    for (const customerData of customersWithBirthdays) {
      const currentTier = customerData.membership_tier;
      const oldEarnedPoint = parseInt(customerData.earned_point, 10);
      const oldRedeemPoint = parseInt(customerData.redeem_point, 10);
      const oldExpiryPoint = parseInt(customerData.expiry_point, 10);

      // Determine the benefit points and expiry days based on the customer's tier
      const tierBenefit = benefits[currentTier];

      if (tierBenefit) {
        const tierPoints = parseInt(tierBenefit.benefit, 10);
        const expiryDays = parseInt(tierBenefit.expiry, 10);

        // Calculate the expiry date by adding expiryDays to the current date
        const expiryDate = moment()
          .add(expiryDays, "days")
          .format("DD-MM-YYYY");

        // Recalculate earned and balance points after adding birthday points
        const updatedEarnedPoint = oldEarnedPoint + tierPoints;
        const updatedBalancePoint =
          updatedEarnedPoint - oldRedeemPoint - oldExpiryPoint;

        // Update the customer's earned and balance points
        const transitionId = generateTransitionId("benefit_point");

        await customer.update(
          {
            earned_point: updatedEarnedPoint,
            balance_point: updatedBalancePoint,
          },
          { where: { customer_id: customerData.customer_id, store } }
        );

        // Create transition record for the birthday points
        await transition.create({
          customer_Id: customerData.customer_id,
          transition_id: transitionId,
          account_number: customerData.account_number,
          transition_category: "birthday_points",
          transition_status: "credit",
          medium: "desktop",
          point: tierPoints,
          expiry_date: expiryDate,
          note: `Birthday points credited for tier: ${currentTier}`,
          domain: "lakme.com",
          name: customerData.first_name,
          mobile_no: customerData.phone_number,
          state: customerData.State,
          city: customerData.city,
        });

        // Optionally update metafields for the customer
        // await createMetafieldHelperFunction(customerData.customer_id, {
        //   rclupoint: "0",
        //   lakme_point: updatedBalancePoint.toString(),
        // });

        // const message = await handleNotifications(
        //   "happy-birthday",
        //   "lakme",
        //   {
        //     first_name: customerData.first_name,
        //     email: customerData.email,
        //     phone_number: customerData.phone_number,
        //   }
        // );

        // console.log("Birthday message sent:", message);

        const result = await updateCustomerTierFunc(
          customerData.customer_id,
          "lakme"
        );
        console.log("Customer Tier Updated:", result);

        processedCustomers.push({
          customer_id: customerData.customer_id,
          tier: currentTier,
          points_given: tierPoints,
          expiry_date: expiryDate,
          balance_point: updatedBalancePoint,
        });
      }
    }

    return {
      message: processedCustomers.length
        ? "Customer points updated with birthday benefit."
        : "No tier benefits found for the customer's current tier.",
      status: 200,
      data: processedCustomers,
    };
  } catch (error) {
    console.error("Error fetching customers with birthdays:", error);
    return {
      message: "An error occurred while processing birthday points.",
      error: error.message,
      status: 500,
    };
  }
};

// end all cron function


export const find_campaign_customer = async (req, res) => {
  try {
    const { campaign_id, store } = req.body;
    console.log(" req.body", req.body)

    if (!campaign_id || !store) {
      return res.status(400).json({
        message: "Campaign ID and store are required.",
        status: 400,
      });
    }

    const find_data= await customer_campaign_data.findAll({
      where: {
        campagin_id:campaign_id,
        store,
      },
    });
    //

    if (!find_data || find_data.length === 0) {
      return res.status(404).json({
        message: "No matching campaign data found.",
        status: 404,
      });
    }

    return res.status(200).json({
      message: "Campaign data retrieved successfully.",
      data: find_data,
      totalRecords: find_data.length,
      status: 200,
    });
  } catch (error) {
    console.error("Error retrieving campaign data:", error);
    return res.status(500).json({
      message: "An error occurred while retrieving campaign data.",
      error: error.message,
      status: 500,
    });
  }
};