import React, { useEffect, useState } from 'react';
import {Modal, ModalHeader, ModalBody, Input, Label, FormGroup, Button, ModalFooter, Spinner} from 'reactstrap';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import {getSortState, translate, Translate} from 'react-jhipster';
import { ITEMS_PER_PAGE_Summary } from 'app/shared/util/pagination.constants';
import { getEntities, searchEntities,reset } from 'app/entities/item/all-items.reducer';
import Select from "react-select";
import { Tag } from "primereact/tag";

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

  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  const [search, setSearch] = useState('');

  const { isOpen, toggle, selectedItems, handleToggleSelect } = props;

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE_Summary, 'id'), location.search)
  );

  const [selectedCategory, setSelectedCategory] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');


  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const getTotalItemsInCategory = () => {
    if (!selectedCategory) {
      return totalItems;
    }

    return itemList.filter((item) => item.categories[0]?.id === selectedCategory.value).length;
  };

  const getFilteredItems = () => {
    if (!selectedCategory) {
      return itemList;
    }
    const filteredItems = itemList.filter((item) => {
      return item.categories[0]?.id === selectedCategory.value;
    });

    return filteredItems;
  };

  const getCurrentPageItems = () => {
    const filteredItems = getFilteredItems();

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return filteredItems.slice(startIndex, endIndex);
  };

  const totalItemsInCategory = getTotalItemsInCategory();
  const startSearching = () => {
    dispatch(
      searchEntities({
        query: search,
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    )
  };
  useEffect(() => {
    if (search.length > 2) {
      console.log("search im here", search);
      startSearching();
    } else {
      console.log("search1 im here", search);
      dispatch(getEntities({
        page: 0,
        size: 400,
        sort: 'asc',
      }));
    }

    return () => {
      dispatch(reset());
    };
  }, [paginationState, search]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);

    if(newSearchTerm.length > 2){
      setSearch(newSearchTerm);
    }

    if(newSearchTerm.length === 0){
      setSearch('');
    }

  };

  const handleSave = () => {
    toggle();
  };

  const isItemSelected = (id) => selectedItems?.find((selected) => selected.id === id );

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


  console.log(selectedItems, 'selected items')
  return (
    <Modal size="lg" isOpen={isOpen} toggle={toggle} backdrop="static">
      <ModalHeader toggle={toggle}>
        <Translate contentKey={'menus.pos.update.modals.item.title'}>Add Existing Items</Translate>
      </ModalHeader>
      <ModalBody>
        <FormGroup>
          <Label for="searchItem">
            <Translate contentKey={'menus.pos.update.modals.item.search'}>Search Item</Translate>
          </Label>
          <Input type="text" id="searchItem" value={searchTerm} onChange={handleSearchInputChange} />
        </FormGroup>
        <FormGroup>
          <Label for="searchCategory">
            <Translate contentKey={'menus.pos.update.modals.item.filter'}>Filter By Category</Translate>
          </Label>
          <div>
            <Select
              id="searchCategory"
              value={selectedCategory}
              onChange={selectedOption => setSelectedCategory(selectedOption)}
              options={categoriesOption}
              isClearable={true}
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
            {loading && (
              <div className="d-flex my-5">
                <Spinner />
              </div>
            )}
            {getCurrentPageItems().map(item => (
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
            ))}
          </tbody>
        </table>
        <div className="d-flex justify-content-center mt-3">
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
