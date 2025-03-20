import Sequelize  from "sequelize";
import sequelize from '../src/config/db.js';


export const voucherBrands = sequelize.define("voucherBrands", {
    id : {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    BrandName:{
        type:Sequelize.STRING(255),
    },
    BrandProductCode:{
        type:Sequelize.STRING(255),
    },
    BrandType:{
        type:Sequelize.STRING(255),
    },
    RedemptionType:{
        type:Sequelize.STRING(255),
    },
    OnlineRedemptionUrl:{
        type:Sequelize.STRING(255),
    },
    BrandImage:{
        type:Sequelize.STRING(255),
    },
    minPrice:{
        type:Sequelize.STRING(255)
    },
    DenominationList:{
        type:Sequelize.STRING(255)
    },
    requiredPoints:{
        type:Sequelize.INTEGER,
        default:0
    },
    StockAvailable:{
        type: Sequelize.ENUM("true","false"),
        defaultValue: "true",
    },
    Category:{
        type:Sequelize.STRING(255)
    },
    Descriptions:{
        type:Sequelize.TEXT,
        allowNull: true
    },
    TermsAndCondition:{
        type:Sequelize.TEXT, 
        allowNull: true
    },
    ImportantInstruction:{
        type:Sequelize.TEXT,
        allowNull: true
    },
    RedeemSteps:{
        type:Sequelize.TEXT,
        allowNull: true
    },
    status:{
       type: Sequelize.ENUM("active", "inactive"),
       defaultValue: "active",
    },
    vendor:{
        type: Sequelize.STRING,
        defaultValue: "Vouchagram",
    },
    platformFees: {
        type:Sequelize.INTEGER,
        defaultValue:0
    },
    updateByStaff:{
        type : Sequelize.STRING(255),
        defaultValue:'superAdmin'
    },
    createdIstAt: {
        type: Sequelize.STRING,
        allowNull: false
      },
    updatedIstAt:{
        type: Sequelize.STRING,
        allowNull: true,
    },
    store: {
        type: Sequelize.ENUM('lakme'),
        defaultValue: "lakme"
    }
}); 
