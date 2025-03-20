import express from "express";
const router = express.Router();
import { create, update, deleted, getById, list } from "./index.js";

router.post("/create", create);
router.put("/update", update);
router.delete("/delete", deleted);
router.get("/getById", getById);
router.get("/list", list);

export default router;
