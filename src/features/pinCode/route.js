import { Router } from "express";
import multer from "multer";
import { addPin ,getPin,updatePin,deletePin,importPin,giftStorageMulter,fileFilter,searchPinCode,
    getAllStateName,filterByStateName
} from "./index";
const router = Router()

const uploadPin = multer({ storage: giftStorageMulter,fileFilter: fileFilter });

router.post('/addPinCode',addPin)
router.get('/getPincode',getPin)
router.put('/putPincode',updatePin)
router.delete('/deletePincode',deletePin)
router.post('/importpincodes',uploadPin.single('pin'),importPin)
router.get('/searchPins',searchPinCode)
router.get('/getStateNames',getAllStateName)
router.get('/filterState',filterByStateName)

export default router;