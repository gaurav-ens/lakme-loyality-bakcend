import Sequelize from "sequelize";
import sequelize from "../src/config/db.js";

export const cmm = sequelize.define("cmm", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  account_number: {
    type: Sequelize.STRING(255),
  },
  reward_points: {
    type: Sequelize.STRING(255),
  },
  total_reward_points: {
    type: Sequelize.STRING(255),
  },
  customer_Id: {
    type: Sequelize.STRING(255),
  },
  member_status: {
    type: Sequelize.STRING(255),
  },
  profile_update_member_status: {
    type: Sequelize.STRING,
  },
  birthday_member_status: {
    type: Sequelize.STRING,
  },
  store: {
    type: Sequelize.STRING(255),
    defaultValue: "lakme"
},
  createdBy: {
    type: Sequelize.STRING(255),
    allowNull: true,
    defaultValue: JSON.stringify({
      email: "superadmin@DSgroup.com",
      timestamp: new Date().toISOString(),
    }),
  },
  source_of_device: {
    type: Sequelize.STRING(255),
    default: "lakme",
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
