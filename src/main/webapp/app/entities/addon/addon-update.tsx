import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, Row, Col, FormText, Spinner, Label } from "reactstrap";
import { getSortState, translate, Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, changeEntityField, reset } from './addon.reducer';
import { getEntities as getDiscounts } from 'app/entities/discount/discount.reducer';
import Select from "react-select";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { Card as PrimeCard } from 'primereact/card'
import { InputText } from "primereact/inputtext";
import { IAddon } from "app/shared/model/ADDON/addon.model";
import { IDiscount } from "app/shared/model/discount.model";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { ITag } from "app/shared/model/TAG/tag.model";
import { getEntities as getTags } from "app/entities/tag/tag.reducer";
import { getEntities as getProfileGroups } from "app/entities/settings/profile-group/profile-group.reducer";
import { IProfileGroup } from "app/shared/model/TAX/profile-group.model";
import { TabPanel, TabView } from 'primereact/tabview';
import { ItemsTable } from 'app/shared/components/assign-to-item/assign-to-item';
import { filterEntities as getRegularItems, updateEntity as updateRegularItem } from 'app/entities/item/restaurant/regular-item/regular-item.reducer';
import { filterEntities as getPizzaItems, updateEntity as updatePizzaItem } from 'app/entities/item/restaurant/pizza-item/pizza-item.reducer';
import { filterEntities as getComboItems, updateEntity as updateComboItem } from 'app/entities/item/restaurant/combo-item/combo-item.reducer';
import { IItem } from 'app/shared/model/ITEM/item.model';
import { initialItemFilterState } from 'app/shared/model/filter-state.model';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';


export const AddonUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const addonEntity: IAddon = useAppSelector(state => state.addon.entity);
  const loading = useAppSelector(state => state.addon.loading);
  const updating = useAppSelector(state => state.addon.updating);
  const discounts = useAppSelector(state => state.discount.entities);
  const tags = useAppSelector(state => state.tag.entities);
  const profileGroups = useAppSelector(state => state.profileGroup.entities);


  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );


  const handleChange = e => {
    const { name, value } = e.target;
    dispatch(changeEntityField({ name, value }))
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getDiscounts({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    dispatch(getTags({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    dispatch(getProfileGroups({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

  }, []);

  const saveEntity = (e, createNew = false) => {
    e.preventDefault();

    const entity = {
      ...addonEntity,
    };

    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;

          // @ts-expect-error -- unknown type
          if (!res?.error) {
            navigate(`/predefined-pizza/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/predefined-pizza/new`)
        }
      })
    }
  };


  const discountsOptions = discounts.map(discount => ({
    label: `${discount.type === 'PERCENTAGE' ? `${discount.value}%` : `${discount.value} ${discount.type}`}`,
    id: discount.id,
    type: discount.type,
    value: discount.value
  }));

  if (loading) {
    return <Spinner />
  }

  return (
    <div>
      <Row>
        <Col md={"12"}>
          <Row>
            <h2 id="tempApp.addon.home.createOrEditLabel" data-cy="AddonCreateUpdateHeading">
              {isNew ? (
                <Translate contentKey={'tempApp.addon.createNewAddon'}>Create New Addon</Translate>
              ) : (
                <Translate contentKey={'tempApp.addon.editAddon'}>Edit Addon</Translate>
              )}
            </h2>
          </Row>
          <PrimeCard>
            <form>
              <div className={'d-flex flex-column'}>
                <Label for="addon-name">
                  <Translate contentKey={'common.name'}>Name</Translate>
                </Label>
                <InputText name="name" required={true} id="addon-name" value={addonEntity.name || ''}
                  onChange={handleChange} />
              </div>
              <div className={'d-flex flex-column mt-3'}>
                <Label for="addon-desc">
                  <Translate contentKey={'common.description'}>Description</Translate>
                </Label>
                <InputTextarea name="desc" id="addon-desc" value={addonEntity.desc || ''} onChange={handleChange} />
              </div>
              <div className={'d-flex flex-column mt-3'}>
                <Label for="addon-price">
                  <Translate contentKey={'common.price'}>Price</Translate>
                </Label>
                <InputNumber
                  id="addon-price"
                  value={addonEntity.price || null}
                  onChange={e => dispatch(changeEntityField({ name: 'price', value: parseFloat(e.value.toString()) }))}
                  mode="decimal"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                />

              </div>

              <div className={'d-flex flex-column mt-3'}>
                <Label for="addon-profileGroup">
                  <Translate contentKey={'common.profileGroup'}>Profile Group</Translate>
                </Label>
                <Select
                  value={addonEntity?.accountingGroups || []}
                  options={profileGroups}
                  id="addon-profileGroup"

                  getOptionLabel={option => option.name}
                  getOptionValue={option => option.id}
                  onChange={selectedProfileGroups => dispatch(changeEntityField({
                    name: 'accountingGroups',
                    value: [selectedProfileGroups]
                  }))}
                />
              </div>

              <div className={'d-flex flex-column mt-3'}>
                <Label for="addon-tags">
                  <Translate contentKey={'common.tags'}>Tags</Translate>
                </Label>
                <Select
                  value={addonEntity?.tags || []}
                  isMulti={true}
                  options={tags}
                  id="addon-tags"
                  getOptionLabel={option => option.name}
                  getOptionValue={option => option.id}
                  onChange={selectedTags => dispatch(changeEntityField({
                    name: 'tags',
                    value: selectedTags as ITag[]
                  }))}
                />
              </div>
              <div className={'d-flex flex-column my-3'}>
                <Label for="addon-discount">
                  <Translate contentKey={'common.discount'}>Discounts</Translate>
                </Label>
                <Select
                  value={addonEntity.discounts || []}
                  id="addon-discount"
                  options={discountsOptions}
                  isClearable
                  getOptionLabel={option => (option.type === 'PERCENTAGE' ? `${option.value}%` : `${option.value} ${option.type}`)}
                  getOptionValue={option => option.id}
                  onChange={selectedDiscounts =>
                    dispatch(changeEntityField({
                      name: 'discounts',
                      value: selectedDiscounts ? [selectedDiscounts] : []
                    }))}
                />
              </div>
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
          </PrimeCard>
        </Col>
      </Row>
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
      addons: [
        ...rowData.addons,
        {
          id
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
      addons: rowData.addons.filter(addon => addon.id !== id)
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
    return rowData.addons?.some(addon => addon.id === id);
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
      addons: [
        ...rowData.addons,
        {
          id
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
      addons: rowData.addons.filter(addon => addon.id !== id)
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
    return rowData.addons?.some(addon => addon.id === id);
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
      addons: [
        ...rowData.addons,
        {
          id
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
      addons: rowData.addons.filter(addon => addon.id !== id)
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
    return rowData.addons?.some(addon => addon.id === id);
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

export default AddonUpdate;
