import { config, delhiveryPickupLocation, DateTime, giftShipment,
    shiprocket, shiprocketPickupLocation
} from "./index";
import axios from 'axios'
import jwt from 'jsonwebtoken'

const checkTokenExpiry = (token) => {
    try {
        const decoded = jwt.decode(token)
        if (!decoded || !decoded.exp) {
            throw new Error('Invalid token')
        }

        const currentTime = Math.floor(Date.now() / 1000)
        if (decoded.exp < currentTime) {
            return false
        } else {
            return true
        }
    } catch (error) {
        console.log('Error checking token expiration:', error.message);
        return false
    }
};

export const availabilityPincode = async (pincode) => {
    if (!pincode) {
        throw new Error('Pincode is required!');
    }
    const delhiveryResponse = await delhiveryServiceAbiltiy(pincode);
    const delhiveryData = delhiveryResponse?.delivery_codes;
    // console.log("delhiverydata--",delhiveryData[0]);
    if (delhiveryData) {
        // console.log("------");
        const isServiceable = delhiveryData[0].postal_code.cod === 'Y' || delhiveryData[0].postal_code.pre_paid === 'Y';
        if (isServiceable) {
            return {courierPartner: 'DELHIVERY',pincode,serviceDetails: delhiveryData}
        }
    }
    throw new Error('No courier service available at this pincode!');
};

export const delhiveryServiceAbiltiy = async (pincode) => {
    const url = `${config.delivery_base_url}/c/api/pin-codes/json`;
    const token = config.delivery_token, filterCode = pincode;
    const response = await axios.get(url, {
        params: {
            token: token,
            filter_codes: filterCode
        }
    });
    // console.log('Response Data:', response.data);
    return response.data;
}

export const shipRocketServiceAbiltiy = async(pincode)=>{
    try {
        const url = `${config.shiproket_base_url}/courier/serviceability/?pickup_postcode=${shiprocketPickupLocation.pin}&delivery_postcode=${pincode}&weight=5&cod=1`;
        const token = await getShipRocketToken();
        // console.log(token, "token getShipRocketToken")

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const response = await axios.get(url, { headers });
        // console.log('Response Data:', response.data);
        return { 
             error: false, 
             message: "Pincode serviciabilty found successfully", 
             data: response.data,
            };
    } catch (error) {
        console.log(error.message, "shipRocketServiceAbiltiy error")
        throw error;
    }
}

const getShipRocketToken = async () => {
    try {
        const shiprocketToken = await shiprocket.findOne();
        let valid_token = shiprocketToken?.token;
        if (!shiprocketToken) {
            const response = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
                email: process.env.SHIPROCKET_EMAIL,
                password: process.env.SHIPROCKET_PASSWORD,
            });
            await shiprocket.create({
                token: response.data.token,
            });

            valid_token = response.data.token;
        } else {
            if (checkTokenExpiry(shiprocketToken.token)) {
                const response = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
                    email: process.env.SHIPROCKET_EMAIL,
                    password: process.env.SHIPROCKET_PASSWORD,
                });
                await shiprocketToken.update({
                    token: response.data.token,
                });
                valid_token = response.data.token;
            }
        }
        return valid_token;
    } catch (error) {
        console.error('Error fetching token:', error.message);
        throw error;
    }
};

export const createGiftShipmentInDelhivery = async (orderData) => {
    try {
        const url = `${config.delivery_base_url}/api/cmu/create.json`;
        const token = config.delivery_token;
        const accessToken = `Token ${token}`;
        const pickupLocation = delhiveryPickupLocation;
        const shipmentData = {
            data: {
                pickup_location: {
                    add: pickupLocation.address,
                    country: pickupLocation.country,
                    pin: pickupLocation.pin,
                    phone: pickupLocation.phone,
                    city: pickupLocation.city,
                    name: pickupLocation.name,
                    state: pickupLocation.state,
                },
                shipments: [
                    {
                        country: orderData.customerCountry,
                        city: orderData.customerCity,
                        cod_amount: orderData.codAmount,
                        pin: orderData.customerPincode,
                        state: orderData.customerState,
                        order: orderData.orderId,
                        add: orderData.customerAddress,
                        payment_mode: orderData.payment_mode,
                        quantity: orderData.quantity,
                        phone: orderData.customerContactNo,
                        total_amount: orderData.amount,
                        name: orderData.customerName,
                        return_add: pickupLocation.address,
                        return_country: pickupLocation.country,
                        return_city: pickupLocation.city,
                        return_state: pickupLocation.state,
                        return_pin: pickupLocation.pin,
                        return_phone: pickupLocation.phone,
                    },
                ],
            },
        };
        // console.log("==============", shipmentData);

        const data = `format=json&data=${JSON.stringify(shipmentData.data)}`;
        const conf = {
            method: "post",
            maxBodyLength: Infinity,
            url: url,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: accessToken,
            },
            data: data,
        };
        // console.log("conf-------", conf);

        const response = await axios.request(conf);
        // console.log("response--", response.data);
        if (response.data.success === false) {
            const errorMessage = response.data?.packages?.length
                ? response.data.packages[0].remarks.join(" ")
                : response.data?.rmk;
            throw new Error(errorMessage);
        }
        const newShipment = await giftShipment.create(
            {
                orderId: orderData.orderId,
                awbId: response.data.packages[0].waybill,
                shipmentData: JSON.stringify(shipmentData.data),
                shipmentResponse: JSON.stringify(response.data),
                customerAddress: orderData.customerAddress,
                customerPincode: orderData.customerPincode,
                customerCity: orderData.customerCity,
                customerState: orderData.customerState,
                customerCountry: orderData.customerCountry,
                quantity: orderData.quantity,
                amount: orderData.amount,
                shipmentStatus: 'Pending',
                payment_mode: orderData.payment_mode,
                courierPartner: "DELHIVERY",
                updateByStaff: 'superAdmin',
                createdIstAt: DateTime(),
                updatedIstAt:DateTime(),
            }
        );
        // console.log("newshipmet------",newShipment);
        
        return newShipment;
    } catch (error) {
        console.error("Gift Shipment Error: ", error);
        throw error;
    }
};

export const createGiftShipmentInShipRocket = async (orderData) => {
    try {
        const url = `${config.shiproket_base_url}/orders/create/adhoc`;
        const token = await getShipRocketToken();
        const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
        const pickupLocation = shiprocketPickupLocation;
        const data = {
            order_id: orderData.orderId,
            order_date: DateTime(),
            pickup_location: pickupLocation.address,
            channel_id: "",
            comment: "",
            billing_customer_name: orderData.customerName,
            billing_last_name: "",
            billing_address: orderData.customerAddress,
            billing_address_2: "",
            billing_city: orderData.customerCity,
            billing_pincode: orderData.customerPincode,
            billing_state: orderData.customerState,
            billing_country: orderData.customerCountry,
            billing_email: "",
            billing_phone: orderData.customerContactNo,
            shipping_is_billing: true,
            order_items: [
                {
                    name: "test",
                    sku: "test",
                    units: 1,
                    selling_price: "9",
                    discount: "",
                    tax: "",
                    hsn: 441122,
                },
            ],
            payment_method: "Prepaid",
            shipping_charges: 0,
            giftwrap_charges: 0,
            transaction_charges: 0,
            total_discount: 0,
            sub_total: orderData.amount,
            length: 8,
            breadth: 6,
            height: 10,
            weight: 1.5,
        };

        const response = await axios.post(url, data, { headers });
        if (response?.data?.status_code === 400) {
            throw new Error(response?.data?.message);
        }
        if (response?.data?.status_code === 422) {
            throw new Error(response?.data?.message);
        }
        // console.log("response---------",response);
        
        const shipment = await giftShipment.create(
            {
                orderId: response.data.channel_order_id,
                awbId: response.data.awb_code,
                order_channel_id: response.data.order_id,
                shipmentData: JSON.stringify(data),
                shipmentResponse: JSON.stringify(response.data),
                trackResponse: null,
                customerAddress: orderData.customerAddress,
                customerPincode: orderData.customerPincode,
                customerCity: orderData.customerCity,
                customerState: orderData.customerState,
                customerCountry: orderData.customerCountry,
                quantity: orderData.quantity,
                amount: orderData.amount,
                shipmentStatus: 'Pending',
                payment_mode: orderData.payment_mode,
                paymentId: null,
                transactionId: orderData.transactionId,
                courierPartner: 'SHIPROCKET',
                createdIstAt: DateTime(),
                updatedIstAt: DateTime(),
                store: orderData.store
            }
        );
        return shipment;
    } catch (error) {
        console.error("Error creating shipment in Shiprocket:", error);
        throw error;
    }
};


// export const createShipmentInDelhivery = async (orderData) => {
//     try {
//         const url = `${config.delivery_base_url}/api/cmu/create.json`;
//         const token = config.delivery_token;
//         const accessToken = `Token ${token}`;
//         const pickupLocation = delhiveryPickupLocation; // Ensure this config is properly set

//         const shipmentData = {
//             pickup_location: {
//                 add: pickupLocation.address,
//                 country: pickupLocation.country,
//                 pin: pickupLocation.pin,
//                 phone: pickupLocation.phone,
//                 city: pickupLocation.city,
//                 name: pickupLocation.name,
//                 state: pickupLocation.state,
//             },
//             shipments: [
//                 {
//                     country: orderData.customerCountry,
//                     city: orderData.customerCity,
//                     cod_amount: orderData.codAmount,
//                     return_phone: pickupLocation.phone,
//                     pin: orderData.customerPincode,
//                     // state: orderData.customerState,
//                     return_name: pickupLocation.name,
//                     order: orderData.orderId,
//                     add: orderData.customerAddress,
//                     payment_mode: orderData.payment_mode,
//                     quantity: orderData.quantity,
//                     return_add: pickupLocation.address,
//                     phone: orderData.customerContactNo,
//                     total_amount: orderData.amount,
//                     name: orderData.customerName,
//                     return_country: pickupLocation.country,
//                     return_city: pickupLocation.city,
//                     return_state: pickupLocation.state,
//                     return_pin: pickupLocation.pin,
//                 },
//             ],
//         };

//         const data = `format=json&data=${JSON.stringify(shipmentData)}`;

//         const config = {
//             method: "post",
//             maxBodyLength: Infinity,
//             url,
//             headers: {
//                 "Content-Type": "application/x-www-form-urlencoded",
//                 Authorization: accessToken,
//             },
//             data,
//         };

//         const response = await axios.request(config);
//         console.log("response of shipping-----", response);

//         if (!response.data.success) {
//             const errorMessage = response.data?.packages.length
//                 ? response.data?.packages[0].remarks.join(" ")
//                 : response.data?.rmk;
//             throw new Error(errorMessage);
//         }

//         // Prepare data for shipment record creation
//         const shipmentRecord = {
//             orderId: orderData.orderId,
//             awbId: response.data.packages[0].waybill,
//             shipmentData: shipmentData,
//             shipmentResponse: response.data,
//             trackResponse: null,
//             customerAddress: orderData.customerAddress,
//             customerPincode: orderData.customerPincode,
//             customerCity: orderData.customerCity,
//             // customerState: orderData.customerState,
//             customerCountry: orderData.customerCountry,
//             quantity: orderData.quantity,
//             amount: orderData.amount,
//             shipmentStatus: null,
//             payment_mode: orderData.payment_mode,
//             paymentId: null,
//             transactionId: orderData.transactionId,
//             courierPartner: "DELHIVERY",
//             createdIstAt: DateTime.now().toISO(),
//             updatedIstAt: DateTime.now().toISO(),
//         };

//         const newShipment = await shipment.create(shipmentRecord);
//         return newShipment;
//     } catch (error) {
//         console.error("Shipment order error:", error.message);
//         throw error;
//     }
// };

// export const createShippmentInShipRocket = async (orderData) => {
//     try {
//         const url = `${config.shiproket_base_url}/orders/create/adhoc`;
//         const token = await getShipRocketToken();
//         const headers = {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//         };
        
//         const pickupLocation = shiprocketPickupLocation;
//         const data = {
//             "order_id": orderData.orderId,
//             "order_date": DateTime(),
//             "pickup_location": pickupLocation.address,
//             "channel_id": "",
//             "comment": "",
//             "billing_customer_name": orderData.customerName,
//             "billing_last_name": "",
//             "billing_address": orderData.customerAddress,
//             "billing_address_2": "",
//             "billing_city": orderData.customerCity,
//             "billing_pincode": orderData.customerPincode,
//             "billing_state": orderData.customerState,
//             "billing_country": orderData.customerCountry,
//             "billing_email": "",
//             "billing_phone": orderData.customerContactNo,
//             "shipping_is_billing": true,
//             "shipping_customer_name": "",
//             "shipping_last_name": "",
//             "shipping_address": "",
//             "shipping_address_2": "",
//             "shipping_city": "",
//             "shipping_pincode": "",
//             "shipping_country": "",
//             "shipping_state": "",
//             "shipping_email": "",
//             "shipping_phone": "",
//             "order_items": [
//               {
//                 "name": "test",
//                 "sku": "test",
//                 "units": 1,
//                 "selling_price": "9",
//                 "discount": "",
//                 "tax": "",
//                 "hsn": 441122
//               }
//             ],
//             "payment_method": "Prepaid",
//             "shipping_charges": 0,
//             "giftwrap_charges": 0,
//             "transaction_charges": 0,
//             "total_discount": 0,
//             "sub_total": orderData.amount,
//             "length": 8,
//             "breadth": 6,
//             "height": 10,
//             "weight": 1.5
//         };

//         const response = await axios.post(url, data, { headers });
//         if(response?.data?.status_code === 400) {
//             throw new Error(response?.data?.message)
//         }
//         if(response?.data?.status_code === 422) {
//             throw new Error(response?.data?.message)
//         }
//         const replacements = {
//             orderId:response.data.channel_order_id, 
//             awbId:response.data.awb_code, 
//             order_channel_id:response.data.order_id, 
//             shipmentData:JSON.stringify(data), 
//             shipmentResponse:JSON.stringify(response.data), 
//             trackResponse:null, 
//             customerAddress:orderData.customerAddress, 
//             customerPincode:orderData.customerPincode, 
//             customerCity:orderData.customerCity, 
//             // sellerState:orderData.sellerState, 
//             customerCountry:orderData.customerCountry, 
//             quantity:orderData.quantity, 
//             amount:orderData.amount, 
//             shipmentStatus:null, 
//             payment_mode:orderData?.payment_mode, 
//             paymentId:null, 
//             transactionId:orderData?.transactionId, 
//             courierPartner:'SHIPROCKET', 
//             createdIstAt:DateTime(), 
//             updatedIstAt:DateTime()
//         };
//         const newShipment = await shipment.create(replacements);
//         return newShipment;
//     } catch (error) {
//         console.log("create shipment error in shiprocket ::>> ",error.message);
//         throw error;
//     }
// }

