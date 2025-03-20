import express from "express";
const router = express.Router();
import { getAllTransitionsByAccountNumber, create, calculatePoint } from "./index";

router.post("/getByAT", getAllTransitionsByAccountNumber);
router.post("/create", create);
router.post("/calculatePoint", calculatePoint);

export default router;
