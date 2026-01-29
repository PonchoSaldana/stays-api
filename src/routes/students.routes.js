const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'List of students' });
});

router.post('/upload-docs', (req, res) => {
    // TODO: Implement file upload logic
    res.json({ message: 'Documents uploaded' });
});

module.exports = router;
