import express from "express";
const router = express.Router();
import { getByAPE,createRewardPointTransaction,logLoginDevice } from "./index";

router.get("/getByAPE", getByAPE);
router.post("/create", createRewardPointTransaction);
router.get("/logLoginDevice", logLoginDevice);

export default router;
