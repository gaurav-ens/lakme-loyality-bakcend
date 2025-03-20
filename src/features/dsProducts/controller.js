import axios from "axios"
// import { apiMessages, customer, errorHandler } from "../voucher";
import path from 'path'
import fs from 'fs'
import {
    // apiMessages,
    redeemProduct,
    // checkEmptyArray, 
    responseHandler,
    statusMaker,
    storeHandler,
    // tag, 
    order_redeem_product,
    dsProduct,
    // category, 
    accessSchema,
    transition,
    point,
    sendSMSOTPVoucher,
    apiMessages,
    customer,
    errorHandler,
    order,
    sendOrderPdfOverMail
} from './index'
import moment from "moment";
// import { DateTime } from "../shipping";
// import crypto from 'crypto'

// const shopName = "lakmestaging.myshopify.com";


// export const fetchDSShopifyProducts = async (req, res) => {
//     try {
//         const { store } = req.query
//         const processedStore = await storeHandler(store)
//         console.log("processedStore-------", processedStore);
//         const dbProducts = await dsProduct.findAll({ where: { store: processedStore } });

//         if (checkEmptyArray(dbProducts)) {
//             const resp = responseHandler(statusMaker.notFound, "Products empty", dbProducts)
//             return res.status(statusMaker.success).json(resp)
//         }
//         const resp = responseHandler(statusMaker.found, "Products fetched successfully", dbProducts)
//         return res.status(statusMaker.found).json(resp)

//     } catch (error) {
//         const resp = errorHandler(error)
//         return res.status(statusMaker.internalError).json(resp)
//     }
// };

// export const addDSShopifyProducts = async (req, res) => {
//     try {
//         let { store } = req.query;
//         if (!store) {
//             return res.status(statusMaker.badRequest).json({
//                 message: "Store query parameter is required.",
//             });
//         }
//         // const processedStore = await storeHandler(store)
//         const storeCredentials = await accessSchema.findOne({ where: { store } });

//         if (!storeCredentials) {
//             return res.status(statusMaker.notFound).json({
//                 message: "Store credentials not found.",
//             });
//         }

//         const { shopname, access_token } = storeCredentials;
//         const query = `
//             {
//                 products(first: 10, query: "status:active") {
//                     edges {
//                         node {
//                             id
//                             title
//                             bodyHtml
//                             tags
//                             variants(first: 1) {
//                                 edges {
//                                     node {
//                                         id
//                                         sku
//                                         price
//                                         inventoryQuantity
//                                         weight
//                                         weightUnit
//                                     }
//                                 }
//                             }
//                             metafields(first: 100) {
//                                 edges {
//                                     node {
//                                         namespace
//                                         key
//                                         value
//                                     }
//                                 }
//                             }
//                             images(first: 5) {
//                                 edges {
//                                     node {
//                                         src
//                                     }
//                                 }
//                             }
//                             collections(first: 1) {
//                                 edges {
//                                     node {
//                                         title
//                                     }
//                                 }
//                             }
//                         }
//                     }
//                 }
//             }
//         `;

//         // Fetch products from Shopify
//         const response = await axios({
//             url: `https://${shopname}/admin/api/2024-01/graphql.json`,
//             method: 'POST',
//             headers: {
//                 'X-Shopify-Access-Token': access_token,
//                 'Content-Type': 'application/json',
//             },
//             data: JSON.stringify({ query }),
//         });
//         console.log("response-------", response);

//         if (!response.data || !response.data.data || !response.data.data.products) {
//             const resp = responseHandler(statusMaker.internalError, "No products data found in response", [])
//             return res.status(statusMaker.internalError).json(resp)
//         }

//         for (const edge of response.data.data.products.edges) {
//             const product = edge.node;
//             const variant = product.variants.edges[0]?.node;
//             const inventoryQuantity = variant?.inventoryQuantity || 0;
//             const netWeight = `${variant?.weight || ''} ${variant?.weightUnit || ''}`;

//             // Get product images
//             const mainImage = product.images.edges[0]?.node?.src || '';
//             const thumbnailImage = product.images.edges[0]?.node?.src || '';

//             // Get metafields
//             const metafields = product.metafields.edges.map((meta) => ({
//                 namespace: meta.node.namespace,
//                 key: meta.node.key,
//                 value: meta.node.value,
//             }));
//             const minCappingMetafield = metafields.find((meta) => meta.key === "product_min_capping");
//             const maxCappingMetafield = metafields.find((meta) => meta.key === "product_max_capping");
//             const rewardPointsMetafield = metafields.find((meta) => meta.key === "reward_points");

//             const productMinCapping = minCappingMetafield ? parseInt(minCappingMetafield.value) : 0;
//             const productMaxCapping = maxCappingMetafield ? parseInt(maxCappingMetafield.value) : 0;
//             const rewardPoints = rewardPointsMetafield ? parseInt(rewardPointsMetafield.value) : 0;

//             // Get category (collections) data
//             const categoryName = product.collections.edges.length > 0
//                 ? product.collections.edges[0].node.title
//                 : 'Uncategorized';
//             console.log("=========++++++++++++", product.id, product.id.split('/').pop(), typeof (product.id.split('/').pop()));

//             const checkProduct = await dsProduct.findOne({ where: { productId: product.id } });
//             console.log("checkProduct---------", checkProduct);

//             if (!checkProduct) {
//                 await dsProduct.create({
//                     productId: product.id.split('/').pop(),
//                     productName: product.title,
//                     productSKU: variant?.sku || '',
//                     productImage: mainImage,
//                     categoryName,
//                     tagName: product.tags.join(', ') || '',
//                     availableQuantity: inventoryQuantity,
//                     totalQuantity: inventoryQuantity,
//                     minQuantity: productMinCapping,
//                     maxQuantity: productMaxCapping,
//                     rewarPoints: rewardPoints,
//                     startDate: new Date(),
//                     endDate: new Date(2024, 11, 31),
//                     stock: inventoryQuantity > 0 ? 'Yes' : 'No',
//                     netWeight,
//                     details: product.bodyHtml || '',
//                     description: product.bodyHtml || '',
//                     thumbnailImage,
//                     notified: false,
//                     updateByStaff: 'superAdmin',
//                     status: 'active',
//                     store: store
//                 });
//             } else {
//                 await dsProduct.update({
//                     productName: product.title,
//                     productSKU: variant?.sku || '',
//                     productImage: mainImage,
//                     categoryName,
//                     tagName: product.tags.join(', ') || '',
//                     availableQuantity: inventoryQuantity,
//                     totalQuantity: inventoryQuantity,
//                     minQuantity: productMinCapping,
//                     maxQuantity: productMaxCapping,
//                     rewardPoints,
//                     startDate: new Date(),
//                     endDate: '',
//                     stock: inventoryQuantity > 0 ? 'Yes' : 'No',
//                     netWeight,
//                     details: product.bodyHtml || '',
//                     description: product.bodyHtml || '',
//                     thumbnailImage,
//                     notified: false,
//                     updateByStaff: 'superAdmin',
//                     status: 'active',
//                     store: store
//                 }, { where: { productId: product.id.split('/').pop() } });

//             }
//         }
//         console.log("--------------");

//         const dbProducts = await dsProduct.findAll({ where: { store: store } });

//         const resp = responseHandler(statusMaker.found, "Products fetched successfully", dbProducts)
//         return res.status(statusMaker.found).json(resp)
//     } catch (error) {
//         console.log("err------", error);
//         const resp = errorHandler(error)
//         return res.status(statusMaker.internalError).json(resp)
//     }
// };

// export const getProductById = async (req, res) => {
//     try {
//         const { productId, store } = req.query
//         const processedStore = await storeHandler(store)
//         console.log("processedStore---", processedStore);

//         if (!productId) {
//             const resp = responseHandler(statusMaker.badRequest, "Missing productId", [])
//             return res.status(statusMaker.badRequest).json(resp)
//         }
//         const getData = await dsProduct.findOne({ where: { id: productId, store: processedStore } })

//         if (!getData) {
//             const resp = responseHandler(statusMaker.notFound, "Product not found ", [])
//             return res.status(statusMaker.success).json(resp)
//         }
//         const resp = responseHandler(statusMaker.found, "Product fetched successfully", getData)
//         return res.status(statusMaker.found).json(resp)
//     } catch (error) {
//         console.log("err-------", error);
//         const resp = errorHandler(error)
//         return res.status(statusMaker.internalError).json(resp)
//     }
// }

// export const updateDSProducts = async (req, res) => {
//     try {
//         const { productId, status, description, details, store } = req.body
//         const processedStore = await storeHandler(store)
//         console.log("processedStore---", processedStore);

//         if (!(status || description || details)) {
//             const resp = responseHandler(statusMaker.badRequest, "Missing required fields", [])
//             return res.status(statusMaker.internalError).json(resp)
//         }
//         let updateData = await dsProduct.update({ status, description, details }, {
//             where: {
//                 id: productId,
//                 store: processedStore
//             }
//         })

//         if (updateData[0] == 1) {
//             const resp = responseHandler(statusMaker.found, "dsProduct updated successfully", updateData)
//             return res.status(statusMaker.found).json(resp)
//         }
//         const resp = responseHandler(statusMaker.internalError, "dsProduct not updated successfully", [])
//         return res.status(statusMaker.internalError).json(resp)
//     } catch (error) {
//         console.log("err---------", error);
//         const resp = errorHandler(error)
//         return res.status(statusMaker.internalError).json(resp)
//     }
// }

// function generateOrderId() {
//     const minDigits = 10;
//     const maxDigits = 12;

//     const min = Math.pow(10, minDigits - 1);
//     const max = Math.pow(10, maxDigits) - 1;

//     const randomBytes = crypto.randomBytes(8).toString("hex");
//     const randomNumber = BigInt("0x" + randomBytes) % BigInt(max - min + 1);
//     return (BigInt(min) + randomNumber).toString();
// }

// export const addProduct = async (req, res) => {
//     try {
//         const { productName, productSku, rewardPoints, netWeight, showProduct, startDate, endDate, showCategory
//             , showTag, minQuantity, maxQuantity, details, description, store, stock }
//             = req.body

//         const website = await storeHandler(store)
//         if (!productName || !productSku || !rewardPoints || !netWeight || !startDate | !endDate || !minQuantity
//             || !maxQuantity || !showTag || !showCategory) {
//             const resp = responseHandler(statusMaker.badRequest, "Missing required fields")
//             return res.status(statusMaker.badRequest).json(resp)
//         }
//         let checktag = await tag.findOne({ where: { name: showTag } })
//         let checkCategory = await category.findOne({ where: { name: showCategory } })

//         if (!checktag) {
//             checktag = { name: 'other' }
//         }
//         if (!checkCategory) {
//             checkCategory = { name: 'other' }
//         }

//         let productImagePath = req.files.productImage ? req.files.productImage[0].path : '';
//         let thumbnailImages = req.files.productThumbnail
//             ? req.files.productThumbnail.map(file => file.path).join(',') // Convert to comma-separated string
//             : '';

//         const newProduct = await dsProduct.create({
//             productName,
//             productId: generateOrderId(),
//             productSKU: productSku,
//             productImage: productImagePath,
//             status: showProduct,
//             categoryName: checkCategory.name,
//             tagName: checktag.name,
//             availableQuantity: 1,
//             totalQuantity: 1,
//             minQuantity,
//             maxQuantity,
//             rewarPoints: rewardPoints,
//             stock,
//             netWeight,
//             details,
//             description,
//             thumbnailImage: thumbnailImages,
//             updateByStaff: 'superAdmin',
//             createdAt: DateTime(),
//             updatedAt: DateTime(),
//             startDate: new Date(startDate),
//             endDate: new Date(endDate),
//             store: website,
//         })
//         console.log("newProduct------------", newProduct);

//         if (!newProduct) {
//             const resp = responseHandler(statusMaker.internalError, "product not added")
//             return res.status(statusMaker.internalError).json(resp)
//         }
//         const resp = responseHandler(statusMaker.created, apiMessages.create, newProduct)
//         return res.status(statusMaker.created).json(resp)
//     } catch (error) {
//         console.log("err-----", error);
//         const resp = errorHandler(error)
//         return res.status(statusMaker.internalError).json(resp)
//     }
// }

// export const updateProduct = async (req, res) => {
//     try {
//         const { productId, productName, productSku, productRewardPoints, netWeight, startDate, endDate,
//             status, stock, availableQuantity, totalQuantity, category, tag,
//             minQuantity, maxQuantity, description, details, store } = req.body
//         const website = await storeHandler(store)

//         const updatepro = await dsProduct.update({
//             productName: productName,
//             productSKU: productSku,
//             status: status,
//             categoryName: category,
//             tagName: tag,
//             availableQuantity: availableQuantity,
//             totalQuantity: totalQuantity,
//             minQuantity: minQuantity,
//             maxQuantity: maxQuantity,
//             rewarPoints: productRewardPoints,
//             stock: stock,
//             netWeight: netWeight,
//             details: details,
//             description: description,
//             startDate, endDate
//         }, { where: { id: productId, store: website } })

//         if (!updatepro) {
//             const resp = responseHandler(statusMaker.internalError, apiMessages.errorOccurred)
//             return res.status(statusMaker.internalError).json(resp)
//         }
//         const resp = responseHandler(statusMaker.updated, apiMessages.update, updatepro)
//         return res.status(statusMaker.updated).json(resp)
//     } catch (error) {
//         console.log("error-----------", error);
//         const resp = errorHandler(error)
//         return res.status(statusMaker.internalError).json(resp)
//     }
// }

// export const deleteProduct = async (req, res) => {
//     try {
//         const { store, productId } = req.query
//         const processedStore = await storeHandler(store)

//         if (!productId) {
//             const resp = responseHandler(statusMaker.badRequest, "Missing productId", [])
//             return res.status(statusMaker.badRequest).json(resp)
//         }
//         const checkProduct = await dsProduct.findOne({ where: { id: productId, store: processedStore } })

//         if (!checkProduct || checkProduct == '' || checkProduct == 'undefined') {
//             const resp = responseHandler(statusMaker.badRequest, "Product not exist with this id")
//             return res.status(statusMaker.badRequest).json(resp)
//         }
//         await dsProduct.destroy({ where: { id: productId, store: processedStore } })
//         const resp = responseHandler(statusMaker.success, "dsProduct deleted successfully", [])
//         return res.status(statusMaker.success).json(resp)
//     } catch (error) {
//         const resp = errorHandler(error)
//         return res.status(statusMaker.internalError).json(resp)
//     }
// }

// export const filterProduct = async (req, res) => {
//     try {
//         const { startDate, endDate, store } = req.query
//         const processedStore = await storeHandler(store)
//         if (!startDate || !endDate) {
//             const resp = responseHandler(statusMaker.badRequest, "Missing required fields", [])
//             return res.status(statusMaker.badRequest).json(resp)
//         }
//         const formatStartDate = new Date(startDate)
//         const formatEndDate = new Date(endDate)
//         formatEndDate.setHours(23, 59, 59, 999);

//         const filterPd = await dsProduct.findAll({
//             where: {
//                 createdAt: {
//                     [Op.between]: [formatStartDate, formatEndDate], // Using the 'between' operator
//                 },
//                 store: processedStore
//             }
//         })
//         if (filterPd) {
//             const resp = responseHandler(statusMaker.found, "product fetched successfully", filterPd)
//             return res.status(statusMaker.found).json(resp)
//         }
//         const resp = responseHandler(statusMaker.notFound, "product not found", [])
//         return res.status(statusMaker.success).json(resp)
//     } catch (error) {
//         const resp = errorHandler(error.message)
//         return res.status(statusMaker.internalError).json(resp)
//     }
// }

// --------------------Product Category---------------------------------
// export const addCategory = async (req, res) => {
//     try {
//         const { categoryName, categoryStatus, store } = req.body
//         const website = await storeHandler(store)
//         if (!categoryName || !categoryStatus) {
//             const resp = responseHandler(statusMaker.badRequest, apiMessages.errorOccurred)
//             return res.status(statusMaker.badRequest).json(resp)
//         }
//         const newCategory = await category.create({ name: categoryName, status: categoryStatus, store: website })
//         if (newCategory) {
//             const resp = responseHandler(statusMaker.created, apiMessages.create, newCategory)
//             return res.status(statusMaker.created).json(resp)
//         }
//         const resp = responseHandler(statusMaker.internalError, apiMessages.errorOccurred)
//         return res.status(statusMaker.internalError).json(resp)
//     } catch (error) {
//         const resp = errorHandler(error.message)
//         return res.status(statusMaker.internalError).json(resp)
//     }
// }

// export const fetchCategoriesFromDB = async (req, res) => {
//     try {
//         const { store } = req.query
//         const processedStore = await storeHandler(store)
//         console.log("processedStore---", processedStore);
//         const allCategories = await category.findAll({ where: { store: processedStore } })
//         if (allCategories) {
//             const response = responseHandler(statusMaker.found, "category fetched successfully", allCategories)
//             return res.status(statusMaker.found).json(response)
//         } else {
//             const response = apiMessages.notFound
//             return res.status(statusMaker.success).json(response)
//         }
//     }
//     catch (error) {
//         const response = errorHandler(error)
//         return res.status(statusMaker.internalError).json(response)
//     }
// }

// export const fetchDSCategories = async (req, res) => {
//     try {
//         const { store } = req.query
//         const processedStore = await storeHandler(store)
//         console.log("processedStore---", processedStore);
//         if (!store) {
//             return res.status(statusMaker.badRequest).json({
//                 message: "Store query parameter is required.",
//             });
//         }
//         // const processedStore = await storeHandler(store)
//         const storeCredentials = await accessSchema.findOne({ where: { store: processedStore } });

//         if (!storeCredentials) {
//             return res.status(statusMaker.notFound).json({
//                 message: "Store credentials not found.",
//             });
//         }

//         const { shopname, access_token } = storeCredentials;

//         const query = `
//         query {
//           collections(first: 50) {
//             nodes {
//               id
//               title
//             }
//           }
//         }
//       `;

//         const categoriesData = await axios({
//             url: `https://${shopname}/admin/api/2021-01/graphql.json`,
//             method: "POST",
//             headers: {
//                 "X-Shopify-Access-Token": access_token,
//                 Accept: "application/json",
//                 "Content-Type": "application/json",
//             },
//             data: JSON.stringify({ query }),
//         });

//         if (!categoriesData.data || !categoriesData.data.data || !categoriesData.data.data.collections) {
//             const response = errorHandler("No collections data found in Shopify response")
//             return res.status(statusMaker.success).json(response)
//         }

//         const categories = categoriesData.data.data.collections.nodes;

//         if (categories.length === 0) {
//             const response = errorHandler("No categories found")
//             return res.status(statusMaker.success).json(response)
//         }
//         const upsertedCategories = await Promise.all(
//             categories.map(async (ctgy) => {
//                 const [categoryInstance] = await category.findOrCreate({
//                     where: { name: ctgy.title, store: processedStore },
//                     defaults: {
//                         name: ctgy.title,
//                         createDate: new Date(),
//                         updateDate: new Date(),
//                         updatedByStaff: "superAdmin",
//                         status: "active",
//                     },
//                 });
//                 return categoryInstance; // Directly return categoryInstance instead of wrapping it
//             })
//         );

//         const response = responseHandler(statusMaker.found, "Fetch Category successfully", upsertedCategories)
//         return res.status(statusMaker.found).json(response)

//     } catch (error) {
//         console.log("err---------", error);
//         const response = errorHandler(error)
//         return res.status(statusMaker.internalError).json(response)
//     }
// };


// export const updateCategoryStatus = async (req, res) => {
//     try {
//         const { categoryId, status, store, name } = req.body;
//         const processedStore = await storeHandler(store)

//         if (!categoryId || !status) {
//             const response = errorHandler("categoryId and status are required")
//             return res.status(statusMaker.badRequest).json(response)
//         }
//         const catgory = await category.findOne({ where: { id: categoryId, store: processedStore } });

//         if (!catgory) {
//             const response = errorHandler("category not found")
//             return res.status(statusMaker.success).json(response)
//         }

//         catgory.status = status;
//         if (name) {
//             catgory.name = name
//         }
//         catgory.updateDate = new Date();
//         await catgory.save();

//         const response = responseHandler(statusMaker.found, apiMessages.update, catgory)
//         return res.status(statusMaker.found).json(response)
//     } catch (error) {
//         console.log("err--------", error);
//         const response = errorHandler(error)
//         return res.status(statusMaker.internalError).json(response)
//     }
// };

// export const deleteCategoryById = async (req, res) => {
//     try {
//         const { store, categoryId } = req.query
//         const processedStore = await storeHandler(store)
//         console.log("processedStore---", processedStore);
//         if (!categoryId) {
//             const response = responseHandler("categoryId is required")
//             return res.status(statusMaker.badRequest).json(response)
//         }

//         const catgory = await category.findOne({ where: { id: categoryId, store: processedStore } });

//         if (!catgory) {
//             const response = errorHandler("Category not found")
//             return res.status(statusMaker.success).json(response)
//         }

//         await catgory.destroy();
//         const response = responseHandler(statusMaker.found, apiMessages.deleted, [])
//         return res.status(statusMaker.found).json(response)
//     } catch (error) {
//         const response = errorHandler(error)
//         return res.status(statusMaker.internalError).json(response)
//     }
// };

// export const filterCategories = async (req, res) => {
//     try {
//         const { startDate, endDate, store } = req.query
//         const processedStore = await storeHandler(store)

//         if (!startDate || !endDate) {
//             const resp = responseHandler(statusMaker.badRequest, "Missing required fields", [])
//             return res.status(statusMaker.badRequest).json(resp)
//         }
//         const formatStartDate = new Date(startDate)
//         const formatEndDate = new Date(endDate)
//         formatEndDate.setHours(23, 59, 59, 999);

//         const filterCat = await category.findAll({
//             where: {
//                 createdAt: {
//                     [Op.between]: [formatStartDate, formatEndDate]
//                 },
//                 store: processedStore
//             }
//         })
//         if (filterCat) {
//             const resp = responseHandler(statusMaker.found, "Category fetched successfully", filterCat)
//             return res.status(statusMaker.found).json(resp)
//         }
//         const resp = responseHandler(statusMaker.notFound, "Category not found", [])
//         return res.status(statusMaker.success).json(resp)
//     } catch (error) {
//         const response = errorHandler(error.message)
//         return res.status(statusMaker.internalError).json(response)
//     }
// }

// ------------------------- Product Tags---------------------------
// export const createTag = async (req, res) => {
//     try {
//         const { tagName, tagStatus, store } = req.body
//         const website = await storeHandler(store)
//         if (!tagName || !tagStatus) {
//             const response = responseHandler(statusMaker.badRequest, apiMessages.errorOccurred)
//             return res.status(statusMaker.badRequest).json(response)
//         }
//         console.log("------------", tagName, tagStatus);
//         const newTag = await tag.create({ name: tagName, status: tagStatus, store: website })
//         console.log("newTag==========", newTag);
//         if (newTag) {
//             const response = responseHandler(statusMaker.created, apiMessages.create, newTag)
//             return res.status(statusMaker.created).json(response)
//         }
//         const response = responseHandler(statusMaker.created, apiMessages.create)
//         return res.status(statusMaker.created).json(response)

//     } catch (error) {
//         console.log("err-----------", error);
//         const response = errorHandler(error.message)
//         return res.status(statusMaker.internalError).json(response)
//     }
// }

// export const fetchTags = async (req, res) => {
//     try {
//         const { store } = req.query
//         const processedStore = await storeHandler(store);
//         if (!store) {
//             return res.status(statusMaker.badRequest).json({
//                 message: "Store query parameter is required.",
//             });
//         }
//         // const processedStore = await storeHandler(store)
//         const storeCredentials = await accessSchema.findOne({ where: { store: processedStore } });

//         if (!storeCredentials) {
//             return res.status(statusMaker.notFound).json({
//                 message: "Store credentials not found.",
//             });
//         }

//         const { shopname, access_token } = storeCredentials;
//         const query = `
//           query {
//             products(first: 50) {
//               edges {
//                 node {
//                   id
//                   title
//                   tags
//                 }
//               }
//             }
//           }
//         `;

//         const response = await axios({
//             url: `https://${shopname}/admin/api/2021-01/graphql.json`,
//             method: 'POST',
//             headers: {
//                 'X-Shopify-Access-Token': access_token,
//                 Accept: 'application/json',
//                 'Content-Type': 'application/json',
//             },
//             data: JSON.stringify({ query }),
//         });

//         if (!response.data || !response.data.data || !response.data.data.products) {
//             const resp = responseHandler(statusMaker.notFound, "Shopify response not found", [])
//             return res.status(statusMaker.success).json(resp);
//         }

//         const products = response.data.data.products.edges.map(productEdge => {
//             const product = productEdge.node;
//             return {
//                 id: product.id.split('/').pop(),
//                 title: product.title,
//                 tags: Array.isArray(product.tags) ? product.tags : product.tags.split(',').map(tag => tag.trim()),
//                 store: processedStore
//             };
//         });

//         const tags = products.flatMap(product => product.tags);
//         const uniqueTags = Array.from(new Set(tags));

//         const existingTags = await tag.findAll({
//             where: { name: uniqueTags, store: processedStore },
//             attributes: ['name'],
//         });

//         const existingTagNames = existingTags.map(tag => tag.name);

//         const newTags = uniqueTags.filter(tag => !existingTagNames.includes(tag));

//         if (newTags.length > 0) {
//             const tagData = newTags.map(tg => ({
//                 name: tg,
//                 createDate: new Date(),
//                 updateDate: new Date(),
//                 updatedByStaff: 'superAdmin',
//                 status: 'active',
//                 store: processedStore
//             }));

//             await tag.bulkCreate(tagData);
//         }
//         const resp = responseHandler(statusMaker.found, "Tags found successfully", products)
//         return res.status(statusMaker.found).json(resp);

//     } catch (error) {
//         const response = errorHandler(error);
//         return res.status(statusMaker.internalError).json(response);
//     }
// };

// export const fetchDBTags = async (req, res) => {
//     try {
//         const { store } = req.query
//         const processedStore = await storeHandler(store)
//         const result = await tag.findAll({ where: { store: processedStore } })
//         if (result) {
//             const response = responseHandler(statusMaker.found, "Tags found successfully", result)
//             return res.status(statusMaker.found).json(response)
//         }
//         else {
//             const response = responseHandler(statusMaker.notFound, "Something wrong", [])
//             return res.status(statusMaker.found).json(response);
//         }
//     } catch (error) {
//         const response = errorHandler(error);
//         return res.status(statusMaker.internalError).json(response);
//     }
// }

// export const updateTagById = async (req, res) => {
//     try {
//         const { tagId, status, name, store } = req.body;
//         const processedStore = await storeHandler(store)

//         if (!tagId || !status) {
//             const response = errorHandler("tagId and status are required")
//             return res.status(statusMaker.badRequest).json(response)
//         }

//         const tg = await tag.findOne({ where: { id: tagId, store: processedStore } });

//         if (!tg) {
//             const response = errorHandler("tag not found")
//             return res.status(statusMaker.success).json(response)
//         }

//         tg.status = status;
//         if (name) {
//             tg.name = name;
//         }
//         await tg.save();
//         const response = responseHandler(statusMaker.found, apiMessages.update, tg)
//         return res.status(statusMaker.found).json(response)
//     } catch (error) {
//         const response = errorHandler(error);
//         return res.status(statusMaker.internalError).json(response);
//     }
// };

// export const deleteTagById = async (req, res) => {
//     try {
//         const { store, tagId } = req.query
//         const processedStore = await storeHandler(store)
//         if (!tagId) {
//             const response = errorHandler("tagId is required")
//             return res.status(statusMaker.badRequest).json(response)
//         }

//         const tg = await tag.findOne({ where: { id: tagId, store: processedStore } });

//         if (!tg) {
//             const response = errorHandler("Tag not found")
//             return res.status(statusMaker.success).json(response)
//         }
//         await tg.destroy();

//         const response = responseHandler(statusMaker.found, apiMessages.deleted, [])
//         return res.status(statusMaker.found).json(response)
//     } catch (error) {
//         const response = errorHandler(error)
//         return res.status(statusMaker.internalError).json(response)
//     }
// };

// export const filterTags = async (req, res) => {
//     try {
//         const { startDate, endDate, store } = req.query
//         const processedStore = await storeHandler(store)

//         if (!startDate || !endDate) {
//             const resp = responseHandler(statusMaker.badRequest, "Missing required fields", [])
//             return res.status(statusMaker.badRequest).json(resp)
//         }
//         const formatStartDate = new Date(startDate)
//         const formatEndDate = new Date(endDate)
//         formatEndDate.setHours(23, 59, 59, 999);

//         const filterTg = await tag.findAll({
//             where: {
//                 createdAt: {
//                     [Op.between]: [formatStartDate, formatEndDate]
//                 },
//                 store: processedStore
//             }
//         })
//         if (filterTg) {
//             const resp = responseHandler(statusMaker.found, "Tags fetched successfully", filterTg)
//             return res.status(statusMaker.found).json(resp)
//         }
//         const resp = responseHandler(statusMaker.notFound, "Tag not found", [])
//         return res.status(statusMaker.success).json(resp)
//     } catch (error) {
//         const response = errorHandler(error)
//         return res.status(statusMaker.internalError).json(response)
//     }
// }

// export const updateproductPoints = async (req, res) => {
//     try {
//         const { store, points, productId } = req.body
//         const website = await storeHandler(store)
//         if (!points) {
//             const response = responseHandler(statusMaker.badRequest, "Points required")
//             return res.status(statusMaker.badRequest).json(response)
//         }
//         const config = {
//             method: 'post',
//             url: 'https://lakmestaging.myshopify.com/admin/api/2024-01/graphql.json',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'X-Shopify-Access-Token': config.shopify_token,
//             },
//             data: JSON.stringify({
//                 query,
//                 variables: {
//                     productId: `gid://shopify/Product/${productId}`,
//                 },
//             }),
//         };
//         try {
//             const resp = await axios(config);
//             console.log(resp.data.data.product);
//             const response = responseHandler(statusMaker.found, apiMessages.found, resp.data)
//             return res.status(statusMaker.found).json(response)
//         } catch (error) {
//             console.error('Error fetching product details:', error.response?.data || error.message);
//         }
//     } catch (error) {
//         const response = errorHandler(error)
//         return res.status(statusMaker.internalError).json(response)
//     }
// }

// export const updateproductPoints = async (req, res) => {
//     try {
//         const { store, points, productId } = req.body;
//         const processedStore = await storeHandler(store);

//         if (!points) {
//             const response = responseHandler(statusMaker.badRequest, "Points are required");
//             return res.status(statusMaker.badRequest).json(response);
//         }
//         const storeCredentials = await accessSchema.findOne({ where: { store: processedStore } });

//         if (!storeCredentials) {
//             return res.status(statusMaker.notFound).json({
//                 message: "Store credentials not found.",
//             });
//         }

//         const { shopname, access_token } = storeCredentials;
//         const config = {
//             headers: {
//                 'Content-Type': 'application/json',
//                 'X-Shopify-Access-Token':access_token, // Use a secure storage mechanism for API keys.
//             },
//         };

//         // Step 1: Fetch all metafields
//         const queryGetMetafields = `
//             query ($productId: ID!) {
//                 product(id: $productId) {
//                     metafields(first: 100) {
//                         edges {
//                             node {
//                                 id
//                                 namespace
//                                 key
//                                 value
//                             }
//                         }
//                     }
//                 }
//             }
//         `;

//         const variablesGetMetafields = {
//             productId: `gid://shopify/Product/${productId}`,
//         };

//         const getMetafieldsResponse = await axios.post(
//             `https://${shopname}/admin/api/2024-01/graphql.json`,
//             { query: queryGetMetafields, variables: variablesGetMetafields },
//             config
//         );

//         console.log("Fetched all metafields:", getMetafieldsResponse.data.data);

//         const metafields = getMetafieldsResponse.data.data.product.metafields.edges;

//         // Step 2: Return all metafields
//         const response = responseHandler(
//             statusMaker.success,
//             "All metafields retrieved successfully",
//             {
//                 metafields: metafields.map(mf => ({
//                     id: mf.node.id,
//                     namespace: mf.node.namespace,
//                     key: mf.node.key,
//                     value: mf.node.value
//                 }))
//             }
//         );
//         return res.status(statusMaker.success).json(response);

//     } catch (error) {
//         console.error('Error fetching product metafields:', error.response?.data || error.message);
//         const response = errorHandler(error);
//         return res.status(statusMaker.internalError).json(response);
//     }
// };

// export const updateproductPoints = async (req, res) => {
//     try {
//         const { store, points, productId } = req.body;
//         const processedStore = await storeHandler(store);

//         if (!points) {
//             const response = responseHandler(statusMaker.badRequest, "Points are required");
//             return res.status(statusMaker.badRequest).json(response);
//         }

//         const storeCredentials = await accessSchema.findOne({ where: { store: processedStore } });

//         if (!storeCredentials) {
//             return res.status(statusMaker.notFound).json({
//                 message: "Store credentials not found.",
//             });
//         }

//         const { shopname, access_token } = storeCredentials;
//         const config = {
//             headers: {
//                 'Content-Type': 'application/json',
//                 'X-Shopify-Access-Token': access_token,
//             },
//         };

//         // Step 1: Define the mutation for updating/creating the metafield
//         const mutationSetMetafield = `
//             mutation ($metafields: [MetafieldsSetInput!]!) {
//                 metafieldsSet(metafields: $metafields) {
//                     metafields {
//                         id
//                         key
//                         namespace
//                         value
//                     }
//                     userErrors {
//                         field
//                         message
//                     }
//                 }
//             }
//         `;

//         // Step 2: Define the metafield payload
//         const metafieldPayload = {
//             metafields: [
//                 {
//                     ownerId: `gid://shopify/Product/${productId}`,
//                     namespace: "custom",
//                     key: "product_redeem_points_",
//                     type: "single_line_text_field",
//                     value: points.toString(), // Shopify requires values to be strings
//                 },
//             ],
//         };

//         // Step 3: Execute the mutation to update the metafield
//         const setMetafieldResponse = await axios.post(
//             `https://${shopname}/admin/api/2024-01/graphql.json`,
//             { query: mutationSetMetafield, variables: metafieldPayload },
//             config
//         );

//         const { metafieldsSet } = setMetafieldResponse.data.data;

//         // Handle potential user errors
//         if (metafieldsSet.userErrors.length > 0) {
//             return res.status(statusMaker.badRequest).json({
//                 message: "Error updating metafield",
//                 errors: metafieldsSet.userErrors,
//             });
//         }

//         // Respond with the updated metafield details
//         const response = responseHandler(
//             statusMaker.success,
//             "Metafield updated successfully",
//             metafieldsSet.metafields[0] // Return the updated metafield
//         );

//         return res.status(statusMaker.success).json(response);

//     } catch (error) {
//         console.error('Error updating metafield:', error.response?.data || error.message);
//         const response = errorHandler(error);
//         return res.status(statusMaker.internalError).json(response);
//     }
// }

// export const getAllRedeemProductsByCategory = async (req, res) => {
//     try {
//         let { store ,categry} = req.query;
//         store = await storeHandler(store);
//         if(!categry){
//             const resp = responseHandler(statusMaker.badRequest,"Missing Category field")
//             return res.status(statusMaker.badRequest).json(resp)
//         }
//         const storeCredentials = await accessSchema.findOne({ where: { store } });
//         if (!storeCredentials) {
//             return res.status(statusMaker.notFound).json({
//                 message: "Store credentials not found.",
//             });
//         }
//         const { shopname, access_token } = storeCredentials;
//         const query = `
//         {
//             products(first: 10, query:"tag:redeem status:active") {
//                 edges {
//                     node {
//                         id
//                         title
//                         handle
//                         bodyHtml
//                         tags
//                         variants(first: 1) {
//                             edges {
//                                 node {
//                                     id
//                                     sku
//                                     price
//                                     inventoryQuantity
//                                     weight
//                                     weightUnit
//                                 }
//                             }
//                         }
//                         metafields(first: 100) {
//                             edges {
//                                 node {
//                                     namespace
//                                     key
//                                     value
//                                 }
//                             }
//                         }
//                         images(first: 5) {
//                             edges {
//                                 node {
//                                     src
//                                 }
//                             }
//                         }
//                         collections(first: 1) {
//                             edges {
//                                 node {
//                                     title
//                                 }
//                             }
//                         }
//                     }
//                 }
//             }
//         }
//     `;

//         // Fetch products from Shopify
//         const response = await axios({
//             url: `https://${shopname}/admin/api/2024-01/graphql.json`,
//             method: 'POST',
//             headers: {
//                 'X-Shopify-Access-Token': access_token,
//                 'Content-Type': 'application/json',
//             },
//             data: JSON.stringify({ query }),
//         });
//         console.log("response-------", response);

//         if (!response.data || !response.data.data || !response.data.data.products) {
//             const resp = responseHandler(statusMaker.internalError, "No products data found in response", [])
//             return res.status(statusMaker.internalError).json(resp)
//         }

//         for (const edge of response.data.data.products.edges) {
//             const product = edge.node;
//             const variant = product.variants.edges[0]?.node;
//             const inventoryQuantity = variant?.inventoryQuantity || 0;
//             const netWeight = `${variant?.weight || ''} ${variant?.weightUnit || ''}`;

//             // Get product images
//             const mainImage = product.images.edges[0]?.node?.src || '';
//             const thumbnailImage = product.images.edges[0]?.node?.src || '';

//             // Get metafields
//             const metafields = product.metafields.edges.map((meta) => ({
//                 namespace: meta.node.namespace,
//                 key: meta.node.key,
//                 value: meta.node.value,
//             }));
//             const minCappingMetafield = metafields.find((meta) => meta.key === "product_min_capping");
//             const maxCappingMetafield = metafields.find((meta) => meta.key === "product_max_capping");
//             // const rewardPointsMetafield = metafields.find((meta) => meta.key === "reward_points");
//             const productPointsMetafield = metafields.find((meta) => meta.key === "product_redeem_points_");

//             const productMinCapping = minCappingMetafield ? parseInt(minCappingMetafield.value) : 0;
//             const productMaxCapping = maxCappingMetafield ? parseInt(maxCappingMetafield.value) : 0;
//             // const rewardPoints = rewardPointsMetafield ? parseInt(rewardPointsMetafield.value) : 0;
//             const productPoint = productPointsMetafield ? parseInt(productPointsMetafield.value) : 0;
//             console.log("productpoint---", productPoint);

//             // Get category (collections) data
//             const categoryName = product.collections.edges.length > 0
//                 ? product.collections.edges[0].node.title
//                 : 'Uncategorized';
//             console.log("=========++++++++++++", product.id, product.id.split('/').pop(), typeof (product.id.split('/').pop()));

//             const productData = {
//                 productId: product.id.split('/').pop(),
//                 productName: product.title,
//                 productHandle:product.handle,
//                 productSKU: variant?.sku || '',
//                 productImage: mainImage,
//                 categoryName,
//                 tagName: product.tags.join(', ') || '',
//                 availableQuantity: inventoryQuantity,
//                 totalQuantity: inventoryQuantity,
//                 minQuantity: productMinCapping,
//                 maxQuantity: productMaxCapping,
//                 rewarPoints: productPoint,
//                 startDate: '2015-12-12',
//                 endDate: '2050-12-31',
//                 stock: inventoryQuantity > 0 ? 'Yes' : 'No',
//                 netWeight,
//                 details: product.bodyHtml || '',
//                 description: product.bodyHtml || '',
//                 thumbnailImage,
//                 notified: false,
//                 updateByStaff: 'superAdmin',
//                 status: 'active',
//                 store: store,
//             };

//             const checkProduct = await dsProduct.findOne({ where: { productId: product.id.split('/').pop() } });

//             if (!checkProduct) {
//                 // Create product if it doesn't exist
//                 await dsProduct.create(productData);
//             } else {
//                 // Update product if it exists
//                 await dsProduct.update(productData, { where: { productId: product.id.split('/').pop() } });
//             }
//         }
//         const dbProducts = await dsProduct.findAll({ where: { store: store ,categoryName:categry} });
//         // Send response
//         if(dbProducts.length <=0){
//             const resp = responseHandler(statusMaker.notFound, apiMessages.notFound, dbProducts)
//         return res.status(statusMaker.success).json(resp);
//         }
//         const resp = responseHandler(statusMaker.found, apiMessages.found, dbProducts)
//         return res.status(statusMaker.found).json(resp);
//     } catch (error) {
//         console.error("Error fetching redeem products:", error.message || error.response?.data);
//         const resp = errorHandler(error.message)
//         return res.status(statusMaker.internalError).json(resp);
//     }
// };

// export const getRedeemProductById = async(req,res) => {
// try {
//     const {id,store} = req.query
//     const processedStore = await storeHandler(store)
//     if(!id){
//         const resp = responseHandler(statusMaker.badRequest, "Missing id field")
//         return res.status(statusMaker.success).json(resp);
//     }
//     const findproduct = await dsProduct.findOne({where:{id:id,store:processedStore}})
//     if(!findproduct){
//         const resp = responseHandler(statusMaker.notFound, apiMessages.notFound, findproduct)
//         return res.status(statusMaker.success).json(resp);
//     }
//     const resp = responseHandler(statusMaker.found, apiMessages.found, findproduct)
//     return res.status(statusMaker.found).json(resp);
// } catch (error) {
//     const resp = errorHandler(error.message)
//     return res.status(statusMaker.internalError).json(resp);
// }
// }

// export const getShopifyRajnigandhaProduct = async (req, res) => {
//     try {
//         let { store } = req.query;
//         store = await storeHandler(store);
//         const storeCredentials = await accessSchema.findOne({ where: { store } });
//         if (!storeCredentials) {
//             return res.status(statusMaker.notFound).json({
//                 message: "Store credentials not found.",
//             });
//         }
//         const { shopname, access_token } = storeCredentials;
//         const query = `
//         {
//   products(first: 10, query: "tag:rajnigandha_products status:active") {
//     edges {
//       node {
//         id
//         title
//         metafields(first: 250) { # Maximum metafields you can fetch in one query
//           edges {
//             node {
//               namespace
//               key
//               value
//               type # Optional: Helps understand the metafield type (e.g., string, integer, etc.)
//               description # Optional: Descriptive metadata for the metafield
//             }
//           }
//         }
//       }
//     }
//   }
// }
//     `;

//         // Fetch products from Shopify
//         const response = await axios({
//             url: `https://${shopname}/admin/api/2024-01/graphql.json`,
//             method: 'POST',
//             headers: {
//                 'X-Shopify-Access-Token': access_token,
//                 'Content-Type': 'application/json',
//             },
//             data: JSON.stringify({ query }),
//         });
//         console.log("response-------", response);

//         if (!response.data || !response.data.data || !response.data.data.products) {
//             const resp = responseHandler(statusMaker.internalError, "No products data found in response", [])
//             return res.status(statusMaker.internalError).json(resp)
//         }
//         const resp = responseHandler(statusMaker.found, apiMessages.found, response.data)
//         return res.status(statusMaker.found).json(resp);
//     } catch (error) {
//         console.error("Error fetching redeem products:", error.message || error.response?.data);
//         const resp = errorHandler(error.message)
//         return res.status(statusMaker.internalError).json(resp);
//     }
// };

// export const getShopifyFoodProducts = async (req, res) => {
//     try {
//         let { store } = req.query;
//         store = await storeHandler(store);
//         const storeCredentials = await accessSchema.findOne({ where: { store } });
//         if (!storeCredentials) {
//             return res.status(statusMaker.notFound).json({
//                 message: "Store credentials not found.",
//             });
//         }
//         const { shopname, access_token } = storeCredentials;
//         const query = `
//         {
//             products(first: 10, query:"tag:food_redeem_product status:active") {
//                 edges {
//                     node {
//                         id
//                         title
//                         handle
//                         bodyHtml
//                         tags
//                         variants(first: 1) {
//                             edges {
//                                 node {
//                                     id
//                                     sku
//                                     price
//                                     inventoryQuantity
//                                     weight
//                                     weightUnit
//                                 }
//                             }
//                         }
//                         metafields(first: 100) {
//                             edges {
//                                 node {
//                                     namespace
//                                     key
//                                     value
//                                 }
//                             }
//                         }
//                         images(first: 5) {
//                             edges {
//                                 node {
//                                     src
//                                 }
//                             }
//                         }
//                         collections(first: 5) {
//                             edges {
//                                 node {
//                                     title
//                                 }
//                             }
//                         }
//                     }
//                 }
//             }
//         }
//     `;

//         // Fetch products from Shopify
//         const response = await axios({
//             url: `https://${shopname}/admin/api/2024-01/graphql.json`,
//             method: 'POST',
//             headers: {
//                 'X-Shopify-Access-Token': access_token,
//                 'Content-Type': 'application/json',
//             },
//             data: JSON.stringify({ query }),
//         });
//         console.log("response-------", response);

//         if (!response.data || !response.data.data || !response.data.data.products) {
//             const resp = responseHandler(statusMaker.internalError, "No products data found in response", [])
//             return res.status(statusMaker.internalError).json(resp)
//         }

//         for (const edge of response.data.data.products.edges) {
//             const product = edge.node;
//             const variant = product.variants.edges[0]?.node;
//             const inventoryQuantity = variant?.inventoryQuantity || 0;
//             const netWeight = `${variant?.weight || ''} ${variant?.weightUnit || ''}`;

//             // Get product images
//             const mainImage = product.images.edges[0]?.node?.src || '';
//             const thumbnailImage = product.images.edges[0]?.node?.src || '';

//             // Get metafields
//             const metafields = product.metafields.edges.map((meta) => ({
//                 namespace: meta.node.namespace,
//                 key: meta.node.key,
//                 value: meta.node.value,
//             }));
//             const minCappingMetafield = metafields.find((meta) => meta.key === "product_min_capping");
//             const maxCappingMetafield = metafields.find((meta) => meta.key === "product_max_capping");
//             // const rewardPointsMetafield = metafields.find((meta) => meta.key === "reward_points");
//             const productPointsMetafield = metafields.find((meta) => meta.key === "product_redeem_points_");

//             const productMinCapping = minCappingMetafield ? parseInt(minCappingMetafield.value) : 0;
//             const productMaxCapping = maxCappingMetafield ? parseInt(maxCappingMetafield.value) : 0;
//             // const rewardPoints = rewardPointsMetafield ? parseInt(rewardPointsMetafield.value) : 0;
//             const productPoint = productPointsMetafield ? parseInt(productPointsMetafield.value) : 0;
//             console.log("productpoint---", productPoint);

//             // Get category (collections) data
//             const categoryName = product.collections.edges.length > 0
//                 ? product.collections.edges[0].node.title
//                 : 'Uncategorized';
//             console.log("=========++++++++++++", product.id, product.id.split('/').pop(), typeof (product.id.split('/').pop()));

//             const productData = {
//                 productId: product.id.split('/').pop(),
//                 productName: product.title,
//                 productHandle: product.handle,
//                 productSKU: variant?.sku || '',
//                 productImage: mainImage,
//                 categoryName,
//                 tagName: product.tags.join(', ') || '',
//                 availableQuantity: inventoryQuantity,
//                 totalQuantity: inventoryQuantity,
//                 minQuantity: productMinCapping,
//                 maxQuantity: productMaxCapping,
//                 rewarPoints: productPoint,
//                 startDate: '2015-12-12',
//                 endDate: '2050-12-31',
//                 stock: inventoryQuantity > 0 ? 'Yes' : 'No',
//                 netWeight,
//                 details: product.bodyHtml || '',
//                 description: product.bodyHtml || '',
//                 thumbnailImage,
//                 notified: false,
//                 updateByStaff: 'superAdmin',
//                 status: 'active',
//                 store: store,
//             };

//             const checkProduct = await dsProduct.findOne({ where: { productId: product.id.split('/').pop() } });

//             if (!checkProduct) {
//                 // Create product if it doesn't exist
//                 await dsProduct.create(productData);
//             } else {
//                 // Update product if it exists
//                 await dsProduct.update(productData, { where: { productId: product.id.split('/').pop() } });
//             }
//         }
//         const dbProducts = await dsProduct.findAll({ where: { store: store, tagName: { [Op.like]: `%food_redeem_product%` } } });
//         // Send response
//         if (dbProducts.length <= 0) {
//             const resp = responseHandler(statusMaker.success, apiMessages.notFound, dbProducts)
//             return res.status(statusMaker.success).json(resp);
//         }
//         const resp = responseHandler(statusMaker.found, apiMessages.found, dbProducts)
//         return res.status(statusMaker.found).json(resp);
//     } catch (error) {
//         console.error("Error fetching redeem products:", error.message || error.response?.data);
//         const resp = errorHandler(error.message)
//         return res.status(statusMaker.internalError).json(resp);
//     }
// };

// ----------------------Loyality DS Products-----------------------------
export const getAllRedeemProducts = async (req, res) => {
    try {
        let { store } = req.query;
        store = await storeHandler(store);
        const storeCredentials = await accessSchema.findOne({ where: { store } });
    
        console.log("storeCredentials",)

        if (!storeCredentials) {
            return res.status(statusMaker.notFound).json({
                message: "No data found.",
            });
        }

        const { shopname, access_token } = storeCredentials;
        // GraphQL Query to fetch products with "tag:redeem"
        const query = `
        {
            products(first: 250, query:"tag:redeem-product status:active") {
                edges {
                    node {
                        id
                        title
                        handle
                        publishedAt
                        bodyHtml
                        tags
                        variants(first: 1) {
                            edges {
                                node {
                                    id
                                    sku
                                    price
                                    inventoryQuantity
                                    weight
                                    weightUnit
                                }
                            }
                        }
                        metafields(first: 100) {
                            edges {
                                node {
                                    namespace
                                    key
                                    value
                                }
                            }
                        }
                        images(first: 5) {
                            edges {
                                node {
                                    src
                                }
                            }
                        }
                        collections(first: 5) {
                            edges {
                                node {
                                    title
                                }
                            }
                        }
                    }
                }
            }
        }
    `;

        // Fetch products from Shopify
        const response = await axios({
            url: `https://${shopname}/admin/api/2024-01/graphql.json`,
            method: 'POST',
            headers: {
                'X-Shopify-Access-Token': access_token,
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({ query }),
        });

        if (!response.data || !response.data.data || !response.data.data.products) {
            const resp = responseHandler(statusMaker.internalError, "No data found", [])
            return res.status(statusMaker.internalError).json(resp)
        }

        const products = []
        for (const edge of response.data.data.products.edges) {
            const product = edge.node;
            const variant = product.variants.edges[0]?.node;
            const inventoryQuantity = variant?.inventoryQuantity || 0;
            const netWeight = `${variant?.weight || ''} ${variant?.weightUnit || ''}`;

            const mainImage = product.images.edges[0]?.node?.src || '';
            const thumbnailImage = product.images.edges[0]?.node?.src || '';

            const metafields = product.metafields.edges.map((meta) => ({
                namespace: meta.node.namespace,
                key: meta.node.key,
                value: meta.node.value,
            }));
            const minCappingMetafield = metafields.find((meta) => meta.key === "product_min_capping");
            const maxCappingMetafield = metafields.find((meta) => meta.key === "product_max_capping");
            const categoryMetafield = metafields.find((meta) => meta.key === "product_category_name");
            const productDescriptionMetafield = metafields.find((meta) => meta.key === "product_description");
            const productDetailsMetafield = metafields.find((meta) => meta.key === "product_details");

            const expiryMetafield = metafields.find((meta) => meta.key === "redeem_expired_date")
            const productMinCapping = minCappingMetafield ? parseInt(minCappingMetafield.value) : 0;
            const productMaxCapping = maxCappingMetafield ? parseInt(maxCappingMetafield.value) : 0;
            const categoryField = categoryMetafield ? (categoryMetafield.value) : '';
            const productDescription = productDescriptionMetafield ? (productDescriptionMetafield.value) : '';
            const productDetails = productDetailsMetafield ? (productDetailsMetafield.value) : ''
            const expiryDate = expiryMetafield ? (expiryMetafield.value) : null


            const productData = {
                productId: product.id.split('/').pop(),
                productName: product.title,
                productHandle: product.handle,
                productSKU: variant?.sku || '',
                productImage: mainImage,
                categoryName: categoryField,
                tagName: product.tags.join(', ') || '',
                availableQuantity: inventoryQuantity,
                totalQuantity: inventoryQuantity,
                minQuantity: productMinCapping,
                maxQuantity: productMaxCapping,
                rewarPoints: Math.floor(Number(variant?.price || 0)),
                startDate: product.publishedAt,
                endDate: expiryDate,
                stock: inventoryQuantity > 0 ? 'Yes' : 'No',
                netWeight,
                details: JSON.parse(productDetails),
                description: productDescription,
                thumbnailImage,
                notified: false,
                updateByStaff: 'superAdmin',
                status: 'active',
                store: store,
            };
            products.push(productData)
        }
        const resp = responseHandler(statusMaker.found, "Fetch data successfully", products)
        return res.status(statusMaker.found).json(resp);
    } catch (error) {
        const resp = errorHandler(`Something went wrong ${error.message}`)
        return res.status(statusMaker.internalError).json(resp);
    }
};

export const productsOrderList = async (req, res) => {
    try {
        const { store } = req.query;
        const processedStore = await storeHandler(store);

        const storeCredentials = await accessSchema.findOne({ where: { store: processedStore } });
        if (!storeCredentials) {
            return res.status(statusMaker.notFound).json({
                message: "Store credentials not found.",
            });
        }

        const { shopname, access_token } = storeCredentials;

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
                method: 'POST',
                headers: {
                    'X-Shopify-Access-Token': access_token,
                    'Content-Type': 'application/json',
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
            allOrders = allOrders.concat(edges.map(edge => edge.node));
            hasNextPage = data.pageInfo.hasNextPage;
            endCursor = data.pageInfo.endCursor;
        }
        const redemptionOrders = allOrders.filter(order => order.tags.includes("redeempoints"));
        const resp = responseHandler(statusMaker.success, "Fetch data successfully", redemptionOrders);
        return res.status(statusMaker.success).json(resp);
    } catch (error) {
        const resp = errorHandler(error.message);
        return res.status(statusMaker.internalError).json(resp);
    }
};

const generatePin = () => {
    const pin = Math.floor(100000 + Math.random() * 900000);
    return pin;
}

export const sendProductReedeemOTP = async (req, res) => {
    try {
        const { customerId, accountId, productId, store, points } = req.body;
        const processedStore = await storeHandler(store);

        if (!customerId || !accountId || !productId || !points) {
            const rep = responseHandler(
                statusMaker.badRequest,
                "Missing customerId, accountId, points or productId"
            );
            return res.status(statusMaker.badRequest).json(rep);
        }
        const checkcustomer = await customer.findOne({
            where: { customer_id: customerId, account_number: accountId, store: processedStore },
        });
        if (!checkcustomer) {
            const rep = responseHandler(statusMaker.notFound, "No data found");
            return res.status(statusMaker.notFound).json(rep);
        }
        const findProduct = await dsProduct.findOne({ where: { productId: productId, store: processedStore } })
        if (!findProduct) {
            const resp = responseHandler(statusMaker.success, "No data found", findProduct)
            return res.status(statusMaker.notFound).json(resp)
        }
        if (Number(checkcustomer.balance_point) >= points && (Number(checkcustomer.balance_point) >= 1000)) {
            const tranCategory = 'productRedeem'
            const tranStatus = 'redeem'
            const generateTransactionId = (transactionCategory) => {
                const datePart = moment().format("YYYYMMDDHHmmss");
                const randomPart = Math.floor(Math.random() * 1_000_000_000)
                    .toString()
                    .padStart(10, "0");
                return `${transactionCategory}${datePart}${randomPart}`;
            }
            const transactionId = generateTransactionId(tranCategory)
            const transactionData = {
                customer_Id: checkcustomer.customer_id,
                transition_id: transactionId,
                account_number: checkcustomer.account_number,
                transition_category: tranCategory,
                transition_status: tranStatus,
                medium: 'desktop',
                point: points,
                expiry_date: "",
                order_id: "",
                product_detail: "",
                source_of_device: 'rajnigandha.com',
                store: processedStore,
                name: checkcustomer.first_name,
                mobile_no: checkcustomer.phone_number,
                state: checkcustomer.State,
                city: checkcustomer.city,
                serial_no: '',
                coupon_code: '',
                scan_manual: ''
            }
            const pointData = {
                customer_Id: checkcustomer.customer_id,
                transition_id: transactionId,
                account_number: checkcustomer.account_number,
                point: points,
                transition_status: tranStatus,
                transition_category: tranCategory,
                store: processedStore,
                expiry_date: '',
                credit_after: '',
            }
            const addTransaction =
                await Promise.all([
                    transition.create(transactionData),
                    point.create(pointData),
                ]);
            if (addTransaction) {
                checkcustomer.balance_point = (Number(checkcustomer.earned_point) - Number(checkcustomer.redeem_point) - Number(checkcustomer.expiry_point) - Number(points)).toString()
                checkcustomer.redeem_point = (Number(checkcustomer.redeem_point) + Number(points)).toString()
                checkcustomer.save()
            }
            else {
                const rep = responseHandler(
                    statusMaker.internalError,
                    "Transaction not created",
                );
                return res.status(statusMaker.internalError).json(rep);
            }
            const otp = parseInt(generatePin(), 10);
            let contactNo = checkcustomer.phone_number
            if (contactNo.startsWith('+91')) {
                contactNo = contactNo.slice(3);
            } else if (contactNo.startsWith('0')) {
                contactNo = contactNo.slice(1);
            }
            await sendSMSOTPVoucher({ phone_number: contactNo, otp: otp }, processedStore, 'OTPVoucher')
            findProduct.otp = otp
            findProduct.otpVerification = 'unverified'
            findProduct.save()
            const rep = responseHandler(statusMaker.success, "OTP sent successfully",
                { productId, points }
            );
            return res.status(statusMaker.success).json(rep);
        }
        const rep = responseHandler(statusMaker.badRequest, "Sorry, you do not have enough points to redeem the product");
        return res.status(statusMaker.badRequest).json(rep);
    } catch (error) {
        const rep = errorHandler(error.message);
        return res.status(statusMaker.internalError).json(rep);
    }
};

export const verifyProductOTP = async (req, res) => {
    try {
        const { otp, customerId, accountId, productId } = req.body
        if (!otp || !customerId || !accountId || !productId) {
            const rep = responseHandler(statusMaker.badRequest, "Missing otp,customerId or accoutIds");
            return res.status(statusMaker.internalError).json(rep);
        }
        const findProduct = await dsProduct.findOne({ where: { productId } })
        if (findProduct.otpVerification == 'unverified') {
            if (!findProduct) {
                const resp = responseHandler(statusMaker.success, "Product not found", findProduct)
                return res.json(statusMaker.notFound).json(resp)
            }
            const currentTime = new Date();
            const otpTimestamp = new Date(findProduct.updatedAt);
            if (currentTime - otpTimestamp > 300000) {
                findProduct.otp = '';
                findProduct.otpVerification = 'unverified';
                await findProduct.save();
                const resp = responseHandler(statusMaker.internalError, "OTP has expired.");
                return res.status(statusMaker.internalError).json(resp);
            }
            if (findProduct.otp == otp) {
                findProduct.otp = ''
                findProduct.otpVerification = 'verified'
                findProduct.save()
                const resp = responseHandler(statusMaker.success, "OTP verified successfully")
                return res.status(statusMaker.success).json(resp)
            }
        }
        else {
            const resp = responseHandler(statusMaker.success, "OTP already Verified")
            return res.status(statusMaker.success).json(resp)
        }
        const resp = responseHandler(statusMaker.badRequest, "OTP not verified")
        return res.status(statusMaker.badRequest).json(resp)
    } catch (error) {
        const rep = errorHandler(error.message);
        return res.status(statusMaker.internalError).json(rep);
    }
}

export const getRedeemProductById = async (req, res) => {
    try {
        const { id, store } = req.query;
        const processedStore = await storeHandler(store);

        if (!id) {
            const resp = responseHandler(statusMaker.badRequest, "Missing product ID.");
            return res.status(statusMaker.badRequest).json(resp);
        }
        const storeCredentials = await accessSchema.findOne({ where: { store: processedStore } });
        if (!storeCredentials) {
            return res.status(statusMaker.notFound).json({ message: "No data found." });
        }
        const { shopname, access_token } = storeCredentials;
        const query = `
            {
                product(id: "gid://shopify/Product/${id}") {
                    id
                    title
                    description: bodyHtml
                    publishedAt
                    tags
                    images(first: 5) {
                        edges {
                            node {
                                src
                            }
                        }
                    }
                    variants(first: 5) {
                        nodes {
                            id
                            price
                            compareAtPrice
                            inventoryQuantity
                        }
                    }
                    metafields(first: 10) {
                        edges {
                            node {
                                key
                                value
                            }
                        }
                    }
                        collections(first: 5) {  # Fetch collections/categories
                  edges {
                    node {
                      id
                      title
                    }
                  }
                }
                }
            }
        `;

        const response = await axios({
            url: `https://${shopname}/admin/api/2024-01/graphql.json`,
            method: "POST",
            headers: {
                "X-Shopify-Access-Token": access_token,
                "Content-Type": "application/json",
            },
            data: JSON.stringify({ query }),
        });
        const product = response?.data?.data?.product;
        if (!product) {
            const resp = responseHandler(statusMaker.notFound, "No data found", []);
            return res.status(statusMaker.notFound).json(resp);
        }
        const productMetafields = product.metafields.edges.reduce((acc, meta) => {
            acc[meta.node.key] = meta.node.value;
            return acc;
        }, {});

        const productDescription = productMetafields["product_description"]
            ? (productMetafields["product_description"])
            : "";
        const productExpirydate = productMetafields["redeem_expired_date"]
            ? (productMetafields["redeem_expired_date"])
            : "";
            // if(!productExpirydate || productExpirydate=="" || productExpirydate !=0){

            //     const createdAt = new Date(productExpirydate);
            //     const formattedRedemDate = `${productExpirydate.getDate().toString().padStart(2, '0')}/${(productExpirydate.getMonth() + 1).toString().padStart(2, '0')}/${productExpirydate.getFullYear()}`;
    
            // }

           
        let productDetails = [];
        try {
            productDetails = productMetafields["product_details"]
                ? JSON.parse(productMetafields["product_details"])
                : "";
        } catch (err) {
            productDetails = "Invalid Details Format";
            console.log("err--", err);
        }
        const productCategories = product.collections.edges.map((collectionEdge) => ({
            id: collectionEdge.node.id,
            title: collectionEdge.node.title,
        }));
        const productData = {
            id: product.id,
            title: product.title,
            description: productDescription,
            publishedAt: product.publishedAt,
            tags: product.tags,
            categories: productCategories,
            images: product.images.edges.map((image) => ({
                src: image.node.src,
            })),
            variants: product.variants.nodes.map((variant) => ({
                id: variant.id,
                price: variant.price,
                compareAtPrice: variant.compareAtPrice,
                inventoryQuantity: variant.inventoryQuantity,
            })),
            product_min_capping: productMetafields["product_min_capping"] || "0",
            product_max_capping: productMetafields["product_max_capping"] || "0",
            product_redeem_points: productMetafields["product_redeem_points_"] || "0",
            productDetails,
            productDescription: productMetafields["product_description"] || "No Description Found",
            productExpiryDate: productExpirydate || "0"
        };

        const resp = responseHandler(statusMaker.found, "Fetch data successfully", productData);
        return res.status(statusMaker.found).json(resp);
    } catch (error) {
        const resp = errorHandler(error.message);
        return res.status(statusMaker.internalError).json(resp);
    }
};

export const getProductForRedeem = async (req, res) => {
    try {
        const { store } = req.query;
        const processedStore = await storeHandler(store);
        const storeCredentials = await accessSchema.findOne({ where: { store: processedStore } });

        if (!storeCredentials) {
            const rep = responseHandler(statusMaker.badRequest, "Store credentials not found.")
            return res.status(statusMaker.badRequest).json(rep);
        }
        await redeemProduct.destroy({ truncate: true });

        const { shopname, access_token } = storeCredentials;
        const query = `
        {
          products(first: 250, query: "tag:redeem-product status:active") {
            edges {
              node {
                id
                title
                description
                tags
                publishedAt
                images(first: 10) {
                  edges {
                    node {
                      src
                    }
                  }
                }
                variants(first: 5) {
                  edges {
                    node {
                      id
                      price
                      compareAtPrice
                      inventoryQuantity
                    }
                  }
                }
                metafields(first: 100) {
                  edges {
                    node {
                      namespace
                      key
                      value
                    }
                  }
                }
                collections(first: 5) {  # Fetch collections/categories
                  edges {
                    node {
                      id
                      title
                    }
                  }
                }
              }
            }
          }
        }
      `;

        // Fetch products from Shopify
        const response = await axios({
            url: `https://${shopname}/admin/api/2024-01/graphql.json`,
            method: "POST",
            headers: {
                "X-Shopify-Access-Token": access_token,
                "Content-Type": "application/json",
            },
            data: JSON.stringify({ query }),
        });

        if (!response.data || !response.data.data || !response.data.data.products) {
            const rep = responseHandler(statusMaker.internalError, "No data found")
            return res.status(statusMaker.internalError).json(rep);
        }

        const products = response.data.data.products.edges.map((edge) => {
            const product = edge.node;

            const productMetafields = product.metafields.edges.reduce((acc, meta) => {
                acc[meta.node.key] = meta.node.value;
                return acc;
            }, {});

            const productData = {
                productId: product.id,
                rewardPoints: productMetafields["reward_points"] || "0",
                store: processedStore,
            };
            const productCategories = product.collections.edges.map((collectionEdge) => ({
                id: collectionEdge.node.id,
                title: collectionEdge.node.title,
            }));
            redeemProduct.create(productData);
            return {
                node: {
                    id: product.id,
                    title: product.title,
                    description: product.description || "",
                    publishedAt: product.publishedAt || null,
                    tags: product.tags || [],
                    categories: productCategories,
                    images: {
                        edges: product.images.edges.map((imgEdge) => ({
                            node: {
                                src: imgEdge.node.src,
                            },
                        })),
                    },
                    variants: {
                        nodes: product.variants.edges.map((variantEdge) => ({
                            id: variantEdge.node.id,
                            price: variantEdge.node.price,
                            compareAtPrice: variantEdge.node.compareAtPrice || null,
                            inventoryQuantity: variantEdge.node.inventoryQuantity || 0,
                        })),
                    },
                    product_min_capping: productMetafields["product_min_capping"] ? productMetafields["product_min_capping"] : "0",
                    product_max_capping: productMetafields["product_max_capping"] ? productMetafields["product_max_capping"] : "0",
                    product_redeem_points: productMetafields["product_redeem_points_"] ? productMetafields["product_redeem_points_"] : '0',
                    productDetails: JSON.parse(productMetafields["product_details"] ? productMetafields["product_details"] : 'No Details Found'),
                    productDescription: productMetafields["product_description"] ? productMetafields["product_description"] : 'No Description Found'
                },
            };
        });
        const rep = responseHandler(statusMaker.found, "Fetch data successfully", products)
        return res.status(statusMaker.found).json(rep);
    } catch (error) {
        const rep = errorHandler(`Something went wrong ${error.message}`)
        return res.status(statusMaker.found).json(rep);
    }
};

export const filterProductsByCategories = async (req, res) => {
    try {
        const { category, store } = req.query;
        if (!category) {
            return res.status(400).json({ message: "Category is required." });
        }
        const processedStore = await storeHandler(store);
        const storeCredentials = await accessSchema.findOne({ where: { store: processedStore } });
        if (!storeCredentials) {
            return res.status(400).json({ message: "Store credentials not found." });
        }
        const { shopname, access_token } = storeCredentials;
        let handleType, query, respon;
        if (category == 'Hing' || category == 'hing') {
            handleType = "hing-asafoetida"
        } else if (category == 'Straight Spices' || category == 'straight spices') {
            handleType = "straight-spices"
        }
        else if (category == 'Sprinklers' || category == 'sprinklers') {
            handleType = "sprinklers"
        }
        else if (category == 'Whole-Spices' || category == 'whole-spices') {
            handleType = "whole-spices"
        }
        else if (category == 'Blends' || category == 'blends') {
            handleType = "blends"
        }
        else {
            handleType = null
        }
        if (handleType !== null) {
            query = `
            {
       collectionByHandle(handle: "${handleType}") {
         handle
         products(first: 10) {
           edges {
             node {
               handle
               title
               id
               handle
               tags
               images(first: 5) {
                                 edges {
                                     node {
                                         src
                                     }
                                 }
                             }
               variants(first: 1) {
                     edges {
                         node {
                         id
                         sku
                         price
                         inventoryQuantity
                         weight
                         weightUnit
                         }
                     }
                 }
             }
           }
         }
       }
     }`;
        }
        else {
            query = `
            {
    products(first: 10, query:"tag:redeem status:active") {
      edges {
        node {
          handle
          title
          id
          tags
          images(first: 5) {
            edges {
              node {
                src
              }
            }
          }
          variants(first: 1) {
            edges {
              node {
                id
                sku
                price
                inventoryQuantity
                weight
                weightUnit
              }
            }
          }
        }
      }
    }
  }`;
        }

        const response = await axios({
            url: `https://${shopname}/admin/api/2024-01/graphql.json`,
            method: "POST",
            headers: {
                "X-Shopify-Access-Token": access_token,
                "Content-Type": "application/json",
            },
            data: JSON.stringify({ query }),
        });
        if (handleType != null) {
            let result = response.data.data.collectionByHandle.products.edges
            respon = result.map((item) => ({
                node: {
                    ...item.node,
                    variants: {
                        nodes: item.node.variants && item.node.variants.edges
                            ? item.node.variants.edges.map((edge) => ({
                                id: edge.node.id,
                                price: edge.node.price,
                                compareAtPrice: null,
                                inventoryQuantity: edge.node.inventoryQuantity,
                            }))
                            : []  // If variants or edges are undefined, return an empty array
                    },
                },
            }));
        }
        else {
            let result = response.data.data.products.edges;
            respon = result.map((item) => ({
                node: {
                    ...item.node,
                    variants: {
                        nodes: item.node.variants && item.node.variants.edges
                            ? item.node.variants.edges.map((edge) => ({
                                id: edge.node.id,
                                price: edge.node.price,
                                compareAtPrice: null,
                                inventoryQuantity: edge.node.inventoryQuantity,
                            }))
                            : []  // If variants or edges are undefined, return an empty array
                    },
                },
            }));
        }
        const rep = responseHandler(statusMaker.found, "Fetch data successfully", respon)
        return res.status(statusMaker.found).json(rep);
    } catch (error) {
        const rep = errorHandler(`Something went wrong ${error.message}`);
        return res.status(statusMaker.internalError).json(rep);
    }
};


// ---------------------------Shopify Team --------------------------

export const filterShopifyRajnigandhaProducts = async (req, res) => {
    try {
        let { store, minPoint, maxPoint, search, category, sortBy } = req.query;
        store = await storeHandler(store);

        const storeCredentials = await accessSchema.findOne({ where: { store } });
        if (!storeCredentials) {
            return res.status(statusMaker.notFound).json({
                message: "Store credentials not found.",
            });
        }

        const { shopname, access_token } = storeCredentials;
        const query = `
        {
            products(first: 50, query:"tag:rajnigandha-redeem-product status:active") {
                edges {
                    node {
                        id
                        title
                        handle
                        bodyHtml
                        tags
                        variants(first: 1) {
                            edges {
                                node {
                                    id
                                    sku
                                    price
                                    inventoryQuantity
                                    weight
                                    weightUnit
                                }
                            }
                        }
                        metafields(first: 100) {
                            edges {
                                node {
                                    namespace
                                    key
                                    value
                                }
                            }
                        }
                        images(first: 1) {
                            edges {
                                node {
                                    src
                                }
                            }
                        }
                        collections(first: 5) {
                            edges {
                                node {
                                    title
                                }
                            }
                        }
                    }
                }
            }
        }
    `;

        const response = await axios({
            url: `https://${shopname}/admin/api/2024-01/graphql.json`,
            method: 'POST',
            headers: {
                'X-Shopify-Access-Token': access_token,
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({ query }),
        });

        if (!response.data || !response.data.data || !response.data.data.products) {
            return res.status(statusMaker.internalError).json(responseHandler(statusMaker.internalError, "No data found"));
        }

        // Process Shopify Data
        let filteredProducts = response.data.data.products.edges.map((edge) => {
            const product = edge.node;
            const variant = product.variants.edges[0]?.node;
            const inventoryQuantity = variant?.inventoryQuantity || 0;
            const netWeight = `${variant?.weight || ''} ${variant?.weightUnit || ''}`;
            const mainImage = product.images.edges[0]?.node?.src || '';
            const metafields = product.metafields.edges.map(meta => ({
                namespace: meta.node.namespace,
                key: meta.node.key,
                value: meta.node.value,
            }));

            // Extract product points
            const productPointsMetafield = metafields.find(meta => meta.key === "product_redeem_points_");
            const productPoint = productPointsMetafield ? parseInt(productPointsMetafield.value) : 0;

            // Extract category names
            const categoryName = product.collections.edges.map(collection => collection.node.title).join(', ') || 'Uncategorized';

            return {
                productId: product.id.split('/').pop(),
                productName: product.title,
                productHandle: product.handle,
                productSKU: variant?.sku || '',
                productImage: mainImage,
                categoryName,
                price: variant?.price ? parseFloat(variant.price) : 0,
                tagName: product.tags.join(', ') || '',
                availableQuantity: inventoryQuantity,
                rewarPoints: productPoint,
                stock: inventoryQuantity > 0 ? 'Yes' : 'No',
                netWeight,
                description: product.bodyHtml || '',
            };
        });

        // **Apply Filters**
        if (minPoint) {
            filteredProducts = filteredProducts.filter(product => product.price >= parseInt(minPoint));
        }
        if (maxPoint) {
            filteredProducts = filteredProducts.filter(product => product.price <= parseInt(maxPoint));
        }
        if (search) {
            const searchLower = search.toLowerCase();
            filteredProducts = filteredProducts.filter(product =>
                product.productName.toLowerCase().includes(searchLower)
            );
        }
        if (category) {
            const categoryLower = category.toLowerCase();
            filteredProducts = filteredProducts.filter(product =>
                product.categoryName.toLowerCase().includes(categoryLower)
            );
        }

        // **Apply Sorting**
        if (sortBy === 'high_to_low') {
            filteredProducts.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'low_to_high') {
            filteredProducts.sort((a, b) => a.price - b.price);
        }

        if (filteredProducts.length === 0) {
            return res.status(statusMaker.success).json(responseHandler(statusMaker.success, "No data found", filteredProducts));
        }

        return res.status(statusMaker.found).json(responseHandler(statusMaker.found, "Fetch data successfully", filteredProducts));
    } catch (error) {
        return res.status(statusMaker.internalError).json(errorHandler(`Something went wrong ${error.message}`));
    }
};

export const filterShopifyFoodProducts = async (req, res) => {
    try {
        const { minPoint, maxPoint, search, sortBy, category, store } = req.query;
        const processedStore = await storeHandler(store);

        const storeCredentials = await accessSchema.findOne({ where: { store: processedStore } });
        if (!storeCredentials) {
            return res.status(statusMaker.notFound).json({
                message: "Store credentials not found.",
            });
        }

        const { shopname, access_token } = storeCredentials;
        const query = `
        {
            products(first: 10, query:"tag:food_redeem_product status:active -status:draft") {
                edges {
                    node {
                        id
                        title
                        handle
                        bodyHtml
                        tags
                        variants(first: 1) {
                            edges {
                                node {
                                    id
                                    sku
                                    price
                                    inventoryQuantity
                                    weight
                                    weightUnit
                                }
                            }
                        }
                        metafields(first: 100) {
                            edges {
                                node {
                                    namespace
                                    key
                                    value
                                }
                            }
                        }
                        images(first: 5) {
                            edges {
                                node {
                                    src
                                }
                            }
                        }
                        collections(first: 5) {
                            edges {
                                node {
                                    title
                                }
                            }
                        }
                    }
                }
            }
        }
    `;

        const response = await axios({
            url: `https://${shopname}/admin/api/2024-01/graphql.json`,
            method: 'POST',
            headers: {
                'X-Shopify-Access-Token': access_token,
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({ query }),
        });

        if (!response.data?.data?.products) {
            return res.status(statusMaker.internalError).json(responseHandler(statusMaker.internalError, "No data found", []));
        }

        let result = response.data.data.products.edges.map(edge => {
            const product = edge.node;
            const variant = product.variants.edges[0]?.node;
            const inventoryQuantity = variant?.inventoryQuantity || 0;
            const netWeight = `${variant?.weight || ''} ${variant?.weightUnit || ''}`;
            const mainImage = product.images.edges[0]?.node?.src || '';
            const metafields = product.metafields.edges.map(meta => ({
                namespace: meta.node.namespace,
                key: meta.node.key,
                value: meta.node.value,
            }));

            const productPointsMetafield = metafields.find(meta => meta.key === "product_redeem_points_");
            const productPoint = productPointsMetafield ? parseInt(productPointsMetafield.value) : 0;

            const categoryName = product.collections.edges.map(collection => collection.node.title).join(', ') || 'Uncategorized';

            return {
                productId: product.id.split('/').pop(),
                productName: product.title,
                productHandle: product.handle,
                productSKU: variant?.sku || '',
                productImage: mainImage,
                categoryName,
                tagName: product.tags.join(', ') || '',
                price: parseFloat(variant?.price || '0'),
                availableQuantity: inventoryQuantity,
                rewarPoints: productPoint,
                stock: inventoryQuantity > 0 ? 'Yes' : 'No',
                netWeight,
                description: product.bodyHtml || '',
                thumbnailImage: mainImage,
                notified: false,
                updateByStaff: 'superAdmin',
                status: 'active',
                store: processedStore,
            };
        });

        // Apply filters on the fetched result
        if (minPoint) {
            result = result.filter(product => product.price >= parseInt(minPoint));
        }
        if (maxPoint) {
            result = result.filter(product => product.price <= parseInt(maxPoint));
        }
        if (search) {
            result = result.filter(product => product.productName.toLowerCase().includes(search.toLowerCase()));
        }
        if (category) {
            result = result.filter(product => product.categoryName.toLowerCase().includes(category.toLowerCase()));
        }

        // Sorting
        if (sortBy === 'high_to_low') {
            result.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'low_to_high') {
            result.sort((a, b) => a.price - b.price);
        }
        return res.status(statusMaker.found).json(responseHandler(statusMaker.found, "Fetch data successfully", result));

    } catch (error) {
        return res.status(statusMaker.internalError).json(errorHandler(`Something went wrong ${error.message}`));
    }
};

export const generateDataInPDF = async (req, res) => {
    try {
        const { store, accountId, orderId } = req.query;
        const processedStore = await storeHandler(store);
        const redemptions = await order_redeem_product.findAll({
            where: {
                store: processedStore, account_number: accountId, order_id: orderId
            },
        });
        if (redemptions.length === 0) {
            return res.status(404).json({
                message: "No order redeem records found.",
            });
        }
        const rep = responseHandler(statusMaker.success, apiMessages.found, redemptions)
        return res.status(statusMaker.success).json(rep)
    } catch (error) {
        const resp = errorHandler(error.message)
        return res.status(statusMaker.internalError).json(resp)
    }
}

export const sendProductOrderPDF = async (req, res) => {
    try {
        const { orderId, accountId, store } = req.body;
        const processedStore = await storeHandler(store)
        if (!order || !accountId || !req.file) {
            const rp = responseHandler(statusMaker.badRequest, "Missing required Fields.")
            return res.status(statusMaker.badRequest).json(rp)
        }
        const orderPdfFilePath = req.pdfPath;
        const locatePath = path.join(__dirname, '../../../uploads/images/', orderPdfFilePath);
        const pdfBuffer = fs.readFileSync(locatePath);
        const base64EncodedPdf = pdfBuffer.toString('base64');

        const findProductOrder = await order_redeem_product.findAll({ where: { account_number: accountId, order_id: orderId, store: processedStore } })
        if (!findProductOrder.length) {
            const rp = responseHandler(statusMaker.notFound, apiMessages.notFound)
            return res.status(statusMaker.notFound).json(rp)
        }
        let products = [];
        const productData = findProductOrder[0];
        for (let i = 0; i < productData.product_name.length; i++) {
            const product = {
                name: productData.product_name[i][`p${i + 1}`],  // Get product name dynamically (p1, p2, etc.)
                sku: productData.product_sku[i][`p${i + 1}`],    // Get SKU dynamically (p1, p2, etc.)
                quantity: productData.product_quantity[i][`p${i + 1}`]  // Get quantity dynamically (p1, p2, etc.)
            };

            // Push the product data into the products array
            products.push(product);
        }
        const createdAt = new Date(productData.createdAt);
        const formattedDate = `${createdAt.getDate().toString().padStart(2, '0')}/${(createdAt.getMonth() + 1).toString().padStart(2, '0')}/${createdAt.getFullYear()}`;
        console.log(formattedDate);

        const whatsappDetails = {
            name: productData.name,
            email: productData.email,
            products,
            orderId,
            base64EncodedFile: base64EncodedPdf,
            purchaseDate: formattedDate,
            order_pdf_name: req.file.originalname
        }
        if (productData.email && productData.email !== "") {
            sendOrderPdfOverMail(whatsappDetails)
        }
        else {
            fs.unlinkSync(locatePath);
            const resp = responseHandler(statusMaker.badRequest, "Customer Email isn't update in profile!")
            return res.status(statusMaker.badRequest).json(resp)
        }
        fs.unlinkSync(locatePath);
        const resp = responseHandler(statusMaker.success, "Order PDF has been sent successfully!", {
            data: {
                path: req.pdfPath,
                base64EncodedPdf
            }
        })
        return res.status(statusMaker.success).json(resp)
    } catch (error) {
        const resp = errorHandler(error.message)
        return res.status(statusMaker.internalError).json(resp)
    }
}