// import axios from "axios";
import { responseHandler } from "../../helpers/responsehandler";
import { errorHandler } from "../../helpers/errorhandler";
import { statusMaker } from "../../helpers/statusmaker";
import { apiMessages } from "../../helpers/message";
import {
    accessSchema, dsProduct, customer, tag, category, voucherBrands, productReedem,
    customerProducts, order, transition, point,redeemProduct,order_redeem_product
} from "../../../models/index";
import { checkEmptyArray, checkUndefined } from "../../helpers/utils";
import { storeHandler, generateId } from '../../helpers/websiteHandler'
import { availabilityPincode, createShipmentInDelhivery, createShippmentInShipRocket } from '../shipping/controller'
import { config } from '../../config/index'
import { createTransaction } from '../../helpers/transaction'
import { handleTemplateType, handleWhatsappTemplateType,sendSMSOTPVoucher ,sendOrderPdfOverMail} from "../../helpers/smstemplate";
import {
    // fetchCategoriesFromDB,
    // fetchDBTags,
    // fetchTags,
    // updateCategoryStatus,
    // fetchDSShopifyProducts,
    // deleteCategoryById,
    // deleteTagById,
    // updateTagById,
    // fetchDSCategories,
    // deleteProduct,
    // addDSShopifyProducts
    // , getProductById,
    // filterProduct, 
    // filterCategories, 
    // filterTags, 
    // updateProduct, 
    // addProduct, 
    // addCategory, 
    // createTag,
    // updateproductPoints,
    getAllRedeemProducts,
    sendProductReedeemOTP,
    verifyProductOTP,
    // getShopifyFoodProducts,
    // getShopifyRajnigandhaProducts,
    getRedeemProductById,
    filterShopifyFoodProducts,
    filterShopifyRajnigandhaProducts,
    getProductForRedeem,
    productsOrderList,
    filterProductsByCategories,
    generateDataInPDF,
    sendProductOrderPDF
    //  getAllRedeemProductsByCategory
}
    from "./controller";

export {
    responseHandler,
    errorHandler,
    checkEmptyArray,
    checkUndefined,
    statusMaker,
    apiMessages,
    accessSchema,
    voucherBrands,
    customer,
    dsProduct,
    tag,
    category,
    productReedem,
    config,
    customerProducts,
    order,
    transition,
    point,
    createTransaction,
    generateId,
    redeemProduct,
    order_redeem_product,
    generateDataInPDF,
    sendProductOrderPDF,
    sendOrderPdfOverMail,
    // fetchDSCategories,
    // fetchCategoriesFromDB,
    // fetchDBTags,
    // fetchTags,
    // updateCategoryStatus,
    // fetchDSShopifyProducts,
    // deleteCategoryById,
    // deleteTagById,
    // updateTagById,
    // deleteProduct,
    // addDSShopifyProducts,
    // getProductById,
    // filterProduct,
    // filterCategories,
    // filterTags,
    storeHandler,
    // updateProduct,
    // addProduct,
    // addCategory,
    // createTag,
    getAllRedeemProducts,
    availabilityPincode,
    createShipmentInDelhivery,
    createShippmentInShipRocket,
    sendProductReedeemOTP,
    // getShopifyFoodProducts,
    // getShopifyRajnigandhaProducts,
    // updateproductPoints,
    getRedeemProductById,
    filterShopifyFoodProducts,
    filterShopifyRajnigandhaProducts,
    handleTemplateType, 
    handleWhatsappTemplateType,
    sendSMSOTPVoucher,
    verifyProductOTP,
    getProductForRedeem,
    productsOrderList,
    filterProductsByCategories
    // getAllRedeemProductsByCategory
};
