import { errorHandler, responseHandler, transporter, statusMaker, } from './index'

export const sendEmailForWelcomeCustomer = async (req, res) => {
    try {
        console.log("transporte----------",transporter);
        let sendEmail = await transporter.sendMail({
            from: 'kajal.kumari@ens.enterprises',
            to: 'kumarikajal89681@gmail.com',
            subject: 'Testing Email',
            text: 'Welcome Customer'
        })
        console.log("sednEMail------", sendEmail);

        if (sendEmail) {
            const resp = responseHandler(statusMaker.found, "Email sent successfully", [])
            return res.status(statusMaker.found).json(resp)
        } else {
            const resp = responseHandler(statusMaker.internalError, "Email not sent", [])
            return res.status(statusMaker.internalError).json(resp)
        }
    } catch (error) {
        console.log("err----------",error);
        const resp = errorHandler(error)
        return res.status(statusMaker.internalError).json(resp)
    }
}

