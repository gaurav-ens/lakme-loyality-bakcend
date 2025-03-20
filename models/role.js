import Sequelize from "sequelize";
import sequelize from '../src/config/db.js';

export const roles = sequelize.define('roles', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING(255),
    allowNull: false
  },
  status: {
    type: Sequelize.ENUM("active", "inactive"),
    defaultValue: "active",
  },
  role: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  roles:{
    type: Sequelize.ENUM("superadmin","admin"),
    defaultValue: "superadmin"
}, 
store: {
  type: Sequelize.STRING(255),
  defaultValue: "lakme"
},
source_of_device: {
  type: Sequelize.STRING(255),
  default : "lakme"
},
updatedBy:{
  type: Sequelize.STRING,
    allowNull: false,
    defaultValue:"superadmin"
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
