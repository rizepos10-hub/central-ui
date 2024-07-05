import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Card, CardBody, CardHeader, Col, FormGroup, Row, Spinner, Table } from 'reactstrap';
import { getSortState, translate, Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { Button as PrimeButton } from "primereact/button"

import { createEntity, getEntity, reset, updateEntity } from './product.reducer';
import SharedItemUpdate from "app/shared/components/item/shared-item-update";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { getEntities as getBranches } from "app/entities/branch/branch.reducer";
import Select from "react-select";
import { getEntities as getAttributes } from "app/entities/item/retail/attributes/retail-attribute.reducer";
import { ITaxonomy } from "app/shared/model/taxonomy.model";
import { ITerm } from "app/shared/model/term.model";
import {
  getEntities as getAttributeValues,
  reset as resetAttributeValues
} from "app/entities/item/retail/attributes/retail-attribute-values.reducer";
import { Accordion, AccordionTab } from "primereact/accordion";
import AsyncSelect from "react-select/async";
import { ItemVariantType } from "app/shared/model/ENUMS/item-variant-type.model";
import { isEqual } from "lodash";
import Visibility from 'app/shared/Visibility/Visibility';
import { TabPanel, TabView } from "primereact/tabview";
import ItemStockTab from "app/shared/components/item/item-stock-tab";
import { IExchangeMeasure } from "app/shared/model/ITEM/retail/simple-item.model";
import { getEntities as getMeasures } from "app/entities/item-measure/item-measure.reducer";
import ItemLoyaltyTab from "app/shared/components/item/item-loyalty-tab";
import WholesalePrices from "app/shared/components/item/wholsale-prices-modal";
import { getEntities as getDiscounts } from "app/entities/discount/discount.reducer";
import { getEntities as getMixAndMatchRules } from "app/entities/mix-and-match-rule/mix-and-match-rule.reducer";
import AuditLogs from "app/shared/components/logs/audit-logs";
import VariantBranchPrice from "app/shared/components/item/variant-branch-price";
import DiscountDropdown from "app/shared/components/item/discount-dropdown";
import MediaLibrary from "app/shared/components/media-library/media-library";
import { transformAttachmentStructure } from "app/shared/util/attachment-utils";
import { IProduct } from "app/shared/model/ITEM/retail/product.model";
import { IVariableItemVariant } from "app/shared/model/ITEM/retail/variable-item.model";
import { SelectButton } from "primereact/selectbutton";
import { preventEnterSubmit } from "app/shared/util/form-utils";


const defaultItemPriceNumber = {
  "PRICE_1": null,
  "PRICE_2": null,
  "PRICE_3": null,
  "PRICE_4": null,
  "PRICE_5": null,
};

const defaultSpecialPrices = {
  "WHOLE_SALE": { ...defaultItemPriceNumber },
  "RETAIL": { ...defaultItemPriceNumber }
};

const itemTypes = [
  {
    label: "RETAIL SIMPLE",
    value: ItemVariantType.RETAIL_SIMPLE,
  },
  {
    label: "RETAIL VARIABLE",
    value:   ItemVariantType.RETAIL_VARIABLE,
  }
]

export const ProductUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;
  const productEntity = useAppSelector(state => state.product.entity);
  const loading = useAppSelector(state => state.product.loading);
  const updating = useAppSelector(state => state.product.updating);
  const updateSuccess = useAppSelector(state => state.product.updateSuccess);
  const branchList = useAppSelector(state => state.branch.entities);
  const attributesList = useAppSelector(state => state.retailAttribute.entities);
  const measureList = useAppSelector(state => state.itemMeasure.entities);
  const discountList = useAppSelector(state => state.discount.entities);
  const mixAndMatchRuleList = useAppSelector(state => state.mixAndMatchRule.entities);

  const location = useLocation();


  const attributeValuesList = useAppSelector(state => state.retailAttributeValue.entities);
  const loadingAttributesValues = useAppSelector(state => state.retailAttributeValue.loading);



  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const [product, setProduct] = useState<IProduct>({
    itemType: "RETAIL",
    itemVariantType: ItemVariantType.RETAIL_SIMPLE,
    variants: []
  });
  const isVariableItem = product?.itemVariantType === ItemVariantType.RETAIL_VARIABLE;
  const isSingleItem = product?.itemVariantType === ItemVariantType.RETAIL_SIMPLE;

  const [measureToAdd, setMeasureToAdd] = useState<IExchangeMeasure>();

  const [itemAttribute, setItemAttribute] = useState<{
    attributeTax: ITaxonomy;
    attributeTerms: ITerm[];
  } | null>(null);

  const [pricesModal, setPricesModal] = useState({
    show: false,
    branchId: '',
    variantIndex: null
  });


  const filteredAvailableAttributes = () => {
    const existingAttributeIds = product?.attributes?.map(attr => attr.attributeTax.id);
    return attributesList?.filter(attr => !existingAttributeIds?.includes(attr.id));
  };

  const filteredMeasures = useMemo(() => {
    const exchangeMeasuresIds = product?.measures?.map((exMeasure) => exMeasure.itemMeasure.id);
    return measureList.filter(m => m.id !== product?.baseMeasure?.id && !exchangeMeasuresIds?.includes(m.id))
  }, [measureList?.length, product?.baseMeasure?.id, product?.measures?.length]);

  const isAttributeAddButtonDisabled =
    filteredAvailableAttributes()?.length === 0 ||
    !itemAttribute ||
    itemAttribute?.attributeTax &&
    Object.keys(itemAttribute?.attributeTax)?.length === 0 &&
    itemAttribute?.attributeTerms?.length === 0;



  const handleBackClick = () => {
    const fromMenuId = new URLSearchParams(location.search).get('fromMenu');
    if (fromMenuId) {
      navigate(`/menu/${fromMenuId}/ONLINE_ORDERING/edit?page=1&sort=id,asc`);
    } else {
      navigate("/product");
    }
  }

  const handleFieldChange = useCallback((fieldName, value) => {
    setProduct((prevState) => {
      const updatedProduct = {
        ...prevState,
        [fieldName]: value,
      };

      if (updatedProduct.itemVariantType === "RETAIL_SIMPLE" && fieldName === "name") {
        const updatedVariant = prevState.variants?.[0]
          ? { ...prevState.variants[0], name: value }
          : { name: value };

        updatedProduct.variants = [updatedVariant, ...(prevState.variants?.slice(1) ?? [])];
      }

      return updatedProduct;
    });
  }, []);

  const handleVariantFieldChange = (variantIndex, fieldName: keyof IVariableItemVariant, value) => {
    console.log("helloooo111o", value, variantIndex)
    setProduct((prev) => {
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

  const addImage = (variantIndex, files) => {
    handleVariantFieldChange(variantIndex, 'attachments', transformAttachmentStructure(files, 'toIAttachment'));
  };

  const handleBaseMeasureChange = (baseMeasure) => {
    if (!product?.measures || product?.measures?.length === 0) {
      setProduct(prev => ({ ...prev, baseMeasure }))
    } else {
      setProduct(prevState => {
        const updatedMeasures = prevState.measures.filter(exMeasure => exMeasure.itemMeasure.id !== baseMeasure.id)
          .map((exMeasure) => ({ ...exMeasure, exchangeRate: null }));
        return {
          ...prevState,
          baseMeasure,
          measures: updatedMeasures
        };
      });
    }
    setMeasureToAdd({})
  };

  const handleShowPricesModal = (branchId, variantIndex) => {
    setPricesModal(prev => ({
      ...prev,
      show: !prev.show,
      branchId,
      variantIndex
    }));
  };

  const handleSaveWholesalePrices = (prices) => {
    const { variantIndex, branchId } = pricesModal;
    setProduct((prev) => {
      const updatedVariants = prev.variants.map((variant, index) => {
        console.log(variantIndex, 'variantsds')
        if (index !== variantIndex) return variant;

        const updatedBranchVariantDetails = {
          ...variant.branchVariantDetails,
          [branchId]: {
            ...variant.branchVariantDetails?.[branchId],
            wholesalePrices: prices,
          },
        };

        return {
          ...variant,
          branchVariantDetails: updatedBranchVariantDetails,
        };
      });

      return {
        ...prev,
        variants: updatedVariants,
      };
    });
  };


  const handleAddMeasure = () => {
    setProduct((prevState) => ({
      ...prevState,
      measures: [measureToAdd, ...(prevState.measures || [])]
    }));
    setMeasureToAdd({})
  };

  const handleMeasuresChange = (measureIndex, newRate) => {
    setProduct((prevState) => {
      const updatedMeasures = prevState.measures.map((exMeasure, index) => {
        if (measureIndex === index) {
          return { ...exMeasure, exchangeRate: newRate };
        }
        return exMeasure;
      });

      return {
        ...prevState,
        measures: updatedMeasures
      };
    });
  };

  const handleRemoveMeasure = (measureIndex) => {
    setProduct((prevState) => {
      const updatedMeasures = prevState.measures.filter((_, index) => index !== measureIndex);
      return {
        ...prevState,
        measures: updatedMeasures
      };
    });
  };

  const handleBranchPriceChange = (variantIndex, branchId, priceType, price) => {
    setProduct((prev) => {
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
  };

  // const handleHideItemPerBranchSimple = (branchId) => {
  //   setProduct((prev) => {
  //     const updatedVariants = [...prev.variants];
  //     updatedVariants[0] = {
  //       ...(prev.variants && prev.variants[0] ? prev.variants[0] : {}),
  //       branchVariantDetails: {
  //         ...(prev.variants[0]?.branchVariantDetails || {}),
  //         [branchId]: {
  //           ...(prev.variants?.[0]?.branchVariantDetails?.[branchId]),
  //           hideItem: !prev?.variants?.[0]?.branchVariantDetails?.[branchId]?.hideItem,
  //         },
  //       },
  //     };
  //     console.log(prev)
  //     console.log(updatedVariants)
  //     return {
  //       ...prev,
  //       variants: updatedVariants,
  //     };
  //   });
  // }

  const handleHideItemPerBranch = (branchId, variantIndex, field: 'hideItem' | 'hideOnline') => {
    setProduct((prev) => {
      const updatedVariants = [...prev.variants];
      updatedVariants[variantIndex] = {
        ...(prev.variants && prev.variants[variantIndex] ? prev.variants[variantIndex] : {}),
        branchVariantDetails: {
          ...(prev.variants[variantIndex]?.branchVariantDetails || {}),
          [branchId]: {
            ...(prev.variants?.[variantIndex]?.branchVariantDetails?.[branchId]),
            [field]: !prev?.variants?.[variantIndex]?.branchVariantDetails?.[branchId]?.[field],
          },
        },
      };
      return {
        ...prev,
        variants: updatedVariants,
      };
    });
  }


  const handleAddAttribute = () => {

    setProduct((prev) => ({
      ...prev,
      attributes: [
        ...(prev.attributes || []),
        itemAttribute,
      ],
    }));
    setItemAttribute(null)
  };

  const handleItemAttributeSelect = (selectedOption) => {
    if (!selectedOption) {
      setItemAttribute(null);
      return
    }

    dispatch(getAttributeValues({
      id: selectedOption?.id,
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));
    setItemAttribute((prevState) => ({ ...prevState, attributeTax: selectedOption }))
  };

  const handleAttributeTermChange = (index, selectedTerms) => {
    setProduct((prev) => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) =>
        i === index
          ? {
            ...attr,
            attributeTerms: selectedTerms,
          }
          : attr
      ),
    }));
  };

  const generateCombinations = () => {
    const combinations = [];

    const generate = (index, currentCombination) => {
      if (index === product?.attributes?.length) {
        const newVariant = {
          name: product?.name || '',
          attachments: [],
          discounts: [],
          sku: '',
          price: null,
          salePrice: null,
          branchVariantDetails: {},
          attributeValues: { ...currentCombination },
          specialPrices: { ...defaultSpecialPrices }
        };

        const isDuplicate = product?.variants.some((variant) => {
          return isEqual(variant.attributeValues, newVariant.attributeValues)
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
    console.log(combinations, 'combinationscombinations')
    setProduct((prevState) => ({
      ...prevState,
      variants: [...prevState.variants, ...combinations],
    }));
    return combinations;
  };

  const handleAddVariant = () => {
    setProduct((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          name: product?.name,
          attachments: [],
          discounts: [],
          sku: '',
          price: null,
          salePrice: null,
          branchVariantDetails: {},
          attributeValues: {},
          specialPrices: { ...defaultSpecialPrices }
        },
      ],
    }));
  };




  console.log(product, 'product')

  const handleNavigate = (productId) => {
    navigate(`/product/${productId}/edit` + location.search);
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

    dispatch(getAttributes({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    dispatch(getMeasures({
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

    if (!isNew) {
      setProduct(productEntity);
    }
    const productId = productEntity?.id
    if (updateSuccess) {
      handleNavigate(productId);
    }

  }, [productEntity, updateSuccess]);


  const saveEntity = e => {
    e.preventDefault();
    const entity = {
      ...product,
    };
    console.table(entity)
    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  const loadOptions = (attributeId) => {

    dispatch(resetAttributeValues())
    dispatch(getAttributeValues({
      id: attributeId,
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    })).then(response => console.log(response, 'responseresponse'))
  };

  const handleHeaderChange = (variantIndex, attributeId, selectedOption) => {
    setProduct((prev) => {
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


  const handleDeleteVariant = (variantIndex) => {
    const isConfirmed = window.confirm(translate('items.update.deleteVariantMessage'));
    if (isConfirmed) {
      setProduct((prev) => {
        const updatedVariants = [...prev.variants];
        updatedVariants.splice(variantIndex, 1);
        return {
          ...prev,
          variants: updatedVariants,
        };
      });
    }
  };
  const handleRemoveAttribute = (attributeIndex) => {
    const isConfirmed = window.confirm("Are you sure?");
    if (isConfirmed) {
      setProduct((prev) => {
        const updateAttributes = [...prev.attributes];
        updateAttributes.splice(attributeIndex, 1);
        return {
          ...prev,
          attributes: updateAttributes,
        };
      });
    }
  };

  const AttributeAccordionHeader = (attributeIndex) => (
    <div onClick={(e) => {
      e.preventDefault();
      e.stopPropagation()
    }} className={"d-flex gap-3 ml-2 w-full"}>
      <label className={"mt-2"}><strong>{product?.attributes?.[attributeIndex]?.attributeTax?.name}</strong></label>

      <PrimeButton type="button" className={"ml-auto"} color="danger" onClick={() => handleRemoveAttribute(attributeIndex)}>
        <Translate contentKey={'items.update.removeAttribute'}>Remove Attribute</Translate>
      </PrimeButton>
    </div>
  )


  const VariantAccordionHeader = (variantIndex) => (
    <div onClick={(e) => {
      e.preventDefault();
      e.stopPropagation()
    }} className={"d-flex gap-3 ml-2"}>
      <label className={"mt-2"}><strong>{product?.variants?.[variantIndex]?.name}</strong></label>
      {product?.attributes?.map((attribute, index) => {
        return (
          <AsyncSelect
            key={index}
            value={product?.variants?.[variantIndex]?.attributeValues?.[attribute?.attributeTax?.id]}
            getOptionLabel={option => option.name}
            getOptionValue={option => option.id}
            isLoading={loadingAttributesValues}
            onFocus={() => loadOptions(attribute?.attributeTax?.id)}
            defaultOptions={attribute?.attributeTerms}
            onChange={(selectedOption) => handleHeaderChange(variantIndex, attribute?.attributeTax?.id, selectedOption)}
          />
        )
      })}
      <Button type="button" className={"ml-auto"} color="danger" onClick={() => handleDeleteVariant(variantIndex)}>
        <Translate contentKey={'items.update.deleteVariant'}>Delete Variant</Translate>
      </Button>
    </div>
  )




  if (loading) {
    return <Spinner />
  }



  return (
    <form onSubmit={saveEntity} onKeyDown={preventEnterSubmit}>
      <div className={'d-flex row'}>
        <Col md={9}>
          <Card>
            <CardBody>
              <Row>
                <div>
                  <TabView>
                    <TabPanel header={translate('items.update.tabs.details.label')}>
                      <div className="w-100">
                        <div className="text-xl font-semibold">
                          {isNew ? translate('items.update.tabs.details.titles.create.variable') : <span>Edit {product.name}</span>}
                        </div>
                      </div>

                      <Row>
                        <FormGroup className={`${isNew ? 'd-flex bg-white' : ''}`}>
                          <div className={`d-flex flex-column p-1 bg-white w-100`}>
                            {isSingleItem && (
                              <div className={'d-flex flex-column gap-2'}>
                                <label className={'font-semibold'}>
                                  <Translate contentKey={'items.update.sku'}>SKU</Translate>
                                </label>
                                <InputText
                                  name="sku"
                                  id="sku"
                                  required={true}
                                  placeholder={translate('items.update.placeholders.itemSku')}
                                  value={product?.variants?.[0]?.sku}
                                  onChange={e => handleVariantFieldChange(0, 'sku', e.target.value)}
                                />
                              </div>
                            )}
                            <SharedItemUpdate item={product} onFieldChange={handleFieldChange} />

                            <div className={'d-flex flex-column gap-2 mb-3'}>
                              <label className={'font-semibold'}>
                                <Translate contentKey={'items.update.itemType'}>Item Type</Translate>
                              </label>
                              <SelectButton
                                type="button"
                                value={product?.itemVariantType}
                                options={itemTypes}
                                allowEmpty={false}
                                optionValue={"value"}
                                optionLabel={"label"}
                                onChange={option => {
                                  handleFieldChange('itemVariantType', option.value);
                                }}
                              />
                            </div>
                            {/*
                             Showing the fields based on if the item is variable or single here.
                             */}
                            <Row className={'mb-3'}>
                              {isVariableItem && (
                                <Row>
                                  <label htmlFor="price" className={'font-semibold'}>
                                    <Translate contentKey={'items.update.variants'}>Variants</Translate>
                                  </label>
                                  <Col md="5" className={'d-flex gap-3'}>
                                    <Button type="button" color="primary" className={'mt-5'} onClick={generateCombinations}>
                                      <Translate contentKey={'items.update.generateVariants'}>Generate Variants</Translate>
                                    </Button>

                                    <Button color="primary" type={'button'} className={'mt-5'} onClick={handleAddVariant}>
                                      <Translate contentKey={'items.update.addSingleVariant'}>Add Single Variant</Translate>
                                    </Button>
                                  </Col>
                                  <Col md={'12'} className={'mt-2'}>
                                    <Row className={'mt-2'}>
                                      {pricesModal?.show && pricesModal?.variantIndex !== null && (
                                        <WholesalePrices
                                          toggle={handleShowPricesModal}
                                          isOpen={pricesModal?.show}
                                          branchWholesalePrices={
                                            product?.variants?.[pricesModal?.variantIndex]?.branchVariantDetails?.[pricesModal?.branchId]
                                              ?.wholesalePrices
                                          }
                                          savePrices={handleSaveWholesalePrices}
                                        />
                                      )}
                                      {product?.variants?.map((variant, variantIndex) => (
                                        <Col md={'12'} key={variantIndex} className={'mt-2'}>
                                          <Accordion multiple>
                                            <AccordionTab headerTemplate={() => VariantAccordionHeader(variantIndex)} key={variantIndex}>
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
                                                      value={variant?.name}
                                                      onChange={e => handleVariantFieldChange(variantIndex, 'name', e.target.value)}
                                                    />
                                                  </div>
                                                </Col>

                                                <Col md="4">
                                                  <div className={'d-flex flex-column gap-2 mt-2'}>
                                                    <label className={'font-semibold'}>
                                                      <Translate contentKey={'items.update.sku'}>SKU</Translate>
                                                    </label>
                                                    <InputText
                                                      name="sku"
                                                      id="sku"
                                                      required={true}
                                                      placeholder="Variant Sku"
                                                      value={variant?.sku}
                                                      onChange={e => handleVariantFieldChange(variantIndex, 'sku', e.target.value)}
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
                                                      value={variant?.price}
                                                      min={0}
                                                      maxFractionDigits={2}
                                                      onChange={e => handleVariantFieldChange(variantIndex, 'price', e.value)}
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
                                                      maxFractionDigits={2}
                                                      value={variant?.salePrice}
                                                      onChange={e => handleVariantFieldChange(variantIndex, 'salePrice', e.value)}
                                                    />
                                                  </div>
                                                </Col>
                                              </Row>

                                              <Row>
                                                <Col md="7">
                                                  <div className={'d-flex flex-column '}>
                                                    <label className={'font-semibold'}>
                                                      <Translate contentKey={'items.update.image'}>Image</Translate>
                                                    </label>
                                                    <MediaLibrary
                                                      handleFilesSelectCallback={files => addImage(variantIndex, files)}
                                                      defaultValues={transformAttachmentStructure(
                                                        variant?.attachments,
                                                        'toFileLibraryListItem'
                                                      )}
                                                    />
                                                  </div>
                                                </Col>
                                              </Row>

                                              <Row>
                                                <Col md="7">
                                                  <DiscountDropdown
                                                    discounts={variant.discounts}
                                                    handleVariantChange={handleVariantFieldChange}
                                                    variantIndex={variantIndex}
                                                  />

                                                  <div className={'d-flex flex-column gap-2'}>
                                                    <label className={'font-semibold'}>
                                                      <Translate contentKey={'items.update.mixAndMatchRule'}>Mix And Match Rule</Translate>
                                                    </label>
                                                    <Select
                                                      value={variant?.mixAndMatchRule}
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

                                              <VariantBranchPrice
                                                branchList={branchList}
                                                handleBranchPriceChange={handleBranchPriceChange}
                                                variantIndex={variantIndex}
                                                branchVariantDetails={variant.branchVariantDetails}
                                                itemVariantType={'RETAIL'}
                                                handleHideItemPerBranch={handleHideItemPerBranch}
                                              />
                                            </AccordionTab>
                                          </Accordion>
                                        </Col>
                                      ))}
                                    </Row>
                                  </Col>
                                </Row>
                              )}

                              {isSingleItem && (
                                <Row>
                                  <Col md="6">
                                    <div className={'d-flex flex-column gap-2'}>
                                      <label className={'font-semibold'}>
                                        <Translate contentKey={'items.update.price'}>Price</Translate>
                                      </label>
                                      <InputNumber
                                        name="price"
                                        id="price"
                                        required={true}
                                        min={0}
                                        maxFractionDigits={2}
                                        inputClassName={'w-1'}
                                        placeholder={translate('items.update.placeholders.itemPrice')}
                                        value={product?.variants?.[0]?.price}
                                        onChange={e => handleVariantFieldChange(0, 'price', e.value)}
                                      />
                                    </div>
                                  </Col>

                                  <Col md="6">
                                    <div className={'d-flex flex-column gap-2'}>
                                      <label className={'font-semibold'}>
                                        <Translate contentKey={'items.update.salePrice'}>Sale Price</Translate>
                                      </label>
                                      <InputNumber
                                        name="sale-price"
                                        id="sale-price"
                                        min={0}
                                        maxFractionDigits={2}
                                        placeholder={translate('items.update.placeholders.itemSalePrice')}
                                        value={product?.variants?.[0]?.salePrice}
                                        onChange={e => handleVariantFieldChange(0, 'salePrice', e.value)}
                                      />
                                    </div>
                                  </Col>

                                  <VariantBranchPrice
                                    itemVariantType={'RETAIL'}
                                    branchVariantDetails={product?.variants?.[0]?.branchVariantDetails}
                                    variantIndex={0}
                                    branchList={branchList}
                                    handleBranchPriceChange={handleBranchPriceChange}
                                    handleSaveWholesalePrices={handleSaveWholesalePrices}
                                    handleHideItemPerBranch={handleHideItemPerBranch}
                                  />

                                  <Row>
                                    <Col md="7">
                                      <DiscountDropdown
                                        discounts={product?.variants?.[0]?.discounts}
                                        variantIndex={0}
                                        handleVariantChange={handleVariantFieldChange}
                                      />

                                      <div className={'d-flex flex-column gap-2 mt-2'}>
                                        <label className={'font-semibold'}>
                                          <Translate contentKey={'items.update.mixAndMatchRule'}>Mix And Match Rule</Translate>
                                        </label>
                                        <Select
                                          value={product?.variants?.[0]?.mixAndMatchRule}
                                          options={mixAndMatchRuleList}
                                          getOptionLabel={option => option.name}
                                          getOptionValue={option => option.id}
                                          onChange={mixAndMatchRule => handleVariantFieldChange(0, 'mixAndMatchRule', mixAndMatchRule)}
                                        />
                                      </div>
                                    </Col>
                                  </Row>
                                </Row>
                              )}

                              <Row>
                                <Col md="4">
                                  <div className={'d-flex flex-column gap-2'}>
                                    <label className={'font-semibold'}>
                                      <Translate contentKey={'items.update.selectAttribute'}>Select Attribute</Translate>
                                    </label>
                                    <Select
                                      value={itemAttribute?.attributeTax || null}
                                      options={filteredAvailableAttributes()}
                                      isClearable
                                      getOptionValue={option => option.id}
                                      getOptionLabel={option => option.name}
                                      onChange={attribute => handleItemAttributeSelect(attribute)}
                                    />
                                  </div>
                                </Col>

                                <Col md="3">
                                  <PrimeButton
                                    color="primary"
                                    type="button"
                                    disabled={isAttributeAddButtonDisabled}
                                    className={'mt-5'}
                                    onClick={handleAddAttribute}
                                  >
                                    <Translate contentKey={'items.update.addAttribute'}>Add Attribute</Translate>
                                  </PrimeButton>
                                </Col>

                                <Col md={'12'} className={'mt-2'}>
                                  <Accordion multiple>
                                    {product?.attributes?.map((attribute, index) => (
                                      <AccordionTab key={index} headerTemplate={() => AttributeAccordionHeader(index)}>
                                        <div className={'d-flex gap-3'}>
                                          <label className={'mt-2'}>
                                            {translate('items.update.name')}: {attribute?.attributeTax?.name}
                                          </label>
                                          <Col md={'9'}>
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
                                          </Col>
                                        </div>
                                      </AccordionTab>
                                    ))}
                                  </Accordion>
                                </Col>
                              </Row>
                            </Row>
                          </div>
                        </FormGroup>
                      </Row>
                    </TabPanel>

                    <TabPanel header={translate('items.update.tabs.visibility.label')}>
                      <Visibility
                        initialState={product.visibility}
                        title={translate('items.update.tabs.visibility.titles.variable')}
                        onStateChanged={visibility =>
                          setProduct(prev => {
                            return { ...prev, visibility };
                          })
                        }
                      />
                    </TabPanel>
                    <TabPanel header={translate('items.update.tabs.excludedFromLoyaltyPoints.label')}>
                      <ItemLoyaltyTab excludedFromLoyaltyPoints={product?.excludedFromLoyaltyPoints} onFieldChange={handleFieldChange} />
                    </TabPanel>
                    <TabPanel header={translate('items.update.tabs.stock.label')} disabled={isNew}>
                      <ItemStockTab variants={product?.variants} itemId={product.id} />
                    </TabPanel>
                    <TabPanel header={translate('items.update.measures')}>
                      <Row className={'mb-3 d-flex flex-column gap-3'}>
                        <Col md="12" className={'d-flex gap-3 mb-3'}>
                          <div className={'d-flex flex-column gap-2 w-6 mt-3'}>
                            <label className={'font-semibold'}>
                              <Translate contentKey={'items.update.baseMeasure'}>Select Measure</Translate>
                            </label>
                            <Select
                              value={product?.baseMeasure}
                              options={measureList}
                              name="baseMeasure"
                              getOptionValue={option => option.id}
                              getOptionLabel={option => option.name}
                              onChange={handleBaseMeasureChange}
                            />
                          </div>

                          <Table>
                            <thead>
                              <tr>
                                <th>Measure</th>
                                <th className="w-1">Exchange Rate</th>
                              </tr>
                            </thead>
                            <thead>
                              <tr>
                                <td>
                                  <Select
                                    value={measureToAdd?.itemMeasure || null}
                                    isDisabled={!product?.baseMeasure}
                                    options={filteredMeasures}
                                    getOptionValue={option => option.id}
                                    getOptionLabel={option => option.name}
                                    onChange={itemMeasure => setMeasureToAdd(prev => ({ ...prev, itemMeasure }))}
                                  />
                                </td>
                                <td>
                                  <InputNumber
                                    value={measureToAdd?.exchangeRate}
                                    disabled={!measureToAdd?.itemMeasure}
                                    onChange={e => setMeasureToAdd(prev => ({ ...prev, exchangeRate: e.value }))}
                                  />
                                </td>
                                <td>
                                  <Button
                                    type="button"
                                    disabled={!measureToAdd?.exchangeRate}
                                    onClick={handleAddMeasure}
                                    color="primary"
                                    className={'mb-2'}
                                  >
                                    Add
                                  </Button>
                                </td>
                              </tr>
                            </thead>
                          </Table>
                        </Col>

                        <Col md="8">
                          <Table>
                            <thead>
                              <tr>
                                <th>
                                  <Translate contentKey={'items.update.measure'}>Measure</Translate>
                                </th>
                                <th>
                                  <Translate contentKey={'items.update.exchangeRate'}>Exchange Rate</Translate>
                                </th>
                                <th>Remove</th>
                              </tr>
                            </thead>
                            <tbody>
                              {product?.measures?.map((exMeasure, index) => (
                                <tr key={index}>
                                  <td>{exMeasure?.itemMeasure?.name}</td>
                                  <td>
                                    <InputNumber
                                      value={exMeasure?.exchangeRate}
                                      required
                                      onChange={e => handleMeasuresChange(index, e.value)}
                                    />
                                  </td>
                                  <td>
                                    <PrimeButton type={'button'} onClick={() => handleRemoveMeasure(index)} severity={'danger'}>
                                      <Translate contentKey={'items.update.remove'}>Remove</Translate>
                                    </PrimeButton>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </Col>
                      </Row>
                    </TabPanel>
                  </TabView>
                </div>
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
            <div className={'d-flex gap-3 mt-2'}>
              <PrimeButton type="button" onClick={handleBackClick} id="cancel-save" data-cy="entityCreateCancelButton" severity="secondary">
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;
                <span className="d-none d-md-inline">
                  <Translate contentKey="entity.action.back">Back</Translate>
                </span>
              </PrimeButton>
              &nbsp;
              <PrimeButton color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;
                <Translate contentKey="entity.action.save">Save</Translate>
              </PrimeButton>
            </div>
          </Card>
          {productEntity?.id && <AuditLogs entityId={productEntity?.id} />}
        </Col>
      </div>
    </form>
  );
};

export default ProductUpdate;
