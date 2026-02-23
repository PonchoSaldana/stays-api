const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'stays_ut_tecam_secret_2026';

/** Genera un JWT para un estudiante autenticado. */
const generateStudentToken = (student) => {
    return jwt.sign(
        { matricula: student.matricula, name: student.name, role: 'student' },
        SECRET,
        { expiresIn: '8h' }
    );
};

/** Genera un JWT para un administrador. */
const generateAdminToken = (admin) => {
    return jwt.sign(
        { id: admin.id || 0, username: admin.username, role: admin.role || 'ADMIN' },
        SECRET,
        { expiresIn: '8h' }
    );
};

/** Middleware — verifica cualquier JWT válido (student o admin). */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

    if (!token) return res.status(401).json({ message: 'Token requerido' });

    jwt.verify(token, SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Token inválido o expirado' });
        req.user = decoded;
        next();
    });
};

/** Middleware — sólo administradores (ADMIN o ROOT). */
const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Token requerido' });

    jwt.verify(token, SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Token inválido o expirado' });
        if (decoded.role !== 'ADMIN' && decoded.role !== 'ROOT') {
            return res.status(403).json({ message: 'Acceso solo para administradores' });
        }
        req.user = decoded;
        next();
    });
};

/** Middleware — sólo ROOT. */
const verifyRoot = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Token requerido' });

    jwt.verify(token, SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Token inválido o expirado' });
        if (decoded.role !== 'ROOT') {
            return res.status(403).json({ message: 'Acceso solo para root' });
        }
        req.user = decoded;
        next();
    });
};

module.exports = { generateStudentToken, generateAdminToken, verifyToken, verifyAdmin, verifyRoot };
