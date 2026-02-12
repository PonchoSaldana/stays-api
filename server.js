const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (for uploaded docs)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads dir exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Internships Management System API' });
});

// Database Init
const db = require('./src/models');
// db.sequelize.sync(); // Already called in index.js but good to have explicit reference or just let require handle it if it executes.
// In models/index.js I put sync() call.

// Routes placeholders
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/companies', require('./src/routes/companies.routes'));
app.use('/api/students', require('./src/routes/students.routes'));
app.use('/api/import', require('./src/routes/import.routes'));

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
