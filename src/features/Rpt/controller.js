import {
  responseHandler,
  errorHandler,
  statusMaker,
  apiMessages,
  customer,
  //   tier_mangement,
  cmm,
  rptSchema,
  //   checkUndefined,
  //   checkEmptyArray,
} from "./index";
import { Op } from "sequelize";
// import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import useragent from "express-useragent";

// Helper function to generate unique transition_id
function generateTransitionId() {
  const datePart = moment().format("YYYYMMDDHHmmss");
  const randomPart = Math.floor(Math.random() * 1000000000).toString();
  return `RP${datePart}${randomPart}`;
}

export const createRewardPointTransaction = async (req, res) => {
  const {
    customer_Id,
    order_id,
    reward_utilization,
    calculate_reward_point,
    device_information,
    shopname,
    product_id,
  } = req.body;

  try {
    const date_time_of_redemption = new Date();
    const transition_id = generateTransitionId();
    const customer = await cmm.findOne({ where: { customer_Id } });
    console.log("customer", customer);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    if (reward_utilization === "not used") {
      console.log("line 51 inside not used");

      var point_to_used = "0";
      const newRewardPoints =
        parseInt(customer.reward_points || 0) +
        parseInt(calculate_reward_point);
      console.log("newRewardPoints", newRewardPoints);

      const newTotalRewardPoints =
        parseInt(customer.total_reward_points || 0) +
        parseInt(calculate_reward_point);
      console.log("newTotalRewardPoints", newTotalRewardPoints);

      await customer.update({
        reward_points: newRewardPoints,
        total_reward_points: newTotalRewardPoints,
      });
    } else if (
      reward_utilization === "partially" ||
      reward_utilization === "fully"
    ) {
      console.log("line 51 inside  partitally");
      const newRewardPoints =
        parseInt(customer.reward_points || 0) - parseInt(point_to_used);
      await customer.update({
        reward_points: Math.max(newRewardPoints, 0),
      });
    }

    // Create a new reward point transaction record
    const transaction = await rptSchema.create({
      customer_Id,
      order_id,
      reward_utilization,
      calculate_reward_point:
        reward_utilization === "not used" ? calculate_reward_point : "10",
      transition_id,
      date_time_of_redemption,
      point_to_used,
      device_information,
      shopname,
      product_id,
    });

    return res.status(201).json({
      message: "Reward point transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("Error creating reward point transaction:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getByAPE = async (req, res) => {
  try {
    const { email, phone_number, account_number } = req.query;
    const searchCriteria = {
      [Op.or]: [
        { email: email || null },
        { phone_number: phone_number || null },
        { account_number: account_number || null },
      ],
    };
    const existingUser = await customer.findOne({
      where: searchCriteria,
    });
    if (!existingUser) {
      return res
        .status(statusMaker.notFound)
        .json(responseHandler(statusMaker.notFound, apiMessages.notFound));
    }
    return res
      .status(statusMaker.found)
      .json(
        responseHandler(statusMaker.found, apiMessages.found, existingUser)
      );
  } catch (error) {
    return res.status(statusMaker.internalError).json(errorHandler(error));
  }
};

export const logLoginDevice = (req, res) => {
  try {
    const agent = useragent.parse(req.headers["user-agent"]);

    const deviceInformation = {
      device: agent.device || "Unknown Device",
      os: agent.os || "Unknown OS",
      browser: agent.browser || "Unknown Browser",
      ip: req.ip || "Unknown IP",
      timestamp: new Date(),
    };

    return res.status(200).json({
      message: "Device details fetched successfully",
      deviceInformation,
    });
  } catch (error) {
    console.error("Error fetching device details:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
