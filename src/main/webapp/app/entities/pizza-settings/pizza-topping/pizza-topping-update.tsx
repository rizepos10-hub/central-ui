import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './pizza-topping.reducer';
import { Card as PrimeCard } from 'primereact/card'

import { InputText } from "primereact/inputtext";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { getSortState, Translate } from "react-jhipster";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { ITopping } from "app/shared/model/PIZZA/topping.model";
import CreatableSelect from "react-select/creatable";
import { getEntities as getToppingGroups, createEntity as createToppingGroup } from "app/entities/pizza-settings/pizza-topping-group/pizza-topping-group.reducer";
import Attachment from "app/shared/components/attachment/attachment";
import { getEntities as getPricingClasses } from "app/entities/pizza-settings/pizza-pricing-class/pizza-pricing-class.reducer";
import Select from "react-select";
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';

export const PizzaToppingUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const [pizzaTopping, setPizzaTopping] = useState<ITopping>({
    name: '',
    group: {
      id: "",
      name: ""
    },
    pricingClass: {}
  });
  const toppingPricingClasses = useAppSelector(state => state.pizzaPricingClass.entities).filter(option => option.type === 'TOPPING');

  const pizzaToppingGroups = useAppSelector(state => state.toppingGroup.entities).map(tpngGrp => ({ ...tpngGrp, label: tpngGrp.name, value: tpngGrp.id }));
  const updatingGroup = useAppSelector(state => state.toppingGroup.updating);


  const pizzaToppingEntity = useAppSelector(state => state.pizzaTopping.entity);
  const loading = useAppSelector(state => state.pizzaTopping.loading);
  const updating = useAppSelector(state => state.pizzaTopping.updating);
  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getToppingGroups({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));
    dispatch(getPricingClasses({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));
  }, []);

  console.log(pizzaToppingGroups, 'pizzaToppingGroups')
  useEffect(() => {
    if (pizzaToppingEntity) {
      setPizzaTopping(() => {
        const toppingGroup = { ...pizzaToppingEntity.group };
        const modifiedGroup = { ...toppingGroup, label: toppingGroup.name, value: toppingGroup?.id };
        console.log(modifiedGroup, 'modifiedGroup')
        return {
          ...pizzaToppingEntity,
          group: modifiedGroup
        }
      })
    }
  }, [pizzaToppingEntity?.name]);

  const handleChange = e => {
    const { name, value } = e.target;
    setPizzaTopping(prevState => ({ ...prevState, [name]: value }));
  };

  const handleGroupChange = (selectedGroup) => {
    const selectedToppingGroup = selectedGroup ? selectedGroup : null
    setPizzaTopping((prev) => ({ ...prev, group: selectedToppingGroup }))
  }

  const handleAddImage = (imageType, imageInfo) => {
    console.log(imageInfo, 'imageInfo')
    setPizzaTopping((prevState) => ({ ...prevState, [imageType]: transformAttachmentStructure(imageInfo, 'toIAttachment')[0] }))
  }

  const handleRemoveImage = (imageType) => {
    setPizzaTopping((prevState) => ({ ...prevState, [imageType]: null }))
  }

  const saveEntity = (e, createNew = false) => {
    e.preventDefault();
    const entity = {
      ...pizzaTopping,
    };

    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;
          navigate(`/pizza-topping/${newId}/edit`)
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/pizza-topping/new`)
        }
      })
    }
  };



  const handleCreate = (inputValue: string) => {
    const entity = {
      name: inputValue
    };
    dispatch(createToppingGroup(entity));
  };

  return (
    <div>
      <Row>
        <Col md="8">
          <h2>{isNew ? "Add New Topping" : "Edit Topping"}</h2>
        </Col>
      </Row>
      <Row>
        <Col md="8" className="d-flex flex-column p-3">
          <PrimeCard>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <form>
                <FormGroup>
                  <div className={"d-flex flex-column"}>
                    <Label for="pizza-topping-name">Name</Label>
                    <InputText
                      type="text"
                      name="name"
                      required={true}
                      id="pizza-topping-name"
                      value={pizzaTopping.name || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={"d-flex flex-column my-2"}>
                    <Label for="pizza-topping-group">Topping Group</Label>
                    <CreatableSelect
                      isDisabled={updatingGroup}
                      isLoading={updatingGroup}
                      options={pizzaToppingGroups}
                      value={pizzaTopping.group || null}
                      onCreateOption={handleCreate}
                      onChange={handleGroupChange}
                      isClearable={true}

                    />
                  </div>

                  <div className={"d-flex flex-column  my-2"}>
                    <label>
                      Pricing Class
                    </label>
                    <Select
                      value={pizzaTopping?.pricingClass || null}
                      required
                      options={toppingPricingClasses}
                      getOptionLabel={option => option.name}
                      getOptionValue={option => option.id}
                      onChange={(toppingPriceOption) => setPizzaTopping((prevState) => ({ ...prevState, pricingClass: toppingPriceOption }))}
                    />
                  </div>


                  <div className={"d-flex flex-column my-2"}>
                    <Label >Topping Image</Label>
                    <MediaLibrary
                      handleFilesSelectCallback={(files) => handleAddImage("image", files)}
                      defaultValues={transformAttachmentStructure(pizzaTopping?.image ? [pizzaTopping?.image] : [], 'toFileLibraryListItem')}
                    />
                  </div>

                  <div className={"d-flex flex-column my-2"}>
                    <Label >Topping Icon</Label>
                    <MediaLibrary
                      handleFilesSelectCallback={(files) => handleAddImage("icon", files)}
                      defaultValues={transformAttachmentStructure(pizzaTopping?.icon ? [pizzaTopping?.icon] : [], 'toFileLibraryListItem')}
                    />
                  </div>

                </FormGroup>
                <Button id="cancel-save" data-cy="entityCreateCancelButton" onClick={() => navigate(-1)} color="info">
                  <FontAwesomeIcon icon="arrow-left" />
                  &nbsp;
                  <span className="d-none d-md-inline">
                    <Translate contentKey="entity.action.back">Back</Translate>
                  </span>
                </Button>
                &nbsp;
                <Button onClick={saveEntity} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                  <FontAwesomeIcon icon="save" />
                  &nbsp;
                  <Translate contentKey="entity.action.save">Save</Translate>
                </Button>
                &nbsp;
                <Button onClick={(e) => saveEntity(e, true)} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                  <FontAwesomeIcon icon="save" />
                  &nbsp;
                  <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
                </Button>
              </form>
            )}
          </PrimeCard>
        </Col>
      </Row>
    </div>
  );
};

export default PizzaToppingUpdate;
