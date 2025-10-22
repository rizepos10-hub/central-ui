import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Translate, translate, getSortState } from 'react-jhipster';
import { ArrowLeft, Save } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntities as getPrintingProfiles } from 'app/entities/settings/printing/printing-profiles/printing-profile.reducer';
import { getEntity, updateEntity, createEntity, reset } from './production-center.reducer';
import ReactSelect from "react-select";
import { OrderMethod } from "app/shared/model/ENUMS/order-method.model";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { ItemsTable } from 'app/shared/components/assign-to-item/assign-to-item';
import { filterEntities as getRegularItems, updateEntity as updateRegularItem } from 'app/entities/item/restaurant/regular-item/regular-item.reducer';
import { filterEntities as getPizzaItems, updateEntity as updatePizzaItem } from 'app/entities/item/restaurant/pizza-item/pizza-item.reducer';
import { filterEntities as getComboItems, updateEntity as updateComboItem } from 'app/entities/item/restaurant/combo-item/combo-item.reducer';
import { filterEntities as getProducts, updateEntity as updateProduct } from "app/entities/item/retail/product/product.reducer";
import { IItem } from 'app/shared/model/ITEM/item.model';
import { initialItemFilterState } from 'app/shared/model/filter-state.model';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  const [formData, setFormData] = useState({
    name: '',
    virtual: false,
  });

  const orderMethodOptions = [
    { label: 'ALL', value: null, id: 'all' },
    ...Object.keys(OrderMethod).map(method => ({ label: method, value: method, id: method }))
  ]

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
    if (productionCenterEntity.id) {
      setFormData({
        name: productionCenterEntity.name || '',
        virtual: productionCenterEntity.virtual || false,
      });
    }

    if (productionCenterEntity.printingProfile) {
      setSelectedPrintingProfile({
        value: productionCenterEntity.printingProfile.id,
        label: productionCenterEntity.printingProfile.name,
        id: productionCenterEntity.printingProfile.id
      })
    }
    if (productionCenterEntity.orderMethod) {
      setSelectedOrderMethod({
        value: productionCenterEntity.orderMethod,
        label: productionCenterEntity.orderMethod,
        id: productionCenterEntity.orderMethod
      })
    }

    if (updateSuccess) {
      handleClose();
    }
  }, [updateSuccess, productionCenterEntity]);

  const handlePrinterChange = (selectedPrintingProfile) => {
    setSelectedPrintingProfile(selectedPrintingProfile);
  }

  const handleOrderMethodChange = (selectedOrderMethod) => {
    setSelectedOrderMethod(selectedOrderMethod);
  }

  const saveEntity = () => {
    const entity = {
      ...productionCenterEntity,
      ...formData,
      printingProfile: selectedPrintingProfile ? { id: selectedPrintingProfile.value ? selectedPrintingProfile.value : selectedPrintingProfile.id } : null,
      orderMethod: selectedOrderMethod?.value || null,
    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };


  return (
    <div className="p-4">
      <div className={`grid ${isNew ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
        <div className="space-y-4">
          <h2 className="text-xl font-bold">
            <Translate contentKey="tempApp.productionCenter.home.createOrEditLabel">Create or edit a Production Center</Translate>
          </h2>

          <Card>
            <CardContent className="pt-4">
              {loading ? (
                <p>Loading...</p>
              ) : (
                <div className="space-y-4">
                  {!isNew && (
                    <div className="space-y-2">
                      <Label htmlFor="productionCenter-id" className="text-sm">
                        {translate('global.field.id')}
                      </Label>
                      <Input
                        id="productionCenter-id"
                        value={productionCenterEntity.id || ''}
                        readOnly
                        disabled
                        className="h-7 text-xs"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="productionCenter-name" className="text-sm">
                      {translate('tempApp.productionCenter.name')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="productionCenter-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-7 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">
                      {translate('tempApp.productionCenter.orderMethod')}
                    </Label>
                    <ReactSelect
                      value={selectedOrderMethod}
                      onChange={handleOrderMethodChange}
                      options={orderMethodOptions}
                      isClearable
                      styles={{
                        control: (base) => ({ ...base, minHeight: '28px', height: '28px', fontSize: '12px' }),
                        valueContainer: (base) => ({ ...base, height: '28px', padding: '0 6px' }),
                        input: (base) => ({ ...base, margin: '0', padding: '0' }),
                        indicatorsContainer: (base) => ({ ...base, height: '28px' }),
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">
                      {translate('tempApp.productionCenter.printingProfile')}
                    </Label>
                    <ReactSelect
                      value={selectedPrintingProfile}
                      onChange={handlePrinterChange}
                      options={printingProfilesList}
                      styles={{
                        control: (base) => ({ ...base, minHeight: '28px', height: '28px', fontSize: '12px' }),
                        valueContainer: (base) => ({ ...base, height: '28px', padding: '0 6px' }),
                        input: (base) => ({ ...base, margin: '0', padding: '0' }),
                        indicatorsContainer: (base) => ({ ...base, height: '28px' }),
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="productionCenter-virtual"
                      checked={formData.virtual}
                      onCheckedChange={(checked) => setFormData({ ...formData, virtual: checked === true })}
                    />
                    <Label htmlFor="productionCenter-virtual" className="text-sm">
                      {translate('tempApp.productionCenter.virtual')}
                    </Label>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={handleClose}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <Translate contentKey="entity.action.back">Back</Translate>
                    </Button>
                    <Button
                      className="h-8 text-xs"
                      onClick={saveEntity}
                      disabled={updating}
                    >
                      <Save className="h-4 w-4" />
                      <Translate contentKey="entity.action.save">Save</Translate>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {!isNew && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">
              <Translate contentKey={'tempApp.addon.assignToItem'}>Assign To Item</Translate>
            </h2>

            <Tabs defaultValue="regular" className="w-full">
              <TabsList>
                <TabsTrigger value="regular" className="text-xs">Regular</TabsTrigger>
                <TabsTrigger value="pizza" className="text-xs">Pizza</TabsTrigger>
                <TabsTrigger value="combo" className="text-xs">Combo</TabsTrigger>
                <TabsTrigger value="retail" className="text-xs">Retails Products</TabsTrigger>
              </TabsList>
              <TabsContent value="regular">
                <RegularItemsTable id={id} />
              </TabsContent>
              <TabsContent value="pizza">
                <PizzaItemsTable id={id} />
              </TabsContent>
              <TabsContent value="combo">
                <ComboItemsTable id={id} />
              </TabsContent>
              <TabsContent value="retail">
                <ProductsTable id={id} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
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
