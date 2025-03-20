import Sequelize from "sequelize";
import sequelize from "../src/config/db.js";

export const gift = sequelize.define("gift", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    gift_name: {
        type: Sequelize.STRING,
        require: true,
        unique: true
    },
    description: {
        type: Sequelize.STRING
    },
    createdIstAt: {
        type: Sequelize.STRING,
        allowNull: false
    },
    updatedIstAt: {
        type: Sequelize.STRING,
        allowNull: true
    },
    expiryDate: {
        type: Sequelize.STRING,
        allowNull: true,
        default: '18months'
    },
    source_of_device: {
        type: Sequelize.STRING,
        default: "lakme"
    },
    store: {
        type: Sequelize.STRING(255),
        defaultValue: "lakme"
    },
});

export const TempGiftActivity = sequelize.define("tempgiftactivity", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    customerId: {
        type: Sequelize.STRING,
    },
    accountId: {
        type: Sequelize.STRING,
    },
    name: {
        type: Sequelize.STRING,
    },
    email: {
        type: Sequelize.STRING,
    },
    contactNo: {
        type: Sequelize.STRING,
    },
    address: {
        type: Sequelize.STRING,
    },
    pincode: {
        type: Sequelize.STRING,
    },
    city: {
        type: Sequelize.STRING,
    },
    state: {
        type: Sequelize.STRING,
    },
    membershipLevel: {
        type: Sequelize.STRING,
    },
    availablePoints: {
        type: Sequelize.STRING,
    },
    accumulatedPoints: {
        type: Sequelize.STRING,
    },
    dispatchStatus: {
        type: Sequelize.ENUM,
        values: ['Pending', 'Completed', 'Failed'],
        defaultValue: 'Pending'
    },
    remarks: {
        type: Sequelize.STRING,
    },
    createdIstAt: {
        type: Sequelize.STRING,
    },
    updatedIstAt: {
        type: Sequelize.STRING,
    },
    store: {
        type: Sequelize.ENUM('lakme'),
        defaultValue: 'lakme'
    }
});

export const giftOrders = sequelize.define('giftorder', {
    orderId: {
        type: Sequelize.STRING,
        unique: true
    },
    giftId: {
        type: Sequelize.STRING
    },
    giftName: {
        type: Sequelize.STRING
    },
    description: {
        type: Sequelize.STRING
    },
    customerId: {
        type: Sequelize.STRING
    },
    customerName: {
        type: Sequelize.STRING
    },
    email: {
        type: Sequelize.STRING
    },
    courierPartner: {
        type: Sequelize.STRING
    },
    awbId: {
        type: Sequelize.STRING
    },
    accountId: {
        type: Sequelize.STRING
    },
    contactNo: {
        type: Sequelize.STRING
    },
    membershipLevel: {
        type: Sequelize.STRING
    },
    gender: {
        type: Sequelize.STRING
    },
    totalPoints: {
        type: Sequelize.STRING,
    },
    availablePoints: {
        type: Sequelize.STRING,
    },
    accumulatedPoints: {
        type: Sequelize.STRING
    },
    trackingUrl: {
        type: Sequelize.STRING
    },
    address: {
        type: Sequelize.STRING
    },
    pinCode: {
        type: Sequelize.STRING
    },
    state: {
        type: Sequelize.STRING
    },
    status: {
        type: Sequelize.ENUM,
        values: ['Pending', 'Confirmed', 'Completed', 'Failed'],
        defaultValue: 'Confirmed'
    },
    updateByStaff: {
        type: Sequelize.STRING
    },
    createdIstAt: {
        type: Sequelize.STRING,
    },
    updatedIstAt: {
        type: Sequelize.STRING,
    },
    store: {
        type: Sequelize.ENUM('lakme'),
        defaultValue: 'lakme'
    }
});

export const giftShipment = sequelize.define('giftshipment', {
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
    },
    shipmentResponse: {
        type: Sequelize.TEXT,
    },
    trackResponse: {
        type: Sequelize.TEXT,
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
    customerState: {
        type: Sequelize.STRING
    },
    customerCountry: {
        type: Sequelize.STRING
    },
    shipmentStatus: {
        type: Sequelize.STRING
    },
    amount: {
        type: Sequelize.STRING
    },
    quantity: {
        type: Sequelize.INTEGER
    },
    payment_mode: {
        type: Sequelize.STRING
    },
    updateByStaff: {
        type: Sequelize.STRING
    },
    courierPartner: {
        type: Sequelize.ENUM('DELHIVERY', 'SHIPROCKET'),
        defaultValue: ''
    },
    createdIstAt: {
        type: Sequelize.STRING
    },
    updatedIstAt: {
        type: Sequelize.STRING
    },
    store: {
        type: Sequelize.ENUM('lakme'),
        defaultValue: 'lakme'
    }
});
