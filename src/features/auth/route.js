import express from "express";
const router = express.Router();
import { login, logout ,resetPassword,getById, update } from "./index";
import { verifyToken } from "../../middleware/auth";

router.post("/login", login);
router.get("/logout", logout);
router.post("/resetPass",resetPassword);
router.get("/getById", getById);
router.put("/update",update)

export default router;
