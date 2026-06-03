export const UNITS = {
  g: { label: 'grams (g)', dimension: 'WEIGHT', factor: 1 },
  kg: { label: 'kilograms (kg)', dimension: 'WEIGHT', factor: 1000 },
  mL: { label: 'milliliters (mL)', dimension: 'VOLUME', factor: 1 },
  L: { label: 'liters (L)', dimension: 'VOLUME', factor: 1000 },
  items: { label: 'items (count)', dimension: 'COUNT', factor: 1 },
};

/**
 * Checks if two units belong to the same dimension and are compatible.
 */
export const areUnitsCompatible = (unitA, unitB) => {
  if (!UNITS[unitA] || !UNITS[unitB]) return false;
  return UNITS[unitA].dimension === UNITS[unitB].dimension;
};

/**
 * Converts a quantity from one unit to another.
 */
export const convertQuantity = (quantity, fromUnit, toUnit) => {
  if (!areUnitsCompatible(fromUnit, toUnit)) {
    throw new Error(`Incompatible units: Cannot convert from ${fromUnit} to ${toUnit}`);
  }
  const fromFactor = UNITS[fromUnit].factor;
  const toFactor = UNITS[toUnit].factor;
  return quantity * (fromFactor / toFactor);
};

/**
 * Calculates the price in INR for an ordered quantity in an ordered unit.
 */
export const calculatePrice = (orderedQuantity, orderedUnit, baseUnit, pricePerBaseUnit) => {
  try {
    const convertedQty = convertQuantity(orderedQuantity, orderedUnit, baseUnit);
    return Number((convertedQty * pricePerBaseUnit).toFixed(4));
  } catch (error) {
    return 0;
  }
};

/**
 * Get all units compatible with a given unit
 */
export const getCompatibleUnits = (unit) => {
  if (!UNITS[unit]) return [];
  const targetDimension = UNITS[unit].dimension;
  return Object.keys(UNITS).filter((key) => UNITS[key].dimension === targetDimension);
};
