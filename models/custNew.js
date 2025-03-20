import Sequelize from "sequelize";
import sequelize from "../src/config/db.js";

export const customersNEW = sequelize.define("customersNEW", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
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
  first_name: {
    type: Sequelize.STRING,
  },
  last_name: {
    type: Sequelize.STRING,
  },
  date_of_birth: {
    type: Sequelize.STRING,
  },
  address1: {
    type: Sequelize.STRING,
  },
  address2: {
    type: Sequelize.STRING,
  },
  city: {
    type: Sequelize.STRING,
  },
  country: {
    type: Sequelize.STRING,
  },
  zip: {
    type: Sequelize.STRING,
  },
  earned_point: {
    type: Sequelize.STRING,
  },
  redeem_point: {
    type: Sequelize.STRING,
  },
  expiry_point: {
    type: Sequelize.STRING,
  },
  balance_point: {
    type: Sequelize.STRING,
  },
  membership_tier: {
    type: Sequelize.STRING,
  },
  membership_status: {
    type: Sequelize.STRING,
  },
  registration_date: {
    type: Sequelize.STRING,
  },
  registration_time: {
    type: Sequelize.STRING,
  },
  gender: {
    type: Sequelize.STRING,
  },
  maritial_status: {
    type: Sequelize.STRING,
  },
  marriage_anniversary: {
    type: Sequelize.STRING,
  },
  State: {
    type: Sequelize.STRING,
  },
  Distrtict: {
    type: Sequelize.STRING,
  },
  source_of_device: {
    type: Sequelize.STRING(255),
    default: "lakme",
  },
  store: {
    type: Sequelize.STRING(255),
    default: "lakme",
  },
  is_product_redeem: {
    type: Sequelize.STRING(255),
  },
  is_voucher_redeem: {
    type: Sequelize.STRING(255),
  },
  createdAt: {
    type: Sequelize.DATE,
    allowNull: false,
    field: "created_at",
  },
  updatedAt: {
    type: Sequelize.DATE,
    allowNull: true,
    field: "updated_at",
  },
});