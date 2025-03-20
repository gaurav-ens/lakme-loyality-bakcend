import express from "express";
const router = express.Router();
import { create,update,deleted,getById,list } from "./index";
import { verifyToken } from "../../middleware/auth";

router.post("/create", create);
router.put("/update", update);
router.delete("/delete",deleted);
router.get("/list", list);
router.get("/getById",getById);

export default router;
