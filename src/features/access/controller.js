import {
  responseHandler,
  errorHandler,
  statusMaker,
  apiMessages,
  accessSchema,
  checkEmptyArray,
  storeHandler,
} from "./index";

export const create = async (req, res) => {
  try {
    const { store, shopname, access_token, apiVersion } = req.body;
    if (!store || !access_token || !shopname) {
      return res.status(statusMaker.badRequest).json({
        message: "store || shopname || accessToken are required.",
      });
    }
    const processedStore = await storeHandler(store);
    const newStore = await accessSchema.create({
      shopname,
      access_token,
      store: processedStore,
      apiVersion
    });
    const response = responseHandler(statusMaker.created, apiMessages.create, newStore);

    return res.status(statusMaker.created).json(response);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};


export const update = async (req, res) => {
  try {
    const { id, access_token, store, apiVersion } = req.body;
    // const processedStore = await storeHandler(store);
    const existingData = await accessSchema.findOne({
      where: { id, store },
    });

    if (!existingData) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingData
      );
      return res.status(statusMaker.notFound).json(response);
    }
    const updatedModule = await accessSchema.update(
      {
        access_token,
        apiVersion,
      },
      {
        where: { id, store },
        // returning: true
      }
    );
    const response = responseHandler(
      statusMaker.updated,
      apiMessages.update,
      updatedModule
    );
    res.status(statusMaker.updated).json(response);
  } catch (error) {
    const response = errorHandler(error);
    res.status(statusMaker.internalError).json(response);
  }
};

export const deleted = async (req, res) => {
  try {
    const { id } = req.query;
    const existingData = await accessSchema.findOne({ where: { id } });
    if (!existingData) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingData
      );
      return res.status(statusMaker.notFound).json(response);
    }
    await accessSchema.destroy({
      where: { id },
    });
    const response = responseHandler(statusMaker.deleted, apiMessages.deleted, {
      id,
    });
    return res.status(statusMaker.deleted).json(response);
  } catch (error) {
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const getById = async (req, res) => {
  try {
    const { id } = req.query;
    const existingData = await accessSchema.findOne({ where: { id } });
    if (!existingData) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingData
      );
      return res.status(statusMaker.notFound).json(response);
    }
    const response = responseHandler(
      statusMaker.found,
      apiMessages.found,
      existingData
    );
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const list = async (req, res) => {
  try {
    const { store } = req.query;
    //   const processedStore = await storeHandler(store);
    const listData = await accessSchema.findAll({
      where: {
        store: store,
      },
    });
    if (checkEmptyArray(listData)) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        listData
      );
      return res.status(statusMaker.success).json(response);
    }
    const response = responseHandler(
      statusMaker.found,
      apiMessages.found,
      listData
    );
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};
