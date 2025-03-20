import express from "express";
const router = express.Router();
import {
  couponRedeem,
  // couponImport,
  list,
  usedCouponList,
  expiredCouponList,
  couponSearch,
  usedcouponSearch,
  expiredcouponSearch,
  handleWhatsappTemplateType,
  handleTemplateType,
  getById,
  getBetchID,
  update,
  getInactive,
  filterCouponCodes,
  editExpiredCoupon,
  couponSearchCouponExpired,
  checkCouponDuplicates,
  type1CouponImport,
  deleteExpiredCoupon
} from "./index";
import multer from "multer";
import { deleteCoupon } from "./controller";
import path from "path";
import { unlinkSync } from "fs";
import { verifyToken } from "../../middleware/auth";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); 
  },
});

const fileFilter = (req, file, cb) => {
  const fileTypes = [".xls", ".xlsx"];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (fileTypes.includes(ext)) {
    cb(null, true);
  } else {
    req.fileForbidden = 'forbidden';
    cb(null, true);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

const checkFileSecurity = (req, res, next)=>{
  if(req.fileForbidden){
    const filePath = path.join(__dirname, '../../../', req.file.path);
    unlinkSync(filePath);
    return res.status(403).json({
      success:false,
      message:'Only Excel files are allowed!'
    });
  }
  next();
}
// const upload = multer({ dest: 'uploads/' });
// router.post("/couponImport", upload.single("file"), couponImport);
router.post("/checkCouponDuplicates", upload.single("file"), checkFileSecurity, checkCouponDuplicates);
router.post("/couponImport", type1CouponImport);
router.post("/couponredeem",
  handleTemplateType,
  handleWhatsappTemplateType,
  couponRedeem);
router.get("/list", list);
router.get("/usedcouponlist", usedCouponList);
router.get("/expiredcouponlist", expiredCouponList);
router.get("/couponSearch", couponSearch);
router.get("/usedcouponsearch", usedcouponSearch);
router.get("/expiredcouponSearch", expiredcouponSearch);
router.get("/getById", getById);
router.get("/getBetchID", getBetchID);
router.put("/update", update);
router.get("/getInactive", getInactive);
router.get("/filterCouponCodes", filterCouponCodes);
//router.put("/editExpiredCoupon", editExpiredCoupon); // to be cover in phase 2
router.delete("/deleteExpiredCoupon", deleteExpiredCoupon);
router.delete("/deleteCoupon", deleteCoupon);
router.get("/couponSearchCouponExpired", couponSearchCouponExpired);

export default router;