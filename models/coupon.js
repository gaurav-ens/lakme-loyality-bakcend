import Sequelize from "sequelize";
import sequelize from "../src/config/db.js";

export const couponSchema = sequelize.define(
  "coupons",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    couponBatchId: {
      type: Sequelize.INTEGER,
    },
    sno: {
      type: Sequelize.STRING(255),
    },
    code: {
      type: Sequelize.STRING(255),
    },
    QRcode: {
      type: Sequelize.TEXT,
    },
    points: {
      type: Sequelize.INTEGER,
    },
    stdate: {
      type: Sequelize.STRING,
    },
    enddate: {
      type: Sequelize.STRING,
    },
    product: {
      type: Sequelize.STRING,
    },
    productSKU: {
      type: Sequelize.STRING,
    },
    productweighatge: {
      type: Sequelize.STRING,
    },
    account_number: {
      type: Sequelize.STRING,
    },
    QRCodes: {
      type: Sequelize.STRING,
    },
    description:{
      type: Sequelize.STRING,
    },
    startTime:{
      type: Sequelize.STRING,
    },
    endTime:{
      type: Sequelize.STRING,
    },
    expiryDate: {
      type: Sequelize.STRING,
    },
    store: {
      type: Sequelize.STRING(255),
      defaultValue: "lakme",
    },
    status: {
      type: Sequelize.ENUM("Active","Inactive", "Used", "Expired"),
      defaultValue: "Active",
    },
    source_id: {
      type: Sequelize.INTEGER,
    },
    createdBy: {
      type: Sequelize.ENUM("admin", "superadmin"),
      defaultValue: "superadmin",
    },
    source_of_device: {
      type: Sequelize.STRING(255),
      default: "lakme",
    },
    redemedBy:{
      type: Sequelize.STRING,
    },
    account_number: {
      type: Sequelize.STRING,
    },
    customer_id: {
      type: Sequelize.STRING,
    },
    phone_number: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
    },
    rdate:{
        type: Sequelize.DATE
    },
    couponAccessed:{
      type: Sequelize.STRING(255),
      defaultValue: "desktop"
    },
    source:{
      type: Sequelize.STRING(255),
      defaultValue: "website"
    },
    noOfCoupon: {
      type: Sequelize.INTEGER,
    },
    isMethod:{
      type: Sequelize.STRING,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      field: "created_at",
    }
  }
);
