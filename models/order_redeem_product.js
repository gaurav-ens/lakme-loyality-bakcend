import Sequelize from "sequelize";
import sequelize from "../src/config/db.js";

// Helper functions for parsing JSON-like fields
function parseJSONField(field) {
  try {
    return JSON.parse(field);
  } catch (error) {
    console.warn("Error parsing JSON field:", error);
    return field; // Return the original field if parsing fails
  }
}

export const order_redeem_product = sequelize.define("order_redeem_product", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  product_name: {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify({
  
    }),
    get() {
      return parseJSONField(this.getDataValue("product_name"));
    },
  },
  product_sku: {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify({
  
    }),
    get() {
      return parseJSONField(this.getDataValue("product_sku"));
    },
  },  product_quantity: {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify({
  
    }),
    get() {
      return parseJSONField(this.getDataValue("product_quantity"));
    },
  },
  product_redeem_point: {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify({
  
    }),
    get() {
      return parseJSONField(this.getDataValue("product_redeem_point"));
    },
  },
  product_actual_point:{
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify({
  
    }),
    get() {
      return parseJSONField(this.getDataValue("product_actual_point"));
    }, 
  },
  order_name: {
    type: Sequelize.STRING(255),
  },
  order_number: {
    type: Sequelize.STRING(255),
  },
  pincode: {
    type: Sequelize.STRING(255),
  },
  name: {
    type: Sequelize.STRING(255),
  },
  account_number: {
    type: Sequelize.STRING(255),
  },
  contact_no: {
    type: Sequelize.STRING(255),
  },
  email: {
    type: Sequelize.STRING(255),
  },
  order_id: {
    type: Sequelize.STRING(255),
  },
  redeem_points: {
    type: Sequelize.STRING(255),
  },
  status: {
    type: Sequelize.STRING(255),
  },
  billing_address: {
    type: Sequelize.STRING(255),
  },
  redeem_date: {
    type: Sequelize.STRING(255),
  },
  store: {
    type: Sequelize.STRING(255),
    defaultValue: "lakme",
  },
  source_of_device: {
    type: Sequelize.STRING(255),
    default: "website",
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
