import Sequelize from "sequelize";
import sequelize from "../src/config/db.js";

export const accessSchema = sequelize.define("access", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  access_token: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  shopname: {
    type: Sequelize.STRING,
    allowNull: false
  },
  source_of_device: {
    type: Sequelize.STRING,
    default: "lakme",
  },
  store: {
    type: Sequelize.STRING(255),
    defaultValue: "lakme",
  },
  apiVersion: {
    type: Sequelize.STRING,
    defaultValue: null,
  },
  createdAt: {
    type: Sequelize.DATE,
    allowNull: false,
    default: Sequelize.NOW,
  },
  updatedAt: {
    type: Sequelize.DATE,
    allowNull: true,
    default: Sequelize.NOW,
  },
});
