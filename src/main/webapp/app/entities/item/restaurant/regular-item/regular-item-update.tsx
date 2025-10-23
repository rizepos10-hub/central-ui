import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getSortState, translate, Translate } from 'react-jhipster';
import { toast } from 'react-toastify';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { createEntity, getEntity, reset, updateEntity } from './regular-item.reducer';
import SharedItemUpdate from "app/shared/components/item/shared-item-update";
import { IRegularItem, IRegularItemVariant } from "app/shared/model/ITEM/restaurant/regular-item.model";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import Select from 'app/shared/components/select/select';
import { ItemVariantType } from "app/shared/model/ENUMS/item-variant-type.model";
import Visibility from 'app/shared/Visibility/Visibility';
import ItemLoyaltyTab from "app/shared/components/item/item-loyalty-tab";
import { getEntities as getDiscounts } from "app/entities/discount/discount.reducer";
import { getEntities as getMixAndMatchRules } from "app/entities/mix-and-match-rule/mix-and-match-rule.reducer";
import AuditLogs from "app/shared/components/logs/audit-logs";
import VariantBranchPrice from "app/shared/components/item/variant-branch-price";
import { IDiscount } from "app/shared/model/discount.model";
import { IAddon } from "app/shared/model/ADDON/addon.model";
import DiscountDropdown from "app/shared/components/item/discount-dropdown";
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { preventEnterSubmit } from "app/shared/util/form-utils";
import CustomDefinitionValuesWrapper from 'app/shared/components/custom-definition-values/custom-definition-values-wrapper';
import { CustomDefinitionEntityType } from 'app/shared/model/CUSTOM-DEFINITION/custom-definition-value.model';
import { OrderList } from 'primereact/orderlist';
import { IAddonGroup, IAddonGroups } from 'app/shared/model/ADDON/addon-groups.model';
import { getEntities as getAddonGroups } from 'app/entities/addon-groups/addon-groups.reducer';
import { cloneDeep } from 'lodash';
import SharedAddon from 'app/shared/components/item/addon';
import AddonImportModal from 'app/shared/components/item/addon-import-modal';
import SeoTags from 'app/shared/components/item/seo-tags';
import EBTEligibleBranches from 'app/shared/components/item/ebt-eligible-branches';
import IngredientsPicker from 'app/shared/ingredients-picker';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, GripVertical, Save, PlusCircle, ArrowLeft, Loader2, FileDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const RegularItemUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;
  const regularItemEntity = useAppSelector(state => state.regularItem.entity);
  const loading = useAppSelector(state => state.regularItem.loading);
  const updating = useAppSelector(state => state.regularItem.updating);
  const updateSuccess = useAppSelector(state => state.regularItem.updateSuccess);
  const branchList = useAppSelector(state => state.branch.entities);
  const profileGroupsOptions = useAppSelector(state => state.profileGroup.entities);

  const discountList = useAppSelector(state => state.discount.entities);
  const addonList = useAppSelector(state => state.addon.entities);
  const addonGroupsList: IAddonGroup[] = useAppSelector(state => state.addonGroups.entities);
  const mixAndMatchRuleList = useAppSelector(state => state.mixAndMatchRule.entities);
  const [selected, setSelected] = useState(null);
  const [openedAddonModal, setOpenedAddonModal] = useState(false);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const [regularItem, setRegularItem] = useState<IRegularItem>({});
  const [defaultPrice, setDefaultPrice] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [selectedAddonGroup, setSelectedAddonGroup] = useState<IAddonGroups>();
  const [currentVariantId, setCurrentVariantId] = useState<string>();
  const [variantEdited, setVariantEdited] = useState<Record<number, { name?: boolean; price?: boolean }>>({});
  const [showFormErrors, setShowFormErrors] = useState(false);
  const [showDeleteVariantDialog, setShowDeleteVariantDialog] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState<number | null>(null);

  const handleBackClick = () => {
    const fromMenuId = new URLSearchParams(location.search).get('fromMenu');
    if (fromMenuId) {
      navigate(`/menu/${fromMenuId}/ONLINE_ORDERING/edit?page=1&sort=id,asc`);
    } else {
      navigate("/restaurant/regular");
    }
  }

  const handleFieldChange = useCallback((fieldName, value) => {
    setRegularItem((prevState) => ({
      ...prevState,
      [fieldName]: value,
    }));
  }, [])

  const handleVariantFieldChange = <K extends keyof IRegularItemVariant>(variantIndex, fieldName: K, value: IRegularItemVariant[K]) => {
    if (fieldName === 'name' || fieldName === 'price') {
      setVariantEdited(prev => ({
        ...prev,
        [variantIndex]: {
          ...prev[variantIndex],
          [fieldName]: true,
        },
      }));
    }
    setRegularItem((prev) => {
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

  const handleBranchPriceChange = useCallback((variantIndex, branchId, priceType, price) => {
    setRegularItem((prev) => {
      const updatedVariants = [...prev.variants];
      updatedVariants[variantIndex] = {
        ...(prev.variants && prev.variants[variantIndex] ? prev.variants[variantIndex] : {}),
        branchVariantDetails: {
          ...(prev.variants[variantIndex]?.branchVariantDetails || {}),
          [branchId]: {
            ...(prev.variants?.[variantIndex]?.branchVariantDetails?.[branchId]),
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
  }, []);

  const handleAddVariant = () => {
    setRegularItem((prev) => ({
      ...prev,
      variants: [
        ...(prev.variants || []),
        {
          name: regularItem?.name,
          accountingGroups: prev?.accountingGroups || [],
          attachments: [],
          addons: [],
          addonGroups: [],
          discounts: [],
          sku: '',
          price: null,
          salePrice: null,
          branchVariantDetails: {},
          pricingPointBranchPrices: [],
          id: Math.random().toString(36).substring(2, 15) + Date.now().toString(36).substring(8),
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

    const reorderedVariants = Array.from(regularItem.variants);
    const [reorderedVariant] = reorderedVariants.splice(draggedIndex, 1);
    reorderedVariants.splice(droppedIndex, 0, reorderedVariant);

    const updatedVariants = reorderedVariants?.map((variant, index) => {
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

    setRegularItem(prev => ({
      ...prev,
      variants: updatedVariants
    }));

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleNavigate = (RegularItemId) => {
    navigate(`/restaurant/regular/${RegularItemId}/edit` + location.search);
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
    setRegularItem({
      ...regularItemEntity,
    });
  }, [regularItemEntity]);

  const saveEntity = (e, createNew = false, clone = false) => {
    e.preventDefault();

    if (!validateEntity()) {
      setShowFormErrors(true);
      return;
    } else {
      setShowFormErrors(false);
    }

    const updatedVariants = regularItem?.variants?.map((variant, index) => {
      if (index !== 0 && variant.order === 0) {
        return {
          ...variant,
          order: index
        };
      }
      return {
        ...variant,
        ingredients: variant.ingredients?.map(ingredient => ({
          ...ingredient,
          item: {
            id: ingredient.item.id,
            itemVariantType: ingredient.item.itemVariantType,
          }
        }))
      };
    });

    const entity = {
      ...regularItem,
      variants: updatedVariants
    };

    setSelectedAddonGroup(undefined);
    if (isNew) {
      const { id, ...entityWithoutId } = entity;
      entityWithoutId.variants = entityWithoutId?.variants.map(({ id, ...variantWithoutId }) => ({
        ...variantWithoutId,
      }));

      dispatch(createEntity(entityWithoutId)).then((res) => {
        if (createNew) {
          reset()
          setRegularItem({
            itemType: "RESTAURANT",
            itemVariantType: ItemVariantType.RESTAURANT_VARIABLE,
            variants: []
          })
        } else {
          const payload = res?.payload as any;
          const newProductId = payload?.data?.id;

          if (clone) {
            dispatch(createEntity(entityWithoutId)).then(res => {
              const payload = res?.payload as any;
              const newProductId = payload?.data?.id;

              // @ts-expect-error -- unknown type
              if (!res?.error) {
                navigate(`/restaurant/regular/${newProductId}/edit`)
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
              navigate(`/restaurant/regular/${newProductId}/edit`)
            }
          });
        }
        if (createNew) {
          navigate(`/restaurant/regular/new`)
        }
      })
    }
  };

  const confirmDeleteVariant = (variantIndex) => {
    setVariantToDelete(variantIndex);
    setShowDeleteVariantDialog(true);
  };

  const handleDeleteVariant = () => {
    if (variantToDelete !== null) {
      setRegularItem((prev) => {
        const updatedVariants = [...prev.variants];
        updatedVariants.splice(variantToDelete, 1);
        return {
          ...prev,
          variants: updatedVariants,
        };
      });
      setShowDeleteVariantDialog(false);
      setVariantToDelete(null);
    }
  };

  const VariantAccordionHeader = (variantIndex) => (
    <div
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className="flex flex-1 gap-3 ml-2"
    >
      <div className="grid grid-cols-2 gap-2 w-full">
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold">
            <Translate contentKey="items.update.name">Name</Translate>
          </Label>
          <Input
            name="variant-name"
            required
            placeholder={translate('items.update.placeholders.variantName')}
            value={regularItem.variants[variantIndex]?.name || ''}
            onChange={e => handleVariantFieldChange(variantIndex, 'name', e.target.value)}
            className={`h-8 text-xs ${showFormErrors && !regularItem.variants[variantIndex]?.name ? 'border-destructive' : ''}`}
            onKeyDown={e => {
              if (e.key === ' ') {
                e.stopPropagation();
              }
            }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="price" className="text-xs font-semibold">
            <Translate contentKey="items.update.price">Price</Translate>
          </Label>
          <Input
            type="number"
            name="price"
            required
            placeholder="Variant Price"
            value={regularItem.variants[variantIndex]?.price ?? ''}
            min={0}
            step={0.01}
            onChange={e => handleVariantFieldChange(variantIndex, 'price', parseFloat(e.target.value) || null)}
            className={`h-8 text-xs ${showFormErrors && (regularItem.variants[variantIndex]?.price === null || regularItem.variants[variantIndex]?.price === undefined) ? 'border-destructive' : ''}`}
            onKeyDown={e => {
              if (e.key === ' ') {
                e.stopPropagation();
              }
            }}
          />
        </div>
      </div>
      <div className="flex justify-end items-start">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          onClick={() => confirmDeleteVariant(variantIndex)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const openImportAddonModal = (variantId?: string) => {
    setCurrentVariantId(variantId);
    setOpenedAddonModal(true);
  };

  const handleImportAddonModalSave = (groups: IAddonGroups[], variantId?: string) => {
    if (variantId) {
      const variantIndex = regularItem.variants.findIndex(variant => variant.id === variantId);
      if (variantIndex >= 0) {
        handleVariantFieldChange(variantIndex, 'addonGroups', groups);
      }
    } else {
      setRegularItem(prev => ({
        ...prev,
        addonGroups: groups,
      }));
    }
    setOpenedAddonModal(false);
  };

  const updateSeoTags = (fieldName, value) => {
    setRegularItem(prevRegularItem => ({
      ...prevRegularItem,
      seo: {
        ...prevRegularItem.seo,
        [fieldName]: value
      }
    }));
  };

  const reorderHeader = (
    data: {
      id: string;
      name: string;
    }[],
    onChange: any,
    value: any,
    options,
    onFocus,
    variant,
    variantIndex
  ) => {
    return (
      <div className='flex gap-2 items-center flex-wrap'>
        <Select
          value={selected ? data.find(item => item.id === selected) : null}
          onChange={selectedOption => setSelected(selectedOption?.id || null)}
          options={data}
          placeholder="Select addon group..."
          onFocus={onFocus}
          getOptionLabel={option => option.name}
          getOptionValue={option => option.id}
          isClearable
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              disabled={!selected}
              onClick={() => {
                onChange(options?.find(g => g?.id === selected), variant, variantIndex)
                setSelected(null)
              }}
              size="sm"
              className='h-7 w-7 p-0'
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Assign selected group</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" size="sm" className="h-7 w-7 p-0" onClick={() => openImportAddonModal(variant.id)}>
              <FileDown className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Import addon groups</p>
          </TooltipContent>
        </Tooltip>
      </div>
    )
  }

  const onReorderAddonGroups = (event, variantIndex) => {
    const variant = regularItem.variants[variantIndex];
    const reorderedAddonGroups = event.value?.map(group => {
      const existingGroup = variant.addonGroups?.find(g => g.addonGroup.id === group.id);
      return existingGroup ? existingGroup : { addonGroup: group };
    });
    handleVariantFieldChange(variantIndex, 'addonGroups', reorderedAddonGroups);
  };

  const handleRemoveAddonGroup = (addonGroup: string, variant: IRegularItemVariant, variantIndex) => {
    const updatedAddonGroups = variant.addonGroups.filter(a => a.addonGroup.id !== addonGroup);
    handleVariantFieldChange(variantIndex, 'addonGroups', updatedAddonGroups)
    setSelectedAddonGroup(undefined);
  };

  const handleAddonGroupChange = (selectedAddonGroup: IAddonGroup, variant: IRegularItemVariant, variantIndex) => {
    const newGroup: IAddonGroups = {
      required: false,
      addonGroup: selectedAddonGroup,
      minQuantity: null,
      maxQuantity: null,
      addAutomatically: false,
      addonPriceOverrides: [],
      excluded: [],
      name: null
    }

    const updatedAddonGroups = [...variant.addonGroups, newGroup];
    handleVariantFieldChange(variantIndex, 'addonGroups', updatedAddonGroups)
  };

  const handleVariantAddonGroupFieldChange = (
    addonGroupIndex: number,
    fieldName: string,
    value: any,
    variantIndex: number
  ) => {
    const variant = regularItem.variants[variantIndex];
    const updatedAddonGroups = [...variant.addonGroups];

    const updatedItem = {
      ...updatedAddonGroups[addonGroupIndex],
      [fieldName]: value,
    };

    updatedAddonGroups[addonGroupIndex] = updatedItem;

    const updatedVariant = {
      ...variant,
      addonGroups: updatedAddonGroups,
    };

    const updatedVariants = [...regularItem.variants];
    updatedVariants[variantIndex] = updatedVariant;

    handleFieldChange('variants', updatedVariants);
  };

  useEffect(() => {
    let variantsChanged = false;

    const updatedVariants = regularItem.variants?.map(variant => {
      let addonGroupsChanged = false;

      const updatedAddonGroups = variant.addonGroups?.map(addonGroup => {
        const isRequired = addonGroup.minQuantity > 0;

        if (addonGroup.required !== isRequired) {
          addonGroupsChanged = true;
          return {
            ...addonGroup,
            required: isRequired,
          };
        }
        return addonGroup;
      });

      if (addonGroupsChanged) {
        variantsChanged = true;
        return {
          ...variant,
          addonGroups: updatedAddonGroups,
        };
      }
      return variant;
    });

    if (variantsChanged) {
      handleFieldChange('variants', updatedVariants);
    }
  }, [regularItem.variants]);

  const handleAddonGroupOverridedPriceChange = (
    addonGroupIndex: number,
    addonId: string,
    price: number | null | undefined,
    variantIndex: number
  ) => {
    const variant: IRegularItemVariant = regularItem.variants[variantIndex];

    const updatedAddonGroups = [...variant.addonGroups];
    const addonGroup = updatedAddonGroups[addonGroupIndex];

    const updatedAddonPriceOverrides = [...addonGroup.addonPriceOverrides];
    const index = updatedAddonPriceOverrides.findIndex(override => override.id === addonId);

    if (price !== null && price !== undefined) {
      if (index >= 0) {
        updatedAddonPriceOverrides[index] = {
          ...updatedAddonPriceOverrides[index],
          price,
        };
      } else {
        updatedAddonPriceOverrides.push({ id: addonId, price });
      }
    } else {
      if (index >= 0) {
        updatedAddonPriceOverrides.splice(index, 1);
      }
    }

    const newAddonGroup = {
      ...addonGroup,
      addonPriceOverrides: updatedAddonPriceOverrides,
    };

    updatedAddonGroups[addonGroupIndex] = newAddonGroup;

    handleVariantFieldChange(variantIndex, 'addonGroups', updatedAddonGroups);
  };

  const handleVariantAddonGroupExcludedChange = (
    e,
    addonGroupIndex: number,
    value: IAddon,
    variantIndex: number
  ) => {
    const variant: IRegularItemVariant = regularItem.variants[variantIndex];
    const updatedAddonGroups = [...variant.addonGroups];

    const updatedItem: IAddonGroups = {
      ...updatedAddonGroups[addonGroupIndex],
      excluded: !e
        ? [...updatedAddonGroups[addonGroupIndex].excluded, value]
        : updatedAddonGroups[addonGroupIndex].excluded.filter(
          item => item.id !== value.id
        ),
    };

    updatedAddonGroups[addonGroupIndex] = updatedItem;
    handleVariantFieldChange(variantIndex, 'addonGroups', updatedAddonGroups);
  };

  const handleHideItemPerBranch = (branchId, variantIndex, field: 'hideItem' | 'hideOnline') => {
    setRegularItem(prev => {
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

  useEffect(() => {
    if (!isNew) return;

    setRegularItem(prev => {
      const variants = prev.variants ? [...prev.variants] : [];

      if (variants.length === 0) {
        variants.push({
          name: prev.name,
          price: defaultPrice,
          salePrice: null,
          branchVariantDetails: {},
          pricingPointBranchPrices: [],
          id: Math.random().toString(36).substring(2, 15) + Date.now().toString(36).substring(8),
          accountingGroups: [],
          attachments: [],
          addons: [],
          addonGroups: [],
          discounts: [],
        });
      } else {
        const first = variants[0];
        const updatedFirst = { ...first };
        if (!variantEdited[0]?.name) {
          updatedFirst.name = prev.name;
        }
        if (!variantEdited[0]?.price) {
          updatedFirst.price = defaultPrice;
        }
        variants[0] = updatedFirst;
      }

      return { ...prev, variants };
    });
  }, [regularItem.name, defaultPrice]);

  const validateEntity = (): boolean => {
    if (!regularItem.name || regularItem.name.trim() === '') {
      toast.error('Item name is required');
      return false;
    }

    if (!regularItem.variants || regularItem.variants.length === 0) {
      toast.error('At least one variant is required');
      return false;
    }

    for (let i = 0; i < regularItem.variants.length; i++) {
      const variant = regularItem.variants[i];
      if (!variant.name || variant.name.trim() === '') {
        toast.error(`Variant ${i + 1} name is required`);
        return false;
      }
      if (variant.price === null || variant.price === undefined) {
        toast.error(`Variant ${i + 1} price is required`);
        return false;
      }
    }

    return true;
  };

  useEffect(() => {
    const allVariantsValid = regularItem?.name &&
      regularItem?.variants?.length > 0 &&
      regularItem.variants.every(v => v?.name && v.name.trim() !== '' && v.price !== null && v.price !== undefined);
  }, [regularItem]);

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
        {openedAddonModal && (
          <AddonImportModal
            showModal={openedAddonModal}
            handleSave={handleImportAddonModalSave}
            handleClose={() => setOpenedAddonModal(false)}
            variantId={currentVariantId}
          />
        )}
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
                      {isNew ? translate('items.update.tabs.details.titles.create.variable') : `Edit ${regularItem.name}`}
                    </div>

                    <div className="bg-white p-3 space-y-4">
                      <SharedItemUpdate
                        item={regularItem}
                        onFieldChange={handleFieldChange}
                        defaultPrice={defaultPrice}
                        setDefaultPrice={setDefaultPrice}
                        showFormErrors={showFormErrors}
                      />

                      <div>
                        <Button type="button" size="sm" className="h-8 text-xs" onClick={handleAddVariant}>
                          <Plus className="h-4 w-4 mr-2" />
                          <Translate contentKey={'items.update.addSingleVariant'}>Add Variant</Translate>
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {regularItem?.variants?.map((variant, variantIndex) => (
                          <div
                            key={variantIndex}
                            className={`${dragOverIndex === variantIndex && 'border-t-2 border-primary'}`}
                            onDragOver={e => handleDragOver(e, variantIndex)}
                            onDragLeave={handleDragLeave}
                            onDrop={() => handleDrop(variantIndex)}
                          >
                            <div className="flex gap-1">
                              <div
                                className="cursor-grab p-2"
                                draggable
                                onDragStart={() => setDraggedIndex(variantIndex)}
                              >
                                <GripVertical className="h-4 w-4" />
                              </div>
                              <Accordion type="single" collapsible className="flex-1">
                                <AccordionItem value={`variant-${variantIndex}`}>
                                  <AccordionTrigger className="hover:no-underline">
                                    {VariantAccordionHeader(variantIndex)}
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <Tabs defaultValue="general">
                                      <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
                                        <TabsTrigger value="pricing" className="text-xs">Pricing</TabsTrigger>
                                        <TabsTrigger value="addons" className="text-xs">Addons</TabsTrigger>
                                      </TabsList>

                                      <TabsContent value="general" className="space-y-4">
                                        <div className="grid grid-cols-3 gap-4">
                                          <div className="space-y-2">
                                            <Label className="text-xs font-semibold">
                                              <Translate contentKey={'items.update.name'}>Name</Translate>
                                            </Label>
                                            <Input
                                              name="variant-name"
                                              required
                                              placeholder={translate('items.update.placeholders.variantName')}
                                              value={variant?.name || ''}
                                              onChange={e => handleVariantFieldChange(variantIndex, 'name', e.target.value)}
                                              className={`h-8 text-xs ${showFormErrors && !variant?.name ? 'border-destructive' : ''}`}
                                            />
                                          </div>

                                          <div className="space-y-2">
                                            <Label htmlFor="price" className="text-xs font-semibold">
                                              <Translate contentKey={'items.update.price'}>Price</Translate>
                                            </Label>
                                            <Input
                                              type="number"
                                              name="price"
                                              required
                                              placeholder="Variant Price"
                                              value={variant?.price ?? ''}
                                              min={0}
                                              step={0.01}
                                              onChange={e => handleVariantFieldChange(variantIndex, 'price', parseFloat(e.target.value) || null)}
                                              className={`h-8 text-xs ${showFormErrors && (variant?.price === null || variant?.price === undefined) ? 'border-destructive' : ''}`}
                                            />
                                          </div>

                                          <div className="space-y-2">
                                            <Label className="text-xs font-semibold">
                                              <Translate contentKey={'items.update.salePrice'}>Sale Price</Translate>
                                            </Label>
                                            <Input
                                              type="number"
                                              name="sale-price"
                                              placeholder="Variant Sale Price"
                                              min={0}
                                              step={0.01}
                                              value={variant?.salePrice || ''}
                                              onChange={e => handleVariantFieldChange(variantIndex, 'salePrice', parseFloat(e.target.value) || null)}
                                              className="h-8 text-xs"
                                            />
                                          </div>
                                        </div>

                                        <div className="space-y-2">
                                          <Label className="text-xs font-semibold">
                                            <Translate contentKey={'items.update.description'}>Description</Translate>
                                          </Label>
                                          <Textarea
                                            name="desc"
                                            placeholder={translate('items.update.description')}
                                            value={variant.description || ''}
                                            onChange={e =>
                                              handleVariantFieldChange(
                                                variantIndex,
                                                'description',
                                                e.target.value
                                              )
                                            }
                                            className="text-xs"
                                          />
                                        </div>

                                        <div>
                                          <IngredientsPicker
                                            ingredients={variant.ingredients || []}
                                            onChange={newIngredients => {
                                              handleVariantFieldChange(variantIndex, 'ingredients', newIngredients)
                                            }}
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <Label className="text-xl font-bold">
                                            <Translate contentKey={'items.update.image'}>Image</Translate>
                                          </Label>
                                          <MediaLibrary
                                            handleFilesSelectCallback={files =>
                                              handleVariantFieldChange(
                                                variantIndex,
                                                'attachments',
                                                transformAttachmentStructure(files, 'toIAttachment')
                                              )
                                            }
                                            defaultValues={transformAttachmentStructure(variant?.attachments, 'toFileLibraryListItem')}
                                          />
                                        </div>
                                      </TabsContent>

                                      <TabsContent value="pricing" className="space-y-4">
                                        <div className="grid grid-cols-3 gap-4">
                                          <div className="space-y-2">
                                            <Label className="text-xs font-semibold">
                                              <Translate contentKey={'items.update.profileGroups'}>Profile Group</Translate>
                                            </Label>
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
                                            />
                                          </div>

                                          <div>
                                            <DiscountDropdown
                                              discounts={variant.discounts}
                                              handleVariantChange={handleVariantFieldChange}
                                              variantIndex={variantIndex}
                                            />
                                          </div>

                                          <div className="space-y-2">
                                            <Label className="text-xs font-semibold">
                                              <Translate contentKey={'items.update.mixAndMatchRule'}>Mix And Match Rule</Translate>
                                            </Label>
                                            <Select
                                              isClearable
                                              value={variant?.mixAndMatchRule || null}
                                              options={mixAndMatchRuleList}
                                              getOptionLabel={option => option.name}
                                              getOptionValue={option => option.id}
                                              onChange={mixAndMatchRule =>
                                                handleVariantFieldChange(variantIndex, 'mixAndMatchRule', mixAndMatchRule)
                                              }
                                            />
                                          </div>
                                        </div>

                                        <div>
                                          <VariantBranchPrice
                                            branchList={branchList}
                                            handleBranchPriceChange={handleBranchPriceChange}
                                            variantIndex={variantIndex}
                                            branchVariantDetails={variant.branchVariantDetails}
                                            itemVariantType={'RESTAURANT'}
                                            handleHideItemPerBranch={handleHideItemPerBranch}
                                            variant={variant}
                                            setItem={setRegularItem}
                                          />
                                        </div>
                                      </TabsContent>

                                      <TabsContent value="addons" className="space-y-4">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
                                          <div className="min-w-0">
                                            <Label className="text-xs font-semibold">
                                              <Translate contentKey={'items.update.addonGroups'}>Addon Groups</Translate>
                                            </Label>
                                            <div>
                                              <OrderList
                                                value={variant?.addonGroups?.map(group => group.addonGroup) || []}
                                                onChange={e => onReorderAddonGroups(e, variantIndex)}
                                                style={{ padding: '0px' }}
                                                listStyle={{ padding: '0px' }}
                                                itemTemplate={(addonGroup: IAddonGroup) => {
                                                  const index = variant?.addonGroups?.findIndex(group => group.addonGroup.id === addonGroup.id);

                                                  return (
                                                    <div
                                                      className="p-orderlist-item flex flex-wrap gap-2 items-end p-2"
                                                      onClick={() => setSelectedAddonGroup(variant?.addonGroups[index])}
                                                    >
                                                      <div className='flex flex-col gap-1 min-w-[140px] flex-1'>
                                                        <Label className="text-xs font-medium">{addonGroup.name}</Label>
                                                        <Input
                                                          value={variant?.addonGroups[index]?.name ?? addonGroup.name}
                                                          onChange={e => handleVariantAddonGroupFieldChange(index, 'name', e.target.value, variantIndex)}
                                                          className="h-8 text-xs min-w-[80px]"
                                                          placeholder="Display name"
                                                          onKeyDown={(e) => {
                                                            if (e.key === ' ') {
                                                              e.stopPropagation();
                                                            }
                                                          }}
                                                        />
                                                      </div>
                                                      <div className='flex gap-2'>
                                                        <div className='flex flex-col gap-1'>
                                                          <Label className="text-xs font-medium">{translate('items.update.min')}</Label>
                                                          <Input
                                                            type="number"
                                                            value={variant?.addonGroups[index]?.minQuantity ?? ''}
                                                            onChange={e => {
                                                              handleVariantAddonGroupFieldChange(index, 'minQuantity', parseInt(e.target.value) || null, variantIndex)
                                                            }}
                                                            min={0}
                                                            className="w-20 min-w-20 h-8 text-xs"
                                                          />
                                                        </div>
                                                        <div className='flex flex-col gap-1'>
                                                          <Label className="text-xs font-medium">{translate('items.update.max')}</Label>
                                                          <Input
                                                            type="number"
                                                            value={variant?.addonGroups[index]?.maxQuantity ?? ''}
                                                            onChange={e => handleVariantAddonGroupFieldChange(index, 'maxQuantity', parseInt(e.target.value) || null, variantIndex)}
                                                            min={0}
                                                            className="w-20 min-w-20 h-8 text-xs"
                                                          />
                                                        </div>
                                                      </div>
                                                      <div className='flex flex-col gap-1 items-center'>
                                                        <Label className="text-xs font-medium whitespace-nowrap">{translate('items.update.addAutomatically')}</Label>
                                                        <Checkbox
                                                          checked={variant?.addonGroups[index]?.addAutomatically}
                                                          onCheckedChange={checked => handleVariantAddonGroupFieldChange(index, 'addAutomatically', checked, variantIndex)}
                                                          className="mt-1"
                                                        />
                                                      </div>
                                                      <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        className="h-8 w-8 text-xs shrink-0"
                                                        onClick={() => handleRemoveAddonGroup(addonGroup.id, variant, variantIndex)}
                                                      >
                                                        X
                                                      </Button>
                                                    </div>
                                                  )
                                                }}
                                                header={
                                                  reorderHeader(
                                                    addonGroupsList
                                                      .map(addonGroup => ({
                                                        id: addonGroup.id,
                                                        name: addonGroup.name
                                                      })),
                                                    handleAddonGroupChange,
                                                    variant.addonGroups || [],
                                                    addonGroupsList,
                                                    () => { },
                                                    variant,
                                                    variantIndex
                                                  )
                                                }
                                                dragdrop
                                                dataKey="id"
                                              />
                                            </div>
                                          </div>

                                          {variant?.addonGroups.some(
                                            (group) => group.addonGroup.id === selectedAddonGroup?.addonGroup.id
                                          ) && (
                                              <div className="min-w-0 overflow-auto">
                                                <Label className="text-xs font-semibold flex flex-wrap justify-between gap-2">
                                                  <span>
                                                    <Translate contentKey={'items.update.relatedAddons'}>Related Addons</Translate>
                                                  </span>
                                                  <span className='flex flex-col gap-2'>
                                                    <div className='flex gap-2 items-center text-xs font-normal'>
                                                      <div className='h-3 w-3 bg-destructive' />
                                                      <div>Price Modified</div>
                                                    </div>
                                                    <div className='flex gap-2 items-center text-xs font-normal'>
                                                      <div className='h-3 w-3 bg-black' />
                                                      <div>Default Price</div>
                                                    </div>
                                                  </span>
                                                </Label>
                                                <div className='border rounded mt-2'>
                                                  <Table>
                                                    <TableHeader>
                                                      <TableRow>
                                                        <TableHead className="text-xs">
                                                          <Translate contentKey={'items.update.name'}>Name</Translate>
                                                        </TableHead>
                                                        <TableHead className="text-xs">
                                                          <Translate contentKey={'items.update.price'}>Price</Translate>
                                                        </TableHead>
                                                        <TableHead className="text-xs">
                                                          <Translate contentKey={'items.update.include'}>Include</Translate>
                                                        </TableHead>
                                                      </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                      {selectedAddonGroup?.addonGroup.addons?.map((addon, index) => (
                                                        <TableRow key={index}>
                                                          <TableCell className='text-xs'>{addon.name}</TableCell>
                                                          <TableCell className='text-xs'>
                                                            <Input
                                                              type="number"
                                                              value={
                                                                (() => {
                                                                  const priceOverride = variant.addonGroups?.find(group => group.addonGroup.id === selectedAddonGroup.addonGroup.id)?.addonPriceOverrides?.find(override => override.id === addon.id)?.price;
                                                                  return priceOverride !== null && priceOverride !== undefined ? priceOverride : addon.price;
                                                                })()
                                                              }
                                                              onChange={e => handleAddonGroupOverridedPriceChange(
                                                                variant?.addonGroups?.findIndex(group => group.addonGroup.id === selectedAddonGroup.addonGroup.id),
                                                                addon.id,
                                                                parseFloat(e.target.value) || null,
                                                                variantIndex
                                                              )}
                                                              className={`w-[80px] h-7 text-xs ${selectedAddonGroup.addonPriceOverrides?.find(override => override.id === addon.id)?.price !== null && selectedAddonGroup.addonPriceOverrides?.find(override => override.id === addon.id)?.price !== undefined ? 'text-destructive' : ''}`}
                                                              step={0.01}
                                                            />
                                                          </TableCell>
                                                          <TableCell className='text-xs'>
                                                            <Checkbox
                                                              checked={!variant.addonGroups?.find(group => group.addonGroup.id === selectedAddonGroup.addonGroup.id)?.excluded?.map(excluded => excluded.id).includes(addon.id)}
                                                              onCheckedChange={checked => handleVariantAddonGroupExcludedChange(
                                                                checked,
                                                                variant?.addonGroups?.findIndex(group => group.addonGroup.id === selectedAddonGroup.addonGroup.id),
                                                                addon,
                                                                variantIndex
                                                              )}
                                                            />
                                                          </TableCell>
                                                        </TableRow>
                                                      ))}
                                                    </TableBody>
                                                  </Table>
                                                </div>
                                              </div>
                                            )}
                                        </div>
                                      </TabsContent>
                                    </Tabs>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <CustomDefinitionValuesWrapper
                        entityId={regularItem.id}
                        entityType={CustomDefinitionEntityType.ITEM}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="addons" className="mt-4">
                    {regularItem ? <SharedAddon onFieldChange={handleFieldChange} addons={regularItem.addons} addonGroups={regularItem.addonGroups || []} item={regularItem} /> : null}
                  </TabsContent>

                  <TabsContent value="visibility" className="mt-4">
                    <Visibility
                      initialState={regularItem.visibility}
                      title={translate('items.update.tabs.visibility.titles.variable')}
                      onStateChanged={visibility =>
                        setRegularItem(prev => {
                          return { ...prev, visibility };
                        })
                      }
                    />
                  </TabsContent>

                  <TabsContent value="loyalty" className="mt-4">
                    <ItemLoyaltyTab
                      excludedFromLoyaltyPoints={regularItem?.excludedFromLoyaltyPoints}
                      onFieldChange={handleFieldChange}
                    />
                  </TabsContent>

                  <TabsContent value="seo" className="mt-4">
                    <SeoTags
                      field={regularItem?.seo}
                      onFieldChange={updateSeoTags}
                    />
                  </TabsContent>

                  <TabsContent value="ebt" className="mt-4">
                    <EBTEligibleBranches
                      item={regularItem}
                      setItem={setRegularItem}
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
                    className='text-xs h-8 w-full'
                    onClick={handleBackClick}
                    type={'button'}
                    variant="secondary"
                  >
                    <ArrowLeft className="h-3 w-3 mr-2" />
                    <Translate contentKey="entity.action.back">Back</Translate>
                  </Button>

                  <Button
                    className='text-xs h-8 w-full'
                    onClick={saveEntity}
                    type="button"
                    disabled={updating}
                  >
                    {updating ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Save className="h-3 w-3 mr-2" />}
                    <Translate contentKey="entity.action.save">Save</Translate>
                  </Button>

                  <Button
                    className='text-xs h-8 w-full'
                    onClick={(e) => saveEntity(e, true)}
                    type="button"
                    disabled={updating}
                  >
                    <PlusCircle className="h-3 w-3 mr-2" />
                    <Translate contentKey="entity.action.saveandnew">Save and create new</Translate>
                  </Button>

                  <Button
                    className='text-xs h-8 w-full'
                    onClick={(e) => saveEntity(e, false, true)}
                    type="button"
                    disabled={updating}
                  >
                    <PlusCircle className="h-3 w-3 mr-2" />
                    <Translate contentKey="entity.action.saveandclone">Save and create clone</Translate>
                  </Button>
                </CardContent>
              </Card>

              {regularItem?.id && <AuditLogs entityId={regularItem?.id} />}
            </div>
          </div>
        </div>

        <AlertDialog open={showDeleteVariantDialog} onOpenChange={setShowDeleteVariantDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base">Delete Variant</AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
                Are you sure you want to delete this variant? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteVariant} className="h-8 text-xs bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </form>
    </PageWrapper>
  );
};

export default RegularItemUpdate;
