import dotenv from "dotenv";
dotenv.config();

export const config = {
    database              : process.env.MSSQLDATABASE,
    host                  : process.env.MSSQLHOST,
    password              : process.env.MSSQLPASSWORD,
    port                  : process.env.MSSQLPORT,
    user                  : process.env.MSSQLUSER,
    email_user            : process.env.EMAIL_USER,
    email_password        : process.env.EMAIL_PASSWORD,
    delivery_base_url     : process.env.DELHIVERY_BASE_URL,
    delivery_token        : process.env.DELHIVERY_TOKEN,
    shiprocket_token      : process.env.SHIPROCKET_TOKEN,
    shiproket_base_url    : process.env.SHIPROCKET_BASE_URL,
    accessToken    : process.env.ACCESSTOKEN
}

