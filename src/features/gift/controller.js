
import {
    statusMaker, apiMessages, errorHandler, responseHandler, checkEmptyArray, customer, gift,
    transition, TempGiftActivity, storeHandler, availabilityPincode, createGiftShipmentInShipRocket,
    createGiftShipmentInDelhivery, giftOrders, DateTime, handleNotifications
} from './index'
import { Op, Sequelize } from "sequelize";
import path from 'path'
import xlsx from 'node-xlsx'
import fs, { unlinkSync } from "fs";
import csv from 'csv-parser'
import crypto from 'crypto'
import { giftShipment } from '../shipping';
import moment from 'moment';
import sequelize from '../../config/db';

function generateOrderId() {
    return crypto.randomBytes(16).toString("hex");
}

export const addGift = async (req, res) => {
    try {
        const { gift_name, store, description } = req.body;
        const website = await storeHandler(store)
        if (!gift_name || !description) {
            return res.status(statusMaker.badRequest).json({
                message: "gift_name is required.",
            });
        }

        const isExist = await gift.findOne({ where: { gift_name } });

        if (isExist) {
            const response = responseHandler(
                statusMaker.notFound,
                apiMessages.alreadyExist,
                isExist
            );
            return res.status(statusMaker.notFound).json(response);
        }

        const newGift = await gift.create({
            gift_name,
            store: website,
            description,
            createdIstAt: DateTime(),
            updatedIstAt: DateTime()
        });
        const response = responseHandler(
            statusMaker.created,
            apiMessages.create,
            newGift
        );
        return res.status(statusMaker.created).json(response);
    } catch (error) {
        console.log("err-----", error);

        const response = errorHandler(error);
        return res.status(statusMaker.internalError).json(response);
    }
};

export const getGifts = async (req, res) => {
    try {
        const { store } = req.query
        const website = await storeHandler(store)
        const fetchgifts = await gift.findAll({ where: { store: website }, order: [['createdAt', 'DESC']] })
        if (checkEmptyArray(fetchgifts)) {
            const rep = responseHandler(statusMaker.success, "gifts are empty", fetchgifts)
            return res.status(statusMaker.success).json(rep)
        }
        const rep = responseHandler(statusMaker.found, apiMessages.found, fetchgifts)
        return res.status(statusMaker.found).json(rep)
    } catch (error) {
        const rep = errorHandler(error)
        return res.status(statusMaker.internalError).json(rep)
    }
}

export const getGiftById = async (req, res) => {
    try {
        const { store, giftId } = req.query
        const website = await storeHandler(store)
        if (!giftId) {
            const rep = responseHandler(statusMaker.badRequest, apiMessages.invalidRequest, [])
            return res.status(statusMaker.badRequest).json(rep)
        }
        const getGift = await gift.findOne({ where: { id: giftId, store: website } })
        if (!getGift) {
            const rep = responseHandler(statusMaker.success, apiMessages.notFound, getGift)
            return res.status(statusMaker.success).json(rep)
        }
        const rep = responseHandler(statusMaker.found, apiMessages.found, getGift)
        return res.status(statusMaker.found).json(rep)
    } catch (error) {
        const rep = errorHandler(error)
        return res.status(statusMaker.internalError).json(rep)
    }
}

export const updateGifts = async (req, res) => {
    try {
        const { giftId, gift_name, description, store } = req.body
        const website = await storeHandler(store)
        if (!giftId && (!gift_name || !description)) {
            const rep = responseHandler(statusMaker.badRequest, apiMessages.invalidRequest, [])
            return res.status(statusMaker.badRequest).json(rep)
        }
        const putGift = await gift.update({ gift_name, description, updatedIstAt: DateTime() }, { where: { id: giftId, store: website } })
        if (!putGift) {
            const rep = responseHandler(statusMaker.internalError, apiMessages.errorOccurred, [])
            return res.status(statusMaker.internalError).json(rep)
        }
        if (putGift[0] != 1) {
            const rep = responseHandler(statusMaker.badRequest, apiMessages.errorOccurred, [])
            return res.status(statusMaker.badRequest).json(rep)
        }
        const rep = responseHandler(statusMaker.updated, apiMessages.update, putGift)
        return res.status(statusMaker.updated).json(rep)
    } catch (error) {
        const rep = errorHandler(error)
        return res.status(statusMaker.internalError).json(rep)
    }
}

export const deleteGift = async (req, res) => {
    try {
        const { giftId, store } = req.query
        const website = await storeHandler(store)
        if (!giftId) {
            const rep = responseHandler(statusMaker.badRequest, apiMessages.invalidRequest, [])
            return res.status(statusMaker.badRequest).json(rep)
        }
        const checkgift = await gift.findOne({ where: { id: giftId } })
        if (!checkgift) {
            const rep = responseHandler(statusMaker.notFound, "Gift doesn't exist", [])
            return res.status(statusMaker.notFound).json(rep)
        }
        await gift.destroy({ where: { id: giftId, store: website } })
        const rep = responseHandler(statusMaker.deleted, apiMessages.deleted, [])
        return res.status(statusMaker.deleted).json(rep)

    } catch (error) {
        const rep = errorHandler(error)
        return res.status(statusMaker.internalError).json(rep)
    }
}

export const exportCustomerDatas = async (req, res) => {
    try {
        const { startDate, endDate, levelType, store } = req.query;
        const website = await storeHandler(store);

        if (!startDate || !endDate || !levelType) {
            const resp = responseHandler(statusMaker.badRequest, apiMessages.badRequest);
            return res.status(statusMaker.badRequest).json(resp);
        }
        const stDate = new Date(startDate);
        const edDate = new Date(endDate);
        const membershipFilter = levelType === 'All' ? {} : { membership_tier: levelType };
        const customers = await customer.findAll({
            where: membershipFilter, store: website,
            attributes: [
                "customer_id", "account_number", "phone_number", "email",
                "first_name", "last_name", "address1", "address2", "city",
                "country", "zip", "State", "earned_point", "balance_point", "gender", "membership_tier"
            ],
            order: [['created_at', 'DESC']],
            limit: 500
        });
        // const customers = await customer.findAll({ where: membershipFilter, store: website,});
        const customerIds = customers.map((customer) => customer.customer_id);
        const transitions = await transition.findAll({
            where: {
                customer_Id: { [Op.in]: customerIds },
                transition_status: "credit",
                store: website,
                created_at: {
                    [Op.gte]: stDate,
                    [Op.lte]: edDate,
                },
            },
            attributes: ["customer_Id", "point"],
        });
        const accumulatedPointsMap = customerIds.reduce((acc, customerId) => {
            acc[customerId] = 0;
            return acc;
        }, {});
        transitions.forEach((transition) => {
            const customerId = transition.customer_Id;
            const points = parseFloat(transition.point) || 0;
            accumulatedPointsMap[customerId] += points;
        });
        const pointsArray = Object.entries(accumulatedPointsMap).map(([customerId, points]) => ({
            customerId,
            points,
        }));
        const pointsMap = pointsArray.reduce((acc, item) => {
            acc[item.customerId] = item.points;
            return acc;
        }, {});
        const updatedCustomers = customers.map((customer) => {
            const points = pointsMap[customer.customer_id] || 0;
            return { ...customer.dataValues, points };
        });
        const resp = responseHandler(statusMaker.found, "Customer fetched successfully", updatedCustomers);
        return res.status(statusMaker.found).json(resp);
    } catch (error) {
        const resp = errorHandler(error.message);
        return res.status(statusMaker.internalError).json(resp);
    }
};

export const exportCustomersForBenefits = async (req, res) => {
    try {
        const { startDate, endDate, levelType, store } = req.query;
        const website = await storeHandler(store);

        if (!startDate || !endDate || !levelType) {
            const resp = responseHandler(statusMaker.badRequest, 'Please provide all fields!');
            return res.status(statusMaker.badRequest).json(resp);
        }

        // Build the WHERE clause dynamically
        let whereClause = `WHERE `;
        if (levelType && levelType !== 'All') {
            whereClause += `cd.membership_tier = '${levelType}'`;
        } else if (levelType === 'All') {
            whereClause += `cd.membership_tier IN ('welcome', 'blue', 'silver', 'gold', 'platinum')`;
        }

        const sellerQuery = `
            SELECT 
                cd.customer_id, 
                cd.account_number, 
                cd.first_name, 
                cd.last_name, 
                cd.phone_number, 
                cd.email, 
                cd.membership_tier,
                cd.address1, 
                cd.address2, 
                cd.city, 
                cd.Distrtict, 
                cd.zip, 
                cd.State, 
                cd.country,
                (CAST(cd.earned_point AS NUMERIC) + CAST(cd.redeem_point AS NUMERIC)) AS totalEarnedPoints,
                cd.balance_point,
                SUM(CAST(t.point AS NUMERIC)) AS points,
                :startDate AS transactionStartDate,
                :endDate AS transactionEndDate
            FROM 
                customers AS cd 
            INNER JOIN 
                transitions AS t 
                ON t.customer_Id = cd.customer_id
                AND CAST(t.created_at AS DATE) BETWEEN CAST(:startDate AS DATE) AND CAST(:endDate AS DATE)
                AND t.transition_status IN ('credit')
            ${whereClause}
            GROUP BY 
                cd.customer_id, 
                cd.account_number, 
                cd.first_name, 
                cd.last_name, 
                cd.phone_number, 
                cd.email, 
                cd.address1, 
                cd.address2, 
                cd.city, 
                cd.Distrtict, 
                cd.zip, 
                cd.State, 
                cd.country,
                cd.earned_point,
                cd.redeem_point,
                cd.balance_point,
                cd.membership_tier;
        `;

        // Execute the query with replacements for security
        const customers = await sequelize.query(sellerQuery, {
            type: Sequelize.QueryTypes.SELECT,
            replacements: {
                startDate,
                endDate
            }
        });

        const resp = responseHandler(statusMaker.found, "Customers fetched successfully", customers);
        return res.status(statusMaker.found).json(resp);

    } catch (error) {
        console.error("Exports Customer for Dispatch Error ::>>", error);
        const resp = errorHandler(error.message);
        return res.status(statusMaker.internalError).json(resp);
    }
};


export const importCustomerData = async (req, res) => {
    try {
        const { store } = req.query
        const website = await storeHandler(store)
        // console.log("store--------", website);
        // console.log("----------------");
        const filePath = path.join(__dirname, '../../../uploads/', req.couponFile['filePath']);
        await TempGiftActivity.destroy({ truncate: true });
        // console.log("filepath---------", filePath);
        let sheet = [];
        if (filePath.endsWith('.csv')) {
            const csvData = await new Promise((resolve, reject) => {
                const csvData = [];
                fs.createReadStream(filePath)
                    .pipe(csv())
                    .on('data', (row) => csvData.push(row))
                    .on('end', () => resolve(csvData))
                    .on('error', (err) => reject(err));
            });

            sheet = csvData;
            await processSheet(sheet, req, res, filePath, website);
        } else if (filePath.endsWith('.xlsx')) {
            const workSheetsFromFile = xlsx.parse(filePath);
            sheet = workSheetsFromFile[0].data;
            await processSheet(sheet, req, res, filePath, website);
        } else {
            unlinkSync(filePath);
            const resp = responseHandler(statusMaker.badRequest, "Invalid file format. Please upload a valid CSV or XLSX file.")
            return res.status(statusMaker.badRequest).json(resp);
        }
    } catch (error) {
        const resp = errorHandler(error.message);
        // const resp = responseHandler(statusMaker.badRequest,"Please select excel file")
        return res.status(statusMaker.badRequest).json(resp);
    }
};

const processSheet = async (sheet, req, res, filePath, store) => {
    try {
        if (!sheet.length || !sheet[0] || sheet[0].length === 0) {
            unlinkSync(filePath);
            const resp = responseHandler(statusMaker.badRequest, "The uploaded file is missing headers or is empty. Please upload a valid file.");
            return res.status(statusMaker.badRequest).json(resp);
        }

        const expectedHeaders = [
            'Sr. No', 'Account Number', 'Customer ID', 'Name', 'City', 'Pincode', 'Mobile No',
            'Address', 'Email', 'State', 'Membership Level', 'Available Points',
            'Accumulated Points'

        ];

        let headers;
        if (typeof sheet[0] === 'object' && !Array.isArray(sheet[0])) {
            headers = Object.keys(sheet[0]);
        } else if (Array.isArray(sheet[0])) {
            headers = sheet[0];
        } else {
            unlinkSync(filePath);
            const resp = responseHandler(statusMaker.badRequest, "Invalid file format. Please ensure the file has proper headers.");
            return res.status(statusMaker.badRequest).json(resp);
        }
        const isHeaderValid = expectedHeaders.every((header) => headers.includes(header));
        if (!isHeaderValid) {
            unlinkSync(filePath);
            const resp = responseHandler(statusMaker.badRequest, "Invalid file headers. Ensure the file contains correct columns.");
            return res.status(statusMaker.badRequest).json(resp);
        }

        let temp_data = [];
        let countData = 0;

        for (let i = 1; i < sheet.length; i++) {
            const row = Array.isArray(sheet[i]) ? sheet[i] : Object.values(sheet[i]);
            if (row.length > 0 && row.some((val) => val !== null && val !== undefined && val !== '')) {
                const couponCodeObj = {
                    accountId: row[1],
                    customerId: cleanNumber(row[2]),
                    name: row[3] || null,
                    city: row[4] || null,
                    pincode: cleanNumber(row[5]),
                    contactNo: row[6] || null,
                    address: row[7] || null,
                    email: row[8] || null,
                    state: row[9] || null,
                    membershipLevel: row[10] || null,
                    // availablePoints: sanitizeInteger(row[12]),
                    // accumulatedPoints: sanitizeInteger(row[13]),
                    availablePoints: cleanNumber(row[12]),
                    accumulatedPoints: cleanNumber(row[13]),
                    createdIstAt: DateTime(),
                    updatedIstAt: DateTime(),
                    store: store
                };
                temp_data.push(couponCodeObj);
                countData++;
            } else {
                console.log("Skipped row:", row);
            }
        }

        if (temp_data.length > 0) {
            await TempGiftActivity.bulkCreate(temp_data);
        }

        unlinkSync(filePath);
        const resp = responseHandler(statusMaker.success, "File processed successfully!", countData);
        return res.status(statusMaker.success).json(resp);

    } catch (error) {
        unlinkSync(filePath);
        const resp = responseHandler(statusMaker.internalError, error.message)
        return res.status(statusMaker.internalError).json(resp);
    }
};

const cleanNumber = (value) => (isNaN(value) || value === 'N/A' ? null : value);

export const getTempCustomerGiftData = async (req, res) => {
    try {
        const { store } = req.query
        const website = await storeHandler(store)
        const getTempgift = await TempGiftActivity.findAll({ where: { store: website } })
        if (checkEmptyArray(getTempgift)) {
            const resp = responseHandler(statusMaker.success, "TempGiftActivity is Empty")
            return res.status(statusMaker.success).json(resp);
        }
        const resp = responseHandler(statusMaker.found, "TempGiftActivity fetched successfully", getTempgift)
        return res.status(statusMaker.found).json(resp);

    } catch (error) {
        const resp = errorHandler(error.message)
        return res.status(statusMaker.internalError).json(resp);
    }
}

export const dispatchGifts = async (req, res) => {
    try {
        const { giftId, giftName, levelType, giftDescription, store } = req.body;
        const website = await storeHandler(store);

        if (!giftId || !giftName || !giftDescription) {
            const resp = responseHandler(statusMaker.badRequest, "Missing required fields");
            return res.status(statusMaker.badRequest).json(resp);
        }
        const checkgift = await gift.findOne({ where: { id: giftId, gift_name: giftName } })
        if (!checkgift) {
            const resp = responseHandler(statusMaker.notFound, "Gift not exist", checkgift)
            return res.status(statusMaker.badRequest).json(resp)
        }
        const findTempGift = await TempGiftActivity.findAll({ where: { store: website, dispatchStatus: 'Pending' } });

        const dispatchResults = [];
        let data = []
        for (let i = 0; i < findTempGift.length; i++) {
            const sgObj = findTempGift[i];
            // console.log("SGObj-----------", sgObj);
            data.push(sgObj.pincode)
            try {
                const orderId = generateOrderId();
                const getAvailablePincode = await availabilityPincode(sgObj.pincode);
                const giftOrderObj = {
                    orderId: orderId,
                    giftId: giftId,
                    giftName: giftName,
                    giftDescription: giftDescription,
                    levelType,
                    customerId: sgObj.customerId,
                    customerName: sgObj.name,
                    accountId: sgObj.accountId,
                    contactNo: sgObj.contactNo,
                    email: sgObj.email,
                    courierPartner: getAvailablePincode.courierPartner,
                    membershipLevel: sgObj.membershipLevel,
                    gender: sgObj.gender,
                    accumulatedPoints: sgObj.accumulatedPoints,
                    totalPoints: sgObj.earned_point,
                    availablePoints: sgObj.availablePoints,
                    address: sgObj.address,
                    pinCode: sgObj.pincode,
                    state: sgObj.state,
                    trackingUrl: "https://www.delhivery.com/tracking",
                    updateByStaff: 'superAdmin',
                    createdIstAt: DateTime(),
                    updatedIstAt: DateTime(),
                    store: website
                };
                // console.log("giftOrderObj---------", giftOrderObj);
                let orderData = {
                    customerId: sgObj.customerId,
                    accountId: sgObj.accountId,
                    customerCountry: sgObj?.country ?? 'India',
                    customerCity: sgObj?.city,
                    codAmount: 0,
                    customerPincode: sgObj?.pincode,
                    customerState: sgObj?.state,
                    orderId,
                    customerAddress: sgObj.address,
                    payment_mode: 'Prepaid',
                    quantity: 1,
                    customerContactNo: sgObj.contactNo,
                    amount: 0,
                    customerName: sgObj.name,
                    store: website
                };
                // console.log("orderData------------", orderData);
                // console.log("getAvailablePincode-----------", getAvailablePincode);
                let newgiftOrder;
                if (getAvailablePincode.courierPartner === 'DELHIVERY') {
                    const giftd = await createGiftShipmentInDelhivery(orderData);
                    const giftdata = { ...giftOrderObj, awbId: giftd.awbId }
                    // console.log("getShipment-------", getShipment);
                    newgiftOrder = await giftOrders.create(giftdata);
                    // console.log("createGiftOrder-------", createGiftOrder);
                }

                else if (getAvailablePincode.courierPartner === 'SHIPROCKET') {
                    const giftdata = await createGiftShipmentInShipRocket(orderData);
                    // console.log("getShipment-------", getShipment);
                    const giftOrderdata = { ...giftOrderObj, awbId: giftdata.awbId }
                    newgiftOrder = await giftOrders.create(giftOrderdata);
                    // console.log("createGiftOrder-------", createGiftOrder);
                }
                if (sgObj.dispatchStatus === 'Failed' || sgObj.dispatchStatus === 'Pending') {
                    await TempGiftActivity.destroy({
                        where: {
                            dispatchStatus: sgObj.dispatchStatus,
                            updatedIstAt: DateTime(),
                            id: sgObj.id,
                        },
                    });
                }
                console.log("data---------------", newgiftOrder);
                const whatsappDetails = {
                    giftName: giftName,
                    courierPartner: getAvailablePincode.courierPartner,
                    awbId: newgiftOrder.awbId,
                    createdIstAt: newgiftOrder.createdIstAt
                }
                // console.log("sendMail------", sendMail.resp);
                dispatchResults.push({
                    id: sgObj.id,
                    status: 'Success',
                    message: 'Dispatched successfully',
                });
                // await handleNotifications('product-dispatched',website,whatsappDetails)
                sendNotifications(website, whatsappDetails);
            } catch (error) {
                console.log("Gift Dispatch Error ::>>", error.message);
                await TempGiftActivity.update(
                    {
                        dispatchStatus: 'Failed',
                        updatedIstAt: DateTime(),
                        remarks: error.message,
                    },
                    {
                        where: {
                            id: sgObj.id,
                        },
                    }
                );

                dispatchResults.push({
                    id: sgObj.id,
                    status: 'Failed',
                    message: error.message,
                });
            }
        }
        const resp = responseHandler(
            statusMaker.success,
            "Dispatch process completed",
            dispatchResults
        );
        return res.status(statusMaker.success).json(resp);
    } catch (error) {
        console.log("Gift Dispatch Main Error ::>>", error.message);
        const resp = errorHandler(error.message);
        return res.status(statusMaker.internalError).json(resp);
    }
};

const sendNotifications = async (website, details) => {
    try {
        await handleNotifications('product-dispatched', website, details);
    } catch (error) {
        console.error("Notification Error ::>>", error.message);
    }
};

export const getFailedDispatchStatus = async (req, res) => {
    try {
        const { store } = req.query
        const website = await storeHandler(store)
        const findDispatch = await TempGiftActivity.findAll({ where: { dispatchStatus: 'Failed', store: website }, order: [['updatedIstAt', 'DESC']] })
        if (checkEmptyArray(findDispatch)) {
            const resp = responseHandler(statusMaker.success, apiMessages.notFound)
            return res.status(statusMaker.success).json(resp)
        }
        const resp = responseHandler(statusMaker.found, apiMessages.found, findDispatch)
        return res.status(statusMaker.found).json(resp)
    } catch (error) {
        const resp = errorHandler(error.message)
        return res.status(statusMaker.internalError).json(resp)
    }
}

export const getSuccessDispatchStatus = async (req, res) => {
    try {
        let { page, limit, startDate, endDate, levelType, search, giftName, store } = req.query;
        page = page ? Number(page) : 1;
        limit = limit ? Number(limit) : 15;

        const website = await storeHandler(store);
        if (!website) {
            const resp = responseHandler(statusMaker.badRequest, "Invalid store provided");
            return res.status(statusMaker.badRequest).json(resp);
        }
        let whereClause = { status: "Confirmed", store: website };
        if (levelType && levelType !== "All") {
            whereClause.membershipLevel = levelType;
        }
        if (startDate || endDate) {
            whereClause.createdAt = {};
            if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
            if (endDate) whereClause.createdAt[Op.lte] = new Date(new Date(endDate).setHours(23, 59, 59, 999));
        }
        if (search) {
            whereClause[Op.or] = [
                { contactNo: { [Op.like]: `%${search}%` } },
                { accountId: { [Op.like]: `%${search}%` } }
            ];
        }
        if (giftName) {
            whereClause.giftName = giftName;
        }
        const offset = limit * (page - 1);
        const data = await giftOrders.findAndCountAll({
            where: whereClause,
            order: [["createdAt", "DESC"]],
            limit: limit,
            offset: offset,
        });
        if (!data || data.rows.length === 0) {
            const resp = responseHandler(statusMaker.success, apiMessages.notFound);
            return res.status(statusMaker.success).json(resp);
        }
        const ordersWithShipment = await Promise.all(
            data.rows.map(async (order) => {
                const shipment = await giftShipment.findOne({
                    where: { orderId: order.orderId },
                });
                return { ...order.toJSON(), shipment };
            })
        );
        const resp = responseHandler(statusMaker.found, apiMessages.found, {
            totalCount: data.count,
            currentPage: page,
            currentPageCount: data.rows.length,
            data: ordersWithShipment,
        });

        return res.status(statusMaker.found).json(resp);
    } catch (error) {
        console.error("Error in getSuccessDispatchStatus:", error);
        const resp = errorHandler(error.message);
        return res.status(statusMaker.internalError).json(resp);
    }
};

export const editCustomerForTempGift = async (req, res) => {
    try {
        const { id, address, pinCode, phone_number, city, state, store } = req.body
        const processedStore = await storeHandler(store)
        const checkUser = await TempGiftActivity.findOne({ where: { id: id, store: processedStore } })
        if (!checkUser) {
            const resp = responseHandler(statusMaker.notFound, apiMessages.notFound);
            return res.status(statusMaker.notFound).json(resp);
        }
        await TempGiftActivity.update(
            { contactNo: phone_number, address: address, pincode: pinCode, city: city, state: state },
            { where: { id: id, store: processedStore } }
        );
        const updatedUser = await TempGiftActivity.findOne({ where: { id: id, store: processedStore } });
        const resp = responseHandler(statusMaker.updated, apiMessages.update, updatedUser);
        return res.status(statusMaker.updated).json(resp);
    } catch (error) {
        const resp = errorHandler(error.message);
        return res.status(statusMaker.internalError).json(resp);
    }
}

export const editOrderForGift = async (req, res) => {
    try {
        const { id, address, courierPartner, awbId, phone_number, pinCode, state, city,
            store, dispatchDate } = req.body;
        const processedStore = await storeHandler(store);
        const checkUser = await giftOrders.findOne({ where: { id: id, store: processedStore } });
        if (!checkUser) {
            const resp = responseHandler(statusMaker.notFound, apiMessages.notFound);
            return res.status(statusMaker.notFound).json(resp);
        }
        const formattedDate = moment(dispatchDate).format('DD/MM/YYYY, HH:mm:ss');
        await giftOrders.update(
            {
                contactNo: phone_number,
                address: address,
                pincode: pinCode,
                city: city,
                state: state,
                courierPartner: courierPartner,
                awbId: awbId,
                updatedIstAt: formattedDate,
            },
            { where: { id: id, store: processedStore } }
        );
        const findShipment = await giftShipment.findOne({
            where: { orderId: checkUser.orderId },
        });
        if (findShipment) {
            findShipment.awbId = awbId;
            await findShipment.save();
        }
        const updatedUser = await giftOrders.findOne({ where: { id: id, store: processedStore } });
        const resp = responseHandler(statusMaker.updated, apiMessages.update, updatedUser);
        return res.status(statusMaker.updated).json(resp);
    } catch (error) {
        const resp = errorHandler(error.message);
        return res.status(statusMaker.internalError).json(resp);
    }
};
