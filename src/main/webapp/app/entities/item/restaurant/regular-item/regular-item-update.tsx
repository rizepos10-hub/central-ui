import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Card, CardBody, CardHeader, Col, FormGroup, Row, Spinner, Table } from 'reactstrap';
import { Button as PrimeButton } from 'primereact/button';
import { getSortState, translate, Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { createEntity, getEntity, reset, updateEntity } from './regular-item.reducer';
import SharedItemUpdate from "app/shared/components/item/shared-item-update";
import { IRegularItem, IRegularItemVariant } from "app/shared/model/ITEM/restaurant/regular-item.model";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import Select from "react-select";
import { Accordion, AccordionTab } from "primereact/accordion";
import { ItemVariantType } from "app/shared/model/ENUMS/item-variant-type.model";
import Visibility from 'app/shared/Visibility/Visibility';
import { TabPanel, TabView } from "primereact/tabview";
import ItemLoyaltyTab from "app/shared/components/item/item-loyalty-tab";
import { getEntities as getDiscounts } from "app/entities/discount/discount.reducer";
import { getEntities as getMixAndMatchRules } from "app/entities/mix-and-match-rule/mix-and-match-rule.reducer";
import AuditLogs from "app/shared/components/logs/audit-logs";
import Attachment from "app/shared/components/attachment/attachment";
import VariantBranchPrice from "app/shared/components/item/variant-branch-price";
import { IDiscount } from "app/shared/model/discount.model";
import { IAddon } from "app/shared/model/ADDON/addon.model";
import DiscountDropdown from "app/shared/components/item/discount-dropdown";
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { preventEnterSubmit } from "app/shared/util/form-utils";
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import CustomDefinitionValues from 'app/shared/components/custom-definition-values/custom-definition-values-update';
import { CustomDefinitionEntityType } from 'app/shared/model/CUSTOM-DEFINITION/custom-definition-value.model';
import { Dialog } from 'primereact/dialog';
import CustomDefinitionValuesWrapper from 'app/shared/components/custom-definition-values/custom-definition-values-wrapper';
import { OrderList } from 'primereact/orderlist';
import { Dropdown } from 'primereact/dropdown';
import { IAddonGroup, IAddonGroups } from 'app/shared/model/ADDON/addon-groups.model';
import { getEntities as getAddonGroups } from 'app/entities/addon-groups/addon-groups.reducer';
import { Checkbox } from 'primereact/checkbox';
import { cloneDeep } from 'lodash';
import { InputTextarea } from 'primereact/inputtextarea';
import SharedAddon from 'app/shared/components/item/addon';
import AddonImportModal from 'app/shared/components/item/addon-import-modal';

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
  const addonGroupsList = useAppSelector(state => state.addonGroups.entities);
  const mixAndMatchRuleList = useAppSelector(state => state.mixAndMatchRule.entities);
  const [selected, setSelected] = useState(null);
  const [openedAddonModal, setOpenedAddonModal] = useState(false);


  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const [regularItem, setRegularItem] = useState<IRegularItem>({});

  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const [selectedAddonGroup, setSelectedAddonGroup] = useState<IAddonGroups>();
  const [currentVariantId, setCurrentVariantId] = useState<string>();


  const handleBackClick = () => {
    const fromMenuId = new URLSearchParams(location.search).get('fromMenu');
    if (fromMenuId) {
      navigate(`/menu/${fromMenuId}/ONLINE_ORDERING/edit?page=1&sort=id,asc`);
    } else {
      navigate("/restaurant/regular");
    }
  }

  const handleFieldChange = useCallback((fieldName, value) => {
    console.log(value, 'value')
    console.log(fieldName, 'fieldName')
    setRegularItem((prevState) => ({
      ...prevState,
      [fieldName]: value,
    }));
  }, [])

  const handleVariantFieldChange = <K extends keyof IRegularItemVariant>(variantIndex, fieldName: K, value: IRegularItemVariant[K]) => {
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
          attributeValues: {},
          createdDate: new Date().toISOString(),
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

  console.log(regularItemEntity, 'regularItemEntity')
  const saveEntity = (e, createNew = false, clone = false) => {
    e.preventDefault();

    const updatedVariants = regularItem?.variants?.map((variant, index) => {
      if (index !== 0 && variant.order === 0) {
        return {
          ...variant,
          order: index
        };
      }
      return variant;
    });

    const entity = {
      ...regularItem,
      variants: updatedVariants
    };

    setSelectedAddonGroup(undefined);
    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
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

  const confirm1 = (variantIndex) => {
    confirmDialog({
      message: 'Are you sure you want to proceed?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      defaultFocus: 'accept',
      accept: () => handleDeleteVariant(variantIndex)
    });
  };

  const handleDeleteVariant = (variantIndex) => {
    setRegularItem((prev) => {
      const updatedVariants = [...prev.variants];
      updatedVariants.splice(variantIndex, 1);
      return {
        ...prev,
        variants: updatedVariants,
      };
    });
  };

  const VariantAccordionHeader = (variantIndex) => (
    <div onClick={(e) => {
      e.preventDefault();
      e.stopPropagation()
    }} className={"d-flex gap-3 ml-2"}>
      <label className={"mt-2"}><strong>{regularItem?.variants?.[variantIndex]?.name}</strong></label>
      <PrimeButton type={"button"} className={"ml-auto"} severity='danger' onClick={() => confirm1(variantIndex)}>
        <Translate contentKey={'items.update.deleteVariant'}>Delete Variant</Translate>
      </PrimeButton>
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
      // Update the regularItem's own addonGroups if no variantId is provided
      setRegularItem(prev => ({
        ...prev,
        addonGroups: groups,
      }));
    }
    setOpenedAddonModal(false);
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
      <div className='d-flex gap-2 align-items-center'>
        <Dropdown
          value={selected}
          onChange={e => setSelected(e.value)}
          options={data}
          placeholder=""
          className="w-full md:w-14rem"
          onFocus={onFocus}
          optionLabel={'name'}
          optionValue={'id'}
        />
        <Button
          disabled={!selected}
          onClick={() => {
            onChange(options?.find(g => g?.id === selected), variant, variantIndex)
            setSelected(null)
          }}
          color="primary"
          className='p-1 mr-2'
        >
          Assign
        </Button>
        <Button type="button" onClick={() => openImportAddonModal(variant.id)}>
          <Translate contentKey="items.update.importAddons">Import Addons</Translate>
        </Button>
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

  const handleCheckboxChange = (variant: IRegularItemVariant, variantIndex, addonGroupIndex: number) => {
    const updatedAddonGroups = cloneDeep([...variant.addonGroups]);
    updatedAddonGroups[addonGroupIndex].required = !updatedAddonGroups[addonGroupIndex].required;
    handleVariantFieldChange(variantIndex, 'addonGroups', updatedAddonGroups);
  };

  // const onReorder = (event, variantIndex) => {
  //   const reorderedAddons = event.value;
  //   handleVariantFieldChange(variantIndex, 'addons', reorderedAddons);
  // };

  // const handleAddonChange = (selectedAddon: IAddon, variant, variantIndex) => {
  //   const updatedAddons = [...variant.addons, selectedAddon];
  //   handleVariantFieldChange(variantIndex, 'addons', updatedAddons as IAddon[])
  // };


  // const handleRemoveAddon = (addon: string, variant, variantIndex) => {
  //   const updatedAddons = variant.addons.filter(a => a.id !== addon);

  //   handleVariantFieldChange(variantIndex, 'addons', updatedAddons as IAddon[])
  // };

  // const handleAddonOverridedPriceChange = (addonId, price, variantIndex) => {
  //   const variant: IRegularItemVariant = regularItem.variants[variantIndex];
  //   const updatedAddonPriceOverrides = [...variant.addonPriceOverrides];
  //   const index = updatedAddonPriceOverrides.findIndex(override => override.id === addonId);
  //   if (price !== null && price !== undefined && price !== '') {
  //     if (index >= 0) {
  //       // Update existing price override
  //       updatedAddonPriceOverrides[index].price = price;
  //     } else {
  //       // Add new price override
  //       updatedAddonPriceOverrides.push({ id: addonId, price });
  //     }
  //   } else {
  //     // Remove price override if price is empty or null
  //     if (index >= 0) {
  //       updatedAddonPriceOverrides.splice(index, 1);
  //     }
  //   }

  //   handleVariantFieldChange(variantIndex, 'addonPriceOverrides', updatedAddonPriceOverrides);
  // };
  const handleVariantAddonGroupFieldChange = (
    addonGroupIndex: number,
    fieldName: string,
    value: any,
    variantIndex: number
  ) => {
    console.log(value);
    const variant = regularItem.variants[variantIndex];

    const updatedAddonGroups = [...variant.addonGroups];

    const updatedItem = {
      ...updatedAddonGroups[addonGroupIndex],
      [fieldName]: value,
    };
    console.log(updatedItem);

    updatedAddonGroups[addonGroupIndex] = updatedItem;

    const updatedVariant = {
      ...variant,
      addonGroups: updatedAddonGroups,
    };

    const updatedVariants = [...regularItem.variants];

    updatedVariants[variantIndex] = updatedVariant;

    console.log(updatedVariants);

    handleFieldChange('variants', updatedVariants);
  };

  useEffect(() => {
    // Track if any variant has been changed
    let variantsChanged = false;

    // Map over each variant to potentially update its addonGroups
    const updatedVariants = regularItem.variants?.map(variant => {
      let addonGroupsChanged = false;

      // Map over each addonGroup to update the 'required' field if necessary
      const updatedAddonGroups = variant.addonGroups?.map(addonGroup => {
        const isRequired = addonGroup.minQuantity > 0;

        // Only update if 'required' has changed
        if (addonGroup.required !== isRequired) {
          addonGroupsChanged = true;
          return {
            ...addonGroup,
            required: isRequired,
          };
        }
        return addonGroup;
      });

      // If any addonGroups have changed, update the variant
      if (addonGroupsChanged) {
        variantsChanged = true;
        return {
          ...variant,
          addonGroups: updatedAddonGroups,
        };
      }
      return variant;
    });

    // Only update the 'variants' state if any variant has changed
    if (variantsChanged) {
      handleFieldChange('variants', updatedVariants);
    }
  }, [regularItem.variants]);



  const handleAddonGroupOverridedPriceChange = (addonGroupIndex: number, addonId: string, price: number | null | undefined, variantIndex: number) => {
    const variant: IRegularItemVariant = regularItem.variants[variantIndex];

    const updatedAddonGroups = [...variant.addonGroups];
    const addonGroup = updatedAddonGroups[addonGroupIndex];
    console.log(addonGroup)
    const updatedAddonPriceOverrides = [...addonGroup.addonPriceOverrides];
    console.log(updatedAddonPriceOverrides)

    const index = updatedAddonPriceOverrides?.findIndex(override => override.id === addonId);
    console.log(index)
    console.log(updatedAddonPriceOverrides[index])
    if (price !== null && price !== undefined) {
      if (index >= 0) {
        // Update existing price override
        updatedAddonPriceOverrides[index].price = price;
      } else {
        // Add new price override
        updatedAddonPriceOverrides.push({ id: addonId, price });
        console.log(updatedAddonPriceOverrides)
      }
    } else {
      // Remove price override if price is empty or null
      if (index >= 0) {
        updatedAddonPriceOverrides.splice(index, 1);
      }
    }

    const newAddonGroup = {
      ...addonGroup,
      addonPriceOverrides: updatedAddonPriceOverrides,
    };

    updatedAddonGroups[addonGroupIndex] = newAddonGroup;

    console.log(updatedAddonGroups)
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
      excluded: !e.checked
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

  console.log(regularItem?.addonGroups, 'regularItem?.addonGroups')

  if (loading) {
    return <Spinner />
  }

  return (
    <form onKeyDown={preventEnterSubmit}>
      {openedAddonModal && (
        <AddonImportModal
          showModal={openedAddonModal}
          handleSave={handleImportAddonModalSave}
          handleClose={() => setOpenedAddonModal(false)}
          variantId={currentVariantId}
        />
      )}
      <div className={'d-flex row'}>
        <Col md={9}>
          <Card className="p-0">
            <CardBody>
              <Row>
                <Col md={12}>
                  <TabView>
                    <TabPanel header={translate('items.update.tabs.details.label')}>
                      <div className="w-100">
                        <div className="text-xl font-semibold">
                          {isNew ? translate('items.update.tabs.details.titles.create.variable') : `Edit ${regularItem.name}`}
                        </div>
                      </div>

                      <Row>
                        <FormGroup className={`${isNew ? 'd-flex bg-white' : ''}`}>
                          <Col md="12" className={`d-flex flex-column p-3  bg-white `}>
                            <SharedItemUpdate item={regularItem} onFieldChange={handleFieldChange} />

                            <Col md="5" className={'d-flex gap-3'}>
                              <PrimeButton color="primary" type="button" onClick={handleAddVariant}>
                                <Translate contentKey={'items.update.addSingleVariant'}>Add Variant</Translate>
                              </PrimeButton>
                            </Col>

                            <Col md={'12'} className={'mt-2'}>
                              <Row className={'mt-2'}>
                                {regularItem?.variants?.map((variant, variantIndex) => (
                                  <div
                                    key={variantIndex}
                                    className={`mt-2 d-flex ${dragOverIndex === variantIndex && 'border-top border-primary'}`}
                                    onDragOver={e => handleDragOver(e, variantIndex)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={() => handleDrop(variantIndex)}
                                  >
                                    <div
                                      className="drag-handle"
                                      draggable
                                      onDragStart={() => setDraggedIndex(variantIndex)}
                                      style={{ cursor: 'grab', padding: '0 5px' }}
                                    >
                                      <i className="pi pi-bars"></i>
                                    </div>
                                    <Accordion multiple className="p-0 flex-1 ml-1">
                                      <i style={{ fontSize: '2.5rem' }} />
                                      <AccordionTab headerTemplate={() => VariantAccordionHeader(variantIndex)}>
                                        <Row>
                                          <Col md="4">
                                            <div className={'d-flex flex-column gap-2 mt-2'}>
                                              <label className={'font-semibold'}>
                                                <Translate contentKey={'items.update.name'}>Name</Translate>
                                              </label>
                                              <InputText
                                                name="variant-name"
                                                id="name"
                                                required={true}
                                                placeholder={translate('items.update.placeholders.variantName')}
                                                value={variant?.name || ''}
                                                onChange={e => handleVariantFieldChange(variantIndex, 'name', e.target.value)}
                                                draggable={false}
                                              />
                                            </div>
                                          </Col>

                                          <Col md="4">
                                            <div className={'d-flex flex-column gap-2 mt-2'}>
                                              <label htmlFor="price" className={'font-semibold'}>
                                                <Translate contentKey={'items.update.price'}>Price</Translate>
                                              </label>
                                              <InputNumber
                                                name="price"
                                                id="price"
                                                inputId={'price'}
                                                inputClassName={'w-1'}
                                                required={true}
                                                placeholder="Variant Price"
                                                value={variant?.price || null}
                                                size={6}
                                                min={0}
                                                maxFractionDigits={2}
                                                onChange={e => handleVariantFieldChange(variantIndex, 'price', e.value)}
                                                draggable={false}
                                              />
                                            </div>
                                          </Col>

                                          <Col md="4">
                                            <div className={'d-flex flex-column gap-2 mt-2'}>
                                              <label className={'font-semibold'}>
                                                <Translate contentKey={'items.update.salePrice'}>Sale Price</Translate>
                                              </label>
                                              <InputNumber
                                                name="sale-price"
                                                id="sale-price"
                                                placeholder="Variant Sale Price"
                                                min={0}
                                                size={6}
                                                maxFractionDigits={2}
                                                value={variant?.salePrice || null}
                                                onChange={e => handleVariantFieldChange(variantIndex, 'salePrice', e.value)}
                                                draggable={false}
                                              />
                                            </div>
                                          </Col>
                                        </Row>

                                        <Row>
                                          <Col>
                                            <div className={'d-flex flex-column gap-2 mt-2'}>
                                              <label className={'font-semibold'}>
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
                                              />
                                            </div>

                                            <div className={'d-flex flex-column gap-2 mt-2'}>
                                              <label className={'font-semibold'}>
                                                <Translate contentKey={'items.update.description'}>Description</Translate>
                                              </label>
                                              <InputTextarea
                                                name="desc"
                                                id="desc"
                                                placeholder={translate('items.update.description')}
                                                value={variant.description || ''}
                                                onChange={e =>
                                                  handleVariantFieldChange(
                                                    variantIndex,
                                                    'description',
                                                    e.target.value
                                                  )
                                                }
                                                draggable={false}
                                              />
                                            </div>

                                            <Row>
                                              <Col md={6}>
                                                <label className={'font-semibold'}>
                                                  <Translate contentKey={'items.update.addonGroups'}>Addon Groups</Translate>
                                                </label>
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
                                                          className="p-orderlist-item d-flex justify-content-between align-items-end p-0"
                                                          onClick={() => setSelectedAddonGroup(variant?.addonGroups[index])}
                                                        >
                                                          <span className='d-flex flex-column gap-1'>
                                                            <label>{addonGroup.name}</label>
                                                            <InputText
                                                              value={variant?.addonGroups[index]?.name ?? addonGroup.name}
                                                              onChange={e => handleVariantAddonGroupFieldChange(index, 'name', e.target.value, variantIndex)}
                                                              style={{ width: '120px' }}
                                                              draggable={false}
                                                              onKeyDown={(e) => {
                                                                if (e.key === ' ') {
                                                                  e.stopPropagation();
                                                                }
                                                              }}
                                                            />
                                                          </span>
                                                          <span className='d-flex gap-1'>
                                                            <span className='d-flex flex-column gap-1'>
                                                              <label>{translate('items.update.min')}</label>
                                                              <InputNumber
                                                                value={variant?.addonGroups[index]?.minQuantity}
                                                                onChange={e => {
                                                                  handleVariantAddonGroupFieldChange(index, 'minQuantity', e.value, variantIndex)
                                                                }}
                                                                inputStyle={{ width: '40px' }}
                                                                draggable={false}
                                                              />
                                                            </span>
                                                            <span className='d-flex flex-column gap-1'>
                                                              <label>{translate('items.update.max')}</label>
                                                              <InputNumber
                                                                value={variant?.addonGroups[index]?.maxQuantity}
                                                                onChange={e => handleVariantAddonGroupFieldChange(index, 'maxQuantity', e.value, variantIndex)}
                                                                inputStyle={{ width: '40px' }}
                                                                draggable={false}
                                                              />
                                                            </span>
                                                          </span>
                                                          {/* <span className='d-flex flex-column gap-1'>
                                                            <label>{translate('items.update.required')}</label>
                                                            <Checkbox
                                                              checked={variant?.addonGroups[index]?.required}
                                                              onChange={e => handleVariantAddonGroupFieldChange(index, 'required', e.checked, variantIndex)}
                                                            />
                                                          </span> */}
                                                          <span className='d-flex flex-column gap-1'>
                                                            <label>{translate('items.update.addAutomatically')}</label>
                                                            <Checkbox
                                                              checked={variant?.addonGroups[index]?.addAutomatically}
                                                              onChange={e => handleVariantAddonGroupFieldChange(index, 'addAutomatically', e.checked, variantIndex)}
                                                              draggable={false}
                                                            />
                                                          </span>
                                                          <Button color="danger" size="sm" onClick={() => handleRemoveAddonGroup(addonGroup.id, variant, variantIndex)}>
                                                            X
                                                          </Button>
                                                        </div>
                                                      )
                                                    }}
                                                    header={
                                                      reorderHeader(
                                                        addonGroupsList,
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
                                              </Col>
                                              {variant?.addonGroups.some(
                                                (group) => group.addonGroup.id === selectedAddonGroup?.addonGroup.id
                                              ) && (
                                                  <Col md={6}>
                                                    <label className={'font-semibold'}>
                                                      <Translate contentKey={'items.update.relatedAddons'}>Related Addons</Translate>
                                                    </label>
                                                    <div className='border'>
                                                      <Table>
                                                        <thead>
                                                          <tr>
                                                            <th>
                                                              <Translate contentKey={'items.update.name'}>Name</Translate>
                                                            </th>
                                                            <th>
                                                              <Translate contentKey={'items.update.price'}>Price</Translate>
                                                            </th>
                                                            <th>
                                                              <Translate contentKey={'items.update.include'}>Include</Translate>
                                                            </th>
                                                          </tr>
                                                        </thead>
                                                        <tbody>
                                                          {selectedAddonGroup?.addonGroup.addons?.map((addon, index) => (
                                                            <tr key={index}>
                                                              <td className='align-content-center'>{addon.name}</td>
                                                              <td className='align-content-center'>
                                                                <InputNumber
                                                                  value={variant.addonGroups?.find(group => group.addonGroup.id === selectedAddonGroup.addonGroup.id)?.addonPriceOverrides?.find(override => override.id === addon.id)?.price}
                                                                  onChange={e => handleAddonGroupOverridedPriceChange(
                                                                    variant?.addonGroups?.findIndex(group => group.addonGroup.id === selectedAddonGroup.addonGroup.id),
                                                                    addon.id,
                                                                    e.value,
                                                                    variantIndex
                                                                  )}
                                                                  inputStyle={{ width: '50px' }}
                                                                  mode="decimal"
                                                                  minFractionDigits={2}
                                                                  maxFractionDigits={2}
                                                                  draggable={false}
                                                                />
                                                              </td>
                                                              <td className='align-content-center'>
                                                                <Checkbox
                                                                  checked={!variant.addonGroups?.find(group => group.addonGroup.id === selectedAddonGroup.addonGroup.id)?.excluded?.map(excluded => excluded.id).includes(addon.id)}
                                                                  onChange={e => handleVariantAddonGroupExcludedChange(
                                                                    e,
                                                                    variant?.addonGroups?.findIndex(group => group.addonGroup.id === selectedAddonGroup.addonGroup.id),
                                                                    addon,
                                                                    variantIndex
                                                                  )}
                                                                  draggable={false}
                                                                />
                                                              </td>
                                                            </tr>
                                                          ))}
                                                        </tbody>
                                                      </Table>
                                                    </div>
                                                  </Col>
                                                )}
                                            </Row>

                                            <DiscountDropdown
                                              discounts={variant.discounts}
                                              handleVariantChange={handleVariantFieldChange}
                                              variantIndex={variantIndex}
                                            />

                                            <div className={'d-flex flex-column gap-2 mt-2'}>
                                              <label className={'font-semibold'}>
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
                                              />
                                            </div>
                                          </Col>
                                        </Row>

                                        <Row className={'my-3'}>
                                          <Col>
                                            <div className={'d-flex flex-column'}>
                                              <label className={'text-xl mt-2 font-bold'}>
                                                <Translate contentKey={'items.update.image'}>Image</Translate>
                                              </label>
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
                                          </Col>
                                        </Row>

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
                                      </AccordionTab>
                                    </Accordion>
                                  </div>
                                ))}
                              </Row>
                            </Col>
                          </Col>
                        </FormGroup>
                      </Row>
                      <Row>
                        <Col>
                          <CustomDefinitionValuesWrapper
                            entityId={regularItem.id}
                            entityType={CustomDefinitionEntityType.ITEM}
                          />
                        </Col>
                      </Row>
                    </TabPanel>

                    <TabPanel header={translate('items.update.tabs.addons.label')}>
                      {regularItem ? <SharedAddon onFieldChange={handleFieldChange} addons={regularItem.addons} addonGroups={regularItem.addonGroups || []} addonPriceOverrides={regularItem.addonPriceOverrides} /> : null}
                    </TabPanel>

                    <TabPanel header={translate('items.update.tabs.visibility.label')}>
                      <Visibility
                        initialState={regularItem.visibility}
                        title={translate('items.update.tabs.visibility.titles.variable')}
                        onStateChanged={visibility =>
                          setRegularItem(prev => {
                            return { ...prev, visibility };
                          })
                        }
                      />
                    </TabPanel>

                    <TabPanel header={translate('items.update.tabs.excludedFromLoyaltyPoints.label')}>
                      <ItemLoyaltyTab
                        excludedFromLoyaltyPoints={regularItem?.excludedFromLoyaltyPoints}
                        onFieldChange={handleFieldChange}
                      />
                    </TabPanel>
                  </TabView>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
        <Col
          md={3}
          style={{
            position: 'sticky',
            top: '0',
            height: '90vh',
          }}
        >
          <Card>
            <CardHeader>Actions</CardHeader>
            <Row>
              <Row>
                <Col>
                  <PrimeButton
                    className='p-1 fs-6 w-100'
                    onClick={handleBackClick}
                    type={'button'}
                    id="cancel-save"
                    data-cy="entityCreateCancelButton"
                    severity="secondary"
                  >
                    <span className="d-none d-md-inline">
                      <Translate contentKey="entity.action.back">Back</Translate>
                    </span>
                  </PrimeButton>
                </Col>
                <Col>
                  <PrimeButton className='p-1 fs-6 w-100' onClick={saveEntity} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                    <Translate contentKey="entity.action.save">Save</Translate>
                  </PrimeButton>
                </Col>
              </Row>
              <Row>
                <Col>
                  <PrimeButton className='p-1 fs-6 w-100' onClick={(e) => saveEntity(e, true)} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                    <Translate contentKey="entity.action.saveandnew">Save and create new</Translate>
                  </PrimeButton>
                </Col>
                <Col>
                  <PrimeButton className='p-1 fs-6 w-100' onClick={(e) => saveEntity(e, false, true)} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                    <Translate contentKey="entity.action.saveandclone">Save and create clone</Translate>
                  </PrimeButton>
                </Col>
              </Row>
            </Row>
          </Card>
          {regularItem?.id && <AuditLogs entityId={regularItem?.id} />}
        </Col>
      </div>
    </form>
  );
};

export default RegularItemUpdate;
