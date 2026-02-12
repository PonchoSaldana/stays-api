const express = require('express');
const router = express.Router();
const controller = require('../controllers/company.controller');

router.get('/', controller.findAll);

// Keep existing POST for manual creation if needed, or refactor to controller
// For now, focusing on the List (GET) aspect requested.

module.exports = router;
