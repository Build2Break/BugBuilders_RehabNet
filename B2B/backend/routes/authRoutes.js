const express = require('express');
const router = express.Router();
const { loginDoctor } = require('../controllers/authController');

router.post('/login', loginDoctor);

module.exports = router;
