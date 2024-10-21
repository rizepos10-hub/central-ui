import React, { useState, useEffect } from 'react';
import { Button, Modal, ModalBody, ModalFooter } from 'reactstrap';
import { Translate } from 'react-jhipster';
import Select from 'react-select';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { searchEntitiesRestaurant as getRestaurantItems } from 'app/entities/item/restaurant/restaurant-item.reducer';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import debounce from 'lodash.debounce'; // Use lodash.debounce for debouncing
import { IItem } from 'app/shared/model/ITEM/item.model';

interface IAddonImportProps {
  showModal: boolean;
  handleClose?: () => void;
  handleSave: (item: IItem) => void;
}

const AddonImportModal = (props: IAddonImportProps) => {
  const dispatch = useAppDispatch();
  const restaurantItemsOptions = useAppSelector(state => state.restaurantItems.entities);
  const [selectedItemToImport, setSelectedItemToImport] = useState({});
  const [filterData, setFilterData] = useState({
    filters: {
      name: {
        value: '',
        matchMode: 'contains', // Can change based on the requirement
      },
    },
  });

  const [restaurantPaginationState, setRestaurantPaginationState] = useState({
    page: 0,
    size: 10,
    sort: 'id,asc',
  });

  // Use debounce to limit the API call rate
  const handleFilterChange = debounce((inputValue) => {
    // Pre-process the filter data to ensure valid values
    setFilterData(prevFilterData => ({
      ...prevFilterData,
      filters: {
        ...prevFilterData.filters,
        name: {
          value: inputValue || '', // If inputValue is null or undefined, use empty string
          matchMode: 'contains',
        },
      },
    }));
  }, 500); // Wait 500ms after the last change

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

  const handleItemImportChange = selectedItem => {
    setSelectedItemToImport(selectedItem);
  };

  const handleSaveImportAddons = () => {
    props.handleSave(selectedItemToImport);
    props.handleClose();
  };

  return (
    <>
      <Modal isOpen={props.showModal} toggle={props.handleClose} backdrop="static" size="xl" autoFocus={false}>
        <ModalBody>
          <div className="col md-6">
            <h2>
              <Translate contentKey="items.update.importAddonsModal.title"></Translate>
            </h2>
            <h4>
              <Translate contentKey="items.update.importAddonsModal.search"></Translate>
            </h4>
            <Select
              isMulti={false}
              onChange={handleItemImportChange}
              onInputChange={handleFilterChange}
              options={restaurantItemsOptions}
              getOptionLabel={option => option.name}
              getOptionValue={option => option.id}
            />
          </div>

          <ModalFooter>
            <Button color="secondary" onClick={props.handleClose} tabIndex={1}>
              <Translate contentKey="entity.action.cancel">Cancel</Translate>
            </Button>{' '}
            <Button color="primary" onClick={handleSaveImportAddons}>
              <Translate contentKey={'items.update.importAddons'}>Import Addons</Translate>
            </Button>
          </ModalFooter>
        </ModalBody>
      </Modal>
    </>
  );
};

export default AddonImportModal;
