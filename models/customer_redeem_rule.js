import  Sequelize from 'sequelize';
import sequelize from '../src/config/db.js';  // Adjust the path to your sequelize instance

export const customer_redeem_rule = sequelize.define('customer_redeem_rule', {
  id:{
    type: Sequelize.INTEGER,
    primaryKey: true,
      autoIncrement: true,
  },
  minimum_redemption: {
    type: Sequelize.STRING(255),
  },
  limitation_per_day: {
    type: Sequelize.STRING(255),
  },
  vochuer_limitation_per_day: {
    type: Sequelize.STRING(255),
  },
createDate: {
    type: Sequelize.DATE,
    defaultValue:new Date()
  },
  updateDate: {
    type: Sequelize.DATE,
    defaultValue:new Date()
  },
  updatedByStaff: {
    type: Sequelize.STRING,
    defaultValue:"superAdmin"
  },
  store: {
    type: Sequelize.STRING(255),
    defaultValue: "lakme"
}
});
