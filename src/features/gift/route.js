import { Router } from "express";
const router = Router()
import { addGift,getGifts,updateGifts,deleteGift,getGiftById, exportCustomerDatas,getTempCustomerGiftData
    ,importCustomerData,giftStorageMulter,fileFilter,dispatchGifts,getFailedDispatchStatus,
    getSuccessDispatchStatus,editCustomerForTempGift,editOrderForGift, exportCustomersForBenefits
} from "./index";
import multer from 'multer'
import { verifyToken } from "../../middleware/auth";

const uploadGift = multer({ storage: giftStorageMulter,fileFilter: fileFilter });

router.post('/createGift', addGift)
router.get('/fetchGifts', getGifts)
router.put('/putGift', updateGifts)
router.delete('/deleteGift', deleteGift)
router.get('/fetchGiftById',getGiftById)
router.get('/exportcustomerdata', exportCustomersForBenefits)
router.post('/importCustomerData', uploadGift.single('gift'), function(req, res, next){
    if(req.fileValidationError){
        return res.status(403).json({success:false,message:req.fileValidationError});
    }
    next();
}, importCustomerData)
router.get('/getTempCustomerGiftData', getTempCustomerGiftData)
router.post('/dispatchgifts', dispatchGifts)
router.get('/getFailedDispatchData',getFailedDispatchStatus)
router.get('/getSuccessDispatchData', getSuccessDispatchStatus)
router.put('/editCustomerForTempGift', editCustomerForTempGift)
router.put('/editOrderForGift', editOrderForGift)

export default router;

