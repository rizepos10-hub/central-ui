export const applyMatchModeMap = (query: any) => {
  const matchModeMap = {
    startswith: 'STARTS_WITH',
    startsWith: 'STARTS_WITH', 
    STARTS_WITH: 'STARTS_WITH',
    contains: 'CONTAINS',
    CONTAINS: 'CONTAINS',
    endswith: 'ENDS_WITH',
    endsWith: 'ENDS_WITH',
    ENDS_WITH: 'ENDS_WITH', 
    equals: 'EQUALS',
    EQUALS: 'EQUALS',
    notequals: 'NOT_EQUALS',
    notEquals: 'NOT_EQUALS',
    NOT_EQUALS: 'NOT_EQUALS'
  };

  const updatedFilters: any = {};
  const updatedGroups = Array.isArray(query.groups)
    ? query.groups
        .map((group: any) => {
          if (!group?.operator || !Array.isArray(group.constraints)) {
            return null;
          }

          const updatedConstraints = group.constraints
            .map((constraint: any) => {
              if (!constraint?.field || constraint.value == null || constraint.value === '') {
                return null;
              }
              const mapKey = constraint.matchMode.toLowerCase().replace(/_/g, '');
              const updatedMatchMode = matchModeMap[mapKey] || constraint.matchMode;
              return { ...constraint, matchMode: updatedMatchMode };
            })
            .filter(Boolean);

          if (updatedConstraints.length === 0) {
            return null;
          }

          return { ...group, constraints: updatedConstraints };
        })
        .filter(Boolean)
    : [];

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
    groups: updatedGroups,
  };
};


export const updateTableFilters = (filters) => {
  const cleanedFilters = { ...filters };
  
  for (const key in cleanedFilters) {
    if (key === 'attributes.attributeTerms.id') {
      if (cleanedFilters[key].constraints.length === 0) {
        delete cleanedFilters[key];
      }
    } else {
      // Only delete filter if value is truly empty and we want to remove it from query
      if (cleanedFilters[key].value === null || cleanedFilters[key].value === undefined || cleanedFilters[key].value === '') {
        delete cleanedFilters[key];
      }
    }
  }
  return cleanedFilters;
};

