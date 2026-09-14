export const updateItemFilterQuery = (query: any, field: string, value: unknown, matchMode: string) => ({
  ...query,
  first: 0,
  page: 0,
  filters: {
    ...(query?.filters || {}),
    [field]: {
      ...(query?.filters?.[field] || {}),
      value,
      matchMode,
    },
  },
});

export const getAssignmentSelection = (
  filters: Record<string, any> | undefined,
  assignmentFilterField: string,
  assignmentId: string | undefined,
): 'assigned' | 'unassigned' | null => {
  const filter = filters?.[assignmentFilterField];
  if (filter?.value !== assignmentId) {
    return null;
  }

  const matchMode = String(filter.matchMode || '').toLowerCase().replace(/_/g, '');
  if (matchMode === 'equals') {
    return 'assigned';
  }
  if (matchMode === 'notequals') {
    return 'unassigned';
  }

  return null;
};
