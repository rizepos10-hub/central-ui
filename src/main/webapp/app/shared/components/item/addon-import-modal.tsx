import React, { useState, useEffect, useMemo } from 'react';
import { Translate } from 'react-jhipster';
import Select from 'react-select';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { searchEntitiesRestaurant as getRestaurantItems } from 'app/entities/item/restaurant/restaurant-item.reducer';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import debounce from 'lodash.debounce';
import { IItem } from 'app/shared/model/ITEM/item.model';
import { IRegularItem } from 'app/shared/model/ITEM/restaurant/regular-item.model';
import { IAddonGroups } from 'app/shared/model/ADDON/addon-groups.model';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface IAddonImportProps {
  showModal: boolean;
  handleClose?: () => void;
  handleSave: (item: IAddonGroups[], variantId?: string) => void;
  variantId?: string;
}

const AddonImportModal = (props: IAddonImportProps) => {
  const dispatch = useAppDispatch();
  const restaurantItemsOptions = useAppSelector(state => state.restaurantItems.entities);
  const [chosenItem, setChosenItem] = useState<IRegularItem>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedGroupsToImport, setSelectedGroupsToImport] = useState<IAddonGroups[]>([]);

  const [filterData, setFilterData] = useState({
    filters: {
      name: {
        value: '',
        matchMode: 'contains',
      },
    },
  });

  const [restaurantPaginationState, setRestaurantPaginationState] = useState({
    page: 0,
    size: 10,
    sort: 'id,asc',
  });

  const handleFilterChange = debounce((inputValue) => {
    setFilterData(prevFilterData => ({
      ...prevFilterData,
      filters: {
        ...prevFilterData.filters,
        name: {
          value: inputValue || '',
          matchMode: 'contains',
        },
      },
    }));
  }, 500);

  useEffect(() => {
    console.log(filterData, 'filterData')
    const query = applyMatchModeMap(filterData);
    console.log(query, 'query');
    dispatch(
      getRestaurantItems({
        page: restaurantPaginationState.page,
        size: restaurantPaginationState.size,
        sort: restaurantPaginationState.sort,
        query: filterData.filters.name.value,
      })
    );
  }, [dispatch, filterData, restaurantPaginationState]);

  const handleSelectedItemChange = (selectedItem) => {
    setChosenItem(selectedItem);
  };

  const handleImportAddons = (selectedGroups: IAddonGroups[]) => {
    setSelectedGroupsToImport(selectedGroups);
    setShowConfirmDialog(true);
  };

  const confirmImport = () => {
    props.handleSave(selectedGroupsToImport, props.variantId);
    setShowConfirmDialog(false);
  };

  return (
    <>
      <Dialog open={props.showModal} onOpenChange={props.handleClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              <Translate contentKey="items.update.importAddonsModal.title"></Translate>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold mb-2 block">
                <Translate contentKey="items.update.importAddonsModal.search"></Translate>
              </Label>
              <Select
                isMulti={false}
                onChange={handleSelectedItemChange}
                onInputChange={handleFilterChange}
                options={restaurantItemsOptions}
                getOptionLabel={option => option.name}
                getOptionValue={option => option.id}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '32px',
                    fontSize: '0.75rem',
                  }),
                  menu: (base) => ({
                    ...base,
                    fontSize: '0.75rem',
                  }),
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {chosenItem.addonGroups?.length > 0 && (
                <div className="border rounded p-3 space-y-3">
                  <div className="font-semibold text-sm">Item Addons</div>
                  <div className="space-y-2 border-t pt-2">
                    {chosenItem.addonGroups?.map((group, idx) => {
                      if (group.addonGroup.addons?.length === 0) return null
                      const addonNames = group.addonGroup.addons?.map(
                        addon => addon.name
                      )
                      return (
                        <div key={idx} className="text-xs space-y-1">
                          <div className="font-bold text-sm">
                            {group.addonGroup.name || group.name}
                          </div>
                          <div className="text-muted-foreground">
                            {addonNames}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <Button
                    size="sm"
                    className="h-7 text-xs w-full"
                    onClick={() => handleImportAddons(chosenItem?.addonGroups)}
                  >
                    Import
                  </Button>
                </div>
              )}

              {chosenItem.variants?.map((variant, vIndex) => {
                if (!variant?.addonGroups || variant?.addonGroups?.length === 0) return null
                return (
                  <div key={vIndex} className="border rounded p-3 space-y-3">
                    <div className="font-semibold text-sm">{variant.name}</div>
                    <div className="space-y-2 border-t pt-2">
                      {variant.addonGroups?.map((group, idx) => {
                        if (group?.addonGroup?.addons?.length === 0) return null
                        const addonNames = group.addonGroup.addons?.map(addon => addon.name).join(", ")
                        return (
                          <div key={idx} className="text-xs space-y-1">
                            <div className="font-bold text-sm">
                              {group.addonGroup.name || group.name}
                            </div>
                            <div className="text-muted-foreground">
                              {addonNames}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <Button
                      size="sm"
                      className="h-7 text-xs w-full"
                      onClick={() => handleImportAddons(variant?.addonGroups)}
                    >
                      Import
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" size="sm" className="h-8 text-xs" onClick={props.handleClose}>
              <Translate contentKey="entity.action.cancel">Cancel</Translate>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Confirmation</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Importing this item will override the existing addons. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport} className="h-8 text-xs">
              Import
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AddonImportModal;
