import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { Translate } from 'react-jhipster';
import { getEntities } from 'app/entities/item/all-items.reducer';
import Select from 'app/shared/components/select/select';
import { useNavigate } from 'react-router-dom';
import _ from 'lodash';
import { ITerm } from 'app/shared/model/term.model';
import { getEntities as getRestaurantCategories } from 'app/entities/term/restaurant-Item-category/item-restaurant-category.reducer';
import { getEntities as getRetailCategories } from 'app/entities/term/retail-item-category/retail-item-category.reducer';
import { IItem } from 'app/shared/model/ITEM/item.model';
import PaginationFilterStateVals from 'app/shared/components/pagination/pagination-filter-state-vals';
import { useRef } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Check, X } from 'lucide-react';
import {
  Select as SelectUI,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ItemSelectionModalProps {
  isOpen: boolean;
  toggle: any;
  selectedItems: IItem[];
  handleToggleSelect: (items: IItem[]) => void;
  setSelectedItems: React.Dispatch<React.SetStateAction<IItem[]>>;
  disbaleUnselect?: boolean;
}

const ItemSelectionModal: React.FC<ItemSelectionModalProps> = (props) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const totalItems = useAppSelector((state) => state.allItems.totalItems);
  const itemList: IItem[] = useAppSelector((state) => state.allItems.entities);
  const loading = useAppSelector((state) => state.allItems.loading);
  const restaurantCategories: ITerm[] = useAppSelector(state => state.restaurantCategory.entities);
  const retailCategories: ITerm[] = useAppSelector(state => state.retailCategory.entities);

  const { isOpen, toggle, selectedItems, handleToggleSelect, disbaleUnselect } = props;

  // Ref to store the current dispatch promise
  const currentRequestRef = useRef<any>(null);

  // Local states replacing searchParams
  const [itemName, setItemName] = useState<string>('');
  // Debounced value of itemName to avoid firing requests on every key stroke
  const [debouncedItemName, setDebouncedItemName] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(null);
  const [unassignedItems, setUnassignedItems] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [size] = useState<number>(10);

  // Category panel filters
  const [retailFilter, setRetailFilter] = useState('');
  const [restaurantFilter, setRestaurantFilter] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  // Debounce the item name search input so we only fetch after the user stops
  // typing for 300 ms. This also prevents race-conditions where a slower
  // response of an earlier query overrides a faster one of a later query.
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedItemName(itemName);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [itemName]);

  // Fetch items whenever the debounced search term or other filters change.
  useEffect(() => {
    // Cancel the previous request if it exists
    if (currentRequestRef.current) {
      currentRequestRef.current.abort();
    }

    // Dispatch the new request and store the promise
    const requestPromise = dispatch(
      getEntities({
        page: page - 1,
        size,
        name: debouncedItemName,
        sort: 'id,asc',
        categoryId: selectedCategory || '',
        unassignedItems: unassignedItems ? 'true' : '',
      })
    );

    currentRequestRef.current = requestPromise;

    // Cleanup function to abort the request if component unmounts or dependencies change
    return () => {
      if (currentRequestRef.current) {
        currentRequestRef.current.abort();
      }
    };
  }, [page, size, debouncedItemName, selectedCategory, unassignedItems]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (currentRequestRef.current) {
        currentRequestRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    dispatch(
      getRestaurantCategories({
        page: 0,
        size: 1000,
        sort: `id,desc`,
      })
    );
    dispatch(
      getRetailCategories({
        page: 0,
        size: 1000,
        sort: `id,desc`,
      })
    );
  }, []);

  const filteredRetail = retailCategories.filter(c =>
    c.name.toLowerCase().includes(retailFilter.toLowerCase())
  );
  const filteredRestaurant = restaurantCategories.filter(c =>
    c.name.toLowerCase().includes(restaurantFilter.toLowerCase())
  );

  const getCategoryOptions = () => {
    return activeIndex === 0 ? filteredRetail : filteredRestaurant;
  };

  const isItemSelected = (id) => selectedItems?.find((selected) => selected.id === id);

  const handleSave = () => {
    toggle();
  };

  return (
    <Dialog open={isOpen} onOpenChange={toggle}>
      <DialogContent className="max-w-5xl p-3 max-h-[90vh] overflow-auto">
        <DialogHeader className="p-2">
          <DialogTitle className="text-sm font-semibold">
            <Translate contentKey={'menus.pos.update.modals.item.title'}>Add Existing Items</Translate>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 px-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="searchItem" className="text-xs">
                <Translate contentKey={'menus.pos.update.modals.item.search'}>Search Item</Translate>
              </Label>
              <Input
                type="text"
                id="searchItem"
                onChange={(e) => {
                  setItemName(e.target.value || '');
                  setPage(1);
                }}
                value={itemName}
                placeholder="Start Searching"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="searchCategory" className="text-xs">
                <Translate contentKey={'menus.pos.update.modals.item.filter'}>Filter By Category</Translate>
              </Label>
              <Tabs value={activeIndex === 0 ? 'retail' : 'restaurant'} onValueChange={(v) => setActiveIndex(v === 'retail' ? 0 : 1)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-8">
                  <TabsTrigger value="retail" className="text-xs h-7">Retail</TabsTrigger>
                  <TabsTrigger value="restaurant" className="text-xs h-7">Restaurant</TabsTrigger>
                </TabsList>
                <TabsContent value="retail" className="mt-1">
                  <Input
                    type="text"
                    placeholder="Filter Retail Categories..."
                    value={retailFilter}
                    onChange={(e) => setRetailFilter(e.target.value)}
                    className="h-8 text-xs mb-1"
                  />
                  <SelectUI value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select a Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {filteredRetail.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id} className="text-xs">
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </SelectUI>
                </TabsContent>
                <TabsContent value="restaurant" className="mt-1">
                  <Input
                    type="text"
                    placeholder="Filter Restaurant Categories..."
                    value={restaurantFilter}
                    onChange={(e) => setRestaurantFilter(e.target.value)}
                    className="h-8 text-xs mb-1"
                  />
                  <SelectUI value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select a Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {filteredRestaurant.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id} className="text-xs">
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </SelectUI>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="filterByUnassignedItems"
                checked={unassignedItems}
                onCheckedChange={(checked) => setUnassignedItems(!!checked)}
              />
              <Label htmlFor="filterByUnassignedItems" className="text-xs cursor-pointer">
                <Translate contentKey={'menus.pos.update.modals.item.filterByUnassignedItems'}>Filter By Unassigned Items</Translate>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="selectAllItems"
                checked={
                  itemList.length > 0 &&
                  itemList.every(iItem => selectedItems.some(sItem => sItem.id === iItem.id))
                }
                onCheckedChange={(checked) => {
                  if (checked) {
                    const notSelected = itemList.filter(i => !selectedItems.some(s => s.id === i.id));
                    handleToggleSelect(notSelected);
                  }
                  if (!checked && !disbaleUnselect) {
                    const currentlySelectedFromList = selectedItems.filter(s => itemList.some(i => i.id === s.id));
                    handleToggleSelect(currentlySelectedFromList);
                  }
                }}
              />
              <Label htmlFor="selectAllItems" className="text-xs cursor-pointer">
                <Translate contentKey={'menus.pos.update.modals.item.selectAll'}>Select All</Translate>
              </Label>
            </div>
          </div>
        </div>
        <div className="border rounded-md mt-2">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">
                    <Translate contentKey={'menus.pos.update.modals.item.table.category'}>Category</Translate>
                  </TableHead>
                  <TableHead className="text-xs">
                    <Translate contentKey={'menus.pos.update.modals.item.table.menus'}>Menus</Translate>
                  </TableHead>
                  <TableHead className="text-xs">
                    <Translate contentKey={'menus.pos.update.modals.item.table.name'}>Name</Translate>
                  </TableHead>
                  <TableHead className="text-xs">
                    <Translate contentKey={'menus.pos.update.modals.item.table.action'}>Action</Translate>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemList.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs">
                      <div className="flex flex-wrap gap-1">
                        {item.categories && item.categories.length > 0
                          ? item.categories.map((cat, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {cat.name}
                            </Badge>
                          ))
                          : <span className="text-muted-foreground">Uncategorized</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{item.menus?.map((menu) => menu.name).join(", ")}</TableCell>
                    <TableCell className="text-xs">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <span className="text-xs text-muted-foreground">
                          {item?.variants?.length > 0
                            ? `${item.variants.length} ${item.variants.length > 1 ? 'variants' : 'variant'}`
                            : 'No variants'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={isItemSelected(item.id) ? (disbaleUnselect ? 'default' : 'destructive') : 'default'}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => disbaleUnselect ? !isItemSelected(item.id) && handleToggleSelect([item]) : handleToggleSelect([item])}
                      >
                        {isItemSelected(item.id) ? (
                          <>
                            {disbaleUnselect ? (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                Selected
                              </>
                            ) : (
                              <>
                                <X className="h-3 w-3 mr-1" />
                                Unselect
                              </>
                            )}
                          </>
                        ) : (
                          <Translate contentKey='menus.pos.update.modals.item.buttons.select'>Select</Translate>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <div className="flex justify-center mt-2">
          <PaginationFilterStateVals
            totalPages={Math.ceil(totalItems / size)}
            currentPage={page}
            setCurrentPage={(newPage) => setPage(newPage)}
          />
        </div>
        <DialogFooter className="pt-2">
          <Button size="sm" className="h-8 text-xs" onClick={handleSave}>
            <Translate contentKey={'entity.action.save'}>Save</Translate>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemSelectionModal;
