import {
    customer,
    transition,
    tier_mangement
  } from "../../models/index";

import moment from "moment";
import axios from "axios";
import { config } from "../config/index";




const determineNewTier = (earnedPoints, startManagement, tierBenefits) => {
  let newTier = "";
  let newTierPoints = 0;

  for (const [tier, range] of Object.entries(startManagement)) {
    // Parse start and end points as integers
    const startPoint = parseInt(range.start_point, 10);
    const endPoint = range.end_point ? parseInt(range.end_point, 10) : Infinity;

    if (earnedPoints >= startPoint && earnedPoints <= endPoint) {
      newTier = tier;
      newTierPoints = parseInt(tierBenefits[tier] || "0", 10); // Ensure points are numeric
      break;
    }
  }

  return { newTier, newTierPoints };
};

const calculateBalancePointsManagement = (earnedPoints, customer) => {
  const redeemPoints = parseInt(customer.redeem_point || "0", 10);
  const expiryPoints = parseInt(customer.expiry_point || "0", 10);
  return earnedPoints - redeemPoints - expiryPoints;
};

const generateTransitionId = (transitionCategory) => {
  const datePart = moment().format("YYYYMMDDHHmmss");
  const randomPart = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(10, "0");
  return `${transitionCategory}${datePart}${randomPart}`;
};


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
  
      const configData = {
        method: "post",
        maxBodyLength: Infinity,
        url: "https://lakmestaging.myshopify.com/admin/api/2024-07/graphql.json",
        headers: {
          "X-Shopify-Access-Token": config.shopify_token,
          "Content-Type": "application/json",
        },
        data,
      };
      const response = await axios.request(configData);
      console.log("Metafields created successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating metafields:", error);
      throw new Error("Failed to create metafields");
    }
  };


export const updateTierManagement = async (customerId) => {
  try {
    if (!customerId) {
      throw new Error("Customer ID is required.");
    }
    const customerData = await customer.findOne({
      where: { customer_id: customerId },
    });
    if (!customerData) {
      throw new Error("Customer not found.");
    }

    const { earned_point, membership_tier } = customerData;
    const tierData = await tier_mangement.findOne({ where: { id: 1 } });
    if (!tierData) {
      throw new Error("Tier management data not found.");
    }

    const { start_mangement, tier_benefits } = tierData;
    const earnedPoints = parseInt(earned_point, 10);
    const { newTier, newTierPoints } = determineNewTier(
      earnedPoints,
      start_mangement,
      tier_benefits
    );
    if (membership_tier === newTier) {
      return {
        message: "No tier update required.",
        newTier,
        updatedEarnedPoints: earned_point,
        updatedBalancePoints: customerData.balance_point,
      };
    }
    const updatedEarnedPoints = earnedPoints + newTierPoints;
    const updatedBalancePoints = calculateBalancePointsManagement(
      updatedEarnedPoints,
      customerData
    );
    await customer.update(
      {
        earned_point: updatedEarnedPoints.toString(),
        balance_point: updatedBalancePoints.toString(),
        membership_tier: newTier,
      },
      { where: { customer_id: customerId } }
    );

    console.log("newTierPoints", newTierPoints);
    if (newTierPoints > 0) {
      const transitionId = generateTransitionId("tier_update");
      await transition.create({
        customer_Id: customerId,
        transition_id: transitionId,
        account_number: customerData.account_number,
        transition_category: "tier_update",
        transition_status: "credit",
        medium: "desktop",
        point: newTierPoints,
        expiry_date: "18months",
        order_id: "",
        product_detail: "",
        domain: "rajnigandha.com",
      });
    }

    await createMetafieldHelperFunction(customerId, {
      rclupoint: "0",
      rajnigandha_point: updatedBalancePoints.toString(),
    });

    return {
      message: "Customer tier updated successfully.",
      newTier,
      updatedEarnedPoints: updatedEarnedPoints.toString(),
      updatedBalancePoints: updatedBalancePoints.toString(),
    };
  } catch (error) {
    console.error("Error updating customer tier:", error);
    throw new Error(error.message || "Internal server error.");
  }
};