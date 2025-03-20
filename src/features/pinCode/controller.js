import { checkEmptyArray, statusMaker } from '../voucher'
import { storeHandler, errorHandler, responseHandler, apiMessages, pinCode } from './index'
import path from 'path'
import xlsx from 'node-xlsx'
import fs, { unlinkSync } from "fs";
import csv from 'csv-parser'
import { Op } from 'sequelize';

export const addPin = async (req, res) => {
    try {
        const { district, pincode, stateName, status, courierPartner, store } = req.body
        const processedStore = await storeHandler(store)
        if (!district || !pincode || !status) {
            const rep = responseHandler(statusMaker.badRequest, "Missing pinCode or district or status")
            return res.status(statusMaker.badRequest).json(rep)
        }
        const newPin = await pinCode.create({ district, pin_code: pincode, stateName, status, courierPartner, store: processedStore })
        if (newPin) {
            const rep = responseHandler(statusMaker.created, apiMessages.create, newPin)
            return res.status(statusMaker.created).json(rep)
        }
        const rep = responseHandler(statusMaker.internalError, "pinCode not created")
        return res.status(statusMaker.internalError).json(rep)
    } catch (error) {
        const rep = errorHandler(error.message)
        return res.status(statusMaker.internalError).json(rep)
    }
}

export const getPin = async (req, res) => {
    try {
        const { store } = req.query
        const processedStore = await storeHandler(store)
        const findPin = await pinCode.findAll({ where: { store: processedStore } })
        if (checkEmptyArray(findPin)) {
            const rep = responseHandler(statusMaker.notFound, "pinCode is Empty", findPin)
            return res.status(statusMaker.success).json(rep)
        }
        const rep = responseHandler(statusMaker.found, apiMessages.found, findPin)
        return res.status(statusMaker.found).json(rep)
    } catch (error) {
        const rep = errorHandler(error.message)
        return res.status(statusMaker.internalError).json(rep)
    }
}

export const updatePin = async (req, res) => {
    try {
        const { pinId, district, pincode, status, courierPartner, stateName, store } = req.body
        const processedStore = await storeHandler(store)
        const putPin = await pinCode.update({ district, pin_code: pincode, status, courierPartner, stateName }, { where: { id: pinId, store: processedStore } })
        if (putPin) {
            const rep = responseHandler(statusMaker.updated, apiMessages.update, putPin)
            return res.status(statusMaker.updated).json(rep)
        }
        const rep = responseHandler(statusMaker.internalError, apiMessages.errorOccurred)
        return res.status(statusMaker.internalError).json(rep)
    } catch (error) {
        const rep = errorHandler(error.message)
        return res.status(statusMaker.internalError).json(rep)
    }
}

export const deletePin = async (req, res) => {
    try {
        const { store, pinId } = req.query
        const processedStore = await storeHandler(store)
        if (!pinId) {
            const rep = responseHandler(statusMaker.badRequest, "Missing pin Id")
            return res.status(statusMaker.badRequest).json(rep)
        }
        const checkPin = await pinCode.findOne({ where: { id: pinId, store: processedStore } })
        if (!checkPin) {
            const rep = responseHandler(statusMaker.badRequest, "pinCode not found")
            return res.status(statusMaker.badRequest).json(rep)
        }
        await checkPin.destroy()
        const rep = responseHandler(statusMaker.deleted, apiMessages.deleted)
        return res.status(statusMaker.deleted).json(rep)
    } catch (error) {
        const rep = errorHandler(error.message)
        return res.status(statusMaker.internalError).json(rep)
    }
}

export const importPin = async (req, res) => {
    try {
        // Extract store info and handle the store
        const { store } = req.query;
        const website = await storeHandler(store);

        // Get the file path from the request (couponFile)
        const filePath = path.join(__dirname, '../../../uploads/', req.couponFile['filePath']);

        let sheet = [];

        // Check if the file is a CSV
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
        }
        else if (filePath.endsWith('.xlsx')) {
            const workSheetsFromFile = xlsx.parse(filePath);
            sheet = workSheetsFromFile[0].data;
        }
        else {
            unlinkSync(filePath); 
            const resp = responseHandler(statusMaker.badRequest, "Invalid file format. Please upload a valid CSV or XLSX file.");
            return res.status(statusMaker.badRequest).json(resp);
        }
        const importedData = [];
        for (let row of sheet) {
            const { district, pin_code, stateName, status, courierPartner } = row;
            const existingPin = await pinCode.findOne({
                where: { pin_code }
            });

            let pinData;

            if (existingPin) {
                pinData = await pinCode.update({
                    district,
                    stateName,
                    status: status || 'active',
                    courierPartner: courierPartner || 'DELHIVERY', 
                    store: website || 'rajnigandha', 
                    updateByStaff: req.user ? req.user.name : 'superAdmin',
                    updatedIstAt: new Date().toISOString(),
                }, {
                    where: { pin_code },
                    returning: true, 
                });

                pinData = pinData[1][0]; 
            } else {
                pinData = await pinCode.create({
                    district,
                    pin_code,
                    stateName,
                    status: status || 'active', 
                    courierPartner: courierPartner || 'DELHIVERY',
                    store: website || 'rajnigandha', 
                    updateByStaff: req.user ? req.user.name : 'superAdmin', 
                    createdIstAt: new Date().toISOString(),
                    updatedIstAt: new Date().toISOString(),
                });
            }
            importedData.push(pinData);
        }
        const response = responseHandler(statusMaker.success, "Pin codes imported and updated successfully", importedData);
        return res.status(statusMaker.success).json(response);

    } catch (error) {
        const rep = errorHandler(error.message);
        return res.status(statusMaker.internalError).json(rep);
    }
}

export const searchPinCode = async (req, res) => {
    try {
        const { store, search } = req.query
        const processedStore = await storeHandler(store)
        if (!search) {
            const rep = responseHandler(statusMaker.badRequest, "Missing search key");
            return res.status(statusMaker.badRequest).json(rep);
        }
        const searchpaarms = {
            store: processedStore,
            [Op.or]: [
                {stateName:{ [Op.like]: `%${search}%` }},
                { pin_code: { [Op.like]: `%${search}%` } },
            ],
        };
        const filterPins = await pinCode.findAll({ where: searchpaarms })
        console.log("filterPins-----", filterPins);
        const rep = responseHandler(statusMaker.found, apiMessages.found, filterPins);
        return res.status(statusMaker.found).json(rep);
    } catch (error) {
        const rep = errorHandler(error.message);
        return res.status(statusMaker.internalError).json(rep);
    }
}

export const getAllStateName = async(req,res) => {
    try {
        const {store} = req.query
        const processedStore = await storeHandler(store)
        const getstates = await pinCode.findAll({attributes:['stateName'],group:['stateName'],
            order:[['stateName','ASC']],raw:true,where:{store:processedStore}})
        console.log("states----",getstates);
        if(checkEmptyArray(getstates)){
            const rep = responseHandler(statusMaker.notFound,apiMessages.notFound,getstates);
            return res.status(statusMaker.success).json(rep);
        }
        const rep = responseHandler(statusMaker.found,apiMessages.found,getstates);
        return res.status(statusMaker.found).json(rep);
    } catch (error) {
        const rep = errorHandler(error.message);
        return res.status(statusMaker.internalError).json(rep);
    }
}

export const filterByStateName = async(req,res) => {
    try {
        const {state,store} = req.query
        const processedStore = await storeHandler(store)
        if(!state){
            const rep = responseHandler(statusMaker.badRequest,apiMessages.errorOccurred);
            return res.status(statusMaker.badRequest).json(rep);
        }
        const filterData = await pinCode.findAll({where:{stateName:state,store:processedStore}})
        if(checkEmptyArray(filterData)){
            const rep = responseHandler(statusMaker.notFound,apiMessages.notFound,filterData);
            return res.status(statusMaker.success).json(rep);
        }
        const rep = responseHandler(statusMaker.found,apiMessages.found,filterData);
        return res.status(statusMaker.found).json(rep);
    } catch (error) {
        const rep = errorHandler(error.message);
        return res.status(statusMaker.internalError).json(rep);
    }
}