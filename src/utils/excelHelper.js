const clean = (val) => {
    if (!val) return '';
    const str = String(val).trim();
    if (str.startsWith('#') || str.includes('ERROR')) return '--';
    return str;
};

const getValue = (row, keys) => {
    const rowKeys = Object.keys(row);
    const foundKey = rowKeys.find(k => {
        const cleanKey = String(k).trim().toLowerCase();
        return keys.some(target => cleanKey === target.toLowerCase() || cleanKey.includes(target.toLowerCase()));
    });
    return foundKey ? row[foundKey] : undefined;
};

module.exports = { clean, getValue };
