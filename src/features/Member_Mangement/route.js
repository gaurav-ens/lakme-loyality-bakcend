import express from "express";
const router = express.Router();
import { create, list, updateCard } from "./index";
import { verifyToken } from "../../middleware/auth";

router.post("/create", create);
router.get("/list", list);
router.post("/updateCard", updateCard);

export default router;
