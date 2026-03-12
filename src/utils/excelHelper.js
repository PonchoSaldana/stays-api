// normaliza un string quitando acentos y pasándolo a minúsculas
const normalizeStr = (str) => {
    if (!str) return '';
    return String(str)
        .normalize('NFD') // descompone los caracteres (ej. 'á' -> 'a' + '´')
        .replace(/[\u0300-\u036f]/g, '') // elimina diacríticos/acentos
        .trim()
        .toLowerCase();
};

// limpia un valor de celda excel: quita espacios, reemplaza errores por '--'
const clean = (val) => {
    if (val === undefined || val === null || val === '') return '';
    const str = String(val).trim();
    // las celdas con fórmulas de error de excel se reemplazan por placeholder
    if (str.startsWith('#') || str.includes('ERROR')) return '--';
    return str;
};

// busca el valor de una fila excel usando múltiples posibles nombres de columna
// útil porque los headers del excel pueden variar y contener acentos
const getValue = (row, keys) => {
    const rowKeys = Object.keys(row);
    const normalizedKeys = keys.map(normalizeStr);

    const foundKey = rowKeys.find(k => {
        const cleanKey = normalizeStr(k);
        // busca coincidencia exacta o parcial ignorando acentos y mayúsculas
        return normalizedKeys.some(target => cleanKey === target || cleanKey.includes(target));
    });
    return foundKey ? row[foundKey] : undefined;
};

module.exports = { clean, getValue };
