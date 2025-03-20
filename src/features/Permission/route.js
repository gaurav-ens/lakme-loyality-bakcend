import express from "express";
const router = express.Router();
import { create, list, deleted, getById, update } from "./index";

router.post("/create", create);
router.get("/list", list);
router.delete("/delete", deleted);
router.get("/getById", getById);
router.put("/update", update);

export default router;
