export const roundTo = (value, decimals = 2) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  const factor = 10 ** decimals;
  return Math.round((numericValue + Number.EPSILON) * factor) / factor;
};

export const formatQuantity = (value) => {
  const roundedValue = roundTo(value, 2);
  return Number.isInteger(roundedValue) ? String(roundedValue) : roundedValue.toFixed(2);
};
