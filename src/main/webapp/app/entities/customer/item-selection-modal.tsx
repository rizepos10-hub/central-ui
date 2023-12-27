import React, { useEffect, useState } from 'react';
import { Modal, ModalHeader, ModalBody, Input, Label, FormGroup, Button, ModalFooter, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { getSortState } from 'react-jhipster';
import { ITEMS_PER_PAGE_Summary } from 'app/shared/util/pagination.constants';
import { getEntities, searchEntities } from 'app/entities/item/restaurant/regalar-item/item.reducer';

interface ItemSelectionModalProps {
  isOpen: boolean;
  toggle: any;
  selectedVariant: any;
  handleToggleSelect: any;
}

const ItemSelectionModal: React.FC<ItemSelectionModalProps> = (props) => {
  const dispatch = useAppDispatch();
  const totalItems = useAppSelector((state) => state.item.totalItems);
  const itemList = useAppSelector((state) => state.item.entities);
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
    <Modal size="lg" isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>Add Existing Variants</ModalHeader>
      <ModalBody>
        <FormGroup>
          <Label for="searchVariant">Search Variant</Label>
          <Input type="text" id="searchVariant" value={searchTerm} onChange={handleSearchInputChange} />
        </FormGroup>
        <table className="table">
          <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Selected Variant</th>
            <th>Action</th>

          </tr>
          </thead>
          <tbody>
          {itemList.map((item, index) => (

            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>{selectedVariant[index] ? selectedVariant[index].name : ''}</td>
              <td>
                <Dropdown placeholder="Select Variant" isOpen={dropdownOpen[index]} toggle={() => handleDropdownToggle(index)}>
                  <DropdownToggle caret>
                    {selectedVariant.lengh > 0 ? '' : 'Select a Variant'}
                  </DropdownToggle>
                  <DropdownMenu>
                    {item.variants
                     .map((variant) => (
                      <DropdownItem
                        key={variant.id}
                        onClick={() => handleVariantSelect(item, variant)}
                        active={isVariantSelected(item, variant)}
                      >
                        {variant.name}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
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
        <Button color="primary" onClick={toggle}>
          Save
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ItemSelectionModal;
