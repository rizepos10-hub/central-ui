import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label } from 'reactstrap';
import { getSortState, Translate, } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getAddons } from 'app/entities/addon/addon.reducer';
import { getEntity, updateEntity, createEntity, reset } from './addon-groups.reducer';
import Select from 'react-select';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { Card as PrimeCard } from 'primereact/card';
import { Button as PrimeButton } from 'primereact/button';
import { CreateAddonModal } from 'app/entities/addon-groups/add-addon-modal';
import { InputText } from 'primereact/inputtext';
import { IAddonGroup } from 'app/shared/model/ADDON/addon-groups.model';
import { TabPanel, TabView } from 'primereact/tabview';
import { filterEntities as getRegularItems, updateEntity as updateRegularItem } from 'app/entities/item/restaurant/regular-item/regular-item.reducer';
import { filterEntities as getPizzaItems, updateEntity as updatePizzaItem } from 'app/entities/item/restaurant/pizza-item/pizza-item.reducer';
import { filterEntities as getComboItems, updateEntity as updateComboItem } from 'app/entities/item/restaurant/combo-item/combo-item.reducer';
import { IItem } from 'app/shared/model/ITEM/item.model';
import { ItemsTable } from 'app/shared/components/assign-to-item/assign-to-item';
import { initialItemFilterState } from 'app/shared/model/filter-state.model';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';

export const AddonGroupUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const addons = useAppSelector(state => state.addon.entities);
  const newAddon = useAppSelector(state => state.addon.entity);

  const addonGroupsEntity = useAppSelector(state => state.addonGroups.entity);
  const loading = useAppSelector(state => state.addonGroups.loading);
  const updating = useAppSelector(state => state.addonGroups.updating);
  const updateSuccess = useAppSelector(state => state.addonGroups.updateSuccess);
  const addonUpdateSuccess = useAppSelector(state => state.addon.updateSuccess);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const [addonGroup, setAddonGroup] = useState<IAddonGroup>();
  const [showModal, setShowModal] = useState(false);

  const handleAddonChange = selectedAddons => {
    setAddonGroup(prev => ({
      ...prev,
      addons: selectedAddons,
    }));
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setAddonGroup(prevState => ({ ...prevState, [name]: value }));
  };

  const handleClose = () => {
    navigate(-1);
  };

  const handleShowModal = () => {
    setShowModal(prev => !prev);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
  }, []);

  useEffect(() => {
    dispatch(
      getAddons({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );

    if (addonUpdateSuccess && newAddon?.id && !isNew) {
      const entity = {
        ...addonGroup,
        addons: [...(addonGroup?.addons || []), newAddon],
      };
      dispatch(updateEntity(entity));
    }
  }, [addonUpdateSuccess]);

  useEffect(() => {
    if (addonGroupsEntity.id) {
      setAddonGroup(addonGroupsEntity);
    }
    return () => {
      dispatch(reset());
    };
  }, [addonGroupsEntity.id]);

  const saveEntity = (e, createNew = false) => {
    e?.preventDefault();
    const entity = {
      ...addonGroup,
    };

    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          dispatch(reset());
          setAddonGroup({})
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;

          // @ts-expect-error -- unknown type
          if (!res?.error) {
            navigate(`/addon-groups/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/addon-groups/new`)
        }
      })
    }
  };

  return (
    <div>
      <Row>
        <Col md={isNew ? "12" : "6"}>
          <Row>
            <h2 id="tempApp.addon.home.createOrEditLabel" data-cy="AddonCreateUpdateHeading">
              {isNew ? (
                <Translate contentKey={'tempApp.addonGroup.createNewAddonGroup'}>Create New Addon Group</Translate>
              ) : (
                <Translate contentKey={'tempApp.addonGroup.editAddonGroup'}>Edit Addon Group</Translate>
              )}
            </h2>
          </Row>
          <PrimeCard>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <>
                <div className={'d-flex justify-content-end'}>
                  <PrimeButton onClick={handleShowModal}>
                    <Translate contentKey={'tempApp.addonGroup.createAndAddAddon'}>Create And Add Addon</Translate>
                  </PrimeButton>
                </div>

                <CreateAddonModal isOpen={showModal} toggle={handleShowModal} />

                <form>
                  <FormGroup className={"d-flex flex-column gap-3"}>
                    <div className={'d-flex flex-column'}>
                      <Label for="addon-group-name">
                        <Translate contentKey={'common.name'}>Addon Name</Translate>
                      </Label>
                      <InputText
                        type="text"
                        name="name"
                        required={true}
                        id="addon-group-name"
                        value={addonGroup?.name || ''}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="mb-3">
                      <Translate contentKey="common.addons">Addons</Translate>
                      <Select
                        isMulti={true}
                        value={addonGroup?.addons || []}
                        onChange={handleAddonChange}
                        options={addons}
                        getOptionLabel={option => option.name}
                        getOptionValue={option => option.id}
                      />
                    </div>
                  </FormGroup>

                  <Button id="cancel-save" data-cy="entityCreateCancelButton" onClick={() => navigate(-1)} color="info">
                    <FontAwesomeIcon icon="arrow-left" />
                    &nbsp;
                    <span className="d-none d-md-inline">
                      <Translate contentKey="entity.action.back">Back</Translate>
                    </span>
                  </Button>
                  &nbsp;
                  <Button onClick={saveEntity} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                    <FontAwesomeIcon icon="save" />
                    &nbsp;
                    <Translate contentKey="entity.action.save">Save</Translate>
                  </Button>
                  &nbsp;
                  <Button onClick={(e) => saveEntity(e, true)} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                    <FontAwesomeIcon icon="save" />
                    &nbsp;
                    <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
                  </Button>
                </form>
              </>
            )}
          </PrimeCard>
        </Col>
        {!isNew && (
          <Col md="6">
            <Row>
              <h2 id="tempApp.addon.home.createOrEditLabel" data-cy="AddonCreateUpdateHeading">
                <Translate contentKey={'tempApp.addon.assignToItem'}>Assign To Item</Translate>
              </h2>
            </Row>
            <TabView>
              <TabPanel header="Regular">
                <RegularItemsTable id={id} />
              </TabPanel>
              <TabPanel header="Pizza">
                <PizzaItemsTable id={id} />
              </TabPanel>
              <TabPanel header="Combo">
                <ComboItemsTable id={id} />
              </TabPanel>
            </TabView>
          </Col>
        )}
      </Row >
    </div>
  );
};

const RegularItemsTable = ({
  id
}: {
  id: string
}) => {
  const dispatch = useAppDispatch();
  const regularItems = useAppSelector(state => state.regularItem.entities);
  const loading = useAppSelector(state => state.regularItem.loading);
  const totalItems = useAppSelector(state => state.regularItem.totalItems);
  const [isUpdating, setIsUpdating] = useState({
    value: false,
    id: ''
  });
  const [query, setQuery] = useState(initialItemFilterState);

  const assignNewEntity = (rowData) => {
    setIsUpdating({
      value: true,
      id: regularItems.find(item => item.id === rowData.id)?.id
    });
    const entity = {
      ...rowData,
      addonGroups: [
        ...rowData.addonGroups,
        {
          addonGroup: {
            id
          }
        }
      ]
    }

    dispatch(updateRegularItem(entity))
      .finally(() => {
        const updatedQuery = applyMatchModeMap(query);

        dispatch(getRegularItems({
          query: updatedQuery,
        }));

        setIsUpdating({
          value: false,
          id: regularItems.find(item => item.id === rowData.id)?.id
        });
      })
  }

  const unassignNewEntity = (rowData) => {
    setIsUpdating({
      value: true,
      id: regularItems.find(item => item.id === rowData.id)?.id
    });
    const entity = {
      ...rowData,
      addonGroups: rowData.addonGroups.filter(addon => addon.addonGroup.id !== id)
    }

    dispatch(updateRegularItem(entity))
      .finally(() => {
        const updatedQuery = applyMatchModeMap(query);

        dispatch(getRegularItems({
          query: updatedQuery,
        }));

        setIsUpdating({
          value: false,
          id: regularItems.find(item => item.id === rowData.id)?.id
        });
      })
  }

  const getFieldAssigned = (rowData) => {
    return rowData.addonGroups?.some(addon => addon.addonGroup.id === id);
  }

  return (
    <ItemsTable
      query={query}
      setQuery={setQuery}
      items={regularItems}
      loading={loading}
      totalItems={totalItems}
      fetchEntities={getRegularItems}
      assignNewEntity={assignNewEntity}
      unassignNewEntity={unassignNewEntity}
      isUpdating={isUpdating}
      getFieldAssigned={getFieldAssigned}
    />
  );
}

const PizzaItemsTable = ({
  id
}: {
  id: string
}) => {
  const dispatch = useAppDispatch();
  const pizzaItems: IItem[] = useAppSelector(state => state.pizzaItem.entities);
  const loading = useAppSelector(state => state.pizzaItem.loading);
  const totalItems = useAppSelector(state => state.pizzaItem.totalItems);
  const [isUpdating, setIsUpdating] = useState({
    value: false,
    id: ''
  });
  const [query, setQuery] = useState(initialItemFilterState);

  const assignNewEntity = (rowData) => {
    setIsUpdating({
      value: true,
      id: pizzaItems.find(item => item.id === rowData.id)?.id
    });
    const entity = {
      ...rowData,
      addonGroups: [
        ...rowData.addonGroups,
        {
          addonGroup: {
            id
          }
        }
      ]
    }

    dispatch(updatePizzaItem(entity))
      .finally(() => {
        const updatedQuery = applyMatchModeMap(query);

        dispatch(getRegularItems({
          query: updatedQuery,
        }));

        setIsUpdating({
          value: false,
          id: pizzaItems.find(item => item.id === rowData.id)?.id
        });
      })
  }

  const unassignNewEntity = (rowData) => {
    setIsUpdating({
      value: true,
      id: pizzaItems.find(item => item.id === rowData.id)?.id
    });
    const entity = {
      ...rowData,
      addonGroups: rowData.addonGroups.filter(addon => addon.addonGroup.id !== id)
    }

    dispatch(updatePizzaItem(entity))
      .finally(() => {
        const updatedQuery = applyMatchModeMap(query);

        dispatch(getRegularItems({
          query: updatedQuery,
        }));

        setIsUpdating({
          value: false,
          id: pizzaItems.find(item => item.id === rowData.id)?.id
        });
      })
  }

  const getFieldAssigned = (rowData) => {
    return rowData.addonGroups?.some(addon => addon.addonGroup.id === id);
  }

  return (
    <ItemsTable
      query={query}
      setQuery={setQuery}
      items={pizzaItems}
      loading={loading}
      totalItems={totalItems}
      fetchEntities={getPizzaItems}
      assignNewEntity={assignNewEntity}
      unassignNewEntity={unassignNewEntity}
      isUpdating={isUpdating}
      getFieldAssigned={getFieldAssigned}
    />
  );
}

const ComboItemsTable = ({
  id
}: {
  id: string
}) => {
  const dispatch = useAppDispatch();
  const comboItems: IItem[] = useAppSelector(state => state.comboItem.entities);
  const loading = useAppSelector(state => state.comboItem.loading);
  const totalItems = useAppSelector(state => state.comboItem.totalItems);
  const [isUpdating, setIsUpdating] = useState({
    value: false,
    id: ''
  });
  const [query, setQuery] = useState(initialItemFilterState);

  const assignNewEntity = (rowData) => {
    setIsUpdating({
      value: true,
      id: comboItems.find(item => item.id === rowData.id)?.id
    });
    const entity = {
      ...rowData,
      addonGroups: [
        ...rowData.addonGroups,
        {
          addonGroup: {
            id
          }
        }
      ]
    }

    dispatch(updateComboItem(entity))
      .finally(() => {
        const updatedQuery = applyMatchModeMap(query);

        dispatch(getRegularItems({
          query: updatedQuery,
        }));

        setIsUpdating({
          value: false,
          id: comboItems.find(item => item.id === rowData.id)?.id
        });
      })
  }

  const unassignNewEntity = (rowData) => {
    setIsUpdating({
      value: true,
      id: comboItems.find(item => item.id === rowData.id)?.id
    });
    const entity = {
      ...rowData,
      addonGroups: rowData.addonGroups.filter(addon => addon.addonGroup.id !== id)
    }

    dispatch(updateComboItem(entity))
      .finally(() => {
        const updatedQuery = applyMatchModeMap(query);

        dispatch(getRegularItems({
          query: updatedQuery,
        }));

        setIsUpdating({
          value: false,
          id: comboItems.find(item => item.id === rowData.id)?.id
        });
      })
  }

  const getFieldAssigned = (rowData) => {
    return rowData.addonGroups?.some(addon => addon.addonGroup.id === id);
  }

  return (
    <ItemsTable
      query={query}
      setQuery={setQuery}
      items={comboItems}
      loading={loading}
      totalItems={totalItems}
      fetchEntities={getComboItems}
      assignNewEntity={assignNewEntity}
      unassignNewEntity={unassignNewEntity}
      isUpdating={isUpdating}
      getFieldAssigned={getFieldAssigned}
    />
  );
}

export default AddonGroupUpdate;
