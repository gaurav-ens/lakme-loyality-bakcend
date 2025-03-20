import {
  responseHandler,
  errorHandler,
  statusMaker,
  apiMessages,
  roles,
  checkUndefined,
  checkEmptyArray,
  storeHandler
} from "./index";
export const create = async (req, res) => {
  try {
    // const { store } = req.query; 
    const { name, status, role,store } = req.body;
    const processedStore = await storeHandler(store);
    // Validate input fields
    if (!name || !status || !role) {
      return res.status(statusMaker.badRequest).json({
        message: "Name, status, and role are required.",
      });
    }
    const roleString = JSON.stringify(role);

    // Create a new role in the database
    const newRole = await roles.create({
      name,
      status,
      store: processedStore,
      role: roleString
    });
    const responseData = {
      createdAt: newRole.createdAt,
      updatedAt: newRole.updatedAt,
      roles: newRole.roles,
      updatedBy: newRole.updatedBy,
      id: newRole.id,
      name: newRole.name,
      status: newRole.status,
      role: JSON.parse(newRole.role),
      store: newRole.store
    };

    // Send success response
    const response = responseHandler(
      statusMaker.created,
      apiMessages.create,
      responseData
    );

    return res.status(statusMaker.created).json(response);
  } catch (error) {
    console.error(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};


export const list = async (req, res) => {
  try {
    const { store } = req.query;
    const processedStore = await storeHandler(store);
    const modules = await roles.findAll({
      where:{
        store: processedStore
      }
    });
    const filteredModules = modules.filter(module => module.id !== 1);
    if (checkEmptyArray(modules)) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        filteredModules
      );
      return res.status(statusMaker.notFound).json(response);
    }
    const parsedModules = filteredModules.map(module => {
      return {
        ...module.dataValues,
        role: JSON.parse(module.role),
      };
    });
    
    const response = responseHandler(
      statusMaker.found,
      apiMessages.found,
      parsedModules
    );

    return res.status(statusMaker.found).json(response);
  } catch (error) {
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};


export const update = async (req, res) => {
  try {
    const { id, name, status, role,store } = req.body;
    const processedStore = await storeHandler(store);
    const updateData = {};
    if (checkUndefined(name)) updateData.name = name;
    if (checkUndefined(status)) updateData.status = status;
    if (checkUndefined(role)) updateData.role = JSON.stringify(role);
    const [updated] = await roles.update(updateData, {
      where: { id, store: processedStore },
    });

    if (updated) {
      const updatedRole = await roles.findOne({ where: { id,store: processedStore } });
      updatedRole.role = JSON.parse(updatedRole.role);

      const response = responseHandler(
        statusMaker.updated,
        apiMessages.update,
        updatedRole
      );
      return res.status(statusMaker.updated).json(response);
    } else {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        null
      );
      return res.status(statusMaker.notFound).json(response);
    }
  } catch (error) {
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};


export const getById = async (req, res) => {
  try {
    const { id } = req.query;
    const existingModule = await roles.findOne({ where: { id } });
    if (!existingModule) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingModule
      );
      return res.status(statusMaker.notFound).json(response);
    };
    existingModule.role= JSON.parse(existingModule.role);
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

export const deleted = async (req, res) => {
  try {
    const { id } = req.query;
    
    // Check if the module exists
    const existingModule = await roles.findOne({ where: { id } });
    if (!existingModule) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingModule
      );
      return res.status(statusMaker.notFound).json(response);
    }
    
    // Delete the found instance directly
    await existingModule.destroy();

    // Respond with a success message
    const response = responseHandler(statusMaker.deleted, apiMessages.delete, { id });
    return res.status(statusMaker.deleted).json(response);
  } catch (error) {
    // Handle errors gracefully
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

