import dotenv from 'dotenv';
import crypto from "crypto";

dotenv.config();

export const encryption = (data)=>{
    try{

       const key = process.env.VOUCHAGRAM_KEY
       const iv =  process.env.VOUCHAGRAM_IV

        if(typeof data == "object"){ 
            data = JSON.stringify(data);
        }

            const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
            let encrypted = cipher.update(data);
            encrypted = Buffer.concat([encrypted, cipher.final()]);const
            encryptedStr = encrypted.toString('base64'); 

            return encryptedStr

    }catch(err){
        console.log("error to encrypt token", err);
        return "fail to encrypt token"
    }
}

export const decryption = (data)=>{
    try{
        const key = process.env.VOUCHAGRAM_KEY
        const iv =  process.env.VOUCHAGRAM_IV

        const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
        const decrypted = decipher.update(data, 'base64');
        var decryptedData = Buffer.concat([decrypted, decipher.final()]).toString();

        return JSON.parse(decryptedData)
    }catch(err){
        console.log("error to decrypt token", err);
        return "fail to decrypt token"
    }
}

export const zillionEncryption = (data)=>{
    try {
        const staticIv = process.env.ZILLION_STATIC_IV;
        const encKeyForHash = process.env.ZILLION_ENCDECR_KEY;

        const textToEncrypt = Buffer.from(JSON.stringify(data));
        const cipher = 'aes-256-gcm';
        const key = crypto.createHash('sha256').update(encKeyForHash).digest().slice(0, 32);
        const iv = Buffer.from(staticIv).slice(0, crypto.getCipherInfo(cipher).ivLength);

        const cipherInstance = crypto.createCipheriv(cipher, key, iv);
        let ciphertext = cipherInstance.update(textToEncrypt);
        ciphertext = Buffer.concat([ciphertext, cipherInstance.final()]);
        const tag = cipherInstance.getAuthTag();

        const encryptedData = Buffer.concat([iv, ciphertext, tag]);
        return encryptedData.toString('base64');
    } catch (error) {
        console.log("Z-Error to Encrypt Token", error);
        return "Z-Error to Encrypt Token";
    }
}

export const zillionDecryption = (encryptedData)=>{
    try {
        const staticIv = process.env.ZILLION_STATIC_IV;
        const encKeyForHash = process.env.ZILLION_ENCDECR_KEY;

        const encrypted = Buffer.from(encryptedData, 'base64');
        const cipher = 'aes-256-gcm';
        const key = crypto.createHash('sha256').update(encKeyForHash).digest().slice(0, 32);
        const ivLength = crypto.getCipherInfo(cipher).ivLength;
        const tagLength = 16;
        const iv = Buffer.from(staticIv).slice(0, ivLength);

        const ciphertextLength = encrypted.length - ivLength - tagLength;
        const ciphertext = encrypted.slice(ivLength, ivLength + ciphertextLength);
        const tag = encrypted.slice(ivLength + ciphertextLength, ivLength + ciphertextLength + tagLength);

        const decipher = crypto.createDecipheriv(cipher, key, iv);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(ciphertext);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return JSON.parse(decrypted.toString());
    } catch (error) {
        console.log("Z-Error to Decrypt Token", error);
        return "Z-Error to Decrypt Token";
    }
}

