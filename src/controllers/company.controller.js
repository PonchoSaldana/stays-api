const db = require('../models');
const Company = db.Company;

exports.findAll = async (req, res) => {
    try {
        const companies = await Company.findAll();
        res.send(companies);
    } catch (err) {
        res.status(500).send({
            message: err.message || "Some error occurred while retrieving companies."
        });
    }
};
