import express from "express";
const router = express.Router();
import {
  syncShopifyCustomerMetafields,
  syncPointsFromCSV,
  customerName,
  searchApiCustomer,
  syncTransaction,
  getMigratedTransactions,
  searchTransactionData,
  filterTransactionData
} from "./index";
import { verifyToken } from "../../middleware/auth";

router.get("/syncShopifyCustomerMetafields",syncShopifyCustomerMetafields);
router.post("/syncPointsFromCSV",syncPointsFromCSV)
router.get("/customerName",customerName);
router.get("/searchApiCustomer", searchApiCustomer)
router.post("/syncTransaction",syncTransaction)
router.get("/getMigratedTransactions",getMigratedTransactions)
router.get("/searchTransactionData",searchTransactionData)
router.get('/filterTransactionData',filterTransactionData)
export default router;
