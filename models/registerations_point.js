import Sequelize from "sequelize";
import sequelize from "../src/config/db.js";

export const registration = sequelize.define("registration", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  point: {
    type: Sequelize.STRING,
    defaultValue: "0",
  },
  expiry_date: {
    type: Sequelize.STRING,
    defaultValue: "18 months",
  },
  credit_after: {
    type: Sequelize.STRING,
    defaultValue: "0",

  }, 
  expiry_day: {
    type: Sequelize.STRING,
    defaultValue: "18 months",
  },
  credit_day: {
    type: Sequelize.STRING,
    defaultValue: "0",

  }, 
  remarks: {
    type: Sequelize.STRING,
    defaultValue: "0",

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
