import { roles } from "../auth";
import {
  responseHandler,
  errorHandler,
  statusMaker,
  apiMessages,
  staff,
  checkUndefined,
  checkEmptyArray,
} from "./index";
import bcrypt from 'bcrypt';

export const create = async (req, res) => {
  try {
    const { name, email, password, phone_number, role_id, role_name, website, status, createdBy } =
      req.body;
      await staff.sync();
    if (!name || !email || !role_id || !password) {
      return res.status(statusMaker.badRequest).json({
        message:
          "Name, email, role ID, and role name are required.",
      });
    }
    const findStaff = await staff.findOne({
      where: {
        email: email
      },
      raw:true
    });
    if(findStaff){
      return res.status(statusMaker.badRequest).json({
        success:false,
        message: `Staff is already exists with this email: ${email}.`,
      });
    }
    const roleData = await roles.findOne({
          where: {
            id: role_id
          },
          raw:true
    });
    // console.log("DAta ::>>", roleData);
    if (!roleData) {
      return res.status(statusMaker.badRequest).json({
        success:false,
        message: `Role does not exist.`,
      });
    }
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    const newStaff = await staff.create({
      name,
      email,
      password:hash,
      phone_number,
      role_id,
      role_name:roleData.role_name,
      roleType:'admin',
      status,
      website,
      createdBy,
    });

    const response = responseHandler(
      statusMaker.created,
      apiMessages.create,
      newStaff
    );

    return res.status(statusMaker.created).json(response);
  } catch (error) {
    console.log("Error :>>",error);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const list = async (req, res) => {
  try {
    await staff.sync();
    const staffs = await staff.findAll({});
    const response = responseHandler(
      statusMaker.found,
      apiMessages.found,
      staffs
    );
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    console.log("Error :>>>",error);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const update = async (req, res) => {
  try {
    const { id, name, role_id, role_name, website } = req.body;
    const updateData = {};
    if (checkUndefined(name)) updateData.name = name;
    if (checkUndefined(role_id)) updateData.role_id = role_id;
    if (checkUndefined(role_name)) updateData.role_name = role_name;
    if (checkUndefined(website)) updateData.website = website;

    const [updated] = await staff.update(updateData, {
      where: { id },
    });

    if (updated) {
      const updatedStaff = await staff.findOne({ where: { id } });
      const response = responseHandler(
        statusMaker.updated,
        apiMessages.update,
        updatedStaff
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

    const existingStaff = await staff.findOne({ where: { id } });
    if (!existingStaff) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingStaff
      );
      return res.status(statusMaker.notFound).json(response);
    }

    const response = responseHandler(
      statusMaker.found,
      apiMessages.found,
      existingStaff
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
    const existingModule = await staff.findOne({ where: { id } });
    if (!existingModule) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingModule
      );
      return res.status(statusMaker.notFound).json(response);
    }
    await staff.destroy({
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

export const createAdmin = async (req, res) => {
  try {
    const { name, email, password, phone_number, store, website, role_name } = req.body;
      await staff.sync();
    if (!name || !email || !password) {
      return res.status(statusMaker.badRequest).json({
        message:
          "Name, email, role ID, and role name are required.",
      });
    }
    const perms = JSON.stringify(    {
      "Coupon_Management": {
          "enabled": true,
          "read": true,
          "write": true,
          "update": true,
          "delete": true
      },
      "Role_Staff_Management": {
          "enabled": true,
          "delete": true,
          "update": true,
          "write": true,
          "read": true
      },
      "Rule_Set": {
          "enabled": true,
          "read": true,
          "write": true,
          "update": true,
          "delete": true
      },
      "Transaction_Management": {
          "enabled": true,
          "read": true,
          "write": true,
          "update": true,
          "delete": true
      },
      "Customer_Management": {
          "enabled": true,
          "read": true,
          "write": true,
          "update": true,
          "delete": true
      },
      "Management": {
          "enabled": true,
          "read": true,
          "write": true,
          "update": true,
          "delete": true
      },
      "Redeem_Management": {
          "enabled": true,
          "read": true,
          "write": true,
          "update": true,
          "delete": true
      },
      "Redeem_History": {
          "enabled": true,
          "read": true,
          "write": true,
          "update": true,
          "delete": true
      },
      "Notification": {
          "enabled": true,
          "read": true,
          "write": true,
          "update": true,
          "delete": true
      },
      "Setting": {
          "enabled": true,
          "read": true,
          "write": true,
          "update": true,
          "delete": true
      },
      "Gift_Management": {
          "enabled": true,
          "read": true,
          "write": true,
          "update": true,
          "delete": true
      }
  });

    const addRole = await roles.create({
      name: role_name,
      status: "active",
      role: perms,
      roles: "superadmin",
      store: store,
      website: website || "rajnigandha"
    })
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    const newStaff = await staff.create({
      name,
      email,
      password:hash,
      phone_number,
      role_id:addRole.id,
      role_name:addRole.role_name,
      roleType:'superadmin',
      status:'active',
      store:'rajnigandha',
      website:website || 'rajnigandha',
      createdBy:'Superadmin',
    });

    const response = responseHandler(
      statusMaker.created,
      apiMessages.create,
      {staff:newStaff, role:addRole}
    );

    return res.status(statusMaker.created).json(response);
  } catch (error) {
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};