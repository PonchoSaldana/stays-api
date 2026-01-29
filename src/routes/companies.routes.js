const express = require('express');
const router = express.Router();
// multer config for file uploads
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

// Mock Data
let companies = [
    { id: 1, name: 'Volkswagen de México', address: 'Autopista', contact: 'Juan Pérez', email: 'rh@vw.com.mx' }
];

router.get('/', (req, res) => {
    res.json(companies);
});

router.post('/', upload.single('file'), (req, res) => {
    const newCompany = {
        id: Date.now(),
        ...req.body,
        fileName: req.file ? req.file.filename : null
    };
    companies.push(newCompany);
    res.status(201).json(newCompany);
});

module.exports = router;
