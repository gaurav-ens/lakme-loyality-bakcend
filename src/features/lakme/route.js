import express from "express";
import { loginCustomerForLakme, registerCustomerForLakme ,getAllProducts} from ".";

const router = express.Router()

router.post('/signUp',registerCustomerForLakme)
router.post('/signIn',loginCustomerForLakme)
router.get('/getAllProducts',getAllProducts)

export default router;