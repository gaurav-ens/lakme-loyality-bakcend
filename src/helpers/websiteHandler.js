import crypto from 'crypto'

export const storeHandler = async(store) => {
    try {
        if(!store || store == '' || store == 'undefined'){
            store = 'lakme'
        }
        return store;
    } catch (error) {
        return error
    }
}

export function generateId() {
    return crypto.randomBytes(10).toString("hex");
  }