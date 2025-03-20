import {
  responseHandler,
  errorHandler,
  statusMaker,
  apiMessages,
  user,
  permission,
  roles,

  module,
  checkUndefined,
  checkEmptyArray,
} from "./index";

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


export const create = async (req, res) => {
  try {
    const { name, email, website, role_name,password } = req.body;
    if (!name || !email  || !role_name) {
      return res.status(statusMaker.badRequest).json({
        message: "Name, email and role_name are required.",
      });
    }
    const role = await roles.findOne({ where: { name: role_name } });
    if (!role) {
      return res.status(statusMaker.badRequest).json({
        message: `Role ${role_name} does not exist.`,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await user.create({
      name,
      email,
      website,
      roleId: role.id,
      role_name: role.name,
      roles,
      password:hashedPassword
    });
    const roleData = {
      id: role.id,
      name: role.name,
      status: role.status,
      roles: role.roles,
      role: JSON.parse(role.role),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
    const token = jwt.sign(
      {
        id: newUser.id,
        role: roleData
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1d' }
    );
    const response = responseHandler(statusMaker.created, apiMessages.create, {
      user: newUser,
      token,
    });

    return res.status(statusMaker.created).json(response);
  } catch (error) {
    console.error(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const list = async (req, res) => {
  try {
    // const { store } = req.query;
    // const processedStore = await storeHandler(store);
    const users = await user.findAll(
    );
    // const users = await user.findAll();
    const filteredModules = users.filter(user => user.id !== 1);
    if (checkEmptyArray(users)) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        filteredModules
      );
      return res.status(statusMaker.notFound).json(response);
    }

    const response = responseHandler(
      statusMaker.found,
      apiMessages.found,
      filteredModules
    );

    return res.status(statusMaker.found).json(response);
  } catch (error) {
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const update = async (req, res) => {
  try {
    const { id,name, role_name,status,email } = req.body;
    const updateData = {};
    if (checkUndefined(name)) updateData.name = name;
    if (checkUndefined(role_name)) updateData.role_name = role_name;
    // if (checkUndefined(password)) updateData.password = password;
    if (checkUndefined(status)) updateData.status = status;
    if (checkUndefined(email)) updateData.email = email;

    const [updated] = await user.update(updateData, {
      where: { id: id },
    });

    if (updated) {
      const updatedUser = await user.findOne({ where: { id: id } });
      const response = responseHandler(
        statusMaker.updated,
        apiMessages.update,
        updatedUser
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
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const getById = async (req, res) => {
  try {
    const { id } = req.query;

    const existingUser = await user.findOne({ where: { id } });
    if (!existingUser) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingUser
      );
      return res.status(statusMaker.notFound).json(response);
    }

    const response = responseHandler(
      statusMaker.found,
      apiMessages.found,
      existingUser
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
    const existingUser = await user.findOne({ where: { id } });
    if (!existingUser) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingUser
      );
      return res.status(statusMaker.notFound).json(response);
    }
    await module.destroy({
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
