import Sequelize from "sequelize";
import sequelize from "../src/config/db.js";

export const point = sequelize.define("point", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  customer_Id: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  transition_id: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  transition_status: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  account_number: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  point: {
    type: Sequelize.STRING,
  },
  expiry_date: {
    type: Sequelize.STRING,
  },
  credit_after: {
    type: Sequelize.STRING,
  },
  store: {
    type: Sequelize.STRING(255),
    defaultValue: "lakme"
},note: {
  type: Sequelize.STRING(255),
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
