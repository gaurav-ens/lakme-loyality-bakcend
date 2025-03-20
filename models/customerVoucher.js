import Sequelize from "sequelize";
import sequelize from "../src/config/db.js"

export const customerVoucher = sequelize.define('customerVoucher', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    customerId: {
        type: Sequelize.STRING
    },
    accountNumber: {
        type: Sequelize.STRING,
    },
    customerName: {
        type: Sequelize.STRING,
    },
    phone_number: {
        type: Sequelize.STRING,
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false
    },
    redeemPoints: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    resendNotificationCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    lastNotificationsent: {
        type: Sequelize.STRING,
        allowNull: true
    },
    requiredPoints: {
        type: Sequelize.INTEGER
    },
    ExternalOrderId: {
        type: Sequelize.STRING,
        unique: true
    },
    brandImageUrl: {
        type: Sequelize.STRING
    },
    BrandName: {
        type: Sequelize.STRING,
    },
    BrandProductCode: {
        type: Sequelize.STRING,
    },
    Denomination: {
        type: Sequelize.INTEGER
    },
    Quantity: {
        type: Sequelize.INTEGER
    },
    PullVouchers: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    Notification: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    ResultType: {
        type: Sequelize.STRING
    },
    ErrorMessage: {
        type: Sequelize.STRING
    },
    Message: {
        type: Sequelize.STRING
    },
    status: {
        type: Sequelize.ENUM,
        values: ['Pending', 'Completed', 'Expired', 'Rejected'],
        defaultValue: 'Pending'
    },
    endDateOfApprovedVouchers: {
        type: Sequelize.STRING
    },
    voucherType: {
        type: Sequelize.ENUM,
        values: ['Woohoo', 'Vouchagram']
    },
    updateByStaff: {
        type: Sequelize.STRING,
        default: 'superAdmin'
    },
    store: {
        type: Sequelize.STRING(255),
        defaultValue: "lakme"
    },
    createdIstAt: {
        type: Sequelize.STRING, // Use DATE for timestamp columns
        defaultValue: Sequelize.NOW
    },
    updatedIstAt: {
        type: Sequelize.STRING, // Use DATE for timestamp columns
        defaultValue: Sequelize.NOW
    },
    source_of_device: {
        type: Sequelize.STRING,
        default: "lakme"
    },
    approvedBy: {
        type: Sequelize.STRING,
        default: 'superAdmin'
    },
    approvedDate: {
        type: Sequelize.DATE
    },
    rejectedBy: {
        type: Sequelize.STRING,
        default: 'superAdmin'
    },
    rejectDate: {
        type: Sequelize.DATE
    },
    buttonValue: {
        type: Sequelize.INTEGER,
        defaultValue: 1
    }
});

export const customerData = sequelize.define('CustomerOTP', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    customerId: {
        type: Sequelize.STRING
    },
    accountNumber: {
        type: Sequelize.STRING,
    },
    otp: {
        type: Sequelize.STRING,
        default: ''
    },
    otpTimeStampAt: {
        type: Sequelize.DATE
    },
    otpCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    verified: {
        type: Sequelize.ENUM('verified', 'unverified'),
        default: 'unverified'
    },
    createdIstAt: {
        type: Sequelize.DATE
    },
    updatedIstAt: {
        type: Sequelize.DATE
    },
    store: {
        type: Sequelize.STRING,
        default: 'lakme'
    }
})
