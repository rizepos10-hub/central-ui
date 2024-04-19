export const applyMatchModeMap = (query: any) => {
  const matchModeMap = {
    contains: 'CONTAINS',
    startsWith: 'STARTS_WITH',
    endsWith: 'ENDS_WITH',
    equals: 'EQUALS',
    notEquals: 'NOT_EQUALS',
  };

  const updatedFilters = { ...query.filters };

  Object.keys(updatedFilters).forEach(key => {
    if (key !== 'attributes.attributeTerms.id') {
      const { value, matchMode } = updatedFilters[key];
      const updatedMatchMode = matchModeMap[matchMode];
      updatedFilters[key] = { value, matchMode: updatedMatchMode };

      if (value == null || value === '' || value === undefined) {
        delete updatedFilters[key];
      }
    }
  });

  const updatedFiltersFinal = updateTableFilters(updatedFilters);

  return {
    ...query,
    filters: updatedFiltersFinal,
  };
};


export const updateTableFilters = (filters) => {
  for (const key in filters) {
    if (key === 'attributes.attributeTerms.id') {
      if (filters[key].constraints.length === 0) {
        delete filters[key];
      }
    } else {
      if (filters[key].value === null || filters[key].value === undefined || filters[key].value === '') {
        delete filters[key];
      }
    }
  }
  return filters;
};

