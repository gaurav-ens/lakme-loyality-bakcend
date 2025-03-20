import Sequelize from "sequelize";
import sequelize from "../src/config/db.js";

export const dsProduct = sequelize.define("dsProduct", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement : true
  },
  productId : {
    type: Sequelize.STRING
  },
  productName : {
    type: Sequelize.STRING
  },
  productHandle: {
    type: Sequelize.STRING
  },
  productSKU :{
    type: Sequelize.STRING
  },
  productImage: {
    type: Sequelize.STRING
  },
  status:{
    type: Sequelize.STRING,
    default : 'active'
  },
  categoryName :{
    type: Sequelize.STRING
  },
  tagName :{
    type: Sequelize.STRING
  },
  availableQuantity :{
    type: Sequelize.INTEGER
  },
  totalQuantity : {
    type: Sequelize.INTEGER
  },
  minQuantity : {
    type: Sequelize.INTEGER
  },
  maxQuantity : {
    type: Sequelize.INTEGER
  },
  rewarPoints : {
        type: Sequelize.INTEGER
  },
  price:{
    type: Sequelize.FLOAT
  },
  stock : {
    type: Sequelize.STRING
  },
  netWeight : {
    type: Sequelize.STRING
  },
  details :{
    type: Sequelize.STRING
  },
  description :{
    type: Sequelize.STRING
  },
  thumbnailImage :{
    type: Sequelize.STRING
  },
  updateByStaff : {
    type: Sequelize.STRING,
    default:'superAdmin'
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
  startDate:{
    type: Sequelize.DATE,
    allowNull: true
  },
  otp :{
    type: Sequelize.STRING,
    allowNull: true
  },
  otpVerification:{
    type:Sequelize.ENUM('verified','unverified',''),
    defaultValue:''
  },
  endDate:{
    type: Sequelize.DATE,
    allowNull: true
  },
  source_of_device: {
    type: Sequelize.STRING,
    default : "lakme"
  },
  store: {
    type: Sequelize.STRING(255),
    defaultValue: "lakme"
},
});

export const redeemProduct = sequelize.define('redeemProduct',{
  id:{
    type:Sequelize.INTEGER,
    primaryKey:true,
    autoIncrement : true
  },
  productId:{
    type:Sequelize.STRING,
    allowNull:false,
  },
  rewardPoints:{
    type:Sequelize.STRING,
  },
  store:{
    type:Sequelize.STRING,
    defaultValue:'lakme'
  }
})