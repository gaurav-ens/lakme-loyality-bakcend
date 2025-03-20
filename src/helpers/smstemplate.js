import axios from "axios";
import { Notification } from "../../models/index";
import { transporter } from "./emailConfiguration";

//sms started
export const handleTemplateType = async (req, res, next) => {
  try {
    const { templateType, customer_id, store } = req.body;

    if (!templateType || !customer_id || !store) {
      return res
        .status(400)
        .json({ message: "templateType, customer_id, and store are required" });
    }

    // Map the templateType to action
    const actionMap = {
      "reward-points-redeemed": "redeem",
      "reward-points-earned": "earn",
      "reward-points-updated": "update",
      "points-redemption-for-exclusive-products": "earn",
      "rewards-program-update": "earn",
      "tier-upgrade": "earn",
      "rewards-program-benefits": "earn",
      "new-exclusive-products-available": "earn",
      "rewards-program-enrollment": "earn",
      "rewards-program-expiring": "earn",
      "exclusive-product-redemption-reminder": "earn",
      "shop-with-available-reward-points": "earn",
      "happy-birthday": "earn",
      "happy-marriage-anniversary": "earn",
      "new-reward-points-earned": "earn",
      "tier-downgrade": "earn",
      "exclusive-redemption-offer": "earn",
      "voucher-redeem-confirmation": "redeem",
      "OTPVoucher": "redeem",
      "vouchcer-revised": "vouchcer-revised",
      "dispatched": "dispatched",
      "refund-of-rewardpoints": "refund-of-rewardpoints"
    };

    if (actionMap[templateType]) {
      req.action = actionMap[templateType];
      req.customer_id = customer_id;
      req.store = store;
      next();
    } else {
      return res
        .status(400)
        .json({ message: `Invalid templateType: ${templateType}` });
    }
  } catch (error) {
    console.error("Error in handleTemplateType middleware:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const sendSMS = async (templateType, store, whatsappDetails) => {
  try {
    const notifications = await Notification.findAll({
      where: { store, notification_type: "SMS" },
    });
    const notification = notifications.find(
      (n) => n.templateType === templateType
    );
    // console.log("notification", notification);

    if (!notification) {
      throw new Error(
        `Notification details not found for templateType: ${templateType}`
      );
    }

    const { username, password, header } = notification;
    let text = header;
    if (templateType === "reward-points-earned") {
      text = text.replace("{#var#}", `${whatsappDetails.usedPoints}`);
      text = text.replace("{#var#}", `${whatsappDetails.balance_point}`);
    }
    const smsUrl = `https://api2.growwsaas.com/fe/api/v1/send`;
    const from = "ReShop";

    // Sending the SMS via API
    const response = await axios.get(smsUrl, {
      params: {
        username,
        password,
        unicode: false,
        from,
        to: whatsappDetails.phone_number,
        text,
        dltContentId: "1007653284425747534",
      },
    });
    // console.log("response111111111", response);
    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendSMSredemption = async (
  templateType, store, whatsappDetails
) => {
  try {
    const notifications = await Notification.findAll({
      where: { store, notification_type: "SMS" },
    });
    const notification = notifications.find(
      (n) => n.templateType === templateType
    );
    // console.log("notification----", notification);

    if (!notification) {
      throw new Error(
        `Notification details not found for earned templateType: ${templateType}`
      );
    }
    const { username, password, header } = notification;
    if (!header || typeof header !== "string") {
      throw new Error("Header is not defined or is not a string");
    }
    // console.log("line118---------", username, password, header);
    let text = header;
    if (templateType === "reward-points-redeemed") {
      if (!whatsappDetails || !whatsappDetails.first_name) {
        throw new Error("whatsappDetails or redemedBy field is missing");
      }
      text = text.replace("{#var#}", `${whatsappDetails.first_name}`);
    }
    // console.log(text, "text111");

    const smsUrl = `https://api2.growwsaas.com/fe/api/v1/send`;
    const from = "ReShop";
    const response = await axios.get(smsUrl, {
      params: {
        username,
        password,
        unicode: false,
        from,
        to: whatsappDetails.phone_number,
        text,
        dltContentId: "1007866970822561361",
      },
    });
    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

// export const sendSMSredemption = async (
//     phone_number,
//     customerData,
//     store,
//     templateType
//   ) => {
//     try {
//       const notification = await Notification.findAll({
//         where: { store, notification_type: "SMS" },
//       });
//       console.log("Fetched notifications:", notification);

//     //   const notification = notifications.find((n) =>
//     //   n.header.includes(templateType)
//     // );
//       if (!notification) {
//         throw new Error("Notification details not found for the store");
//       }
//       const { username, password, header } = notification;
//       console.log("Notification header:", header);
//       if (!header || typeof header !== "string") {
//         throw new Error("Header is not defined or is not a string");
//       }
//       let text = header;

//     if (templateType === "reward-points-redeemed") {
//       if (!customerData || !customerData.redemedBy) {
//         throw new Error("customerData or redemedBy field is missing");
//       }
//       text = text.replace("{#var#}", `${customerData.redemedBy}`);
//     }
//       const smsUrl = `https://api2.growwsaas.com/fe/api/v1/send`;
//       const from = "ReShop";

//       // Sending the SMS via API
//       const response = await axios.get(smsUrl, {
//         params: {
//           username,
//           password,
//           unicode: false,
//           from,
//           to: phone_number,
//           text,
//           dltContentId:"1007866970822561361"
//         },
//       });
//       console.log(response,"response");
//       console.log("SMS sent successfully:", response.data);
//     } catch (error) {
//       console.error("Error sending SMS:", error.message);
//     }
// };

export const sendSMSbalanceupdate = async (
  customerData,
  store,
  templateType
) => {
  try {
    const notifications = await Notification.findAll({
      where: { store, notification_type: "SMS" },
    });
    // console.log("notification", notifications);

    const notification = notifications.find(
      (n) => n.templateType === templateType
    );
    // console.log("notification", notification);

    if (!notification) {
      throw new Error(
        `Notification details not found for templateType: ${templateType}`
      );
    }
    const { username, password, header } = notification;
    if (!header || typeof header !== "string") {
      throw new Error("Header is not defined or is not a string");
    }
    let text = header;
    if (templateType === "reward-points-updated") {
      text = text.replace("{#var#}", `${customerData.redemedBy}`);
      text = text.replace("{#var#}", `${customerData.points}`);
      text = text.replace("{#var#}", `${customerData.balancePoints}`);
    }
    const smsUrl = `https://api2.growwsaas.com/fe/api/v1/send`;
    const from = "ReShop";

    // Sending the SMS via API
    const response = await axios.get(smsUrl, {
      params: {
        username,
        password,
        unicode: false,
        from,
        to: customerData.phone_number,
        text,
        dltContentId: "1007859328239461382",
      },
    });
    // console.log("response: " + response);

    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendSMSredemptionexclusiveproducts = async (
  templateType, store, whatsappDetails
) => {
  try {
    const notifications = await Notification.findAll({
      where: { store, notification_type: "SMS" },
    });
    const notification = notifications.find(
      (n) => n.templateType === templateType
    );

    if (!notification) {
      throw new Error(
        `Notification details not found for templateType: ${templateType}`
      );
    }
    const { username, password, header } = notification;
    if (!header || typeof header !== "string") {
      throw new Error("Header is not defined or is not a string");
    }
    let text = header;
    if (templateType === "points-redemption-for-exclusive-products") {
      text = text.replace("{#var#}", `${whatsappDetails.first_name}`);
    }
    // console.log("text-------",text,whatsappDetails);
    const smsUrl = `https://api2.growwsaas.com/fe/api/v1/send`;
    const from = "ReShop";

    // Sending the SMS via API
    const response = await axios.get(smsUrl, {
      params: {
        username,
        password,
        unicode: false,
        from,
        to: whatsappDetails.phone_number,
        text,
        dltContentId: "1007459546892700083",
      },
    });

    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendSMSnewexclusiveproducts = async (
  phone_number,
  customerData,
  store,
  templateType
) => {
  try {
    const notifications = await Notification.findAll({
      where: { store, notification_type: "SMS" },
    });
    const notification = notifications.find(
      (n) => n.templateType === templateType
    );

    if (!notification) {
      throw new Error(
        `Notification details not found for templateType: ${templateType}`
      );
    }
    const { username, password, header } = notification;
    if (!header || typeof header !== "string") {
      throw new Error("Header is not defined or is not a string");
    }
    let text = header;
    if (templateType === "new-exclusive-products-available") {
      text = text.replace("{{1}}", `${customerData.first_name}`);
      text = text.replace("{{2}}", `${customerData.redeemNow}`);
    }
    const smsUrl = `https://api2.growwsaas.com/fe/api/v1/send`;
    const from = "ReShop";

    // Sending the SMS via API
    const response = await axios.get(smsUrl, {
      params: {
        username,
        password,
        unicode: false,
        from,
        to: phone_number,
        text,
        dltContentId: "1007459546892700083",
      },
    });

    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendSMSprogramupdate = async (
  phone_number,
  customerData,
  store,
  templateType
) => {
  try {
    const notifications = await Notification.findAll({
      where: { store, notification_type: "SMS" },
    });
    const notification = notifications.find(
      (n) => n.templateType === templateType
    );

    if (!notification) {
      throw new Error(
        `Notification details not found for templateType: ${templateType}`
      );
    }
    const { username, password, header } = notification;
    if (!header || typeof header !== "string") {
      throw new Error("Header is not defined or is not a string");
    }
    let text = header;
    if (templateType === "rewards-program-update") {
      text = text.replace("{{1}}", `${customerData.first_name}`);
      text = text.replace("{{2}}", `${customerData.benefit}`);
    }
    const smsUrl = `https://api2.growwsaas.com/fe/api/v1/send`;
    const from = "ReShop";

    // Sending the SMS via API
    const response = await axios.get(smsUrl, {
      params: {
        username,
        password,
        unicode: false,
        from,
        to: phone_number,
        text,
        dltContentId: "1007374762644788857",
      },
    });

    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendSMStierupgrade = async (
  templateType, store, whatsappDetails
) => {
  try {
    const notifications = await Notification.findAll({
      where: { store, notification_type: "SMS" },
    });
    const notification = notifications.find(
      (n) => n.templateType === templateType
    );

    if (!notification) {
      throw new Error(
        `Notification details not found for templateType: ${templateType}`
      );
    }
    const { username, password, header } = notification;
    if (!header || typeof header !== "string") {
      throw new Error("Header is not defined or is not a string");
    }
    let text = header;
    if (templateType === "tier-upgrade") {
      text = text.replace("{#var#}", `${whatsappDetails.first_name}`);
      text = text.replace("{#var#}", `${whatsappDetails.newTier}`);
    }
    const smsUrl = `https://api2.growwsaas.com/fe/api/v1/send`;
    const from = "ReShop";

    // Sending the SMS via API
    const response = await axios.get(smsUrl, {
      params: {
        username,
        password,
        unicode: false,
        from,
        to: whatsappDetails.phone_number,
        text,
        dltContentId: "1007033259711236886",
      },
    });

    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.log("err-------",error);
    console.error("Error sending SMS:", error.message);
  }
};

export const sendSMSprogrambenefits = async (
  customerData,
  store,
  templateType
) => {
  try {
    const notifications = await Notification.findAll({
      where: { store, notification_type: "SMS" },
    });
    const notification = notifications.find(
      (n) => n.templateType === templateType
    );

    if (!notification) {
      throw new Error(
        `Notification details not found for templateType: ${templateType}`
      );
    }
    const { username, password, header } = notification;
    if (!header || typeof header !== "string") {
      throw new Error("Header is not defined or is not a string");
    }
    let text = header;
    if (templateType === "rewards-program-benefits") {
      text = text.replace("{{1}}", `${customerData.first_name}`);
      text = text.replace("{{2}}", `${customerData.benefitLink}`);
    }
    const smsUrl = `https://api2.growwsaas.com/fe/api/v1/send`;
    const from = "ReShop";

    // Sending the SMS via API
    const response = await axios.get(smsUrl, {
      params: {
        username,
        password,
        unicode: false,
        from,
        to: customerData.phone_number,
        text,
        dltContentId: "1007263205660762663",
      },
    });

    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendSMSprogramenrollment = async (
  phone_number,
  customerData,
  store,
  templateType
) => {
  try {
    const notifications = await Notification.findAll({
      where: { store, notification_type: "SMS" },
    });
    const notification = notifications.find(
      (n) => n.templateType === templateType
    );

    if (!notification) {
      throw new Error(
        `Notification details not found for templateType: ${templateType}`
      );
    }
    const { username, password, header } = notification;
    if (!header || typeof header !== "string") {
      throw new Error("Header is not defined or is not a string");
    }
    let text = header;
    if (templateType === "rewards-program-enrollment") {
      text = text.replace("{{1}}", `${customerData.first_name}`);
    }
    const smsUrl = `https://api2.growwsaas.com/fe/api/v1/send`;
    const from = "ReShop";

    // Sending the SMS via API
    const response = await axios.get(smsUrl, {
      params: {
        username,
        password,
        unicode: false,
        from,
        to: phone_number,
        text,
        dltContentId: "1007372375101654754",
      },
    });

    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendSMSprogramexpiring = async (
  templateType,
  store,
  whatsappDetails
) => {
  try {
    const notifications = await Notification.findAll({
      where: { store, notification_type: "SMS" },
    });
    const notification = notifications.find(
      (n) => n.templateType === templateType
    );

    if (!notification) {
      throw new Error(
        `Notification details not found for templateType: ${templateType}`
      );
    }
    const { username, password, header } = notification;
    if (!header || typeof header !== "string") {
      throw new Error("Header is not defined or is not a string");
    }
    let text = header;
    if (templateType === "rewards-program-expiring") {
      text = text.replace("{#var#}", `${whatsappDetails.first_name}`);
      text = text.replace("{#var#}", `${whatsappDetails.rewardPoints}`);
      text = text.replace("{#var#}", `${whatsappDetails.expireDate}`);
    }
    const smsUrl = `https://api2.growwsaas.com/fe/api/v1/send`;
    const from = "ReShop";

    // Sending the SMS via API
    const response = await axios.get(smsUrl, {
      params: {
        username,
        password,
        unicode: false,
        from,
        to: whatsappDetails.phone_number,
        text,
        dltContentId: "1007113478542044750",
      },
    });

    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendSMSproductredemptionreminder = async (
  phone_number,
  customerData,
  store,
  templateType
) => {
  try {
    const notifications = await Notification.findAll({
      where: { store, notification_type: "SMS" },
    });
    const notification = notifications.find(
      (n) => n.templateType === templateType
    );

    if (!notification) {
      throw new Error(
        `Notification details not found for templateType: ${templateType}`
      );
    }
    const { username, password, header } = notification;
    if (!header || typeof header !== "string") {
      throw new Error("Header is not defined or is not a string");
    }
    let text = header;
    if (templateType === "exclusive-product-redemption-reminder") {
      text = text.replace("{{1}}", `${customerData.redemedBy}`);
    }
    const smsUrl = `https://api2.growwsaas.com/fe/api/v1/send`;
    const from = "ReShop";

    // Sending the SMS via API
    const response = await axios.get(smsUrl, {
      params: {
        username,
        password,
        unicode: false,
        from,
        to: phone_number,
        text,
        dltContentId: "1007735139079594347",
      },
    });

    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendSMSshopavailableproducts = async (
  phone_number,
  customerData,
  store,
  templateType
) => {
  try {
    const notifications = await Notification.findAll({
      where: { store, notification_type: "SMS" },
    });
    const notification = notifications.find(
      (n) => n.templateType === templateType
    );

    if (!notification) {
      throw new Error(
        `Notification details not found for templateType: ${templateType}`
      );
    }
    const { username, password, header } = notification;
    if (!header || typeof header !== "string") {
      throw new Error("Header is not defined or is not a string");
    }
    let text = header;
    if (templateType === "shop-with-available-reward-points") {
      text = text.replace("{{1}}", `${customerData.redemedBy}`);
    }
    const smsUrl = `https://api2.growwsaas.com/fe/api/v1/send`;
    const from = "ReShop";

    // Sending the SMS via API
    const response = await axios.get(smsUrl, {
      params: {
        username,
        password,
        unicode: false,
        from,
        to: phone_number,
        text,
        dltContentId: "1007531296810186189",
      },
    });

    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendSMSbirthday = async (
  templateType, store, whatsappDetails
) => {
  try {
    const notifications = await Notification.findAll({
      where: { store, notification_type: "SMS" },
    });
    const notification = notifications.find(
      (n) => n.templateType === templateType
    );

    if (!notification) {
      throw new Error(
        `Notification details not found for templateType: ${templateType}`
      );
    }
    const { username, password, header } = notification;
    if (!header || typeof header !== "string") {
      throw new Error("Header is not defined or is not a string");
    }
    let text = header;
    if (templateType === "happy-birthday") {
      text = text.replace("{#var#}", `${whatsappDetails.first_name}`);
    }
    const smsUrl = `https://api2.growwsaas.com/fe/api/v1/send`;
    const from = "ReShop";

    // Sending the SMS via API
    const response = await axios.get(smsUrl, {
      params: {
        username,
        password,
        unicode: false,
        from,
        to: whatsappDetails.phone_number,
        text,
        dltContentId: "1007328431331204632",
      },
    });

    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendSMSanniversary = async (
  phone_number,
  customerData,
  store,
  templateType
) => {
  try {
    const notifications = await Notification.findAll({
      where: { store, notification_type: "SMS" },
    });
    const notification = notifications.find(
      (n) => n.templateType === templateType
    );

    if (!notification) {
      throw new Error(
        `Notification details not found for templateType: ${templateType}`
      );
    }
    const { username, password, header } = notification;
    if (!header || typeof header !== "string") {
      throw new Error("Header is not defined or is not a string");
    }
    let text = header;
    if (templateType === "happy-marriage-anniversary") {
      text = text.replace("{{1}}", `${customerData.redemedBy}`);
    }
    const smsUrl = `https://api2.growwsaas.com/fe/api/v1/send`;
    const from = "ReShop";

    // Sending the SMS via API
    const response = await axios.get(smsUrl, {
      params: {
        username,
        password,
        unicode: false,
        from,
        to: phone_number,
        text,
        dltContentId: "",
      },
    });

    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendSMSnewrewardearned = async (
  phone_number,
  customerData,
  store,
  templateType
) => {
  try {
    const notifications = await Notification.findAll({
      where: { store, notification_type: "SMS" },
    });
    const notification = notifications.find(
      (n) => n.templateType === templateType
    );

    if (!notification) {
      throw new Error(
        `Notification details not found for templateType: ${templateType}`
      );
    }
    const { username, password, header } = notification;
    if (!header || typeof header !== "string") {
      throw new Error("Header is not defined or is not a string");
    }
    let text = header;
    if (templateType === "new-reward-points-earned") {
      text = text.replace("{{1}}", `${customerData.first_name}`);
      text = text.replace("{{1}}", `${customerData.newRewardPoints}`);
      text = text.replace("{{3}}", `${customerData.priceValue}`);
    }
    const smsUrl = `https://api2.growwsaas.com/fe/api/v1/send`;
    const from = "ReShop";

    // Sending the SMS via API
    const response = await axios.get(smsUrl, {
      params: {
        username,
        password,
        unicode: false,
        from,
        to: phone_number,
        text,
        dltContentId: "",
      },
    });

    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendSMStierdowngrade = async (
  templateType, store, whatsappDetails
) => {
  try {
    const notifications = await Notification.findAll({
      where: { store, notification_type: "SMS" },
    });
    const notification = notifications.find(
      (n) => n.templateType === templateType
    );

    if (!notification) {
      throw new Error(
        `Notification details not found for templateType: ${templateType}`
      );
    }
    const { username, password, header } = notification;
    if (!header || typeof header !== "string") {
      throw new Error("Header is not defined or is not a string");
    }
    let text = header;
    if (templateType === "tier-downgrade") {
      text = text.replace("{#var#}", `${whatsappDetails.first_name}`);
      text = text.replace("{#var#}", `${whatsappDetails.newTier}`);
    }
    const smsUrl = `https://api2.growwsaas.com/fe/api/v1/send`;
    const from = "ReShop";

    // Sending the SMS via API
    const response = await axios.get(smsUrl, {
      params: {
        username,
        password,
        unicode: false,
        from,
        to: whatsappDetails.phone_number,
        text,
        dltContentId: "1007251425009723045",
      },
    });

    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendSMSexclusiveoffer = async (
  phone_number,
  customerData,
  store,
  templateType
) => {
  try {
    const notifications = await Notification.findAll({
      where: { store, notification_type: "SMS" },
    });
    const notification = notifications.find(
      (n) => n.templateType === templateType
    );

    if (!notification) {
      throw new Error(
        `Notification details not found for templateType: ${templateType}`
      );
    }
    const { username, password, header } = notification;
    if (!header || typeof header !== "string") {
      throw new Error("Header is not defined or is not a string");
    }
    let text = header;
    if (templateType === "exclusive-redemption-offer") {
      text = text.replace("{{1}}", `${customerData.first_name}`);
    }
    const smsUrl = `https://api2.growwsaas.com/fe/api/v1/send`;
    const from = "ReShop";

    // Sending the SMS via API
    const response = await axios.get(smsUrl, {
      params: {
        username,
        password,
        unicode: false,
        from,
        to: phone_number,
        text,
        dltContentId: "1007036398265258678",
      },
    });

    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendSMSvoucherredeemconfirmation = async (
  customerData,
  store,
  templateType
) => {
  try {
    const notifications = await Notification.findAll({
      where: { store, notification_type: "SMS" },
    });
    const notification = notifications.find(
      (n) => n.templateType === templateType
    );

    if (!notification) {
      throw new Error(
        `Notification details not found for templateType: ${templateType}`
      );
    }
    const { username, password, header } = notification;
    if (!header || typeof header !== "string") {
      throw new Error("Header is not defined or is not a string");
    }
    let text = header;
    if (templateType === "voucher-redeem-confirmation") {
      // text = text.replace("{{1}}", `${customerData.redemedBy}`);
    }
    const smsUrl = `https://api2.growwsaas.com/fe/api/v1/send`;
    const from = "ReShop";

    // Sending the SMS via API
    const response = await axios.get(smsUrl, {
      params: {
        username,
        password,
        unicode: false,
        from,
        to: customerData.phone_number,

        text,
        dltContentId: "1007481896540025780",
      },
    });

    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendSMSOTPVoucher = async (
  customerData,
  store,
  templateType
) => {
  try {
    const notifications = await Notification.findAll({
      where: { store, notification_type: "SMS" },
    });
    const notification = notifications.find(
      (n) => n.templateType === templateType
    );

    if (!notification) {
      throw new Error(
        `Notification details not found for templateType: ${templateType}`
      );
    }
    const { username, password, header } = notification;
    if (!header || typeof header !== "string") {
      throw new Error("Header is not defined or is not a string");
    }
    let text = header;
    if (templateType === "OTPVoucher") {
      text = text.replace("{#var#}", `${customerData.otp}`);

    }
    const smsUrl = `https://api2.growwsaas.com/fe/api/v1/send`;
    const from = "ReShop";

    // Sending the SMS via API
    const response = await axios.get(smsUrl, {
      params: {
        username,
        password,
        unicode: false,
        from,
        to: customerData.phone_number,
        text,
        dltContentId: "1007890375433004555",
      },
    });

    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendSMSVouchcerRevised = async (
  customerData,
  store,
  templateType
) => {
  try {
    const notifications = await Notification.findAll({
      where: { store, notification_type: "SMS" },
    });
    const notification = notifications.find(
      (n) => n.templateType === templateType
    );

    if (!notification) {
      throw new Error(
        `Notification details not found for templateType: ${templateType}`
      );
    }
    const { username, password, header } = notification;
    if (!header || typeof header !== "string") {
      throw new Error("Header is not defined or is not a string");
    }
    let text = header;
    // console.log("customerData-----", customerData);
    if (templateType === "vouchcer-revised") {
      text = text.replace("{#var#}", `${customerData.first_name}`);
      text = text.replace("{#var#}", `${customerData.brandName}`);
      text = text.replace("{#var#}", `${customerData.price}`);
      text = text.replace("{#var#}", `${customerData.voucherValue}`);
      text = text.replace("{#var#}", `${customerData.rewardPoint}`);
      text = text.replace("{#var#}", `${customerData.quantity}`);
      text = text.replace("{#var#}", `${customerData.denomination}`);
      text = text.replace("{#var#}", `${customerData.voucherCode}`);
      text = text.replace("{#var#}", `${customerData.voucherPin}`);
      text = text.replace("{#var#}", `${customerData.expiryDate}`);
    }
    const smsUrl = `https://api2.growwsaas.com/fe/api/v1/send`;
    const from = "ReShop";

    // Sending the SMS via API
    const response = await axios.get(smsUrl, {
      params: {
        username,
        password,
        unicode: false,
        from,
        to: customerData.phone_number,
        text,
        dltContentId: "1007391311236834713",
      },
    });
    // console.log("response----", response.data);

    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    // console.log("err:--", error);
    console.error("Error sending SMS:", error.message);
  }
};

export const sendSMSDispatched = async (
  phone_number,
  customerData,
  store,
  templateType
) => {
  try {
    const notifications = await Notification.findAll({
      where: { store, notification_type: "SMS" },
    });
    const notification = notifications.find(
      (n) => n.templateType === templateType
    );

    if (!notification) {
      throw new Error(
        `Notification details not found for templateType: ${templateType}`
      );
    }
    const { username, password, header } = notification;
    if (!header || typeof header !== "string") {
      throw new Error("Header is not defined or is not a string");
    }
    let text = header;
    if (templateType === "dispatched") {
      text = text.replace("{#var#}", `${customerData.redemedBy}`);
      text = text.replace("{#var#}", `${customerData.redemedBy}`);
      text = text.replace("{#var#}", `${customerData.redemedBy}`);
      text = text.replace("{#var#}", `${customerData.redemedBy}`);
      text = text.replace("{#var#}", `${customerData.redemedBy}`);
    }
    const smsUrl = `https://api2.growwsaas.com/fe/api/v1/send`;
    const from = "ReShop";

    // Sending the SMS via API
    const response = await axios.get(smsUrl, {
      params: {
        username,
        password,
        unicode: false,
        from,
        to: phone_number,
        text,
        dltContentId: "1007320921425710124",
      },
    });

    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendSMSRefundofRewardPoints = async (
  customerData,
  store,
  templateType
) => {
  try {
    const notifications = await Notification.findAll({
      where: { store, notification_type: "SMS" },
    });
    const notification = notifications.find(
      (n) => n.templateType === templateType
    );

    if (!notification) {
      throw new Error(
        `Notification details not found for templateType: ${templateType}`
      );
    }
    const { username, password, header } = notification;
    if (!header || typeof header !== "string") {
      throw new Error("Header is not defined or is not a string");
    }
    let text = header;
    if (templateType === "refund-of-rewardpoints") {
      text = text.replace("{#var#}", `${customerData.first_name}`);
      text = text.replace("{#var#}", `${customerData.rewardPoints}`);
      text = text.replace("{#var#}", `${customerData.orderId}`);
      text = text.replace("{#var#}", `${customerData.rejectDate}`);
    }
    const smsUrl = `https://api2.growwsaas.com/fe/api/v1/send`;
    const from = "ReShop";
    // console.log("customerData---", customerData);

    // Sending the SMS via API
    const response = await axios.get(smsUrl, {
      params: {
        username,
        password,
        unicode: false,
        from,
        to: customerData.phone_number,
        text,
        dltContentId: "1007700350815265639",
      },
    });

    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.log("Err-------", error);
    console.error("Error sending SMS:", error.message);
  }
};
//end sms

//whatsapp started
export const handleWhatsappTemplateType = async (req, res, next) => {
  try {
    const { templateType, customer_id, store } = req.body;

    if (!templateType || !customer_id || !store) {
      return res
        .status(400)
        .json({ message: "templateType, customer_id, and store are required" });
    }

    // Map the templateType to action
    const actionMap = {
      "reward-points-redeemed": "redeem",
      "reward-points-earned": "earn",
      "reward-points-updated": "update",
      "points-redemption-for-exclusive-products": "earn",
      "rewards-program-update": "earn",
      "tier-upgrade": "earn",
      "rewards-program-benefits": "earn",
      "new-exclusive-products-available": "earn",
      "rewards-program-enrollment": "earn",
      "rewards-program-expiring": "earn",
      "exclusive-product-redemption-reminder": "earn",
      "shop-with-available-reward-points": "earn",
      "happy-birthday": "earn",
      "happy-marriage-anniversary": "earn",
      "new-reward-points-earned": "earn",
      "tier-downgrade": "earn",
      "exclusive-redemption-offer": "earn",
    };

    if (actionMap[templateType]) {
      req.action = actionMap[templateType];
      req.customer_id = customer_id;
      req.store = store;
      next();
    } else {
      return res
        .status(400)
        .json({ message: `Invalid templateType: ${templateType}` });
    }
  } catch (error) {
    console.error("Error in handleTemplateType middleware:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const sendWhatsappSMS = async (templateType, store, whatsappDetails) => {
  try {
    const notifications = await Notification.findAll({
      where: { store, notification_type: "WhatsApp" },
    });

    if (!notifications) {
      throw new Error("Notification details not found for the store");
    }
    const notification = notifications.find(
      (n) => n.templateType === templateType
    );

    if (!notification) {
      throw new Error(`Template not found for type: ${templateType}`);
    }
    const { api_key, password, header } = notification;
    let text = header;
    if (templateType === "reward-points-earned") {
      text = text
        .replace("{{1}}", `${whatsappDetails.first_name}`)
        .replace("{{2}}", `${whatsappDetails.usedPoints}`)
        .replace("{{3}}", `${whatsappDetails.balance_point}`);
    }
    const url = `https://media.smsgupshup.com/GatewayAPI/rest?userid=${api_key}&password=${password}&send_to=${whatsappDetails.phone_number}&v=1.1&format=json&msg_type=TEXT&method=SENDMESSAGE&msg=${text}&isTemplate=true&header=Reward+Points+Earned`;
    // console.log(url, "url");
    const response = await axios.get(url);

    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendWhatsappSMSredemption = async (
  templateType, store, whatsappDetails
) => {
  try {
    // console.log("------",customerData,store,templateType);
    const notifications = await Notification.findAll({
      where: { store, notification_type: "WhatsApp" },
    });

    if (!notifications) {
      throw new Error("Notification details not found for the store");
    }
    const notification = notifications.find(
      (n) => n.templateType === templateType
    );

    if (!notification) {
      throw new Error(`Template not found for type: ${templateType}`);
    }
    const { api_key, password, header } = notification;
    let text = header;
    if (templateType === "reward-points-redeemed") {
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
      text = text.replace("{{2}}", `${whatsappDetails.redeemablePoints}`);
      text = text.replace("{{3}}", `${whatsappDetails.redeemPoint}`);
      text = text.replace("{{4}}", `${whatsappDetails.balancePoint}`);
    }
    const url = `https://media.smsgupshup.com/GatewayAPI/rest?userid=${api_key}&password=${password}&send_to=${whatsappDetails.phone_number}&v=1.1&format=json&msg_type=TEXT&method=SENDMESSAGE&msg=${text}&isTemplate=true&header=Reward+Points+Redeemed`;

    // const url = `https://media.smsgupshup.com/GatewayAPI/rest?userid=${api_key}&password=${password}&send_to=${whatsappDetails.phone_number}&v=1.1&format=json&msg_type=TEXT&method=sendMessage&msg=${text}`;
    // console.log(url, "url");
    const response = await axios.get(url);

    console.log("whatsApp SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendWhatsappSMSbalanceupdate = async (
  templateType,
  store,
  whatsappDetails
) => {
  try {
    const notifications = await Notification.findAll({
      where: { store, notification_type: "WhatsApp" },
    });

    if (!notifications) {
      throw new Error("Notification details not found for the store");
    }
    const notification = notifications.find(
      (n) => n.templateType === templateType
    );

    if (!notification) {
      throw new Error(`Template not found for type: ${templateType}`);
    }
    const { api_key, password, header } = notification;
    let text = header;
    if (templateType === "reward-points-updated") {
      text = text.replace("{{1}}", `${whatsappDetails.redemedBy}`);
      text = text.replace("{{2}}", `${whatsappDetails.redemedBy}`);
      text = text.replace("{{1}}", `${whatsappDetails.redemedBy}`);
    }
    const url = `https://media.smsgupshup.com/GatewayAPI/rest?userid=${api_key}&password=${password}&send_to=${whatsappDetails.phone_number}&v=1.1&format=json&msg_type=TEXT&method=sendMessage&msg=${text}`;
    // console.log(url, "url");
    const response = await axios.get(url);

    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendWhatsappSMSredemptionexclusiveproducts = async (
  templateType,
  store,
  whatsappDetails
) => {
  try {
    const notifications = await Notification.findAll({
      where: { store, notification_type: "WhatsApp" },
    });

    if (!notifications) {
      throw new Error("Notification details not found for the store");
    }
    const notification = notifications.find(
      (n) => n.templateType === templateType
    );

    if (!notification) {
      throw new Error(`Template not found for type: ${templateType}`);
    }
    const { api_key, password, header } = notification;
    let text = header;
    if (templateType === "points-redemption-for-exclusive-products") {
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
    }
    const url = `https://media.smsgupshup.com/GatewayAPI/rest?userid=${api_key}&password=${password}&send_to=${whatsappDetails.phone_number}&v=1.1&format=json&msg_type=TEXT&method=sendMessage&msg=${text}`;
    // console.log(url, "url");
    const response = await axios.get(url);
    console.log("WhatsApp SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendWhatsappSMSnewexclusiveproducts = async (
  templateType,
  store,
  whatsappDetails
) => {
  try {
    const notification = await Notification.findOne({
      where: { store, notification_type: "WhatsApp" },
    });

    if (!notification) {
      throw new Error("Notification details not found for the store");
    }
    const { api_key, password, header } = notification;
    let text = header;
    if (templateType === "new-exclusive-products-available") {
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
      text = text.replace("{{2}}", `${whatsappDetails.redeemNow}`);
    }
    const url = `https://media.smsgupshup.com/GatewayAPI/rest?userid=${api_key}&password=${password}&send_to=${whatsappDetails.phone_number}&v=1.1&format=json&msg_type=TEXT&method=sendMessage&msg=${text}`;
    // console.log(url, "url");
    const response = await axios.get(url);
    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendWhatsappSMSprogramupdate = async (
  templateType,
  store,
  whatsappDetails
) => {
  try {
    const notification = await Notification.findOne({
      where: { store, notification_type: "WhatsApp" },
    });

    if (!notification) {
      throw new Error("Notification details not found for the store");
    }
    const { api_key, password, header } = notification;
    let text = header;
    if (templateType === "rewards-program-update") {
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
      text = text.replace("{{2}}", `${whatsappDetails.benefit}`);
    }
    const url = `https://media.smsgupshup.com/GatewayAPI/rest?userid=${api_key}&password=${password}&send_to=${whatsappDetails.phone_number}&v=1.1&format=json&msg_type=TEXT&method=sendMessage&msg=${text}`;
    // console.log(url, "url");
    const response = await axios.get(url);
    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendWhatsappSMStierupgrade = async (
  templateType, store, whatsappDetails
) => {
  try {
    const notification = await Notification.findOne({
      where: { store, notification_type: "WhatsApp" },
    });

    if (!notification) {
      throw new Error("Notification details not found for the store");
    }
    const { api_key, password, header } = notification;
    let text = header;
    if (templateType === "tier-upgrade") {
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
      text = text.replace("{{2}}", `${whatsappDetails.newTier}`);
    }
    const url = `https://media.smsgupshup.com/GatewayAPI/rest?userid=${api_key}&password=${password}&send_to=${whatsappDetails.phone_number}&v=1.1&format=json&msg_type=TEXT&method=sendMessage&msg=${text}`;
    console.log(url, "url");
    const response = await axios.get(url);
    console.log("WhatsApp SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendWhatsappSMSprogrambenefits = async (
  templateType,
  store,
  whatsappDetails
) => {
  try {
    const notification = await Notification.findOne({
      where: { store, notification_type: "WhatsApp" },
    });

    if (!notification) {
      throw new Error("Notification details not found for the store");
    }
    const { api_key, password, header } = notification;
    let text = header;
    if (templateType === "rewards-program-benefits") {
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
      text = text.replace("{{2}}", `${whatsappDetails.benefitLink}`);
    }
    const url = `https://media.smsgupshup.com/GatewayAPI/rest?userid=${api_key}&password=${password}&send_to=${whatsappDetails.phone_number}&v=1.1&format=json&msg_type=TEXT&method=sendMessage&msg=${text}`;
    // console.log(url, "url");
    const response = await axios.get(url);
    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendWhatsappSMSprogramenrollment = async (
  templateType,
  store,
  whatsappDetails
) => {
  try {
    const notification = await Notification.findOne({
      where: { store, notification_type: "WhatsApp" },
    });

    if (!notification) {
      throw new Error("Notification details not found for the store");
    }
    const { api_key, password, header } = notification;
    let text = header;
    if (templateType === "rewards-program-enrollment") {
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
    }
    const url = `https://media.smsgupshup.com/GatewayAPI/rest?userid=${api_key}&password=${password}&send_to=${whatsappDetails.phone_number}&v=1.1&format=json&msg_type=TEXT&method=sendMessage&msg=${text}`;
    // console.log(url, "url");
    const response = await axios.get(url);
    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendWhatsappSMSprogramexpiring = async (
  templateType,
  store,
  whatsappDetails
) => {
  try {
    const notification = await Notification.findOne({
      where: { store, notification_type: "WhatsApp" },
    });

    if (!notification) {
      throw new Error("Notification details not found for the store");
    }
    const { api_key, password, header } = notification;
    let text = header;
    if (templateType === "rewards-program-expiring") {
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
      text = text.replace("{{2}}", `${whatsappDetails.rewardPoints}`);
      text = text.replace("{{3}}", `${whatsappDetails.expireDate}`);
    }
    const url = `https://media.smsgupshup.com/GatewayAPI/rest?userid=${api_key}&password=${password}&send_to=${whatsappDetails.phone_number}&v=1.1&format=json&msg_type=TEXT&method=sendMessage&msg=${text}`;
    // console.log(url, "url");
    const response = await axios.get(url);
    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendWhatsappSMSproductredemptionreminder = async (
  templateType,
  store,
  whatsappDetails
) => {
  try {
    const notification = await Notification.findOne({
      where: { store, notification_type: "WhatsApp" },
    });

    if (!notification) {
      throw new Error("Notification details not found for the store");
    }
    const { api_key, password, header } = notification;
    let text = header;
    if (templateType === "exclusive-product-redemption-reminder") {
      text = text.replace("{{1}}", `${whatsappDetails.redemedBy}`);
    }
    const url = `https://media.smsgupshup.com/GatewayAPI/rest?userid=${api_key}&password=${password}&send_to=${whatsappDetails.phone_number}&v=1.1&format=json&msg_type=TEXT&method=sendMessage&msg=${text}`;
    // console.log(url, "url");
    const response = await axios.get(url);
    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendWhatsappSMSshopavailableproducts = async (
  templateType,
  store,
  whatsappDetails
) => {
  try {
    const notification = await Notification.findOne({
      where: { store, notification_type: "WhatsApp" },
    });

    if (!notification) {
      throw new Error("Notification details not found for the store");
    }
    const { api_key, password, header } = notification;
    let text = header;
    if (templateType === "shop-with-available-reward-points") {
      text = text.replace("{{1}}", `${whatsappDetails.redemedBy}`);
    }
    const url = `https://media.smsgupshup.com/GatewayAPI/rest?userid=${api_key}&password=${password}&send_to=${whatsappDetails.phone_number}&v=1.1&format=json&msg_type=TEXT&method=sendMessage&msg=${text}`;
    // console.log(url, "url");
    const response = await axios.get(url);
    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendWhatsappSMSbirthday = async (
  templateType, store, whatsappDetails
) => {
  try {
    const notification = await Notification.findOne({
      where: { store, notification_type: "WhatsApp" },
    });

    if (!notification) {
      throw new Error("Notification details not found for the store");
    }
    const { api_key, password, header } = notification;
    let text = header;
    if (templateType === "happy-birthday") {
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
    }
    const url = `https://media.smsgupshup.com/GatewayAPI/rest?userid=${api_key}&password=${password}&send_to=${whatsappDetails.phone_number}&v=1.1&format=json&msg_type=TEXT&method=sendMessage&msg=${text}`;
    // console.log(url, "url");
    const response = await axios.get(url);
    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendWhatsappSMSanniversary = async (
  templateType,
  store,
  whatsappDetails
) => {
  try {
    const notification = await Notification.findOne({
      where: { store, notification_type: "WhatsApp" },
    });

    if (!notification) {
      throw new Error("Notification details not found for the store");
    }
    const { api_key, password, header } = notification;
    let text = header;
    if (templateType === "happy-marriage-anniversary") {
      text = text.replace("{{1}}", `${whatsappDetails.redemedBy}`);
    }
    const url = `https://media.smsgupshup.com/GatewayAPI/rest?userid=${api_key}&password=${password}&send_to=${whatsappDetails.phone_number}&v=1.1&format=json&msg_type=TEXT&method=sendMessage&msg=${text}`;
    // console.log(url, "url");
    const response = await axios.get(url);
    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendWhatsappSMSnewrewardearned = async (
  templateType,
  store,
  whatsappDetails
) => {
  try {
    const notification = await Notification.findOne({
      where: { store, notification_type: "WhatsApp" },
    });

    if (!notification) {
      throw new Error("Notification details not found for the store");
    }
    const { api_key, password, header } = notification;
    let text = header;
    if (templateType === "new-reward-points-earned") {
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
      text = text.replace("{{2}}", `${whatsappDetails.newRewardPoints}`);
      text = text.replace("{{3}}", `${whatsappDetails.priceValue}`);
    }
    const url = `https://media.smsgupshup.com/GatewayAPI/rest?userid=${api_key}&password=${password}&send_to=${whatsappDetails.phone_number}&v=1.1&format=json&msg_type=TEXT&method=sendMessage&msg=${text}`;
    // console.log(url, "url");
    const response = await axios.get(url);
    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendWhatsappSMStierdowngrade = async (
  templateType, store, whatsappDetails
) => {
  try {
    const notification = await Notification.findOne({
      where: { store, notification_type: "WhatsApp" },
    });

    if (!notification) {
      throw new Error("Notification details not found for the store");
    }
    const { api_key, password, header } = notification;
    let text = header;
    if (templateType === "tier-downgrade") {
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
      text = text.replace("{{2}}", `${whatsappDetails.newTier}`);
    }
    const url = `https://media.smsgupshup.com/GatewayAPI/rest?userid=${api_key}&password=${password}&send_to=${whatsappDetails.phone_number}&v=1.1&format=json&msg_type=TEXT&method=sendMessage&msg=${text}`;
    // console.log(url, "url");
    const response = await axios.get(url);
    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendWhatsappSMSexclusiveoffer = async (
  templateType,
  store,
  whatsappDetails
) => {
  try {
    const notification = await Notification.findOne({
      where: { store, notification_type: "WhatsApp" },
    });

    if (!notification) {
      throw new Error("Notification details not found for the store");
    }
    const { api_key, password, header } = notification;
    let text = header;
    if (templateType === "exclusive-redemption-offer") {
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
    }
    const url = `https://media.smsgupshup.com/GatewayAPI/rest?userid=${api_key}&password=${password}&send_to=${whatsappDetails.phone_number}&v=1.1&format=json&msg_type=TEXT&method=sendMessage&msg=${text}`;
    // console.log(url, "url");
    const response = await axios.get(url);
    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const sendEmailConfig = async (templateType, store, whatsappDetails) => {
  try {
    var subject, text;
    // let text = header;
    if (templateType === "reward-points-earned") {
      text = 'Dear {{1}},\n\nThank you for shopping with Rajnigandha. With your recent purchase, you have earned {{2}} points.\nYour total points are {{3}}. Happy Shopping! \n\nTeam DS Group';
      subject = 'Reward Points Earned'
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
      text = text.replace("{{2}}", `${whatsappDetails.usedPoints}`);
      text = text.replace("{{3}}", `${whatsappDetails.balance_point}`);
    }
    else if (templateType === "reward-points-redeemed") {
      text = "Dear {{1}}, \n\nThanks for redeeming {{2}} from the Rajniganda Reward Catalogue! ðŸŽ‰ You've used {{3}} points, and your current balance is now {{4}}. Keep earning loyalty points and enjoy more rewards! \n\nTeam DS Group"
      subject = 'Reward Points Redeemed'
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
      text = text.replace("{{2}}", `${whatsappDetails.redeemablePoints}`);
      text = text.replace("{{3}}", `${whatsappDetails.redeemPoint}`);
      text = text.replace("{{4}}", `${whatsappDetails.balancePoint}`);
    } else if (templateType === "reward-points-updated") {
      text = "Dear {{1}}, \n\nYour Rajnigandha Reward Program point balance as on {{2}} is {{3}}.\n\nTeam DS Group"
      subject = 'Points Balance Updated'
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
      text = text.replace("{{2}}", `${whatsappDetails.points}`);
      text = text.replace("{{3}}", `${whatsappDetails.balancePoint}`);
    } else if (templateType === "tier-upgrade") {
      text = "Dear {{1}}, \n\nCongratulations! You've been upgraded to {{2}} Tier in our Rajnigandha Rewards program. Enjoy the additional benefits. \n\nDS Group"
      subject = 'Tier Upgrade'
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
      text = text.replace("{{2}}", `${whatsappDetails.newTier}`);
    } else if (templateType === "tier-downgrade") {
      text = "Dear {{1}}, \n\nYour Tier in our Rajnigandha Rewards program id downgraded to {{2}}.\n\nDS Group"
      subject = 'Tier Downgrade'
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
      text = text.replace("{{2}}", `${whatsappDetails.newTier}`);
    } else if (templateType === "rewards-program-expiring") {
      text = "Dear {{1}}, \n\nAs per the Rajnigandha Reward program policy your {{2}} reward points will get expired on {{3}}. Hurry! Redeem your points today.\n\nDS Group"
      subject = 'Reward Points Expiring'
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
      text = text.replace("{{2}}", `${whatsappDetails.rewardPoints}`);
      text = text.replace("{{3}}", `${whatsappDetails.expireDate}`);
    } else if (templateType === "new-reward-points-earned") {
      text = "Dear {{1}}, \n\nYou have earned {{2}} reward points against your purchase of {{3}} at Rajnigandha.com.\n\nDS Group"
      subject = 'New Reward Points Earned'
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
      text = text.replace("{{2}}", `${whatsappDetails.newRewardPoints}`);
      text = text.replace("{{3}}", `${whatsappDetails.priceValue}`);
    } else if (templateType === "rewards-program-enrollment") {
      text = "Dear {{1}}, \n\nWelcome to Rajnigandha Reward Program - An exclusive loyalty program for Rajnigandha connoisseurs to enjoy the distinctive rewards.\n\nDS Group"
      subject = 'Rewards Program Enrollment'
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
    } else if (templateType === "rewards-program-benefits") {
      text = "Dear {{1}}, \n\nEach reward is bigger and better than the last. Take a look at the complete Rajnigandha Reward Program Experience, Click Here : {{2}}.\n\nTeam DS Group"
      subject = 'Rewards Program Benefits'
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
      text = text.replace("{{2}}", `${whatsappDetails.benefitLink}`);
    } else if (templateType === "rewards-program-update") {
      text = "Dear {{1}}, \n\nWe've made updates to our rewards program. Review the new features and benefit {{2}}.\n\nTeam DS Group"
      subject = 'Rewards Program Update'
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
      text = text.replace("{{2}}", `${whatsappDetails.benefit}`);
    }
    else if (templateType === "exclusive-redemption-offer") {
      text = "Dear {{1}}, \n\nExciting news! Redeem your reward points for exclusive products available only to you!\n\nTeam DS Group"
      subject = 'Exclusive Redemption Offer'
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
    }
    else if (templateType === "points-redemption-for-exclusive-products") {
      text = "Dear {{1}}, \n\nExciting news! Redeem your reward points for exclusive products available only to you!\n\nTeam DS Group"
      subject = 'Points Redemption for Exclusive Products'
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
    }
    else if (templateType === "new-exclusive-products-available") {
      text = "Dear {{1}}, \n\nWe have updated our reward catalogue with new exclusive products. Redeem Now {{2}}\n\nTeam DS Group"
      subject = 'New Exclusive Products Available'
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
      text = text.replace("{{2}}", `${whatsappDetails.redeemNow}`);
    } else if (templateType === "exclusive-product-redemption-reminder") {
      text = "Dear {{1}}, \n\nReminder: Your reward points can be used to redeem exclusive products. Act fast!\n\nDS Group"
      subject = 'Exclusive Product Redemption Reminder'
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
    }
    else if (templateType === "shop-with-available-reward-points") {
      text = "Dear {{1}}, \n\nYour reward points are ready to be used! Shop now withyour available points.\n\nDS Group"
      subject = 'Shop with Available Reward Points'
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
    }
    else if (templateType === "happy-birthday") {
      text = "Dear {{1}}, \n\nHappy Birthday! Wishing you a fantastic day filled with joy and surprises.\n\nTeam DS Group"
      subject = 'Birthday'
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
    }
    else if (templateType === "happy-marriage-anniversary") {
      text = "Dear {{1}}, \n\nTeam Rajnigandha wishes you a Happy Marriage Anniversary.\n\nDS Group"
      subject = 'Marriage Anniversary'
      text = text.replace("{{1}}", `${whatsappDetails.first_name}`);
    }
    else if (templateType === "product-dispatched") {
      text = "We have dispatched {{1}} items via {{2}} (Courier Consignment No. {{3}}) dated {{4}}. If you do not receive the courier within 7 days, please call us at 0120-4032446/445/4032200.\n\nTeam DS Group"
      subject = 'Product Dispatched'
      text = text.replace("{{1}}", `${whatsappDetails.giftName}`);
      text = text.replace("{{2}}", `${whatsappDetails.courierPartner}`);
      text = text.replace("{{3}}", `${whatsappDetails.awbId}`);
      text = text.replace("{{4}}", `${whatsappDetails.createdIstAt}`);
    }
    const mailOptions = {
      from: `rewards@rajnigandha.com`,
      to: whatsappDetails.email,
      subject: subject,
      text: text
    };
    const send = await transporter.sendMail(mailOptions);
    console.log("Mail sent successfully:", send.response);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
  }
};

export const handleNotifications = async (
  templateType,
  store,
  notificationDetails
) => {
  try {
    const notifications = await Notification.findAll({
      where: {
        store,
        notification_type: ["SMS", "WhatsApp", "Email"],
      },
      attributes: ["notification_type", "status"],
    });
    // console.log("notifications-----", notifications);

    const notificationMap = notifications.reduce((acc, notification) => {
      acc[notification.notification_type] = notification;
      return acc;
    }, {});

    const promises = [];
    if (notificationMap["SMS"]?.status === "active") {
      if (templateType === "reward-points-earned") {
        promises.push(sendSMS(templateType, store, notificationDetails));
      } else if (templateType === "reward-points-redeemed") {
        promises.push(
          sendSMSredemption(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "reward-points-updated") {
        promises.push(
          sendSMSbalanceupdate(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "points-redemption-for-exclusive-products") {
        promises.push(
          sendSMSredemptionexclusiveproducts(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "new-exclusive-products-availablenew-exclusive-products-available") {
        promises.push(
          sendSMSnewexclusiveproducts(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "tier-upgrade") {
        promises.push(
          sendSMStierupgrade(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "rewards-program-benefitsrewards-program-benefits") {
        promises.push(
          sendSMSprogrambenefits(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "rewards-program-update") {
        promises.push(
          sendSMSprogramupdate(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "rewards-program-enrollment") {
        promises.push(
          sendSMSprogramenrollment(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "rewards-program-expiring") {
        promises.push(
          sendSMSprogramexpiring(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "exclusive-product-redemption-reminder") {
        promises.push(
          sendSMSproductredemptionreminder(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "shop-with-available-reward-points") {
        promises.push(
          sendSMSshopavailableproducts(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "happy-birthday") {
        promises.push(
          sendSMSbirthday(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "happy-marriage-anniversary") {
        promises.push(
          sendSMSanniversary(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "new-reward-points-earned") {
        promises.push(
          sendSMSnewrewardearned(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "tier-downgrade") {
        promises.push(
          sendSMStierdowngrade(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "exclusive-redemption-offer") {
        promises.push(
          sendSMSexclusiveoffer(templateType, store, notificationDetails)
        );
      }
    }

    // Example: Add WhatsApp or Email handlers here if needed
    if (notificationMap["WhatsApp"]?.status === "active") {
      if (templateType === "reward-points-earned") {
        promises.push(sendWhatsappSMS(templateType, store, notificationDetails));
      } else if (templateType === "reward-points-redeemed") {
        promises.push(
          sendWhatsappSMSredemption(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "reward-points-updated") {
        promises.push(
          sendWhatsappSMSbalanceupdate(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "points-redemption-for-exclusive-products") {
        promises.push(
          sendWhatsappSMSredemptionexclusiveproducts(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "rewards-program-update") {
        promises.push(
          sendWhatsappSMSprogramupdate(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "tier-upgrade") {
        promises.push(
          sendWhatsappSMStierupgrade(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "rewards-program-benefits") {
        promises.push(
          sendWhatsappSMSprogrambenefits(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "new-exclusive-products-available") {
        promises.push(
          sendWhatsappSMSnewexclusiveproducts(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "rewards-program-enrollment") {
        promises.push(
          sendSMSprogramenrollment(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "rewards-program-expiring") {
        promises.push(
          sendWhatsappSMSprogramexpiring(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "exclusive-product-redemption-reminder") {
        promises.push(
          sendWhatsappSMSproductredemptionreminder(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "shop-with-available-reward-points") {
        promises.push(
          sendWhatsappSMSshopavailableproducts(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "happy-birthday") {
        promises.push(
          sendWhatsappSMSbirthday(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "happy-marriage-anniversary") {
        promises.push(
          sendWhatsappSMSanniversary(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "new-reward-points-earned") {
        promises.push(
          sendSMSnewrewardearned(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "tier-downgrade") {
        promises.push(
          sendWhatsappSMStierdowngrade(templateType, store, notificationDetails)
        );
      }
      else if (templateType === "exclusive-redemption-offer") {
        promises.push(
          sendWhatsappSMSexclusiveoffer(templateType, store, notificationDetails)
        );
      }
    }
    if (notificationMap["Email"]?.status === "active") {
      promises.push(sendEmailConfig(templateType, store, notificationDetails))
    }
    await Promise.all(promises);
    console.log("Notifications sent successfully.");
  } catch (error) {
    console.error("Error handling notifications:", error.message);
    throw error; // Re-throw the error to handle it in the calling function
  }
};
// const customerData = {
//     redemedBy: "Rajnigandha" // Replace with actual data as needed
//   };
// sendSMSredemption("7409329671","rajnigandha","reward-points-redeemed",customerData);

const sendOrderPdfOverMailContent = (templateObject) => {
  let templ = `<html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <body>
      <section id="containt" style="background-color: #ffffff9a;">     
          <div class="text" style="background-color:#1c2257;text-align: center;padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500; word-spacing: 0.2rem; color: #fff;margin-top: 5px;"><h2>Rajnigandha Loyalty</h2></div>
          <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500; word-spacing: 0.2rem;margin-top: 5px;">
              <p>Dear <span id="user">${templateObject.name}</span>, <p></p>
              <p style="font-size: 0.95rem;">
              Welcome to our Rajnigandha Loyalty.<br>
              Please find attached the order PDF for the purchase. Below are the details of the Order:<br>
              Order Name: ${templateObject.orderId}<br>
              Purchase Date : ${templateObject.purchaseDate}
              <br>
                  <br>Thank you for purchasing with us!
              </p>        
              <p>
                  Best Regards,<br/>
                  Rajnigandha Loyalty
              </p>
              <p>
              </p>
          </div>      
      </section>
  </body>
  </html>
`;
  return templ;
};

export const sendOrderPdfOverMail = async(whatsappDetails)=>{
  try {
      const { email, name, orderId, order_pdf_name, base64EncodedFile, purchaseDate } = whatsappDetails;
    const htmlContent = sendOrderPdfOverMailContent({ name, orderId, purchaseDate });
    const mailOptions = {
      from: "rewards@rajnigandha.com",
      to: email,
      subject: `Purchase Order Detail ${orderId} from Rajnigandha Loyalty`,
      html: htmlContent, 
      attachments: [
        {
          filename: `${order_pdf_name}.pdf`,
          content: base64EncodedFile,
          encoding: "base64",
          contentType: "application/pdf"
        }
      ]
    };

    const send = await transporter.sendMail(mailOptions);
    console.log("Mail sent successfully with PDF:", send.response);
    return;  
    
  } catch (error) {
      console.log("Send Order Pdf Over Mail Error ::>>",error);
  }
};

