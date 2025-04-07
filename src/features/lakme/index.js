import {customer,accessSchema} from "../../../models/index"
import {statusMaker} from "../../helpers/statusmaker"
import {apiMessages} from "../../helpers/message"
import {responseHandler} from "../../helpers/responsehandler"
import {errorHandler} from "../../helpers/errorhandler"
import { registerCustomerForLakme,loginCustomerForLakme,getAllProducts } from "./controller"
import { config } from "../../config"

export  {
    customer,
    accessSchema,
    statusMaker,
    apiMessages,
    config,
    errorHandler,
    responseHandler,
    registerCustomerForLakme,
    loginCustomerForLakme,
    getAllProducts
}