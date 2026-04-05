const { body, param, query, validationResult } = require('express-validator');

// ─── Helper: ejecuta validaciones y responde con errores si hay ───────────────
const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Datos inválidos en la solicitud',
            errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
        });
    }
    next();
};

// ─── Regex permitidos ─────────────────────────────────────────────────────────
const MATRICULA_REGEX = /^[a-zA-Z0-9]{4,20}$/;
const USERNAME_REGEX  = /^[a-zA-Z0-9_.\-]{3,50}$/;
const SAFE_TEXT_REGEX = /^[^<>"';&\\]+$/; // bloquea caracteres de inyección

// ─── Valores permitidos en ENUM ───────────────────────────────────────────────
const VALID_STATUSES = [
    'Pendiente',
    'Empresa Seleccionada',
    'Documentos Iniciales Enviados',
    'En Revisión Inicial',
    'Documentos Generados',
    'Documentos Finales Enviados',
    'En Revisión Final',
    'Finalizado',
    'Rechazado'
];

const VALID_STAGES = [
    'catalogo-empresas',
    'documentos-iniciales',
    'revision-inicial',
    'documentos-generados',
    'documentos-finales',
    'revision-final',
    'finalizado'
];

const VALID_ADMIN_ROLES = ['ADMIN', 'ENCARGADO_CARRERA'];

// ─── Auth ─────────────────────────────────────────────────────────────────────

exports.validateCheckMatricula = [
    body('matricula')
        .trim()
        .notEmpty().withMessage('La matrícula es requerida')
        .matches(MATRICULA_REGEX).withMessage('Matrícula inválida: solo letras y números, 4-20 caracteres')
        .escape(),
    handleValidation
];

exports.validateSendCode = [
    body('matricula')
        .trim()
        .notEmpty().withMessage('Matrícula requerida')
        .matches(MATRICULA_REGEX).withMessage('Matrícula inválida')
        .escape(),
    body('email')
        .trim()
        .notEmpty().withMessage('Correo requerido')
        .isEmail().withMessage('Formato de correo inválido')
        .normalizeEmail()
        .isLength({ max: 254 }).withMessage('Correo demasiado largo'),
    handleValidation
];

exports.validateVerifyCode = [
    body('matricula')
        .trim()
        .notEmpty().withMessage('Matrícula requerida')
        .matches(MATRICULA_REGEX).withMessage('Matrícula inválida')
        .escape(),
    body('code')
        .trim()
        .notEmpty().withMessage('Código requerido')
        .isLength({ min: 6, max: 6 }).withMessage('Código debe ser de 6 dígitos')
        .isNumeric().withMessage('Código solo puede contener números'),
    handleValidation
];

exports.validateSetPassword = [
    body('matricula')
        .trim()
        .notEmpty().withMessage('Matrícula requerida')
        .matches(MATRICULA_REGEX).withMessage('Matrícula inválida')
        .escape(),
    body('password')
        .notEmpty().withMessage('Contraseña requerida')
        .isLength({ min: 8, max: 128 }).withMessage('Contraseña: 8-128 caracteres')
        .matches(/[A-Z]/).withMessage('Contraseña debe tener al menos una mayúscula')
        .matches(/[a-z]/).withMessage('Contraseña debe tener al menos una minúscula')
        .matches(/[0-9]/).withMessage('Contraseña debe tener al menos un número')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Contraseña debe tener al menos un carácter especial'),
    handleValidation
];

exports.validateForgotPassword = [
    body('matricula')
        .trim()
        .notEmpty().withMessage('Matrícula requerida')
        .matches(MATRICULA_REGEX).withMessage('Matrícula inválida')
        .escape(),
    handleValidation
];

exports.validateLoginStudent = [
    body('matricula')
        .trim()
        .notEmpty().withMessage('Matrícula requerida')
        .matches(MATRICULA_REGEX).withMessage('Formato de matrícula inválido')
        .escape(),
    body('password')
        .notEmpty().withMessage('Contraseña requerida')
        .isLength({ max: 128 }).withMessage('Contraseña demasiado larga'),
    handleValidation
];

exports.validateLoginAdmin = [
    body('username')
        .trim()
        .notEmpty().withMessage('Usuario requerido')
        .matches(USERNAME_REGEX).withMessage('Usuario inválido: solo letras, números, guiones y puntos')
        .isLength({ max: 50 }).withMessage('Usuario demasiado largo')
        .escape(),
    body('password')
        .notEmpty().withMessage('Contraseña requerida')
        .isLength({ max: 128 }).withMessage('Contraseña demasiado larga'),
    handleValidation
];

// ─── Param: matrícula en URL ──────────────────────────────────────────────────

exports.validateMatriculaParam = [
    param('matricula')
        .trim()
        .notEmpty().withMessage('Matrícula requerida en la URL')
        .matches(MATRICULA_REGEX).withMessage('Matrícula inválida en la URL')
        .escape(),
    handleValidation
];

// ─── Param: ID numérico en URL ────────────────────────────────────────────────

exports.validateIdParam = [
    param('id')
        .notEmpty().withMessage('ID requerido')
        .isInt({ min: 1 }).withMessage('ID debe ser un número entero positivo'),
    handleValidation
];

// ─── Students ────────────────────────────────────────────────────────────────

exports.validateAdvanceStage = [
    body('status')
        .trim()
        .notEmpty().withMessage('status es requerido')
        .isIn(VALID_STATUSES).withMessage(`status inválido. Valores permitidos: ${VALID_STATUSES.join(', ')}`),
    body('currentStage')
        .trim()
        .notEmpty().withMessage('currentStage es requerido')
        .isIn(VALID_STAGES).withMessage(`currentStage inválido. Valores permitidos: ${VALID_STAGES.join(', ')}`),
    handleValidation
];

exports.validateSelectCompany = [
    body('companyId')
        .notEmpty().withMessage('companyId es requerido')
        .isInt({ min: 1 }).withMessage('companyId debe ser un número positivo'),
    handleValidation
];

exports.validateChangePassword = [
    body('currentPassword')
        .notEmpty().withMessage('Contraseña actual requerida')
        .isLength({ max: 128 }).withMessage('Contraseña demasiado larga'),
    body('newPassword')
        .notEmpty().withMessage('Nueva contraseña requerida')
        .isLength({ min: 8, max: 128 }).withMessage('Nueva contraseña: mínimo 8 caracteres')
        .matches(/[A-Z]/).withMessage('Debe tener al menos una mayúscula')
        .matches(/[a-z]/).withMessage('Debe tener al menos una minúscula')
        .matches(/[0-9]/).withMessage('Debe tener al menos un número')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Debe tener al menos un carácter especial'),
    handleValidation
];

exports.validateStudentSearch = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('page debe ser entero ≥ 1'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('limit debe ser entre 1 y 100'),
    query('search')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('búsqueda demasiado larga')
        .matches(/^[a-zA-ZÀ-ÿ0-9\s\-_]*$/).withMessage('Caracteres inválidos en búsqueda')
        .escape(),
    query('careerName')
        .optional()
        .trim()
        .isLength({ max: 150 }).withMessage('careerName demasiado largo')
        .escape(),
    handleValidation
];

// ─── Companies ────────────────────────────────────────────────────────────────

exports.validateCreateCompany = [
    body('name')
        .trim()
        .notEmpty().withMessage('El nombre de la empresa es requerido')
        .isLength({ max: 200 }).withMessage('Nombre demasiado largo')
        .matches(SAFE_TEXT_REGEX).withMessage('El nombre contiene caracteres no permitidos')
        .escape(),
    body('address')
        .optional()
        .trim()
        .isLength({ max: 300 }).withMessage('Dirección demasiado larga')
        .escape(),
    body('contact')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('Contacto demasiado largo')
        .escape(),
    body('businessLine')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('Giro demasiado largo')
        .escape(),
    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Formato de correo inválido')
        .normalizeEmail()
        .isLength({ max: 254 }),
    body('phone')
        .optional()
        .trim()
        .matches(/^[0-9\s\+\-\(\)]{0,20}$/).withMessage('Teléfono inválido: solo números, espacios y +-()')
        .isLength({ max: 20 }),
    body('available')
        .optional()
        .isBoolean().withMessage('available debe ser true o false'),
    body('maxStudents')
        .optional()
        .isInt({ min: 1, max: 50 }).withMessage('maxStudents debe ser entre 1 y 50'),
    handleValidation
];

exports.validateUpdateCompany = [
    body('name')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('Nombre demasiado largo')
        .matches(SAFE_TEXT_REGEX).withMessage('El nombre contiene caracteres no permitidos')
        .escape(),
    body('address')
        .optional()
        .trim()
        .isLength({ max: 300 }).withMessage('Dirección demasiado larga')
        .escape(),
    body('contact')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('Contacto demasiado largo')
        .escape(),
    body('businessLine')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('Giro demasiado largo')
        .escape(),
    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Formato de correo inválido')
        .normalizeEmail()
        .isLength({ max: 254 }),
    body('phone')
        .optional()
        .trim()
        .matches(/^[0-9\s\+\-\(\)]{0,20}$/).withMessage('Teléfono inválido'),
    body('available')
        .optional()
        .isBoolean().withMessage('available debe ser true o false'),
    body('maxStudents')
        .optional()
        .isInt({ min: 1, max: 50 }).withMessage('maxStudents debe ser entre 1 y 50'),
    handleValidation
];

exports.validateCompanySearch = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('page debe ser entero ≥ 1'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('limit debe ser entre 1 y 100'),
    query('search')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('búsqueda demasiado larga')
        .escape(),
    query('careerId')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('careerId demasiado largo')
        .matches(/^[a-zA-Z0-9\-_]*$/).withMessage('careerId contiene caracteres inválidos'),
    handleValidation
];

// ─── Admins ───────────────────────────────────────────────────────────────────

exports.validateCreateAdmin = [
    body('username')
        .trim()
        .notEmpty().withMessage('Nombre de usuario requerido')
        .matches(USERNAME_REGEX).withMessage('Usuario inválido: solo letras, números, guiones y puntos (3-50 chars)')
        .isLength({ min: 3, max: 50 }),
    body('password')
        .notEmpty().withMessage('Contraseña requerida')
        .isLength({ min: 8, max: 128 }).withMessage('Contraseña: 8-128 caracteres'),
    body('role')
        .optional()
        .trim()
        .isIn(VALID_ADMIN_ROLES).withMessage(`Rol inválido. Permitidos: ${VALID_ADMIN_ROLES.join(', ')}`),
    body('assignedCareers')
        .optional()
        .isArray().withMessage('assignedCareers debe ser un arreglo')
        .custom((arr) => arr.every(c => typeof c === 'string' && c.length <= 100))
        .withMessage('Cada carrera debe ser un string válido'),
    handleValidation
];

exports.validateUpdateAdmin = [
    body('assignedCareers')
        .optional()
        .isArray().withMessage('assignedCareers debe ser un arreglo')
        .custom((arr) => arr.every(c => typeof c === 'string' && c.length <= 100))
        .withMessage('Cada carrera debe ser un string válido'),
    handleValidation
];

// ─── Careers ──────────────────────────────────────────────────────────────────

exports.validateCreateCareer = [
    body('id')
        .trim()
        .notEmpty().withMessage('ID de carrera requerido')
        .matches(/^[a-zA-Z0-9\-]{2,50}$/).withMessage('ID inválido: solo letras, números y guiones'),
    body('name')
        .trim()
        .notEmpty().withMessage('Nombre de carrera requerido')
        .isLength({ max: 300 }).withMessage('Nombre demasiado largo')
        .escape(),
    body('type')
        .trim()
        .notEmpty().withMessage('Tipo requerido')
        .isIn(['Ingeniería', 'Licenciatura', 'TSU']).withMessage('Tipo inválido'),
    handleValidation
];

exports.validateUpdateCareer = [
    body('name')
        .optional()
        .trim()
        .isLength({ max: 300 }).withMessage('Nombre demasiado largo')
        .escape(),
    body('type')
        .optional()
        .trim()
        .isIn(['Ingeniería', 'Licenciatura', 'TSU']).withMessage('Tipo inválido'),
    handleValidation
];

// ─── Param: career ID (string slug) ──────────────────────────────────────────

exports.validateCareerIdParam = [
    param('id')
        .trim()
        .notEmpty().withMessage('ID de carrera requerido')
        .matches(/^[a-zA-Z0-9\-]{2,50}$/).withMessage('ID de carrera inválido'),
    handleValidation
];
