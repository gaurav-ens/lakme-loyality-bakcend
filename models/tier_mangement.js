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

export const tier_mangement = sequelize.define("tier_mangement", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  start_mangement: {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify({
      welcome: { start_point: "", point: "" },
      blue: { start_point: "", point: "" },
      silver: { start_point: "", point: "" },
      gold: { start_point: "", point: "" },
      platinum: { start_point: "", point: "" },
    }),
    get() {
      return parseJSONField(this.getDataValue("start_mangement"));
    },
  },
  financial_year: {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify({
      select_month: "",
      select_date: "",
      end_date: "",
    }),
    get() {
      return parseJSONField(this.getDataValue("financial_year"));
    },
  },
  benefits: {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify({
      welcome: { benefit: "", expiry_date: "" },
      blue: { benefit: "", expiry_date: "" },
      silver: { benefit: "", expiry_date: "" },
      gold: { benefit: "", expiry_date: "" },
      platinum: { benefit: "", expiry_date: "" },
    }),
    get() {
      return parseJSONField(this.getDataValue("benefits"));
    },
  },
  survey_mangement: {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify({
      welcome: "",
      blue: "",
      silver: "",
      gold: "",
      platinum:""
    }),
    get() {
      return parseJSONField(this.getDataValue("survey_mangement"));
    },
  },
  profile_update: {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify({
      welcome: "",
      blue: "",
      silver: "",
      gold: "",
      platinum:""
    }),
    get() {
      return parseJSONField(this.getDataValue("profile_update"));
    },
  },
  tier_benefits: {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify({
      welcome: "",
      blue: "",
      silver: "",
      gold: "",
      platinum:""
    }),
    get() {
      return parseJSONField(this.getDataValue("tier_benefits"));
    },
  },
  bonus_benefits: {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify({
      welcome: "",
      blue: "",
      silver: "",
      gold: "",
      platinum:""
    }),
    get() {
      return parseJSONField(this.getDataValue("bonus_benefits"));
    },
  },
  twoX_reward_point: {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify({
      start_date: "",
      end_date: "",
      campaign_name: "",
      campaign_type: "",
      status: "",
      welcome: { number: "", point: "" },
      blue: { number: "", expiry_date: "" },
      silver: { number: "", expiry_date: "" },
      gold: { number: "", expiry_date: "" },
      platinum: { number: "", expiry_date: "" },
    }),
    get() {
      return parseJSONField(this.getDataValue("twoX_reward_point"));
    },
  },
  birthday_card: {
    type: Sequelize.STRING,
  },
  marriage_anniversary_card: {
    type: Sequelize.STRING,
  },
  createdBy: {
    type: Sequelize.TEXT,
    allowNull: true,
    defaultValue: JSON.stringify({
      email: "superadmin@DSgroup.com",
      timestamp: new Date().toISOString(),
    }),
    get() {
      return parseJSONField(this.getDataValue("createdBy"));
    },
  },
  store: {
    type: Sequelize.STRING(255),
    defaultValue: "lakme"
},
  source_of_device: {
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
