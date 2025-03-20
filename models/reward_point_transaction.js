import Sequelize from "sequelize";
import sequelize from "../src/config/db.js";


export const rptSchema = sequelize.define("rpt", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  customer_Id: {
    type: Sequelize.STRING(255),
    allowNull: false,
  },
  order_id: {
    type: Sequelize.STRING(255),
    allowNull: false,
  },
  reward_utilization: {
    type: Sequelize.STRING(255),
    allowNull: false,
  },
  calculate_reward_point: {
    type: Sequelize.STRING(255),
    allowNull: false,
  },
  transition_id: {
    type: Sequelize.STRING(255),
    allowNull: false,
  },
  date_time_of_redemption: {
    type: Sequelize.DATE,
  },
  point_to_used: {
    type: Sequelize.STRING(255),
  },
  device_information: {
    type: Sequelize.STRING(255),
  },
  shopname: {
    type: Sequelize.STRING(255),
  },
  account_number: {
    type: Sequelize.STRING(255),
  },
  product_id: {
    type: Sequelize.STRING(255),
    allowNull: true,
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
