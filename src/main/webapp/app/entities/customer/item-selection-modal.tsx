import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { getSortState, translate } from "react-jhipster";
import { ITEMS_PER_PAGE_Summary } from 'app/shared/util/pagination.constants';
import { getEntities, searchEntities } from 'app/entities/item/restaurant/restaurant-item.reducer';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface ItemSelectionModalProps {
  isOpen: boolean;
  toggle: any;
  selectedVariant: any;
  handleToggleSelect: any;
}

const ItemSelectionModal: React.FC<ItemSelectionModalProps> = (props) => {
  const dispatch = useAppDispatch();
  const totalItems = useAppSelector((state) => state.restaurantItems.totalItems);
  const itemList = useAppSelector((state) => state.restaurantItems.entities);
  const [search, setSearch] = useState('');

  const { isOpen, toggle, selectedVariant, handleToggleSelect } = props;

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE_Summary, 'id'), location.search)
  );

  const [searchTerm, setSearchTerm] = useState('');

  const isVariantSelected = (item, variant) => {
    return selectedVariant.some((selected) => selected.itemId === item.id && selected.variantId === variant.id);
  };

  const getSelectedVariantForItem = (item) => {
    const selected = selectedVariant.find((sv) => sv.itemId === item.id);
    return selected?.variantId || '';
  };

  const startSearching = () => {
    dispatch(
      searchEntities({
        query: search,
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
  };

  useEffect(() => {
    if (search) {
      startSearching();
    } else {
      dispatch(
        getEntities({
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      );
    }
  }, [paginationState, search]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setSearch(newSearchTerm);
  };

  const handleVariantSelect = (item, variantId) => {
    const variant = item.variants.find(v => v.id === variantId);

    if (
      variant &&
      (Object.keys(variant.specialPrices).length === 0 || Object.values(variant.specialPrices).every((value) => value === null))) {
      alert("Variant has no special prices!");
      return null;
    }
    handleToggleSelect(item, variant);
  };


  const totalPages = Math.ceil(totalItems / paginationState.itemsPerPage);

  return (
    <Dialog open={isOpen} onOpenChange={toggle}>
      <DialogContent className="max-w-4xl p-3 max-h-[90vh] overflow-auto">
        <DialogHeader className="p-2">
          <DialogTitle className="text-sm font-semibold">
            {translate('customers.itemSelection.title')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 px-2">
          <div className="space-y-1">
            <Label htmlFor="searchVariant" className="text-xs">
              {translate('customers.itemSelection.searchVariant')}
            </Label>
            <Input
              type="text"
              id="searchVariant"
              value={searchTerm}
              onChange={handleSearchInputChange}
              className="h-8 text-xs"
              placeholder="Search items..."
            />
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{translate('customers.itemSelection.id')}</TableHead>
                  <TableHead className="text-xs">{translate('customers.itemSelection.name')}</TableHead>
                  <TableHead className="text-xs">{translate('customers.itemSelection.selectedVariant')}</TableHead>
                  <TableHead className="text-xs">{translate('customers.itemSelection.action')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemList.map((item) => {
                  const selectedVariantForItem = selectedVariant.find((sv) => sv.itemId === item.id);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs">{item.id}</TableCell>
                      <TableCell className="text-xs font-medium">{item.name}</TableCell>
                      <TableCell className="text-xs">
                        {selectedVariantForItem ? selectedVariantForItem.name : '-'}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={getSelectedVariantForItem(item)}
                          onValueChange={(value) => handleVariantSelect(item, value)}
                        >
                          <SelectTrigger className="h-7 text-xs w-[180px]">
                            <SelectValue placeholder="Select a Variant" />
                          </SelectTrigger>
                          <SelectContent>
                            {item.variants?.map((variant) => (
                              <SelectItem
                                key={variant.id}
                                value={variant.id}
                                className="text-xs"
                              >
                                <div className="flex items-center">
                                  {isVariantSelected(item, variant) && (
                                    <Check className="h-3 w-3 mr-1" />
                                  )}
                                  {variant.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPaginationState({
                  ...paginationState,
                  activePage: paginationState.activePage - 1,
                })
              }
              disabled={paginationState.activePage === 1}
              className="h-7 text-xs px-2"
            >
              <ChevronLeft className="h-3 w-3 mr-1" />
              {translate('customers.itemSelection.previous')}
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {paginationState.activePage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPaginationState({
                  ...paginationState,
                  activePage: paginationState.activePage + 1,
                })
              }
              disabled={paginationState.activePage >= totalPages}
              className="h-7 text-xs px-2"
            >
              {translate('customers.itemSelection.next')}
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button size="sm" className="h-8 text-xs" onClick={toggle}>
            {translate('customers.itemSelection.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemSelectionModal;
