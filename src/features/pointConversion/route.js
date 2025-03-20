import express from "express";
const router = express.Router();
import {
  create,
  list,
  deleted,
  getById,
  update,
  fetchShopifyProducts,
  pointsSpecificSKUBasedCreate,
  pointsSpecificSKUBasedUpdate,
  pointsSpecificSKUBasedlist,
  pointsSpecificSKUBasedgetByID,
  fetchCategories,
  retailCouponCreate,
  retailCouponUpdate,
  categoriesCreate,
  categoriesUpdate,
  bonusPointCreate,
  bonusPointUpdate,
  registerbasedCreate,
  registerbasedUpdate,
  expiryCreate,
  expiryUpdate,
  pointsSpecificSKUBasedDelete,
  bonusPointDelete,
  categoriesDelete,
  registerbasedDelete,
  retailCouponDelete,
  redemptionBasedCreate,
  redemptionBasedUpdate,
  paywithRewardsCreate,
  paywithRewardsUpdate,
  addOrUpdateRuleSet,
  getActiveRules,
  checkoutDataPointcalculate,
  getAll,
  createOrUpdateRedemption,
  getAllPWR,
  deleteValue,
  editValue,
  addValue,
  updateValue,
  orderReward,
  pointCalculate,
  createOrUpdateRegistration,
  getRegistrationPoint,
  customerReedemPoint,
  updatePointStatus,
  ordertest,
  orderCancelRefund,
  subscribedProducts,
  orderNoteUpdate,
  searchApiCustomer,
  searchApiTransition,
  updateCampaignPoints,
  createTransaction,
  redeemCustomerPoints,
  updateExpiryPoints,
  update_tier_management,
  updateCustomerHeldTransitions,
  sendNotifications,
  sendNotificationsEarned,
  birthdayGiftPoint,
  fetchCustomer,
  findOrderCustomer,
  createRedemptionRuleCustomer,
  getCreateRedemptionRuleCustomer,
  getProductRedeemCustomerRule,
  updateCustomerTier,
  customerShopifyUpdateWebhook,
  customerShopifyDeleteWebhook,
  redeemOrderList,
  getOrderRedeemRule,
  getOrderRedeemFilter,
  searchApiOrderRedeem,
  updateIsRedeemCustomer,
  updateOrderNote,
  getTodaysBirthdays,
  updateCustomerMembershipTierFinacialYear,
  getSubcriptionCheck,
  getMessageCheck,
  find_campaign_customer
} from "./index";

import multer from "multer";
import { verifyToken } from "../../middleware/auth";
const upload = multer({ dest: "uploads/" });


router.post("/create", create);
router.get("/list", list);
router.delete("/delete", deleted);
router.get("/getById", getById);
router.put("/update", update);
router.get("/fetchShopifyProducts", fetchShopifyProducts);
router.post("/createSKUBased", pointsSpecificSKUBasedCreate);
router.put("/updateSKUBased", pointsSpecificSKUBasedUpdate);
router.get("/pointsSpecificSKUBasedlist", pointsSpecificSKUBasedlist);
router.get("/pointsSpecificSKUBasedgetByID", pointsSpecificSKUBasedgetByID);
router.get("/fetchCategories", fetchCategories);
router.post("/retailCouponCreate", retailCouponCreate);
router.put("/retailCouponUpdate", retailCouponUpdate);
router.post("/categoriesCreate", categoriesCreate);
router.put("/categoriesUpdate", categoriesUpdate);
router.post("/bonusPointCreate", bonusPointCreate);
router.put("/bonusPointUpdate", bonusPointUpdate);
router.post("/registerbasedCreate", registerbasedCreate);
router.put("/registerbasedUpdate", registerbasedUpdate);
router.post("/expiryCreate", expiryCreate);
router.put("/expiryUpdate", expiryUpdate);
router.delete("/pointsSpecificSKUBasedDelete", pointsSpecificSKUBasedDelete);
router.delete("/bonusPointDelete", bonusPointDelete);
router.delete("/categoriesDelete", categoriesDelete);
router.delete("/registerbasedDelete", registerbasedDelete);
router.delete("/retailCouponDelete", retailCouponDelete);
router.post("/redemptionBasedCreate", redemptionBasedCreate);
router.put("/redemptionBasedUpdate", redemptionBasedUpdate);
router.post("/paywithRewardsCreate", paywithRewardsCreate);
router.post("/paywithRewardsUpdate", paywithRewardsUpdate);

router.post("/addOrUpdateRuleSet", addOrUpdateRuleSet);
router.get("/getActiveRules", getActiveRules);
router.post("/checkoutDataPointcalculate", checkoutDataPointcalculate);
router.get("/getAll", getAll);
router.post("/createOrUpdateRedemption", createOrUpdateRedemption);
router.get("/getAllPWR", getAllPWR);
router.delete("/deleteValue", deleteValue);
router.post("/editValue", editValue);
router.post("/addValue", addValue);
router.post("/updateValue", updateValue);
 router.post("/orderReward", orderReward);
 router.post("/pointCalculate", pointCalculate);
 router.post("/createOrUpdateRegistration", createOrUpdateRegistration);
 router.get("/getRegistrationPoint", getRegistrationPoint);
 router.post("/reedem_point", customerReedemPoint);
 router.get("/updatePointStatus", updatePointStatus);
 router.post("/ordertest", ordertest);
 router.post("/orderCancelRefund", orderCancelRefund);
router.get("/subscribedProducts",subscribedProducts); 
router.post("/orderNoteUpdate", orderNoteUpdate);

router.get("/searchApiCustomer", searchApiCustomer);
router.get("/searchApiTransition", searchApiTransition);
router.post("/updateCampaignPoints", updateCampaignPoints);

router.post("/createTransaction", createTransaction);
router.post("/redeemCustomerPoints", redeemCustomerPoints);
router.get("/updateExpiryPoints", updateExpiryPoints);
router.post("/update_tier_management", update_tier_management);
router.get("/hold_transition", updateCustomerHeldTransitions);
router.post("/sendNotifications", sendNotifications);
router.post("/sendNotificationsEarned", sendNotificationsEarned);
router.get("/birthdayGiftPoint", birthdayGiftPoint);
router.post("/fetchCustomer",upload.single("file"), fetchCustomer);
router.post("/findOrderCustomer", findOrderCustomer);
router.post("/creteRedemRule", createRedemptionRuleCustomer);
router.get("/getRedemRule", getCreateRedemptionRuleCustomer);
router.post("/getRedemCustomerRule", getProductRedeemCustomerRule);
router.post("/updateCustomerTier", updateCustomerTier);
router.post("/customerShopifyUpdateWebhook", customerShopifyUpdateWebhook);
router.post("/customerShopifyDeleteWebhook", customerShopifyDeleteWebhook);
router.get("/redeemOrderList", redeemOrderList);
router.get("/getOrderRedeemRule", getOrderRedeemRule);
router.get("/getOrderRedeemFilter",  getOrderRedeemFilter);
router.get("/searchApiOrderRedeem", searchApiOrderRedeem);
router.get("/updateIsRedeemCustomer", updateIsRedeemCustomer);
router.get("/updateOrderNote", updateOrderNote);
router.get("/getTodaysBirthdays", getTodaysBirthdays);
router.get("/updateCustomerMembershipTierFinacialYear", updateCustomerMembershipTierFinacialYear);
router.get("/getSubcriptionCheck", getSubcriptionCheck);
router.get("/getMessageCheck", getMessageCheck);
router.post("/find_campaign_customer", find_campaign_customer);









export default router;
