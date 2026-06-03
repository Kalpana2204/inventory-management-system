const UNITS = {
  g: { dimension: 'WEIGHT', factor: 1 },
  kg: { dimension: 'WEIGHT', factor: 1000 },
  mL: { dimension: 'VOLUME', factor: 1 },
  L: { dimension: 'VOLUME', factor: 1000 },
  items: { dimension: 'COUNT', factor: 1 },
};

/**
 * Checks if two units belong to the same dimension and are compatible for conversion.
 * @param {string} unitA
 * @param {string} unitB
 * @returns {boolean}
 */
const areUnitsCompatible = (unitA, unitB) => {
  if (!UNITS[unitA] || !UNITS[unitB]) return false;
  return UNITS[unitA].dimension === UNITS[unitB].dimension;
};

/**
 * Converts a quantity from one unit to another.
 * @param {number} quantity
 * @param {string} fromUnit
 * @param {string} toUnit
 * @returns {number}
 */
const convertQuantity = (quantity, fromUnit, toUnit) => {
  if (!areUnitsCompatible(fromUnit, toUnit)) {
    throw new Error(`Incompatible units: Cannot convert from ${fromUnit} to ${toUnit}`);
  }
  const fromFactor = UNITS[fromUnit].factor;
  const toFactor = UNITS[toUnit].factor;
  return quantity * (fromFactor / toFactor);
};

/**
 * Calculates the price in INR for an ordered quantity in an ordered unit.
 * @param {number} orderedQuantity
 * @param {string} orderedUnit
 * @param {string} baseUnit
 * @param {number} pricePerBaseUnit
 * @returns {number}
 */
const calculatePrice = (orderedQuantity, orderedUnit, baseUnit, pricePerBaseUnit) => {
  const convertedQty = convertQuantity(orderedQuantity, orderedUnit, baseUnit);
  return Number((convertedQty * pricePerBaseUnit).toFixed(4)); // Store with up to 4 decimal places for precision
};

module.exports = {
  UNITS,
  areUnitsCompatible,
  convertQuantity,
  calculatePrice,
};
