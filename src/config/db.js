import Sequelize from "sequelize";
import { config } from "../config";  // Assuming config contains your database connection details

// Create a Sequelize instance with MSSQL dialect

//  const sequelize = new Sequelize(config.database, config.user,config.password, {
//     host: "localhost",
//     dialect: "mssql",  // Specifies MSSQL as the dialect
//     port: 1433, // MSSQL port, typically 1433
//     logging: false,    // Disable logging; set to `true` to see SQL logs
//     dialectOptions: {
//       options: {
//         encrypt: false, // Optional, depending on whether you're using encryption
//         trustServerCertificate: true // Optional, use when you're in development or self-signed certificates
//      },
//     },
//  });


// const sequelize = new Sequelize(config.database, config.user,config.password, {
//   host: "206.189.142.148",
//   dialect: "mssql", 
//   port: 1433, 
//   authentication: {
//    type: 'default'
// },
// options: {
//    encrypt: true
// }
// });

const sequelize = new Sequelize(config.database, config.user, config.password, {
  host: config?.host,
  dialect: "mssql",
  port: 1433,

  pool: {
    max: 10,
    min: 0,
    acquire: 60000,
    idle: 10000,
  },

  dialectOptions: {
    options: {
      encrypt: true,
      trustServerCertificate: true,
      requestTimeout: 60000,
      connectionTimeout: 60000,
      cancelTimeout: 5000,
      packetSize: 32768,
      enableArithAbort: true,
      validateBulkLoadParameters: true,
    },
    connectTimeout: 60000,

    maxBulkRows: 1000,
  },

  logging: false,
  retry: {
    max: 3,
    match: [
      /ETIMEDOUT/,
      /EHOSTUNREACH/,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /ETIMEDOUT/,
      /ESOCKETTIMEDOUT/,
      /EHOSTUNREACH/,
      /EPIPE/,
      /EAI_AGAIN/,
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/
    ],
    backoffBase: 1000,
    backoffExponent: 1.5,
  },

  benchmark: false,
  timezone: '+00:00',
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
    return sequelize.sync({ force: false });  // Sync models without dropping tables
  })
  .then(() => {
    console.log("All models were synchronized successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

export default sequelize;