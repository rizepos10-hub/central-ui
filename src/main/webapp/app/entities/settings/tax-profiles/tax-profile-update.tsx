import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Row,
  Col,
  FormText,
  Card,
  CardBody,
  FormGroup,
  Label,
  Input,
  CardFooter,
  DropdownItem,
  DropdownToggle,
  Dropdown, DropdownMenu, Popover, PopoverBody, ListGroupItem, ListGroup
} from 'reactstrap';
import {getSortState, isNumber, Translate, translate, ValidatedField, ValidatedForm} from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, updateEntity, createEntity, reset } from './tax-profile.reducer';
import Select from "react-select";
import {  getEntities as getTaxRates } from '../taxes/tax.reducer';
import { Calendar } from 'primereact/calendar';
import {InputText} from "primereact/inputtext";
import {overridePaginationStateWithQueryParams} from "app/shared/util/entity-utils";
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";

export const TaxProfileUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;


  const taxEntity = useAppSelector(state => state.taxProfiles.entity);
  const loading = useAppSelector(state => state.taxProfiles.loading);
  const updating = useAppSelector(state => state.taxProfiles.updating);
  const updateSuccess = useAppSelector(state => state.taxProfiles.updateSuccess)
  const taxRates = useAppSelector(state => state.tax.entities);



console.log(taxEntity, 'loli')

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [taxRate, setTaxRate] :any= useState('');

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedConditions, setSelectedConditions] = useState([]);





  const taxRatesOptions = taxRates.map((tax) => ({label: `${tax.code} ${tax.description}`, value: tax.id}))
  const conditionOptions = ['ITEM_UNIT_PRICE', 'DATES'];





  const handleClose = () => {
    navigate('/tax-profiles');
  };

  const togglePopover = () => {
    setPopoverOpen(!popoverOpen);
  };


  const handleConditionSelection = (selectedOption) => {
    setSelectedConditions((prevConditions) => [
      ...prevConditions,
      {
        type: selectedOption,
        min: '',
        max: '',
      },
    ]);
  };

  const handleDeleteCondition = (index) => {
    const updatedConditions = [...selectedConditions];

    updatedConditions.splice(index, 1);

    setSelectedConditions(updatedConditions);
  };

  const handleConditionChange = (e, index, property) => {
    const updatedConditions = [...selectedConditions];
    updatedConditions[index][property] = e.target.value;
    setSelectedConditions(updatedConditions);
  };


  const handleSubmit = () => {

    console.log(selectedConditions, 'sl')
    const formData = {
      id: id ? id : null,
      name,
      description,
      taxRate: { id: taxRate.value },
      rules: selectedConditions
    };
if(isNew){
  dispatch(createEntity(formData));

}else{
  dispatch(updateEntity(formData))
}

  };







  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getTaxRates({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }))
  }, []);




  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
    if (taxEntity) {
      setName(taxEntity.name);
      setDescription(taxEntity.description);
      setTaxRate(taxEntity.taxRate ? { label: `${taxEntity.taxRate.code} ${taxEntity.taxRate.description}`, value: taxEntity.taxRate.id } : null);
      const defaultRules = taxEntity.rules?.map((rule) => ({
        type: rule.type,
        min: rule.min,
        max: rule.max
      })) || []
      setSelectedConditions(defaultRules)
    }
  }, [updateSuccess, taxEntity]);






  const renderConditionDetails = () => {
    if (selectedConditions.length === 0) {
      return null;
    }

    return (
      <div>
        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1 }}>
            <h4>CONDITIONS</h4>
          </div>
          <div style={{ flex: 1 }}>
            <h4>MIN/START VALUE</h4>
          </div>
          <div style={{ flex: 1 }}>
            <h4>MAX/END VALUE</h4>
          </div>
          <div>
            <h4></h4>
          </div>
        </div>

        {selectedConditions.map((condition, index) => (
          <div key={condition.type}>
            <hr className="my-4" style={{ color: 'black', backgroundColor: 'black', height: '2px' }} />
            <div className="d-flex mb-3">
              <div style={{ flex: 1 }}>
                <h5>{condition.type === 'ITEM_UNIT_PRICE' ? 'Item Unit Price' : 'Dates to apply this tax rule'}</h5>
              </div>
              <div style={{ flex: 1 }}>
                {condition.type === 'ITEM_UNIT_PRICE' && (
                  <FormGroup>
                    <InputText
                      type="number"
                      id="itemUnitPriceMin"
                      value={condition.min}
                      onChange={(e) => handleConditionChange(e, index, 'min')}
                    />
                  </FormGroup>
                )}
                {condition.type === 'DATES' && (
                  <Calendar
                    value={new Date(condition.min)}
                    onChange={(e: any) => handleConditionChange(e, index, 'min')}
                    showIcon
                    dateFormat="yy-mm-dd"
                  />
                )}
              </div>
              <div style={{ flex: 1 }}>
                {condition.type === 'ITEM_UNIT_PRICE' && (
                  <FormGroup>
                    <InputText
                      type="number"
                      id="itemUnitPriceMax"
                      value={condition.max}
                      onChange={(e: any) => handleConditionChange(e, index, 'max')}
                    />
                  </FormGroup>
                )}
                {condition.type === 'DATES' && (
                  <Calendar
                    value={new Date(condition.max)}
                    onChange={(e: any) => handleConditionChange(e, index, 'max')}
                    showIcon
                    dateFormat="yy-mm-dd"
                  />
                )}
              </div>
              <div onClick={() => handleDeleteCondition(index)}>
                <FontAwesomeIcon icon="trash" style={{ cursor: 'pointer', color: 'red', height: '1.5rem', marginTop: '0.66rem' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };






  return (
    <div  className="bg-light">
      <h2>Edit Tax Profile</h2>


      <Row className="mt-5">
        <Col md="3">
          <h4>General</h4>
        </Col>
        <Col md="9">
          <Card>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ flex: '1', marginRight: '10px' }}>
                  <FormGroup>
                    <Label for="name">Name</Label>
                    <Input
                      type="text"
                      name="name"
                      id="name"
                      placeholder="Enter name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </FormGroup>
                </div>
                <div style={{ flex: '1' }}>
                  <FormGroup>
                    <Label for="description">Description</Label>
                    <Input
                      type="text"
                      name="description"
                      placeholder="Enter description"
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </FormGroup>
                </div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="w-50">
                  <FormGroup>
                    <Label for="taxRate">Tax Rate</Label>
                    <Select
                      options={taxRatesOptions}
                      id="taxRate"
                      value={taxRate}
                      onChange={(selectedOption) => setTaxRate(selectedOption)}
                      placeholder="Select a tax rate..."
                    />
                  </FormGroup>
                </div>
              </div>

              {renderConditionDetails()}
            </CardBody>
            <CardFooter>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  color="primary"
                  id="addConditionButton"
                  onClick={togglePopover}
                  disabled={conditionOptions.every(option => selectedConditions.map(c => c.type).includes(option))}
                >
                  Add Condition <span role="img" aria-label="Plus Sign">➕</span>
                  <Popover
                    placement="right"
                    isOpen={popoverOpen}
                    target="addConditionButton"
                    toggle={togglePopover}
                  >
                    <PopoverBody>
                      <ListGroup>
                        {conditionOptions.map((option) => (
                          <ListGroupItem
                            key={option}
                            onClick={() => handleConditionSelection(option)}
                            active={selectedConditions.map(c => c.type).includes(option)}
                            disabled={selectedConditions.map(c => c.type).includes(option)}
                            style={{ marginBottom: '7px', cursor: 'pointer' }}
                          >
                            {option}
                          </ListGroupItem>
                        ))}
                      </ListGroup>
                    </PopoverBody>
                  </Popover>
                </Button>

                <Button color="danger">
                  Delete a Tax Rule
                </Button>
              </div>
            </CardFooter>

          </Card>
        </Col>
        <div className="d-flex justify-content-start align-items-center  mt-7">
          <Button color="primary" onClick={handleSubmit}>
            Save
          </Button>
          &nbsp;

          <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/tax-profiles" replace color="info">
            <FontAwesomeIcon icon="arrow-left" />
            &nbsp;
            <span className="d-none d-md-inline">
                  <Translate contentKey="entity.action.back">Back</Translate>
                </span>
          </Button>

        </div>

      </Row>
    </div>
  );
};

export default TaxProfileUpdate;


