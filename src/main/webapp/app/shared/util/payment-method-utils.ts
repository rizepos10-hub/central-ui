export const formatTransactionMethodLabel = (method?: string | null) => {
  if (!method) {
    return '-';
  }

  return method
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};
