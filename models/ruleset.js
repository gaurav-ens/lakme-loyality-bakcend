import Sequelize from "sequelize";
import sequelize from "../src/config/db.js";

export const ruleSetSchema = sequelize.define("rulesets", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ruleType: {
    type: Sequelize.ENUM(
      "online_purchase",
      "sku_specific",
      "retail_coupon",
      "category",
      "bonus_campaign",
      "expiry",
      "registration_based",
      "redemption",
      "paywithrewards",
      "conversionRate"
    ),
    allowNull: false,
  },
  skuNo: {
    type: Sequelize.STRING(255),
    allowNull: true,
  },
  productName: {
    type: Sequelize.STRING(255),
    allowNull: true,
  },
  purchaseValue: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  category: {
    type: Sequelize.STRING(255),
    allowNull: true,
  },
  points: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  amountEquivalent:{
    type: Sequelize.STRING,
    allowNull: true
  },
  expiresOn:{
    type: Sequelize.STRING(255),
    defaultValue:"18 Months"
  },
  bonusMultiplier: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  remarks: {
    type: Sequelize.STRING(255),
  },
  minValue:{
    type: Sequelize.INTEGER,
  },
  maxValue:{
    type: Sequelize.INTEGER,
  },
  redemption_type:{
    type: Sequelize.ENUM("partially", "fully"),
    allowNull: true
  },
  purchasethroughpay:{
    type:Sequelize.ENUM("yes","no"),
    allowNull: true
  },
  maximumPoint:{
    type: Sequelize.INTEGER,
    allowNull: true
  },
  minimumRedemption:{
    type: Sequelize.INTEGER,
    defaultValue:1000,
    allowNull: true
  },
  limitationofRedemptionperday:{
    type: Sequelize.STRING(255),
    defaultValue:"1 day",
    allowNull: true
  },
  redemablePoints:{
    type: Sequelize.INTEGER,
    allowNull: true
  },
  status: {
    type: Sequelize.ENUM("active", "inactive"),
    defaultValue: "active",
  },  
  store: {
    type: Sequelize.STRING(255),
    defaultValue: "lakme"
},
  source_of_device: {
    type: Sequelize.STRING(255),
    default : "lakme"
  },
  createdBy: {
    type: Sequelize.STRING(255),
    defaultValue: "superadmin",
  },
  createdAt: {
    type: Sequelize.DATE,
    allowNull: false,
    field: "created_at",
    defaultValue: Sequelize.NOW,
  },
  updatedAt: {
    type: Sequelize.DATE,
    allowNull: true,
    field: "updated_at",
    defaultValue: Sequelize.NOW,
  },
});

