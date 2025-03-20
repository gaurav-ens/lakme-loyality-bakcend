import express from "express";
const router = express.Router();
import { create, list,update ,getById,deleted} from "./index";

router.post("/create", create);
router.get("/list", list);
router.put('/update', update);
router.get("/getById", getById);
router.delete("/delete", deleted);


export default router;
