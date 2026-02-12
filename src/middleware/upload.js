const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads/'));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-be-${file.originalname}`);
    },
});

const uploadFile = multer({ storage: storage });
module.exports = uploadFile;
