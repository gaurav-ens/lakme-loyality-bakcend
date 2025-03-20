import express from "express";
const router = express.Router();
import { createProduct, getProduct, updateProduct, deleteProduct } from "./index";

router.post("/createProduct",createProduct)
router.get("/getProduct",getProduct)
router.put("/updateProduct",updateProduct)
router.delete("/deleteProduct/:id",deleteProduct)

export default router;
