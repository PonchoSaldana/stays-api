const express = require('express');
const router = express.Router();

// Mock Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    // TODO: Implement actual logic
    if (username === 'admin' && password === 'admin') {
        return res.json({ token: 'mock-token-admin', user: { role: 'admin', name: 'Admin User' } });
    }
    return res.json({ token: 'mock-token-student', user: { role: 'student', name: 'Student User', matricula: username } });
});

module.exports = router;
