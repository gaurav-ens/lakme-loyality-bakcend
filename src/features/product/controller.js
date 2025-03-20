import dotenv from 'dotenv';

import {
  responseHandler,
  errorHandler,
  statusMaker,
  apiMessages,
  product
} from "./index";

dotenv.config();

export async function createProduct(req,res){
    try{
        const {productName,productWeightage}=req.body;
        const data=req.body
        const productExist = await product.findOne({ where: { productName: productName, productWeightage: productWeightage} });
        if(productExist)
        {
            const response = responseHandler(
                statusMaker.found,
                "This product already exist",
                productExist
              );
          
              return res.status(statusMaker.found).json(response);
        }
        await product.create(data);

        const response = responseHandler(statusMaker.created, apiMessages.create, data);
        return res.status(statusMaker.created).json(response);
    } 
    catch (error) {
        console.error("Error in create product:", error.message);
        const response = errorHandler(error);
        return res.status(statusMaker.internalError).json(response);
    }


}

export async function getProduct(req,res){
    try{
        const data=await product.findAll();
        if(data.length==0){
            return res
            .status(statusMaker.notFound)
            .json(responseHandler(statusMaker.notFound, apiMessages.notFound));
        }
        const response = responseHandler(statusMaker.found, apiMessages.found, data);
        return res.status(statusMaker.found).json(response);
    } 
    catch (error) {
        console.error("Error in find product:", error.message);
        const response = errorHandler(error);
        return res.status(statusMaker.internalError).json(response);
    }

}

export async function updateProduct(req,res){
    try{
        const {productName,productWeightage,id}=req.body;
        const data=req.body
        const productExist = await product.findOne({ where: { id: id} });
        if(productExist){
            const updated = await product.update(data, {
                where: { id: id },
              });
          
              if (updated) {
                const updatedProduct = await product.findOne({ where: { id: id } });
                const response = responseHandler(
                  statusMaker.updated,
                  apiMessages.update,
                  updatedProduct
                );
                return res.status(statusMaker.updated).json(response);

                }
            }
        else{
            return res
            .status(statusMaker.notFound)
            .json(responseHandler(statusMaker.notFound, apiMessages.notFound));
        }

    } 
    catch (error) {
        console.error("Error in create product:", error.message);
        const response = errorHandler(error);
        return res.status(statusMaker.internalError).json(response);
    }


}

export async function deleteProduct(req,res){

        try {
          const { id } = req.params
          const existingProduct = await product.findOne({ where: { id } });
          if (!existingProduct) {
            const response = responseHandler(
              statusMaker.notFound,
              apiMessages.notFound,
              existingProduct
            );
            return res.status(statusMaker.notFound).json(response);
          }
          await product.destroy({
            where: { id },
          });
          const response = responseHandler(statusMaker.deleted, apiMessages.deleted, { id });
          return res.status(statusMaker.deleted).json(response);
        } 
        catch (error) {
          const response = errorHandler(error);
          return res.status(statusMaker.internalError).json(response);
        }

      
}