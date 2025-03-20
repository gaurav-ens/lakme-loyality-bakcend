import { response } from "express";
import { customer, transition, registration, RuleSetModified,config } from "./index";
import axios from "axios";

import moment from "moment";
import { Op } from "sequelize"; // Ensure Sequelize Op is imported

export const list = async (req, res) => {
  try {
    res.json({
      message: "hello rclub",
    });
  } catch (error) {
    res.send("error", error);
  }
};
const generateTransitionId = (transitionCategory) => {
  const datePart = moment().format("YYYYMMDDHHmmss");
  const randomPart = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(10, "0");
  return `${transitionCategory}${datePart}${randomPart}`;
};

const generateUniqueAccountNumber = () => {
  const randomNum = Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit random number
  return `RC${randomNum}`;
};

export const registerCustomerRclub = async (req, res) => {
  try {
    const {
      auth_customer,
      name,
      mobile,
      email,
      pincode,
      address,
      city,
      state,
      country,
      distrtict,
      // customer_id,
    } = req.body;

    if (!auth_customer) {
      return res.status(400).json({ message: "Unauthorized customer." });
    }

    // Validate required fields
    let errors = [];

    if (!name) errors.push("Name is required");
    if (!mobile) errors.push("Mobile number is required");
    if (!email) errors.push("Email is required");
    if (!pincode) errors.push("Pincode is required");
    if (!address) errors.push("Address is required");
    if (!city) errors.push("City is required");
    if (!state) errors.push("State is required");

    if (errors.length > 0) {
      return res.status(400).json({
        status: false,
        errors: errors,
      });
    }

    // console.log("Customer ID:", customer_id);
    // const customerIdString = customer_id;

    // Check if the customer already exists
    const formattedMobile = mobile.startsWith("+91") ? mobile : `+91${mobile}`;

    const existingCustomer = await customer.findOne({
      where: { phone_number: formattedMobile },
    });

    if (existingCustomer) {
      return res.status(400).json({
        message: "Customer already exists",
      });
    }

    // Retrieve registration data
    const registrationData = await registration.findOne({ where: { id: 1 } });
    if (!registrationData) {
      return res.status(404).json({ message: "Registration data not found" });
    }

    const points = parseInt(registrationData.point, 10) || 0;
    console.log("points", points);

    const creditAfter = parseInt(registrationData.credit_after, 10) || 0;
    console.log("creditAfter", creditAfter);

    const creditDays =
      creditAfter === 0
        ? moment().format("DD-MM-YYYY")
        : moment().add(creditAfter, "days").format("DD-MM-YYYY");

    console.log("creditDays:", creditDays);

    const expiryDate = registrationData.expiry_date || null;
    console.log("expiryDate", expiryDate);

    const expiry_notes = registrationData.remarks || null;

    const todayDate = moment().format("YYYY-MM-DD");
    const todayTime = moment().format("HH:mm:ss");

    // Determine transition status
    let transition_status = "hold";
    if (points === 0 || creditAfter > 0) {
      transition_status = "hold";
    } else {
      transition_status = "credit";
    }

    const account_number = generateUniqueAccountNumber();

    // Create new customer with balance 0 if points are on hold or 0
    const newCustomer = await customer.create({
      account_number: account_number,
      customer_id: "",
      phone_number: `+91${mobile}`,
      email,
      first_name: name,
      last_name: "",
      date_of_birth: "",
      address1: address,
      address2: address,
      city,
      country,
      zip: pincode,
      earned_point: 0, // Default 0 until credited
      redeem_point: 0,
      expiry_point: 0,
      balance_point: 0, // Default 0 unless transition is credit
      membership_tier: "welcome",
      membership_status: "active",
      registration_date: todayDate,
      registration_time: todayTime,
      gender: "",
      maritial_status: "",
      marriage_anniversary: "",
      State: state,
      Distrtict: distrtict,
      source_of_device: "website",
      store: "rclub",
      is_product_redeem: "",
      is_voucher_redeem: "",
    });

    // Update customer points ONLY if transition_status is 'credit'
    if (transition_status === "credit") {
      await customer.update(
        {
          earned_point: points,
          redeem_point: 0,
          expiry_point: 0,
          balance_point: points,
        },
        { where: { phone_number: mobile } }
      );
    }

    const transitionCategory = "register";
    const transitionId = generateTransitionId(transitionCategory);

    // Create transaction record
    const transitionData = {
      customer_Id: "",
      transition_id: transitionId,
      account_number: account_number,
      transition_category: "register",
      transition_status,
      medium: "desktop",
      point: points,
      expiry_date: expiryDate,
      credit_days: creditAfter,
      store: "rclub",
      note: expiry_notes,
      name,
      source_of_device: "website",
      mobile_no: `+91${mobile}`,
      state,
      city,
    };

    await transition.create(transitionData);

    return res.status(200).json({
      status: true,
      data: {
        rclub_id: newCustomer.account_number,
        cust_id: newCustomer.account_number,
        name,
        email,
        mobile: `+91${mobile}`,
        pincode,
        city,
        state,
        balance: transition_status === "credit" ? points : 0,
        member_type: "welcome",
        "card_colorcode": "#6a2d82",
        "font_color": " #ffffff",
        "card_image": "https://loyaltyd2cuat.rajnigandha.com/static/media/welcome.82034071be0affdafe02.png",
        is_cust: "new",
        earn_points: {
          points: transition_status === "credit" ? points : 0,
          credit_date: creditDays,
          expire_date: expiryDate,
        },
      },
    });
  } catch (error) {
    console.error("Error during customer registration:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const redeemCustomerPointsFun = async (customerId, redeemPoints) => {
  try {
    console.log("customerId", customerId);
    console.log("redeemPoints", redeemPoints);

    if (!customerId || !redeemPoints || redeemPoints <= 0) {
      return { message: "Invalid customer ID or redeem points." };
    }

    const customerData = await customer.findOne({
      where: { account_number: customerId },
    });

    console.log("customerData", customerData);

    if (!customerData) {
      return { message: "Customer not found." };
    }

    const currentRedeemablePoints = parseInt(
      customerData.balance_point || "0",
      10
    );

    if (currentRedeemablePoints < redeemPoints) {
      return { message: "Insufficient redeemable points." };
    }

    // Fetch eligible transitions for the customer
    const transitions = await transition.findAll({
      where: {
        account_number: customerId,
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
    const updatedRedeemPoint =
      parseInt(customerData.redeem_point || "0", 10) + redeemPoints;
    const updatedBalancePoint = currentRedeemablePoints - redeemPoints;

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
    console.error("Error redeeming points:", error);
    return {
      message: "An error occurred while redeeming points.",
      error: error.message,
    };
  }
};

function parseJSONField(field) {
  if (typeof field === "string") {
    try {
      return JSON.parse(field);
    } catch (error) {
      console.warn("Error parsing JSON field:", error);
      return field;
    }
  }
  return field;
}

export const getActiveRules = async () => {
  try {
    const ruleSets = await RuleSetModified.findAll({
      where: { store: "rajnigandha" },
    });

    const activeRules = {};
    ruleSets.forEach((ruleSet) => {
      const ruleTypes = [
        "point_conversion_online_purchase",
        "point_conversion_based_on_sku",
        "point_conversion_based_on_category",
        "bonus_point",
        "coupon",
        "twox_reward_online",
        "twox_reward_offline",
        "campaign",
        "registration",
      ];

      ruleTypes.forEach((ruleType) => {
        const ruleData = parseJSONField(ruleSet[ruleType]);
        if (
          ruleData &&
          ruleData.status === "active" &&
          Array.isArray(ruleData.value)
        ) {
          activeRules[ruleType] = ruleData.value;
        }
      });
    });
    return activeRules;
  } catch (error) {
    console.error("Error fetching active rules:", error.message);
    throw new Error("Error fetching active rules");
  }
};

export const rewardPoint = async (req, res) => {
  try {
    const { get_reward_point, order_value, cust_id, order_id } = req.body;

    let errors = [];

    if (!get_reward_point || get_reward_point === "false")
      errors.push("get_reward_point is false");
    if (!order_value) errors.push("Order Value is required");
    if (!cust_id) errors.push("Customer Id is required");
    if (!order_id) errors.push("Order Id is required");

    if (errors.length > 0) {
      return res.status(400).json({
        status: false,
        errors: errors,
      });
    }

    // Check if order already exists
    const existingOrder = await transition.findOne({ where: { order_id } });
    if (existingOrder) {
      return res.json({
        message: "Order ID already exists. No processing required.",
      });
    }

    // Retrieve customer data
    const customerData = await customer.findOne({
      where: { account_number: cust_id },
    });
    if (!customerData) {
      return res
        .status(404)
        .json({ status: false, message: "Customer not found" });
    }

    // Retrieve active rules
    const activeRules = await getActiveRules();
    let ruleSet = activeRules.point_conversion_online_purchase;
    if (!ruleSet || ruleSet.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No active rules found for online purchases",
      });
    }

    // Extract relevant rule
    ruleSet = ruleSet[0];
    const purchaseValue = parseFloat(ruleSet.purchaseValue) || 1;
    const pointsToAdd = Math.round(
      (parseFloat(order_value) / purchaseValue) *
        (parseFloat(ruleSet.points) || 0)
    );

    // Determine point expiry
    let expiryDate = null;
    if (ruleSet.expiresAfter && ruleSet.expiresType) {
      expiryDate = moment()
        .add(parseInt(ruleSet.expiresAfter, 10), ruleSet.expiresType)
        .format("DD-MM-YYYY");
    } else if (ruleSet.expiresOn) {
      expiryDate = moment(ruleSet.expiresOn).format("DD-MM-YYYY");
    }

    // Credit days logic
    const creditAfterDays = parseInt(ruleSet.credit_after_days, 10) || 0;
    const creditDays =
      creditAfterDays === 0
        ? moment().format("DD-MM-YYYY")
        : moment().add(creditAfterDays, "days").format("DD-MM-YYYY");

    // Determine transition status
    const transition_status = creditAfterDays === 0 ? "credit" : "hold";

    // Get previous balance before updating
    const previousBalance = parseInt(customerData.balance_point, 10) || 0;
    let currentBalance = previousBalance; // Default: No change

    // Update customer points ONLY IF transition_status is 'credit'
    if (transition_status === "credit") {
      const updatedEarnedPoints =
        (parseInt(customerData.earned_point, 10) || 0) + pointsToAdd;
      currentBalance =
        updatedEarnedPoints -
        (parseInt(customerData.redeem_point, 10) || 0) -
        (parseInt(customerData.expiry_point, 10) || 0);

      await customerData.update({
        earned_point: updatedEarnedPoints,
        balance_point: currentBalance,
      });
    }

    // Create transaction entry
    const transitionCategory = "Buy";
    const transitionId = generateTransitionId(transitionCategory);

    await transition.create({
      customer_Id: "",
      transition_id: `reward_point${order_id}`,
      account_number: customerData.account_number,
      transition_category: transitionCategory,
      transition_status,
      medium: "desktop",
      point: pointsToAdd,
      expiry_date: expiryDate,
      credit_days: creditAfterDays,
      store: "rclub",
      name: customerData.first_name,
      mobile_no: customerData.phone_number,
      state: customerData.State,
      city: customerData.city,
      order_id,
    });

    return res.status(200).json({
      status: true,
      data: {
        rlcub_id: customerData.account_number,
        previous_balance: previousBalance, // Old balance before update
        current_balance: currentBalance, // Updated only if credited
        earn_points: {
          points: pointsToAdd,
          credit_date: creditDays,
          expire_date: expiryDate,
        },
      },
    });
  } catch (error) {
    console.error("Error processing order points:", error);
    return res
      .status(500)
      .json({ status: false, message: "An error occurred.", error });
  }
};

export const redeemPoint = async (req, res) => {
  try {
    const { redeem_reward_points, cust_id, order_id, points } = req.body;

    // Validation checks
    let errors = [];
    if (!redeem_reward_points || redeem_reward_points === "false")
      errors.push("redeem_reward_points is false or empty");
    if (!order_id) errors.push("Order Id is required");
    if (!points || parseInt(points, 10) <= 0)
      errors.push("Points must be greater than zero.");

    if (errors.length > 0) {
      return res.status(400).json({ status: false, errors });
    }

    // Retrieve customer data
    const customerData = await customer.findOne({
      where: { account_number: cust_id },
    });
    if (!customerData) {
      return res
        .status(404)
        .json({ status: false, message: "Customer not found" });
    }

    // Get current balance
    const currentBalance = parseInt(customerData.balance_point, 10) || 0;
    const redeemPoints = parseInt(points, 10);

    // Check if customer has enough points
    if (redeemPoints > currentBalance) {
      return res.status(400).json({
        status: false,
        message: "Insufficient points for redemption.",
      });
    }

    // Create redemption transaction
    await transition.create({
      customer_Id: "",
      transition_id: `reward_point${order_id}`,
      account_number: customerData.account_number,
      transition_category: "redeem_point",
      transition_status: "redeem",
      medium: "desktop",
      point: redeemPoints,
      expiry_date: null,
      credit_days: 0,
      store: "rclub",
      name: customerData.first_name,
      mobile_no: customerData.phone_number,
      state: customerData.State,
      city: customerData.city,
      order_id,
    });

    // Calculate updated points
    const oldEarnedPoint = parseInt(customerData.earned_point || "0", 10);
    const oldRedeemPoint = parseInt(customerData.redeem_point || "0", 10);
    const oldExpiryPoint = parseInt(customerData.expiry_point || "0", 10);
    const updatedRedeemPoint = oldRedeemPoint + redeemPoints;
    const updatedBalancePoint =
      oldEarnedPoint - updatedRedeemPoint - oldExpiryPoint;

    // Update customer points
    await customerData.update({
      earned_point: oldEarnedPoint,
      redeem_point: updatedRedeemPoint,
      expiry_point: oldExpiryPoint,
      balance_point: updatedBalancePoint,
    });

    await redeemCustomerPointsFun(cust_id, points);

    return res.status(200).json({
      status: true,
      rlcub_id: customerData.account_number,
      success: "Redeem points successfully.",
    });
  } catch (error) {
    console.error("Error processing redemption:", error);
    return res
      .status(500)
      .json({ status: false, message: "An error occurred.", error });
  }
};

const calculateBalancePoints = (earnedPoints, redeemPoints, expiryPoints) => {
  return earnedPoints - redeemPoints - expiryPoints;
};

export const refundPoint = async (req, res) => {
  try {
    const { refund_reward_points, cust_id, points } = req.body;

    // Validate request data
    let errors = [];
    if (!cust_id) errors.push("Customer ID is required");
    if (!points || isNaN(parseInt(points, 10)) || parseInt(points, 10) <= 0) {
      errors.push("Points must be a number greater than zero.");
    }

    if (errors.length > 0) {
      return res.status(400).json({ status: false, errors });
    }

    // Fetch customer data
    const customerData = await customer.findOne({ where: { account_number: cust_id } });

    if (!customerData) {
      return res.status(404).json({ status: false, message: "Customer not found." });
    }

    // Extract customer details
    const {
      customer_id,
      account_number,
      name,
      mobile_no,
      state,
      city,
      earned_point,
      redeem_point,
      expiry_point,
    } = customerData;

    // Parse numeric values safely
    const parseNum = (val) => parseInt(val || "0", 10);
    const pointsToAdd = parseNum(points);
    const oldEarnedPoint = parseNum(earned_point);
    const oldRedeemPoint = parseNum(redeem_point);
    const oldExpiryPoint = parseNum(expiry_point);

    // Calculate updated points
    const updatedEarnedPoint = oldEarnedPoint + pointsToAdd;
    const updatedBalancePoint = updatedEarnedPoint - oldRedeemPoint - oldExpiryPoint;

    // Update customer points
    await customer.update(
      {
        earned_point: updatedEarnedPoint.toString(),
        balance_point: updatedBalancePoint.toString(),
      },
      { where: { customer_id } }
    );

    // Create transaction record
    await transition.create({
      customer_Id: customer_id,
      transition_id: `refund_${cust_id}_${Date.now()}`, // Unique transaction ID
      transition_status: "refund",
      account_number,
      transition_category: "refund",
      medium: "desktop",
      point: pointsToAdd,
      expiry_date: calculateExpiryDate(18), // 18 months from today
      order_id: "", // Default "N/A" if missing
      product_detail: "",
      store: "rclub",
      name,
      mobile_no,
      state,
      city,
      serial_no: "",
      coupon_code: "",
      scan_manual: "",
    });

    return res.status(200).json({
      status: true,
      message: "Points successfully refunded.",
      rlcub_id: account_number,
      // balance: updatedBalancePoint, // Return updated balance
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    return res.status(500).json({ status: false, message: "An error occurred.", error });
  }
};

// Utility function to calculate expiry date in DD-MM-YY format
const calculateExpiryDate = (months) => {
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + months);

  const day = String(expiry.getDate()).padStart(2, "0");
  const month = String(expiry.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const year = String(expiry.getFullYear()).slice(-2); // Get last two digits of the year

  return `${day}-${month}-${year}`;
};





export const reverseRewardPoint = async (req, res) => {
  try {
    const { reverse_reward_point, cust_id, order_id, points } = req.body;
    let errors = [];
    if (!reverse_reward_point || reverse_reward_point === "false")
      errors.push("reverse_reward_point is false or empty");
    if (!order_id) errors.push("Order Id is required");
    if (!cust_id) errors.push("Customer Id is required");
    if (!points || parseInt(points, 10) <= 0)
      errors.push("Points must be greater than zero.");

    if (errors.length > 0) {
      return res.status(400).json({ status: false, errors });
    }

    const transitionData = await transition.findOne({
      where: { account_number: cust_id, order_id },
    });

    if (!transitionData) {
      return res.status(404).json({
        status: false,
        message: "Order ID not found for the given Customer ID.",
      });
    }

    const {
      transition_status,
      customer_Id,
      account_number,
      transition_category,
      medium,
      point,
      expiry_date,
      product_detail,
      store,
      name,
      mobile_no,
      state,
      city,
      serial_no,
      coupon_code,
      scan_manual,
    } = transitionData;

    if (transition_status === "hold") {
      console.log(
        "Transition is 'hold'. Updating to 'cancel_hold' and creating a new 'order_cancel' transition."
      );

      await transitionData.update({ transition_status: "cancel_hold" });

      await transition.create({
        customer_Id,
        transition_id: generateTransitionId("order_cancel"),
        transition_status: "debit",
        account_number,
        transition_category,
        medium,
        point,
        expiry_date,
        order_id,
        product_detail,
        store,
        name,
        mobile_no,
        state,
        city,
        serial_no,
        coupon_code,
        scan_manual,
      });
    } else if (transition_status === "credit") {
      const customerData = await customer.findOne({
        where: { account_number: account_number },
      });

      if (!customerData) {
        console.log(`Customer with ID ${customer_Id} not found.`);
        return res.status(404).json({
          status: false,
          message: `Customer with ID ${customer_Id} not found.`,
        });
      }

      const oldBalancePoints = parseInt(customerData.balance_point, 10) || 0;
      const pointsToDeduct = parseInt(point, 10) || 0;
      const updatedEarnedPoints =
        (parseInt(customerData.earned_point, 10) || 0) - pointsToDeduct;
      const updatedBalancePoints = oldBalancePoints - pointsToDeduct;

      await customer.update(
        {
          balance_point: updatedBalancePoints.toString(),
          earned_point: updatedEarnedPoints.toString(),
        },
        { where: { account_number: account_number } }
      );

      console.log("Customer points updated due to refund.");

      await transition.create({
        customer_Id,
        transition_id: generateTransitionId("order_cancel"),
        transition_status: "debit",
        account_number,
        transition_category,
        medium,
        point,
        expiry_date,
        order_id,
        product_detail,
        store,
        name,
        mobile_no,
        state,
        city,
        serial_no,
        coupon_code,
        scan_manual,
      });
    }

    return res.status(200).json({
      status: true,
      success: "Points successfully reversed.",
      rlcub_id: transitionData.account_number,
      data: {
        points: parseInt(points, 10),
        order_id: order_id,
      },
    });
  } catch (error) {
    console.error("Error processing reward reversal:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred.",
      error,
    });
  }
};

export const checkBalance = async (req, res) => {
  try {
    const { check_balance, cust_id } = req.body;
    let errors = []; 
    if (!check_balance || check_balance === "false")
      errors.push("check_balance is false or empty");
    if (!cust_id) errors.push("Customer Id is required");
  
    if (errors.length > 0) {
      return res.status(400).json({
        status: false,
        errors: errors,
      });
    }

 

    const customerData = await customer.findOne({
      where: { account_number: cust_id },
    });

    if (!customerData) {
      return res.status(404).json({
        status: false,
        message: "Customer not found.",
      });
    }
    const balance = customerData.balance_point || "0";
    return res.status(200).json({
      status: true,
      rlcub_id: customerData.account_number,
      data: {
        balance: balance.toString(),
      },
    });
  } catch (error) {
    console.error("Error fetching customer balance:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred.",
      error,
    });
  }
};

export const pointAccountSummary = async (req, res) => {
  try {
    const { point_account_summary, cust_id } = req.body;

    let errors = []; 
    if (!point_account_summary || point_account_summary === "false")
      errors.push("point_account_summary is false or empty");
    if (!cust_id) errors.push("Customer Id is required");
  

    if (errors.length > 0) {
      return res.status(400).json({
        status: false,
        errors: errors,
      });
    }

    const customerData = await customer.findOne({
      where: { account_number: cust_id },
    });

    if (!customerData) {
      return res.status(404).json({
        status: false,
        message: "Customer not found.",
      });
    }

    const accountBalance = parseInt(customerData.balance_point, 10) || 0;

    const creditTransitions = await transition.findAll({
      where: { account_number: cust_id, transition_status: "credit" },
      attributes: ["point", "expiry_date"],
    });

    const today = moment().startOf("day");
    const sevenDaysLater = moment().add(7, "days").endOf("day");

    let upcomingExpire = 0;

    creditTransitions.forEach((record) => {
      if (record.expiry_date) {
        const expiryDate = moment(record.expiry_date, "DD-MM-YYYY");

        if (expiryDate.isBetween(today, sevenDaysLater, null, "[]")) {
          upcomingExpire += parseInt(record.point, 10) || 0;
        }
      }
    });

    const pointWorth = accountBalance * 0.2;

    const upcomingCreditData = await transition.findAll({
      where: {
        account_number: cust_id,
        transition_status: "hold",
      },
      attributes: ["point"],
    });

    const upcomingCredit = upcomingCreditData.reduce(
      (total, transition) => total + (parseInt(transition.point, 10) || 0),
      0
    );

    return res.status(200).json({
      status: true,
      rlcub_id: customerData.account_number,
      data: {
        account_balance: accountBalance,
        upcoming_expire: upcomingExpire,
        point_worth: pointWorth,
        upcoming_credit: upcomingCredit,
      },
    });
  } catch (error) {
    console.error("Error fetching point account summary:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred.",
      error,
    });
  }
};

export const pointTransactionDetails = async (req, res) => {
  try {
    const {
      cust_id,
      filter_type = "all",
      from_date,
      to_date,
      page_no = 1,
      limit = 20,
    } = req.body;

    if (!cust_id) {
      return res.status(400).json({
        status: false,
        errors: ["Customer Id is required"],
      });
    }

    const maxLimit = Math.min(parseInt(limit, 10) || 20, 500);
    const offset = (parseInt(page_no, 10) - 1) * maxLimit;

    let whereCondition = { account_number: cust_id };

    if (from_date && to_date) {
      const formattedFromDate = moment(from_date, "DD-MM-YYYY")
        .startOf("day")
        .toDate();
      const formattedToDate = moment(to_date, "DD-MM-YYYY")
        .endOf("day")
        .toDate();

      if (
        !moment(from_date, "DD-MM-YYYY", true).isValid() ||
        !moment(to_date, "DD-MM-YYYY", true).isValid()
      ) {
        return res.status(400).json({
          status: false,
          errors: ["Invalid date format. Use DD-MM-YYYY."],
        });
      }

      whereCondition.createdAt = {
        [Op.between]: [formattedFromDate, formattedToDate],
      };
    }

    const today = moment().startOf("day").toDate();
    const sevenDaysLater = moment().add(7, "days").endOf("day").toDate();

    if (filter_type === "upcoming") {
      whereCondition.transition_status = "hold";
    } else if (filter_type === "expire") {
      whereCondition.transition_status = "credit";
      whereCondition.expiry_date = {
        [Op.between]: [
          moment(today).format("DD-MM-YYYY"),
          moment(sevenDaysLater).format("DD-MM-YYYY"),
        ],
      };
    }

    const transactions = await transition.findAll({
      where: whereCondition,
      limit: maxLimit,
      offset: offset,
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      status: true,
      rclub_id: cust_id,
      data: transactions,
      page: parseInt(page_no, 10),
      limit: maxLimit,
    });
  } catch (error) {
    console.error("Error fetching point transaction details:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred.",
      error,
    });
  }
};

export const pointCalculateRclub = async (req, res) => {
  try {
    const { customer_id, line_items } = req.body;

    const fetchProductTags = async (productId) => {
      try {
        const configData = {
          method: "get",
          maxBodyLength: Infinity,
          url: `https://rclubstore.myshopify.com/admin/api/2024-01/products/${productId}.json`,
          headers: {
            "X-Shopify-Access-Token": config.shopify_token,
          },
        };
        const response = await axios.request(configData);
        return response.data.product.tags || "";
      } catch (error) {
        console.error(`Error fetching tags for product ${productId}:`, error);
        return "";
      }
    };

    const customerData = await customer.findOne({
      where: { account_number: customer_id },
    });
    if (!customerData) {
      return res.json({ message: "Customer not found" });
    }

    const customerInfo = {
      earned_point: customerData.earned_point,
      redeem_point: customerData.redeem_point,
      expiry_point: customerData.expiry_point,
      balance_point: customerData.balance_point,
      membership_tier: customerData.membership_tier,
      membership_status: customerData.membership_status,
    };

    const activeRules = await getActiveRules();

    const ruleSet = activeRules.point_conversion_online_purchase?.length
      ? {
          type: "online_purchase",
          rules: activeRules.point_conversion_online_purchase,
        }
      : null;

    if (!ruleSet) {
      return res
        .status(400)
        .json({ message: "No active rules available for calculation." });
    }

    const calculateExpiryAndCreditDelay = (rule) => {
      return {
        pointExpiry: rule.expiresOn ? new Date(rule.expiresOn) : null,
        creditAfterDays: parseInt(rule.credit_after_days, 10) || 0,
      };
    };

    const applyRules = (item, ruleSet, total_price) => {
      let points = 0;
      const expiryDetails = ruleSet.rules.map((rule) => {
        if (ruleSet.type === "online_purchase") {
          const purchaseValue = parseFloat(rule.purchaseValue) || 1;
          points += Math.round(
            (item.line_price / total_price) *
              ((total_price / purchaseValue) * (parseFloat(rule.points) || 0))
          );
        }
        return calculateExpiryAndCreditDelay(rule);
      });

      const finalExpiry = expiryDetails.reduce((latest, current) => {
        if (!current.pointExpiry) return latest;
        return !latest || current.pointExpiry > latest
          ? current.pointExpiry
          : latest;
      }, null);

      const finalCreditAfterDays = expiryDetails.reduce(
        (maxDelay, current) => Math.max(maxDelay, current.creditAfterDays),
        0
      );

      return {
        points,
        pointExpiry: finalExpiry,
        creditAfterDays: finalCreditAfterDays,
      };
    };

    const total_price = line_items.reduce(
      (acc, item) => acc + parseFloat(item.line_price),
      0
    );
    let overallCalculatedPoints = 0;
    const calculatedPoints = [];

    for (const item of line_items) {
      const productTags = await fetchProductTags(item.product_id);
      const { points, pointExpiry, creditAfterDays } = applyRules(
        { ...item, tags: productTags },
        ruleSet,
        total_price
      );

      overallCalculatedPoints += points;

      calculatedPoints.push({
        product: item.title,
        sku: item.sku,
        calculated_point: points,
        pointExpiry,
        creditAfterDays,
        remarks: "Points calculated based on active rules",
      });
    }

    return res.json({
      message: "Points calculated successfully",
      customerData: customerInfo,
      overallCalculatedPoints,
      calculatedPoints,
    });
  } catch (error) {
    console.error("Error calculating points:", error);
    return res
      .status(500)
      .json({ message: "Error processing points calculation." });
  }
};


// export const refundPoint = async (req, res) => {
//   try {
//     const { refund_reward_points, cust_id, points, order_id } = req.body;

//     let errors = [];
//     if (!cust_id) errors.push("Customer Id is required");
//     if (!points || isNaN(parseInt(points, 10)) || parseInt(points, 10) <= 0)
//       errors.push("Points is required and must be greater than zero.");
//     if (!order_id) errors.push("Order ID is required");

//     if (errors.length > 0) {
//       return res.status(400).json({ status: false, errors });
//     }

//     const transitionData = await transition.findOne({
//       where: { account_number: cust_id, order_id },
//     });

//     if (!transitionData) {
//       return res.status(404).json({
//         status: false,
//         message: "Order ID not found.",
//       });
//     }

//     const {
//       customer_Id,
//       account_number,
//       transition_category,
//       medium,
//       point,
//       expiry_date,
//       product_detail,
//       store,
//       name,
//       mobile_no,
//       state,
//       city,
//       serial_no,
//       coupon_code,
//       scan_manual,
//     } = transitionData;

//     const customerData = await customer.findOne({
//       where: { customer_id: customer_Id },
//     });

//     if (!customerData) {
//       return res.status(404).json({
//         status: false,
//         message: "Customer not found.",
//       });
//     }

//     const oldRedeemPoint = parseInt(customerData.redeem_point, 10) || 0;
//     const pointsToAdd = parseInt(points, 10) || 0;
//     const updatedRedeemPoints = oldRedeemPoint - pointsToAdd;
//     const oldEarnedPoint = parseInt(customerData.earned_point, 10) || 0;
//     const oldExpiryPoint = parseInt(customerData.expiry_point, 10) || 0;
//     const updatedBalancePoints = calculateBalancePoints(
//       oldEarnedPoint,
//       updatedRedeemPoints,
//       oldExpiryPoint
//     );

//     await customer.update(
//       {
//         redeem_point: updatedRedeemPoints.toString(),
//         balance_point: updatedBalancePoints.toString(),
//       },
//       { where: { customer_id: customer_Id } }
//     );

//     await transition.create({
//       customer_Id,
//       transition_id: generateTransitionId("refund"),
//       transition_status: "refund",
//       account_number,
//       transition_category,
//       medium,
//       point,
//       expiry_date,
//       order_id,
//       product_detail,
//       store,
//       name,
//       mobile_no,
//       state,
//       city,
//       serial_no,
//       coupon_code,
//       scan_manual,
//     });

//     return res.status(200).json({
//       status: true,
//       message: "Points successfully refunded.",
//       rlcub_id: customerData.account_number,
//       data: {
//         points: pointsToAdd,
//         order_id,
//       },
//     });
//   } catch (error) {
//     console.error("Error processing refund:", error);
//     return res.status(500).json({
//       status: false,
//       message: "An error occurred.",
//       error,
//     });
//   }
// };