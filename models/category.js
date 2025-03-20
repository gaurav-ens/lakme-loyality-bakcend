import  Sequelize from 'sequelize';
import sequelize from '../src/config/db.js';  // Adjust the path to your sequelize instance

export const category = sequelize.define('productCategory', {
  id:{
    type: Sequelize.INTEGER,
    primaryKey: true,
      autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    unique:true
  },
  createDate: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue:new Date()
  },
  updateDate: {
    type: Sequelize.DATE,
    allowNull: true,
    defaultValue:new Date()
  },
  updatedByStaff: {
    type: Sequelize.STRING,
    defaultValue:"superAdmin"
  },
  status: {
    type: Sequelize.ENUM("active", "inactive"),
        defaultValue: "active"
  },
  store: {
    type: Sequelize.STRING(255),
    defaultValue: "lakme"
}
});
