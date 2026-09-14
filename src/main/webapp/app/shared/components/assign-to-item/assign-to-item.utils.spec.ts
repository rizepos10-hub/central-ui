import { getAssignmentSelection, updateItemFilterQuery } from './assign-to-item.utils';

describe('assign-to-item query helpers', () => {
  it('updates the selected relation and resets pagination', () => {
    const query = {
      first: 20,
      page: 1,
      filters: {
        name: { value: 'pizza', matchMode: 'CONTAINS' },
      },
    };

    const updatedQuery = updateItemFilterQuery(query, 'productionCenter.id', 'center-1', 'EQUALS');

    expect(updatedQuery.first).toBe(0);
    expect(updatedQuery.page).toBe(0);
    expect(updatedQuery.filters['productionCenter.id']).toEqual({ value: 'center-1', matchMode: 'EQUALS' });
    expect(updatedQuery.filters.name).toEqual(query.filters.name);
    expect(query.first).toBe(20);
    expect(query.page).toBe(1);
  });

  it('reads assignment state from the relation supplied by the caller', () => {
    const filters = {
      'productionCenter.id': { value: 'center-1', matchMode: 'EQUALS' },
    };

    expect(getAssignmentSelection(filters, 'productionCenter.id', 'center-1')).toBe('assigned');
    expect(
      getAssignmentSelection(
        { 'productionCenter.id': { value: 'center-1', matchMode: 'NOT_EQUALS' } },
        'productionCenter.id',
        'center-1'
      )
    ).toBe('unassigned');
    expect(getAssignmentSelection(filters, 'addonGroups.addonGroup.id', 'center-1')).toBeNull();
  });
});
