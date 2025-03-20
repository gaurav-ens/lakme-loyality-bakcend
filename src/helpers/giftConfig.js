import multer from 'multer'
import path from 'path'

const giftStorageMulter = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/giftactivity')
    },
    filename: function (req, file, cb) {
         const fileArr = file.originalname.split('.');
         const fileName = fileArr[0]+"-"+Date.now()+path.extname(file.originalname);
         const filePath = `/giftactivity/${fileName}`;
         req.couponFile = {
           fileName,
           filePath
         },
         cb(null, fileName)
    }
});

// File filter function to allow only Excel files
const fileFilter = (req, file, cb) => {
    // Allowed extensions for Excel files
    const filetypes = /xls|xlsx|csv/;
    // Check file extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check MIME type
    const mimetype = file.mimetype === 'application/vnd.ms-excel' || 
                     file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                     file.mimetype === 'text/csv';

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      req.fileValidationError = "Only Excel files (.xls, .xlsx ,csv) are allowed!";
      // cb(new Error('Only Excel files (.xls, .xlsx ,csv) are allowed!'));
      return cb(null, true);
    }
  };

  export {giftStorageMulter,fileFilter}