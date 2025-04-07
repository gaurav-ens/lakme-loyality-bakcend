import express from "express";
const app = express();
import bodyParser from "body-parser";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import cron from "node-cron";
dotenv.config();

import moduleRoute from "./src/features/Module/route.js";
import permissionRoute from "./src/features/Permission/route.js";
import roleRoute from "./src/features/Role/route.js";
import userRoute from "./src/features/User/route.js";
import staffRoute from "./src/features/Staff/route.js";
import loginRoute from "./src/features/auth/route.js";
import pointsRewardRoute from "./src/features/pointConversion/route.js";
import lakmeRoute from "./src/features/lakme/route.js"
import customerRoute from "./src/features/Customer/route.js";
import tier_managementRoute from "./src/features/Member_Mangement/route.js";

import voucherRoute from "./src/features/voucher/route.js"
import rptRoute from "./src/features/Rpt/route.js";
import couponRoute from "./src/features/coupon/route.js"
import point_transitionRoute from "./src/features/Point_Transaction/route.js";

import dsProducts from './src/features/dsProducts/route.js';
import campaignRoute from "./src/features/campaign/route.js"
import productRoute from "./src/features/product/route.js"
import giftRoute from "./src/features/gift/route.js"
import notificationRoute from "./src/features/notification/route.js";
import accessRoute from "./src/features/access/route.js";
import layalityNotification from "./src/features/loyalityNotification/route.js";
//import { startCouponExpiryCron } from "./src/features/coupon/index.js";
import pinCodeRoute from './src/features/pinCode/route.js'
import scriptRoute from './src/features/script/route.js';
import rclubRoute from './src/features/rclub/route.js';

// import shippingRoute from './src/features/shipping/route.js'
// imort startCouponExpiryCron
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(bodyParser.urlencoded({ extended: false, limit: "50mb" }));
app.use(bodyParser.json({ limit: "50mb" }));

// app.use(cors());
app.use(cors("*"));

app.use(morgan("dev"));

app.use("/module", moduleRoute);
app.use("/permission", permissionRoute);
app.use("/role", roleRoute);
app.use("/user", userRoute);
app.use("/staff", staffRoute);
app.use("/auth", loginRoute);
app.use("/points", pointsRewardRoute);
app.use("/customer", customerRoute);
app.use("/tier_management", tier_managementRoute);
app.use("/voucher",voucherRoute)
app.use("/rpt", rptRoute);
app.use("/point_transition", point_transitionRoute);
app.use("/coupon",couponRoute)
app.use("/dsProducts",dsProducts)
app.use("/campaign",campaignRoute)
app.use("/product",productRoute)
app.use("/gift",giftRoute)
app.use("/notification",notificationRoute);
app.use("/access",accessRoute)
app.use("/api",layalityNotification)
app.use("/pincode",pinCodeRoute);
app.use("/script",scriptRoute)
app.use("/rclub",rclubRoute)
app.use("/lakme",lakmeRoute)


// app.use("/shipping",shippingRoute)

cron.schedule('40 15 * * *', () => {
  console.log('hello');
});

const port = process.env.PORT || 8099;

app.listen(port, async () => {
  //startCouponExpiryCron
  console.log(`App is running on http://localhost:${port}`);
});
