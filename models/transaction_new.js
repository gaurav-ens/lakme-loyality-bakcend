import Sequelize from "sequelize";
import sequelize from "../src/config/db.js";

export const transactionNew = sequelize.define("migratedTransaction", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_Id: {
      type: Sequelize.STRING,
    },
    transition_id: {
      type: Sequelize.STRING,
    },
    account_number: {
      type: Sequelize.STRING,
    },
    transition_category: {
      type: Sequelize.STRING,
    },
    transition_status: {
      type: Sequelize.STRING,
    },
    medium: {
      type: Sequelize.STRING,
    },
    source_of_device: {
      type: Sequelize.STRING,
      defaultValue: "website",
    },
    point: {
      type: Sequelize.STRING,
    },
    point_used: {
      type: Sequelize.STRING,
    },
    point_remaing_used: {
      type: Sequelize.STRING,
    },
    expiry_date: {
      type: Sequelize.STRING,
    },
    expiry_status: {
      type: Sequelize.STRING,
    },
    order_id: {
      type: Sequelize.STRING,
    },
    product_detail: {
      type: Sequelize.STRING,
    },
    credit_days: {
      type: Sequelize.STRING,
    },
    store: {
      type: Sequelize.STRING(255),
      defaultValue: "lakme",
    },
    note: {
      type: Sequelize.STRING(255),
    },
    name: {
      type: Sequelize.STRING,
    },
    mobile_no: {
      type: Sequelize.STRING,
    },
    state: {
      type: Sequelize.STRING(255),
    },
    city: {
      type: Sequelize.STRING(255),
    },
    serial_no: {
      type: Sequelize.STRING,
    },
    coupon_code: {
      type: Sequelize.STRING(255),
    },
    scan_manual: {
      type: Sequelize.STRING(255),
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
      field: "created_at",
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.NOW,
      field: "updated_at",
    },
  });
  
  export const kajalnewCustomer2 = sequelize.define("kajalnewCustomer2", {
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