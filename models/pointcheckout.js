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


export const point_checkout = sequelize.define("point_checkout", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  checkout_id: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  customerId: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  lineItems: {
    type: Sequelize.TEXT,
    get() {
      return parseJSONField(this.getDataValue("lineItems"));
    },
  },
  subtotalPrice: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  totalPrice: {
    type: Sequelize.STRING,
  },
  overallCalculatedPoints: {
    type: Sequelize.STRING,
  },
  calculatedPoints: {
    type: Sequelize.TEXT,
    get() {
      return parseJSONField(this.getDataValue("calculatedPoints"));
    },
  },
  pointExpiry: {
    type: Sequelize.STRING,
  },
  store: {
    type: Sequelize.STRING(255),
    defaultValue: "lakme"
},
  creditAfterDays: {
    type: Sequelize.STRING,
  }, source_of_device: {
    type: Sequelize.STRING(255),
    default : "lakme"
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
