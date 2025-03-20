import sequelize from "../src/config/db.js";
import Sequelize from "sequelize";
import { customer } from "./customer.js";
import DateTime from "../src/utils/getDateTime.js";

export const order = sequelize.define('order', {
    customerId:{
        type:Sequelize.INTEGER,
        references:{
            model:customer,
            key:'id'
        }
    },
    oId:{
        type:Sequelize.STRING,
        unique:true
    },
    productType:{
        type:Sequelize.STRING,
        defaultValue:'DSProduct'
    },
    products: {
        type: Sequelize.TEXT, // Or Sequelize.JSON if you'd prefer
        defaultValue: '[]',   // Store an empty array as a JSON string
        get() {
            const rawValue = this.getDataValue('products');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('products', JSON.stringify(value));
        }
    },
    quantity:{
        type:Sequelize.INTEGER
    },
    amount:{
        type:Sequelize.INTEGER,
        defaultValue:0
    },
    points:{
        type:Sequelize.INTEGER,
        defaultValue:0
    },
    status:{
        type:Sequelize.ENUM('Pending', 'Confirmed', 'Complete', 'Failed'),
        defaultValue:'Pending'
    },
    payBy:{
        type:Sequelize.ENUM('CASH', 'POINTS')
    },
    paymentId:{
        type:Sequelize.INTEGER,
    },
    transactionId:{
        type:Sequelize.STRING
    },
    shippingId:{
        type:Sequelize.STRING,
    },
    updateByStaff:{
        type : Sequelize.STRING,
        defaultValue:'superAdmin'
    },
    createdIstAt:{
        type : Sequelize.STRING, 
        defaultValue:DateTime()
    },
    updatedIstAt:{
        type : Sequelize.STRING,
        defaultValue:DateTime()
    }
});