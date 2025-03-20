import {
  responseHandler,
  errorHandler,
  statusMaker,
  apiMessages,
  campaign,
  accessSchema,
  storeHandler,
  checkEmptyArray,
  campaign_new,
  config
} from "./index";
import axios from "axios";

export const create = async (req, res) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      productName,
      productWeightage,
      pointType,
      welcome,
      blue,
      product_id,
      status,
      gold,
      silver,
      platinum,
      store,
    } = req.body;

    if (!name) {
      return res.status(statusMaker.badRequest).json({
        message: "Name is required.",
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

    // const { shopname, access_token } = storeCredentials;
    const productsData = await axios({
      url: `https://lakmestaging.myshopify.com/admin/api/2021-01/products.json?status=active`,
      method: "GET",
      headers: {
        "X-Shopify-Access-Token":  config.shopify_token,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    // const multiplier = {
    //   welcome: welcome || 0,
    //   blue: blue || 0,
    //   gold: gold || 0,
    //   silver: silver || 0,
    //   platinum: platinum || 0,
    // };

    const product = productsData.data.products.find(
      (prod) => prod.title === productName
    );

    if (!product) {
      return res.status(statusMaker.notFound).json({
        message: `Product with name "${productName}" not found.`,
      });
    }

    // const basePrice = parseFloat(product.variants[0].price);
    // const finalPriceWelcome =
    //   pointType === "Multiplier"
    //     ? (basePrice * multiplier.welcome).toFixed(2)
    //     : null;
    // const finalPriceBlue =
    //   pointType === "Multiplier"
    //     ? (basePrice * multiplier.blue).toFixed(2)
    //     : null;
    // const finalPriceGold =
    //   pointType === "Multiplier"
    //     ? (basePrice * multiplier.gold).toFixed(2)
    //     : null;
    // const finalPricePlatinum =
    //   pointType === "Multiplier"
    //     ? (basePrice * multiplier.platinum).toFixed(2)
    //     : null;
    // const finalPriceSilver =
    //   pointType === "Multiplier"
    //     ? (basePrice * multiplier.silver).toFixed(2)
    //     : null;

    const newCampaign = await campaign.create({
      name,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      productName,
      productWeightage,
      pointType,
      welcome,
      blue,
      gold,
      silver,
      product_id,
      status,
      platinum,
      store: processedStore,
    });

    const response = responseHandler(
      statusMaker.created,
      apiMessages.create,
      newCampaign
    );

    return res.status(statusMaker.created).json(response);
  } catch (error) {
    console.error(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const createModified = async (req, res) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      productName,
      productWeightage,
      pointType,
      welcome,
      blue,
      product_id,
      status,
      gold,
      silver,
      platinum,
      store,
      source_of_device,
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(statusMaker.badRequest).json({
        message: "Name is required.",
      });
    }

    if (!store) {
      return res.status(statusMaker.badRequest).json({
        message: "Store information is required.",
      });
    }

    // Process the `store` field
    const processedStore = store

 // Create a new record in the module table
    const newModule = await campaign.create({
      name,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      productName,
      productWeightage,
      pointType,
      welcome,
      blue,
      product_id,
      status,
      gold,
      silver,
      platinum,
      store: processedStore,
      source_of_device,
    });
    const response = responseHandler(
      statusMaker.created,
      apiMessages.create,
      newModule
    );

    return res.status(statusMaker.created).json(response);
  } catch (error) {
    console.error("Error in createModified:", error);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const createModified_new = async (req, res) => {
  try {
    const {
      id,
      name,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      product_detail,
      pointType,
      welcome,
      blue,
      status,
      gold,
      silver,
      platinum,
      store,
      source_of_device,
    } = req.body;

    // Prepare campaign data
    const campaignData = {
      product_detail: JSON.stringify(product_detail),
      name,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      pointType,
      welcome,
      blue,
      status,
      gold,
      silver,
      platinum,
      store,
      source_of_device,
    };

    let tier;

    // Check if the campaign exists by ID for update
    if (id) {
      tier = await campaign_new.findOne({ where: { id } });

      if (tier) {
        await tier.update(campaignData);
        return res
          .status(statusMaker.updated)
          .json(responseHandler(statusMaker.updated, apiMessages.update, tier));
      }
    }

    // Create a new campaign if no existing ID
    const newTier = await campaign_new.create(campaignData);

    // Send successful creation response
    return res
      .status(statusMaker.created)
      .json(responseHandler(statusMaker.created, apiMessages.create, newTier));
  } catch (error) {
    // Handle errors
    console.error("Error in createOrUpdateCampaign:", error);
    return res
      .status(statusMaker.internalError)
      .json(errorHandler(error));
  }
};


export const getProductShopify = async (req, res) => {
  try {
    const productsData = await axios({
      url: `https://lakmestaging.myshopify.com/admin/api/2021-01/products.json?status=active`,
      method: "GET",
      headers: {
        "X-Shopify-Access-Token":config.shopify_token,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    if (!productsData || !productsData.data) {
      return res.status(statusMaker.notFound).json({
        message: "No products found.",
      });
    }
    const response = responseHandler(
      statusMaker.success,
      apiMessages.fetch,
      productsData.data
    );

    return res.status(statusMaker.success).json(response);
  } catch (error) {
    console.error("Error fetching Shopify products:", error);

    // Handle errors
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const update = async (req, res) => {
  try {
    const { store,id } = req.query;
    const {
      name,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      productName,
      productWeightage,
      pointType,
      welcome,
      blue,
      gold,
      silver,
      platinum,
      status,
    } = req.body;
    const processedStore = await storeHandler(store);
    const existingCampaign = await campaign.findOne({
      where: { id, store: processedStore },
    });

    if (!existingCampaign) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingCampaign
      );
      return res.status(statusMaker.notFound).json(response);
    }
    const updatedModule = await campaign.update(
      {
        name,
        description,
        startDate,
        endDate,
        startTime,
        endTime,
        productName,
        productWeightage,
        pointType,
        welcome,
        blue,
        gold,
        silver,
        platinum,
        store,
        status
      },
      {
        where: { id, store: processedStore },
      }
    );
    const response = responseHandler(
      statusMaker.updated,
      apiMessages.update,
      updatedModule
    );
    res.status(statusMaker.updated).json(response);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    res.status(statusMaker.internalError).json(response);
  }
};

export const deleted = async (req, res) => {
  try {
    const { id,store } = req.query;
    const processedStore = await storeHandler(store);
    const existingCampaign = await campaign_new.findOne({ where: { id,store: processedStore } });
    if (!existingCampaign) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingCampaign
      );
      return res.status(statusMaker.notFound).json(response);
    }
    await campaign_new.destroy({
      where: { id,store: processedStore },
    });
    const response = responseHandler(statusMaker.deleted, apiMessages.deleted, {
      id,
      store: processedStore
    });
    return res.status(statusMaker.deleted).json(response);
  } catch (error) {
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const getById = async (req, res) => {
  try {
    const { id } = req.query;
    const existingCampaign = await campaign.findOne({ where: { id } });
    if (!existingCampaign) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingCampaign
      );
      return res.status(statusMaker.notFound).json(response);
    }
    const response = responseHandler(
      statusMaker.found,
      apiMessages.found,
      existingCampaign
    );
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const list = async (req, res) => {
  try {
    const { store } = req.query;
    const processedStore = await storeHandler(store);
    const campaignData = await campaign.findAll({
      where: {
        store: processedStore,
      },
    });
    if (checkEmptyArray(campaignData)) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        campaignData
      );
      return res.status(statusMaker.notFound).json(response);
    }
    const response = responseHandler(
      statusMaker.found,
      apiMessages.found,
      campaignData
    );
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const list_new = async (req, res) => {
  try {
    const { store } = req.query;
    const processedStore = await storeHandler(store);
    const campaignData = await campaign_new.findAll({
      where: {
        store: processedStore,
      },
    });
    if (checkEmptyArray(campaignData)) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        campaignData
      );
      return res.status(statusMaker.notFound).json(response);
    }
    const response = responseHandler(
      statusMaker.found,
      apiMessages.found,
      campaignData
    );
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

// export const getProductShopify = async (req, res) => {
//   try {
//     // Fetch products from Shopify
//     const productsData = await axios({
//       url: `https://lakmestaging.myshopify.com/admin/api/2021-01/products.json?status=active`,
//       method: "GET",
//       headers: {
//         "X-Shopify-Access-Token": config.shopify_token,
//         Accept: "application/json",
//         "Content-Type": "application/json",
//       },
//     });

//     // Check if products data exists
//     if (!productsData || !productsData.data || !productsData.data.products) {
//       return res.status(statusMaker.notFound).json({
//         message: "No products found.",
//       });
//     }

//     const allProducts = productsData.data.products;

//     // Fetch active campaign data for the specified store
//     const activeCampaigns = await campaign.findAll({
//       attributes: ["product_id", "status"], // Fetch product_id and status
//       where: {
//         store: "rajnigandha", // Replace with dynamic store if needed
//         status: "active", // Fetch only active campaigns
//       },
//     });

//     // Extract active product IDs from the campaign data
//     const activeProductIds = activeCampaigns.map((campaign) => campaign.product_id);

//     // Filter Shopify products, excluding those with active product_ids
//     const filteredProducts = allProducts.filter(
//       (product) => !activeProductIds.includes(product.id.toString())
//     );

//     // Prepare response
//     const response = responseHandler(
//       statusMaker.success,
//       apiMessages.fetch,
//       filteredProducts
//     );

//     return res.status(statusMaker.success).json(response);
//   } catch (error) {
//     console.error("Error fetching Shopify products:", error);

//     // Handle errors
//     const response = errorHandler(error);
//     return res.status(statusMaker.internalError).json(response);
//   }
// };

// export async function createCampaign(req,res){
//     try{
//         const {campaignName,campaignDescription,startDate,endDate,startTime,endTime,productName,productWeightage,status,pointType,welcome,blue,silver,gold,platinum}=req.body;
//         const data=req.body
//         const campaignExist = await campaign.findOne({ where: { productName: productName, startDate: startDate, endDate:endDate} });
//         if(campaignExist)
//         {
//             const response = responseHandler(
//                 statusMaker.found,
//                 "This campaign already exist",
//                 campaignExist
//               );

//               return res.status(statusMaker.found).json(response);
//         }
//         await campaign.create(data);

//         const response = responseHandler(statusMaker.created, apiMessages.create, data);
//         return res.status(statusMaker.created).json(response);
//     }
//     catch (error) {
//         console.error("Error in create campaign:", error.message);
//         const response = errorHandler(error);
//         return res.status(statusMaker.internalError).json(response);
//     }

// }

// export async function getCampaign(req,res){
//     try{
//         const data=await campaign.findAll();
//         if(data.length==0){
//             return res
//             .status(statusMaker.notFound)
//             .json(responseHandler(statusMaker.notFound, apiMessages.notFound));
//         }
//         const response = responseHandler(statusMaker.found, apiMessages.found, data);
//         return res.status(statusMaker.found).json(response);
//     }
//     catch (error) {
//         console.error("Error in create campaign:", error.message);
//         const response = errorHandler(error);
//         return res.status(statusMaker.internalError).json(response);
//     }
// }

// export async function updateCampaign(req,res){
//     try{
//         const { status, id } = req.body;
//         const campaignExist = await campaign.findOne({ where: { id: id} });
//         if(campaignExist){
//             const updated = await campaign.update({status:status}, {
//                 where: { id: id },
//               });
//             const updatedData = await campaign.findOne({
//                 where: { id: id },
//             });
//             const response = responseHandler(
//                   statusMaker.updated,
//                   "Campaign status updated successfully",
//                   updatedData
//             );
//             return res.status(statusMaker.updated).json(response);
//         }
//         else{
//             return res
//             .status(statusMaker.notFound)
//             .json(responseHandler(statusMaker.notFound, apiMessages.notFound));
//         }

//     }
//     catch (error) {
//         console.error("Error in update status campaign:", error.message);
//         const response = errorHandler(error);
//         return res.status(statusMaker.internalError).json(response);
//     }

// }
