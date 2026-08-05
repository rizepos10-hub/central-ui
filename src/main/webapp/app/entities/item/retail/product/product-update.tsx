import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getSortState, Storage, translate, Translate } from 'react-jhipster';
import { components as selectComponents } from 'react-select';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { runtimeConfig } from 'app/config/runtime-config';
import { createEntity, getEntity, reset, updateEntity } from './product.reducer';
import SharedItemUpdate from 'app/shared/components/item/shared-item-update';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import Select from 'app/shared/components/select/select';
import { getEntities as getAttributes, searchEntities as searchAttributes } from 'app/entities/item/retail/attributes/retail-attribute.reducer';
import { getEntities as getSuppliers } from 'app/entities/inventory/supplier/supplier.reducer';
import { ITaxonomy } from 'app/shared/model/taxonomy.model';
import { ITerm } from 'app/shared/model/term.model';
import {
  getEntities as getAttributeValues,
  reset as resetAttributeValues,
} from 'app/entities/item/retail/attributes/retail-attribute-values.reducer';
import AsyncSelect from 'app/shared/components/select/async-select';
import { ItemVariantType } from 'app/shared/model/ENUMS/item-variant-type.model';
import _, { isEqual } from 'lodash';
import Visibility from 'app/shared/Visibility/Visibility';
import ItemStockTab from 'app/shared/components/item/item-stock-tab';
import ItemStock from 'app/shared/components/item/item-stock';
import { IExchangeMeasure } from 'app/shared/model/ITEM/retail/simple-item.model';
import { getEntities as getMeasures } from 'app/entities/item-measure/item-measure.reducer';
import ItemLoyaltyTab from 'app/shared/components/item/item-loyalty-tab';
import WholesalePrices from 'app/shared/components/item/wholsale-prices-modal';
import { getEntities as getDiscounts } from 'app/entities/discount/discount.reducer';
import { getEntities as getMixAndMatchRules } from 'app/entities/mix-and-match-rule/mix-and-match-rule.reducer';
import AuditLogs from 'app/shared/components/logs/audit-logs';
import VariantBranchPrice from 'app/shared/components/item/variant-branch-price';
import DiscountDropdown from 'app/shared/components/item/discount-dropdown';
import ProductImageGallery from 'app/shared/components/item/product-image-gallery';
import { IProduct } from 'app/shared/model/ITEM/retail/product.model';
import { IMeasureValue, IScheduledBranchPrice, IVariableItemVariant } from 'app/shared/model/ITEM/retail/variable-item.model';
import { preventEnterSubmit } from 'app/shared/util/form-utils';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import VariantPackaging from 'app/shared/components/item/variant-packaging';
import CustomDefinitionValuesWrapper from 'app/shared/components/custom-definition-values/custom-definition-values-wrapper';
import { CustomDefinitionEntityType } from 'app/shared/model/CUSTOM-DEFINITION/custom-definition-value.model';
import SupplierAssociationTab from 'app/shared/components/item/supplier-association-tab';
import { IPurchaseConfig } from 'app/shared/model/STOCK/purchase-config.model';
import { IStockQuantity } from 'app/shared/model/STOCK/stock-quantity.model';
import ItemLocation from 'app/shared/components/item/item-location';
import { IPricingPoint } from 'app/shared/model/PRICING-POINT/pricing-point';
import { toast } from 'react-toastify';
import { ImMagicWand } from "react-icons/im";
import SeoTags from 'app/shared/components/item/seo-tags';
import EBTEligibleBranches from 'app/shared/components/item/ebt-eligible-branches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FilterMatchMode } from 'primereact/api';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { Accordion, AccordionContent, AccordionItem } from '@/components/ui/accordion';
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
import { Trash2, GripVertical, Loader2, ChevronDown } from 'lucide-react';
import { cn } from 'app/lib/utils';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { buildAuthTokenKey } from 'app/shared/util/tenant-utils';
import SkuEditor, { type SkuEditorHandle } from 'app/shared/components/item/sku-editor';
import { getVariantSkus, normalizeSkuList } from 'app/shared/util/sku-utils';

const defaultItemPriceNumber = {
  PRICE_1: null,
  PRICE_2: null,
  PRICE_3: null,
  PRICE_4: null,
  PRICE_5: null,
};

const defaultSpecialPrices = {
  WHOLE_SALE: { ...defaultItemPriceNumber },
  RETAIL: { ...defaultItemPriceNumber },
};

const ATTRIBUTE_PAGE_SIZE = 25;

const itemTypes = [
  {
    label: 'RETAIL SIMPLE',
    value: ItemVariantType.RETAIL_SIMPLE,
  },
  {
    label: 'RETAIL VARIABLE',
    value: ItemVariantType.RETAIL_VARIABLE,
  },
];

type RetailFormSectionProps = { title: string; description?: string; children: React.ReactNode };

const RetailFormSection = ({ title, description, children }: RetailFormSectionProps) => (
  <Card className="border-border/80 shadow-sm">
    <CardHeader className="pb-2 space-y-1">
      <CardTitle className="text-lg font-semibold tracking-tight text-foreground">{title}</CardTitle>
      {description ? <CardDescription className="text-xs">{description}</CardDescription> : null}
    </CardHeader>
    <CardContent className="space-y-4 pt-0">{children}</CardContent>
  </Card>
);

const customSelectStyles = {
  control: (base) => ({
    ...base,
    minHeight: '32px',
    fontSize: '0.75rem',
  }),
  valueContainer: (base) => ({
    ...base,
    padding: '0 8px',
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
  }),
};

export const ProductUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;
  const productEntity: IProduct = useAppSelector(state => state.product.entity);
  const loading = false;
  const updating = useAppSelector(state => state.product.updating);
  const updateSuccess = useAppSelector(state => state.product.updateSuccess);
  const branchList = useAppSelector(state => state.branch.entities);
  const measureList = useAppSelector(state => state.itemMeasure.entities);
  const discountList = useAppSelector(state => state.discount.entities);
  const mixAndMatchRuleList = useAppSelector(state => state.mixAndMatchRule.entities);
  const profileGroupsOptions = useAppSelector(state => state.profileGroup.entities);
  const variantsList = useAppSelector(state => state.variant.entities);
  const supplierList = useAppSelector(state => state.supplier.entities);
  const location = useLocation();
  const attributeValuesList = useAppSelector(state => state.retailAttributeValue.entities);
  const loadingAttributesValues = useAppSelector(state => state.retailAttributeValue.loading);
  const [activeIndex, setActiveIndex] = useState('details');
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const [product, setProduct] = useState<IProduct>({});
  const isVariableItem = product?.itemVariantType === ItemVariantType.RETAIL_VARIABLE;
  const isSingleItem = product?.itemVariantType === ItemVariantType.RETAIL_SIMPLE;
  /** Product-level catalog attachments (IItem.attachments); variant photos stay on each variant row. */
  const showCatalogImagePanel = product?.itemType === 'RETAIL' && (isSingleItem || isVariableItem);

  const [measureToAdd, setMeasureToAdd] = useState<IExchangeMeasure>();

  const [itemAttribute, setItemAttribute] = useState<{
    attributeTax: ITaxonomy;
    attributeTerms: ITerm[];
  } | null>(null);

  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [defaultPrice, setDefaultPrice] = useState(0);
  const [formIsValid, setFormIsValid] = useState(false);
  const [showFormErrors, setShowFormErrors] = useState(false);
  const attributeSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const variantSkuEditorsRef = useRef<Record<number, SkuEditorHandle | null>>({});
  const simpleSkuEditorRef = useRef<SkuEditorHandle | null>(null);
  const [attributeOptions, setAttributeOptions] = useState<ITaxonomy[]>([]);
  const [attributeSearchTerm, setAttributeSearchTerm] = useState('');
  const [attributePage, setAttributePage] = useState(0);
  const [attributeHasMore, setAttributeHasMore] = useState(true);
  const [attributeLoading, setAttributeLoading] = useState(false);
  const [attributeLoadingMore, setAttributeLoadingMore] = useState(false);

  // Alert dialog states
  const [deleteVariantDialog, setDeleteVariantDialog] = useState<{ open: boolean; index: number | null }>({ open: false, index: null });
  const [deleteAttributeDialog, setDeleteAttributeDialog] = useState<{ open: boolean; index: number | null }>({ open: false, index: null });
  const [changeVariantTypeDialog, setChangeVariantTypeDialog] = useState<{ open: boolean; newType: any | null }>({ open: false, newType: null });
  const [deleteAllVariantsDialog, setDeleteAllVariantsDialog] = useState(false);

  useEffect(() => {
    if (isSingleItem && product?.variants[0]?.name && product?.name) {
      setFormIsValid(true);
    } else {
      setFormIsValid(false);
    }

    if (!isSingleItem) {
      const allVariantsValid = product?.variants?.every(
        variant =>
          variant?.name &&
          ((!product?.attributes || product?.attributes.length === 0) ||
            Object.keys(variant?.attributeValues || {})?.length > 0) &&
          product?.name
      );

      setFormIsValid(allVariantsValid);
    }
  }, [product, isSingleItem])

  const availableAttributes = useMemo(() => {
    const existingAttributeIds = new Set(product?.attributes?.map(attr => attr.attributeTax.id) || []);
    return attributeOptions.filter(attr => !existingAttributeIds.has(attr.id));
  }, [attributeOptions, product?.attributes]);

  const fetchAttributeOptionsPage = useCallback(
    async (searchTerm: string, page: number, append = false) => {
      if ((append && (attributeLoading || attributeLoadingMore || !attributeHasMore)) || (!append && attributeLoading)) {
        return;
      }

      const normalizedSearchTerm = searchTerm.trim();

      if (append) {
        setAttributeLoadingMore(true);
      } else {
        setAttributeLoading(true);
      }

      try {
        const response = normalizedSearchTerm
          ? await dispatch(
              searchAttributes({
                query: applyMatchModeMap({
                  first: page * ATTRIBUTE_PAGE_SIZE,
                  rows: ATTRIBUTE_PAGE_SIZE,
                  page,
                  sortField: null,
                  sortOrder: null,
                  query: '',
                  filters: {
                    name: {
                      value: normalizedSearchTerm,
                      matchMode: FilterMatchMode.CONTAINS,
                    },
                  },
                }),
              })
            )
          : await dispatch(
              getAttributes({
                page,
                size: ATTRIBUTE_PAGE_SIZE,
                sort: `name,asc`,
              })
            );

        const payload = response.payload as any;
        const fetchedAttributes = (payload?.data || []) as ITaxonomy[];
        const totalItems = parseInt(payload?.headers?.['x-total-count'], 10);

        setAttributeOptions(prevOptions => {
          const mergedOptions = append
            ? [...prevOptions, ...fetchedAttributes].filter(
                (attribute, index, options) => options.findIndex(option => option.id === attribute.id) === index
              )
            : fetchedAttributes;

          const resolvedTotalItems = Number.isNaN(totalItems) ? mergedOptions.length + (fetchedAttributes.length === ATTRIBUTE_PAGE_SIZE ? 1 : 0) : totalItems;
          setAttributeHasMore(mergedOptions.length < resolvedTotalItems);
          return mergedOptions;
        });

        setAttributePage(page);
        setAttributeSearchTerm(normalizedSearchTerm);
      } catch (error) {
        if (!append) {
          setAttributeOptions([]);
        }
        setAttributeHasMore(false);
      } finally {
        setAttributeLoading(false);
        setAttributeLoadingMore(false);
      }
    },
    [attributeHasMore, attributeLoading, attributeLoadingMore, dispatch]
  );

  const handleAttributeInputChange = useCallback(
    (inputValue: string, { action }) => {
      if (action !== 'input-change') {
        return inputValue;
      }

      if (attributeSearchTimeoutRef.current) {
        clearTimeout(attributeSearchTimeoutRef.current);
      }

      attributeSearchTimeoutRef.current = setTimeout(() => {
        void fetchAttributeOptionsPage(inputValue, 0, false);
      }, 300);

      return inputValue;
    },
    [fetchAttributeOptionsPage]
  );

  const filteredMeasures = useMemo(() => {
    const exchangeMeasuresIds = product?.measures?.map(exMeasure => exMeasure.itemMeasure.id);
    return measureList.filter(m => m.id !== product?.baseMeasure?.id && !exchangeMeasuresIds?.includes(m.id));
  }, [measureList?.length, product?.baseMeasure?.id, product?.measures?.length]);

  const normalizeVariantsForMeasureRules = useCallback((variants: IVariableItemVariant[] = [], hasBaseMeasure: boolean) => {
    if (!Array.isArray(variants)) {
      return [];
    }

    return variants.map(variant => {
      if (!variant) {
        return variant;
      }

      if (variant?.measureValue?.isBase) {
        return {
          ...variant,
          variantPackage: null,
        };
      }

      return variant;
    });
  }, []);

  const isAttributeAddButtonDisabled =
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
    setProduct(prevState => {
      const updatedProduct = {
        ...prevState,
        [fieldName]: value,
      };

      if (updatedProduct.itemVariantType === 'RETAIL_SIMPLE' && fieldName === 'name') {
        const updatedVariant = prevState.variants?.[0] ? { ...prevState.variants[0], name: value } : { name: value };

        updatedProduct.variants = [updatedVariant, ...(prevState.variants?.slice(1) ?? [])];
      }

      return updatedProduct;
    });
  }, []);

  const updateItemLocation = (fieldName, value) => {
    setProduct(prevProduct => ({
      ...prevProduct,
      itemLocation: {
        ...prevProduct.itemLocation,
        [fieldName]: value
      }
    }));
  };

  const updateSeoTags = (fieldName, value) => {
    setProduct(prevProduct => ({
      ...prevProduct,
      seo: {
        ...prevProduct.seo,
        [fieldName]: value
      }
    }));
  };


  const handleVariantFieldChange = (variantIndex, fieldName: keyof IVariableItemVariant, value) => {
    setProduct(prev => {
      const updatedVariants = [...prev.variants];
      updatedVariants[variantIndex] = {
        ...(prev.variants && prev.variants[variantIndex] ? prev.variants[variantIndex] : {}),
        [fieldName]: value,
      };
      return {
        ...prev,
        variants: updatedVariants,
      };
    });
  };

  const handleMeasureChange = (measure, variantIndex) => {
    setProduct(prev => {
      const updatedVariants = [...prev.variants];
      updatedVariants[variantIndex] = {
        ...(prev.variants && prev.variants[variantIndex] ? prev.variants[variantIndex] : {}),
        itemMeasure: { id: measure },
      };
      return {
        ...prev,
        variants: updatedVariants,
      };
    });
  };

  const handleMeasureValueChange = (measureValue: IMeasureValue, variantIndex: number) => {
    setProduct(prev => {
      const updatedVariants = [...prev.variants];

      const updatedVariant = {
        ...(prev.variants && prev.variants[variantIndex] ? prev.variants[variantIndex] : {}),
        measureValue: {
          isBase: measureValue.isBase,
          // measure: measureValue.isBase ? 1 : measureValue.measure
        }
      };

      // loop over other variants and set isBase to false
      updatedVariants.forEach((variant, index) => {
        if (index !== variantIndex && updatedVariant.measureValue.isBase) {
          updatedVariants[index] = {
            ...variant,
            measureValue: {
              isBase: false,
              // measure: variant.measureValue.measure
            }
          }
        }
      });

      updatedVariants[variantIndex] = updatedVariant;
      return {
        ...prev,
        variants: normalizeVariantsForMeasureRules(updatedVariants, Boolean(prev?.baseMeasure)),
      };
    })
  };

  const handleShippingDimensionChange = (field, value, variantIndex) => {
    setProduct(prev => {
      const updatedVariants = [...prev.variants];
      // Ensure that the variant exists and has a shippingDimension object
      const updatedVariant = {
        ...(prev.variants && prev.variants[variantIndex] ? prev.variants[variantIndex] : {}),
        shippingDimension: {
          ...(prev.variants[variantIndex].shippingDimension || {}),
          [field]: value
        }
      };

      // Update the specific variant
      updatedVariants[variantIndex] = updatedVariant;

      return {
        ...prev,
        variants: updatedVariants,
      };
    });
  };

  const handleBaseMeasureChange = baseMeasure => {
    setProduct(prev => ({
      ...prev,
      baseMeasure,
      variants: normalizeVariantsForMeasureRules(prev?.variants || [], Boolean(baseMeasure)),
    }));
  };

  const handleAddMeasure = () => {
    setProduct(prevState => ({
      ...prevState,
      measures: [measureToAdd, ...(prevState.measures || [])],
    }));
    setMeasureToAdd({});
  };

  const handleMeasuresChange = (measureIndex, newRate) => {
    setProduct(prevState => {
      const updatedMeasures = prevState.measures.map((exMeasure, index) => {
        if (measureIndex === index) {
          return { ...exMeasure, exchangeRate: newRate };
        }
        return exMeasure;
      });

      return {
        ...prevState,
        measures: updatedMeasures,
      };
    });
  };

  const handleRemoveMeasure = measureIndex => {
    setProduct(prevState => {
      const updatedMeasures = prevState.measures.filter((_, index) => index !== measureIndex);
      return {
        ...prevState,
        measures: updatedMeasures,
      };
    });
  };

  const handleBranchPriceChange = (variantIndex, branchId, priceType, price) => {
    setProduct(prev => {
      const updatedVariants = [...prev.variants];
      updatedVariants[variantIndex] = {
        ...(prev.variants && prev.variants[variantIndex] ? prev.variants[variantIndex] : {}),
        branchVariantDetails: {
          ...(prev.variants[variantIndex]?.branchVariantDetails || {}),
          [branchId]: {
            ...prev.variants?.[variantIndex]?.branchVariantDetails?.[branchId],
            branch: { id: branchId },
            [priceType]: price,
          },
        },
      };
      return {
        ...prev,
        variants: updatedVariants,
      };
    });
  };

  const handleHideItemPerBranch = (branchId, variantIndex, field: 'hideItem' | 'hideOnline') => {
    setProduct(prev => {
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
    setProduct(prev => {
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

  const handleAddAttribute = () => {
    setProduct(prev => ({
      ...prev,
      attributes: [...(prev.attributes || []), itemAttribute],
    }));
    setItemAttribute(null);
  };

  const handleItemAttributeSelect = selectedOption => {
    if (!selectedOption) {
      setItemAttribute(null);
      return;
    }

    dispatch(
      getAttributeValues({
        id: selectedOption?.id,
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
    setItemAttribute(prevState => ({ ...prevState, attributeTax: selectedOption }));
  };

  const handleAttributeTermChange = (index: number, selectedTerms): void => {
    setProduct((prevProduct: IProduct) => {
      // Identify removed attribute terms
      const currentAttributeTerms = prevProduct.attributes[index].attributeTerms || [];
      const currentTermIds = currentAttributeTerms.map(term => term.id);
      const newTermIds = selectedTerms.map(term => term.id);

      // Calculate removed term IDs
      const removedTermIds = currentTermIds.filter(id => !newTermIds.includes(id));

      // Update the attributes
      const updatedAttributes = prevProduct.attributes.map((attr, i) =>
        i === index
          ? {
            ...attr,
            attributeTerms: selectedTerms,
          }
          : attr
      );

      // Remove corresponding attribute values from variants
      const updatedVariants = prevProduct.variants.map(variant => {
        const updatedAttributeValues = { ...variant.attributeValues };

        // Remove attribute values that correspond to removed terms
        updatedAttributeValues && Object.keys(updatedAttributeValues)?.forEach(key => {
          if (removedTermIds.includes(updatedAttributeValues[key]?.id)) {
            updatedAttributeValues[key] = null; // Remove the attribute value
          }
        });

        return {
          ...variant,
          attributeValues: updatedAttributeValues,
        };
      });

      return {
        ...prevProduct,
        attributes: updatedAttributes,
        variants: updatedVariants,
      };
    });
  };

  const generateCombinations = () => {
    const combinations = [];

    const generate = (index, currentCombination) => {
      if (index === product?.attributes?.length) {
        const newVariant = {
          name: product?.name || '',
          accountingGroups: product?.accountingGroups || [],
          attachments: [],
          discounts: [],
          sku: '',
          price: defaultPrice,
          salePrice: null,
          branchVariantDetails: {},
          attributeValues: { ...currentCombination },
          specialPrices: { ...defaultSpecialPrices },
          measureValue: {
            isBase: false,
            measure: 1
          }
        };

        const isDuplicate = product?.variants.some(variant => {
          return isEqual(variant.attributeValues, newVariant.attributeValues);
        });
        if (!isDuplicate) {
          combinations.push(newVariant);
        }
        return;
      }

      const attribute = product?.attributes[index];
      const { attributeTax, attributeTerms } = attribute;

      for (const term of attributeTerms) {
        generate(index + 1, {
          ...currentCombination,
          [attributeTax.id]: term,
        });
      }
    };
    generate(0, {});
    setProduct(prevState => ({
      ...prevState,
      variants: [...prevState.variants, ...combinations],
    }));
    return combinations;
  };

  const handleAddVariant = () => {
    setProduct(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          name: product?.name,
          attachments: [],
          accountingGroups: prev?.accountingGroups || [],
          discounts: [],
          sku: '',
          price: defaultPrice,
          salePrice: null,
          branchVariantDetails: {},
          attributeValues: {},
          specialPrices: { ...defaultSpecialPrices },
          createdDate: new Date().toISOString(),
          order: prev.variants.length,
          measureValue: {
            isBase: false,
            measure: 1
          }
        },
      ],
    }));
  };

  const handleDragOver = (event, index) => {
    event.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (droppedIndex: number) => {
    if (draggedIndex === null || draggedIndex === droppedIndex) return;

    const reorderedVariants = Array.from(product.variants);
    const [reorderedVariant] = reorderedVariants.splice(draggedIndex, 1);
    reorderedVariants.splice(droppedIndex, 0, reorderedVariant);

    const updatedVariants = reorderedVariants.map((variant, index) => {
      if (index === droppedIndex) {
        return { ...variant, order: droppedIndex };
      } else if (index >= droppedIndex && index < draggedIndex) {
        return { ...variant, order: index + 1 };
      } else if (index <= droppedIndex && index > draggedIndex) {
        return { ...variant, order: index - 1 };
      } else {
        return variant;
      }
    });

    setProduct(prev => ({
      ...prev,
      variants: updatedVariants,
    }));
    setDraggedIndex(null);
    setDragOverIndex(null);
  };


  const handleNavigate = productId => {
    navigate(`/product/${productId}/edit` + location.search);
  };

  const refreshProduct = () => {
    dispatch(getEntity(id));
    setActiveIndex('visibility')
  }

  const productPurchaseConfig = (purchaseConfig: IPurchaseConfig, variantIndex: number) => {
    setProduct((prevProduct) => ({
      ...prevProduct,
      variants: prevProduct.variants.map((variant, index) =>
        index === variantIndex
          ? {
            ...variant,
            purchaseConfig,
          }
          : variant
      ),
    }));
  }

  const stockQuantityUpdate = (stockQuantities: IStockQuantity[], variantIndex: number) => {
    setProduct((prevProduct) => ({
      ...prevProduct,
      variants: prevProduct.variants.map((variant, index) => {
        if (index === variantIndex) {
          return {
            ...variant,
            stockQuantities,
          }
        }
        return variant;
      }),
    }));
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

    dispatch(
      getBranches({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );

    dispatch(
      getMeasures({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );

    dispatch(
      getDiscounts({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );

    dispatch(
      getMixAndMatchRules({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );

    dispatch(
      getSuppliers({
        page: 0,
        size: 500
      })
    );
  }, [id, isNew]);

  useEffect(() => {
    return () => {
      if (attributeSearchTimeoutRef.current) {
        clearTimeout(attributeSearchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setProduct({
      ...productEntity,
      variants: normalizeVariantsForMeasureRules(
        productEntity?.variants?.slice()?.sort((a, b) => a.order - b.order) || [],
        Boolean(productEntity?.baseMeasure)
      ),
    });

    setDefaultPrice(productEntity?.variants?.[0]?.price || 0)
  }, [normalizeVariantsForMeasureRules, productEntity]);

  const handleSupplierChange = (index: number, updatedVariant: IVariableItemVariant) => {
    const updatedProduct = {
      ...product,
      variants: product.variants.map((variant, i) =>
        i === index
          ? {
            ...variant,
            supplierAssociations: updatedVariant.supplierAssociations,
          }
          : variant
      ),
    };
    setProduct(updatedProduct);
  };

  useEffect(() => {
    if (!defaultPrice) {
      setDefaultPrice(product?.variants?.[0]?.price || 0);
    }
  }, [product?.variants?.[0]?.price])

  useEffect(() => {
    if (isSingleItem && defaultPrice) {
      setProduct(prev => ({
        ...prev,
        variants: prev.variants.map(variant => ({
          ...variant,
          price: defaultPrice,
        })),
      }));
    }
  }, [defaultPrice])

  const saveEntity = (e, createNew = false, clone = false) => {
    e.preventDefault();
    if (!formIsValid) {
      setShowFormErrors(true);
      return;
    } else {
      setShowFormErrors(false);
    }

    const updatedVariants = normalizeVariantsForMeasureRules(product?.variants, Boolean(product?.baseMeasure)).map((variant, index) => {
      if (index !== 0 && variant.order === 0) {
        return {
          ...variant,
          order: index,
        };
      }
      return {
        ...variant,
        price: product.askForPrice ? 0 : variant.price ? variant.price : 0,
        skus: normalizeSkuList(getVariantSkus(variant)),
        sku: undefined,
        purchaseConfig:
          ((variant?.purchaseConfig?.minOrderQuantity === null || variant?.purchaseConfig?.minOrderQuantity === undefined) &&
            (variant?.purchaseConfig?.defaultPrice === null || variant?.purchaseConfig?.defaultPrice === undefined) &&
            variant?.purchaseConfig?.supplierConfigurations?.length === 0 &&
            !variant?.purchaseConfig?.defaultSupplier?.id)
            ? null
            : variant?.purchaseConfig,
        variantPackage: variant?.measureValue?.isBase ? null : variant?.variantPackage
      };
    });

    const entity = {
      ...product,
      variants: !isSingleItem ? updatedVariants : [
        {
          ...updatedVariants[0],
          name: product.name,
          price: defaultPrice,
          measureValue: product.baseMeasure ? {
            isBase: true,
            // measure: 1
          } : null
        }
      ],
    };

    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          reset()
          setProduct({
            itemType: 'RETAIL',
            itemVariantType: ItemVariantType.RETAIL_SIMPLE,
            variants: [],
          })
        } else {
          const payload = res?.payload as any;
          const newProductId = payload?.data?.id;

          const { id, ...entityWithoutId } = entity;
          entityWithoutId.variants = entityWithoutId?.variants.map(({ id, ...variantWithoutId }) => ({
            ...variantWithoutId,
            sku: undefined,
          }));

          if (clone) {
            dispatch(createEntity(entityWithoutId)).then(res => {
              const payload = res?.payload as any;
              const newProductId = payload?.data?.id;

              // @ts-expect-error -- unknown type
              if (!res?.error) {
                navigate(`/product/${newProductId}/edit`)
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
            sku: undefined,
          }));
          dispatch(createEntity(entityWithoutId)).then(res => {
            const payload = res?.payload as any;
            const newProductId = payload?.data?.id;

            // @ts-expect-error -- unknown type
            if (!res?.error) {
              navigate(`/product/${newProductId}/edit`)
            }
          });
        }

        if (createNew) {
          navigate(`/product/new`)
        }
      })
    }
  };

  const loadOptions = attributeId => {
    dispatch(resetAttributeValues());
    dispatch(
      getAttributeValues({
        id: attributeId,
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
  };

  const handleHeaderChange = (variantIndex, attributeId, selectedOption) => {
    setProduct(prev => {
      const updatedVariants = [...prev.variants];
      const updatedAttributeValues = {
        ...updatedVariants[variantIndex]?.attributeValues,
        [attributeId]: selectedOption,
      };

      updatedVariants[variantIndex] = {
        ...(prev.variants && prev.variants[variantIndex] ? prev.variants[variantIndex] : {}),
        attributeValues: updatedAttributeValues,
      };

      return {
        ...prev,
        variants: updatedVariants,
      };
    });
  };

  const handleDeleteVariant = () => {
    if (deleteVariantDialog.index !== null) {
      setProduct(prev => {
        const updatedVariants = [...prev.variants];
        updatedVariants.splice(deleteVariantDialog.index, 1);
        return {
          ...prev,
          variants: updatedVariants,
        };
      });
    }
    setDeleteVariantDialog({ open: false, index: null });
  };

  const handleRemoveAttribute = () => {
    if (deleteAttributeDialog.index !== null) {
      setProduct(prev => {
        const updateAttributes = [...prev.attributes];
        updateAttributes.splice(deleteAttributeDialog.index, 1);
        return {
          ...prev,
          attributes: updateAttributes,
        };
      });
    }
    setDeleteAttributeDialog({ open: false, index: null });
  };

  const handleChangeVariantType = () => {
    if (changeVariantTypeDialog.newType) {
      handleFieldChange('itemVariantType', changeVariantTypeDialog.newType.value)
      handleFieldChange('variants', product.variants && product.variants.length > 0 ? [product.variants[0]] : [])
    }
    setChangeVariantTypeDialog({ open: false, newType: null });
  };

  const handleDeleteAllVariants = () => {
    handleFieldChange('variants', []);
    setDeleteAllVariantsDialog(false);
  };

  const AttributeAccordionHeader = attributeIndex => (
    <div
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className="flex gap-3 ml-2 w-full"
    >
      <label className="mt-2">
        <strong>{product?.attributes?.[attributeIndex]?.attributeTax?.name}</strong>
      </label>

      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="ml-auto h-7 text-xs"
        onClick={() => setDeleteAttributeDialog({ open: true, index: attributeIndex })}
      >
        <Translate contentKey={'items.update.removeAttribute'}>Remove Attribute</Translate>
      </Button>
    </div>
  );

  /** Variant row form fields only — delete + expand chevron live in the accordion trigger beside this block. */
  const VariantAccordionForm = variantIndex => (
    <div
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className="flex flex-1 min-w-0 gap-3 ml-2 p-draggable"
    >
      <div className="flex-1 min-w-0 gap-2">
        <div className="flex flex-col md:flex-row gap-4 mb-2">
          <div className="flex-1 space-y-1 min-w-0">
            <label className="text-xs font-semibold">
              <Translate contentKey="items.update.name">Name</Translate>
            </label>
            <Input
              name="variant-name"
              id="name"
              required={true}
              placeholder={translate('items.update.placeholders.variantName')}
              value={product.variants[variantIndex]?.name || ''}
              onChange={e =>
                handleVariantFieldChange(variantIndex, 'name', e.target.value)
              }
              onKeyDown={e => {
                if (e.key === ' ') {
                  e.stopPropagation();
                }
              }}
              className={`h-8 text-xs ${showFormErrors && !product.variants[variantIndex]?.name ? 'border-red-500' : ''}`}
            />
          </div>

          <div className="flex-1 space-y-1 min-w-0">
            <label htmlFor="price" className="text-xs font-semibold">
              <Translate contentKey={'items.update.price'}>Price</Translate>
            </label>
            <Input
              type="number"
              name="price"
              id="price"
              required={true}
              placeholder="Variant Price"
              value={product.variants[variantIndex]?.price ?? ''}
              min={0}
              step="0.01"
              onChange={e => handleVariantFieldChange(variantIndex, 'price', parseFloat(e.target.value) ?? 0)}
              onKeyDown={e => {
                if (e.key === ' ') {
                  e.stopPropagation();
                }
              }}
              className={`h-8 text-xs ${showFormErrors && !product.variants[variantIndex]?.price ? 'border-red-500' : ''}`}
            />
          </div>

          <div className="flex-1 space-y-1 min-w-0">
            <label className="text-xs font-semibold">
              <Translate contentKey={'items.update.sku'}>SKU</Translate>
            </label>
            <div className="relative flex gap-2">
              <div className="flex-1">
                <SkuEditor
                  ref={ref => {
                    variantSkuEditorsRef.current[variantIndex] = ref;
                  }}
                  value={product.variants[variantIndex]?.skus}
                  onChange={value => handleVariantFieldChange(variantIndex, 'skus', value)}
                  placeholder="Variant SKU"
                  inputClassName="h-8 text-xs pr-10"
                />
              </div>
              <Button
                onClick={async () => {
                  const generatedSku = await generateSku()
                  variantSkuEditorsRef.current[variantIndex]?.insertSku(generatedSku)
                }}
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 h-8 w-8 p-0"
              >
                <ImMagicWand size={12} />
              </Button>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {product?.attributes?.map((attribute, index) => (
            <AsyncSelect
              key={index}
              value={
                product?.variants?.[variantIndex]?.attributeValues?.[
                attribute?.attributeTax?.id
                ]
              }
              getOptionLabel={option => option.name}
              getOptionValue={option => option.id}
              isLoading={loadingAttributesValues}
              onFocus={() => loadOptions(attribute?.attributeTax?.id)}
              defaultOptions={attribute?.attributeTerms}
              onChange={selectedOption =>
                handleHeaderChange(
                  variantIndex,
                  attribute?.attributeTax?.id,
                  selectedOption
                )
              }
            />
          ))}
        </div>
      </div>
    </div>
  );

  const getCurrentAuthToken = () => {
    const tokenKey = buildAuthTokenKey();
    return Storage.local.get(tokenKey) || Storage.session.get(tokenKey);
  };


  const generateSku = async () => {
    const response = await fetch(`${runtimeConfig.SERVER_API_URL}/api/settings/item/sku`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getCurrentAuthToken()}`,
      },
    })

    if (!response.ok) {
      toast.error("An error occurred");
    } else {
      const data = await response.json();
      return data;
    }
  }

  useEffect(() => {
    // if the askForPrice field is true, set the itemVariantType to RETAIL_SIMPLE
    if (product.askForPrice) {
      setProduct(prev => ({ ...prev, itemVariantType: ItemVariantType.RETAIL_SIMPLE }))
    }
  }, [product.askForPrice])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <PageWrapper>
      <form onKeyDown={preventEnterSubmit}>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 lg:w-3/4">
            <Card>
              <CardContent className="p-4">
                <div>
                  <Tabs value={activeIndex} onValueChange={setActiveIndex}>
                    <TabsList className="w-full justify-start mb-4 h-auto flex-wrap">
                      <TabsTrigger value="details" className="text-xs h-7">
                        {translate('items.update.tabs.details.label')}
                      </TabsTrigger>
                      <TabsTrigger value="visibility" className="text-xs h-7">
                        {translate('items.update.tabs.visibility.label')}
                      </TabsTrigger>
                      <TabsTrigger value="loyalty" className="text-xs h-7">
                        {translate('items.update.tabs.excludedFromLoyaltyPoints.label')}
                      </TabsTrigger>
                      <TabsTrigger value="ebt" className="text-xs h-7">
                        {translate('items.update.tabs.ebtEligibleBranches.label')}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="details">
                      <div className="space-y-6">
                        <div className="space-y-2 border-b border-border/70 pb-4">
                          <div className="flex flex-wrap items-center gap-2 gap-y-1">
                            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                              {isNew ? translate('items.update.tabs.details.titles.create.variable') : product.name || translate('items.update.tabs.details.titles.create.variable')}
                            </h1>
                            {product.askForPrice ? (
                              <Badge variant="secondary" className="text-xs font-normal">
                                Ask for price
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Retail product · {isNew ? 'Create new' : 'Edit details'}
                          </p>
                        </div>

                        <div className="flex flex-col w-full space-y-6">
                          {isSingleItem && (
                            <RetailFormSection
                              title="SKU & barcode"
                              description="USB scanner: focus this field, then scan — the code fills in automatically. Use the wand to generate a SKU."
                            >
                              <div className="space-y-1">
                                <label className="text-xs font-semibold">
                                  <Translate contentKey={'items.update.sku'}>SKU</Translate>
                                </label>
                                <div className="relative flex gap-2">
                                  <div className="flex-1">
                                    <SkuEditor
                                      ref={simpleSkuEditorRef}
                                      value={product?.variants?.[0]?.skus}
                                      onChange={value => handleVariantFieldChange(0, 'skus', value)}
                                      placeholder={translate('items.update.placeholders.itemSku')}
                                      inputClassName="h-8 text-xs pr-10"
                                    />
                                  </div>
                                  <Button
                                    onClick={async () => {
                                      const generatedSku = await generateSku()
                                      simpleSkuEditorRef.current?.insertSku(generatedSku)
                                    }}
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 h-8 w-8 p-0"
                                  >
                                    <ImMagicWand size={14} />
                                  </Button>
                                </div>
                              </div>
                            </RetailFormSection>
                          )}
                          <SharedItemUpdate
                            item={product}
                            onFieldChange={handleFieldChange}
                            defaultPrice={defaultPrice}
                            setDefaultPrice={setDefaultPrice}
                            showFormErrors={showFormErrors}
                            groupedSections
                            hideCatalogImages={showCatalogImagePanel}
                          />

                          <RetailFormSection
                            title="Unit & product structure"
                            description="Base unit of measure and whether this item is simple or has multiple variants."
                          >
                            <div className="space-y-1">
                              <label className="text-xs font-semibold">
                                <Translate contentKey={'items.update.measure'}>Measure</Translate>
                              </label>
                              <Select
                                value={product?.baseMeasure || null}
                                options={measureList}
                                name="baseMeasure"
                                getOptionValue={option => option.id}
                                getOptionLabel={option => option.name}
                                onChange={handleBaseMeasureChange}
                                styles={customSelectStyles}
                              />
                            </div>

                            {!product.askForPrice && (
                              <div className="space-y-1">
                                <label className="text-xs font-semibold">
                                  <Translate contentKey={'items.update.itemType'}>Item Type</Translate>
                                </label>
                                <div className="flex gap-1 flex-wrap">
                                  {itemTypes.map((type) => (
                                    <Button
                                      key={type.value}
                                      type="button"
                                      variant={product?.itemVariantType === type.value ? "default" : "outline"}
                                      size="sm"
                                      className="h-8 text-xs"
                                      onClick={() => setChangeVariantTypeDialog({ open: true, newType: type })}
                                    >
                                      {type.label}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </RetailFormSection>

                          {isSingleItem && (
                            <>
                              <RetailFormSection title="Variant description" description="Longer description for this SKU (simple product).">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-xs font-semibold">
                                      <Translate contentKey={'items.update.description'}>Description</Translate>
                                    </label>
                                    <Textarea
                                      name="desc"
                                      id="desc"
                                      placeholder={translate('items.update.description')}
                                      value={product?.variants?.[0]?.description || ''}
                                      onChange={e => setProduct(prev => {
                                        return {
                                          ...prev, variants: prev.variants.map(variant => {
                                            return { ...variant, description: e.target.value }
                                          })
                                        }
                                      })}
                                      className="text-xs min-h-[80px]"
                                      rows={3}
                                    />
                                  </div>
                                </div>
                              </RetailFormSection>

                              <RetailFormSection title="Shipping dimensions" description="Used for shipping labels and carrier calculations.">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-xs font-semibold">
                                      <Translate contentKey='items.update.shippingDimension.height'>Height</Translate>
                                    </label>
                                    <Input
                                      type="number"
                                      name="minimumStockLevel"
                                      id="minimumStockLevel"
                                      required
                                      min={0}
                                      step="0.01"
                                      placeholder={translate('items.update.placeholders.height')}
                                      value={product?.variants?.[0]?.shippingDimension?.height ?? ''}
                                      onChange={(e) => handleShippingDimensionChange("height", parseFloat(e.target.value) ?? 0, 0)}
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-xs font-semibold">
                                      <Translate contentKey='items.update.shippingDimension.length'>Length</Translate>
                                    </label>
                                    <Input
                                      type="number"
                                      name="quantity"
                                      id="quantity"
                                      required
                                      min={0}
                                      step="0.01"
                                      placeholder={translate('items.update.placeholders.length')}
                                      value={product?.variants?.[0]?.shippingDimension?.length ?? ''}
                                      onChange={(e) => handleShippingDimensionChange("length", parseFloat(e.target.value) ?? 0, 0)}
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-xs font-semibold">
                                      <Translate contentKey='items.update.shippingDimension.width'>Width</Translate>
                                    </label>
                                    <Input
                                      type="number"
                                      name="unitCost"
                                      id="unitCost"
                                      required
                                      min={0}
                                      step="0.01"
                                      placeholder={translate('items.update.placeholders.width')}
                                      value={product?.variants?.[0]?.shippingDimension?.width ?? ''}
                                      onChange={(e) => handleShippingDimensionChange("width", parseFloat(e.target.value) ?? 0, 0)}
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-xs font-semibold">
                                      <Translate contentKey='items.update.shippingDimension.weight'>Weight</Translate>
                                    </label>
                                    <Input
                                      type="number"
                                      name="unitCost"
                                      id="unitCost"
                                      required
                                      min={0}
                                      step="0.01"
                                      placeholder={translate('items.update.placeholders.weight')}
                                      value={product?.variants?.[0]?.shippingDimension?.weight ?? ''}
                                      onChange={(e) => handleShippingDimensionChange("weight", parseFloat(e.target.value) ?? 0, 0)}
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                </div>
                              </RetailFormSection>

                              {!product.askForPrice && (
                                <RetailFormSection
                                  title="Sale price & promotions"
                                  description="Optional sale price, discounts, and mix-and-match rules for this variant."
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <label className="text-xs font-semibold">
                                        <Translate contentKey={'items.update.salePrice'}>Sale Price</Translate>
                                      </label>
                                      <Input
                                        type="number"
                                        name="sale-price"
                                        id="sale-price"
                                        min={0}
                                        step="0.01"
                                        placeholder={translate('items.update.placeholders.itemSalePrice')}
                                        value={product?.variants?.[0]?.salePrice ?? ''}
                                        onChange={e => handleVariantFieldChange(0, 'salePrice', parseFloat(e.target.value) ?? null)}
                                        className="h-8 text-xs"
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2">
                                      <DiscountDropdown
                                        discounts={product?.variants?.[0]?.discounts}
                                        variantIndex={0}
                                        handleVariantChange={handleVariantFieldChange}
                                      />

                                      <div className="space-y-1 mt-2">
                                        <label className="text-xs font-semibold">
                                          <Translate contentKey={'items.update.mixAndMatchRule'}>Mix And Match Rule</Translate>
                                        </label>
                                        <Select
                                          isClearable
                                          value={product?.variants?.[0]?.mixAndMatchRule || null}
                                          options={mixAndMatchRuleList}
                                          getOptionLabel={option => option.name}
                                          getOptionValue={option => option.id}
                                          onChange={mixAndMatchRule => handleVariantFieldChange(0, 'mixAndMatchRule', mixAndMatchRule)}
                                          styles={customSelectStyles}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </RetailFormSection>
                              )}

                              {!isNew && (
                                <RetailFormSection title="Packaging" description="How this variant is packaged when not using the base unit.">
                                  <VariantPackaging
                                    product={product}
                                    variantIndex={0}
                                    variant={product?.variants?.[0]}
                                    handleVariantFieldChange={handleVariantFieldChange}
                                  />
                                </RetailFormSection>
                              )}
                              {!product.askForPrice && (
                                <RetailFormSection title="Stock & purchasing" description="Inventory and supplier purchasing settings for this variant.">
                                  <ItemStock
                                    productPurchaseConfig={productPurchaseConfig}
                                    handleVariantFieldChange={handleVariantFieldChange}
                                    variant={product?.variants?.[0]}
                                    variantIndex={0}
                                    itemId={product.id}
                                  />
                                </RetailFormSection>
                              )}

                              {!product.askForPrice && (
                                <RetailFormSection
                                  title="Branch pricing & visibility"
                                  description="Override prices or hide this item per location."
                                >
                                  <VariantBranchPrice
                                    itemVariantType={'RETAIL'}
                                    branchVariantDetails={product?.variants?.[0]?.branchVariantDetails}
                                    variantIndex={0}
                                    branchList={branchList}
                                    handleBranchPriceChange={handleBranchPriceChange}
                                    handleSaveScheduledPrices={handleSaveScheduledPrices}
                                    handleHideItemPerBranch={handleHideItemPerBranch}
                                    variant={product?.variants?.[0]}
                                    setItem={setProduct}
                                  />
                                </RetailFormSection>
                              )}
                            </>
                          )}

                          <RetailFormSection
                            title="Variant attributes"
                            description="Define option dimensions (size, color, etc.). Each variant row below uses these values."
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="md:col-span-1 space-y-1">
                                <label className="text-xs font-semibold">
                                  <Translate contentKey={'items.update.selectAttribute'}>Select Attribute</Translate>
                                </label>
                                <Select
                                  value={itemAttribute?.attributeTax || null}
                                  options={availableAttributes}
                                  isClearable
                                  isLoading={attributeLoading || attributeLoadingMore}
                                  getOptionValue={option => option.id}
                                  getOptionLabel={option => option.name}
                                  onChange={attribute => handleItemAttributeSelect(attribute)}
                                  onInputChange={handleAttributeInputChange}
                                  onMenuOpen={() => {
                                    if (attributeOptions.length === 0) {
                                      void fetchAttributeOptionsPage(attributeSearchTerm, 0, false);
                                    }
                                  }}
                                  onMenuScrollToBottom={() => {
                                    if (attributeHasMore && !attributeLoading && !attributeLoadingMore) {
                                      void fetchAttributeOptionsPage(attributeSearchTerm, attributePage + 1, true);
                                    }
                                  }}
                                  filterOption={() => true}
                                  components={{
                                    LoadingIndicator: props => (
                                      <selectComponents.LoadingIndicator {...props}>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      </selectComponents.LoadingIndicator>
                                    ),
                                  }}
                                  loadingMessage={() => (
                                    <span className="inline-flex items-center gap-2">
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      Loading attributes...
                                    </span>
                                  )}
                                  noOptionsMessage={() =>
                                    attributeLoading || attributeLoadingMore
                                      ? 'Loading attributes...'
                                      : attributeSearchTerm
                                      ? 'No attributes found.'
                                      : 'No more attributes available.'
                                  }
                                  styles={customSelectStyles}
                                  placeholder="Search attribute"
                                />
                              </div>

                              <div className="flex items-end">
                                <Button
                                  variant="default"
                                  type="button"
                                  disabled={isAttributeAddButtonDisabled}
                                  className="h-8 text-xs"
                                  onClick={handleAddAttribute}
                                >
                                  <Translate contentKey={'items.update.addAttribute'}>Add Attribute</Translate>
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              {product?.attributes?.map((attribute, index) => (
                                <div className="flex gap-3 items-end" key={index}>
                                  <div className="flex-1">
                                    <label className="text-xs">
                                      {translate('items.update.name')}: {attribute?.attributeTax?.name}
                                    </label>
                                    <Select
                                      value={attribute?.attributeTerms || []}
                                      isMulti
                                      options={attributeValuesList}
                                      getOptionLabel={option => option.name}
                                      getOptionValue={option => option.id}
                                      onChange={selectedOptions => handleAttributeTermChange(index, selectedOptions)}
                                      isLoading={loadingAttributesValues}
                                      onFocus={() => loadOptions(attribute.attributeTax.id)}
                                      filterOption={(option, input) =>
                                        option.label.toLowerCase().includes(input.toLowerCase())
                                      }
                                      styles={customSelectStyles}
                                    />
                                  </div>
                                  <div>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      className="h-8 text-xs"
                                      onClick={() => setDeleteAttributeDialog({ open: true, index })}
                                    >
                                      <Translate contentKey={'items.update.removeAttribute'}>Remove</Translate>
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </RetailFormSection>

                          {isVariableItem && (
                            <RetailFormSection
                              title="Product variants"
                              description="Each row is a sellable SKU. Drag the handle to reorder. Expand a row for details, pricing, and stock."
                            >
                              <div className="space-y-4">
                                <label htmlFor="price" className="text-xs font-semibold">
                                  <Translate contentKey={'items.update.variants'}>Variants</Translate>
                                </label>
                                <div className="flex gap-3 flex-wrap">
                                  <Button type="button" variant="default" size="sm" className="h-8 text-xs" onClick={generateCombinations}>
                                    <Translate contentKey={'items.update.generateVariants'}>Generate Variants</Translate>
                                  </Button>

                                  <Button variant="default" size="sm" type={'button'} className="h-8 text-xs" onClick={handleAddVariant}>
                                    <Translate contentKey={'items.update.addSingleVariant'}>Add Single Variant</Translate>
                                  </Button>

                                  {product.variants?.length > 0 && (
                                    <Button variant="destructive" size="sm" type={'button'} className="h-8 text-xs" onClick={() => setDeleteAllVariantsDialog(true)}>
                                      <Translate contentKey={'items.update.removeAllVariants'}>Remove All Variants</Translate>
                                    </Button>
                                  )}
                                </div>
                                <div className="space-y-0">
                                  {product?.variants?.map((variant, variantIndex) => (
                                    <React.Fragment key={variantIndex}>
                                      {variantIndex > 0 ? <Separator className="my-4 bg-border/80" /> : null}
                                      <div
                                        className={`flex gap-2 items-stretch ${dragOverIndex === variantIndex ? 'border-t-2 border-primary pt-2 -mt-0.5' : ''}`}
                                        draggable
                                        onDragStart={() => setDraggedIndex(variantIndex)}
                                        onDragOver={e => handleDragOver(e, variantIndex)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={() => handleDrop(variantIndex)}
                                      >
                                        <div
                                          className="flex flex-col items-center justify-start gap-1 shrink-0 w-10 pt-3 pb-2 rounded-md border border-border/60 bg-muted/30 text-muted-foreground cursor-grab active:cursor-grabbing select-none"
                                          title="Drag to reorder"
                                        >
                                          <GripVertical className="h-4 w-4 shrink-0" aria-hidden />
                                          <span className="text-[11px] font-semibold tabular-nums text-foreground leading-none">
                                            #{variantIndex + 1}
                                          </span>
                                        </div>
                                        <Accordion type="single" collapsible className="flex-1 min-w-0">
                                        <AccordionItem value={`variant-${variantIndex}`} className="border-b-0">
                                          <AccordionPrimitive.Header className="flex w-full min-w-0">
                                            <AccordionPrimitive.Trigger
                                              className={cn(
                                                'group flex flex-1 w-full min-w-0 items-start gap-2 py-3 pr-1 text-left text-xs font-medium',
                                                'rounded-md transition-colors hover:bg-muted/40 hover:no-underline'
                                              )}
                                            >
                                              <div className="min-w-0 flex-1">{VariantAccordionForm(variantIndex)}</div>
                                              <div className="flex shrink-0 items-center gap-2 self-start pt-7">
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-500/10"
                                                  onClick={e => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setDeleteVariantDialog({ open: true, index: variantIndex });
                                                  }}
                                                  aria-label="Delete variant"
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                              </div>
                                            </AccordionPrimitive.Trigger>
                                          </AccordionPrimitive.Header>
                                          <AccordionContent>
                                            <Tabs defaultValue="general">
                                              <TabsList className="w-full justify-start mb-4 h-auto flex-wrap">
                                                <TabsTrigger value="general" className="text-xs h-7">General</TabsTrigger>
                                                <TabsTrigger value="pricing" className="text-xs h-7">Pricing</TabsTrigger>
                                                {!isNew && !variant?.measureValue?.isBase && (
                                                  <TabsTrigger value="packaging" className="text-xs h-7">Packaging</TabsTrigger>
                                                )}
                                                <TabsTrigger value="inventory" className="text-xs h-7">Inventory</TabsTrigger>
                                                <TabsTrigger value="shipping" className="text-xs h-7">Shipping</TabsTrigger>
                                              </TabsList>

                                              <TabsContent value="general">
                                                <div className="space-y-4">
                                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="space-y-1">
                                                      <label className="text-xs font-semibold">
                                                        <Translate contentKey={'items.update.isBaseMeasure'}>Is Measure Base</Translate>
                                                      </label>
                                                      <div className="flex gap-2 items-center">
                                                        <Checkbox
                                                          checked={product?.variants?.[variantIndex]?.measureValue?.isBase === true}
                                                          onCheckedChange={(checked) => handleMeasureValueChange({
                                                            isBase: checked === true
                                                          }, variantIndex)}
                                                        />
                                                      </div>
                                                    </div>
                                                    <div className="md:col-span-2 space-y-1">
                                                      <label className="text-xs font-semibold">
                                                        <Translate contentKey={'items.update.description'}>Description</Translate>
                                                      </label>
                                                      <Textarea
                                                        name="desc"
                                                        id="desc"
                                                        placeholder={translate('items.update.placeholders.itemDescription')}
                                                        value={variant.description || ''}
                                                        onChange={e =>
                                                          handleVariantFieldChange(
                                                            variantIndex,
                                                            'description',
                                                            e.target.value
                                                          )
                                                        }
                                                        className="text-xs min-h-[80px]"
                                                        rows={3}
                                                      />
                                                    </div>
                                                  </div>
                                                  <div className="space-y-2">
                                                    <label className="text-xs font-semibold">
                                                      <Translate contentKey={'items.update.image'}>Images</Translate>
                                                    </label>
                                                    <ProductImageGallery
                                                      showCard={false}
                                                      attachments={variant?.attachments}
                                                      onAttachmentsChange={atts =>
                                                        handleVariantFieldChange(variantIndex, 'attachments', atts)
                                                      }
                                                      description="Photos for this variant (menus, online, POS)."
                                                    />
                                                  </div>
                                                </div>
                                              </TabsContent>

                                              <TabsContent value="pricing">
                                                <div className="space-y-4">
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                      <label className="text-xs font-semibold">
                                                        <Translate contentKey={'items.update.salePrice'}>Sale Price</Translate>
                                                      </label>
                                                      <Input
                                                        type="number"
                                                        name="sale-price"
                                                        id="sale-price"
                                                        placeholder="Variant Sale Price"
                                                        min={0}
                                                        step="0.01"
                                                        value={variant?.salePrice ?? ''}
                                                        onChange={e => handleVariantFieldChange(variantIndex, 'salePrice', parseFloat(e.target.value) ?? null)}
                                                        className="h-8 text-xs"
                                                      />
                                                    </div>
                                                    <div className="space-y-1">
                                                      <label className="text-xs font-semibold">
                                                        <Translate contentKey={'items.update.profileGroups'}>Profile Group</Translate>
                                                      </label>
                                                      <Select
                                                        value={variant?.accountingGroups || []}
                                                        isClearable
                                                        options={profileGroupsOptions}
                                                        getOptionLabel={option => option.name}
                                                        getOptionValue={option => option.id}
                                                        onChange={profileGroup =>
                                                          handleVariantFieldChange(
                                                            variantIndex,
                                                            'accountingGroups',
                                                            profileGroup ? [profileGroup] : []
                                                          )
                                                        }
                                                        styles={customSelectStyles}
                                                      />
                                                    </div>
                                                  </div>
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                      <DiscountDropdown
                                                        discounts={variant.discounts}
                                                        handleVariantChange={handleVariantFieldChange}
                                                        variantIndex={variantIndex}
                                                      />
                                                    </div>
                                                    <div className="space-y-1">
                                                      <label className="text-xs font-semibold">
                                                        <Translate contentKey={'items.update.mixAndMatchRule'}>Mix And Match Rule</Translate>
                                                      </label>
                                                      <Select
                                                        value={variant?.mixAndMatchRule || null}
                                                        options={mixAndMatchRuleList}
                                                        getOptionLabel={option => option.name}
                                                        getOptionValue={option => option.id}
                                                        onChange={mixAndMatchRule =>
                                                          handleVariantFieldChange(variantIndex, 'mixAndMatchRule', mixAndMatchRule)
                                                        }
                                                        styles={customSelectStyles}
                                                      />
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <VariantBranchPrice
                                                      branchList={branchList}
                                                      handleBranchPriceChange={handleBranchPriceChange}
                                                      variantIndex={variantIndex}
                                                      branchVariantDetails={variant.branchVariantDetails}
                                                      itemVariantType={'RETAIL'}
                                                      handleSaveScheduledPrices={handleSaveScheduledPrices}
                                                      handleHideItemPerBranch={handleHideItemPerBranch}
                                                      variant={variant}
                                                      setItem={setProduct}
                                                    />
                                                  </div>
                                                </div>
                                              </TabsContent>

                                              {!isNew && !variant?.measureValue?.isBase && (
                                                <TabsContent value="packaging">
                                                  <div>
                                                    <VariantPackaging
                                                      product={product}
                                                      variantIndex={variantIndex}
                                                      variant={variant}
                                                      handleVariantFieldChange={handleVariantFieldChange}
                                                    />
                                                  </div>
                                                </TabsContent>
                                              )}

                                              <TabsContent value="inventory">
                                                <div>
                                                  <ItemStock
                                                    productPurchaseConfig={productPurchaseConfig}
                                                    handleVariantFieldChange={handleVariantFieldChange}
                                                    variant={variant}
                                                    variantIndex={variantIndex}
                                                    itemId={product.id}
                                                  />
                                                </div>
                                              </TabsContent>

                                              <TabsContent value="shipping">
                                                <div>
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                      <label className="text-xs font-semibold">
                                                        <Translate contentKey='items.update.shippingDimension.height'>Height</Translate>
                                                      </label>
                                                      <Input
                                                        type="number"
                                                        name="minimumStockLevel"
                                                        id="minimumStockLevel"
                                                        required
                                                        min={0}
                                                        step="0.01"
                                                        placeholder={translate('items.update.placeholders.height')}
                                                        value={product?.variants?.[variantIndex].shippingDimension?.height ?? ''}
                                                        onChange={(e) => handleShippingDimensionChange("height", parseFloat(e.target.value) ?? 0, variantIndex)}
                                                        className="h-8 text-xs"
                                                      />
                                                    </div>
                                                    <div className="space-y-1">
                                                      <label className="text-xs font-semibold">
                                                        <Translate contentKey='items.update.shippingDimension.length'>Length</Translate>
                                                      </label>
                                                      <Input
                                                        type="number"
                                                        name="quantity"
                                                        id="quantity"
                                                        required
                                                        min={0}
                                                        step="0.01"
                                                        placeholder={translate('items.update.placeholders.length')}
                                                        value={product?.variants?.[variantIndex].shippingDimension?.length ?? ''}
                                                        onChange={(e) => handleShippingDimensionChange("length", parseFloat(e.target.value) ?? 0, variantIndex)}
                                                        className="h-8 text-xs"
                                                      />
                                                    </div>
                                                    <div className="space-y-1">
                                                      <label className="text-xs font-semibold">
                                                        <Translate contentKey='items.update.shippingDimension.width'>Width</Translate>
                                                      </label>
                                                      <Input
                                                        type="number"
                                                        name="unitCost"
                                                        id="unitCost"
                                                        required
                                                        min={0}
                                                        step="0.01"
                                                        placeholder={translate('items.update.placeholders.width')}
                                                        value={product?.variants?.[variantIndex].shippingDimension?.width ?? ''}
                                                        onChange={(e) => handleShippingDimensionChange("width", parseFloat(e.target.value) ?? 0, variantIndex)}
                                                        className="h-8 text-xs"
                                                      />
                                                    </div>
                                                    <div className="space-y-1">
                                                      <label className="text-xs font-semibold">
                                                        <Translate contentKey='items.update.shippingDimension.weight'>Weight</Translate>
                                                      </label>
                                                      <Input
                                                        type="number"
                                                        name="unitCost"
                                                        id="unitCost"
                                                        required
                                                        min={0}
                                                        step="0.01"
                                                        placeholder={translate('items.update.placeholders.weight')}
                                                        value={product?.variants?.[variantIndex].shippingDimension?.weight ?? ''}
                                                        onChange={(e) => handleShippingDimensionChange("weight", parseFloat(e.target.value) ?? 0, variantIndex)}
                                                        className="h-8 text-xs"
                                                      />
                                                    </div>
                                                  </div>
                                                </div>
                                              </TabsContent>
                                            </Tabs>
                                          </AccordionContent>
                                        </AccordionItem>
                                      </Accordion>
                                      </div>
                                    </React.Fragment>
                                  ))}
                                </div>
                              </div>
                            </RetailFormSection>
                          )}

                          <RetailFormSection
                            title="Custom fields"
                            description="Extra fields configured for your company (definitions managed separately)."
                          >
                            <CustomDefinitionValuesWrapper
                              entityId={product.id}
                              entityType={CustomDefinitionEntityType.ITEM}
                            />
                          </RetailFormSection>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="visibility">
                      <Visibility
                        initialState={product.visibility}
                        title={translate('items.update.tabs.visibility.titles.variable')}
                        onStateChanged={visibility =>
                          setProduct(prev => {
                            return { ...prev, visibility };
                          })
                        }
                      />
                    </TabsContent>

                    <TabsContent value="loyalty">
                      <ItemLoyaltyTab excludedFromLoyaltyPoints={product?.excludedFromLoyaltyPoints} onFieldChange={handleFieldChange} />
                    </TabsContent>

                    <TabsContent value="ebt">
                      <EBTEligibleBranches
                        item={product}
                        setItem={setProduct}
                        branchList={branchList}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:w-1/4 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-1.5rem)] lg:overflow-y-auto space-y-4">
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="p-3 pb-2 space-y-0">
                <CardTitle className="text-base font-semibold tracking-tight text-foreground">Save & navigation</CardTitle>
                <CardDescription className="text-xs pt-1">
                  Applies all changes on this page.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    className="h-8 text-xs w-full"
                    onClick={handleBackClick}
                    type={'button'}
                    id="cancel-save"
                    data-cy="entityCreateCancelButton"
                  >
                    <Translate contentKey="entity.action.back">Back</Translate>
                  </Button>
                  <Button
                    variant="default"
                    className="h-8 text-xs w-full"
                    onClick={saveEntity}
                    id="save-entity"
                    data-cy="entityCreateSaveButton"
                    type="button"
                    disabled={updating}
                  >
                    {updating && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                    <Translate contentKey="entity.action.save">Save</Translate>
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="default"
                    className="h-8 text-xs w-full"
                    onClick={(e) => saveEntity(e, true)}
                    id="save-entity"
                    data-cy="entityCreateSaveButton"
                    type="button"
                    disabled={updating}
                  >
                    <Translate contentKey="entity.action.saveandnew">Save and create new</Translate>
                  </Button>
                  <Button
                    variant="default"
                    className="h-8 text-xs w-full"
                    onClick={(e) => saveEntity(e, false, true)}
                    id="save-entity"
                    data-cy="entityCreateSaveButton"
                    type="button"
                    disabled={updating}
                  >
                    <Translate contentKey="entity.action.saveandclone">Save and create clone</Translate>
                  </Button>
                </div>
                {showFormErrors && (
                  <div className="text-destructive text-xs font-medium">
                    Some fields are required — check highlighted inputs in the form.
                  </div>
                )}
              </CardContent>
            </Card>

            {showCatalogImagePanel ? (
              <ProductImageGallery
                attachments={product.attachments}
                onAttachmentsChange={atts => handleFieldChange('attachments', atts)}
                title={<Translate contentKey="items.update.image">Catalog images</Translate>}
                description={
                  isVariableItem
                    ? 'Shared product-level photos (menus, online, POS). Variant-specific images are set under each variant in General.'
                    : 'Main photos for this product (menus, online, POS). Add from the library or drop files in the area below.'
                }
              />
            ) : null}

            {productEntity?.id ? (
              <>
                <Separator className="opacity-60" />
                <Card className="border-border/80 shadow-sm">
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-base font-semibold tracking-tight text-foreground">Audit history</CardTitle>
                    <CardDescription className="text-xs">Read-only log of changes to this product.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <AuditLogs entityId={productEntity?.id} />
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        </div>

        {/* Alert Dialogs */}
        <AlertDialog open={deleteVariantDialog.open} onOpenChange={(open) => setDeleteVariantDialog({ open, index: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-sm">Confirmation</AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
                Are you sure you want to proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
              <AlertDialogAction className="h-8 text-xs" onClick={handleDeleteVariant}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={deleteAttributeDialog.open} onOpenChange={(open) => setDeleteAttributeDialog({ open, index: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-sm">Confirmation</AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
                Are you sure you want to proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
              <AlertDialogAction className="h-8 text-xs" onClick={handleRemoveAttribute}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={changeVariantTypeDialog.open} onOpenChange={(open) => setChangeVariantTypeDialog({ open, newType: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-sm">Confirmation</AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
                Changing the variant type will reset the variant details.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
              <AlertDialogAction className="h-8 text-xs" onClick={handleChangeVariantType}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={deleteAllVariantsDialog} onOpenChange={setDeleteAllVariantsDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-sm">Confirmation</AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
                This will delete all the variants.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
              <AlertDialogAction className="h-8 text-xs" onClick={handleDeleteAllVariants}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </form>
    </PageWrapper>
  );
};

export default ProductUpdate;
