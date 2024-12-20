import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Modal, ModalHeader, ModalBody, Input, Label, FormGroup, Button, ModalFooter, Spinner } from 'reactstrap';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { getSortState, translate, Translate } from 'react-jhipster';
import { ITEMS_PER_PAGE_Summary } from 'app/shared/util/pagination.constants';
import { getEntities, searchEntities, reset } from 'app/entities/item/all-items.reducer';
import Select from "react-select";
import { Tag } from "primereact/tag";
import PaginationFilter from 'app/shared/components/pagination/pagination-filter';
import { useNavigate } from 'react-router-dom';
import _ from 'lodash';
import { Checkbox } from 'primereact/checkbox';
// import { getEntities as getCategories } from 'app/entities/term/Item-category/item-category.reducer';
import { ITerm } from 'app/shared/model/term.model';
import { getEntities as getRestaurantCategories, searchEntities as searchRestaurantCategories } from 'app/entities/term/restaurant-Item-category/item-restaurant-category.reducer';
import { getEntities as getRetailCategories, searchEntities as searchRetailCategories } from 'app/entities/term/retail-item-category/retail-item-category.reducer';
import { Dropdown } from 'primereact/dropdown';
import { TabPanel, TabView } from 'primereact/tabview';
import { IItem } from 'app/shared/model/ITEM/item.model';

interface ItemSelectionModalProps {
  isOpen: boolean;
  toggle: any;
  selectedItems: IItem[];
  handleToggleSelect: (items: IItem[]) => void;
  setSelectedItems: React.Dispatch<React.SetStateAction<IItem[]>>;
}

const ItemSelectionModal: React.FC<ItemSelectionModalProps> = (props) => {
  const searchParams = new URLSearchParams(location.search);

  const [itemName, setItemName] = useState<string>(searchParams.get('name') || '');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [retailFilter, setRetailFilter] = useState('');
  const [restaurantFilter, setRestaurantFilter] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  console.log(selectedCategory)

  const dispatch = useAppDispatch();
  const totalItems = useAppSelector((state) => state.allItems.totalItems);
  const itemList: IItem[] = useAppSelector((state) => state.allItems.entities);
  const loading = useAppSelector((state) => state.allItems.loading);

  // const categories = useAppSelector(state => state.category.entities);
  const restaurantCategories: ITerm[] = useAppSelector(state => state.restaurantCategory.entities);
  const retailCategories: ITerm[] = useAppSelector(state => state.retailCategory.entities);

  const navigate = useNavigate();

  const { isOpen, toggle, selectedItems, handleToggleSelect } = props;

  const initialRender = useRef(true);

  useEffect(() => {
    dispatch(getEntities({
      page: parseInt(searchParams.get("page"), 10) - 1 || 0,
      size: parseInt(searchParams.get("size"), 10) || 10,
      name: searchParams.get("name") || '',
      sort: `id,asc`,
      categoryId: selectedCategory || '',
      unassignedItems: searchParams.get("unassignedItems") || '',
    }));
  }, [
    searchParams.get("page"),
    searchParams.get("size"),
    searchParams.get("name"),
    selectedCategory,
    searchParams.get("unassignedItems")
  ]);

  const createQueryString = useCallback((name, value) => {
    const sParams = new URLSearchParams(searchParams);
    sParams.set(name, value);
    return `?${sParams.toString()}`;
  }, []);

  const deleteQueryString = useCallback((name) => {
    const sParams = new URLSearchParams(searchParams);
    sParams.delete(name);
    return `?${sParams.toString()}`;
  }, []);


  const debouncedItemNameNavigate = useCallback(
    _.debounce((newItemName) => {
      if (searchParams.get('name') !== newItemName) {
        navigate(createQueryString('name', newItemName));
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    debouncedItemNameNavigate(itemName);
  }, [itemName, debouncedItemNameNavigate]);

  const handleSave = () => {
    toggle();
  };

  const isItemSelected = (id) => selectedItems?.find((selected) => selected.id === id);

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
  }, [])

  const filteredRetail = retailCategories.filter(c =>
    c.name.toLowerCase().includes(retailFilter.toLowerCase())
  )
  const filteredRestaurant = restaurantCategories.filter(c =>
    c.name.toLowerCase().includes(restaurantFilter.toLowerCase())
  )

  const panelItemTemplate = () => {
    return (
      <div className="w-full">
        <TabView onClick={e => e.stopPropagation()} activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
          <TabPanel header="Retail Categories" >
            <input
              type="text"
              className="mb-2 border rounded p-1 w-full"
              placeholder="Filter Retail Categories..."
              value={retailFilter}
              onChange={(e) => setRetailFilter(e.target.value)}
            />
          </TabPanel>
          <TabPanel header="Restaurant Categories">
            <input
              type="text"
              className="mb-2 border rounded p-1 w-full"
              placeholder="Filter Restaurant Categories..."
              value={restaurantFilter}
              onChange={(e) => setRestaurantFilter(e.target.value)}
            />
          </TabPanel>
        </TabView>
      </div>
    )
  }

  return (
    <Modal size="lg" isOpen={isOpen} toggle={toggle} backdrop="static">
      <ModalHeader toggle={toggle}>
        <Translate contentKey={'menus.pos.update.modals.item.title'}>Add Existing Items</Translate>
      </ModalHeader>
      <ModalBody>
        <FormGroup>
          <div className='d-flex gap-2 align-items-baseline'>
            <div className='w-100'>
              <Label for="searchItem">
                <Translate contentKey={'menus.pos.update.modals.item.search'}>Search Item</Translate>
              </Label>
              <Input
                type="text"
                id="searchItem"
                onChange={(e) => setItemName(e.target.value || '')}
                value={itemName}
                placeholder="Start Searching"
                className='w-100'
              />
            </div>
            <div className='w-100'>
              <Label for="searchCategory">
                <Translate contentKey={'menus.pos.update.modals.item.filter'}>Filter By Category</Translate>
              </Label>
              <Dropdown
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.value)}
                options={activeIndex === 0 ? filteredRetail : filteredRestaurant}
                optionLabel={"name"}
                optionValue={"id"}
                filter
                filterTemplate={panelItemTemplate}
                placeholder="Select a Category"
                className="w-full"
                showClear
              />
            </div>
          </div>
          <div className='d-flex justify-content-between mt-2'>
            <div className='d-flex gap-2 align-items-start'>
              <Label for="filterByUnassignedItems">
                <Translate contentKey={'menus.pos.update.modals.item.filterByUnassignedItems'}>Filter By Unassigned Items</Translate>
              </Label>
              <Checkbox
                inputId="filterByUnassignedItems"
                checked={searchParams.get('unassignedItems') !== null}
                onChange={(e) => {
                  if (e.checked) {
                    navigate(createQueryString('unassignedItems', true));
                  } else {
                    navigate(deleteQueryString('unassignedItems'));
                  }
                }}
              />
            </div>
            <div className='d-flex gap-2 align-items-start'>
              <Label for="filterByUnassignedItems">
                <Translate contentKey={'menus.pos.update.modals.item.selectAll'}>Select All</Translate>
              </Label>
              <Checkbox
                inputId="filterByUnassignedItems"
                checked={
                  itemList.length > 0 &&
                  itemList.every(iItem => selectedItems.some(sItem => sItem.id === iItem.id))
                }
                onChange={(e) => {
                  if (e.checked) {
                    const notSelected = itemList.filter(i => !selectedItems.some(s => s.id === i.id));
                    console.log(notSelected, 'notSelected');
                    handleToggleSelect(notSelected);
                  } else {
                    const currentlySelectedFromList = selectedItems.filter(s => itemList.some(i => i.id === s.id));
                    handleToggleSelect(currentlySelectedFromList);
                  }
                }}
              />
            </div>
          </div>
        </FormGroup>
        <table className="table">
          <thead>
            <tr>
              <th>
                <Translate contentKey={'menus.pos.update.modals.item.table.category'}>Category</Translate>
              </th>
              <th>
                <Translate contentKey={'menus.pos.update.modals.item.table.menus'}>Menus</Translate>
              </th>
              <th>
                <Translate contentKey={'menus.pos.update.modals.item.table.name'}>Name</Translate>
              </th>
              <th>
                <Translate contentKey={'menus.pos.update.modals.item.table.action'}>Action</Translate>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <div className="d-flex my-5">
                <Spinner />
              </div>
            ) : (
              itemList.map(item => (
                <tr key={item.id}>
                  <td>
                    {item.categories && item.categories.length > 0
                      ? item.categories.map((cat, index) => (
                        <React.Fragment key={index}>
                          <Tag value={cat.name} />
                          {index < item.categories.length - 1 && <span style={{ margin: '0 5px' }}>&nbsp;</span>}
                        </React.Fragment>
                      ))
                      : 'Uncategorized'}
                  </td>

                  <td>{item.menus?.map((menu) => menu.name).join(", ")}</td>
                  <td>
                    <div>
                      <div>{item.name}</div>
                      <span style={{ fontSize: '0.9em', color: 'gray' }}>
                        {item?.variants?.length > 0
                          ? `${item.variants.length} ${item.variants.length > 1 ? 'variants' : 'variant'}`
                          : 'No variants'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <Button color={isItemSelected(item.id) ? 'danger' : 'primary'} onClick={() => handleToggleSelect([item])}>
                      {isItemSelected(item.id)
                        ? translate('menus.pos.update.modals.item.buttons.unselect')
                        : translate('menus.pos.update.modals.item.buttons.select')}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="d-flex justify-content-center mt-3">
          <PaginationFilter totalPages={Math.ceil(totalItems / 10)} />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="primary" onClick={handleSave}>
          <Translate contentKey={'entity.action.save'}>Save</Translate>
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ItemSelectionModal;
