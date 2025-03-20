import express from "express";
const router = express.Router();
import {
    getToken, getBrands, updateBrandStatus, getStocks, getactiveBrands, getBrandbyproductcode,
    getAllCategoryOfBrands, getBrandsForSellers, filterBrands, getAllBrandsName, getTransactionReport, 
    addVoucherRequest, getPendingVoucherRequest, getAcceptVoucherRequest, getRejectVoucherRequest, filterPendingRequest, sendVoucherRequestOtp, filterAcceptRequest,
    filterRejectRequest,getSingleVoucherDetails, verifyVoucherOTP, filterVoucherByCategory,
    filtercustomerVoucherDetails,approvePullRequest,rejectRequest,handleTemplateType,
    handleWhatsappTemplateType,filterVoucherAccordingToPrice,getApproveRequestById,
    resendVoucher,searchPendingVoucherRequest,searchApproveVoucherRequest,
    searchRejectVoucherRequest,disableResendButton,testingEmail
} from "./index";
import { verifyToken } from "../../middleware/auth";

router.get("/getToken", getToken);
router.get("/getBrands", getBrands)
router.put("/updateBrandStatus", updateBrandStatus)
router.get("/getStocks", getStocks)
router.get("/getactiveBrands", getactiveBrands)
router.get("/getBrandbyproductcode",getBrandbyproductcode)
router.get("/getAllCategoryOfBrands", getAllCategoryOfBrands)
router.get("/getBrandsForSellers", getBrandsForSellers)
router.get("/filterBrands", filterBrands)
router.get("/filterVoucherByCategory",filterVoucherByCategory)
router.get("/getAllBrandsName", getAllBrandsName)
router.get("/getTransactionList",  getTransactionReport)
router.post("/addVoucherRequest", handleTemplateType,handleWhatsappTemplateType,addVoucherRequest)
router.post("/sendVocuherRequestOTP", sendVoucherRequestOtp)
router.get("/getPendingVoucher", getPendingVoucherRequest)
router.get("/getAcceptVoucher", getAcceptVoucherRequest)
router.get("/getRejectVoucher", getRejectVoucherRequest)
router.get("/filterVoucherAccordingToPrice", filterVoucherAccordingToPrice)
router.get("/filterPendingRequest", filterPendingRequest)
router.get("/filterAcceptRequest", filterAcceptRequest)
router.get("/filterRejectRequest", filterRejectRequest)
router.get("/getVoucherBrandById",getSingleVoucherDetails)
router.post("/verifyOTP",verifyVoucherOTP)
router.get('/filtercustomerVoucherDetails',filtercustomerVoucherDetails)
router.put('/approvePullRequest', approvePullRequest)
router.put('/rejectRequest', rejectRequest)
router.get('/getRequestById', getApproveRequestById)
router.get('/resendVoucher', resendVoucher)
router.get('/searchPendingVoucherRequest', searchPendingVoucherRequest)
router.get('/searchApproveVoucherRequest', searchApproveVoucherRequest)
router.get('/searchRejectVoucherRequest', searchRejectVoucherRequest)
router.get('/disableResendButton', disableResendButton)
router.post('/testingEmail',testingEmail)

export default router;
