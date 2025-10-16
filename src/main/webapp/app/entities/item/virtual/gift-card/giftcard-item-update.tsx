import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getSortState, translate, Translate } from 'react-jhipster';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const giftCardsCouponEntities = useAppSelector(state => state.GiftCardCoupon.entities);
  const loading = useAppSelector(state => state.GiftCardItem.loading);
  const updating = useAppSelector(state => state.GiftCardItem.updating);
  const updateSuccess = useAppSelector(state => state.GiftCardItem.updateSuccess);
  const branchList = useAppSelector(state => state.branch.entities);
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
    }]
  });

  const findGiftCardById = (id) => {
    return giftCardsCouponEntities.find((giftCard) => giftCard.id === id);
  };

  const [selectedGiftCard, setSelectedGiftCard] = useState(giftCardItem?.variants ? giftCardItem?.variants[0]?.giftCard : null);

  const handleGiftCardChange = (selectedOption) => {
    setSelectedGiftCard(selectedOption);
    handleGiftCardItemVariantChange("giftCard", findGiftCardById(selectedOption));
  };

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

                    <div className="flex flex-col gap-2 bg-white p-2">
                      <SharedVirtualItemUpdate item={giftCardItem} onFieldChange={handleFieldChange} />

                      <div className="flex flex-col gap-2 mt-2">
                        <div className="w-1/2">
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
                            className="h-7 text-xs mt-1"
                            placeholder={translate('items.update.placeholders.itemPrice')}
                            value={giftCardItem?.variants?.[0]?.price || ''}
                            onChange={(e) => handleGiftCardItemVariantChange('price', parseFloat(e.target.value))}
                          />
                        </div>
                      </div>
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
