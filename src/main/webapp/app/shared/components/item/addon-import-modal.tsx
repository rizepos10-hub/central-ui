import React, { useState, useEffect, useMemo } from 'react';
import { Button, Col, Modal, ModalBody, ModalFooter, Row } from 'reactstrap';
import { Translate } from 'react-jhipster';
import Select from 'react-select';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { searchEntitiesRestaurant as getRestaurantItems } from 'app/entities/item/restaurant/restaurant-item.reducer';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import debounce from 'lodash.debounce'; // Use lodash.debounce for debouncing
import { IItem } from 'app/shared/model/ITEM/item.model';
import { confirmDialog } from 'primereact/confirmdialog';
import { IRegularItem } from 'app/shared/model/ITEM/restaurant/regular-item.model';
import { IAddonGroups } from 'app/shared/model/ADDON/addon-groups.model';

interface IAddonImportProps {
  showModal: boolean;
  handleClose?: () => void;
  handleSave: (item: IAddonGroups[], variantId?: string) => void;
  variantId?: string;
}

const AddonImportModal = (props: IAddonImportProps) => {
  const dispatch = useAppDispatch();
  const restaurantItemsOptions = useAppSelector(state => state.restaurantItems.entities);
  const [chosenItem, setChosenItem] = useState<IRegularItem>({});
  // const [selectedItemToImport, setSelectedItemToImport] = useState({});
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

  const handleSelectedItemChange = (selectedItem) => {
    setChosenItem(selectedItem);
  };

  // const handleSaveImportAddons = () => {
  //   confirm1(selectedItemToImport);
  // };

  const handleImportAddons = (selectedGroupsToImport: IAddonGroups[]) => {
    confirm1(selectedGroupsToImport);
  };

  const confirm1 = (selectedItemToImport: IAddonGroups[]) => {
    confirmDialog({
      message:
        'Importing this item will override the existing addons. Are you sure you want to continue?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      defaultFocus: 'accept',
      accept: () => props.handleSave(selectedItemToImport, props.variantId),
    });
  };

  // const allAddonGroups = useMemo(() => {
  //   const variantAddonGroups = chosenItem.variants.flatMap(variant => variant.addonGroups);
  //   return [...chosenItem.addonGroups, ...variantAddonGroups];
  // }, [])

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
              onChange={handleSelectedItemChange}
              onInputChange={handleFilterChange}
              options={restaurantItemsOptions}
              getOptionLabel={option => option.name}
              getOptionValue={option => option.id}
            />
          </div>
          <Row>
            {chosenItem.addonGroups?.length > 0 && (
              <Col md={4}>
                <div className='d-flex flex-column gap-1'>
                  <div className='border-bottom'>
                    {chosenItem.addonGroups?.map((group, idx) => {
                      if (group.addonGroup.addons?.length === 0) return null
                      const addonNames = group.addonGroup.addons?.map(
                        addon => addon.name
                      )
                      return (
                        <div key={idx}>
                          <div className='fs-5 fw-bold'>
                            {group.addonGroup.name || group.name}
                          </div>
                          <div>
                            <div>
                              {addonNames}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div>
                    <Button onClick={() => handleImportAddons(chosenItem?.addonGroups)}>
                      Import
                    </Button>
                  </div>
                </div>
              </Col>
            )}
            {chosenItem.variants?.map((variant, vIndex) => {
              if (!variant?.addonGroups || variant?.addonGroups?.length === 0) return null
              return (
                <Col md={4} key={vIndex}>
                  <div className='border-bottom'>
                    {variant.addonGroups?.map((group, idx) => {
                      if (group?.addonGroup?.addons?.length === 0) return null
                      const addonNames = group.addonGroup.addons?.map(addon => addon.name).join(", ")
                      return (
                        <div key={idx}>
                          <div className='fs-5 fw-bold'>
                            {group.addonGroup.name || group.name}
                          </div>
                          <div>
                            {addonNames}
                          </div>
                        </div>
                      )
                    })}
                    <div>
                      <Button onClick={() => handleImportAddons(variant?.addonGroups)}>
                        Import
                      </Button>
                    </div>
                  </div>
                </Col>
              )
            })}
          </Row>

          <ModalFooter>
            <Button color="secondary" onClick={props.handleClose} tabIndex={1}>
              <Translate contentKey="entity.action.cancel">Cancel</Translate>
            </Button>{' '}
            {/* <Button color="primary" onClick={handleSaveImportAddons}>
              <Translate contentKey={'items.update.importAddons'}>Import Addons</Translate>
            </Button> */}
          </ModalFooter>
        </ModalBody>
      </Modal >
    </>
  );
};

export default AddonImportModal;
