import {
  responseHandler,
  errorHandler,
  statusMaker,
  apiMessages,
  permission,
  checkEmptyArray,
  storeHandler
} from "./index";

export const create = async (req, res) => {
  try {
    // const { store } = req.query; 
    const { name,store } = req.body;
    if (!name) {
      return res.status(statusMaker.badRequest).json({
        message: "Name, status, and role are required.",
      });
    }
    const processedStore = await storeHandler(store);
    const newRole = await permission.create({
      name,
      store: processedStore
    });

    const response = responseHandler(
      statusMaker.created,
      apiMessages.create,
      newRole
    );

    return res.status(statusMaker.created).json(response);
  } catch (error) {
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const update = async (req, res) => {
  try {
    // const { store } = req.query;
    const { id, name,status,store } = req.body;
    const processedStore = await storeHandler(store);
    const existingModule = await permission.findOne({ where: { id, store: processedStore } });

    if (!existingModule) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingModule
      );
      return res.status(statusMaker.notFound).json(response);
    }
    const updatedModule = await permission.update(
      {
        name,
        status
      },
      {
        where: { id, store: processedStore},
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
    const existingModule = await permission.findOne({ where: { id } });
    if (!existingModule) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingModule
      );
      return res.status(statusMaker.notFound).json(response);
    }
    await permission.destroy({
      where: { id },
    });
    const response = responseHandler(statusMaker.deleted, apiMessages.delete, {
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
    const existingModule = await permission.findOne({ where: { id } });
    if (!existingModule) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingModule
      );
      return res.status(statusMaker.notFound).json(response);
    }
    const response = responseHandler(
      statusMaker.found,
      apiMessages.found,
      existingModule
    );
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const list = async (req, res) => {
  try {
    const { store }= req.query;
    const processedStore = await storeHandler(store);
    const modules = await permission.findAll({
      where: {
        store: processedStore
      }
    });
    if (checkEmptyArray(modules)) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        modules
      );
      return res.status(statusMaker.notFound).json(response);
    }
    const response = responseHandler(
      statusMaker.found,
      apiMessages.found,
      modules
    );
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};
