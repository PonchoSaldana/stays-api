// limpia un valor de celda excel: quita espacios, reemplaza errores por '--'
const clean = (val) => {
    if (!val) return '';
    const str = String(val).trim();
    // las celdas con fórmulas de error de excel se reemplazan por placeholder
    if (str.startsWith('#') || str.includes('ERROR')) return '--';
    return str;
};

// busca el valor de una fila excel usando múltiples posibles nombres de columna
// útil porque los headers del excel pueden variar entre versiones
const getValue = (row, keys) => {
    const rowKeys = Object.keys(row);
    const foundKey = rowKeys.find(k => {
        const cleanKey = String(k).trim().toLowerCase();
        // busca coincidencia exacta o parcial con alguna clave esperada
        return keys.some(target => cleanKey === target.toLowerCase() || cleanKey.includes(target.toLowerCase()));
    });
    return foundKey ? row[foundKey] : undefined;
};

module.exports = { clean, getValue };
