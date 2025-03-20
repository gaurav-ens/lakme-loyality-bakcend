import Sequelize, { DataTypes } from "sequelize";
import sequelize from '../src/config/db.js';

export const staff = sequelize.define('staffs', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING(255),
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING(255),
  },
  password: {
    type: Sequelize.STRING(255),
  },
  phone_number: {
    type: Sequelize.STRING(255),
  },
  role_id: {
    type: DataTypes.INTEGER,
  },
  role_name: {
    type: Sequelize.STRING(255),
  },
  roleType:{
    type: Sequelize.ENUM("superadmin","admin"),
    defaultValue: "admin"
  },
  store: {
    type: Sequelize.STRING(255),
    defaultValue: "lakme"
  },
  status:{
    type: Sequelize.STRING(255),
  },
  website:{
    type: Sequelize.STRING(255),
  },
  source_of_device: {
    type: Sequelize.STRING(255),
    default : "lakme"
  },
  createdBy: {
    type: Sequelize.TEXT,
    allowNull: true,
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
