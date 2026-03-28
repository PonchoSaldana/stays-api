const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/career.controller');
const { verifyRoot } = require('../utils/jwt');

router.get('/', ctrl.getCareers); // Anyone (students and admins) might need to fetch careers. Should we protect it? Yes, we can make it public or require a token. For now, public is fine since it's just a list to populate selection dropdowns.
router.post('/', verifyRoot, ctrl.createCareer);
router.put('/:id', verifyRoot, ctrl.updateCareer);
router.delete('/:id', verifyRoot, ctrl.deleteCareer);

module.exports = router;
