import { model } from './AppMenu';

describe('AppMenu model', () => {
  it('adds the on hand report under inventory reports', () => {
    const inventoryMenu = model.find(item => item.label === 'Inventory');
    const reportsMenu = inventoryMenu?.items?.find(item => item.label === 'Reports');
    const onHandReport = reportsMenu?.items?.find(item => item.label === 'On Hand Report');

    expect(inventoryMenu).toBeDefined();
    expect(reportsMenu?.to).toBe('/inventory/reports/on-hand');
    expect(onHandReport?.to).toBe('/inventory/reports/on-hand');
  });
});
