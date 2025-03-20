import nodemailer from 'nodemailer'
// import { config } from '../config/index';

// export const transporter = nodemailer.createTransport({
//         service:'gmail',
//         auth: {
//             user: config.email_user,
//             pass: config.email_password
//           }
//     })

export const transporter = nodemailer.createTransport({
  host: "live.smtp.mailtrap.io",
  port: 587,
  secure: false,
  auth: {
    user: "smtp@mailtrap.io",
    pass: "5c13e99d989548719897ebd447e420eb",
  },
});

