import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getSortState, Translate } from 'react-jhipster';
import { ArrowLeft, Save } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getAddons } from 'app/entities/addon/addon.reducer';
import { getEntity, updateEntity, createEntity, reset } from './addon-groups.reducer';
import Select from 'react-select';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { CreateAddonModal } from 'app/entities/addon-groups/add-addon-modal';
import { IAddonGroup } from 'app/shared/model/ADDON/addon-groups.model';
import { filterEntities as getRegularItems, updateEntity as updateRegularItem } from 'app/entities/item/restaurant/regular-item/regular-item.reducer';
import { filterEntities as getPizzaItems, updateEntity as updatePizzaItem } from 'app/entities/item/restaurant/pizza-item/pizza-item.reducer';
import { filterEntities as getComboItems, updateEntity as updateComboItem } from 'app/entities/item/restaurant/combo-item/combo-item.reducer';
import { IItem } from 'app/shared/model/ITEM/item.model';
import { ItemsTable } from 'app/shared/components/assign-to-item/assign-to-item';
import { initialItemFilterState } from 'app/shared/model/filter-state.model';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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
    dispatch(getAddons({
      page: 0,
      size: 1000,
      sort: 'name,asc'
    }));

    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
  }, []);

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
    <PageWrapper>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          {isNew ? (
            <Translate contentKey={'tempApp.addonGroup.createNewAddonGroup'}>Create New Addon Group</Translate>
          ) : (
            <Translate contentKey={'tempApp.addonGroup.editAddonGroup'}>Edit Addon Group</Translate>
          )}
        </h2>
      </div>
      <div className={isNew ? "" : "flex gap-4"}>
        <div className={isNew ? "max-w-2xl" : "w-1/3"}>
          <Card>
            <CardContent className="p-6">
              {loading ? (
                <p>Loading...</p>
              ) : (
                <>
                  <div className="flex justify-end mb-4">
                    <Button onClick={handleShowModal} size="sm" className="h-8 text-xs">
                      <Translate contentKey={'tempApp.addonGroup.createAndAddAddon'}>Create And Add Addon</Translate>
                    </Button>
                  </div>

                  <CreateAddonModal
                    isOpen={showModal}
                    toggle={handleShowModal}
                    addonGroup={addonGroup}
                  />

                  <form>
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="addon-group-name" className="text-xs">
                          <Translate contentKey={'common.name'}>Addon Name</Translate>
                        </Label>
                        <Input
                          type="text"
                          name="name"
                          required={true}
                          id="addon-group-name"
                          value={addonGroup?.name || ''}
                          onChange={handleChange}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label className="text-xs">
                          <Translate contentKey="common.addons">Addons</Translate>
                        </Label>
                        <Select
                          isMulti={true}
                          value={addonGroup?.addons || []}
                          onChange={handleAddonChange}
                          options={addons}
                          getOptionLabel={option => option.name}
                          getOptionValue={option => option.id}
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: '32px',
                              fontSize: '0.75rem',
                            }),
                            option: (base) => ({
                              ...base,
                              fontSize: '0.75rem',
                            }),
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => navigate(-1)}
                        type="button"
                      >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        <Translate contentKey="entity.action.back">Back</Translate>
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs"
                        onClick={saveEntity}
                        type="submit"
                        disabled={updating}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        <Translate contentKey="entity.action.save">Save</Translate>
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs"
                        onClick={(e) => saveEntity(e, true)}
                        type="submit"
                        disabled={updating}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        {!isNew && (
          <div className="flex-1">
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold">
                  <Translate contentKey={'tempApp.addon.assignToItem'}>Assign To Item</Translate>
                </h2>
              </CardHeader>
              <CardContent className="p-4">
                <Tabs defaultValue="regular">
                  <TabsList>
                    <TabsTrigger value="regular">Regular</TabsTrigger>
                    <TabsTrigger value="pizza">Pizza</TabsTrigger>
                    <TabsTrigger value="combo">Combo</TabsTrigger>
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
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageWrapper>
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
