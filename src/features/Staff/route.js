import express from "express";
const router = express.Router();
import { create, list, update, getById, deleted } from "./index";
import { verifyToken } from "../../middleware/auth";
import { createAdmin } from "./controller";

router.post("/create", create);
router.get("/list", list);
router.put("/update", update);
router.get("/getById", getById);
router.delete("/delete", deleted);
router.post('/createAdmin', createAdmin);

export default router;
