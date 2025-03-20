import { DataTypes } from "sequelize";
import DateTime from "../src/utils/getDateTime.js";
import sequelize from "../src/config/db.js";

export const Logger = sequelize.define("logger", {
  logId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
  },
  requestedPath: {
    type: DataTypes.TEXT,
  },
  requestedBody: {
    type: DataTypes.TEXT, // Changed from JSON to TEXT
  },
  account: {
    type: DataTypes.TEXT, // Changed from JSON to TEXT
  },
  status: {
    type: DataTypes.STRING,
  },
  message: {
    type: DataTypes.TEXT,
  },
  stack: {
    type: DataTypes.TEXT,
  },
  fromServer: {
    type: DataTypes.ENUM,
    values: ["OWN", "VOUCHAGRAM"],
    defaultValue: "OWN",
  }, source_of_device: {
    type: DataTypes.STRING(255),
    default: "lakme"
  },
  updateByStaff: {
    type: DataTypes.STRING,
  },
  createdIstAt: {
    type: DataTypes.STRING,
    defaultValue: DateTime(),
  },
  updatedIstAt: {
    type: DataTypes.STRING,
    defaultValue: DateTime(),
  },
});
