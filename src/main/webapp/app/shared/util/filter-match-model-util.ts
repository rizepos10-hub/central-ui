export const applyMatchModeMap = (query: any) => {
  const matchModeMap = {
    startswith: 'STARTS_WITH',
    contains: 'CONTAINS',
    endswith: 'ENDS_WITH',
    equals: 'EQUALS',
    notequals: 'NOT_EQUALS'
  };

  const updatedFilters: any = {};

  Object.keys(query.filters).forEach(key => {
    const filter = query.filters[key];

    if (filter.operator && Array.isArray(filter.constraints)) {
      const updatedConstraints = filter.constraints
        .map((constraint: any) => {
          if (constraint.value == null || constraint.value === '') {
            return null;
          }
          const mapKey = constraint.matchMode.toLowerCase().replace(/_/g, '');
          const updatedMatchMode = matchModeMap[mapKey] || constraint.matchMode;
          return { ...constraint, matchMode: updatedMatchMode };
        })
        .filter(Boolean);

      if (updatedConstraints.length > 0) {
        updatedFilters[key] = { ...filter, constraints: updatedConstraints };
      }
    } else {
      const { value, matchMode } = filter;
      if (value != null && value !== '') {
        const mapKey = matchMode.toLowerCase().replace(/_/g, '');
        const updatedMatchMode = matchModeMap[mapKey] || matchMode;
        updatedFilters[key] = { value, matchMode: updatedMatchMode };
      }
    }
  });

  // Return the updated filters directly instead of using updateTableFilters
  return {
    ...query,
    filters: updatedFilters,
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

