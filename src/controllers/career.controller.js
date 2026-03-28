const db = require('../models');
const Career = db.Career;

const DEFAULT_CAREERS = [
    { id: 'ing-soft', name: 'Ingeniería en Desarrollo y Gestión de Software', type: 'Ingeniería' },
    { id: 'ing-red', name: 'Ingeniería en Redes Inteligentes y Ciberseguridad', type: 'Ingeniería' },
    { id: 'ing-ind', name: 'Ingeniería Industrial', type: 'Ingeniería' },
    { id: 'ing-mec', name: 'Ingeniería Mecatrónica', type: 'Ingeniería' },
    { id: 'ing-proc', name: 'Ingeniería en Procesos y Operaciones Industriales', type: 'Ingeniería' },
    { id: 'ing-man', name: 'Ingeniería en Mantenimiento Industrial', type: 'Ingeniería' },
    { id: 'ing-bio', name: 'Ingeniería en Procesos Bioalimentarios', type: 'Ingeniería' },
    { id: 'ing-agr', name: 'Ingeniería en Agricultura Sustentable y Protegida', type: 'Ingeniería' },
    { id: 'ing-neg', name: 'Ingeniería en Negocios y Gestión Empresarial', type: 'Ingeniería' },
    { id: 'ing-proy', name: 'Ingeniería en Gestión de Proyectos', type: 'Ingeniería' },
    { id: 'ing-fin', name: 'Ingeniería Financiera y Fiscal', type: 'Ingeniería' },
    { id: 'lic-con', name: 'Licenciatura en Contaduría', type: 'Licenciatura' },
    { id: 'lic-inn', name: 'Licenciatura en Innovación de Negocios y Mercadotecnia', type: 'Licenciatura' },
    { id: 'lic-cap', name: 'Licenciatura en Gestión del Capital Humano', type: 'Licenciatura' },
    { id: 'tsu-ti-soft', name: 'TSU en TI Área Desarrollo de Software Multiplataforma', type: 'TSU' },
    { id: 'tsu-ti-red', name: 'TSU en TI Área Infraestructura de Redes Digitales', type: 'TSU' },
    { id: 'tsu-pi-man', name: 'TSU en Procesos Industriales Área Manufactura', type: 'TSU' },
    { id: 'tsu-pi-auto', name: 'TSU en Procesos Industriales Área Automotriz', type: 'TSU' },
    { id: 'tsu-man-ind', name: 'TSU en Mantenimiento Área Industrial', type: 'TSU' },
    { id: 'tsu-mec-auto', name: 'TSU en Mecatrónica Área Automatización', type: 'TSU' },
    { id: 'tsu-dn-mer', name: 'TSU en Desarrollo de Negocios Área Mercadotecnia', type: 'TSU' },
    { id: 'tsu-adm-cap', name: 'TSU en Administración Área Capital Humano', type: 'TSU' },
    { id: 'tsu-adm-proy', name: 'TSU en Administración Área Formulación y Evaluación de Proyectos', type: 'TSU' },
    { id: 'tsu-con', name: 'TSU en Contaduría', type: 'TSU' },
    { id: 'tsu-ali', name: 'TSU en Procesos Alimentarios', type: 'TSU' },
    { id: 'tsu-agr', name: 'TSU en Agricultura Sustentable y Protegida', type: 'TSU' },
    { id: 'tsu-qui', name: 'TSU en Química Área Tecnología Ambiental', type: 'TSU' }
];

exports.getCareers = async (req, res) => {
    try {
        let careers = await Career.findAll({ order: [['type', 'ASC'], ['name', 'ASC']] });
        
        // Auto-seed si la base de datos está vacía
        if (careers.length === 0) {
            await Career.bulkCreate(DEFAULT_CAREERS);
            careers = await Career.findAll({ order: [['type', 'ASC'], ['name', 'ASC']] });
        }
        res.json(careers);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener carreras', error: err.message });
    }
};

exports.createCareer = async (req, res) => {
    try {
        const { id, name, type } = req.body;
        if (!id || !name || !type) return res.status(400).json({ message: 'Faltan datos de la carrera' });

        const newCareer = await Career.create({ id, name, type });
        res.status(201).json(newCareer);
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Ya existe una carrera con ese ID' });
        }
        res.status(500).json({ message: 'Error al crear carrera', error: err.message });
    }
};

exports.updateCareer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type } = req.body;
        
        const career = await Career.findByPk(id);
        if (!career) return res.status(404).json({ message: 'Carrera no encontrada' });

        await career.update({ name, type });
        res.json({ message: 'Carrera actualizada', career });
    } catch (err) {
        res.status(500).json({ message: 'Error al actualizar carrera', error: err.message });
    }
};

exports.deleteCareer = async (req, res) => {
    try {
        const { id } = req.params;
        const career = await Career.findByPk(id);
        if (!career) return res.status(404).json({ message: 'Carrera no encontrada' });

        await career.destroy();
        res.json({ message: 'Carrera eliminada' });
    } catch (err) {
        res.status(500).json({ message: 'Error al eliminar carrera', error: err.message });
    }
};
