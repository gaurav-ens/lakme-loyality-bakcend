import Sequelize  from "sequelize";
import sequelize from "../src/config/db.js";
import { customer } from "./customer.js";

export const productReedem = sequelize.define('reedemProduct',{
    customerId:{
        type:Sequelize.INTEGER,
        references:{
            model:customer,
            key:'id'
        }
    },
    accountId:{
        type:Sequelize.STRING,
    },
    customerName:{
        type:Sequelize.STRING,
    },
    email:{
        type:Sequelize.STRING
    },
    contactNo:{
        type:Sequelize.STRING
    },
    orderId:{
        type:Sequelize.STRING
    },
    productId:{
        type:Sequelize.STRING
    },
    productName:{
        type:Sequelize.STRING
    },
    sku:{
        type:Sequelize.STRING
    },
    productImageURL:{
        type:Sequelize.STRING
    },
    quantity:{
        type:Sequelize.INTEGER
    },
    requiredPoints:{
        type:Sequelize.INTEGER
    },
    Message:{
        type:Sequelize.STRING
    },
    productType:{
        type:Sequelize.STRING,
        defaultValues:'lakmeProduct'
    },
    updateByStaff:{
        type : Sequelize.STRING,
        defaultValue:'superAdmin'
    },
    createdIstAt:{
        type : Sequelize.STRING, 
    },
    updatedIstAt:{
        type : Sequelize.STRING,
    }
});

