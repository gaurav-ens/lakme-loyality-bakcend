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

export const campaign_new = sequelize.define("campaign_new", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  product_detail: {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify({
      product_id: { start_point: "", point: "" },
      productName: { start_point: "", point: "" },
      productWeightage: { start_point: "", point: "" },
    }),
    get() {
      return parseJSONField(this.getDataValue("product_detail"));
    },
  },
 name: {
    type: Sequelize.STRING(255),
  },
  description: {
    type: Sequelize.STRING(255),
  },
  startDate: {
    type: Sequelize.STRING(255),
  },
  endDate: {
    type: Sequelize.STRING(255),
  },
  startTime: {
    type: Sequelize.STRING(255),
  },
  endTime: {
    type: Sequelize.STRING(255),
  },
  status: {
    type: Sequelize.ENUM("active", "inactive"),
    defaultValue: "inactive",
  },
  pointType: {
    type: Sequelize.ENUM("Multiplier", "Points"),
    defaultValue: "Multiplier",
  },
  welcome: {
    type: Sequelize.FLOAT,
  },
  blue: {
    type: Sequelize.FLOAT,
  },
  silver: {
    type: Sequelize.FLOAT,
  },
  gold: {
    type: Sequelize.FLOAT,
  },
  platinum: {
    type: Sequelize.FLOAT,
  },
  store: {
    type: Sequelize.STRING(255),
    defaultValue: "lakme",
  },
  source_of_device: {
    type: Sequelize.STRING(255),
    default: "lakme",
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
