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

export const RuleSetModified = sequelize.define("rule_set_modified", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  point_conversion_online_purchase: {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify({
      status: "inactive",
      created_by: "admin",
      type:"online_purchase",
      value: []
    }),
    get() {
      return parseJSONField(this.getDataValue("point_conversion_online_purchase"));
    },
  },
  point_conversion_based_on_sku: {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify({
      status: "inactive",
      created_by: "admin",
      type:"sku_based",
      value: [],
    }),
    get() {
      return parseJSONField(this.getDataValue("point_conversion_based_on_sku"));
    },
  },
  point_conversion_based_on_category: {
  type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify({
      status: "inactive",
      created_by: "admin",
      type:"category_based",
      value: []
    }),
    get() {
      return parseJSONField(this.getDataValue("point_conversion_based_on_category"));
    },
  },
  bonus_point: {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify({
      status: "inactive",
      created_by: "admin",
      type:"bonus",
      value: []
    }),
    get() {
      return parseJSONField(this.getDataValue("bonus_point"));
    },
  },
  coupon: {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify({
      status: "inactive",
      created_by: "admin",
      type:"coupon",
      value: []
    }),
    get() {
      return parseJSONField(this.getDataValue("coupon"));
    },
  },
  twox_reward_online: {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify({
      status: "inactive",
      created_by: "admin",
      type:"twoX_online",
      value: []
    }),
    get() {
      return parseJSONField(this.getDataValue("twox_reward_online"));
    },
  },
  twox_reward_offline: {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify({
      status: "inactive",
      created_by: "admin",
      type:"twoX_offline",
      value: []
    }),
    get() {
      return parseJSONField(this.getDataValue("twox_reward_offline"));
    },
  },
  campaign: {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify({
      status: "inactive",
      created_by: "admin",
      type:"campaign",
      value: []
    }),
    get() {
      return parseJSONField(this.getDataValue("campaign"));
    },
  },
  registration: {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify({
      status: "inactive",
      created_by: "admin",
      type:"registration",
      value: []
    }),
    get() {
      return parseJSONField(this.getDataValue("registration"));
    },
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
}, {
  tableName: 'rule_set_modified', // Specify table name for SQL Server
  timestamps: true, // Automatically add timestamps
});









