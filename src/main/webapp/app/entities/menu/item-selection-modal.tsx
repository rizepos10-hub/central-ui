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

interface ItemSelectionModalProps {
  isOpen: boolean;
  toggle: any;
  selectedItems: any;
  handleToggleSelect: any;
}

const ItemSelectionModal: React.FC<ItemSelectionModalProps> = (props) => {
  const dispatch = useAppDispatch();
  const totalItems = useAppSelector((state) => state.allItems.totalItems);
  const itemList = useAppSelector((state) => state.allItems.entities);
  const loading = useAppSelector((state) => state.allItems.loading);

  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  const { isOpen, toggle, selectedItems, handleToggleSelect } = props;

  const initialRender = useRef(true);

  useEffect(() => {
    dispatch(getEntities({
      page: parseInt(searchParams.get("page"), 10) - 1 || 0,
      size: parseInt(searchParams.get("size"), 10) || 10,
      name: searchParams.get("name") || '',
      sort: `id,asc`,
      categoryId: searchParams.get("categoryId") || '',
      unassignedItems: searchParams.get("unassignedItems") || '',
    }));
  }, [
    searchParams.get("page"),
    searchParams.get("size"),
    searchParams.get("name"),
    searchParams.get("categoryId"),
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
    debouncedItemNameNavigate(searchParams.get('name'));
  }, [searchParams.get('name'), debouncedItemNameNavigate]);

  const handleSave = () => {
    toggle();
  };

  const isItemSelected = (id) => selectedItems?.find((selected) => selected.id === id);

  const categoryIds = itemList.map((item) => item.categories[0]?.id)

  const uniqueCategoryIds = new Set(categoryIds);

  const uniqueCategoryIdsArray = Array.from(uniqueCategoryIds);

  const categoriesOption = uniqueCategoryIdsArray.map((categoryId) => {
    const category = itemList.find((item) => item.categories[0]?.id === categoryId);

    return {
      label: category?.categories[0]?.name || "Unknown Category",
      value: category?.categories[0]?.id,
    };
  });

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
                value={searchParams.get('name')}
                onChange={(e) => navigate(createQueryString('name', e.target.value))}
                placeholder="Start Searching"
                className='w-100'
              />
            </div>
            <div className='w-100'>
              <Label for="searchCategory">
                <Translate contentKey={'menus.pos.update.modals.item.filter'}>Filter By Category</Translate>
              </Label>
              <Select
                id="searchCategory"
                value={{
                  label: categoriesOption.find(cat => cat.value === searchParams.get('categoryId'))?.label,
                  value: searchParams.get('categoryId'),
                }}
                onChange={selectedOption => {
                  console.log(selectedOption)
                  if (!selectedOption) {
                    navigate(deleteQueryString('categoryId'));
                  } else {
                    navigate(createQueryString('categoryId', selectedOption.value));
                  }
                }}
                options={categoriesOption}
                isClearable={true}
                className='w-100'
              />
            </div>
          </div>
          <div className='d-flex gap-2 align-items-baseline mt-2'>
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
        </FormGroup>
        <table className="table">
          <thead>
            <tr>
              <th>
                <Translate contentKey={'menus.pos.update.modals.item.table.category'}>Category</Translate>
              </th>
              <th>
                <Translate contentKey={'menus.pos.update.modals.item.table.menu'}>Menu</Translate>
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

                  <td>{item.menu?.[0]?.name}</td>
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
                    <Button color={isItemSelected(item.id) ? 'danger' : 'primary'} onClick={() => handleToggleSelect(item)}>
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
          <PaginationFilter totalPages={Math.floor(totalItems / 10)} />
        </div>
        {/* <div className="d-flex justify-content-center mt-3">
          <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} color="primary" className="mr-2">
            <Translate contentKey={'menus.pos.update.modals.item.buttons.previous'}>Previous</Translate>
          </Button>
          <span>Page {currentPage}</span>
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage * ITEMS_PER_PAGE >= totalItemsInCategory}
            color="primary"
            className="ml-2"
          >
            <Translate contentKey={'menus.pos.update.modals.item.buttons.next'}>Next</Translate>
          </Button>
        </div> */}
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
