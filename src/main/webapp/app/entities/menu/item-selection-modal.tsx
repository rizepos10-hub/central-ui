import React, { useEffect, useState } from 'react';
import {Modal, ModalHeader, ModalBody, Input, Label, FormGroup, Button, ModalFooter, Spinner} from 'reactstrap';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { getSortState } from 'react-jhipster';
import { ITEMS_PER_PAGE_Summary } from 'app/shared/util/pagination.constants';
import { getEntities, searchEntities,reset } from 'app/entities/item/item.reducer';
import Select from "react-select";

interface ItemSelectionModalProps {
  isOpen: boolean;
  toggle: any;
  selectedItems: any;
  handleToggleSelect: any;
}

const ItemSelectionModal: React.FC<ItemSelectionModalProps> = (props) => {
  const dispatch = useAppDispatch();
  const totalItems = useAppSelector((state) => state.item.totalItems);
  const itemList = useAppSelector((state) => state.item.entities);
  const loading = useAppSelector((state) => state.item.loading);

  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  const [search, setSearch] = useState('');

  const { isOpen, toggle, selectedItems, handleToggleSelect } = props;

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE_Summary, 'id'), location.search)
  );

  const [selectedCategory, setSelectedCategory] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  console.log("itemList", itemList)
  console.log("item loading", loading)


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
      <ModalHeader toggle={toggle}>Add Existing Items</ModalHeader>
      <ModalBody>

        <FormGroup>
          <Label for="searchItem">Search Item</Label>
          <Input type="text" id="searchItem" value={searchTerm} onChange={handleSearchInputChange} />
        </FormGroup>
        <FormGroup>
          <Label for="searchCategory">Filter By Category</Label>
          <div>
          <Select
            id="searchCategory"
            value={selectedCategory}
            onChange={(selectedOption) => setSelectedCategory(selectedOption)}
            options={categoriesOption}
            isClearable={true}
          />
          </div>
        </FormGroup>
        <table className="table">
          <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Action</th>
          </tr>
          </thead>
          <tbody>
          {loading && <div className="d-flex my-5">
            <Spinner />
          </div>
          }
          {getCurrentPageItems().map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>
                <Button
                  color={isItemSelected(item.id) ? 'danger' : 'primary'}
                  onClick={() => handleToggleSelect(item)}
                >
                  {isItemSelected(item.id) ? 'Unselect' : 'Select'}
                </Button>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
        <div className="d-flex justify-content-center mt-3">
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            color="primary"
            className="mr-2"
          >
            Previous
          </Button>
          <span>Page {currentPage}</span>
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage * ITEMS_PER_PAGE >= totalItemsInCategory}
            color="primary"
            className="ml-2"
          >
            Next
          </Button>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="primary" onClick={handleSave}>
          Save
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ItemSelectionModal;
