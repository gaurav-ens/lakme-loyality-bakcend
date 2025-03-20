import {
  responseHandler,
  errorHandler,
  statusMaker,
  apiMessages,
  roles,
  user,
  storeHandler
} from "./index";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { staff } from "../Staff";

export const login = async (req, res) => {
  const { email, password } = req.body;

  // Validate input fields
  if (!email || email === "") {
    return res.status(statusMaker.badRequest).json({
      message: "Email is required.",
    });
  } else if (!password || password === "") {
    return res.status(statusMaker.badRequest).json({
      message: "Password is required.",
    });
  }

  try {
    // Fetch user data
    const userData = await staff.findOne({
      where: {
        email: email,
        status:'active'
      },
      raw:true
    });
    // Check if user exists
    if (!userData) {
      return res.status(statusMaker.notFound).json({
        message: "Invalid Credentials",
      });
    }

    // Verify password
    const isPasswordMatched = await bcrypt.compare(password, userData.password); 
    if (!isPasswordMatched) {
      return res.status(statusMaker.notFound).json({
        message: "Invalid credentials with email or password",
      });
    }
    const roleData = await roles.findOne({
      where: {
        id: userData.role_id
      },
      raw:true
    });

    if (!roleData) {
      return res.status(statusMaker.badRequest).json({
        success:false,
        message: `Role ${userData.role_name} does not exist.`,
      });
    }
    const { password: userPassword, ...rest } = userData;
    let token = jwt.sign(
      {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        contact: userData.contact,
        website: userData.website,
        roles_def: userData.roles_def,
        role_name: userData.role_name,
        role_id:userData.role_id,
        roles: userData.roleType, 
        role_permissions: JSON.parse(roleData.role), 
        status: roleData.status,
        assignedBy: userData.assignedBy
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1d' } // Token expires in 1 day
    );
    const response = responseHandler(
      statusMaker.created,
      apiMessages.create,
      token
    );

    return res.status(statusMaker.created).json(response);
  } catch (error) {
    console.error("Login error:", error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const logout = async(req,res) =>{
  try{
    const response = {
      statusCode: statusMaker.success,
      message: "Logout successful",
    };
    return res.status(statusMaker.success).json(response);

  }catch(error){
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
}

export const resetPassword = async(req,res) => {
  try {
    let { email, oldPassword, password, newPassword, store } = req.body;
    if (!email || !oldPassword || !password || !newPassword) {
        const response = responseHandler(statusMaker.badRequest, "Missing required fields.");
        return res.status(statusMaker.badRequest).json(response);
    }
    const website = await storeHandler(store);

    const findUser = await user.findOne({ where: { email: email, store: website } });
    if (!findUser) {
        const response = responseHandler(statusMaker.notFound, "User not found.");
        return res.status(statusMaker.notFound).json(response);
    }

    const comparePass = await bcrypt.compare(oldPassword, findUser.password);
    if (!comparePass) {
        const response = responseHandler(statusMaker.unauthorized, "Old password is incorrect.");
        return res.status(statusMaker.unauthorized).json(response);
    }
    console.log("Password Comparison Result:", comparePass);

    if (password !== newPassword) {
        const response = responseHandler(statusMaker.badRequest, "Passwords do not match.");
        return res.status(statusMaker.badRequest).json(response);
    }
    const hashPass = await bcrypt.hash(password, 10);

    const [updatedRows] = await user.update(
        { password: hashPass },
        { where: { email: email, store: website } }
    );
    if (updatedRows === 0) {
        const response = responseHandler(statusMaker.internalError, "Password update failed.");
        return res.status(statusMaker.internalError).json(response);
    }
    const response = responseHandler(statusMaker.updated, "Password updated successfully.");
    return res.status(statusMaker.updated).json(response);

} catch (error) {
    const response = errorHandler(error.message);
    return res.status(statusMaker.internalError).json(response);
}

};

export const getById = async (req,res) =>{
  try{
    const { id }= req.query;
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
  }catch(error){
    console.log(error.message);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.query;
    const { name,username,email } = req.body;
    const existingUser = await user.findOne({ where: { id } });

    if (!existingUser) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        existingUser
      );
      return res.status(statusMaker.notFound).json(response);
    }
    await user.update(
      {
        name,
        username,
        email
      },
      {
        where: { id },
      }
    );
    const updatedUser = await user.findOne({ where: { id } });
    const response = responseHandler(
      statusMaker.updated,
      apiMessages.update,
      updatedUser
    );
    res.status(statusMaker.updated).json(response);
  } catch (error) {
    const response = errorHandler(error);
    res.status(statusMaker.internalError).json(response);
  }
};