import { encryption, decryption } from "./encrypt_decrypt";
import dotenv from 'dotenv';
import Sequelize, { Op } from 'sequelize';
import DateTime from "../../utils/getDateTime";
import VouchagramLog from '../../utils/vouchagram'
import axios from "axios";
import sequelize from "../../config/db";
import cron from "node-cron";

// import { } from './index'
import {
  responseHandler, errorHandler, statusMaker, apiMessages, voucherBrands, checkEmptyArray,
  storeHandler, customer, customerVoucher, customerData, generateId, transition, point,
  handleNotifications, sendSMSvoucherredeemconfirmation, sendSMSOTPVoucher, sendSMSVouchcerRevised
  , sendSMSRefundofRewardPoints,config
} from "./index";
// import { createTransaction } from "../../helpers/transaction";
import moment from 'moment';

dotenv.config();

// const userName = "dsgroupotp.api";
// const userPassword = "M8%2453b7p";
const dv = 0.20

export async function getToken() {
  try {
    const { data } = await axios({
      method: "get",
      url: `${process.env.VOUCHAGRAM_SERVER_URL}/gettoken`,
      headers: {
        username: process.env.VOUCHAGRAM_USERNAME,
        password: process.env.VOUCHAGRAM_PASSWORD
      },
    })
    console.log("data----", data);

    const decodedToken = decryption(data.data);
    return decodedToken;
  } catch (err) {
    console.log("ERROR TO GET TOKEN ::>>", err);
    return "ERROR TO GET TOKEN";
  }
}

cron.schedule("0 14 * * *", () => {
  updateBrands();
});

const updateBrands = async (req, res) => {
  try {
    const website = await storeHandler()
    const token = await getToken()
    const { data } = await axios({
      method: "post", url: `${process.env.VOUCHAGRAM_SERVER_URL}/getbrands`,
      headers: {
        token: token,
      },
    });

    if (data.status === "error") {
      const response = responseHandler(statusMaker.badRequest, apiMessages.errorOccurred)
      return res.status(statusMaker.internalError).json(response)
    }
    const decodedData = decryption(data.data)
    // console.log("decodedData----", decodedData);

    if (decodedData.length == 0) {
      const response = apiMessages.notFound
      return res.status(statusMaker.notFound).json(response)
    }
    await Promise.all(
      decodedData.map(async (item) => {
        const existingBrand = await voucherBrands.findOne({
          where: { BrandProductCode: item.BrandProductCode, store: website },
        });
        let requiredPoints = null;

        if (item.denominationList !== null) {
          let denominationArray = item.denominationList
            .split(",")
            .map(Number)
            .filter(num => !isNaN(num)); // Remove NaN values
        
          if (denominationArray.length > 0) {
            const minValue = Math.min(...denominationArray); // Get the minimum denomination
        
            const quantity = item.quantity || 1; // Use item quantity, default to 1 if not provided
            const platformFees = item.platformFees || 0; // Default platform fees to 0 if not provided
        
            requiredPoints = Math.round((minValue * quantity * (1 / 0.20)) + platformFees);
          }
        }
        if (existingBrand) {
          return await voucherBrands.update(
            {
              BrandName: item.BrandName,
              BrandImage: item.BrandImage,
              BrandType: item.Brandtype,
              OnlineRedemptionUrl: item.OnlineRedemptionUrl,
              RedemptionType: item.RedemptionType,
              minPrice:
                typeof item.denominationList === "string" &&
                  item.denominationList.trim()
                  ? Math.min(...item.denominationList.split(",").map(Number))
                  : null,
              DenominationList: item.denominationList,
              StockAvailable: item.stockAvailable,
              // Category: item.Category,
              // Descriptions: item.Descriptions,
              // TermsAndCondition: item.tnc,
              ImportantInstruction: item.importantInstruction,
              RedeemSteps: item.redeemSteps,
              requiredPoints,
              // updateByStaff: req.user.data.name,
              vendor: "Vouchagram",
              updatedIstAt: DateTime(),
              source_of_device: 'rajnigandha.com'
            },
            {
              where: { BrandProductCode: item.BrandProductCode, store: website },
            }
          );
        } else {
          return await voucherBrands.create({
            BrandName: item.BrandName,
            BrandProductCode: item.BrandProductCode,
            BrandImage: item.BrandImage,
            BrandType: item.Brandtype,
            OnlineRedemptionUrl: item.OnlineRedemptionUrl,
            RedemptionType: item.RedemptionType,
            minPrice:
              typeof item.denominationList === "string" &&
                item.denominationList.trim()
                ? Math.min(...item.denominationList.split(",").map(Number))
                : null,
            DenominationList: item.denominationList,
            StockAvailable: item.stockAvailable,
            Category: item.Category,
            Descriptions: item.Descriptions,
            TermsAndCondition: item.tnc,
            ImportantInstruction: item.importantInstruction,
            RedeemSteps: item.redeemSteps,
            updateByStaff: 'superAdmin',
            vendor: "Vouchagram",
            createdIstAt: DateTime(),
            updatedIstAt: DateTime(),
            source_of_device: 'rajnigandha.com',
            store: website,
            requiredPoints
          });
        }
      })
    )
  } catch (error) {
    console.log("Error updating Brands", error.message);
  }
}

export const getBrands = async (req, res) => {
  try {
    const { store } = req.query;
    const website = await storeHandler(store)
    const allVouchers = await voucherBrands.findAll({
      where: {
        store: website, [Op.and]: [
          { DenominationList: { [Op.ne]: null } },
          { DenominationList: { [Op.ne]: '' } }
          // { DenominationList: { [Op.ne]: '0' } },
        ]
      }
    });
    if (allVouchers?.length > 0) {
      const response = responseHandler(statusMaker.found, "Fetch data Successfully", allVouchers)
      return res.status(statusMaker.found).json(response)
    }
    else {
      const response = responseHandler(statusMaker.success, "No data found", allVouchers)
      return res.status(statusMaker.success).json(response)
    }
  } catch (error) {
    // console.log(("err-------------", error));
    const response = errorHandler(`Something went wrong ${error.message}`)
    return res.status(statusMaker.internalError).json(response)
  }
}

export const updateBrandStatus = async (req, res) => {
  try {
    const { voucherBrandId, store, ...rest } = req.body;
    const website = await storeHandler(store)
    if (!voucherBrandId || voucherBrandId == "") {
      return res.status(statusMaker.badRequest).json({
        message:
          "Bad Request"
      })
    }

    const updateVoucher = await voucherBrands.update({
      ...rest,
      //updateByStaff: req.user.data.name,
      updatedIstAt: DateTime()
    }, {
      where: {
        id: voucherBrandId,
        store: website
      }
    })

    if (updateVoucher[0] === 0) {
      const response = errorHandler("Failed to update brand status!!!")
      return res.status(statusMaker.badRequest).json(response)
    }

    const response = responseHandler(statusMaker.updated, "Updated successfully", updateVoucher)
    return res.status(statusMaker.found).json(response)
  } catch (error) {
    const response = errorHandler(`Something went wrong ${error.message}`)
    return res.status(statusMaker.internalError).json(response)
  }
};

export const getStocks = async (req, res) => {
  try {
    const { voucherBrandId, store } = req.query
    const processedStore = await storeHandler(store)

    const brand = await voucherBrands.findOne({
      where: { id: voucherBrandId, store: processedStore },
      attributes: ['BrandProductCode']
    })
    if (!brand) {
      const response = errorHandler("Brand not found with the provided ID.")
      return res.status(statusMaker.notFound).json(response)
    }
    const { BrandProductCode } = brand;
    const token = await getToken();
    let body = { BrandProductCode };
    const { data } = await axios({
      method: "POST",
      url: `${process.env.VOUCHAGRAM_SERVER_URL}/getbrands`,
      data: body,
      headers: {
        token: token
      }
    })
    if (data.status === 'error') {
      const response = apiMessages.invalidRequest
      return res.status(statusMaker.badRequest).json(response)
    }
    try {
      const decodedData = decryption(data.data);
      let denominationList = decodedData[0].denominationList.split(",");
      let result = {
        BrandName: decodedData[0].BrandName,
        BrandImage: decodedData[0].BrandImage,
        denominationCount: denominationList.length,
        denominationStock: []
      };
      await Promise.all(denominationList.map(async (denomination) => {
        let stockBody = {
          BrandProductCode,
          Denomination: denomination
        };
        const stockPayload = encryption(stockBody);
        const stockData = await axios({
          method: "POST",
          url: `${process.env.VOUCHAGRAM_SERVER_URL}/getstock`,
          data: { payload: stockPayload },
          headers: {
            token: token
          }
        });
        if (stockData.data.status === 'error') {
          const response = errorHandler(`No stocks found`)
          return res.status(statusMaker.notFound).json(response)
        }

        const stockDecodedData = decryption(stockData.data.data);
        const denominationStockObject = {
          Denomination: denomination,
          AvailableQuantity: stockDecodedData.AvailableQuantity
        }
        result.denominationStock.push(denominationStockObject);
      }))
      const response = responseHandler(statusMaker.found, "Fetch data successfully", result)
      return res.status(statusMaker.found).json(response)
    } catch {
      const response = responseHandler(statusMaker.notFound, "No data found", [])
      return res.status(statusMaker.notFound).json(response)
    }
  } catch (error) {
    const response = errorHandler(error)
    return res.status(statusMaker.internalError).json(response)
  }
};

export const getBrandbyproductcode = async (req, res) => {
  try {
    const { store, id } = req.query
    const website = await storeHandler(store)
    const allVouchers = await voucherBrands.findOne({
      where: {
        id: id,
        store: website
      }
    });
    if (allVouchers) {
      const response = responseHandler(statusMaker.found, "Fetch data successfully!!!", allVouchers)
      return res.status(statusMaker.found).json(response)
    }
    else {
      const response = responseHandler(statusMaker.success, 'No data found', [])
      return res.status(statusMaker.success).json(response)
    }
  } catch (error) {
    const response = errorHandler(`Something went wrong ${error.message}`)
    return res.status(statusMaker.internalError).json(response)
  }
};

export const getactiveBrands = async (req, res) => {
  try {
    const { store } = req.query
    const website = await storeHandler(store)
    const allVouchers = await voucherBrands.findAll({
      where: {
        status: "active",
        store: website
      },
      order: [['createdAt', 'DESC']]
    });
    const response = responseHandler(statusMaker.found, "Fetch data successfully", allVouchers)
    return res.status(statusMaker.found).json(response)
  } catch (error) {
    const response = errorHandler(`Something went wrong ${error.message}`)
    return res.status(statusMaker.internalError).json(response)
  }
};

export const getAllBrandsName = async (req, res) => {
  try {
    const { store } = req.query
    const website = await storeHandler(store)
    const allData = await voucherBrands.findAll({ where: { store: website } });
    if (allData.length == 0) {
      const response = errorHandler("No data found")
      return res.status(statusMaker.notFound).json(response)
    };
    let resultData = allData.map((item) => item.dataValues.BrandName);
    const response = responseHandler(statusMaker.found, "Fetch data successfully", resultData)
    return res.status(statusMaker.found).json(response)
  } catch (error) {
    const response = errorHandler(`Something went wrong ${error.message}`)
    return res.status(statusMaker.internalError).json(response)
  }
};

export const getAllCategoryOfBrands = async (req, res) => {

  try {
    const { store } = req.query
    const website = await storeHandler(store)
    const allData = await voucherBrands.findAll({
      attributes: ['Category'],
      raw: true
    }, { where: { store: website } })
    if (allData.length == 0) {
      const response = errorHandler("No data found")
      return res.status(statusMaker.notFound).json(response)
    }
    let set = new Set([]);
    for (let i = 0; i < allData.length; i++) {
      if (allData[i].Category !== null) {
        let cts = allData[i].Category.split(',');
        for (let j = 0; j < cts.length; j++) {
          set.add(cts[j].substring(0, 1).toUpperCase() + cts[j].substring(1));
        }
      }
    }
    let cList = [...set];
    cList.sort();
    const response = responseHandler(statusMaker.found, "Fetch data successfully", cList)
    return res.status(statusMaker.found).json(response)
  } catch (error) {
    const response = errorHandler(error)
    return res.status(statusMaker.internalError).json(response)
  }
};

export const getBrandsForSellers = async (req, res) => {
  try {
    let { store, page, limit, minRange, maxRange, highToLow, lowToHigh, categories } = req.query
    const website = await storeHandler(store);
    page = page || 1;
    limit = limit || 10;
    const offset = limit * (page - 1)
    const filters = {
      status: "active",
      store: website
    }
    if (minRange && maxRange) {
      filters.minPrice = {
        [Op.gte]: minRange,
        [Op.lte]: maxRange,
      }
    }
    if (categories && categories.length > 0) {
      filters.Category = {
        [Op.or]: categories.map((category) => {
          return Sequelize.where(
            Sequelize.fn("CHARINDEX", category, Sequelize.col("Category")),
            {
              [Op.gt]: 0,
            }
          );
        }),
      };
    };
    const order = [];
    if (lowToHigh) {
      order.push(["minPrice", "ASC"]);
    } else if (highToLow) {
      order.push(["minPrice", "DESC"]);
    };
    const allVouchers = await voucherBrands.findAndCountAll({
      where: filters,
      limit,
      offset,
      order
    });
    const response = responseHandler(statusMaker.found, "Fetch data successfully", {
      totalCount: allVouchers.count,
      count: allVouchers.rows.length,
      data: allVouchers.rows
    })
    return res.status(statusMaker.found).json(response)
  } catch (error) {
    const response = errorHandler(error)
    return res.status(statusMaker.internalError).json(response)
  }
};

const generatePin = () => {
  const pin = Math.floor(100000 + Math.random() * 900000);
  return pin;
}

// const OTPRedemption = async (otp, contactNo) => {
//   try {
//     const response = await axios({
//       method: 'get',
//       url: `https://api2.growwsaas.com/fe/api/v1/send?username=${userName}&password=${userPassword}&unicode=true&from=DRLSRB&text=Dear Member, ${otp} is the OTP for completing the redemption process. This OTP is valid for 5 minutes from the request. DS Group&dltContentId=1007069100478671256&to=${contactNo}`
//     });
//     return response.data;
//   } catch (err) {
//     console.error('Error in OTP Redemption through sms::>> ', err);
//     return
//   }
// }

export const sendVoucherRequestOtp = async (req, res) => {
  try {
    const { customerId, BrandProductCode, Denomination, Quantity, type, accountNumber, store } = req.body;
    // console.log("customerid---",customerId);
    const website = await storeHandler(store)
    if (!Quantity || Quantity < 1 || Quantity > 100) {
      const resp = errorHandler("Please enter the valid Quantity")
      return res.status(statusMaker.badRequest).json(resp);
    }
    else if (!type || (type !== 'Vouchagram')) {
      const resp = errorHandler("Please enter the valid Type of voucher")
      return res.status(statusMaker.badRequest).json(resp);
    }
    else if (type === 'Vouchagram' && !BrandProductCode || BrandProductCode === "") {
      const resp = errorHandler("Please enter the valid BrandProductCode")
      return res.status(statusMaker.badRequest).json(resp);
    }
    else if (!Denomination || Denomination === "") {
      const resp = errorHandler("Please enter the valid Denomination")
      return res.status(statusMaker.badRequest).json(resp);
    }
    const custr = await customer.findOne({ where: { customer_id: customerId, account_number: accountNumber } })
    console.log("customer--------", custr);
    if (!custr) {
      const response = responseHandler(statusMaker.notFound, apiMessages.notFound, [])
      return res.status(statusMaker.notFound).json(response);
    };
    let voucherBrandDetails;

    if (type === 'Vouchagram') {
      voucherBrandDetails = await voucherBrands.findOne({
        where: {
          BrandProductCode: BrandProductCode, store: website
        },
        raw: true
      });
      const token = await getToken();
      console.log("token-----", token);

      let body = {
        BrandProductCode,
        Denomination
      };
      const payload = encryption(body);
      const { data } = await axios({
        method: "POST",
        url: `${process.env.VOUCHAGRAM_SERVER_URL}/getstock`,
        data: { payload },
        headers: {
          token: token
        }
      })
      console.log("data--------", data);

      if (data.status === 'error') {
        const resp = errorHandler("Product/Brand not available")
        return res.status(statusMaker.notFound).json(resp);
      }
      const decodedData = decryption(data.data)
      console.log("decodedData", decodedData, Number(decodedData.AvailableQuantity) < Quantity);

      if (Number(decodedData.AvailableQuantity) < Quantity) {
        const resp = errorHandler("Insuffcient Quantity of Voucher")
        return res.status(statusMaker.badRequest).json(resp);
      }
    }

    let totalRewardPoints = Number(custr.balance_point)
    let havePoints = Math.round(Number(Denomination) * Number(Quantity) * (1 / dv)) + Number(voucherBrandDetails.platformFees);
    // console.log("havepoints------", havePoints);
    if (totalRewardPoints < havePoints) {
      const resp = errorHandler("You have not enough points for Redemption of Voucher...!")
      return res.status(statusMaker.badRequest).json(resp);
    }
    const otp = parseInt(generatePin(), 10);
    let contactNo = custr.phone_number
    if (contactNo.startsWith('+91')) {
      contactNo = contactNo.slice(3);
    } else if (contactNo.startsWith('0')) {
      contactNo = contactNo.slice(1);
    }
    // console.log("-------", contactNo, custr.phone_number);
    // const response = await OTPRedemption(otp, contactNo);
    // console.log("response--------", response, otp);
    await sendSMSOTPVoucher({ phone_number: custr.phone_number, otp: otp }, website, 'OTPVoucher')
    let existingCustomerData = await customerData.findOne({
      where: { customerId, accountNumber, store: website }
    });
    if (existingCustomerData) {
      await existingCustomerData.update({ otp, otpTimeStampAt: new Date(), otpCount: existingCustomerData.otpCount + 1, updatedIstAt: new Date(), verified: 'unverified' });
    } else {
      await customerData.create({ customerId, accountNumber, otp, otpTimeStampAt: new Date(), otpCount: 0, createdIstAt: new Date(), store: website, verified: 'unverified' });
    }
    // console.log("existimgCustomerdata--------", existingCustomerData);
    const resp = responseHandler(statusMaker.found, "OTP shared on registered mobile number for redemption of vouchers.", 'Sent')
    return res.status(statusMaker.found).json(resp)
  } catch (error) {
    // console.log("err------", error)
    const resp = errorHandler(`Something went wrong ${error.message}`);
    return res.status(statusMaker.internalError).json(resp)
  }
};

export const verifyVoucherOTP = async (req, res) => {
  try {
    const { customerId, accountNumber, otp, store } = req.body
    const website = await storeHandler(store)
    if (!customerId || !accountNumber || !otp) {
      const resp = responseHandler(statusMaker.badRequest, "Missing required fields.");
      return res.status(statusMaker.badRequest).json(resp)
    }
    // console.log("--------",await customerData.findAll());
    let checkOTP = await customerData.findOne({ where: { customerId: customerId, accountNumber: accountNumber, store: website } })
    // console.log("otp----",checkOTP);
    if (!checkOTP) {
      const resp = responseHandler(statusMaker.notFound, "No data found");
      return res.status(statusMaker.notFound).json(resp)
    }
    // console.log("checkOTP--------", checkOTP, otp);
    const currentTime = new Date();
    const otpTimestamp = new Date(checkOTP.otpTimeStampAt);
    if (currentTime - otpTimestamp > 300000) {
      checkOTP.otp = '';
      checkOTP.verified = 'unverified';
      await checkOTP.save();
      const resp = responseHandler(statusMaker.internalError, "OTP has expired.");
      return res.status(statusMaker.internalError).json(resp);
    }
    if (otp == checkOTP.otp) {
      checkOTP.otp = ''
      checkOTP.verified = 'verified'
      checkOTP.save()
      // console.log("---------", checkOTP);
      const resp = responseHandler(statusMaker.found, "OTP verified successfully");
      return res.status(statusMaker.found).json(resp)
    } else {
      const resp = responseHandler(statusMaker.internalError, "OTP not verified");
      return res.status(statusMaker.internalError).json(resp)
    }
  } catch (error) {
    // console.log("err---------", error)
    const resp = errorHandler(`Something went wrong ${error.message}`);
    return res.status(statusMaker.internalError).json(resp)
  }
}

export const filterBrands = async (req, res) => {
  try {
    const { brandName, status, store } = req.query;
    const website = await storeHandler(store);
    let clause = { StockAvailable: 'true', store: website };
    if (brandName) {
      const sanitizedBrandName = brandName.trim();
      clause.BrandName = { [Op.like]: `%${sanitizedBrandName}%` }; 
    }

    if (status) {
      if (status === 'active' || status === 'inactive') {
        clause.status = status;
      } else {
        const response = errorHandler("Invalid value");
        return res.status(statusMaker.badRequest).json(response);
      }
    }
    const getVouchers = await voucherBrands.findAll({
      where: clause,
      raw: true,
    });

    const totalVouchers = await voucherBrands.count({ where: clause });
    const response = responseHandler(statusMaker.found, "Fetch data Successfully", {
      totalCount: totalVouchers,
      count: getVouchers.length,
      data: getVouchers,
    });
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    const response = errorHandler(`Something went wrong ${error.message}`);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const getSingleVoucherDetails = async (req, res) => {
  try {
    const { voucherId, store } = req.query
    const website = await storeHandler(store)
    if (!voucherId) {
      const response = responseHandler(statusMaker.badRequest, "Missing voucher Id");
      return res.status(statusMaker.badRequest).json(response);
    }
    const getVoucher = await voucherBrands.findOne({ where: { id: voucherId, store: website } })
    if (!getVoucher) {
      const response = responseHandler(statusMaker.success, "No data found");
      return res.status(statusMaker.success).json(response);
    }
    const response = responseHandler(statusMaker.found, "Fetch data successfully", getVoucher);
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    // console.error("Error: ", error);
    const response = errorHandler(`Something went wrong ${error.message}`);
    return res.status(statusMaker.internalError).json(response);
  }
}

export const getTransactionReport = async (req, res) => {
  try {
    const response = await axios.post(
      'https://uat-lsrpl-backend.kellton.net/vendor-orders/api/v1/zillion/generateToken',
      {
        email: "ubiUser1@mailinator.com",
        secret: "Pass#1234"
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    // console.log("response",response);
    const reportData = await axios.get(
      'https://uat-lsrpl-backend.kellton.net/vendor-orders/api/v1/zillion/getJsonReport',
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': response.data.data.accessToken,
        }
      }
    );
    // console.log("reportData",reportData);
    const resp = responseHandler(statusMaker.found, "Get Report SuccessFully", reportData.data)
    return res.status(statusMaker.found).json(resp)

  } catch (error) {
    // console.log("err------", error);
    const response = errorHandler(error.message)
    return res.status(statusMaker.internalError).json(response)
  }
}

export const getPendingVoucherRequest = async (req, res) => {
  try {
    const { store } = req.query
    const website = await storeHandler(store)
    const getAllCustomerVouchers = await customerVoucher.findAll({ where: { status: 'Pending', store: website }, order: [['updatedAt', 'DESC']] })
    if (checkEmptyArray(getAllCustomerVouchers)) {
      const response = responseHandler(statusMaker.success, 'No data found')
      return res.status(statusMaker.success).json(response)
    }
    const response = responseHandler(statusMaker.found, "Fetch data successfully", getAllCustomerVouchers)
    return res.status(statusMaker.found).json(response)
  } catch (error) {
    const response = errorHandler(`Something went wrong ${error.message}`)
    return res.status(statusMaker.internalError).json(response)
  }
}

export const getAcceptVoucherRequest = async (req, res) => {
  try {
    const { store } = req.query;
    const website = await storeHandler(store);

    const getAllCustomerVouchers = await customerVoucher.findAll({
      where: { status: 'Completed', store: website },
      order: [['updatedAt', 'DESC']],
    });

    if (checkEmptyArray(getAllCustomerVouchers)) {
      const response = responseHandler(statusMaker.success, 'No data found');
      return res.status(statusMaker.success).json(response);
    }

    const istNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

    for (const findrequest of getAllCustomerVouchers) {
      let lastResend = findrequest.lastNotificationsent;

      if (!lastResend || isNaN(new Date(lastResend).getTime())) {
        lastResend = istNow;
      } else {
        lastResend = new Date(lastResend);
      }

      const minutesSinceLastResend = Math.floor((istNow - lastResend) / (1000 * 60));
      if (minutesSinceLastResend >= 1440 && findrequest.resendNotificationCount === 2) {
        findrequest.resendNotificationCount = 0;
        findrequest.buttonValue = 1;
      } else if (minutesSinceLastResend < 1440 && findrequest.resendNotificationCount === 2) {
        findrequest.buttonValue = 0;
      } else {
        findrequest.buttonValue = 1;
      }

      await findrequest.save();
    }
    const customerVouchersWithParsedPullVouchers = getAllCustomerVouchers.map((voucher) => {
      const pullVouchers = voucher.PullVouchers ? JSON.parse(voucher.PullVouchers) : null;
      return {
        ...voucher.toJSON(),
        PullVouchers: pullVouchers,
      };
    });

    const response = responseHandler(
      statusMaker.found,
      "Fetch data successfully",
      customerVouchersWithParsedPullVouchers
    );
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const getRejectVoucherRequest = async (req, res) => {
  try {
    const { store } = req.query
    const website = await storeHandler(store)
    const getAllCustomerVouchers = await customerVoucher.findAll({ where: { status: 'Rejected', store: website }, order: [['updatedAt', 'DESC']] })
    if (checkEmptyArray(getAllCustomerVouchers)) {
      const response = responseHandler(statusMaker.success, apiMessages.notFound)
      return res.status(statusMaker.success).json(response)
    }
    const response = responseHandler(statusMaker.found, "Fetch data successfully", getAllCustomerVouchers)
    return res.status(statusMaker.found).json(response)
  } catch (error) {
    const response = errorHandler(`Something went wrong ${error.message}`)
    return res.status(statusMaker.internalError).json(response)
  }
}

const createMetafieldHelperFunction = async (customerId, metafieldsData) => {
  try {
    const metafields = [
      {
        namespace: "custom",
        key: "rclub_reward_points",
        value: metafieldsData.rclupoint.toString(),
        type: "single_line_text_field",
        ownerId: `gid://shopify/Customer/${customerId}`,
      },
      {
        namespace: "custom",
        key: "rajnigandha_reward_points",
        value: metafieldsData.rajnigandha_point.toString(),
        type: "single_line_text_field",
        ownerId: `gid://shopify/Customer/${customerId}`,
      },
    ];

    const data = JSON.stringify({
      query: `
        mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              key
              namespace
              value
              createdAt
              updatedAt
            }
            userErrors {
              field
              message
              code
            }
          }
        }
      `,
      variables: { metafields },
    });

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://lakmestaging.myshopify.com/admin/api/2024-07/graphql.json",
      headers: {
        "X-Shopify-Access-Token": config.shopify_token,
        "Content-Type": "application/json",
      },
      data,
    };
    const response = await axios.request(config);
    // console.log("Metafields created successfully:", response.data);
    return response.data;
  } catch (error) {
    // console.error("Error creating metafields:", error);
    throw new Error("Failed to create metafields", error.message);
  }
};

const generateTransactionId = (transactionCategory) => {
  const datePart = moment().format("YYYYMMDDHHmmss");
  const randomPart = Math.floor(Math.random() * 1_000_000_000)
    .toString()
    .padStart(10, "0");
  return `${transactionCategory}${datePart}${randomPart}`;
};

export const addVoucherRequest = async (req, res) => {
  try {
    const { customer_id, BrandProductCode, Denomination, Quantity, type, accountNumber, store } = req.body;
    const website = await storeHandler(store)
    if (!Quantity || Quantity < 1 || Quantity > 100) {
      const resp = errorHandler("Please enter the valid Quantity")
      return res.status(statusMaker.badRequest).json(resp);
    }
    else if (!type || (type !== 'Vouchagram')) {
      const resp = errorHandler("Please enter the valid Type of voucher")
      return res.status(statusMaker.badRequest).json(resp);
    }
    else if (type === 'Vouchagram' && !BrandProductCode || BrandProductCode === "") {
      const resp = errorHandler("Please enter the valid BrandProductCode")
      return res.status(statusMaker.badRequest).json(resp);
    }
    // else if (!Denomination || Denomination === "") {
    //   const resp = errorHandler("Please enter the valid Denomination")
    //   return res.status(statusMaker.badRequest).json(resp);
    // }
    const cstmr = await customer.findOne({
      where: { customer_id: customer_id, account_number: accountNumber }
    });

    if (!cstmr || cstmr == '' || cstmr == undefined) {
      const response = errorHandler("No data found")
      return res.status(statusMaker.notFound).json(response);
    }

    if (type !== 'Vouchagram' || type == '') {
      const rep = errorHandler("Invalid voucherType")
      return res.status(statusMaker.badRequest).json(rep)
    }

    let voucherBrandDetails = await voucherBrands.findOne({
      where: {
        BrandProductCode: BrandProductCode,
        store: website
      }
    });
    console.log("voucherbrands=details-------", voucherBrandDetails);
    const token = await getToken();

    const { data: brand } = await axios({
      method: "POST",
      url: `${process.env.VOUCHAGRAM_SERVER_URL}/getbrands`,
      data: { BrandProductCode },
      headers: {
        'token': token
      }
    });
    // console.log("dt------", brand);
    if (brand.status === 'error') {
      await VouchagramLog(`${process.env.VOUCHAGRAM_SERVER_URL}/getbrands`, { BrandProductCode }, brand.code, 'In pull Voucher Request-> ' + brand.desc);
      const resp = errorHandler("Error fetching brands")
      return res.status(statusMaker.notFound).json(resp)
    }
    let decodedBrand = decryption(brand.data);
    if (decodedBrand.length === 0) {
      const rep = errorHandler("No data found")
      return res.status(statusMaker.notFound).json(rep)
    }
    let body = {
      BrandProductCode,
      Denomination
    };
    const payload = encryption(body);
    // console.log("payload--------", payload);
    const { data } = await axios({
      method: "POST",
      url: `${process.env.VOUCHAGRAM_SERVER_URL}/getstock`,
      data: { payload },
      headers: {
        token: token
      }
    });
    // console.log("dat---------", data);
    if (data.status === 'error') {
      await VouchagramLog(`${process.env.VOUCHAGRAM_SERVER_URL}/getstock`, body, data.code, 'In Pull Voucher Request-> ' + data.desc);
      const resp = errorHandler("Error fetching stocks")
      return res.status(statusMaker.notFound).json(resp)
    }
    const decodedData = decryption(data.data);
    // console.log("decoded----", Number(decodedData.AvailableQuantity < Quantity));
    if (Number(decodedData.AvailableQuantity) < Quantity) {
      // console.log("------------->>>>>>>>>");
      const resp = errorHandler("Insuffcient Quantity of Voucher")
      return res.status(statusMaker.badRequest).json(resp);
    }

    let havePoints = Math.round(Number(Denomination) * Number(Quantity) * (1 / dv)) + Number(voucherBrandDetails.platformFees);
    // console.log("havepoints------", havePoints);
    // console.log("customer ----------", cstmr);
    if (Number(cstmr.balance_point) < havePoints) {
      const resp = errorHandler("You have not enough points for Redemption of Voucher...!")
      return res.status(statusMaker.badRequest).json(resp);
    }

    const totalDeductPoints = Number(cstmr.earned_point) - Number(cstmr.redeem_point) - Number(cstmr.expiry_point)
    const redeemPoint = Number(cstmr.redeem_point) + Number(havePoints)
    // console.log("redeempoint--", redeemPoint, totalDeductPoints);
    const currentVoucherRedeem = parseInt(cstmr.is_voucher_redeem || "0", 10);
    const updateVoucherRedeem = currentVoucherRedeem + 1;
    const updateTotalPoints = await customer.update(
      {
        balance_point: totalDeductPoints.toString(),
        redeem_point: redeemPoint.toString(),
        is_voucher_redeem:updateVoucherRedeem,
        updatedAt: DateTime()
      }, {
      where: {
        customer_id: customer_id,
        account_number: accountNumber,
        store: website
      }
    }
    );
    const orderId = generateId()
    // console.log("findcustomer---", await customer.findOne({ where: { customer_id: customer_id } }));
    if (updateTotalPoints[0] == 0) {
      const resp = errorHandler("Failed to update customer details")
      return res.status(statusMaker.internalError).json(resp)
    }
    // console.log("name----------", cstmr);
    const voucherObj = {
      customerId: customer_id,
      accountNumber,
      customerName: (cstmr.first_name && cstmr.last_name) ? cstmr.first_name + " " + cstmr.last_name : "Unknown Customer",
      // requiredPoints: havePoints,
      phone_number: cstmr.phone_number,
      email: cstmr.email,
      redeemPoints: havePoints,
      ExternalOrderId: orderId,
      brandImageUrl: type === 'Vouchagram' ? decodedBrand[0].BrandImage : voucherBrandDetails?.images.small_image,
      BrandName: type === 'Vouchagram' ? decodedBrand[0].BrandName : voucherBrandDetails.BrandName,
      BrandProductCode,
      Denomination: Number(Denomination),
      Quantity,
      status: 'Pending',
      voucherType: type,
      updateByStaff: 'superAdmin',
      createdIstAt: DateTime(),
      updatedIstAt: DateTime(),
      store: website
    };
    let tranCategory = 'voucher';
    let tranStatus = 'redeem';
    // console.log("-------", tranCategory)
    const transactionId = generateTransactionId(tranCategory);
    // console.log(transactionId,"transaction");
    const transactionData = {
      customer_Id: cstmr.customer_id,
      transition_id: transactionId,
      account_number: cstmr.account_number,
      transition_category: tranCategory,
      transition_status: tranStatus,
      medium: 'desktop',
      point: havePoints,
      expiry_date: "",
      order_id: orderId,
      product_detail: "",
      source_of_device: 'rajnigandha.com',
      store: website,
      name: cstmr.first_name,
      mobile_no: cstmr.phone_number,
      state: cstmr.State,
      city: cstmr.city,
      serial_no: '',
      coupon_code: '',
      scan_manual: ''
    };

    const pointData = {
      customer_Id: cstmr.customer_id,
      transition_id: transactionId,
      account_number: cstmr.account_number,
      point: havePoints,
      transition_status: tranStatus,
      transition_category: tranCategory,
      store: website,
      expiry_date: '',
      credit_after: '',
    };

    const addTransaction = await Promise.all([
      transition.create(transactionData),
      point.create(pointData),
    ]);
    // console.log("+++++++++++++",addTransaction)
    if (addTransaction) {
      const earnedPoint = parseInt(cstmr.earned_point, 10);
      const expiryPoint = parseInt(cstmr.expiry_point, 10);
      const redeemPoint = parseInt(cstmr.redeem_point, 10);
      const pointsToRedeem = parseInt(havePoints, 10);
      cstmr.redeem_point = (redeemPoint + pointsToRedeem).toString();
      await cstmr.save()
      cstmr.balance_point = (earnedPoint - expiryPoint - parseInt(cstmr.redeem_point, 10)).toString();
      await cstmr.save()
      // console.log("-----=+++++++++--", cstmr);
      let getCustomerVoucher = await customerVoucher.create(voucherObj);
      await createMetafieldHelperFunction(customer_id, {
        rclupoint: "0",
        rajnigandha_point: cstmr.balance_point
      });
      const resp = responseHandler(statusMaker.found, "Voucher request has been successful!", getCustomerVoucher)
      // console.log("customer------",cstmr); 
      const whatsappDetails = {
        first_name: cstmr.first_name,
        phone_number: cstmr.phone_number,
        redeemablePoints: havePoints,  
        redeemPoint: cstmr.redeem_point,  
        balancePoint: cstmr.balance_point,  
        email: cstmr.email
      }
      console.log("whatsApp details--", whatsappDetails);

      // console.log("whatsApp=-------",whatsappDetails,havePoints);

      await handleNotifications("reward-points-redeemed", website, whatsappDetails)
      await sendSMSvoucherredeemconfirmation({ phone_number: cstmr.phone_number }, website, 'voucher-redeem-confirmation')
      //  await sendWhatsappSMSbalanceupdate('reward-points-updated')
      await redeemCustomerPointsFun(customer_id, havePoints);
      //  console.log("dataResult",dataResult);
      return res.status(statusMaker.found).json(resp)
    } else {
      const resp = responseHandler(statusMaker.internalError, "Failed to update customer details", customer)
      return res.status(statusMaker.internalError).json(resp)
    }
  }

  catch (error) {
    // console.log("err-------", error);
    const response = errorHandler(`Something went wrong ${error.message}`)
    return res.status(statusMaker.internalError).json(response)
  }
}

export const filterPendingRequest = async (req, res) => {
  try {
    const { startDate, endDate, accountId, customerName, contact, store } = req.query;
    const website = await storeHandler(store)
    const filterConditions = {
      status: 'Pending',
      store: website
    }
    if (startDate && endDate) {
      const formatStDate = new Date(startDate);
      const formatEnDate = new Date(endDate);
      formatEnDate.setHours(23, 59, 59, 999)
      filterConditions.createdAt = {
        [Op.between]: [formatStDate, formatEnDate],
      };
    };
    // console.log(filterConditions);
    if (accountId) filterConditions.accountNumber = { [Op.like]: `%${accountId}%` };
    if (customerName) filterConditions.customerName = { [Op.like]: `%${customerName}%` };
    if (contact) filterConditions.contact = { [Op.like]: `%${contact}%` }
    const filterPR = await customerVoucher.findAll({ where: filterConditions, order: [['updatedAt', 'DESC']] })
    if (filterPR.length > 0) {
      const response = responseHandler(statusMaker.found, "Fetch data successfully", filterPR);
      return res.status(statusMaker.found).json(response);
    };
    const response = responseHandler(statusMaker.notFound, "No data found", []);
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    // console.error("Error: ", error);
    const response = errorHandler(`Something went wrong ${error.message}`);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const filterAcceptRequest = async (req, res) => {
  try {
    const { startDate, endDate, accountId, customerName, contact, store } = req.query;
    const website = await storeHandler(store)
    const filterConditions = {
      status: 'Completed',
      store: website
    }
    if (startDate && endDate) {
      const formatStDate = new Date(startDate);
      const formatEnDate = new Date(endDate);
      formatEnDate.setHours(23, 59, 59, 999)
      filterConditions.createdAt = {
        [Op.between]: [formatStDate, formatEnDate],
      };
    };
    if (accountId) filterConditions.accountNumber = { [Op.like]: `%${accountId}%` };
    if (customerName) filterConditions.customerName = { [Op.like]: `%${customerName}%` };
    if (contact) filterConditions.contact = { [Op.like]: `%${contact}%` }
    const filterPR = await customerVoucher.findAll({ where: filterConditions, order: [['updatedAt', 'DESC']] })
    if (filterPR.length > 0) {
      const response = responseHandler(statusMaker.found, "Fetch data successfully", filterPR);
      return res.status(statusMaker.found).json(response);
    };
    const response = responseHandler(statusMaker.notFound, "No data found", []);
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    // console.error("Error: ", error);
    const response = errorHandler(`Something went wrong ${error.message}`);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const filterRejectRequest = async (req, res) => {
  try {
    const { startDate, endDate, accountId, customerName, contact, store } = req.query;
    const website = await storeHandler(store)
    const filterConditions = {
      status: 'Rejected',
      store: website
    }
    if (startDate && endDate) {
      const formatStDate = new Date(startDate);
      const formatEnDate = new Date(endDate);
      formatEnDate.setHours(23, 59, 59, 999)
      filterConditions.createdAt = {
        [Op.between]: [formatStDate, formatEnDate],
      };
    };
    if (accountId) filterConditions.accountNumber = { [Op.like]: `%${accountId}%` };
    if (customerName) filterConditions.customerName = { [Op.like]: `%${customerName}%` };
    if (contact) filterConditions.contact = { [Op.like]: `%${contact}%` }
    const filterPR = await customerVoucher.findAll({ where: filterConditions, order: [['updatedAt', 'DESC']] })
    if (filterPR.length > 0) {
      const response = responseHandler(statusMaker.found, "Fetch data successfully", filterPR);
      return res.status(statusMaker.found).json(response);
    };
    const response = responseHandler(statusMaker.notFound, "No data found", []);
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    // console.error("Error: ", error);
    const response = errorHandler(`Something went wrong ${error.message}`);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const filterVoucherByCategory = async (req, res) => {
  try {
    const { category, store } = req.query
    const website = await storeHandler(store)
    if (!category) {
      const rep = responseHandler(statusMaker.badRequest, "Missing requird fields")
      return res.status(statusMaker.badRequest).json(rep)
    }
    const getVouchers = await voucherBrands.findAll({
      where: {
        category: {
          [Sequelize.Op.like]: `%${category}%`,
        },
        store: website
      }, order: [['Category', 'DESC']]
    });

    if (getVouchers.length === 0) {
      const rep = responseHandler(statusMaker.notFound, "No data found");
      return res.status(statusMaker.success).json(rep);
    }
    const rep = responseHandler(statusMaker.found, "Fetch data successfully", getVouchers);
    return res.status(statusMaker.found).json(rep);
  } catch (error) {
    const response = errorHandler(`Something went wrong ${error.message}`);
    return res.status(statusMaker.internalError).json(response);
  }
}

export const approvePullRequest = async (req, res) => {
  try {
    const { requestId, store } = req.body;
    const processedStore = await storeHandler(store)
    if (!requestId || requestId == "") {
      const response = responseHandler(statusMaker.badRequest, "Please Provide requestId");
      return res.status(statusMaker.badRequest).json(response);
    }
    const getRequest = await customerVoucher.findOne({
      where: {
        id: requestId,
        status: "Pending",
        store: processedStore
      }
    });
    console.log("request---------", getRequest);
    if (!getRequest) {
      const response = responseHandler(statusMaker.badRequest, "No data found");
      return res.status(statusMaker.badRequest).json(response);
    }
    let decodedData;
    //vouchagram
    if (getRequest.voucherType === 'Vouchagram') {
      const token = await getToken();
      const { data: brand } = await axios({
        method: 'post',
        url: `${process.env.VOUCHAGRAM_SERVER_URL}/getbrands`,
        data: { BrandProductCode: getRequest.BrandProductCode },
        headers: {
          'token': token
        }
      });
      console.log("Brand ::>>", brand);
      if (brand.status === 'error') {
        await VouchagramLog(`${process.env.VOUCHAGRAM_SERVER_URL}/getbrands`, { BrandProductCode: getRequest.BrandProductCode }, brand.code, 'In Approve Request -> ' + brand.desc);
        return res.status(403).json({
          error: true,
          message: brand.desc,
          code: brand.code
        });
      }
      const decodedBrand = decryption(brand.data);
      if (decodedBrand.length === 0) {
        const response = responseHandler(statusMaker.badRequest, "Brand Product Not Found.");
        return res.status(statusMaker.badRequest).json(response);
      }
      let stockBody = {
        BrandProductCode: getRequest.BrandProductCode,
        Denomination: getRequest.Denomination
      };
      const stockPayload = encryption(stockBody);
      const stockData = await axios({
        method: "POST",
        url: `${process.env.VOUCHAGRAM_SERVER_URL}/getstock`,
        data: { payload: stockPayload },
        headers: {
          token: token
        }
      });
      console.log("stockData--------", stockData);
      if (stockData.data.status === 'error') {
        await VouchagramLog(`${process.env.VOUCHAGRAM_SERVER_URL}/getstock`, stockBody, stockData.data.code, 'In Approve Pull Request -> ' + stockData.data.desc);
        return res.status(403).json({
          error: true,
          message: stockData.data.desc,
          code: stockData.data.code
        });
      }
      console.log("Data ::>>", data);
      const stockDecodedData = decryption(stockData.data.data);
      // console.log("stockDecodedData",stockDecodedData.AvailableQuantity,getRequest.Quantity);
      // console.log("get stock ::>>",stockDecodedData);
      if (Number(stockDecodedData.AvailableQuantity) < getRequest.Quantity) {
        const response = responseHandler(statusMaker.badRequest, "Insuffcient Quantity for Voucher");
        return res.status(statusMaker.success).json(response);
      }

      let body = {
        BrandProductCode: getRequest.BrandProductCode,
        Denomination: getRequest.Denomination,
        Quantity: getRequest.Quantity,
        ExternalOrderId: getRequest.ExternalOrderId
      };

      console.log("Body ::>>", body);
      const payload = encryption(body);
      const  {data}  = await axios({
        method: "POST",
        url: `${process.env.VOUCHAGRAM_SERVER_URL}/pullvoucher`,
        data: { payload },
        headers: {
          token: token
        }
      });
      console.log("dataresponse-------", data);
      if (data.status === 'error') {
        await VouchagramLog(`${process.env.VOUCHAGRAM_SERVER_URL}/pullvoucher`, body, data.code, 'In Approve Pull Request -> ' + data.desc);
        const response = responseHandler(statusMaker.badRequest,  data.desc, {
          error: true,
          message: data.desc,
          code: data.code
        });
        return res.status(statusMaker.internalError).json(response);
      }
      decodedData = decryption(data.data);
      console.log("decodddata-----", decodedData);
    }
    let endDateOfVouchers = decodedData?.PullVouchers[0].Vouchers[0].EndDate;
    console.log("enddateofvouchees----------", decodedData?.PullVouchers);
    const updateCustomerVoucher = await customerVoucher.update({
      PullVouchers: getRequest.voucherType === 'Vouchagram' ? JSON.stringify(decodedData?.PullVouchers) : 'other',
      status: "Completed",
      ErrorCode: decodedData?.ErrorCode,
      ErrorMessage: decodedData?.ErrorMessage,
      Message: getRequest.voucherType === 'Vouchagram' ? decodedData?.Message : 'null',
      ResultType: decodedData?.ResultType,
      endDateOfApprovedVouchers: endDateOfVouchers,
      updateByStaff: 'superAdmin',
      approvedDate: new Date(),
      approvedBy: 'superAdmin',
      updatedIstAt: DateTime()
    }, {
      where: {
        id: requestId,
        status: "Pending",
        store: processedStore
      }
    })
    const updatedCustomerVoucher = await customerVoucher.findOne({
      where: {
        id: requestId,
        status: "Completed",
        store: processedStore
      }
    });

    if (!updatedCustomerVoucher) {
      const rep = responseHandler(statusMaker.badRequest, "Failed to update customer details.");
      return res.status(statusMaker.badRequest).json(rep);
    }
    // Convert PullVouchers field to JSON
    let jsonVoucher;
    if (updatedCustomerVoucher.PullVouchers) {
      try {
        jsonVoucher = JSON.parse(updatedCustomerVoucher.PullVouchers);
      } catch (error) {
        return res.status(statusMaker.internalError).json({
          error: true,
          message: "Failed to parse PullVouchers data",
          details: error.message
        });
      }
    }
    const result = {
      ...updatedCustomerVoucher.dataValues,
      PullVouchers: jsonVoucher
    };
    // console.log("updatesellers",updateCustomerVoucher);
    const findCustomer = await customer.findOne({ where: { customer_id: getRequest.customerId } })
    if (updateCustomerVoucher[0] == 0) {
      const rep = responseHandler(statusMaker.badRequest, "No data found")
      return res.status(statusMaker.badRequest).json(rep)
    }

    // var contactNo;
    // if (findCustomer.phone_number.startsWith('+91')) {
    //   contactNo = findCustomer.phone_number.slice(3)
    // } else if (findCustomer.phone_number.startsWith('0')) {
    //   contactNo = findCustomer.phone_number.slice(1)
    // }
    // console.log("contactno--",findCustomer.phone_number);

    await sendSMSVouchcerRevised({
      first_name: findCustomer.first_name, brandName: updatedCustomerVoucher.BrandName,
      price: result?.Denomination, voucherValue: result?.PullVouchers[0]?.Vouchers[0]?.Value,
      rewardPoint: result?.Denomination, quantity: result.Quantity, denomination: result.Denomination,
      voucherCode: result?.PullVouchers[0]?.Vouchers[0]?.VoucherGCcode, voucherPin: result?.PullVouchers[0]?.Vouchers[0]?.Voucherpin,
      expiryDate: result?.PullVouchers[0]?.Vouchers[0]?.EndDate, phone_number: findCustomer.phone_number
    }, processedStore, 'vouchcer-revised')
    const whatsappDetails = {
      giftName: updatedCustomerVoucher.BrandName,
      courierPartner: 'Voucher',
      awbId: updatedCustomerVoucher.ExternalOrderId,
      createdIstAt: getRequest.approveDate

    }
    await handleNotifications('product-dispatched', processedStore, whatsappDetails)

    const rep = responseHandler(statusMaker.success, "Fetch data successfully", result);
    return res.status(statusMaker.success).json(rep)
  } catch (error) {
    const response = errorHandler(error.message);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const { requestId, message, store } = req.body
    const website = await storeHandler(store)
    if (!requestId || requestId == "") {
      const response = responseHandler(statusMaker.badRequest, "Please Provide requestId");
      return res.status(statusMaker.badRequest).json(response);
    }
    const getRequest = await customerVoucher.findOne({
      where: {
        id: requestId,
        status: "Pending",
        store: website
      },
      raw: true
    });
    // console.log("getRequest",getRequest);

    if (!getRequest) {
      const response = responseHandler(statusMaker.badRequest, "No data found");
      return res.status(statusMaker.badRequest).json(response);
    }

    const amountSellerHas = await customer.findOne({
      where: {
        customer_id: getRequest.customerId,
        store: website
      }
    })
    let amountWithRefund = Number(amountSellerHas.balance_point) + Number(getRequest.redeemPoints)
    const newRedeemPoint = Number(amountSellerHas.redeem_point) - Number(getRequest.redeemPoints)
    // console.log("points---------",amountWithRefund,amountSellerHas,getRequest.requiredPoints);
    const refundSellerAmount = await customer.update({
      balance_point: JSON.stringify(amountWithRefund),
      redeem_point: JSON.stringify(newRedeemPoint),
      updatedIstAt: DateTime()
    },
      {
        where: {
          customer_id: getRequest.customerId,
          account_number: getRequest.accountNumber,
          store: website
        }
      });

    if (refundSellerAmount[0] == 0) {
      const response = responseHandler(statusMaker.badRequest, "Failed to refund amount");
      return res.status(statusMaker.badRequest).json(response);
    }

    let tranCategory = 'voucher';
    let tranStatus = 'refund';
    // console.log("-------", tranCategory)
    const transactionId = generateTransactionId(tranCategory);
    // console.log(transactionId,"transaction");
    const transactionData = {
      customer_Id: getRequest.customerId,
      transition_id: transactionId,
      account_number: getRequest.accountNumber,
      transition_category: tranCategory,
      transition_status: tranStatus,
      medium: 'desktop',
      point: getRequest.redeemPoints,
      expiry_date: "",
      order_id: getRequest.ExternalOrderId,
      product_detail: "",
      source_of_device: 'rajnigandha.com',
      store: website,
      name: getRequest.customerName,
      mobile_no: getRequest.phone_number,
      state: getRequest.State,
      city: getRequest.city,
      serial_no: '',
      coupon_code: '',
      scan_manual: ''
    };

    const pointData = {
      customer_Id: getRequest.customerId,
      transition_id: transactionId,
      account_number: getRequest.accountNumber,
      point: getRequest.redeemPoints,
      transition_status: tranStatus,
      transition_category: tranCategory,
      store: website,
      expiry_date: '',
      credit_after: '',
    };

    const addTransaction = await Promise.all([
      transition.create(transactionData),
      point.create(pointData),
    ]);
    if (addTransaction) {
      const updateStatusOfRequest = await customerVoucher.update({
        status: "Rejected",
        Message: message ? message : "Due to technical reasons your request could not proceed further. Your points has been added back to your account.",
        updateByStaff: 'superAdmin',
        rejectDate: new Date().toLocaleString("en-US", {
          timeZone: "Asia/Kolkata",
        }),
        rejectedBy: 'superAdmin',
        updatedIstAt: DateTime()
      }, {
        where: {
          id: requestId,
          status: "Pending",
          store: website
        }
      })

      if (updateStatusOfRequest[0] == 0) {
        const response = responseHandler(statusMaker.badRequest, "Failed to Reject the request");
        return res.status(statusMaker.badRequest).json(response);
      }
      const updatedRecord = await customerVoucher.findOne({
        where: {
          id: requestId, status: "Rejected",
          store: website
        },
      });
      const fullRejectDate = updatedRecord.rejectDate; 
const dateOnly = fullRejectDate.toISOString().split('T')[0];
console.log("--",dateOnly);

      // refundofRewardPoints(getRequest.contactNo, getRequest.sellerName, getRequest.requiredPoints, getRequest.ExternalOrderId, getRequest.createdIstAt.split(' ')[0]);
      await sendSMSRefundofRewardPoints({
        phone_number: amountSellerHas.phone_number, first_name: amountSellerHas.first_name,
        rewardPoints: getRequest.redeemPoints, orderId: getRequest.ExternalOrderId, rejectDate: dateOnly
      }, website, 'refund-of-rewardpoints')
      // await sent_reject_voucher_request_whatsapp(getRequest.contactNo, getRequest.BrandName, getRequest.ExternalOrderId, getRequest.Denomination , getRequest.requiredPoints);
      const rep = responseHandler(statusMaker.success, "Request has been rejected successfully and refund transfered done.")
      return res.status(statusMaker.success).json(rep)
    }
    else {
      const rep = responseHandler(statusMaker.success, "Transaction not created")
      return res.status(statusMaker.success).json(rep)
    }
  } catch (error) {
    const response = errorHandler(error.message)
    return res.status(statusMaker.internalError).json(response);
  }
};

export const filtercustomerVoucherDetails = async (req, res) => {
  try {
    const { customerId, accountId, startDate, endDate, store } = req.query;
    const website = await storeHandler(store)
    if (!customerId || !accountId) {
      const rep = responseHandler(statusMaker.badRequest, "Please provide customerId or accountId");
      return res.status(statusMaker.badRequest).json(rep);
    };
    const find_customer = await customer.findOne({
      where: { customer_id: customerId, account_number: accountId, store: website }
    })
    // console.log(find_customer);
    if (!find_customer) {
      const rep = responseHandler(statusMaker.notFound, apiMessages.notFound);
      return res.status(statusMaker.notFound).json(rep);
    }
    // console.log("findcustomer----------", find_customer);
    const whereCondition = {
      status: {
        [Op.or]: ['Pending', 'Completed', 'Rejected']
      },
      accountNumber: accountId,
      customerId: customerId,
      store: website
    };
    // console.log("endDate---", endDate);
    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999);
    if (startDate && endDate) {
      whereCondition.createdAt = {
        [Op.between]: [start, end]
      };
    };
    // console.log(start, end);
    // console.log("whereCondition", whereCondition);
    const getAllVouchers = await customerVoucher.findAll({
      where: whereCondition, order: [['createdAt', 'DESC']]
    })
    // console.log("getvochers--------", getAllVouchers);
    if (getAllVouchers && getAllVouchers.length > 0) {
      const vouchersWithCustomerDetails = await Promise.all(
        getAllVouchers.map(async (voucher) => {
          const customerDetails = await customer.findOne({
            where: { customer_id: voucher.customerId, account_number: voucher.accountNumber, store: website },
            attributes: ['phone_number', 'email']
          });
          return {
            ...voucher.toJSON(), // Convert Sequelize object to plain JSON
            customerDetails
          };
        })
      );
      const rep = responseHandler(statusMaker.found, "Fetch data successfully", vouchersWithCustomerDetails);
      return res.status(statusMaker.found).json(rep);
    };
    const rep = responseHandler(statusMaker.success, "No data found", getAllVouchers);
    return res.status(statusMaker.success).json(rep)
  } catch (error) {
    const response = errorHandler(`Something went wrong ${error.message}`);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const filterVoucherAccordingToPrice = async (req, res) => {
  try {
    const { minPoints, maxPoints, sortBy, search, price, store } = req.query;
    const processedStore = await storeHandler(store);
    let filterParams = { store: processedStore };
    filterParams.DenominationList = { [Op.ne]: null };
    // Filter by minPoints and maxPoints
    if (minPoints && maxPoints) {
      filterParams.DenominationList = {
        [Op.and]: [
          Sequelize.literal(`CONVERT(INT, LEFT(DenominationList, CHARINDEX(',', DenominationList + ',') - 1)) >= ${minPoints}`),
          Sequelize.literal(`CONVERT(INT, LEFT(DenominationList, CHARINDEX(',', DenominationList + ',') - 1)) <= ${maxPoints}`),
        ],
      };
    }

    // Filter by price
    if (price) {
      const priceArray = price.split(',').map((item) => item.trim());
      filterParams[Op.or] = priceArray.map((p) =>
        Sequelize.literal(`CONVERT(INT, LEFT(DenominationList, CHARINDEX(',', DenominationList + ',') - 1)) = ${p}`)
      );
    }

    // Search filter for BrandName
    if (search && search.trim()) {
      filterParams.BrandName = { [Op.like]: `%${search.trim()}%` };
    }

    // Sorting by first value of DenominationList
    const order =
      sortBy === 'high_to_low'
        ? [
          Sequelize.literal(
            'CONVERT(INT, LEFT(DenominationList, CHARINDEX(\',\', DenominationList + \',\') - 1)) DESC'
          ),
        ]
        : [
          Sequelize.literal(
            'CONVERT(INT, LEFT(DenominationList, CHARINDEX(\',\', DenominationList + \',\') - 1)) ASC'
          ),
        ];

    // Fetch vouchers
    const filteredVouchers = await voucherBrands.findAll({
      where: filterParams,
      order,
    });

    if (!filteredVouchers || filteredVouchers.length === 0) {
      const rep = responseHandler(statusMaker.success,"No data found")
      return res.status(statusMaker.notFound).json(rep);
    }

    const response = responseHandler(
      statusMaker.found,
      "Fetch data successfully",
      filteredVouchers
    );
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    const response = errorHandler(error.message);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const redeemCustomerPointsFun = async (customerId, redeemPoints) => {
  try {
    if (!customerId || !redeemPoints || redeemPoints <= 0) {
      return { message: "Invalid customer ID or redeem points." };
    }

    const customerData = await customer.findOne({ where: { customer_Id: customerId } });

    if (!customerData) {
      return { message: "No data found." };
    }

    const currentRedeemablePoints = parseInt(customerData.balance_point || "0", 10);

    if (currentRedeemablePoints < redeemPoints) {
      return { message: "Insufficient redeemable points." };
    }

    // Fetch eligible transitions for the customer
    const transitions = await transition.findAll({
      where: {
        customer_Id: customerId,
        transition_status: "credit",
        point: { [Op.gt]: 0 },
      },
      order: [["createdAt", "ASC"]],
    });

    if (!transitions || transitions.length === 0) {
      return {
        message: "No points available for redemption.",
        remainingPoints: redeemPoints,
      };
    }

    let pointsToRedeem = redeemPoints;
    const updatedTransitions = [];

    // Helper function to update a transition
    const updateTransition = async (entry, pointUsed, remainingPoints) => {
      await entry.update({
        point_used: remainingPoints > 0 ? "partial_used" : "full_used",
        point_remaing_used: remainingPoints.toString(),
      });

      updatedTransitions.push({
        id: entry.id,
        point_used: remainingPoints > 0 ? "partial_used" : "full_used",
        point_remaing_used: remainingPoints.toString(),
      });
    };

    // Process transitions
    for (const entry of transitions) {
      if (entry.point_used === "full_used") continue; // Skip fully used transitions

      const availablePoints =
        entry.point_used === "partial_used"
          ? parseInt(entry.point_remaing_used, 10) || 0
          : parseInt(entry.point, 10) || 0;

      if (pointsToRedeem <= 0) break;

      if (pointsToRedeem >= availablePoints) {
        pointsToRedeem -= availablePoints;
        await updateTransition(entry, availablePoints, 0);
      } else {
        const remainingPoints = availablePoints - pointsToRedeem;
        pointsToRedeem = 0;
        await updateTransition(entry, availablePoints, remainingPoints);
      }
    }

    // Update customer data
    // const updatedRedeemPoint = parseInt(customerData.redeem_point || "0", 10) + redeemPoints;

    // await customer.update(
    //   {
    //     balance_point: updatedBalancePoint.toString(),
    //     redeem_point: updatedRedeemPoint.toString(),
    //   },
    //   { where: { customer_Id: customerId } }
    // );

    return {
      message:
        pointsToRedeem > 0
          ? "Not enough points to fully redeem."
          : "Points redeemed successfully.",
      redeemedPoints: redeemPoints - pointsToRedeem,
      remainingPointsToRedeem: pointsToRedeem,
      updatedTransitions,
    };
  } catch (error) {
    // console.error("Error redeeming points:", error);
    return {
      message: "An error occurred while redeeming points.",
      error: error.message,
    };
  }
};

export const getApproveRequestById = async (req, res) => {
  try {
    const { id, store } = req.query
    const processedStore = await storeHandler(store)
    if (!id) {
      const rep = responseHandler(statusMaker.badRequest, "Missing Id")
      return res.status(statusMaker.badRequest).json(rep)
    }
    const findrequest = await customerVoucher.findOne({ where: { id, store: processedStore, status: 'Completed' } })
    if (!findrequest) {
      const rep = responseHandler(statusMaker.notFound, "No data found")
      return res.status(statusMaker.success).json(rep)
    }
    const customerVouchersWithDetails = {
      ...findrequest.toJSON(),
      PullVouchers: findrequest.PullVouchers ? JSON.parse(findrequest.PullVouchers) : null,
    };
    const rep = responseHandler(statusMaker.found,"Fetch data successfully", customerVouchersWithDetails)
    return res.status(statusMaker.found).json(rep)
  } catch (error) {
    const rep = errorHandler(`Something went wrong ${error.message}`)
    return res.status(statusMaker.internalError).json(rep)
  }
}

export const resendVoucher = async (req, res) => {
  try {
    const { requestId, store } = req.query;
    const processedStore = await storeHandler(store);
    if (!requestId) {
      const resp = await responseHandler(statusMaker.badRequest, "Missing required fields");
      return res.status(statusMaker.badRequest).json(resp);
    }
    const getRequest = await customerVoucher.findOne({ where: { id: requestId, status: 'Completed' } });
    if (!getRequest) {
      const resp = await responseHandler(statusMaker.notFound, apiMessages.notFound);
      return res.status(statusMaker.notFound).json(resp);
    }

    const findCustomer = await customer.findOne({ where: { customer_id: getRequest.customerId, account_number: getRequest.accountNumber } });
    if (!findCustomer) {
      const resp = await responseHandler(statusMaker.notFound, "No data found");
      return res.status(statusMaker.notFound).json(resp);
    }

    const pullVouchers = JSON.parse(getRequest.PullVouchers);
    const istNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    // console.log("line1798-------", istNow);
    let lastResend = getRequest.lastNotificationsent
    if (!lastResend || isNaN(new Date(lastResend).getTime())) {
      console.log("Invalid lastResend, resetting to current time.");
      lastResend = istNow;
    } else {
      lastResend = new Date(lastResend);
    }
    // console.log("line1798-------", lastResend);
    const minutesSinceLastResend = Math.floor((istNow - lastResend) / (1000 * 60));
    // console.log("Minutes Since Last Resend:", minutesSinceLastResend);
    if (minutesSinceLastResend >= 1440) {
      getRequest.resendNotificationCount = 0;
      getRequest.save()
    }
    if (getRequest.resendNotificationCount < 2) {
      getRequest.lastNotificationsent = istNow;
      getRequest.resendNotificationCount += 1;
      try {
        await getRequest.save();
        await sendSMSVouchcerRevised({
          first_name: findCustomer.first_name,
          brandName: getRequest.BrandName,
          price: getRequest.Denomination,
          voucherValue: pullVouchers[0]?.Vouchers[0]?.Value,
          rewardPoint: getRequest?.Denomination,
          quantity: getRequest.Quantity,
          denomination: getRequest.Denomination,
          voucherCode: pullVouchers[0]?.Vouchers[0]?.VoucherGCcode,
          voucherPin: pullVouchers[0]?.Vouchers[0]?.Voucherpin,
          expiryDate: pullVouchers[0]?.Vouchers[0]?.EndDate,
          phone_number: findCustomer.phone_number
        }, processedStore, 'vouchcer-revised');
        console.log("getrequest data -----", getRequest);

        const rep = responseHandler(statusMaker.success, "Resend successfully");
        return res.status(statusMaker.success).json(rep);
      } catch (err) {
        console.error("Sequelize Save Error:", err.message);
        const query = `
          UPDATE customerVouchers
          SET lastNotificationsent = '${istNow.toISOString()}', 
              resendNotificationCount = ${getRequest.resendNotificationCount}
          WHERE id = ${getRequest.id}`;
        await sequelize.query(query);
      }
      console.log("getrequest--", getRequest);

      await sendSMSVouchcerRevised({
        first_name: findCustomer.first_name,
        brandName: getRequest.BrandName,
        price: getRequest.Denomination,
        voucherValue: pullVouchers[0]?.Vouchers[0]?.Value,
        rewardPoint: getRequest?.Denomination,
        quantity: getRequest.Quantity,
        denomination: getRequest.Denomination,
        voucherCode: pullVouchers[0]?.Vouchers[0]?.VoucherGCcode,
        voucherPin: pullVouchers[0]?.Vouchers[0]?.Voucherpin,
        expiryDate: pullVouchers[0]?.Vouchers[0]?.EndDate,
        phone_number: findCustomer.phone_number
      }, processedStore, 'vouchcer-revised');
      // const mailOptions = {
      //   from: `rewards@rajnigandha.com`,
      //   to: getRequest.email,
      //   subject: 'Rajnigandha.com - Product Dispatched',
      //   text: `We have dispatched ${getRequest.BrandName} items via ${'Voucher'} (Courier Consignment No. ${getRequest.ExternalOrderId}) dated ${getRequest.approvedDate}.
      //         If you do not receive the courier within 7 days, please call us at 0120-4032446/445/4032200.    `,
      // };
      // const sendMail =
      // const send = await transporter.sendMail(mailOptions);
      // console.log("send email-----", send.response);

      const rep = responseHandler(statusMaker.success, "Resend successfully", getRequest);
      return res.status(statusMaker.success).json(rep);
    }
    else {
      const rep = responseHandler(statusMaker.badRequest, "You can't resend more than 2 times");
      return res.status(statusMaker.badRequest).json(rep);
    }
  } catch (error) {
    console.error("Error in resendVoucher:", error.message);
    const rep = errorHandler(error.message);
    return res.status(statusMaker.internalError).json(rep);
  }
};

export const disableResendButton = async (req, res) => {
  try {
    const { id, store } = req.query
    const processedStore = await storeHandler(store)
    if (!id) {
      const rep = responseHandler(statusMaker.badRequest, "Missing Id")
      return res.status(statusMaker.badRequest).json(rep)
    }
    const findrequest = await customerVoucher.findOne({ where: { id, store: processedStore, status: 'Completed' } })
    if (!findrequest) {
      const rep = responseHandler(statusMaker.notFound, apiMessages.notFound)
      return res.status(statusMaker.success).json(rep)
    }
    const istNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    // console.log("line1798-------", istNow);
    let lastResend = findrequest.lastNotificationsent
    if (!lastResend || isNaN(new Date(lastResend).getTime())) {
      console.log("Invalid lastResend, resetting to current time.");
      lastResend = istNow;
    } else {
      lastResend = new Date(lastResend);
    }
    // console.log("line1798-------", lastResend);
    const minutesSinceLastResend = Math.floor((istNow - lastResend) / (1000 * 60));
    // console.log("Minutes Since Last Resend:", minutesSinceLastResend);
    if (minutesSinceLastResend >= 1440 && findrequest.resendNotificationCount == 2) {
      findrequest.resendNotificationCount = 0;
      findrequest.buttonValue = 1
      findrequest.save()
    }
    else if (minutesSinceLastResend < 1440 && findrequest.resendNotificationCount == 2) {
      findrequest.buttonValue = 0
      findrequest.save()
    }
    else {
      findrequest.buttonValue = 1
      findrequest.save()
    }
    if (findrequest.resendNotificationCount == 2) {
      const rep = responseHandler(statusMaker.found, "You can resend only 2 times", findrequest)
      return res.status(statusMaker.found).json(rep)
    }
    else {
      const rep = responseHandler(statusMaker.found, "Fetch data successfully", findrequest)
      return res.status(statusMaker.found).json(rep)
    }

  } catch (error) {
    const rep = errorHandler(error.message)
    return res.status(statusMaker.internalError).json(rep)
  }
}

export const searchPendingVoucherRequest = async (req, res) => {
  try {
    const { search, store } = req.query
    const processedStore = await storeHandler(store)
    if (!search) {
      const rep = responseHandler(statusMaker.badRequest, "Please enter search key")
      return res.status(statusMaker.badRequest).json(rep)
    }
    const searchdata = await customerVoucher.findAll({
      where: {
        store: processedStore, status: 'Pending',
        [Op.or]: [
          { phone_number: { [Op.like]: `%${search}%` } },
          { accountNumber: { [Op.like]: `%${search}%` } },
        ]
      }
    })

    if (!searchdata) {
      const rep = responseHandler(statusMaker.notFound, "No data found")
      return res.status(statusMaker.success).json(rep)
    }
    const rep = responseHandler(statusMaker.found, 'Fetch data successfully', searchdata)
    return res.status(statusMaker.found).json(rep)
  } catch (error) {
    const rep = errorHandler(`Something went wrong ${error.message}`)
    return res.status(statusMaker.internalError).json(rep)
  }
}

export const searchApproveVoucherRequest = async (req, res) => {
  try {
    const { search, store } = req.query
    const processedStore = await storeHandler(store)
    if (!search) {
      const rep = responseHandler(statusMaker.badRequest, "Please enter search key")
      return res.status(statusMaker.badRequest).json(rep)
    }
    const searchdata = await customerVoucher.findAll({
      where: {
        store: processedStore, status: 'Completed',
        [Op.or]: [
          { phone_number: { [Op.like]: `%${search}%` } },
          { accountNumber: { [Op.like]: `%${search}%` } },
        ]
      }
    })

    if (!searchdata) {
      const rep = responseHandler(statusMaker.success, "No data found")
      return res.status(statusMaker.success).json(rep)
    }
    const rep = responseHandler(statusMaker.found, "Fetch data successfully", searchdata)
    return res.status(statusMaker.found).json(rep)
  } catch (error) {
    const rep = errorHandler(`Something went wrong ${error.message}`)
    return res.status(statusMaker.internalError).json(rep)
  }
}

export const searchRejectVoucherRequest = async (req, res) => {
  try {
    const { search, store } = req.query
    const processedStore = await storeHandler(store)
    if (!search) {
      const rep = responseHandler(statusMaker.badRequest, "Please enter search key")
      return res.status(statusMaker.badRequest).json(rep)
    }
    const searchdata = await customerVoucher.findAll({
      where: {
        store: processedStore, status: 'Rejected',
        [Op.or]: [
          { phone_number: { [Op.like]: `%${search}%` } },
          { accountNumber: { [Op.like]: `%${search}%` } },
        ]
      }
    })

    if (!searchdata) {
      const rep = responseHandler(statusMaker.success, "No data found")
      return res.status(statusMaker.success).json(rep)
    }
    const rep = responseHandler(statusMaker.found, "Fetch data successfully", searchdata)
    return res.status(statusMaker.found).json(rep)
  } catch (error) {
    const rep = errorHandler(error.message)
    return res.status(statusMaker.internalError).json(rep)
  }
}

export const testingEmail = async (req, res) => {
  try {
    const { customer_id } = req.body
    const findCustomer = await customer.findOne({ where: { customer_id: customer_id } })
    console.log("findCustomer------", findCustomer);

    const whatsappDetails = {
      first_name: findCustomer.first_name,
      phone_number: "+919818912632",
      usedPoints: 250,
      balance_point: 500,
      email: findCustomer.email,
      points: 500,
      balancePoint: 600,
      newTier: 'blue',
      rewardPoints: 700,
      expireDate: '30/12/20230',
      priceValue: '3000',
      newRewardPoints: 900,
      benefitLink: 'https://google.com',
      benefit: "khs snb ysdg",
      redeemNow: "Now",
      giftName:"jhug",

      // handleNotifications
    }
    const result = await handleNotifications('rewards-program-expiring', 'rajnigandha', whatsappDetails)
    const rep = responseHandler(statusMaker.success, apiMessages.found, result)
    return res.status(statusMaker.success).json(rep)
  } catch (error) {
    const rep = errorHandler(error.message)
    return res.status(statusMaker.internalError).json(rep)
  }
}
