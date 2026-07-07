import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getSortState, translate, Translate } from 'react-jhipster';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, updateEntity, createEntity, reset } from './simple-item.reducer';
import SharedItemUpdate from 'app/shared/components/item/shared-item-update';
import { IExchangeMeasure, ISimpleItem, ISimpleItemVariant } from 'app/shared/model/ITEM/retail/simple-item.model';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { getEntities as getMeasures } from 'app/entities/item-measure/item-measure.reducer';
import Select from 'app/shared/components/select/select';
import { getEntities as getAttributes } from 'app/entities/item/retail/attributes/retail-attribute.reducer';
import { getEntities as getDiscounts } from 'app/entities/discount/discount.reducer';
import { ITaxonomy } from 'app/shared/model/taxonomy.model';
import { ITerm } from 'app/shared/model/term.model';
import { getEntities as getAttributeValues, reset as resetAttributeValues } from 'app/entities/item/retail/attributes/retail-attribute-values.reducer';
import AsyncSelect from 'app/shared/components/select/async-select';
import { ItemVariantType } from 'app/shared/model/ENUMS/item-variant-type.model';
import Visibility from 'app/shared/Visibility/Visibility';
import ItemStockTab from 'app/shared/components/item/item-stock-tab';
import { IItemMeasure } from 'app/shared/model/item-measure.model';
import ItemLoyaltyTab from 'app/shared/components/item/item-loyalty-tab';
import WholesalePrices from 'app/shared/components/item/wholsale-prices-modal';
import { getEntities as getMixAndMatchRules } from 'app/entities/mix-and-match-rule/mix-and-match-rule.reducer';
import AuditLogs from 'app/shared/components/logs/audit-logs';
import DiscountDropdown from 'app/shared/components/item/discount-dropdown';
import { preventEnterSubmit } from 'app/shared/util/form-utils';
import { useVariantBranchPrice } from 'app/shared/hooks/useVariantBranchPrice';
import { VariantEditor } from 'app/shared/components/item/variant-editor';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Save, PlusCircle, Loader2 } from 'lucide-react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';

const defaultItemPriceNumber = {
  PRICE_1: null, PRICE_2: null, PRICE_3: null, PRICE_4: null, PRICE_5: null,
};
const defaultSpecialPrices = {
  WHOLE_SALE: { ...defaultItemPriceNumber },
  RETAIL: { ...defaultItemPriceNumber },
};

export const SimpleItemUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;
  const simpleItemEntity = useAppSelector(state => state.simpleRetailItem.entity);
  const loading = useAppSelector(state => state.simpleRetailItem.loading);
  const updating = useAppSelector(state => state.simpleRetailItem.updating);
  const updateSuccess = useAppSelector(state => state.simpleRetailItem.updateSuccess);
  const branchList = useAppSelector(state => state.branch.entities);
  const discountList = useAppSelector(state => state.discount.entities);
  const mixAndMatchRuleList = useAppSelector(state => state.mixAndMatchRule.entities);
  const measureList = useAppSelector(state => state.itemMeasure.entities);
  const attributesList = useAppSelector(state => state.retailAttribute.entities);
  const location = useLocation();
  const attributeValuesList = useAppSelector(state => state.retailAttributeValue.entities);
  const loadingAttributesValues = useAppSelector(state => state.retailAttributeValue.loading);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const [simpleItem, setSimpleItem] = useState<ISimpleItem>({
    itemType: 'RETAIL',
    itemVariantType: ItemVariantType.RETAIL_SIMPLE,
    variants: [{ branchVariantDetails: {} }],
  });

  const [measureToAdd, setMeasureToAdd] = useState<IExchangeMeasure>();
  const [itemAttribute, setItemAttribute] = useState<{ attributeTax: ITaxonomy; attributeTerms: ITerm[] } | null>(null);
  const [confirmBaseMeasureDialog, setConfirmBaseMeasureDialog] = useState<{ open: boolean; pendingMeasure: any }>({ open: false, pendingMeasure: null });

  const { handleBranchPriceChange, handleHideItemPerBranch, handleSaveScheduledPrices } =
    useVariantBranchPrice(setSimpleItem);

  const filteredMeasures = useMemo(() => {
    const exchangeMeasuresIds = simpleItem?.measures?.map(exMeasure => exMeasure.itemMeasure.id);
    return measureList.filter(m => m.id !== simpleItem?.baseMeasure?.id && !exchangeMeasuresIds?.includes(m.id));
  }, [measureList?.length, simpleItem?.baseMeasure?.id, simpleItem?.measures?.length]);

  const filteredAvailableAttributes = () => {
    const existingAttributeIds = simpleItem?.attributes?.map(attr => attr.attributeTax.id);
    return attributesList?.filter(attr => !existingAttributeIds?.includes(attr.id));
  };

  const isAttributeAddButtonDisabled =
    filteredAvailableAttributes()?.length === 0 ||
    !itemAttribute ||
    (itemAttribute?.attributeTax && Object.keys(itemAttribute?.attributeTax)?.length === 0 && itemAttribute?.attributeTerms?.length === 0);

  const handleBackClick = () => {
    const fromMenuId = new URLSearchParams(location.search).get('fromMenu');
    if (fromMenuId) {
      navigate(`/menu/${fromMenuId}/ONLINE_ORDERING/edit?page=1&sort=id,asc`);
    } else {
      navigate('/product');
    }
  };

  const handleFieldChange = useCallback((fieldName, value) => {
    setSimpleItem(prevState => ({ ...prevState, [fieldName]: value }));
  }, []);

  const handleSimpleItemVariantChange = (fieldName: keyof ISimpleItemVariant, value) => {
    setSimpleItem(prev => ({
      ...prev,
      variants: [{
        ...(prev.variants && prev.variants[0] ? prev.variants[0] : {}),
        [fieldName]: value,
      }],
    }));
  };

  const handleVariantFieldChange = (_idx: number, fieldName: string, value: any) => {
    handleSimpleItemVariantChange(fieldName as keyof ISimpleItemVariant, value);
  };

  const handleSaveWholesalePrices = (prices, branchId) => {
    setSimpleItem(prev => ({
      ...prev,
      variants: [{
        ...(prev.variants && prev.variants[0] ? prev.variants[0] : {}),
        branchVariantDetails: {
          ...prev.variants[0]?.branchVariantDetails,
          [branchId]: {
            ...prev?.variants?.[0]?.branchVariantDetails?.[branchId],
            wholesalePrices: prices,
          },
        },
      }],
    }));
  };

  const handleBaseMeasureChange = (baseMeasure) => {
    if (!simpleItem?.measures || simpleItem?.measures?.length === 0) {
      setSimpleItem(prev => ({ ...prev, baseMeasure }));
    } else {
      setSimpleItem(prevState => {
        const updatedMeasures = prevState.measures
          .filter(exMeasure => exMeasure.itemMeasure.id !== baseMeasure.id)
          .map(exMeasure => ({ ...exMeasure, exchangeRate: null }));
        return { ...prevState, baseMeasure, measures: updatedMeasures };
      });
    }
    setMeasureToAdd({});
  };

  const handleAddMeasure = () => {
    setSimpleItem(prevState => ({
      ...prevState,
      measures: [measureToAdd, ...(prevState.measures || [])],
    }));
    setMeasureToAdd({});
  };

  const handleMeasuresChange = (measureIndex, newRate) => {
    setSimpleItem(prevState => ({
      ...prevState,
      measures: prevState.measures.map((exMeasure, index) =>
        measureIndex === index ? { ...exMeasure, exchangeRate: newRate } : exMeasure
      ),
    }));
  };

  const handleRemoveMeasure = (measureIndex) => {
    setSimpleItem(prevState => ({
      ...prevState,
      measures: prevState.measures.filter((_, index) => index !== measureIndex),
    }));
  };

  const handleAddAttribute = (): void => {
    const attributeExists = simpleItem?.attributes?.some(attr => attr === itemAttribute);
    if (!attributeExists) {
      setSimpleItem(prev => ({
        ...prev,
        attributes: [...(prev.attributes || []), itemAttribute],
      }));
      setItemAttribute(null);
    }
  };

  const handleItemAttributeSelect = selectedOption => {
    if (!selectedOption) {
      setItemAttribute(null);
      return;
    }
    dispatch(getAttributeValues({
      id: selectedOption?.id,
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));
    setItemAttribute(prevState => ({ ...prevState, attributeTax: selectedOption }));
  };

  const handleAttributeTermChange = (index, selectedTerms) => {
    setSimpleItem(prev => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) =>
        i === index ? { ...attr, attributeTerms: selectedTerms } : attr
      ),
    }));
  };

  const refreshProduct = () => {
    dispatch(getEntity(id));
  };

  const handleNavigate = (simpleItemId) => {
    navigate(`/retail/simple/${simpleItemId}/edit` + location.search);
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

    dispatch(getBranches({ page: paginationState.activePage - 1, size: paginationState.itemsPerPage, sort: `${paginationState.sort},${paginationState.order}` }));
    dispatch(getAttributes({ page: paginationState.activePage - 1, size: paginationState.itemsPerPage, sort: `${paginationState.sort},${paginationState.order}` }));
    dispatch(getMeasures({ page: paginationState.activePage - 1, size: paginationState.itemsPerPage, sort: `${paginationState.sort},${paginationState.order}` }));
    dispatch(getDiscounts({ page: paginationState.activePage - 1, size: paginationState.itemsPerPage, sort: `${paginationState.sort},${paginationState.order}` }));
    dispatch(getMixAndMatchRules({ page: paginationState.activePage - 1, size: paginationState.itemsPerPage, sort: `${paginationState.sort},${paginationState.order}` }));
  }, [id, isNew]);

  useEffect(() => {
    if (!isNew) {
      setSimpleItem(simpleItemEntity);
    }
    const simpleItemId = simpleItemEntity?.id;
    if (updateSuccess) {
      handleNavigate(simpleItemId);
    }
  }, [simpleItemEntity?.id, updateSuccess]);

  const saveEntity = e => {
    e.preventDefault();
    const entity = {
      ...simpleItem,
      variants: [{
        ...(simpleItem.variants && simpleItem.variants[0] && simpleItem.variants[0]),
        name: simpleItem.name,
      }],
    };
    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  const loadOptions = (attributeId) => {
    dispatch(resetAttributeValues());
    dispatch(getAttributeValues({
      id: attributeId,
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <PageWrapper>
      <form onKeyDown={preventEnterSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-9">
            <Card>
              <CardContent className="p-4">
                <Tabs defaultValue="details">
                  <TabsList className="w-full justify-start mb-4 h-auto flex-wrap">
                    <TabsTrigger value="details" className="text-xs h-7">
                      {translate('items.update.tabs.details.label')}
                    </TabsTrigger>
                    <TabsTrigger value="attributes" className="text-xs h-7">
                      {translate('items.update.attributes', null, 'Attributes')}
                    </TabsTrigger>
                    <TabsTrigger value="visibility" className="text-xs h-7">
                      {translate('items.update.tabs.visibility.label')}
                    </TabsTrigger>
                    <TabsTrigger value="loyalty" className="text-xs h-7">
                      {translate('items.update.tabs.excludedFromLoyaltyPoints.label')}
                    </TabsTrigger>
                    {!isNew && (
                      <TabsTrigger value="stock" className="text-xs h-7">
                        {translate('items.update.tabs.stock.label')}
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="measures" className="text-xs h-7">
                      {translate('items.update.measures', null, 'Measures')}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4">
                    <div className="text-lg font-semibold">
                      {isNew
                        ? <Translate contentKey="items.update.tabs.details.titles.create.simple">Create New Simple Item</Translate>
                        : <span>Edit {simpleItem.name}</span>}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        <Translate contentKey="items.update.sku">SKU</Translate>
                      </Label>
                      <Input
                        name="sku"
                        placeholder={translate('items.update.placeholders.itemSku')}
                        value={simpleItem?.variants?.[0]?.sku || ''}
                        onChange={e => handleSimpleItemVariantChange('sku', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>

                    <SharedItemUpdate item={simpleItem} onFieldChange={handleFieldChange} />

                    <VariantEditor
                      variant={simpleItem?.variants?.[0]}
                      variantIndex={0}
                      itemVariantType="RETAIL"
                      branchList={branchList}
                      setItem={setSimpleItem}
                      handleVariantFieldChange={handleVariantFieldChange}
                      handleBranchPriceChange={handleBranchPriceChange}
                      handleHideItemPerBranch={handleHideItemPerBranch}
                      handleSaveScheduledPrices={handleSaveScheduledPrices}
                      mixAndMatchRuleList={mixAndMatchRuleList}
                      showPrice
                      showSalePrice
                      defaultTab="pricing"
                    />
                  </TabsContent>

                  <TabsContent value="attributes">
                    <div className="space-y-4 mt-2">
                      <div className="flex gap-3 items-end">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs font-semibold">
                            <Translate contentKey="items.update.attributes">Attributes</Translate>
                          </Label>
                          <Select
                            value={itemAttribute?.attributeTax || null}
                            isClearable
                            options={filteredAvailableAttributes()}
                            getOptionValue={option => option.id}
                            getOptionLabel={option => option.key}
                            onChange={attribute => handleItemAttributeSelect(attribute)}
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={handleAddAttribute}
                          disabled={isAttributeAddButtonDisabled}
                        >
                          <Translate contentKey="items.update.addAttribute">Add Attribute</Translate>
                        </Button>
                      </div>

                      <Accordion type="multiple" defaultValue={['attr-0']}>
                        {simpleItem?.attributes?.map((attribute, index) => (
                          <AccordionItem key={index} value={`attr-${index}`}>
                            <AccordionTrigger className="text-xs hover:no-underline">
                              {attribute?.attributeTax?.key}
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="flex gap-3 items-center">
                                <span className="text-xs">{translate('items.update.name')}: {attribute?.attributeTax?.key}</span>
                                <div className="flex-1">
                                  <AsyncSelect
                                    value={attribute?.attributeTerms}
                                    isMulti
                                    getOptionLabel={option => option.name}
                                    getOptionValue={option => option.id}
                                    onChange={selectedOptions => handleAttributeTermChange(index, selectedOptions)}
                                    isLoading={loadingAttributesValues}
                                    onFocus={() => loadOptions(attribute?.attributeTax?.id)}
                                    defaultOptions={attributeValuesList}
                                  />
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </TabsContent>

                  <TabsContent value="visibility">
                    <Visibility
                      initialState={simpleItem.visibility}
                      title={translate('items.update.tabs.visibility.titles.simple')}
                      onStateChanged={state => setSimpleItem(prev => ({ ...prev, visibility: state }))}
                    />
                  </TabsContent>

                  <TabsContent value="loyalty">
                    <ItemLoyaltyTab
                      excludedFromLoyaltyPoints={simpleItem?.excludedFromLoyaltyPoints}
                      onFieldChange={handleFieldChange}
                    />
                  </TabsContent>

                  {!isNew && (
                    <TabsContent value="stock">
                      <ItemStockTab refreshProduct={refreshProduct} variants={simpleItem?.variants} itemId={simpleItem.id} />
                    </TabsContent>
                  )}

                  <TabsContent value="measures">
                    <div className="space-y-4 mt-2">
                      <div className="grid grid-cols-4 gap-3 items-end">
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">
                            <Translate contentKey="items.update.baseMeasure">Base Measure</Translate>
                          </Label>
                          <Select
                            value={simpleItem?.baseMeasure}
                            options={measureList}
                            name="baseMeasure"
                            getOptionValue={option => option.id}
                            getOptionLabel={option => option.name}
                            onChange={m => {
                              if (simpleItem?.measures?.length > 0) {
                                setConfirmBaseMeasureDialog({ open: true, pendingMeasure: m });
                              } else {
                                handleBaseMeasureChange(m);
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">
                            <Translate contentKey="items.update.measure">Measure</Translate>
                          </Label>
                          <Select
                            value={measureToAdd?.itemMeasure || null}
                            isDisabled={!simpleItem?.baseMeasure}
                            options={filteredMeasures}
                            getOptionValue={option => option.id}
                            getOptionLabel={option => option.name}
                            onChange={itemMeasure => setMeasureToAdd(prev => ({ ...prev, itemMeasure }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">
                            <Translate contentKey="items.update.exchangeRate">Exchange Rate</Translate>
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={measureToAdd?.exchangeRate ?? ''}
                            disabled={!measureToAdd?.itemMeasure}
                            onChange={e => setMeasureToAdd(prev => ({ ...prev, exchangeRate: parseFloat(e.target.value) }))}
                            className="h-8 text-xs"
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 text-xs"
                          disabled={!measureToAdd?.exchangeRate}
                          onClick={handleAddMeasure}
                        >
                          Add
                        </Button>
                      </div>

                      <div className="border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs"><Translate contentKey="items.update.measure">Measure</Translate></TableHead>
                              <TableHead className="text-xs"><Translate contentKey="items.update.exchangeRate">Exchange Rate</Translate></TableHead>
                              <TableHead className="text-xs">Remove</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {simpleItem?.measures?.map((exMeasure, index) => (
                              <TableRow key={index}>
                                <TableCell className="text-xs">{exMeasure?.itemMeasure?.name}</TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={exMeasure?.exchangeRate ?? ''}
                                    required
                                    onChange={e => handleMeasuresChange(index, parseFloat(e.target.value))}
                                    className="w-24 h-7 text-xs"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => handleRemoveMeasure(index)}
                                  >
                                    <Translate contentKey="items.update.remove">Remove</Translate>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
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
                </CardContent>
              </Card>
              {simpleItemEntity?.id && <AuditLogs entityId={simpleItemEntity?.id} />}
            </div>
          </div>
        </div>
      </form>

      <AlertDialog
        open={confirmBaseMeasureDialog.open}
        onOpenChange={open => setConfirmBaseMeasureDialog(prev => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Confirmation</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Changing the base measure will reset exchange rates for existing measures. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="h-8 text-xs"
              onClick={() => {
                handleBaseMeasureChange(confirmBaseMeasureDialog.pendingMeasure);
                setConfirmBaseMeasureDialog({ open: false, pendingMeasure: null });
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  );
};

export default SimpleItemUpdate;
