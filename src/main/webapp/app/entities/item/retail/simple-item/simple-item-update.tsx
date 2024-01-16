import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import {Button, Row, Col, Spinner, FormGroup, Table, FormText} from 'reactstrap';
import {getSortState, translate, Translate, ValidatedField} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import {Button as PrimeButton} from "primereact/button"

import { getEntity, updateEntity, createEntity, reset } from './simple-item.reducer';
import SharedItemUpdate from "app/shared/layout/item/shared-item-update";
import {ISimpleItem} from "app/shared/model/simple-item.model";
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
import simpleRetailItem from "app/entities/item/retail/simple-item/simple-item.reducer";




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
  const attributesList = useAppSelector(state => state.retailAttribute.entities);
  const location = useLocation();


  const attributeValuesList = useAppSelector(state => state.retailAttributeValue.entities);
  const loadingAttributesValues = useAppSelector(state => state.retailAttributeValue.loading);


  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );


  const [simpleItem, setSimpleItem] = useState<ISimpleItem>({
    itemType: "RETAIL",
    itemVariantType: ItemVariantType.RETAIL_SIMPLE,
    variants: [{
      branchVariantDetails: {}
    }]
  });

  const filteredAvailableAttributes = () => {

    const existingAttributeIds = simpleItem?.attributes?.map(attr => attr.attributeTax.id);

    return attributesList?.filter(attr => !existingAttributeIds?.includes(attr.id));
  };

  const [itemAttribute, setItemAttribute] = useState<{
    attributeTax: ITaxonomy;
    attributeTerms: ITerm[];
  }>({
    attributeTax: {},
    attributeTerms: []
  })


  const handleBackClick = () => {
    const fromMenuId = new URLSearchParams(location.search).get('fromMenu');
    if (fromMenuId) {
      navigate(`/menu/${fromMenuId}/ONLINE_ORDERING/edit?page=1&sort=id,asc`);
    } else {
      navigate("/retail/simple");
    }
  }

  const handleFieldChange = useCallback((fieldName, value) => {
    setSimpleItem((prevState) => ({
      ...prevState,
      [fieldName]: value,
    }));
  }, [])

  const handleSimpleItemChange = (fieldName, value) => {
    console.log(fieldName, 'field', value, "value");
    setSimpleItem((prev) => {
      const updatedVariants = [
        {
          ...(prev.variants && prev.variants[0] ? prev.variants[0] : {}),
          [fieldName]:  value,
        },
      ];
      return {
        ...prev,
        variants: updatedVariants,
      };
    });
  };

  const handleBranchPriceChange = (branchId, price) => {
    setSimpleItem(prev => ({
      ...prev,
      variants: [
        {
          ...(prev.variants && prev.variants[0] ? prev.variants[0] : {}),
          branchVariantDetails: {
            ...prev.variants[0]?.branchVariantDetails,
            [branchId]: {
              branch: branchList.find(branch => branch.id === branchId),
              price: price,
              salePrice: prev.variants[0]?.branchVariantDetails?.[branchId]?.salePrice || 0,
            },
          },
        },
      ],
    }));
  };

  const handleAddAttribute = () => {

    setSimpleItem((prev) => ({
      ...prev,
      attributes: [
        ...(prev.attributes || []),
        itemAttribute,
      ],
    }));
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
    setSimpleItem((prev) => ({
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


  const handleNavigate = (simpleItemId) => {
    navigate(`/retail/simple/${simpleItemId}/edit` + location.search);
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
      setSimpleItem(simpleItemEntity);
    }
    const simpleItemId = simpleItemEntity?.id
    if(updateSuccess){
      handleNavigate(simpleItemId);
    }

  }, [simpleItemEntity, updateSuccess]);


  const saveEntity = e => {
    e.preventDefault();
    const entity = {
      ...simpleItem,
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
      }))
  };





  if(loading){
    return <Spinner />
  }


  return (
    <div>
      <Row>
        <Col md="8">
          <h2>
            {isNew ? "Create New Simple Item" : `Edit Simple Item`}
          </h2>
        </Col>
      </Row>

      <Row>
          <form onSubmit={saveEntity}>
            <FormGroup  className={`${isNew ? "d-flex justify-content-center bg-white mt-3" : ""}`}>

          <Col md="8" className={`d-flex flex-column p-3  bg-white mt-3 `} >

            <SharedItemUpdate item={simpleItem} onFieldChange={handleFieldChange}/>

              <Row className={"mb-3"} >

                <Col md="4">
                  <div className={"d-flex flex-column gap-2"}>
                    <label className={"text-xl font-bold"}>
                    SKU
                    </label>
                    <InputText
                      name="sku"
                      id="sku"
                      required={true}
                      placeholder="Item Sku"
                      value={simpleItem?.variants?.[0]?.sku}
                      onChange={(e) => handleSimpleItemChange('sku', e.target.value)}
                    />
                  </div>
                </Col>

                <Col md="4">
                  <div className={"d-flex flex-column gap-2"}>
                    <label className={"text-xl font-bold"}>
                      Price
                    </label>
                    <InputNumber
                      name="price"
                      id="price"
                      required={true}
                      maxFractionDigits={2}
                      placeholder="Item Price"
                      value={simpleItem?.variants?.[0]?.price}
                      onChange={(e) => handleSimpleItemChange('price', e.value)}
                    />
                  </div>
                </Col>

                <Col md="4">
                  <div className={"d-flex flex-column gap-2"}>
                    <label className={"text-xl font-bold"}>
                    Sale Price
                    </label>
                    <InputNumber
                      name="sale-price"
                      id="sale-price"
                      maxFractionDigits={2}
                      placeholder="Item Sale Price"
                      value={simpleItem?.variants?.[0]?.salePrice}
                      onChange={(e) => handleSimpleItemChange('salePrice', e.value)}
                    />
                  </div>
                </Col>


                <Col md="8" className={"mt-3"}>
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
                        <ValidatedField
                          type="number"
                          name={`branchPrice_${branch.id}`}
                          placeholder={`Enter price for ${branch.name}`}
                          onWheel={(e: any) => e.target.blur()}
                          value={simpleItem?.variants?.[0]?.branchVariantDetails?.[branch.id]?.price}
                          onChange={e => handleBranchPriceChange(branch.id, e.target.value)}
                          validate={{
                            required: { value: true, message: translate('entity.validation.required') },
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </Table>
                </Col>

                <Row>
                  <Col md="4">
                    <div className={"d-flex flex-column gap-2"}>
                      <label className={"text-xl font-bold"}>
                       Select Attribute
                      </label>
                      <Select
                        value={itemAttribute?.attributeTax}
                        options={filteredAvailableAttributes()}
                        getOptionValue={option => option.id}
                        getOptionLabel={option => option.key}
                        onChange={(attribute) => handleItemAttributeSelect(attribute)}
                      />
                    </div>
                  </Col>



                <Col md="4" >
                <Button color="primary" disabled={filteredAvailableAttributes().length === 0} className={"mt-5"} onClick={handleAddAttribute}>
                  Add Attribute
                </Button>
                </Col>
                  <Col md={"8"} className={"mt-2"}>
                    <Accordion multiple activeIndex={[0]}>
                      {simpleItem?.attributes?.map((attribute, index) => (
                        <AccordionTab key={index} header={attribute?.attributeTax?.key}>
                        <div className={"d-flex gap-3"}>
                          <label className={"mt-2"}>Name: {attribute?.attributeTax?.key}</label>
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

export default SimpleItemUpdate;
