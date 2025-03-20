import Sequelize from "sequelize";
import sequelize from "../src/config/db.js";

export const transition = sequelize.define("transition", {
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


