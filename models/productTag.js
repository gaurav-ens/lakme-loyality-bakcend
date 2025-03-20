import  Sequelize  from 'sequelize';
import sequelize from '../src/config/db.js';  // Adjust path as necessary

export const tag = sequelize.define('productTag', {
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
    defaultValue : 'superAdmin',
  },
  status: {
    type: Sequelize.ENUM('active','inactive'),
    allowNull: false,
  },
  store: {
    type: Sequelize.ENUM('lakme'),
    defaultValue: "lakme"
},
});
