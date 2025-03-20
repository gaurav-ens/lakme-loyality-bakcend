import express from "express";
const router = express.Router();
import {
    // fetchDSCategories, 
    // fetchDSShopifyProducts,
    // fetchCategoriesFromDB, 
    // fetchTags,
    // fetchDBTags,
    // updateCategoryStatus,
    // deleteCategoryById,
    // updateTagById,
    // deleteTagById,
    // deleteProduct,
    // addDSShopifyProducts,
    // getProductById,
    // filterProduct,
    // filterCategories,
    // filterTags,
    // updateProduct,
    // addProduct,
    // addCategory,
    // createTag,
    // getAllRedeemProductsByCategory
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
    // handleTemplateType, 
    // handleWhatsappTemplateType
} from './index'
import { verifyToken } from "../../middleware/auth";

import multer from 'multer';
import path from 'path'

const storageOrderPdf = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/images')
      // cb(null, './src/assests/images/orderpdf')
    },
    filename: function (req, file, cb) {
      const fArr = file.originalname.split('.');
      const pdfName = fArr[0]+"-"+Date.now()+path.extname(file.originalname);
      const pdfPath = `/${pdfName}`;
      req.pdfPath = pdfPath;
      cb(null, pdfName);
    }
});

let uploadPdf = multer({ storage: storageOrderPdf })

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/dsProduct'); // Directory where files will be saved
//     },
//     filename: (req, file, cb) => {
//         const uniqueName = `${Date.now()}-${file.originalname}`;
//         cb(null, uniqueName);
//     },
// });

// const upload = multer({ storage });

// router.get("/addDSProducts", addDSShopifyProducts);
// router.get("/getDSProducts", fetchDSShopifyProducts);
// router.put('/updateProductData',updateProduct)
// router.get('/getProductById',getProductById)
// router.delete('/deleteProduct',deleteProduct)
// router.get('/filterProducts',filterProduct)
// router.post('/addProduct',upload.fields([
//     { name: 'productImage', maxCount: 1 }, 
//     { name: 'productThumbnail', maxCount: 6 }, 
// ]),addProduct)

// router.post('/addCategory',addCategory)
// router.get("/getAllCategories",fetchDSCategories)
// router.get('/fetchDBCategories',fetchCategoriesFromDB)
// router.put('/updateCategory',updateCategoryStatus)
// router.delete('/deleteCategory',deleteCategoryById)
// router.get('/filtercategories',filterCategories)

// router.post('/addTag',createTag)
// router.get('/fetchTags',fetchTags)
// router.get('/fetchDBTags',fetchDBTags)
// router.put('/updateTag',updateTagById)
// router.delete('/deleteTag',deleteTagById)
// router.get('/filtertags',filterTags)
// router.put('/updatepoints',updateproductPoints)
// router.get('/getRedeemProductByCategory',getAllRedeemProductsByCategory)

router.get('/getReedemProduct', getAllRedeemProducts)
router.post('/sendProductReedeemOTP',sendProductReedeemOTP)
router.post('/verifyProductOTP',verifyProductOTP)
// router.get('/getShopifyFoodProducts', getShopifyFoodProducts)
// router.get('/getShopifyRajnigandhaProducts', getShopifyRajnigandhaProducts)
router.get('/getRedeemProductById', getRedeemProductById)
router.get('/filterShopifyFoodProducts', filterShopifyFoodProducts)
router.get('/filterShopifyRajnigandhaProducts', filterShopifyRajnigandhaProducts)
router.get('/getProductForRedeem',getProductForRedeem)
router.get('/productsOrderList',productsOrderList)
router.get('/filterProductsByCategories',filterProductsByCategories)
router.get('/generateDataInPDF',generateDataInPDF)
router.post('/sendProductOrderPDF',uploadPdf.single('pdfFile'),sendProductOrderPDF)

export default router;
