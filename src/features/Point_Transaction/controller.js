import {
  responseHandler,
  errorHandler,
  statusMaker,
  apiMessages,
  // customer,
  point,
  transition,
  storeHandler
} from "./index";
import moment from "moment";

function generateTransitionId(transitionCategory) {
  const datePart = moment().format("YYYYMMDDHHmmss");
  const randomPart = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(10, "0");
  return `${transitionCategory}${datePart}${randomPart}`;
}

export const create = async (req, res) => {
  try {
    const {
      customer_Id,
      account_number,
      transition_category,
      transition_status,
      medium,
      source_of_device,
      point: pointValue,
      expiry_date,
      order_id,
      product_detail,
      store
    } = req.body;
    const processedStore = await storeHandler(store);
    const transition_id = generateTransitionId(transition_category);
    const newTransition = await transition.create({
      customer_Id,
      transition_id,
      account_number,
      transition_category,
      transition_status,
      medium,
      source_of_device,
      point: pointValue,
      expiry_date,
      order_id,
      product_detail,
      store: processedStore
    });

    const newPoint = await point.create({
      customer_Id,
      transition_id,
      account_number,
      point: pointValue,
      transition_status,
      expiry_date,
      store: processedStore
    });

    const response = responseHandler(statusMaker.created, apiMessages.create, {
      transition: newTransition,
      point: newPoint,
    });

    return res.status(statusMaker.created).json(response);
  } catch (error) {
    console.error("Error:", error);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const calculatePoint = async (req, res) => {
  try {
    const { account_number,store } = req.body;
    const processedStore = await storeHandler(store);
    if (!account_number) {
      return res.status(400).json({ message: "Account number is required." });
    }
    const pointsData = await point.findAll({
      where: { account_number,store: processedStore },
    });

    if (!pointsData.length) {
      return res
        .status(404)
        .json({ message: "No data found for the provided account number." });
    }

    let earned_point = 0;
    let redeem_point = 0;
    let expiry_point = 0;
    pointsData.forEach((data) => {
      const pointValue = parseFloat(data.point);
      switch (data.transition_status) {
        case "credit":
        case "register":
          earned_point += pointValue;
          break;
        case "debit":
          redeem_point += pointValue;
          break;
        case "expiry":
          expiry_point += pointValue;
          break;
        default:
          break;
      }
    });
    const balance_point = earned_point - redeem_point - expiry_point;
    const response = {
      earned_point,
      redeem_point,
      expiry_point,
      balance_point,
    };

    return res
      .status(200)
      .json({ message: "Points calculated successfully", data: response });
  } catch (error) {
    console.error("Error calculating points:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllTransitionsByAccountNumber = async (req, res) => {
  try {
    const { account_number,store } = req.body;
    const processedStore = await storeHandler(store);
    if (!account_number) {
      return res.status(400).json({ message: "Account number is required." });
    }

    // Fetch all transition records for the provided account number
    const transitions = await transition.findAll({
      where: { account_number,store: processedStore },
      order: [["createdAt", "DESC"]], // Optional: orders by creation date, newest first
    });

    if (!transitions.length) {
      return res
        .status(404)
        .json({
          message: "No transactions found for the provided account number.",
        });
    }

    return res.status(200).json({
      message: "Transactions fetched successfully",
      data: transitions,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
