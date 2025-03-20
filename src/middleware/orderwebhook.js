// export const updateRegistrationorderDetailsGet = async (req, res, next) => {
//   // console.log("line 3",req.body)
//   console.log("line 4", req.body?.contact_email);
//   console.log("line 5", req.body?.email);
//   console.log("line 6", req.body?.customer.email);
//   console.log("line 7", req.body?.billing_address?.phone);
//   console.log("line 8", req.body?.shipping_address?.phone);
//   console.log("line 9", req.body?.customer?.phone);
//   console.log("line 10", req.body?.total_price);

//   const emailFind =
//     req.body?.contact_email ||
//     req.body?.email ||
//     req.body?.customer.email ||
//     "email not found";
//   console.log("line 13", emailFind);
//   const phoneFind =
//     req.body?.billing_address?.phone ||
//     req.body?.shipping_address?.phone ||
//     req.body?.customer?.phone ||
//     "phone not found";
//   console.log("line 15", phoneFind);
//   const totalPrice = req.body?.total_price;
//   console.log("line 17", totalPrice);



// };
