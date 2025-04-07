import {  statusMaker, apiMessages, responseHandler,config } from "./index";
import axios from 'axios'



export const registerCustomerForLakme = async (req, res) => {
    try {
        const {
            phone_number,
            email,
            first_name,
            last_name,
            address1,
            address2,
            zip,
            city,
            province,
            country,
            otp
        } = req.body;

        const access_token = config.accessToken
        try {
            console.log("tru--", access_token);

            const shopifySearch = await axios({
                url: `https://lakmestaging.myshopify.com/admin/api/2024-10/customers/search.json?query=phone:${phone_number}`,
                method: "GET",
                headers: { "X-Shopify-Access-Token": access_token },
            });

            const shopifyCustomer = shopifySearch.data.customers.length ? shopifySearch.data.customers[0] : null;
            console.log("shopifySearch.data.customers.length", shopifySearch.data.customers);
            if (otp != "852358") {
                return res.status(statusMaker.badRequest).json(responseHandler(statusMaker.badRequest, apiMessages.invalidRequest))
            }
            if (!shopifyCustomer) {
                console.log("true-----------", access_token);
    
                const shopifyResponse = await axios({
                    url: `https://lakmestaging.myshopify.com/admin/api/2024-10/customers.json`,
                    method: "POST",
                    headers: {
                        "X-Shopify-Access-Token": access_token,
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    data: {
                        customer: {
                            first_name,
                            last_name,
                            email,
                            phone: phone_number,
                            addresses: [
                                {
                                    address1,
                                    address2,
                                    zip,
                                    city,
                                    country,
                                    province,
                                    country_code: country,
                                    phone: phone_number,
                                }
                            ]
                        }
                    },
                });
    
    
                const shopifyCustomerData = shopifyResponse.data.customer;
                if(shopifyCustomerData){
                    return res.status(statusMaker.success).json(responseHandler(statusMaker.created, "Customer registered successfully"));
                }else{
                    return res.status(statusMaker.internalError).json(responseHandler(statusMaker.internalError, "Error registering customer"));
                }
            }else{
            return res.status(statusMaker.success).json(responseHandler(statusMaker.success, "Customer already registered"));
            }
        } catch (err) {
            console.error("Error searching customer in Shopify:", err.message);

        }
    } 
    catch (error) {
        console.error("Error:", error.message);
        return res.status(statusMaker.internalError).json(responseHandler(statusMaker.internalError, apiMessages.errorOccurred, error.message));
    }
};


export const loginCustomerForLakme = async (req, res) => {
    try {
        const { phone_number, otp } = req.body
        const access_token = config.accessToken

        try {
            console.log("tru--", access_token);

            const shopifySearch = await axios({
                url: `https://lakmestaging.myshopify.com/admin/api/2024-10/customers/search.json?query=phone:${phone_number}`,
                method: "GET",
                headers: { "X-Shopify-Access-Token": access_token },
            });

            const shopifyCustomer = shopifySearch.data.customers.length ? shopifySearch.data.customers[0] : null;
            console.log("shopifySearch.data.customers.length", shopifyCustomer);

            if (otp != "852358") {
                return res.status(statusMaker.badRequest).json(responseHandler(statusMaker.badRequest, apiMessages.invalidRequest))
            }
            return res.status(statusMaker.success).json(responseHandler(statusMaker.success, apiMessages.login,shopifyCustomer))
        } catch (err) {
            console.error("Error searching customer in Shopify:", err.message);
        }
    } catch (error) {
        return res.status(statusMaker.internalError).json(responseHandler(statusMaker.internalError, apiMessages.errorOccurred, error.message))
    }
}

export const getAllProducts = async(req,res) => {
    try {
        const access_token = config.accessToken
        const query = `
        {
            products(first: 250, query:"status:active") {
                edges {
                    node {
                        id
                        title
                        handle
                        publishedAt
                        bodyHtml
                        tags
                        variants(first: 1) {
                            edges {
                                node {
                                    id
                                    sku
                                    price
                                    inventoryQuantity
                                }
                            }
                        }
                        metafields(first: 100) {
                            edges {
                                node {
                                    namespace
                                    key
                                    value
                                }
                            }
                        }
                        images(first: 5) {
                            edges {
                                node {
                                    src
                                }
                            }
                        }
                        collections(first: 5) {
                            edges {
                                node {
                                    title
                                }
                            }
                        }
                    }
                }
            }
        }
    `;
   const response = await axios({
            url: `https://lakmestaging.myshopify.com/admin/api/2024-10/graphql.json`,
            method: 'POST',
            headers:{
                 "X-Shopify-Access-Token": access_token,
        "Content-Type": "application/json"
            },
            data: JSON.stringify({ query }),
        });

        if (!response.data || !response.data.data || !response.data.data.products) {
            const resp = responseHandler(statusMaker.internalError, apiMessages.notFound, [])
            return res.status(statusMaker.internalError).json(resp)
        }
        return res.status(statusMaker.success).json(responseHandler(statusMaker.success, apiMessages.found,response.data.data.products.edges))
    } catch (error) {
        console.log("err--",error);
        
        return res.status(statusMaker.internalError).json(responseHandler(statusMaker.internalError, apiMessages.errorOccurred, error.message))
    }
}