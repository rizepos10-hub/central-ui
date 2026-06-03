import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getSortState, translate, Translate, ValidatedField } from 'react-jhipster';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './combo-item.reducer';
import SharedItemUpdate from "app/shared/components/item/shared-item-update";
import { IComboItem } from "app/shared/model/ITEM/restaurant/combo-item.model";
import Select from 'app/shared/components/select/select';
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import ComboItemSelection from "app/entities/item/restaurant/combo-item/combo-item-selection";
import ComboItemAddonDropDown from "app/entities/item/restaurant/combo-item/combo-item-addon";
import Visibility from "app/shared/Visibility/Visibility";
import ItemLoyaltyTab from "app/shared/components/item/item-loyalty-tab";
import { getEntities as getDiscounts } from "app/entities/discount/discount.reducer";
import { getEntities as getMixAndMatchRules } from "app/entities/mix-and-match-rule/mix-and-match-rule.reducer";
import AuditLogs from "app/shared/components/logs/audit-logs";
import VariantBranchPrice from "app/shared/components/item/variant-branch-price";
import DiscountDropdown from "app/shared/components/item/discount-dropdown";
import { preventEnterSubmit } from "app/shared/util/form-utils";
import CustomDefinitionValuesWrapper from 'app/shared/components/custom-definition-values/custom-definition-values-wrapper';
import { CustomDefinitionEntityType } from 'app/shared/model/CUSTOM-DEFINITION/custom-definition-value.model';
import SharedAddon from 'app/shared/components/item/addon';
import SeoTags from 'app/shared/components/item/seo-tags';
import EBTEligibleBranches from 'app/shared/components/item/ebt-eligible-branches';
import { DraggableList } from 'app/shared/components/draggable-list/draggable-list';
import { IScheduledBranchPrice } from 'app/shared/model/ITEM/retail/variable-item.model';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, PlusCircle, Loader2, Trash2 } from 'lucide-react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';


export const ComboItemUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;
  const comboItemEntity: IComboItem = useAppSelector(state => state.comboItem.entity);
  const loading = useAppSelector(state => state.comboItem.loading);
  const updating = useAppSelector(state => state.comboItem.updating);
  const updateSuccess = useAppSelector(state => state.comboItem.updateSuccess);
  const branchList = useAppSelector(state => state.branch.entities);
  const discountList = useAppSelector(state => state.discount.entities);
  const mixAndMatchRuleList = useAppSelector(state => state.mixAndMatchRule.entities);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );


  const [comboItem, setComboItem] = useState<IComboItem>({});

  const [isModalOpen, setIsModalOpen] = useState(false);



  const toggleModal = () => {
    setIsModalOpen((prevState) => !prevState)
  }

  const handleFieldChange = useCallback((fieldName, value) => {
    setComboItem((prevState) => ({
      ...prevState,
      [fieldName]: value,
    }));
  }, []);



  const handleComboVariantChange = (fieldName, value) => {
    setComboItem((prev) => ({
      ...prev,
      variants: [
        {
          ...(prev.variants && prev?.variants?.[0] ? prev.variants[0] : {}),
          [fieldName]: value,
        }
      ]
    }))
  };


  const handleBranchPriceChange = (variantIndex = 0, branchId, priceType, price) => {
    setComboItem(prev => ({
      ...prev,
      variants: [
        {
          ...(prev.variants && prev.variants[variantIndex] ? prev.variants[variantIndex] : {}),
          branchVariantDetails: {
            ...prev.variants[variantIndex]?.branchVariantDetails,
            [branchId]: {
              ...(prev.variants?.[variantIndex]?.branchVariantDetails?.[branchId]),
              branch: { id: branchId },
              [priceType]: price,
            },
          },
        },
      ],
    }));
  };

  const updateSeoTags = (fieldName, value) => {
    setComboItem(prevItem => ({
      ...prevItem,
      seo: {
        ...prevItem.seo,
        [fieldName]: value
      }
    }));
  };

  const handleAddItems = (selectedVariants) => {
    const updatedComboItem = {
      ...comboItem,
      variants: [
        {
          ...(comboItem.variants && comboItem.variants?.[0] ? comboItem.variants[0] : {}),
          comboPackages: [
            ...(comboItem.variants?.[0]?.comboPackages || []),
            ...selectedVariants,
          ],
        },
      ],
    };

    setComboItem(updatedComboItem);
    toggleModal();
  };


  const handleComboAmountChange = (index, newAmount) => {
    const updatedComboItem = {
      ...comboItem,
      variants: [
        {
          ...(comboItem.variants && comboItem.variants?.[0] ? comboItem.variants[0] : {}),
          comboPackages: comboItem.variants?.[0]?.comboPackages?.map((comboPackage, i) => {
            if (i === index) {
              return {
                ...comboPackage,
                amount: newAmount,
              };
            }
            return comboPackage;
          }),
        },
      ],
    };
    setComboItem(updatedComboItem)
  }

  const handleAddComboAddon = (index, addon) => {
    const newComboAddon = {
      addon,
      amount: 1
    }
    const updatedComboItem = {
      ...comboItem,
      variants: [
        {
          ...(comboItem.variants && comboItem.variants?.[0] ? comboItem.variants[0] : {}),
          comboPackages: comboItem.variants?.[0]?.comboPackages?.map((comboPackage, i) => {
            if (i === index) {
              return {
                ...comboPackage,
                addons: [...(comboPackage.addons || []), newComboAddon],
              };
            }
            return comboPackage;
          }),
        },
      ],
    };
    setComboItem(updatedComboItem);
  };

  const handleAddonAmountChange = (packageIndex, addonIndex, action) => {
    const updatedComboItem = {
      ...comboItem,
      variants: [
        {
          ...(comboItem.variants && comboItem.variants?.[0] ? comboItem.variants[0] : {}),
          comboPackages: comboItem.variants?.[0]?.comboPackages?.map((comboPackage, i) => {
            if (i === packageIndex) {
              return {
                ...comboPackage,
                addons: comboPackage.addons?.map((addon, j) => {
                  if (j === addonIndex) {
                    return {
                      ...addon,
                      amount: action === 'increment' ? addon.amount + 1 : Math.max(addon.amount - 1, 0),
                    };
                  }
                  return addon;
                }),
              };
            }
            return comboPackage;
          }),
        },
      ],
    };

    setComboItem(updatedComboItem);
  };

  const handleDeleteComboAddon = (packageIndex, addonIndex) => {
    const updatedComboItem = {
      ...comboItem,
      variants: [
        {
          ...(comboItem.variants && comboItem.variants?.[0] ? comboItem.variants[0] : {}),
          comboPackages: comboItem.variants?.[0]?.comboPackages?.map((comboPackage, i) => {
            if (i === packageIndex) {
              return {
                ...comboPackage,
                addons: comboPackage.addons.filter((_, j) => j !== addonIndex), // Remove the selected addon
              };
            }
            return comboPackage;
          }),
        },
      ],
    };

    setComboItem(updatedComboItem);
  };

  const handleDeleteComboPackage = (index) => {
    const updatedComboItem = {
      ...comboItem,
      variants: [
        {
          ...(comboItem.variants && comboItem.variants?.[0] ? comboItem.variants[0] : {}),
          comboPackages: comboItem.variants?.[0]?.comboPackages.filter((_, i) => i !== index),
        },
      ],
    };

    setComboItem(updatedComboItem);
  };

  const handleNavigate = (comboItemId) => {
    navigate(`/restaurant/combo/${comboItemId}/edit` + location.search);
  };

  const handleBackClick = () => {
    const fromMenuId = new URLSearchParams(location.search).get('fromMenu');
    if (fromMenuId) {
      navigate(`/menu/${fromMenuId}/ONLINE_ORDERING/edit?page=1&sort=id,asc`);
    } else {
      navigate("/restaurant/combo");
    }
  }

  useEffect(() => {
    if (isNew) {
      dispatch(reset())
    } else {
      dispatch(getEntity(id));
    }

    dispatch(getBranches({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    dispatch(getDiscounts({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    dispatch(getMixAndMatchRules({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));


  }, [id, isNew]);

  useEffect(() => {
    setComboItem({
      ...comboItemEntity,
    })
  }, [comboItemEntity, updateSuccess]);

  const handleHideItemPerBranch = (branchId, variantIndex, field: 'hideItem' | 'hideOnline') => {
    setComboItem(prev => {
      const updatedVariants = [...prev.variants];
      updatedVariants[variantIndex] = {
        ...(prev.variants && prev.variants[variantIndex] ? prev.variants[variantIndex] : {}),
        branchVariantDetails: {
          ...(prev.variants[variantIndex]?.branchVariantDetails || {}),
          [branchId]: {
            ...prev.variants?.[variantIndex]?.branchVariantDetails?.[branchId],
            [field]: !prev?.variants?.[variantIndex]?.branchVariantDetails?.[branchId]?.[field],
          },
        },
      };
      return {
        ...prev,
        variants: updatedVariants,
      };
    });
  };

  const handleSaveScheduledPrices = (variantIndex: number, branchId: string, scheduledPrices: IScheduledBranchPrice[]) => {
    setComboItem(prev => {
      const updatedVariants = [...prev.variants];
      updatedVariants[variantIndex] = {
        ...(prev.variants && prev.variants[variantIndex] ? prev.variants[variantIndex] : {}),
        branchVariantDetails: {
          ...(prev.variants[variantIndex]?.branchVariantDetails || {}),
          [branchId]: {
            ...prev.variants?.[variantIndex]?.branchVariantDetails?.[branchId],
            branch: { id: branchId },
            scheduledPrices,
          },
        },
      };
      return {
        ...prev,
        variants: updatedVariants,
      };
    });
  };

  const saveEntity = (e, createNew = false, clone = false) => {
    e.preventDefault();
    const entity = {
      ...comboItem,
      variants: [
        {
          ...(comboItem.variants && comboItem.variants[0] && comboItem.variants[0]),
          name: comboItem.name
        },
      ],
    };
    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          reset()
          setComboItem({
            itemType: "RESTAURANT",
          })
        } else {
          const payload = res?.payload as any;
          const newProductId = payload?.data?.id;

          const { id, ...entityWithoutId } = entity;
          entityWithoutId.variants = entityWithoutId?.variants.map(({ id, ...variantWithoutId }) => ({
            ...variantWithoutId,
          }));
          if (clone) {
            dispatch(createEntity(entityWithoutId)).then(res => {
              const payload = res?.payload as any;
              const newProductId = payload?.data?.id;

              // @ts-expect-error -- unknown type
              if (!res?.error) {
                navigate(`/restaurant/combo/${newProductId}/edit`)
              }
            });
          }
          // @ts-expect-error -- unknown type
          if (!res?.error) {
            handleNavigate(newProductId)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (clone) {
          const { id, ...entityWithoutId } = entity;
          entityWithoutId.variants = entityWithoutId?.variants.map(({ id, ...variantWithoutId }) => ({
            ...variantWithoutId,
          }));
          dispatch(createEntity(entityWithoutId)).then(res => {
            const payload = res?.payload as any;
            const newProductId = payload?.data?.id;

            // @ts-expect-error -- unknown type
            if (!res?.error) {
              navigate(`/restaurant/combo/${newProductId}/edit`)
            }
          });
        }
        if (createNew) {
          navigate(`/restaurant/combo/new`)
        }
      })
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <PageWrapper>
      <form onKeyDown={preventEnterSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-9">
            <Card>
              <CardContent className="p-4">
                <Tabs defaultValue="details">
                  <TabsList className="grid w-full grid-cols-6 h-auto">
                    <TabsTrigger value="details" className="text-xs">{translate('items.update.tabs.details.label')}</TabsTrigger>
                    <TabsTrigger value="addons" className="text-xs">{translate('items.update.tabs.addons.label')}</TabsTrigger>
                    <TabsTrigger value="visibility" className="text-xs">{translate('items.update.tabs.visibility.label')}</TabsTrigger>
                    <TabsTrigger value="loyalty" className="text-xs">{translate('items.update.tabs.excludedFromLoyaltyPoints.label')}</TabsTrigger>
                    <TabsTrigger value="seo" className="text-xs">{translate('items.update.tabs.seo.label')}</TabsTrigger>
                    <TabsTrigger value="ebt" className="text-xs">{translate('items.update.tabs.ebtEligibleBranches.label')}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4 mt-4">
                    <div className="text-lg font-semibold">
                      {isNew ? <Translate contentKey={'items.update.tabs.details.titles.create.combo'}>Create New Combo Item</Translate> : <span>Edit {comboItem.name}</span>}
                    </div>

                    <div className="bg-white p-3 space-y-4">
                      {isModalOpen ?
                        <ComboItemSelection
                          isOpen={isModalOpen}
                          onAddItems={handleAddItems}
                          toggleModal={toggleModal}
                          comboPackages={comboItem?.variants?.[0]?.comboPackages}
                        />
                        : null}

                      <SharedItemUpdate
                        item={comboItem}
                        onFieldChange={handleFieldChange}
                      />

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">
                          <Translate contentKey={'items.update.description'}>Description</Translate>
                        </Label>
                        <Textarea
                          name="desc"
                          id="desc"
                          placeholder={translate('items.update.description')}
                          value={comboItem?.variants?.[0]?.description || ''}
                          onChange={e => setComboItem(prev => {
                            return {
                              ...prev, variants: prev.variants.map(variant => {
                                return { ...variant, description: e.target.value }
                              })
                            }
                          })}
                          className="text-xs"
                        />
                      </div>

                      <DiscountDropdown
                        discounts={comboItem?.variants?.[0]?.discounts}
                        handleChange={handleComboVariantChange}
                      />

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">
                          <Translate contentKey={'items.update.mixAndMatchRule'}>Mix And Match Rule</Translate>
                        </Label>
                        <Select
                          isClearable
                          value={comboItem?.variants?.[0]?.mixAndMatchRule || null}
                          options={mixAndMatchRuleList}
                          getOptionLabel={option => option.name}
                          getOptionValue={option => option.id}
                          onChange={(mixAndMatchRule) => handleComboVariantChange('mixAndMatchRule', mixAndMatchRule)}
                          onMenuOpen={() => {
                            dispatch(getMixAndMatchRules({
                              page: paginationState.activePage - 1,
                              size: paginationState.itemsPerPage,
                              sort: `${paginationState.sort},${paginationState.order}`,
                            }));
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold">
                            <Translate contentKey={'items.update.price'}>Price</Translate>
                          </Label>
                          <Input
                            type="number"
                            name="price"
                            id="price"
                            required
                            min={0}
                            step={0.01}
                            placeholder={translate('items.update.placeholders.itemPrice')}
                            value={comboItem?.variants?.[0]?.price ?? ''}
                            onChange={(e) => handleComboVariantChange("price", parseFloat(e.target.value))}
                            className="h-8 text-xs"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold">
                            <Translate contentKey={'items.update.salePrice'}>Sale Price</Translate>
                          </Label>
                          <Input
                            type="number"
                            name="sale-price"
                            id="sale-price"
                            placeholder="Variant Sale Price"
                            min={0}
                            step={0.01}
                            value={comboItem?.variants?.[0]?.salePrice ?? ''}
                            onChange={(e) => handleComboVariantChange('salePrice', parseFloat(e.target.value))}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>

                      <VariantBranchPrice
                        branchVariantDetails={comboItem?.variants?.[0].branchVariantDetails}
                        branchList={branchList}
                        handleBranchPriceChange={handleBranchPriceChange}
                        variantIndex={0}
                        itemVariantType={"RESTAURANT"}
                        handleHideItemPerBranch={handleHideItemPerBranch}
                        handleSaveScheduledPrices={handleSaveScheduledPrices}
                        variant={comboItem?.variants?.[0]}
                        setItem={setComboItem}
                      />

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-semibold">
                            <Translate contentKey={'items.update.combo.title'}>Combo</Translate>
                          </h3>
                          <Button type="button" size="sm" className="h-8 text-xs" onClick={toggleModal}>
                            <Translate contentKey={'items.update.combo.addItem'}>Add Item</Translate>
                          </Button>
                        </div>

                        <DraggableList
                          value={comboItem?.variants?.[0]?.comboPackages || []}
                          onChange={e => {
                            setComboItem(prev => ({
                              ...prev,
                              variants: [
                                {
                                  ...(prev.variants && prev.variants[0] ? prev.variants[0] : {}),
                                  comboPackages: e.value,
                                },
                              ],
                            }));
                          }}
                          itemTemplate={(comboPackage: any, idx: number) => {
                            const comboPackages = comboItem?.variants?.[0]?.comboPackages || [];
                            const index = comboPackages.indexOf(comboPackage);
                            return (
                              <div className="flex items-center w-full gap-2">
                                <div className="flex-[2]">
                                  <p className="text-xs mb-0">{comboPackage.item?.name}
                                    {comboPackage?.pizzaPackage ? (
                                      <div className="flex gap-1">
                                        <span className="text-xs">{comboPackage?.pizzaPackage?.pizzaSize?.name}&nbsp;</span>
                                        <span className="text-xs">{comboPackage?.pizzaPackage?.crustType?.name}&nbsp;</span>
                                        <span className="text-xs">{comboPackage?.pizzaPackage?.crustThickness?.name}</span>
                                      </div>
                                    ) : null}
                                  </p>
                                </div>
                                <div className="flex-1 text-xs">{comboPackage?.variant?.name}</div>
                                <div className="flex-1">
                                  <Input
                                    type="number"
                                    name={`quantity_${comboPackage?.variant?.id}`}
                                    placeholder={translate('items.update.combo.quantityPlaceholder', { variantName: comboPackage?.variant?.name })}
                                    value={comboPackage.amount ?? ''}
                                    min={0}
                                    onChange={e => {
                                      e.stopPropagation();
                                      handleComboAmountChange(index, parseFloat(e.target.value));
                                    }}
                                    onClick={e => e.stopPropagation()}
                                    className="h-8 text-xs"
                                  />
                                </div>
                                <div className="flex-[2]" onClick={e => e.stopPropagation()}>
                                  <ComboItemAddonDropDown
                                    itemAddons={comboPackage.item?.addons}
                                    variantAddons={comboPackage?.variant?.addons}
                                    selectedComboAddons={comboPackage?.addons}
                                    onIncrement={addonIndex => handleAddonAmountChange(index, addonIndex, "increment")}
                                    onDecrement={addonIndex => handleAddonAmountChange(index, addonIndex, "decrement")}
                                    onAddAddon={addon => handleAddComboAddon(index, addon)}
                                    onDeleteAddon={addonIndex => handleDeleteComboAddon(index, addonIndex)}
                                  />
                                </div>
                                <div className="flex-1">
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteComboPackage(index);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    <Translate contentKey={'items.update.combo.delete'}>Delete</Translate>
                                  </Button>
                                </div>
                              </div>
                            );
                          }}
                          dragdrop
                          dataKey="id"
                          header={
                            <div className="flex w-full text-xs font-semibold">
                              <div className="flex-[2]"><Translate contentKey={'items.update.combo.itemName'}>Item Name</Translate></div>
                              <div className="flex-1"><Translate contentKey={'items.update.combo.itemVariants'}>Item Variants</Translate></div>
                              <div className="flex-1"><Translate contentKey={'items.update.combo.quantity'}>Quantity</Translate></div>
                              <div className="flex-[2]"><Translate contentKey={'items.update.combo.addons'}>Addons</Translate></div>
                              <div className="flex-1"><Translate contentKey={'items.update.combo.delete'}>Delete</Translate></div>
                            </div>
                          }
                        />

                        <div>
                          <CustomDefinitionValuesWrapper
                            entityId={comboItem.id}
                            entityType={CustomDefinitionEntityType.ITEM}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="addons" className="mt-4">
                    {comboItem ? <SharedAddon onFieldChange={handleFieldChange} addons={comboItem.addons || []} addonGroups={comboItem.addonGroups || []} item={comboItem} /> : null}
                  </TabsContent>

                  <TabsContent value="visibility" className="mt-4">
                    <Visibility
                      initialState={comboItem.visibility}
                      title={translate('items.update.tabs.visibility.titles.combo')}
                      onStateChanged={(visibility) => setComboItem(prev => {
                        return { ...prev, visibility }
                      })}
                    />
                  </TabsContent>

                  <TabsContent value="loyalty" className="mt-4">
                    <ItemLoyaltyTab excludedFromLoyaltyPoints={comboItem?.excludedFromLoyaltyPoints} onFieldChange={handleFieldChange} />
                  </TabsContent>

                  <TabsContent value="seo" className="mt-4">
                    <SeoTags
                      field={comboItem?.seo}
                      onFieldChange={updateSeoTags}
                    />
                  </TabsContent>

                  <TabsContent value="ebt" className="mt-4">
                    <EBTEligibleBranches
                      item={comboItem}
                      setItem={setComboItem}
                      branchList={branchList}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <div className="sticky top-4 space-y-4">
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  <Button
                    className="text-xs h-8 w-full"
                    onClick={handleBackClick}
                    type="button"
                    variant="secondary"
                  >
                    <ArrowLeft className="h-3 w-3 mr-2" />
                    <Translate contentKey="entity.action.back">Back</Translate>
                  </Button>

                  <Button
                    className="text-xs h-8 w-full"
                    onClick={saveEntity}
                    type="button"
                    disabled={updating}
                  >
                    {updating ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Save className="h-3 w-3 mr-2" />}
                    <Translate contentKey="entity.action.save">Save</Translate>
                  </Button>

                  <Button
                    className="text-xs h-8 w-full"
                    onClick={(e) => saveEntity(e, true)}
                    type="button"
                    disabled={updating}
                  >
                    <PlusCircle className="h-3 w-3 mr-2" />
                    <Translate contentKey="entity.action.saveandnew">Save and create new</Translate>
                  </Button>

                  <Button
                    className="text-xs h-8 w-full"
                    onClick={(e) => saveEntity(e, false, true)}
                    type="button"
                    disabled={updating}
                  >
                    <PlusCircle className="h-3 w-3 mr-2" />
                    <Translate contentKey="entity.action.saveandclone">Save and create clone</Translate>
                  </Button>
                </CardContent>
              </Card>

              {comboItemEntity?.id && <AuditLogs entityId={comboItemEntity?.id} />}
            </div>
          </div>
        </div>
      </form>
    </PageWrapper>
  );
};

export default ComboItemUpdate;
