import {Router} from 'express'
import { sendEmailForWelcomeCustomer } from './index'
const router = Router()

router.get('/sendEmailForWelcomeCustomer',sendEmailForWelcomeCustomer)

export default router;

