import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getSortState, translate, Translate } from 'react-jhipster';
import { isEqual } from 'lodash';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { createEntity, getEntity, reset, updateEntity } from './variable-item.reducer';
import SharedItemUpdate from 'app/shared/components/item/shared-item-update';
import { IVariableItem, IVariableItemVariant } from 'app/shared/model/ITEM/retail/variable-item.model';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import Select from 'app/shared/components/select/select';
import { getEntities as getAttributes } from 'app/entities/item/retail/attributes/retail-attribute.reducer';
import { ITaxonomy } from 'app/shared/model/taxonomy.model';
import { ITerm } from 'app/shared/model/term.model';
import {
  getEntities as getAttributeValues,
  reset as resetAttributeValues,
} from 'app/entities/item/retail/attributes/retail-attribute-values.reducer';
import AsyncSelect from 'app/shared/components/select/async-select';
import { ItemVariantType } from 'app/shared/model/ENUMS/item-variant-type.model';
import Visibility from 'app/shared/Visibility/Visibility';
import ItemStockTab from 'app/shared/components/item/item-stock-tab';
import { IExchangeMeasure } from 'app/shared/model/ITEM/retail/simple-item.model';
import { getEntities as getMeasures } from 'app/entities/item-measure/item-measure.reducer';
import ItemLoyaltyTab from 'app/shared/components/item/item-loyalty-tab';
import WholesalePrices from 'app/shared/components/item/wholsale-prices-modal';
import { getEntities as getDiscounts } from 'app/entities/discount/discount.reducer';
import { getEntities as getMixAndMatchRules } from 'app/entities/mix-and-match-rule/mix-and-match-rule.reducer';
import AuditLogs from 'app/shared/components/logs/audit-logs';
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { preventEnterSubmit } from 'app/shared/util/form-utils';
import { useVariantBranchPrice } from 'app/shared/hooks/useVariantBranchPrice';
import { VariantEditor, VariantListPanel } from 'app/shared/components/item/variant-editor';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { ArrowLeft, Save, Plus, Loader2 } from 'lucide-react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

const defaultSpecialPrices = {
  WHOLE_SALE: { PRICE_1: null, PRICE_2: null, PRICE_3: null, PRICE_4: null, PRICE_5: null },
  RETAIL: { PRICE_1: null, PRICE_2: null, PRICE_3: null, PRICE_4: null, PRICE_5: null },
};

export const VariableItemUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;
  const variableItemEntity = useAppSelector(state => state.variableRetailItem.entity);
  const loading = useAppSelector(state => state.variableRetailItem.loading);
  const updating = useAppSelector(state => state.variableRetailItem.updating);
  const updateSuccess = useAppSelector(state => state.variableRetailItem.updateSuccess);
  const branchList = useAppSelector(state => state.branch.entities);
  const attributesList = useAppSelector(state => state.retailAttribute.entities);
  const measureList = useAppSelector(state => state.itemMeasure.entities);
  const discountList = useAppSelector(state => state.discount.entities);
  const mixAndMatchRuleList = useAppSelector(state => state.mixAndMatchRule.entities);
  const location = useLocation();
  const attributeValuesList = useAppSelector(state => state.retailAttributeValue.entities);
  const loadingAttributesValues = useAppSelector(state => state.retailAttributeValue.loading);

  const [paginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const [variableItem, setVariableItem] = useState<IVariableItem>({
    itemType: 'RETAIL',
    itemVariantType: ItemVariantType.RETAIL_VARIABLE,
    variants: [],
  });
  const [measureToAdd, setMeasureToAdd] = useState<IExchangeMeasure>();
  const [itemAttribute, setItemAttribute] = useState<{ attributeTax: ITaxonomy; attributeTerms: ITerm[] } | null>(null);
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [deleteVariantDialog, setDeleteVariantDialog] = useState<{ open: boolean; index: number | null }>({ open: false, index: null });
  const [deleteAttributeDialog, setDeleteAttributeDialog] = useState<{ open: boolean; index: number | null }>({ open: false, index: null });
  const [pricesModal, setPricesModal] = useState({ show: false, branchId: '', variantIndex: null });

  const { handleBranchPriceChange, handleHideItemPerBranch, handleSaveScheduledPrices } =
    useVariantBranchPrice(setVariableItem);

  const filteredAvailableAttributes = () => {
    const existingAttributeIds = variableItem?.attributes?.map(attr => attr.attributeTax.id);
    return attributesList?.filter(attr => !existingAttributeIds?.includes(attr.id));
  };

  const filteredMeasures = useMemo(() => {
    const exchangeMeasuresIds = variableItem?.measures?.map(exMeasure => exMeasure.itemMeasure.id);
    return measureList.filter(m => m.id !== variableItem?.baseMeasure?.id && !exchangeMeasuresIds?.includes(m.id));
  }, [measureList?.length, variableItem?.baseMeasure?.id, variableItem?.measures?.length]);

  const isAttributeAddButtonDisabled =
    filteredAvailableAttributes()?.length === 0 ||
    !itemAttribute ||
    (itemAttribute?.attributeTax &&
      Object.keys(itemAttribute?.attributeTax)?.length === 0 &&
      itemAttribute?.attributeTerms?.length === 0);

  const handleBackClick = () => {
    const fromMenuId = new URLSearchParams(location.search).get('fromMenu');
    navigate(fromMenuId ? `/menu/${fromMenuId}/ONLINE_ORDERING/edit?page=1&sort=id,asc` : '/product');
  };

  const handleFieldChange = useCallback((fieldName, value) => {
    setVariableItem(prevState => ({ ...prevState, [fieldName]: value }));
  }, []);

  const handleVariantFieldChange = (variantIndex: number, fieldName: string, value: any) => {
    setVariableItem(prev => {
      const updatedVariants = [...prev.variants];
      updatedVariants[variantIndex] = {
        ...(prev.variants && prev.variants[variantIndex] ? prev.variants[variantIndex] : {}),
        [fieldName]: value,
      };
      return { ...prev, variants: updatedVariants };
    });
  };

  const addImage = (variantIndex: number, files: any) => {
    handleVariantFieldChange(variantIndex, 'attachments', transformAttachmentStructure(files, 'toIAttachment'));
  };

  const handleBaseMeasureChange = (baseMeasure) => {
    if (!variableItem?.measures || variableItem?.measures?.length === 0) {
      setVariableItem(prev => ({ ...prev, baseMeasure }));
    } else {
      setVariableItem(prevState => ({
        ...prevState,
        baseMeasure,
        measures: prevState.measures
          .filter(exMeasure => exMeasure.itemMeasure.id !== baseMeasure.id)
          .map(exMeasure => ({ ...exMeasure, exchangeRate: null })),
      }));
    }
    setMeasureToAdd({});
  };

  const handleShowPricesModal = (branchId, variantIndex) => {
    setPricesModal(prev => ({ ...prev, show: !prev.show, branchId, variantIndex }));
  };

  const handleSaveWholesalePrices = (prices) => {
    const { variantIndex, branchId } = pricesModal;
    setVariableItem(prev => ({
      ...prev,
      variants: prev.variants.map((variant, index) => {
        if (index !== variantIndex) return variant;
        return {
          ...variant,
          branchVariantDetails: {
            ...variant.branchVariantDetails,
            [branchId]: { ...variant.branchVariantDetails?.[branchId], wholesalePrices: prices },
          },
        };
      }),
    }));
  };

  const handleAddMeasure = () => {
    setVariableItem(prevState => ({
      ...prevState,
      measures: [measureToAdd, ...(prevState.measures || [])],
    }));
    setMeasureToAdd({});
  };

  const handleMeasuresChange = (measureIndex, newRate) => {
    setVariableItem(prevState => ({
      ...prevState,
      measures: prevState.measures.map((exMeasure, index) =>
        measureIndex === index ? { ...exMeasure, exchangeRate: newRate } : exMeasure
      ),
    }));
  };

  const handleRemoveMeasure = (measureIndex) => {
    setVariableItem(prevState => ({
      ...prevState,
      measures: prevState.measures.filter((_, index) => index !== measureIndex),
    }));
  };

  const handleAddAttribute = () => {
    setVariableItem(prev => ({
      ...prev,
      attributes: [...(prev.attributes || []), itemAttribute],
    }));
    setItemAttribute(null);
  };

  const handleItemAttributeSelect = (selectedOption) => {
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
    setVariableItem(prev => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) =>
        i === index ? { ...attr, attributeTerms: selectedTerms } : attr
      ),
    }));
  };

  const handleRemoveAttribute = (attributeIndex: number) => {
    setVariableItem(prev => {
      const updateAttributes = [...prev.attributes];
      updateAttributes.splice(attributeIndex, 1);
      return { ...prev, attributes: updateAttributes };
    });
  };

  const handleDeleteVariant = (variantIndex: number) => {
    setVariableItem(prev => {
      const updatedVariants = [...prev.variants];
      updatedVariants.splice(variantIndex, 1);
      return { ...prev, variants: updatedVariants };
    });
    if (activeVariantIndex >= variantIndex && activeVariantIndex > 0) {
      setActiveVariantIndex(activeVariantIndex - 1);
    }
  };

  const handleAddVariant = () => {
    setVariableItem(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          name: variableItem?.name,
          attachments: [],
          discounts: [],
          sku: '',
          price: null,
          salePrice: null,
          branchVariantDetails: {},
          attributeValues: {},
          specialPrices: { ...defaultSpecialPrices },
        },
      ],
    }));
    setActiveVariantIndex(variableItem.variants?.length ?? 0);
  };

  const generateCombinations = () => {
    const combinations = [];
    const generate = (index, currentCombination) => {
      if (index === variableItem?.attributes?.length) {
        const newVariant = {
          name: variableItem?.name || '',
          attachments: [],
          discounts: [],
          sku: '',
          price: null,
          salePrice: null,
          branchVariantDetails: {},
          attributeValues: { ...currentCombination },
          specialPrices: { ...defaultSpecialPrices },
        };
        const isDuplicate = variableItem?.variants.some(v => isEqual(v.attributeValues, newVariant.attributeValues));
        if (!isDuplicate) {
          combinations.push(newVariant);
        }
        return;
      }
      const attribute = variableItem?.attributes[index];
      const { attributeTax, attributeTerms } = attribute;
      for (const term of attributeTerms) {
        generate(index + 1, { ...currentCombination, [attributeTax.id]: term });
      }
    };
    generate(0, {});
    setVariableItem(prevState => ({ ...prevState, variants: [...prevState.variants, ...combinations] }));
  };

  const handleHeaderChange = (variantIndex, attributeId, selectedOption) => {
    setVariableItem(prev => {
      const updatedVariants = [...prev.variants];
      updatedVariants[variantIndex] = {
        ...updatedVariants[variantIndex],
        attributeValues: { ...updatedVariants[variantIndex]?.attributeValues, [attributeId]: selectedOption },
      };
      return { ...prev, variants: updatedVariants };
    });
  };

  const refreshProduct = () => {
    dispatch(getEntity(id));
  };

  const handleNavigate = (variableItemId) => {
    navigate(`/retail/variable/${variableItemId}/edit` + location.search);
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
      setVariableItem(variableItemEntity);
    }
    const variableItemId = variableItemEntity?.id;
    if (updateSuccess) {
      handleNavigate(variableItemId);
    }
  }, [variableItemEntity, updateSuccess]);

  const saveEntity = e => {
    e.preventDefault();
    const entity = { ...variableItem };
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

  const safeVariantIndex = Math.min(activeVariantIndex, (variableItem.variants?.length ?? 1) - 1);
  const activeVariant = variableItem.variants?.[safeVariantIndex];

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
                    <TabsTrigger value="variants" className="text-xs h-7">
                      {translate('items.update.variants', null, 'Variants')}
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

                  {/* Details tab: item-level fields */}
                  <TabsContent value="details" className="space-y-4">
                    <div className="text-lg font-semibold">
                      {isNew
                        ? <Translate contentKey="items.update.tabs.details.titles.create.variable">Create New Variable Item</Translate>
                        : <span>Edit {variableItem.name}</span>}
                    </div>
                    <SharedItemUpdate item={variableItem} onFieldChange={handleFieldChange} />
                  </TabsContent>

                  {/* Attributes tab */}
                  <TabsContent value="attributes">
                    <div className="space-y-4 mt-2">
                      <div className="flex gap-3 items-end">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs font-semibold">
                            <Translate contentKey="items.update.selectAttribute">Select Attribute</Translate>
                          </Label>
                          <Select
                            value={itemAttribute?.attributeTax || null}
                            options={filteredAvailableAttributes()}
                            isClearable
                            getOptionValue={option => option.id}
                            getOptionLabel={option => option.name}
                            onChange={attribute => handleItemAttributeSelect(attribute)}
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 text-xs"
                          disabled={isAttributeAddButtonDisabled}
                          onClick={handleAddAttribute}
                        >
                          <Translate contentKey="items.update.addAttribute">Add Attribute</Translate>
                        </Button>
                      </div>

                      <div className="flex gap-3 flex-wrap">
                        <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={generateCombinations}>
                          <Translate contentKey="items.update.generateVariants">Generate Variants</Translate>
                        </Button>
                      </div>

                      <Accordion type="multiple">
                        {variableItem?.attributes?.map((attribute, index) => (
                          <AccordionItem key={index} value={`attr-${index}`}>
                            <AccordionTrigger className="text-xs hover:no-underline">
                              <div className="flex items-center justify-between w-full pr-2">
                                <span className="font-medium">{attribute?.attributeTax?.name}</span>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="h-6 text-xs"
                                  onClick={e => { e.stopPropagation(); setDeleteAttributeDialog({ open: true, index }); }}
                                >
                                  <Translate contentKey="items.update.removeAttribute">Remove</Translate>
                                </Button>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="flex gap-3 items-center">
                                <span className="text-xs shrink-0">{translate('items.update.name')}: {attribute?.attributeTax?.name}</span>
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

                  {/* Variants tab: two-panel layout */}
                  <TabsContent value="variants">
                    <div className="mt-2">
                      {pricesModal?.show && pricesModal?.variantIndex !== null && (
                        <WholesalePrices
                          toggle={handleShowPricesModal}
                          isOpen={pricesModal?.show}
                          branchWholesalePrices={
                            variableItem?.variants?.[pricesModal?.variantIndex]?.branchVariantDetails?.[pricesModal?.branchId]?.wholesalePrices
                          }
                          savePrices={handleSaveWholesalePrices}
                        />
                      )}

                      <div className="flex gap-4 min-h-[500px]">
                        {/* Left: variant list */}
                        <div className="w-44 flex-shrink-0 border-r pr-3">
                          <VariantListPanel
                            variants={variableItem.variants || []}
                            activeIndex={safeVariantIndex}
                            onSelectVariant={setActiveVariantIndex}
                            onAddVariant={handleAddVariant}
                            renderLabel={(v: IVariableItemVariant) => (
                              <div>
                                <div className="truncate">{v.name || 'Unnamed'}</div>
                                {v.attributeValues && variableItem?.attributes?.map((attr, i) => {
                                  const val = v.attributeValues?.[attr?.attributeTax?.id];
                                  return val ? <span key={i} className="text-[10px] text-muted-foreground mr-1">{val.name}</span> : null;
                                })}
                              </div>
                            )}
                          />
                        </div>

                        {/* Right: active variant editor */}
                        <div className="flex-1 min-w-0">
                          {activeVariant ? (
                            <>
                              {/* Attribute value pickers for active variant */}
                              {variableItem?.attributes?.length > 0 && (
                                <div className="flex flex-wrap gap-3 mb-3">
                                  {variableItem.attributes.map((attribute, attrIdx) => (
                                    <div key={attrIdx} className="flex-1 min-w-[120px] space-y-1">
                                      <Label className="text-xs font-semibold">{attribute?.attributeTax?.name}</Label>
                                      <AsyncSelect
                                        value={activeVariant?.attributeValues?.[attribute?.attributeTax?.id]}
                                        getOptionLabel={option => option.name}
                                        getOptionValue={option => option.id}
                                        isLoading={loadingAttributesValues}
                                        onFocus={() => loadOptions(attribute?.attributeTax?.id)}
                                        defaultOptions={attribute?.attributeTerms}
                                        onChange={selectedOption => handleHeaderChange(safeVariantIndex, attribute?.attributeTax?.id, selectedOption)}
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}

                              <VariantEditor
                                variant={activeVariant}
                                variantIndex={safeVariantIndex}
                                itemVariantType="RETAIL"
                                branchList={branchList}
                                setItem={setVariableItem}
                                handleVariantFieldChange={handleVariantFieldChange}
                                handleBranchPriceChange={handleBranchPriceChange}
                                handleHideItemPerBranch={handleHideItemPerBranch}
                                handleSaveScheduledPrices={handleSaveScheduledPrices}
                                mixAndMatchRuleList={mixAndMatchRuleList}
                                showName
                                showSku
                                showDescription
                                showPrice
                                showSalePrice
                                defaultTab="general"
                                onDeleteVariant={() => setDeleteVariantDialog({ open: true, index: safeVariantIndex })}
                                canDeleteVariant={(variableItem.variants?.length ?? 0) > 1}
                                variantLabel={activeVariant?.name || `Variant ${safeVariantIndex + 1}`}
                                generalTabContent={
                                  <div className="space-y-2">
                                    <Label className="text-xs font-semibold">
                                      <Translate contentKey="items.update.image">Image</Translate>
                                    </Label>
                                    <MediaLibrary
                                      handleFilesSelectCallback={files => addImage(safeVariantIndex, files)}
                                      defaultValues={transformAttachmentStructure(activeVariant?.attachments, 'toFileLibraryListItem')}
                                    />
                                  </div>
                                }
                              />
                            </>
                          ) : (
                            <div className="flex items-center justify-center h-40 text-xs text-muted-foreground border rounded-md">
                              No variant selected. Add a variant or select one from the list.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="visibility">
                    <Visibility
                      initialState={variableItem.visibility}
                      title={translate('items.update.tabs.visibility.titles.variable')}
                      onStateChanged={visibility => setVariableItem(prev => ({ ...prev, visibility }))}
                    />
                  </TabsContent>

                  <TabsContent value="loyalty">
                    <ItemLoyaltyTab
                      excludedFromLoyaltyPoints={variableItem?.excludedFromLoyaltyPoints}
                      onFieldChange={handleFieldChange}
                    />
                  </TabsContent>

                  {!isNew && (
                    <TabsContent value="stock">
                      <ItemStockTab refreshProduct={refreshProduct} variants={variableItem?.variants} itemId={variableItem.id} />
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
                            value={variableItem?.baseMeasure}
                            options={measureList}
                            name="baseMeasure"
                            getOptionValue={option => option.id}
                            getOptionLabel={option => option.name}
                            onChange={handleBaseMeasureChange}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">
                            <Translate contentKey="items.update.measure">Measure</Translate>
                          </Label>
                          <Select
                            value={measureToAdd?.itemMeasure || null}
                            isDisabled={!variableItem?.baseMeasure}
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
                            {variableItem?.measures?.map((exMeasure, index) => (
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
              {variableItemEntity?.id && <AuditLogs entityId={variableItemEntity?.id} />}
            </div>
          </div>
        </div>
      </form>

      {/* Confirm delete variant */}
      <AlertDialog
        open={deleteVariantDialog.open}
        onOpenChange={open => setDeleteVariantDialog({ open, index: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Confirmation</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">Are you sure you want to delete this variant?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="h-8 text-xs"
              onClick={() => {
                handleDeleteVariant(deleteVariantDialog.index);
                setDeleteVariantDialog({ open: false, index: null });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm remove attribute */}
      <AlertDialog
        open={deleteAttributeDialog.open}
        onOpenChange={open => setDeleteAttributeDialog({ open, index: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Confirmation</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">Are you sure you want to remove this attribute?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="h-8 text-xs"
              onClick={() => {
                handleRemoveAttribute(deleteAttributeDialog.index);
                setDeleteAttributeDialog({ open: false, index: null });
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  );
};

export default VariableItemUpdate;
