import { module } from "./module.js";
import { permission } from "./permission.js";
import { roles } from "./role.js";
import { user } from "./user.js";
import { staff } from "./staff.js";
import { customer } from "./customer.js";
import { ruleSetSchema } from "./ruleset.js";
import { tier_mangement } from "./tier_mangement.js";
import { cmm } from "./customer_member_mangement.js";
import { rptSchema } from "./reward_point_transaction.js";
import { point } from "./point.js";
import { transition } from "./transittion.js";
// import { customerImport } from "./customerImport";
// import { paywithrewardsSchema } from "./paywithrewards";
import { RuleSetModified } from "./rulesetmodified.js";
import { paywithrewards } from "./pay_with_reward.js";
import { point_checkout } from "./pointcheckout.js";
import { category } from "./category.js";
import { tag } from "./productTag.js";
import { product } from "./product.js";
import { voucherBrands } from "./voucherbrands.js";
import { customerVoucher,customerData,customerProducts } from "./customerVoucher.js"
import { couponSchema } from "./coupon.js";
import { registration } from "./registerations_point.js";
import { campaign} from "./campaign.js"
import {transactionNew} from "./transaction_new.js"
// import { product } from "./product";

import { accessSchema } from "./access.js";
import { dsProduct } from "./dsProducts.js";
import { TempGiftActivity ,gift,giftOrders,giftShipment} from "./gift.js";
import { pinCode } from "./pinCode.js";
import { shiprocket ,shipment} from "./shipment.js";
import { Notification } from "./notification.js"; 
import { productReedem } from "./product_reedem.js";
import { order } from "./order.js";
import { campaign_new } from "./campaignNew.js";
import { Notification_new } from "./notification_new.js";
import { redeemProduct } from "./dsProducts.js"
import { customer_redeem_rule } from "./customer_redeem_rule.js"
import { order_redeem_product } from "./order_redeem_product.js"
import { customersNEW } from "./custNew.js";
import { customer_campaign_data } from "./customer_campaign_data.js";










  // import { templateSchema } from "./template";

// export { module, permission, roles, user, staff,customer,ruleSetSchema ,tier_mangement,cmm};

export {
  module,
  permission,
  roles,
  user,
  staff,
  customer,
  ruleSetSchema,
  tier_mangement,
  cmm,
  rptSchema,
  point,
  transition,
//   customerImport,
//   paywithrewardsSchema
  RuleSetModified,
  paywithrewards,
  point_checkout,
  couponSchema,
  registration,
  campaign,
  product,
  accessSchema,
  category,
  tag,
  gift,
  customerVoucher,
  voucherBrands,
  dsProduct,
  customerData,
  TempGiftActivity,
  pinCode,shiprocket,giftOrders,giftShipment,
  Notification,
  productReedem,
  customerProducts,
  order,
  shipment,
  campaign_new,
  Notification_new,
  redeemProduct,
  customer_redeem_rule,
  order_redeem_product,
  customersNEW,
  transactionNew,
  customer_campaign_data
  // templateSchema
};
