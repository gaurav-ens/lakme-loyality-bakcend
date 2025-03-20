import { Logger } from "../../models/logger";

const VouchagramLog = async (requestedPath, requestedBody, status, message) => {
  try {
    await Logger.create({
      requestedPath: requestedPath,
      requestedBody: JSON.stringify(requestedBody), // Convert to string
      status: status,
      message: message,
      fromServer: "VOUCHAGRAM",
    });
  } catch (error) {
    console.log("Create Vouchagram Log Error ::>>", error);
    return error;
  }
};


export default VouchagramLog;