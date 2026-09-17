import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { IAddonGroups } from 'app/shared/model/ADDON/addon-groups.model';
import { AddonSelectionActions, updateAddonGroupAddonSelection } from './addon-selection-actions';

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

const addonA = { id: 'addon-a', name: 'Addon A' };
const addonB = { id: 'addon-b', name: 'Addon B' };

const addonGroup: IAddonGroups = {
  addonGroup: {
    id: 'group-1',
    name: 'Group 1',
    addons: [addonA, addonB],
  },
  name: 'Custom group name',
  required: true,
  minQuantity: 1,
  maxQuantity: 2,
  addAutomatically: true,
  addonPriceOverrides: [{ id: 'addon-a', price: 2.5 }],
  excluded: [addonA],
};

describe('AddonSelectionActions', () => {
  it('exposes independent select-all and clear-all actions', () => {
    const onSelectAll = jest.fn();
    const onClearAll = jest.fn();

    render(<AddonSelectionActions onSelectAll={onSelectAll} onClearAll={onClearAll} />);

    fireEvent.click(screen.getByRole('button', { name: 'Select all' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));

    expect(onSelectAll).toHaveBeenCalledTimes(1);
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });

  it('selects every addon without changing unrelated group fields', () => {
    const updatedGroup = updateAddonGroupAddonSelection(addonGroup, true);

    expect(updatedGroup.excluded).toEqual([]);
    expect(updatedGroup.required).toBe(addonGroup.required);
    expect(updatedGroup.minQuantity).toBe(addonGroup.minQuantity);
    expect(updatedGroup.maxQuantity).toBe(addonGroup.maxQuantity);
    expect(updatedGroup.addAutomatically).toBe(addonGroup.addAutomatically);
    expect(updatedGroup.addonPriceOverrides).toBe(addonGroup.addonPriceOverrides);
    expect(updatedGroup.addonGroup).toBe(addonGroup.addonGroup);
    expect(addonGroup.excluded).toEqual([addonA]);
  });

  it('clears every addon without changing unrelated group fields', () => {
    const updatedGroup = updateAddonGroupAddonSelection(addonGroup, false);

    expect(updatedGroup.excluded).toEqual([addonA, addonB]);
    expect(updatedGroup.required).toBe(addonGroup.required);
    expect(updatedGroup.minQuantity).toBe(addonGroup.minQuantity);
    expect(updatedGroup.maxQuantity).toBe(addonGroup.maxQuantity);
    expect(updatedGroup.addAutomatically).toBe(addonGroup.addAutomatically);
    expect(updatedGroup.addonPriceOverrides).toBe(addonGroup.addonPriceOverrides);
    expect(updatedGroup.addonGroup).toBe(addonGroup.addonGroup);
    expect(addonGroup.excluded).toEqual([addonA]);
  });
});
