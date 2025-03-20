import otpGenerator from "otp-generator";
import axios from "axios";

const otpSMS = (phoneNo, name) => {
  const userName = "dsgroupotp.api";
  const userPassword = "M8%2453b7p,";
  const userFrom = "DSDSHA";

  const userPhone = phoneNo.phone.replace(/^\+91/, "");
  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
  });

  const userMessage = `Dear ${name}, ${otp} is the OTP to reset your credentials and is valid for 6 minutes. For further assistance, please contact system administrator. Team DiSha By DS Group`;

  const url = `https://api2.growwsaas.com/fe/api/v1/multiSend?username=${userName}&password=${userPassword}&unicode=false&from=${userFrom}&to=${userPhone}&text=${encodeURIComponent(
    userMessage
  )}`;

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: url,
    headers: {
      "Content-Type": "application/json",
    },
  };

  axios
    .request(config)
    .then((response) => {
      console.log("API call was successful. Response data:", response.data);
    })
    .catch((error) => {
      console.log("Error:", error);
    });
};

const phoneNo = { phone: "+919315229335" };
const name = "John";
console.log(otpSMS(phoneNo, name));
