import Sequelize from "sequelize";
import sequelize from "../src/config/db.js";

export const Notification = sequelize.define("Notification", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  notification_type: {
    type: Sequelize.ENUM(
      "WhatsApp",
      "SMS",
      "Email",
      "BrowserNotification",
      "PushNotification"
    ),
    defaultValue: "SMS",
  },
  username: {
    type: Sequelize.STRING
  },
  templateType: {
    type: Sequelize.STRING,
  },
  templateId: {
    type: Sequelize.STRING,
  },
  userId: {
    type: Sequelize.STRING,
  },
  password: {
    type: Sequelize.STRING,
  },
  header: {
    type: Sequelize.STRING,
  },
  name: {
    type: Sequelize.STRING,
  },
  api_key: {
    type: Sequelize.STRING
  },
  access_token: {
    type: Sequelize.STRING
  },
  status: {
    type: Sequelize.ENUM("active", "inactive"),
    defaultValue: "active",
  },
  store: {
    type: Sequelize.STRING(255),
    default: "lakme",
  },
});
