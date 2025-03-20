import Sequelize from "sequelize";
import sequelize from "../src/config/db.js";

export const customer_campaign_data = sequelize.define("customer_campaign_data", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  account_number: {
    type: Sequelize.STRING,
  },
  customer_id: {
    type: Sequelize.STRING,
  },
  phone_number: {
    type: Sequelize.STRING,
  },
  email: {
    type: Sequelize.STRING,
  },
  name: {
    type: Sequelize.STRING,
  },
  date_of_birth: {
    type: Sequelize.STRING,
  },
  earned_point: {
    type: Sequelize.STRING,
  },
  redeem_point: {
    type: Sequelize.STRING,
  },
  expiry_point: {
    type: Sequelize.STRING,
  },
  balance_point: {
    type: Sequelize.STRING,
  },
  campaign_point: {
    type: Sequelize.STRING,
  },
  membership_tier: {
    type: Sequelize.STRING,
  },

  gender: {
    type: Sequelize.STRING,
  },
  source_of_device: {
    type: Sequelize.STRING(255),
    default: "lakme",
  },
  store: {
    type: Sequelize.STRING(255),
    default: "lakme",
  },
    campagin_name: {
      type: Sequelize.STRING(255),
    },
    campagin_id: {
        type: Sequelize.STRING(255),
      },
    campagin_description: {
      type: Sequelize.STRING(255),
    },
    campagin_startDate: {
      type: Sequelize.STRING(255),
    },
    campagin_endDate: {
      type: Sequelize.STRING(255),
    },
    campagin_startTime: {
      type: Sequelize.STRING(255),
    },
    campagin_endTime: {
      type: Sequelize.STRING(255),
    },
  createdAt: {
    type: Sequelize.DATE,
    allowNull: false,
    field: "created_at",
  },
  updatedAt: {
    type: Sequelize.DATE,
    allowNull: true,
    field: "updated_at",
  },
});
