import express from "express";
const router = express.Router();
import { create,update,deleted,getById,list ,createModified ,getProductShopify ,createModified_new,list_new} from "./index";
import { verifyToken } from "../../middleware/auth";

router.post("/create",create)
router.get("/list",list)
router.get("/list_new", list_new)
router.put("/update",update);
router.delete("/delete",deleted);
router.get("/getById",getById);
router.post("/createModified",createModified);
router.get("/getProductShopify",getProductShopify);
router.post("/createModified_new", createModified_new);





export default router;
