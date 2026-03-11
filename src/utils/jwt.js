const jwt = require('jsonwebtoken');

// clave secreta para firmar y verificar tokens; usar variable de entorno en producción
const SECRET = process.env.JWT_SECRET || 'stays_ut_tecam_secret_2026';

// genera un token jwt para un alumno autenticado (dura 8 horas)
const generateStudentToken = (student) => {
    return jwt.sign(
        { matricula: student.matricula, name: student.name, role: 'student' },
        SECRET,
        { expiresIn: '8h' }
    );
};

// genera un token jwt para un administrador (dura 8 horas)
const generateAdminToken = (admin) => {
    return jwt.sign(
        { id: admin.id || 0, username: admin.username, role: admin.role || 'ADMIN' },
        SECRET,
        { expiresIn: '8h' }
    );
};

// middleware: verifica cualquier jwt válido (alumno o admin)
// adjunta los datos decodificados a req.user
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // formato: "Bearer <token>"

    if (!token) return res.status(401).json({ message: 'token requerido' });

    jwt.verify(token, SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'token inválido o expirado' });
        req.user = decoded;
        next();
    });
};

// middleware: solo permite acceso a roles ADMIN o ROOT
const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'token requerido' });

    jwt.verify(token, SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'token inválido o expirado' });
        // rechazar si no es admin ni root
        if (decoded.role !== 'ADMIN' && decoded.role !== 'ROOT') {
            return res.status(403).json({ message: 'acceso solo para administradores' });
        }
        req.user = decoded;
        next();
    });
};

// middleware: solo permite acceso al rol ROOT
const verifyRoot = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'token requerido' });

    jwt.verify(token, SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'token inválido o expirado' });
        if (decoded.role !== 'ROOT') {
            return res.status(403).json({ message: 'acceso solo para root' });
        }
        req.user = decoded;
        next();
    });
};

module.exports = { generateStudentToken, generateAdminToken, verifyToken, verifyAdmin, verifyRoot };
