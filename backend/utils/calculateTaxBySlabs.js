export const calculateTaxBySlabs = (
  taxableIncome,
  slabs
) => {

  let tax = 0;

  for (const slab of slabs) {

    const from = slab.fromAmount;

    const to =
      slab.toAmount ??
      taxableIncome;

    if (taxableIncome > from) {

      const taxablePart =
        Math.min(
          taxableIncome,
          to
        ) - from;

      tax +=
        (taxablePart *
          slab.percentage) /
        100;
    }
  }

  return Math.max(
    0,
    Math.round(tax)
  );
};