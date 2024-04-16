export const applyMatchModeMap = (query: any ) => {
  const matchModeMap = {
    contains: 'CONTAINS',
    startsWith: 'STARTS_WITH',
    endsWith: 'ENDS_WITH',
    equals: 'EQUALS',
    notEquals: 'NOT_EQUALS',
  };

  const updatedFilters = { ...query.filters };
  Object.keys(updatedFilters).forEach(key => {
    const { value, matchMode } = updatedFilters[key];
    const updatedMatchMode = matchModeMap[matchMode];
    updatedFilters[key] = { value, matchMode: updatedMatchMode };
  });

  return {
    ...query,
    filters: updatedFilters
  };
};
