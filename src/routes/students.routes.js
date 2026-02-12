const express = require('express');
const router = express.Router();
const controller = require('../controllers/student.controller');

router.get('/', controller.findAll);
router.get('/:matricula', controller.findByMatricula);

// TODO: Move upload-docs logic to controller if needed later
router.post('/upload-docs', (req, res) => {
    res.json({ message: 'Documents uploaded' });
});

module.exports = router;
