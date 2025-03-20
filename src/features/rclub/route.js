import expres from 'express'
import { list,registerCustomerRclub,rewardPoint,redeemPoint ,refundPoint,reverseRewardPoint,checkBalance,pointAccountSummary,pointTransactionDetails,pointCalculateRclub} from './index'

const router = expres.Router()

// router.post('/create',create)
router.get('/list',list)
router.post('/register',registerCustomerRclub)
router.post('/rewardPoint',rewardPoint)
router.post('/redeemPoint',redeemPoint)
router.post('/refundPoint',refundPoint)
router.post('/reverseRewardPoint',reverseRewardPoint)
router.post('/checkBalance',checkBalance)
router.post('/pointAccountSummary',pointAccountSummary)
router.post('/pointTransactionDetails',pointTransactionDetails)
router.post('/pointCalculateRclub',pointCalculateRclub)





export default router;