import Sequelize from "sequelize";
import sequelize from "../src/config/db.js";

export const paywithrewards= sequelize.define("paywithrewards", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  enable: {
    type: Sequelize.STRING,
  },
  redemption_type: {
    type: Sequelize.STRING,
  },
  point_conversion_rate:{
    type: Sequelize.STRING,
  },
  reward_point_awarded_on_purchase:{
    type: Sequelize.STRING,
  },
  remarks: {
    type: Sequelize.STRING(255),
  },
  minValue:{
    type: Sequelize.STRING,
  },
  maxValue:{
    type: Sequelize.STRING,
  },
  max_point_limit:{
    type: Sequelize.STRING,
  },
  customer_redeem_point_multiple:{
    type: Sequelize.STRING,
  },
  createdBy: {
    type: Sequelize.STRING(255),
    defaultValue: "superadmin",
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

