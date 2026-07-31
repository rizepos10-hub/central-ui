import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';

type SortDirection = 1 | -1;

type FilterConstraint = {
  value: unknown;
  matchMode: string;
};

type FilterModelQuery = {
  page?: number;
  rows?: number;
  sortField?: string | null;
  sortOrder?: SortDirection | null;
  filters?: Record<string, FilterConstraint | { operator: string; constraints: FilterConstraint[] }>;
  groups?: Array<{
    operator: string;
    constraints: Array<{
      field: string;
      value: unknown;
      matchMode: string;
    }>;
  }>;
};

const parseSort = (sort?: string) => {
  if (!sort) {
    return {
      sortField: null,
      sortOrder: null,
    };
  }

  const [sortField, direction = 'asc'] = sort.split(',');

  return {
    sortField: sortField || null,
    sortOrder: direction.toLowerCase() === 'desc' ? -1 : 1,
  };
};

const isFilterModelQuery = (query: unknown): query is FilterModelQuery =>
  typeof query === 'object' && query !== null && ('filters' in query || 'groups' in query || 'rows' in query || 'sortField' in query);

export const buildPostFilterSearchQuery = ({
  query,
  page = 0,
  size = 20,
  sort = 'name,asc',
  field = 'name',
  matchMode = 'contains',
}: {
  query?: unknown;
  page?: number;
  size?: number;
  sort?: string;
  field?: string;
  matchMode?: string;
}) => {
  if (isFilterModelQuery(query)) {
    const normalizedQuery = {
      ...query,
      page: query.page ?? page,
      rows: query.rows ?? size,
      ...((query.sortField || query.sortOrder) ? {} : parseSort(sort)),
      filters: query.filters || {},
      groups: query.groups || [],
    };

    return applyMatchModeMap(normalizedQuery);
  }

  const normalizedValue = typeof query === 'string' ? query.trim() : query;

  return applyMatchModeMap({
    page,
    rows: size,
    ...parseSort(sort),
    filters: {
      [field]: {
        value: normalizedValue || null,
        matchMode,
      },
    },
    groups: [],
  });
};

