import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getSortState, translate, Translate } from 'react-jhipster';
import { ArrowLeft, Save, Loader2, Sparkles } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './giftcard-item.reducer';
import SharedVirtualItemUpdate from "app/shared/components/item/shared-virtual-update";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";

import { ItemVariantType } from "app/shared/model/ENUMS/item-variant-type.model";
import Visibility from 'app/shared/Visibility/Visibility';
import AuditLogs from "app/shared/components/logs/audit-logs";
import { IGiftCardItem } from 'app/shared/model/ITEM/virtual/giftcard-item.model';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';


const defaultItemPriceNumber = {
  "PRICE_1": null,
  "PRICE_2": null,
  "PRICE_3": null,
  "PRICE_4": null,
  "PRICE_5": null,
};


export const GiftCardItemUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;
  const giftCardItemEntity = useAppSelector(state => state.GiftCardItem.entity);
  const loading = useAppSelector(state => state.GiftCardItem.loading);
  const updating = useAppSelector(state => state.GiftCardItem.updating);
  const updateSuccess = useAppSelector(state => state.GiftCardItem.updateSuccess);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('details');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const [giftCardItem, setGiftCardItem] = useState<IGiftCardItem>({
    itemType: "VIRTUAL",
    itemVariantType: ItemVariantType.VIRTUAL_GIFTCARD,
    variants: [{
      branchVariantDetails: {},
      preparationTime: null,
    }]
  });

  const handleBackClick = () => {
    const fromMenuId = new URLSearchParams(location.search).get('fromMenu');
    if (fromMenuId) {
      navigate(`/menu/${fromMenuId}/ONLINE_ORDERING/edit?page=1&sort=id,asc`);
    } else {
      navigate("/product");
    }
  };

  const handleFieldChange = useCallback((fieldName, value) => {
    setGiftCardItem((prevState) => ({
      ...prevState,
      [fieldName]: value,
    }));
  }, [])

  const handleGiftCardItemVariantChange = (fieldName, value) => {
    setGiftCardItem((prev) => {
      const updatedVariants = [
        {
          ...(prev.variants && prev.variants[0] ? prev.variants[0] : {}),
          [fieldName]: value,
        },
      ];
      return {
        ...prev,
        variants: updatedVariants,
      };
    });
  };

  const handleNavigate = (giftCardItemId) => {
    navigate(`/gift-cards/${giftCardItemId}/edit` + location.search);
  };

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

  }, [id, isNew]);

  useEffect(() => {
    if (!isNew) {
      setGiftCardItem(giftCardItemEntity);
    }

    const giftCardItemId = giftCardItemEntity?.id;
    if (updateSuccess) {
      handleNavigate(giftCardItemId);
    }
  }, [giftCardItemEntity?.id, updateSuccess]);

  const saveEntity = e => {
    e.preventDefault();
    const entity = {
      ...giftCardItem,
      variants: [
        {
          ...(giftCardItem.variants && giftCardItem.variants[0] && giftCardItem.variants[0]),
          name: giftCardItem.name
        },
      ],
    };
    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const generatedCode = useMemo(
    () => giftCardItem?.variants?.[0]?.giftCardCoupon?.code || '',
    [giftCardItem]
  );

  return (
    <form>
      <div className="flex gap-2 p-2">
        <div className="flex-1">
          <Card className="p-0">
            <CardContent className="p-2">
              <div className="w-full">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="h-8">
                    <TabsTrigger value="details" className="text-xs h-7">
                      {translate('items.update.tabs.details.label')}
                    </TabsTrigger>
                    <TabsTrigger value="visibility" className="text-xs h-7">
                      {translate('items.update.tabs.visibility.label')}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details">
                    <div className="w-full">
                      <div className="text-sm font-semibold mb-3">
                        {isNew ? (
                          <Translate contentKey={'items.update.tabs.details.titles.create.giftcard'}>
                            Create New Gift Card Item
                          </Translate>
                        ) : (
                          <span>Edit {giftCardItem.name}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 bg-white p-2">
                      <Card>
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-sm">Basic information</CardTitle>
                          <CardDescription className="text-xs">
                            Customer-facing gift card item details shown in the catalog.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          <SharedVirtualItemUpdate item={giftCardItem} onFieldChange={handleFieldChange} />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-sm">Gift card details</CardTitle>
                          <CardDescription className="text-xs">
                            Price and backend-generated card number details.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-2 space-y-4">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                              <Label className="text-xs font-semibold">
                                <Translate contentKey={'items.update.price'}>Price</Translate>
                              </Label>
                              <Input
                                type="number"
                                name="price"
                                id="price"
                                required={true}
                                min={0}
                                step={0.01}
                                className="h-8 text-xs mt-1"
                                placeholder={translate('items.update.placeholders.itemPrice')}
                                value={giftCardItem?.variants?.[0]?.price ?? ''}
                                onChange={(e) => handleGiftCardItemVariantChange('price', parseFloat(e.target.value))}
                              />
                            </div>

                            <div>
                              <Label className="text-xs font-semibold">Card Number</Label>
                              <Input
                                readOnly
                                className="h-8 text-xs mt-1 font-mono"
                                value={generatedCode || 'Will be generated automatically after save'}
                              />
                            </div>

                            <div>
                              <Label className="text-xs font-semibold">Preparation time (minutes)</Label>
                              <Input
                                type="number"
                                name="preparation-time"
                                min={0}
                                step={1}
                                className="h-8 text-xs mt-1"
                                placeholder="Minutes"
                                value={giftCardItem?.variants?.[0]?.preparationTime ?? ''}
                                onChange={e =>
                                  handleGiftCardItemVariantChange(
                                    'preparationTime',
                                    e.target.value === '' ? null : parseInt(e.target.value, 10)
                                  )
                                }
                              />
                            </div>
                          </div>

                          <div className="rounded-lg border bg-muted/40 p-3">
                            <div className="flex items-start gap-2">
                              <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                              <div className="space-y-1">
                                <p className="text-xs font-semibold">Card number is auto-generated</p>
                                <p className="text-xs text-muted-foreground">
                                  This value comes from the backend `giftCardCoupon.code` field. Users do not enter it manually.
                                  {isNew
                                    ? ' It appears after the gift card is created.'
                                    : ' It is already assigned to this gift card.'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="visibility">
                    <Visibility
                      initialState={giftCardItem.visibility}
                      title={translate('items.update.tabs.visibility.titles.giftCard')}
                      onStateChanged={(state) => setGiftCardItem(prev => {
                        return { ...prev, visibility: state }
                      })}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-64" style={{ position: 'sticky', top: '0', height: '90vh' }}>
          <Card>
            <CardHeader className="p-2">
              <CardTitle className="text-xs">Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  onClick={handleBackClick}
                  id="cancel-save"
                  data-cy="entityCreateCancelButton"
                  variant="secondary"
                  className="h-8 text-xs"
                >
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  <Translate contentKey="entity.action.back">Back</Translate>
                </Button>
                <Button
                  id="save-entity"
                  data-cy="entityCreateSaveButton"
                  type="button"
                  onClick={saveEntity}
                  disabled={updating}
                  className="h-8 text-xs"
                >
                  {updating ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3 mr-1" />
                  )}
                  <Translate contentKey="entity.action.save">Save</Translate>
                </Button>
              </div>
            </CardContent>
          </Card>
          {giftCardItemEntity?.id && <AuditLogs entityId={giftCardItemEntity?.id} />}
        </div>
      </div>
    </form>
  );
};

export default GiftCardItemUpdate;
