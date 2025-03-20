import jwt from 'jsonwebtoken';
import { statusMaker } from '../helpers/statusmaker';
// import { RuleSetModified } from '../../models/index';

export const verifyToken = (req, res, next) => {
  let token = req.headers['access-token'];
  if (!token) {
    return res.status(statusMaker.unauthorized).json({
      success:false,
      message: "Unauthorised access!",
    });
  }
  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(statusMaker.unauthorized).json({
        success:false,
        message: "Failed to authenticate token!",
      });
    }
    if (decoded.roles !== 'admin' && decoded.roles !== 'superadmin') {
      return res.status(statusMaker.forbidden).json({
        success:false,
        message: "Access denied!",
      });
    }
    req.user = decoded;
    next();
  });
};


