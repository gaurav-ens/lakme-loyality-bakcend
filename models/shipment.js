import sequelize from "../src/config/db.js";
import Sequelize from "sequelize";
import DateTime from "../src/utils/getDateTime.js";

export const shiprocket = sequelize.define('shiprocket', {
    token: {
        type: Sequelize.STRING,
    },
    createdIstAt: {
        type: Sequelize.STRING,
        defaultValue: DateTime()
    },
    updatedIstAt: {
        type: Sequelize.STRING,
        defaultValue: DateTime()
    }
});

export const shipment = sequelize.define('shipment', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    orderId: {
        type: Sequelize.STRING,
    },
    awbId: {
        type: Sequelize.STRING
    },
    order_channel_id: {
        type: Sequelize.STRING,
    },
    shipmentData: {
        type: Sequelize.TEXT,
        defaultValue: '[]', // Store as a stringified JSON array
        get() {
            return JSON.parse(this.getDataValue('shipmentData')); // Parse it on retrieval
        },
        set(value) {
            this.setDataValue('shipmentData', JSON.stringify(value)); // Stringify it on save
        }
    },
    shipmentResponse: {
        type: Sequelize.TEXT,
        defaultValue: '[]',
        get() {
            return JSON.parse(this.getDataValue('shipmentResponse'));
        },
        set(value) {
            this.setDataValue('shipmentResponse', JSON.stringify(value));
        }
    },
    trackResponse: {
        type: Sequelize.TEXT,
        defaultValue: '[]',
        get() {
            return JSON.parse(this.getDataValue('trackResponse'));
        },
        set(value) {
            this.setDataValue('trackResponse', JSON.stringify(value));
        }
    },
    customerAddress: {
        type: Sequelize.TEXT
    },
    customerPincode: {
        type: Sequelize.STRING
    },
    customerCity: {
        type: Sequelize.STRING
    },
    // sellerState:{
    //     type: Sequelize.STRING
    // },
    customerCountry: {
        type: Sequelize.STRING
    },
    quantity: {
        type: Sequelize.INTEGER
    },
    amount: {
        type: Sequelize.STRING
    },
    shipmentStatus: {
        type: Sequelize.STRING
    },
    payment_mode: {
        type: Sequelize.STRING
    },
    paymentId: {
        type: Sequelize.INTEGER,
    },
    transactionId: {
        type: Sequelize.STRING
    },
    updateByStaff: {
        type: Sequelize.STRING,
        defaultValue: 'superAdmin'
    },
    courierPartner: {
        type: Sequelize.ENUM('DELHIVERY', 'SHIPROCKET'),
        defaultValue: 'DELHIVERY'
    },
    createdIstAt: {
        type: Sequelize.STRING,
        defaultValue: DateTime()
    },
    updatedIstAt: {
        type: Sequelize.STRING,
        defaultValue: DateTime()
    }
});

