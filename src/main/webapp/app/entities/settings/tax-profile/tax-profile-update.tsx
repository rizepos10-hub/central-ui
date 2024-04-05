import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Row,
  Col,
  Card,
  CardBody,
  FormGroup,
  Label,
  Input,
  CardFooter,
  Popover,
  PopoverBody,
  ListGroupItem,
  ListGroup, Spinner
} from "reactstrap";
import { getSortState, isNumber, Translate, translate, ValidatedField, ValidatedForm } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, updateEntity, createEntity, reset, changeEntityField } from './tax-profile.reducer';
import Select from 'react-select';
import { getEntities as getTaxRates } from 'app/entities/settings/tax/tax.reducer';
import { Calendar } from 'primereact/calendar';
import { InputText } from 'primereact/inputtext';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { ITaxProfile, ITaxRule } from 'app/shared/model/TAX/tax-profile.model';
import { InputNumber } from 'primereact/inputnumber';

const conditionOptions: ITaxRule['type'][] = ['ITEM_UNIT_PRICE', 'DATES'];

export const TaxProfileUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const taxProfileEntity: ITaxProfile = useAppSelector(state => state.taxProfiles.entity);
  const loading = useAppSelector(state => state.taxProfiles.loading);
  const updating = useAppSelector(state => state.taxProfiles.updating);
  const updateSuccess = useAppSelector(state => state.taxProfiles.updateSuccess);
  const taxRates = useAppSelector(state => state.tax.entities);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleChange = <T extends keyof ITaxProfile>(field: T, value: ITaxProfile[T]) => {
    dispatch(changeEntityField({ field, value }));
  };

  const handleClose = () => {
    navigate('/tax-profiles');
  };

  const togglePopover = () => {
    setPopoverOpen(!popoverOpen);
  };

  const handleConditionSelection = selectedOption => {
    const newRule = { type: selectedOption, min: '', max: '' };
    const updatedRules = [...(taxProfileEntity.rules || []), newRule];

    handleChange('rules', updatedRules);
  };

  const handleDeleteCondition = index => {
    const updatedRules = [...taxProfileEntity.rules];
    updatedRules.splice(index, 1);
    handleChange('rules', updatedRules);
  };

  const handleConditionChange = (value, index, property) => {
    const updatedRules = [...taxProfileEntity.rules];
    updatedRules[index] = { ...updatedRules[index], [property]: value };
    handleChange('rules', updatedRules);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const entity = {
      ...taxProfileEntity,
    };
    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(
      getTaxRates({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
  }, []);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }

    return () => {
      dispatch(reset());
    }
  }, [updateSuccess]);

  if(loading) return <Spinner />;

  return (
    <div className="bg-light">
      <h2>Edit Tax Profile</h2>

      <form onSubmit={handleSubmit}>
      <Row className="mt-5">
        <Col md="3">
          <h4>General</h4>
        </Col>
        <Col md="9">
          <Card>
            <CardBody>
              <div className={'d-flex justify-content-between'}>
                <FormGroup>
                  <div className={'flex-1 mr-3'}>
                    <Label for="name">Name</Label>
                    <Input
                      type="text"
                      name="name"
                      id="name"
                      required
                      placeholder="Enter name"
                      value={taxProfileEntity.name}
                      onChange={e => handleChange('name', e.target.value)}
                    />
                  </div>
                  <div className={'flex-1 mt-2'}>
                    <Label for="description">Description</Label>
                    <Input
                      type="text"
                      name="description"
                      placeholder="Enter description"
                      id="description"
                      value={taxProfileEntity.description}
                      onChange={e => handleChange('description', e.target.value)}
                    />
                  </div>
                </FormGroup>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
      <hr className="my-4" style={{ color: 'black', backgroundColor: 'black', height: '2px' }} />

      <Row className="mt-5">
        <Col md="3">
          <h4>Tax Rules</h4>
          <p>Create rules by assigning conditions to a specific tax rate and account profile.</p>
        </Col>
        <Col md="9">
          <Card>
            <CardBody>
              <div className={'d-flex justify-content-between'}>
                <div className="w-50">
                  <Label for="taxRate">Tax Rate</Label>
                  <Select
                    options={taxRates}
                    id="taxRate"
                    required
                    getOptionLabel={tax => `${tax.code} ${tax.description}`}
                    getOptionValue={option => option.id}
                    value={taxProfileEntity.taxRate}
                    onChange={selectedOption => handleChange('taxRate', selectedOption)}
                    placeholder="Select a tax rate..."
                  />
                </div>
              </div>

              {taxProfileEntity?.rules && taxProfileEntity?.rules?.length !== 0 ? (
                <div>
                  <div className={'d-flex mt-3'}>
                    <div className={'flex-1'}>
                      <h4>CONDITIONS</h4>
                    </div>
                    <div className={'flex-1'}>
                      <h4>MIN/START VALUE</h4>
                    </div>
                    <div className={'flex-1'}>
                      <h4>MAX/END VALUE</h4>
                    </div>
                    <div>
                      <h4></h4>
                    </div>
                  </div>

                  {taxProfileEntity?.rules?.map((condition, index) => (
                    <div key={condition.type}>
                      <hr className="my-4" style={{ color: 'black', backgroundColor: 'black', height: '2px' }} />
                      <div className="d-flex mb-3">
                        <div className={'flex-1'}>
                          <h5>{condition.type === 'ITEM_UNIT_PRICE' ? 'Item Unit Price' : 'Dates to apply this tax rule'}</h5>
                        </div>
                        <div className={'flex-1'}>
                          {condition.type === 'ITEM_UNIT_PRICE' && (
                            <FormGroup>
                              <InputNumber
                                id="itemUnitPriceMin"
                                value={condition.min as number || null}
                                onChange={e => handleConditionChange(e.value, index, 'min')}
                              />
                            </FormGroup>
                          )}
                          {condition.type === 'DATES' && (
                            <Calendar
                              value={new Date(condition.min)}
                              onChange={e => handleConditionChange(e.target.value.toISOString(), index, 'min')}
                              showIcon
                              dateFormat="yy-mm-dd"
                            />
                          )}
                        </div>
                        <div className={'flex-1'}>
                          {condition.type === 'ITEM_UNIT_PRICE' && (
                            <FormGroup>
                              <InputNumber
                                id="itemUnitPriceMax"
                                value={condition.max as number || null}
                                onChange={e => handleConditionChange(e.value, index, 'max')}
                              />
                            </FormGroup>
                          )}
                          {condition.type === 'DATES' && (
                            <Calendar
                              value={new Date(condition.max)}
                              onChange={e => handleConditionChange(e.target.value.toISOString(), index, 'max')}
                              showIcon
                              dateFormat="yy-mm-dd"
                            />
                          )}
                        </div>
                        <div onClick={() => handleDeleteCondition(index)}>
                          <FontAwesomeIcon
                            icon="trash"
                            style={{ cursor: 'pointer', color: 'red', height: '1.5rem', marginTop: '0.66rem' }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardBody>

            <CardFooter>
              <div className={'d-flex justify-content-between'}>
                <Button
                  color="primary"
                  id="addConditionButton"
                  onClick={togglePopover}
                  disabled={conditionOptions.every(option => taxProfileEntity?.rules?.map(c => c.type).includes(option))}
                >
                  Add Condition{' '}
                  <span role="img" aria-label="Plus Sign">
                    ➕
                  </span>
                  <Popover placement="right" isOpen={popoverOpen} target="addConditionButton" toggle={togglePopover}>
                    <PopoverBody>
                      <ListGroup>
                        {conditionOptions.map(option => (
                          <ListGroupItem
                            key={option}
                            onClick={() => handleConditionSelection(option)}
                            active={taxProfileEntity?.rules?.map(c => c.type).includes(option)}
                            disabled={taxProfileEntity?.rules?.map(c => c.type).includes(option)}
                            style={{ marginBottom: '7px', cursor: 'pointer' }}
                          >
                            {option}
                          </ListGroupItem>
                        ))}
                      </ListGroup>
                    </PopoverBody>
                  </Popover>
                </Button>

                <Button color="danger">Delete a Tax Rule</Button>
              </div>
            </CardFooter>
          </Card>
        </Col>
        <div className="d-flex justify-content-start align-items-center  mt-7">
          <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/tax-profiles" replace color="info">
            <FontAwesomeIcon icon="arrow-left" />
            &nbsp;
            <span className="d-none d-md-inline">
              <Translate contentKey="entity.action.back">Back</Translate>
            </span>
          </Button>
          &nbsp;
          <Button color="primary" disabled={updating}>
            Save
          </Button>
        </div>
      </Row>
    </form>
  </div>
  );
};

export default TaxProfileUpdate;
