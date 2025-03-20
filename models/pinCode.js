import  Sequelize  from "sequelize";
import sequelize from "../src/config/db.js";
import DateTime from "../src/utils/getDateTime";

export const pinCode = sequelize.define("pinCode",{
    id:{
        type:Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement : true
    },
    district:{
        type:Sequelize.STRING
    },
    pin_code:{
        type:Sequelize.STRING,
        unique:true
    },
    stateName:{
        type:Sequelize.STRING
    },
    status:{
        type : Sequelize.ENUM,
        values:['active', 'inactive'],
        defaultValue:'active'
    },
    courierPartner:{
        type:Sequelize.ENUM('SHIPROCKET', 'DELHIVERY', 'NONE'),
        defaultValue:'DELHIVERY'
    },
    updateByStaff:{
        type:Sequelize.STRING,
        defaultValue:'superAdmin'
    },
    createdIstAt:{
        type : Sequelize.STRING, 
        defaultValue:DateTime()
    },
    updatedIstAt:{
        type : Sequelize.STRING,
        defaultValue:DateTime()
    },
    store:{
        type:Sequelize.ENUM,
        values: ['lakme'],
        defaultValue:'lakme'
    }
});

