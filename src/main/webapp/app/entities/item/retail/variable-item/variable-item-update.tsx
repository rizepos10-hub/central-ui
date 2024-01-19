import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import {Button, Row, Col, Spinner, FormGroup, Table, FormText} from 'reactstrap';
import {getSortState, translate, Translate, ValidatedField} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import {Button as PrimeButton} from "primereact/button"

import { getEntity, updateEntity, createEntity, reset } from './variable-item.reducer';
import SharedItemUpdate from "app/shared/layout/item/shared-item-update";
import {IVariableItem} from "app/shared/model/variable-item.model";
import {Steps} from "primereact/steps";
import {MenuItem} from "primereact/menuitem";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import {InputNumber} from "primereact/inputnumber";
import {InputText} from "primereact/inputtext";
import {getEntities as getBranches} from "app/entities/branch/branch.reducer";
import {CascadeSelect} from "primereact/cascadeselect";
import Select from "react-select";
import {getEntities as getAttributes} from "app/entities/item/retail/attributes/retail-attribute.reducer";
import {ITaxonomy} from "app/shared/model/taxonomy.model";
import {ITerm} from "app/shared/model/term.model";
import {getEntities as getAttributeValues, reset as resetAttributeValues} from "app/entities/item/retail/attributes/retail-attribute-values.reducer";
import {AccordionTab, Accordion} from "primereact/accordion";
import AsyncSelect from "react-select/async";
import {ItemVariantType} from "app/shared/model/enumerations/item-variant-type.model";
import variableRetailItem from "app/entities/item/retail/variable-item/variable-item.reducer";
import {isEqual} from "lodash";




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
  const location = useLocation();


  const attributeValuesList = useAppSelector(state => state.retailAttributeValue.entities);
  const loadingAttributesValues = useAppSelector(state => state.retailAttributeValue.loading);

  console.log(attributeValuesList, 'attributeValuesListattributeValuesList')


  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );


  const [variableItem, setVariableItem] = useState<IVariableItem>({
    itemType: "RETAIL",
    itemVariantType: ItemVariantType.RETAIL_VARIABLE,
    variants: []
  });

  const filteredAvailableAttributes = () => {

    const existingAttributeIds = variableItem?.attributes?.map(attr => attr.attributeTax.id);

    return attributesList?.filter(attr => !existingAttributeIds?.includes(attr.id));
  };

  const [itemAttribute, setItemAttribute] = useState<{
    attributeTax: ITaxonomy;
    attributeTerms: ITerm[];
  } | null>(null)


  const handleBackClick = () => {
    const fromMenuId = new URLSearchParams(location.search).get('fromMenu');
    if (fromMenuId) {
      navigate(`/menu/${fromMenuId}/ONLINE_ORDERING/edit?page=1&sort=id,asc`);
    } else {
      navigate("/retail/variable");
    }
  }

  const handleFieldChange = useCallback((fieldName, value) => {
    setVariableItem((prevState) => ({
      ...prevState,
      [fieldName]: value,
    }));
  }, [])

  const handleVariantFieldChange = (variantIndex, fieldName, value) => {
    setVariableItem((prev) => {
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

  const handleBranchPriceChange = (variantIndex, branchId, price) => {
    setVariableItem((prev) => {
      const updatedVariants = [...prev.variants];
      updatedVariants[variantIndex] = {
        ...(prev.variants && prev.variants[variantIndex] ? prev.variants[variantIndex] : {}),
        branchVariantDetails: {
          ...(prev.variants[variantIndex]?.branchVariantDetails || {}),
          [branchId]: {
            branch: branchList.find((branch) => branch.id === branchId),
            price: price,
            salePrice: prev.variants[variantIndex]?.branchVariantDetails?.[branchId]?.salePrice || 0,
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

    if(!itemAttribute){
      alert("Please select an attribute to add.");
      return;
    }
    console.log(itemAttribute, 'itemAttribute')
    setVariableItem((prev) => ({
      ...prev,
      attributes: [
        ...(prev.attributes || []),
        itemAttribute,
      ],
    }));
    setItemAttribute(null)
  };

  const handleItemAttributeSelect = (selectedOption) => {
    dispatch(getAttributeValues({
      id: selectedOption?.id,
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));
    setItemAttribute((prevState) => ({...prevState, attributeTax: selectedOption}))

  }

  const handleAttributeTermChange = (index, selectedTerms) => {
    setVariableItem((prev) => ({
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
        };


        const isDuplicate = variableItem?.variants.some((variant) =>{

            console.log(variant.attributeValues, 'variant.attributeValues')
            console.log( newVariant.attributeValues, 'variant.attributeValues123')
            return isEqual(variant.attributeValues, newVariant.attributeValues)
        }
        );

        if (!isDuplicate) {
          combinations.push(newVariant);
        }

        return;
      }

      const attribute = variableItem?.attributes[index];
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
    setVariableItem((prevState) => ({
      ...prevState,
      variants: [...prevState.variants, ...combinations],
    }));
    return combinations;
  };

  const handleAddVariant = () => {
    setVariableItem((prev) => ({
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
        },
      ],
    }));
  };




  console.log(variableItem, 'variableItem')

  const handleNavigate = (variableItemId) => {
    navigate(`/retail/variable/${variableItemId}/edit` + location.search);
  };

  useEffect(() => {
    if(isNew){
      dispatch(reset())
    }else{
      dispatch(getEntity(id));
    }

    dispatch(getBranches({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }))
    dispatch(getAttributes({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }))


  },[id, isNew]);

  useEffect(() => {

    if(!isNew){
      setVariableItem(variableItemEntity);
    }
    const variableItemId = variableItemEntity?.id
    if(updateSuccess){
      handleNavigate(variableItemId);
    }

  }, [variableItemEntity, updateSuccess]);


  const saveEntity = e => {
    e.preventDefault();
    const entity = {
      ...variableItem,
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
    setVariableItem((prev) => {
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
    const isConfirmed = window.confirm("Are you sure?");
    if(isConfirmed){
      setVariableItem((prev) => {
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
    if(isConfirmed){
      setVariableItem((prev) => {
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
      <label className={"mt-2"}><strong>{variableItem?.attributes?.[attributeIndex]?.attributeTax?.name}</strong></label>

      <Button className={"ml-auto"} color="danger" onClick={() => handleRemoveAttribute(attributeIndex)}>
        Remove Attribute
      </Button>
    </div>
  )


  const VariantAccordionHeader = (variantIndex) => (
    <div onClick={(e) => {
      e.preventDefault();
      e.stopPropagation()
    }} className={"d-flex gap-3 ml-2"}>
      <label className={"mt-2"}><strong>{variableItem?.variants?.[variantIndex]?.name}</strong></label>


      {variableItem?.attributes?.map((attribute, index) => {
        return (
          <AsyncSelect
            key={index}
            value={variableItem?.variants?.[variantIndex]?.attributeValues?.[attribute?.attributeTax?.id]}
            getOptionLabel={option => option.name}
            getOptionValue={option => option.id}
            isLoading={loadingAttributesValues}
            onFocus={() => loadOptions(attribute?.attributeTax?.id)}
            defaultOptions={attribute?.attributeTerms}
            onChange={(selectedOption) => handleHeaderChange(variantIndex, attribute?.attributeTax?.id, selectedOption)}
          />
        )
      })}
      <Button className={"ml-auto"} color="danger" onClick={() => handleDeleteVariant(variantIndex)}>
        Delete Variant
      </Button>
    </div>
  )




  if(loading){
    return <Spinner />
  }

  console.log(variableItem, 'variableItemvariableItem')


  return (
    <div>
      <Row>
        <Col md="8">
          <h2>
            {isNew ? "Create New Variable Item" : `Edit Variable Item`}
          </h2>
        </Col>
      </Row>

      <Row>
        <form onSubmit={saveEntity}>
          <FormGroup  className={`${isNew ? "d-flex justify-content-center bg-white mt-3" : ""}`}>

            <Col md="8" className={`d-flex flex-column p-3  bg-white mt-3 `} >

              <SharedItemUpdate item={variableItem} onFieldChange={handleFieldChange}/>

              <Row className={"mb-3"} >

                <Row>
                  <Col md="4">
                    <div className={"d-flex flex-column gap-2"}>
                      <label className={"text-xl font-bold"}>
                        Select Attribute
                      </label>
                      <Select
                        value={itemAttribute?.attributeTax || null}
                        options={filteredAvailableAttributes()}
                        getOptionValue={option => option.id}
                        getOptionLabel={option => option.name}
                        onChange={(attribute) => handleItemAttributeSelect(attribute)}
                      />
                    </div>
                  </Col>


                  <Col md="3" >
                    <Button color="primary" disabled={filteredAvailableAttributes().length === 0} className={"mt-5"} onClick={handleAddAttribute}>
                      Add Attribute
                    </Button>
                  </Col>
                  <Col md="5" className={"d-flex gap-3"}>

                    <Button color="primary" className={"mt-5"} onClick={generateCombinations}>
                      Generate Variants
                    </Button>

                    <Button color="primary" className={"mt-5"} onClick={handleAddVariant}>
                      Add Single Variant
                    </Button>
                  </Col>
                  <Col md={"8"} className={"mt-2"}>
                    <Accordion multiple activeIndex={[0]}>
                      {variableItem?.attributes?.map((attribute, index) => (
                        <AccordionTab key={index} headerTemplate={() => AttributeAccordionHeader(index)}>
                          <div className={"d-flex gap-3"}>
                            <label className={"mt-2"}>Name: {attribute?.attributeTax?.name}</label>
                            <Col md={"9"}>
                              <AsyncSelect
                                value={attribute?.attributeTerms}
                                isMulti
                                getOptionLabel={option => option.name}
                                getOptionValue={option => option.id}
                                onChange={(selectedOptions) => handleAttributeTermChange(index, selectedOptions)}
                                isLoading={loadingAttributesValues}
                                onFocus={() => loadOptions(attribute?.attributeTax?.id)}
                                defaultOptions={attributeValuesList}
                              />

                            </Col>
                          </div>
                        </AccordionTab>
                      ))}
                    </Accordion>
                    <Col md={"12"} className={"mt-2"}>
                    <Row className={"mt-2"}>
                      {variableItem?.variants?.map((variant, variantIndex) => (
                        <Col md={"12"} key={variantIndex} className={"mt-2"}>
                          <Accordion multiple  activeIndex={[0]}>
                          <AccordionTab headerTemplate={() => VariantAccordionHeader(variantIndex)} key={variantIndex} >
                            <Row>

                              <Col md="4">
                                <div className={"d-flex flex-column gap-2 mt-2"}>
                                  <label className={"text-xl font-bold"}>
                                    Name
                                  </label>
                                  <InputText
                                    name="variant-name"
                                    id="name"
                                    required={true}
                                    placeholder="Variant Name"
                                    value={variant?.name}
                                    onChange={(e) => handleVariantFieldChange(variantIndex, 'name', e.target.value)}
                                  />
                                </div>
                              </Col>

                            <Col md="4">
                              <div className={"d-flex flex-column gap-2 mt-2"}>
                                <label className={"text-xl font-bold"}>
                                  SKU
                                </label>
                                <InputText
                                  name="sku"
                                  id="sku"
                                  required={true}
                                  placeholder="Item Sku"
                                  value={variant?.sku}
                                  onChange={(e) => handleVariantFieldChange(variantIndex, 'sku', e.target.value)}
                                />
                              </div>
                            </Col>

                            <Col md="4">
                              <div className={"d-flex flex-column gap-2 mt-2"}>
                                <label className={"text-xl font-bold"}>
                                  Price
                                </label>
                                <InputNumber
                                  name="price"
                                  id="price"
                                  required={true}
                                  placeholder="Item Price"
                                  value={variant?.price}
                                  maxFractionDigits={2}
                                  onChange={(e) => handleVariantFieldChange(variantIndex, 'price', e.value)}
                                />
                              </div>
                            </Col>

                            <Col md="4">
                              <div className={"d-flex flex-column gap-2 mt-2"}>
                                <label className={"text-xl font-bold"}>
                                  Sale Price
                                </label>
                                <InputNumber
                                  name="sale-price"
                                  id="sale-price"
                                  placeholder="Item Sale Price"
                                  maxFractionDigits={2}
                                  value={variant?.salePrice}
                                  onChange={(e) => handleVariantFieldChange(variantIndex, 'salePrice', e.value)}
                                />
                              </div>
                            </Col>
                            </Row>
                            <Col md="12" className={"mt-3"}>
                              <h4>Branch Prices</h4>
                              <Table>
                                <thead>
                                <tr>
                                  <th>Branch</th>
                                  <th>Price</th>
                                </tr>
                                </thead>
                                <tbody>
                                {branchList.map(branch => (
                                  <tr key={branch.id}>
                                    <td>{branch.name}</td>
                                    <td>
                                      <InputNumber
                                        type="number"
                                        name={`branchPrice_${branch.id}`}
                                        placeholder={`Enter price for ${branch.name}`}
                                        onWheel={(e: any) => e.target.blur()}
                                        size={60}
                                        value={variant?.branchVariantDetails?.[branch.id]?.price}
                                        onChange={e => handleBranchPriceChange(variantIndex,branch.id, e.value)}
                                      />
                                    </td>
                                  </tr>
                                ))}
                                </tbody>
                              </Table>
                            </Col>

                          </AccordionTab>
                          </Accordion>
                        </Col>
                      ))}
                    </Row>
                  </Col>
                  </Col>
                </Row>
              </Row>



              <div className={"d-flex"}>
                <Button onClick={handleBackClick} id="cancel-save" data-cy="entityCreateCancelButton"  replace
                        color="info">
                  <FontAwesomeIcon icon="arrow-left"/>
                  &nbsp;
                  <span className="d-none d-md-inline">
                                  <Translate contentKey="entity.action.back">Back</Translate>
                              </span>
                </Button>
                &nbsp;
                <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit"
                        disabled={updating}>
                  <FontAwesomeIcon icon="save"/>
                  &nbsp;
                  <Translate contentKey="entity.action.save">Save</Translate>
                </Button>
              </div>
            </Col>
          </FormGroup>
        </form>

      </Row>
    </div>
  );
};

export default VariableItemUpdate;
