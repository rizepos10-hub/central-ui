import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormText } from 'reactstrap';
import { getSortState, isNumber, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { Card as PrimeCard } from 'primereact/card'

import { getEntities as getPrintingProfiles } from 'app/entities/settings/printing/printing-profiles/printing-profile.reducer';
import { getEntity, updateEntity, createEntity, reset } from './production-center.reducer';
import Select from "react-select";
import { OrderMethod } from "app/shared/model/ENUMS/order-method.model";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { TabPanel, TabView } from 'primereact/tabview';
import { ItemsTable } from 'app/shared/components/assign-to-item/assign-to-item';
import { filterEntities as getRegularItems, updateEntity as updateRegularItem } from 'app/entities/item/restaurant/regular-item/regular-item.reducer';
import { filterEntities as getPizzaItems, updateEntity as updatePizzaItem } from 'app/entities/item/restaurant/pizza-item/pizza-item.reducer';
import { filterEntities as getComboItems, updateEntity as updateComboItem } from 'app/entities/item/restaurant/combo-item/combo-item.reducer';
import { filterEntities as getProducts, updateEntity as updateProduct } from "app/entities/item/retail/product/product.reducer";
import { IItem } from 'app/shared/model/ITEM/item.model';
import { initialItemFilterState } from 'app/shared/model/filter-state.model';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';

export const ProductionCenterUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const productionCenterEntity = useAppSelector(state => state.productionCenter.entity);
  const loading = useAppSelector(state => state.productionCenter.loading);
  const updating = useAppSelector(state => state.productionCenter.updating);
  const updateSuccess = useAppSelector(state => state.productionCenter.updateSuccess);

  const printingProfilesList = useAppSelector(state => state.printingProfiles.entities).map(branch => ({ value: branch.id, label: branch.name }));

  const initialPrintingProfile = { label: productionCenterEntity?.printingProfile?.name, value: productionCenterEntity?.printingProfile?.id }

  const initialOrderMethod = { label: productionCenterEntity?.orderMethod, value: productionCenterEntity?.orderMethod }

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const [selectedPrintingProfile, setSelectedPrintingProfile] = useState<{ value: string; label: string; id: string; } | undefined>();

  const [selectedOrderMethod, setSelectedOrderMethod] = useState<{ value: string; label: string; id: string; } | undefined>();


  const orderMethodOptions = Object.keys(OrderMethod).map(method => ({ label: method, value: method, id: method }))

  console.log(orderMethodOptions, 'orderMethodOptions')

  const handleClose = () => {
    navigate(-1);
  };



  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));

    }
    dispatch(getPrintingProfiles({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }))
  }, []);

  useEffect(() => {

    if (productionCenterEntity.printingProfile) {
      setSelectedPrintingProfile(productionCenterEntity.printingProfile)
    }
    if (productionCenterEntity.orderMethod) {
      setSelectedOrderMethod(productionCenterEntity.orderMethod)
    }

    if (updateSuccess) {
      handleClose();
    }
  }, [updateSuccess, productionCenterEntity]);

  console.log(productionCenterEntity, 'productionCenterEntity')

  const handlePrinterChange = (selectedPrintingProfile) => {
    setSelectedPrintingProfile(selectedPrintingProfile);
  }

  const handleOrderMethodChange = (selectedOrderMethod) => {
    setSelectedOrderMethod(selectedOrderMethod);
  }

  const saveEntity = values => {
    const entity = {
      ...productionCenterEntity,
      ...values,
      printingProfile: { id: selectedPrintingProfile.value ? selectedPrintingProfile.value : selectedPrintingProfile.id },
    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  const defaultValues = () =>
    isNew
      ? {}
      : {
        ...productionCenterEntity,
        branch: productionCenterEntity.branch,
      };


  return (
    <div>
      <Row>
        <Col md={isNew ? "12" : "6"}>
          <Row>
            <h2 id="tempApp.productionCenter.home.createOrEditLabel" data-cy="PrinterCreateUpdateHeading">
              <Translate contentKey="tempApp.productionCenter.home.createOrEditLabel">Create or edit a Printer</Translate>
            </h2>
          </Row>
          <PrimeCard>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <ValidatedForm defaultValues={defaultValues()} onSubmit={saveEntity}>
                {!isNew ? (
                  <ValidatedField
                    name="id"
                    required
                    readOnly
                    id="productionCenter-id"
                    label={translate('global.field.id')}
                    validate={{ required: true }}
                  />
                ) : null}
                <ValidatedField
                  label={translate('tempApp.productionCenter.name')}
                  id="productionCenter-name"
                  name="name"
                  data-cy="name"
                  type="text"
                  validate={{
                    required: { value: true, message: translate('entity.validation.required') },
                  }}
                />
                <div className="mb-3">
                  {translate('tempApp.productionCenter.orderMethod')}
                  <Select defaultValue={initialOrderMethod}
                    onChange={handleOrderMethodChange} options={orderMethodOptions} />
                </div>

                <div className="mb-3">
                  {translate('tempApp.productionCenter.printingProfile')}
                  <Select defaultValue={initialPrintingProfile}
                    onChange={handlePrinterChange} options={printingProfilesList} />
                </div>

                <ValidatedField label={translate('tempApp.productionCenter.virtual')} id="productionCenter-virtual"
                  className="d-flex gap-2 my-2" name="virtual" data-cy="virtual" type="checkbox" />

                <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/productionCenter" replace color="info">
                  <FontAwesomeIcon icon="arrow-left" />
                  &nbsp;
                  <span className="d-none d-md-inline">
                    <Translate contentKey="entity.action.back">Back</Translate>
                  </span>
                </Button>
                &nbsp;
                <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                  <FontAwesomeIcon icon="save" />
                  &nbsp;
                  <Translate contentKey="entity.action.save">Save</Translate>
                </Button>
              </ValidatedForm>
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
              <TabPanel header="Retails Products">
                <ProductsTable id={id} />
              </TabPanel>
            </TabView>
          </Col>
        )}
      </Row>
    </div >
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
      productionCenter: {
        id
      }
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
      productionCenter: null
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
    return rowData.productionCenter?.id === id
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
      productionCenter: {
        id
      }
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
      productionCenter: null
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
    return rowData.productionCenter?.id === id
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
      productionCenter: {
        id
      }
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
      productionCenter: null
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
    return rowData.productionCenter?.id === id
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

const ProductsTable = ({
  id
}: {
  id: string
}) => {
  const dispatch = useAppDispatch();
  const products: IItem[] = useAppSelector(state => state.product.entities);
  const loading = useAppSelector(state => state.product.loading);
  const totalItems = useAppSelector(state => state.product.totalItems);
  const [isUpdating, setIsUpdating] = useState({
    value: false,
    id: ''
  });
  const [query, setQuery] = useState(initialItemFilterState);

  const assignNewEntity = (rowData) => {
    setIsUpdating({
      value: true,
      id: products.find(item => item.id === rowData.id)?.id
    });
    const entity = {
      ...rowData,
      productionCenter: {
        id
      }
    }

    dispatch(updateProduct(entity))
      .finally(() => {
        const updatedQuery = applyMatchModeMap(query);

        dispatch(getRegularItems({
          query: updatedQuery,
        }));

        setIsUpdating({
          value: false,
          id: products.find(item => item.id === rowData.id)?.id
        });
      })
  }

  const unassignNewEntity = (rowData) => {
    setIsUpdating({
      value: true,
      id: products.find(item => item.id === rowData.id)?.id
    });
    const entity = {
      ...rowData,
      productionCenter: null
    }

    dispatch(updateProduct(entity))
      .finally(() => {
        const updatedQuery = applyMatchModeMap(query);

        dispatch(getRegularItems({
          query: updatedQuery,
        }));

        setIsUpdating({
          value: false,
          id: products.find(item => item.id === rowData.id)?.id
        });
      })
  }

  const getFieldAssigned = (rowData) => {
    return rowData.productionCenter?.id === id
  }

  return (
    <ItemsTable
      query={query}
      setQuery={setQuery}
      items={products}
      loading={loading}
      totalItems={totalItems}
      fetchEntities={getProducts}
      assignNewEntity={assignNewEntity}
      unassignNewEntity={unassignNewEntity}
      isUpdating={isUpdating}
      getFieldAssigned={getFieldAssigned}
    />
  );
}

export default ProductionCenterUpdate;
