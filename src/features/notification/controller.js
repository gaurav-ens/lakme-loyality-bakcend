import {
  responseHandler,
  errorHandler,
  statusMaker,
  apiMessages,
  storeHandler,
  Notification,
  checkEmptyArray,
  //   templateSchema,
  Notification_new
} from "./index";

// export const create = async (req, res) => {
//   try {
//     const { type, username, password, api_key, access_token, store, status } =
//       req.body;
//     const website = await storeHandler(store);
//     if (
//       !type ||
//       !username ||
//       !password ||
//       !api_key ||
//       !access_token ||
//       !status
//     ) {
//       const rep = responseHandler(
//         statusMaker.badRequest,
//         "Missing required fields",
//         []
//       );
//       return res.status(statusMaker.badRequest).json(rep);
//     }
//     const newNotification = await Notification.create({
//       notification_type: type,
//       username,
//       password,
//       api_key,
//       access_token,
//       store: website,
//       status,
//     });
//     console.log(
//       "newNotification----------",
//       newNotification,
//       statusMaker.created,
//       apiMessages.create
//     );

//     if (!newNotification) {
//       const rep = responseHandler(
//         statusMaker.internalError,
//         apiMessages.errorOccurred,
//         []
//       );
//       return res.status(statusMaker.internalError).json(rep);
//     }
//     const rep = responseHandler(
//       statusMaker.created,
//       apiMessages.create,
//       newNotification
//     );
//     return res.status(statusMaker.created).json(rep);
//   } catch (error) {
//     console.log("err--------", error);
//     const resp = errorHandler(error);
//     return res.status(statusMaker.internalError).json(resp);
//   }
// };

export const list = async (req, res) => {
  try {
    const { store } = req.query;
    const website = await storeHandler(store);
    const findNotifications = await Notification_new.findAll({
      where: { store: website },
    });
    if (checkEmptyArray(findNotifications)) {
      const resp = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        findNotifications
      );
      return res.status(statusMaker.notFound).json(resp);
    }
    const resp = responseHandler(
      statusMaker.found,
      apiMessages.found,
      findNotifications
    );
    return res.status(statusMaker.found).json(resp);
  } catch (error) {
    const resp = errorHandler(error);
    return res.status(statusMaker.internalError).json(resp);
  }
};

export const update = async (req, res) => {
  try {
    const { id,store } = req.query;
    const { username,header,templateId,userId, status,password,name,api_key,access_token } = req.body;
    const processedStore = await storeHandler(store);
    const existingNotification = await Notification.findOne({ where: { id, store: processedStore } });

    if (!existingNotification) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingNotification
      );
      return res.status(statusMaker.notFound).json(response);
    }
    const updatedNotification = await Notification.update(
      {
        username,
        header,
        templateId,
        userId,
        password,
        name,
        api_key,
        access_token,
        status,
      },
      {
        where: { id, store: processedStore },
      }
    );
    const response = responseHandler(
      statusMaker.updated,
      apiMessages.update,
      updatedNotification
    );
    res.status(statusMaker.updated).json(response);
  } catch (error) {
    const response = errorHandler(error);
    res.status(statusMaker.internalError).json(response);
  }
};

export const deleted = async (req, res) => {
  try {
    const { id, store } = req.query;
    const website = await storeHandler(store);
    if (!id) {
      const rep = responseHandler(
        statusMaker.badRequest,
        "Missing required fields",
        []
      );
      return res.status(statusMaker.badRequest).json(rep);
    }
    const delNoti = await Notification.destroy({
      where: { id: id, store: website },
    });
    if (!delNoti) {
      const rep = responseHandler(
        statusMaker.internalError,
        apiMessages.errorOccurred,
        []
      );
      return res.status(statusMaker.internalError).json(rep);
    }
    const rep = responseHandler(statusMaker.deleted, apiMessages.deleted, []);
    return res.status(statusMaker.deleted).json(rep);
  } catch (error) {
    const resp = errorHandler(error);
    return res.status(statusMaker.internalError).json(resp);
  }
};

export const createSMSTemplate = async (req, res) => {
  try {
    const {
      notification_type,
      username,
      password,
      templateType,
      templateId,
      header,
      store,
      api_key,
    } = req.body;
    const processedStore = await storeHandler(store);
    const newTemplate = await Notification.create({
      notification_type,
      username,
      password,
      templateType,
      templateId,
      header,
      store: processedStore,
      api_key
    });

    const response = responseHandler(
      statusMaker.created,
      apiMessages.create,
      newTemplate
    );

    return res.status(statusMaker.created).json(response);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};


export const createOrUpdateNotification = async (req, res) => {
  try {
    const {
      id,
      sms_cred,
      whatsapp_cred,
      mail_cred,
      store,
      source_of_device = "website", 
    } = req.body;
    if (id) {
      const existingRecord = await Notification_new.findOne({ where: { id } });

      if (existingRecord) {
        await existingRecord.update({
          sms_cred: JSON.stringify(sms_cred),
          whatsapp_cred: JSON.stringify(whatsapp_cred),
          mail_cred: JSON.stringify(mail_cred),
          store,
          source_of_device,
        });
        return res.status(statusMaker.updated).json(
          responseHandler(statusMaker.updated, apiMessages.update, existingRecord)
        );
      }
    }
    const newRecord = await Notification_new.create({
      sms_cred: JSON.stringify(sms_cred),
      whatsapp_cred: JSON.stringify(whatsapp_cred),
      mail_cred: JSON.stringify(mail_cred),
      store,
      source_of_device,
    });
    return res.status(statusMaker.created).json(
      responseHandler(statusMaker.created, apiMessages.create, newRecord)
    );
  } catch (error) {
    console.error("Error in createOrUpdateNotification:", error);
    return res.status(statusMaker.internalError).json(
      errorHandler(error)
    );
  }
};
