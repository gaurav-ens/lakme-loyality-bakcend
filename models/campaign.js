import Sequelize from "sequelize";
import sequelize from "../src/config/db.js";

export const campaign = sequelize.define("campaign", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING(255),
  },
  description: {
    type: Sequelize.STRING(255),
  },
  startDate: {
    type: Sequelize.STRING(255),
  },
  endDate: {
    type: Sequelize.STRING(255),
  },
  startTime: {
    type: Sequelize.STRING(255),
  },
  endTime: {
    type: Sequelize.STRING(255),
  },
  product_id:{
    type: Sequelize.STRING(255),
  },
  productName: {
    type: Sequelize.STRING(255),
  },
  productWeightage: {
    type: Sequelize.STRING(255),
  },
  status: {
    type: Sequelize.ENUM("active", "inactive"),
    defaultValue: "inactive",
  },
  pointType: {
    type: Sequelize.ENUM("Multiplier", "Points"),
    defaultValue: "Multiplier",
  },
  welcome: {
    type: Sequelize.FLOAT,
  },
  blue: {
    type: Sequelize.FLOAT,
  },
  silver: {
    type: Sequelize.FLOAT,
  },
  gold: {
    type: Sequelize.FLOAT,
  },
  platinum: {
    type: Sequelize.FLOAT,
  },
  store: {
    type: Sequelize.STRING(255),
    defaultValue: "lakme",
  },
  // finalPrice:{
  //   type: Sequelize.FLOAT
  // },
  // finalPriceWelcome: {
  //   type: Sequelize.FLOAT,
  // },
  // finalPriceBlue: {
  //   type: Sequelize.FLOAT,
  // },
  // finalPriceGold: {
  //   type: Sequelize.FLOAT,
  // },
  // finalPriceSilver: {
  //   type: Sequelize.FLOAT,
  // },
  // finalPricePlatinum: {
  //   type: Sequelize.FLOAT,
  // },
  source_of_device: {
    type: Sequelize.STRING(255),
    default: "lakme",
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
