import Sequelize from "sequelize";
import sequelize from "../src/config/db";

export const templateSchema = sequelize.define("templates", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  sourceOfNotification:{
    type:String,
    allowNull:false
  },
  medium:{
    type: Sequelize.ENUM('WhatsApp','Email','SMS'),
    allowNull: false,
  },
  username:{
    type: Sequelize.STRING,
    allowNull: true
  },
  password:{
    type: Sequelize.STRING,
    allowNull: true
  },
  apiKey:{
    type: Sequelize.STRING,
    allowNull: true,
  },
  token:{
    type: Sequelize.STRING,
    allowNull: false
  },
  isActive:{
    type: Sequelize.BOOLEAN,
    allowNull: false,
  },
  store: {
    type: Sequelize.STRING(255),
    defaultValue: "lakme",
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
