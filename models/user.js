import Sequelize from "sequelize";
import sequelize from '../src/config/db.js';
// import { roles } from "./role";

export const user = sequelize.define('users', {
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
    allowNull: false,
    unique: true,
  },
  password :{
    type: Sequelize.STRING(255),
  },
  contact: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  roles_def:{
    type: Sequelize.ENUM("superadmin","admin"),
    defaultValue: "admin"
  },
  status: {
    type: Sequelize.ENUM("active", "inactive"),
    defaultValue: "active",
  },
  website:{
    type: Sequelize.STRING(255),
    allowNull: false,
  },
  role_name:{
    type: Sequelize.STRING(255),
    allowNull: false,
  },
  assignedBy: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: "superadmin"
  },
  username:{
    type: Sequelize.STRING(255),
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
