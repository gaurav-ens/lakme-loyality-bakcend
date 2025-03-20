import express from "express";
const router = express.Router();
import {
  getByAPE,
  getByAccountNumber,
  // profileUpdate,
  birthdayUpdate,
  member_status_update,
  // customerImportDATA,
  customerRegistration,
  customerRegistrationRajnigandha,
  profileUpdate,
  admintransaction,
  customerName,
  customerTransactions,
  allTransition,

  getcustomerData,
  customerListTransition,
  list,
  member_tier_upgrade,
  customerTransactionsShopify,
  fetchShopifyCustomersCust,
  customerUpdate,
  applyBirthdayBenefits,
  customerTransactionsCouponShopify,
  customerShopifyUpdate,
  customerShopifyDelete
} from "./index";
import { verifyToken } from "../../middleware/auth";

router.get("/getByAPE", getByAPE);
router.get("/account-number", getByAccountNumber);
// router.post("/profileUpdate", profileUpdate);
router.get("/birthdayUpdate", birthdayUpdate);

router.post("/member_status_update", member_status_update);
router.post("/customerRegistration", customerRegistration);
router.post("/customerRegistrationRajnigandha", customerRegistrationRajnigandha);
router.post("/profileUpdate", profileUpdate);

router.post("/admintransaction", admintransaction);
router.get("/customerName", customerName);
router.post("/customerTransactions", customerTransactions);
router.get("/allTransition", allTransition);

router.get("/getcustomerData", getcustomerData);
router.get("/customerListTransition", customerListTransition);
router.get("/list", list);
// router.post("/customerImportDATA", customerImportDATA);

router.post("/member_tier_upgrade", member_tier_upgrade);
router.post("/customerTransactionsShopify", customerTransactionsShopify);
router.get("/fetchShopifyCustomersCust", fetchShopifyCustomersCust)
router.put("/customerUpdate", customerUpdate)
router.post("/applyBirthdayBenefits", applyBirthdayBenefits)
router.get("/customerTransactionsCouponShopify", customerTransactionsCouponShopify)

// New Route to update and delete customer

router.post("/customerUpdate", customerShopifyUpdate);
router.post("/customerDelete", customerShopifyDelete);



export default router;
