import Sequelize from "sequelize";
import sequelize from "../src/config/db.js";


function parseJSONField(field) {
    try {
      return JSON.parse(field);
    } catch (error) {
      console.warn("Error parsing JSON field:", error);
      return field; // Return the original field if parsing fails
    }
  }

export const Notification_new = sequelize.define("Notification_new", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  sms_cred: {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify({
      password: "",
      username: ""
    }),
    get() {
      return parseJSONField(this.getDataValue("sms_cred"));
    },
  },
  whatsapp_cred: {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify({
      password: "",
      api_key: "",
    }),
    get() {
      return parseJSONField(this.getDataValue("whatsapp_cred"));
    },
  },
  mail_cred: {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: JSON.stringify({

    }),
    get() {
      return parseJSONField(this.getDataValue("mail_cred"));
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
