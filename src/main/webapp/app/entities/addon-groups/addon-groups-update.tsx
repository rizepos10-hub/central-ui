import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getSortState, translate, Translate } from 'react-jhipster';
import { ArrowLeft, Save } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { filterEntities as getAddons } from 'app/entities/addon/addon.reducer';
import { getEntity, updateEntity, createEntity, reset, excludeAddonsFromItems } from './addon-groups.reducer';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { FilterMatchMode } from 'primereact/api';
import axios from 'axios';
import { IAddon } from 'app/shared/model/ADDON/addon.model';
import { CreateAddonModal } from 'app/entities/addon-groups/add-addon-modal';
import { AddonGroupAddonsList } from 'app/entities/addon-groups/addon-group-addons-list';
import { IAddonGroup } from 'app/shared/model/ADDON/addon-groups.model';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddonOptionsVisibility } from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'react-toastify';

const INHERIT_ADDON_OPTIONS_VISIBILITY = 'INHERIT';

const isAddonGroupAssignedToItemOrVariant = (rowData, addonGroupId: string) => {
  if (rowData?.addonGroups?.some(addon => addon?.addonGroup?.id === addonGroupId)) {
    return true;
  }
  return rowData?.variants?.some(variant =>
    variant?.addonGroups?.some(addon => addon?.addonGroup?.id === addonGroupId)
  ) ?? false;
};

const stripAddonGroupFromItemAndVariants = (rowData, addonGroupId: string) => ({
  ...rowData,
  addonGroups: (rowData.addonGroups ?? []).filter(addon => addon?.addonGroup?.id !== addonGroupId),
  ...(rowData.variants
    ? {
        variants: rowData.variants.map(variant => ({
          ...variant,
          addonGroups: (variant.addonGroups ?? []).filter(addon => addon?.addonGroup?.id !== addonGroupId),
        })),
      }
    : {}),
});

export const AddonGroupUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

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
  const [isLoadingAddons, setIsLoadingAddons] = useState(false);
  const [addons, setAddons] = useState<IAddon[]>([]);
  const [excludePrompt, setExcludePrompt] = useState<{
    open: boolean;
    newAddonIds: string[];
    createNew: boolean;
    entity: IAddonGroup | null;
  }>({ open: false, newAddonIds: [], createNew: false, entity: null });
  // Baseline addon ids from last loaded/saved group. Do not derive from redux at save time —
  // a reset() cleanup was wiping entity.addons so every addon looked "new" and got excluded.
  const baselineAddonIdsRef = useRef<Set<string>>(new Set());

  const rememberBaselineAddons = (group?: IAddonGroup | null) => {
    baselineAddonIdsRef.current = new Set((group?.addons || []).map(a => a.id).filter((id): id is string => !!id));
  };

  const handleAddonsChange = (selectedAddons: IAddon[]) => {
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

  const fetchAddons = async (searchTerm = '') => {
    setIsLoadingAddons(true);
    try {
      const query = {
        first: 0,
        rows: 1000,
        page: 0,
        sortField: 'name',
        sortOrder: 1,
        filters: {
          name: { value: searchTerm || null, matchMode: FilterMatchMode.CONTAINS }
        }
      };
      const updatedQuery = applyMatchModeMap(query);

      // Direct axios call to bypass redux loading state
      const response = await axios.post<IAddon[]>('api/_search/addons', updatedQuery);
      setAddons(response.data);
    } catch (error) {
      console.error('Error fetching addons:', error);
      setAddons([]);
    } finally {
      setIsLoadingAddons(false);
    }
  };

  useEffect(() => {
    fetchAddons();

    if (isNew) {
      dispatch(reset());
      rememberBaselineAddons(null);
    } else {
      dispatch(getEntity(id));
    }
    return () => {
      dispatch(reset());
    };
  }, []);

  useEffect(() => {
    // Only hydrate from a loaded entity — ignore empty state after reset() so local form + baseline stay intact.
    if (!addonGroupsEntity?.id) {
      return;
    }
    setAddonGroup(addonGroupsEntity);
    rememberBaselineAddons(addonGroupsEntity);
  }, [addonGroupsEntity]);

  const saveEntity = (e, createNew = false) => {
    e?.preventDefault();
    const entity = {
      ...addonGroup,
    };

    if (isNew) {
      dispatch(createEntity(entity)).then(res => {
        if (createNew) {
          dispatch(reset());
          setAddonGroup({});
          rememberBaselineAddons(null);
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;

          // @ts-expect-error -- unknown type
          if (!res?.error) {
            navigate(`/addon-groups/${newId}/edit`);
          }
        }
      });
      return;
    }

    const previousIds = baselineAddonIdsRef.current;
    const newAddonIds = (entity.addons || [])
      .map(a => a.id)
      .filter((addonId): addonId is string => !!addonId && !previousIds.has(addonId));

    if (newAddonIds.length > 0) {
      setExcludePrompt({ open: true, newAddonIds, createNew, entity });
      return;
    }

    persistEntity(entity, createNew);
  };

  const persistEntity = (entity: IAddonGroup, createNew: boolean) => {
    return dispatch(updateEntity(entity)).then(res => {
      // @ts-expect-error -- unknown type
      if (!res?.error) {
        rememberBaselineAddons(entity);
      }
      if (createNew) {
        navigate(`/addon-groups/new`);
      }
    });
  };

  const finishExcludePrompt = async (exclude: boolean) => {
    const { entity, createNew, newAddonIds } = excludePrompt;
    setExcludePrompt({ open: false, newAddonIds: [], createNew: false, entity: null });
    if (!entity?.id) return;

    await persistEntity(entity, createNew);
    if (exclude && newAddonIds.length > 0) {
      try {
        const result = await dispatch(excludeAddonsFromItems({ id: entity.id, addonIds: newAddonIds })).unwrap();
        toast.success(`Excluded new addon(s) from ${result.data ?? 0} item(s)`);
      } catch (error: any) {
        toast.error(error?.message || 'Failed to exclude new addons from related items');
      }
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
                    onGroupUpdated={updated => {
                      setAddonGroup(updated);
                      rememberBaselineAddons(updated);
                    }}
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
                      <div className="flex max-w-md flex-col gap-2">
                        <Label htmlFor="addon-options-visibility" className="text-xs">
                          {translate('tempApp.addonGroup.addonOptionsVisibility.label')}
                        </Label>
                        <Select
                          value={addonGroup?.addonOptionsVisibility ?? INHERIT_ADDON_OPTIONS_VISIBILITY}
                          onValueChange={value =>
                            setAddonGroup(prev => ({
                              ...prev,
                              addonOptionsVisibility:
                                value === INHERIT_ADDON_OPTIONS_VISIBILITY ? null : (value as AddonOptionsVisibility),
                            }))
                          }
                        >
                          <SelectTrigger id="addon-options-visibility" className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={INHERIT_ADDON_OPTIONS_VISIBILITY} className="text-xs">
                              {translate('tempApp.addonGroup.addonOptionsVisibility.inherit')}
                            </SelectItem>
                            <SelectItem value={AddonOptionsVisibility.SHOW} className="text-xs">
                              {translate('tempApp.addonGroup.addonOptionsVisibility.show')}
                            </SelectItem>
                            <SelectItem value={AddonOptionsVisibility.HIDDEN} className="text-xs">
                              {translate('tempApp.addonGroup.addonOptionsVisibility.hide')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {translate('tempApp.addonGroup.addonOptionsVisibility.description')}
                        </p>
                      </div>
                      <AddonGroupAddonsList
                        addons={addonGroup?.addons || []}
                        availableAddons={addons}
                        isLoadingAddons={isLoadingAddons}
                        disabled={updating}
                        onAddonsChange={handleAddonsChange}
                        onSearchAddons={fetchAddons}
                      />
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
                        type="button"
                        disabled={updating}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        <Translate contentKey="entity.action.save">Save</Translate>
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs"
                        onClick={(e) => saveEntity(e, true)}
                        type="button"
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

      <AlertDialog open={excludePrompt.open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exclude new addons from existing items?</AlertDialogTitle>
            <AlertDialogDescription>
              You added {excludePrompt.newAddonIds.length} addon(s) to this group. Items that already use this group will include them by
              default (checked). Exclude them from those items so they stay unchecked until enabled per item?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={e => {
                e.preventDefault();
                finishExcludePrompt(false);
              }}
            >
              Keep included (checked)
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={e => {
                e.preventDefault();
                finishExcludePrompt(true);
              }}
            >
              Exclude from existing items
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
    const entity = stripAddonGroupFromItemAndVariants(rowData, id);

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

  const getFieldAssigned = (rowData) => isAddonGroupAssignedToItemOrVariant(rowData, id);

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
    const entity = stripAddonGroupFromItemAndVariants(rowData, id);

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

  const getFieldAssigned = (rowData) => isAddonGroupAssignedToItemOrVariant(rowData, id);

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
    const entity = stripAddonGroupFromItemAndVariants(rowData, id);

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

  const getFieldAssigned = (rowData) => isAddonGroupAssignedToItemOrVariant(rowData, id);

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
