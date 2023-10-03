import React, { useEffect, useState } from 'react';
import {Modal, ModalHeader, ModalBody, Input, Label, FormGroup, Button, ModalFooter} from 'reactstrap';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { getSortState } from 'react-jhipster';
import { ITEMS_PER_PAGE_Summary } from 'app/shared/util/pagination.constants';
import { getItemsSummary, searchEntities,reset } from 'app/entities/item/item.reducer';

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
  const [search, setSearch] = useState('');

  const { isOpen, toggle, selectedItems, handleToggleSelect } = props;

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE_Summary, 'id'), location.search)
  );

  const [searchTerm, setSearchTerm] = useState('');

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
    if (search) {
      startSearching();
    } else {
      dispatch(
        getItemsSummary({
          page: paginationState.activePage - 1,
          size: paginationState.itemsPerPage,
          sort: `${paginationState.sort},${paginationState.order}`,
        })
      )
    }
    return () => {
      dispatch(reset())
    }
  }, [paginationState, search]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);

    setSearch(newSearchTerm);
  };

  const handleSave = () => {
    toggle();
  };

  const isItemSelected = (id) => selectedItems.find((selected) => selected.id === id );


  console.log(selectedItems, 'selected items')
  return (
    <Modal size="lg" isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>Add Existing Items</ModalHeader>
      <ModalBody>
        <FormGroup>
          <Label for="searchItem">Search Item</Label>
          <Input type="text" id="searchItem" value={searchTerm} onChange={handleSearchInputChange} />
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
          {itemList.map((item) => (
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
            onClick={() =>
              setPaginationState({
                ...paginationState,
                activePage: paginationState.activePage - 1,
              })
            }
            disabled={paginationState.activePage === 1}
            color="primary"
            className="mr-2"
          >
            Previous
          </Button>
          <span>Page {paginationState.activePage}</span>
          <Button
            onClick={() =>
              setPaginationState({
                ...paginationState,
                activePage: paginationState.activePage + 1,
              })
            }
            disabled={totalItems <= paginationState.itemsPerPage * paginationState.activePage}
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
