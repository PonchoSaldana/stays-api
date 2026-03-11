const express = require('express');
const router = express.Router();
const db = require('../models');
const { verifyAdmin } = require('../utils/jwt');

// clave usada para guardar el proceso activo en la tabla configs
const CONFIG_KEY = 'activeProcess';

// obtiene el proceso activo desde la base de datos
async function getActiveProcess() {
    const row = await db.Config.findOne({ where: { key: CONFIG_KEY } });
    // si no existe la fila o el valor es nulo, no hay proceso activo
    if (!row || row.value === null || row.value === 'null') return null;
    const num = parseInt(row.value, 10);
    // solo acepta valores válidos: 1, 2 o 3
    return [1, 2, 3].includes(num) ? num : null;
}

// guarda o actualiza el proceso activo en la base de datos
async function setActiveProcess(value, updatedBy) {
    const strVal = value !== null ? String(value) : null;
    // upsert: inserta si no existe, actualiza si ya existe
    await db.Config.upsert({
        key: CONFIG_KEY,
        value: strVal,
        updatedBy: updatedBy || 'root'
    });
}

// get /api/config/process — endpoint público, alumnos consultan el proceso activo
router.get('/process', async (req, res) => {
    try {
        const activeProcess = await getActiveProcess();
        res.json({ activeProcess });
    } catch (err) {
        console.error('error al leer config:', err.message);
        // si falla la bd, devolver null para no bloquear a los alumnos
        res.json({ activeProcess: null });
    }
});

// put /api/config/process — solo root puede cambiar el proceso activo
router.put('/process', verifyAdmin, async (req, res) => {
    // verificar que el usuario sea root (doble check por seguridad)
    if (req.user?.role !== 'ROOT' && req.user?.username?.toLowerCase() !== 'root') {
        return res.status(403).json({ message: 'solo el usuario root puede modificar la configuración de procesos.' });
    }

    const { activeProcess } = req.body;

    // validar que el valor sea null, 1, 2 o 3
    if (activeProcess !== null && activeProcess !== undefined && ![1, 2, 3].includes(Number(activeProcess))) {
        return res.status(400).json({ message: 'el proceso activo debe ser null, 1, 2 o 3.' });
    }

    // convertir a número o dejar en null si se desactiva
    const newVal = (activeProcess !== null && activeProcess !== undefined)
        ? Number(activeProcess)
        : null;

    try {
        await setActiveProcess(newVal, req.user?.username || 'root');
        res.json({
            message: 'configuración de proceso actualizada.',
            activeProcess: newVal,
            updatedAt: new Date().toISOString(),
            updatedBy: req.user?.username || 'root'
        });
    } catch (err) {
        console.error('error al guardar config:', err.message);
        res.status(500).json({ message: 'error al guardar la configuración en la base de datos.' });
    }
});

module.exports = router;
