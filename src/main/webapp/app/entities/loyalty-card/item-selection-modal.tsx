import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { getSortState, translate } from 'react-jhipster';
import { ITEMS_PER_PAGE_Summary } from 'app/shared/util/pagination.constants';
import { getEntities, searchEntities } from 'app/entities/item/restaurant/restaurant-item.reducer';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [dropdownOpen, setDropdownOpen] = useState(Array(itemList.length).fill(false));

  const isVariantSelected = (item, variant) => {
    return selectedVariant.some((selected) => selected.itemId === item.id && selected.variantId === variant.id);
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

  const handleDropdownToggle = (index) => {
    const newDropdownOpen = [...dropdownOpen];
    newDropdownOpen[index] = !newDropdownOpen[index];
    setDropdownOpen(newDropdownOpen);
  };

  const handleVariantSelect = (itemIndex, variant) => {
    console.log(variant, 'hello')
    if (
      variant &&
      (Object.keys(variant.specialPrices).length === 0 || Object.values(variant.specialPrices).every((value) => value === null))) {
      alert("Variant has no special prices!");
      return null;
    }
    handleToggleSelect(itemIndex, variant);
    const newDropdownOpen = [...dropdownOpen];
    newDropdownOpen[itemIndex] = false;
    setDropdownOpen(newDropdownOpen);
  };


  return (
    <Dialog open={isOpen} onOpenChange={toggle}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-sm">{translate('customers.itemSelection.title')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="searchVariant" className="text-xs">
              {translate('customers.itemSelection.searchVariant')}
            </Label>
            <Input
              type="text"
              id="searchVariant"
              className="h-7 text-xs"
              value={searchTerm}
              onChange={handleSearchInputChange}
            />
          </div>

          <div className="border rounded-lg">
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
                {itemList.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs">{item.id}</TableCell>
                    <TableCell className="text-xs">{item.name}</TableCell>
                    <TableCell className="text-xs">{selectedVariant[index] ? selectedVariant[index].name : ''}</TableCell>
                    <TableCell>
                      <DropdownMenu
                        open={dropdownOpen[index]}
                        onOpenChange={open => {
                          const newDropdownOpen = [...dropdownOpen];
                          newDropdownOpen[index] = open;
                          setDropdownOpen(newDropdownOpen);
                        }}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="h-7 text-xs">
                            {selectedVariant.length > 0 ? '' : 'Select a Variant'}
                            <ChevronDown className="ml-2 h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {item.variants.map(variant => (
                            <DropdownMenuItem
                              key={variant.id}
                              onClick={() => handleVariantSelect(item, variant)}
                              className={`text-xs ${isVariantSelected(item, variant) ? 'bg-accent' : ''}`}
                            >
                              {variant.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-center items-center gap-2 mt-2">
            <Button
              variant="outline"
              className="h-8 text-xs"
              onClick={() =>
                setPaginationState({
                  ...paginationState,
                  activePage: paginationState.activePage - 1,
                })
              }
              disabled={paginationState.activePage === 1}
            >
              <ChevronLeft className="h-3 w-3" />
              {translate('customers.itemSelection.previous')}
            </Button>
            <span className="text-xs">Page {paginationState.activePage}</span>
            <Button
              variant="outline"
              className="h-8 text-xs"
              onClick={() =>
                setPaginationState({
                  ...paginationState,
                  activePage: paginationState.activePage + 1,
                })
              }
              disabled={totalItems <= paginationState.itemsPerPage * paginationState.activePage}
            >
              {translate('customers.itemSelection.next')}
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button className="h-8 text-xs" onClick={toggle}>
            {translate('customers.itemSelection.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemSelectionModal;
