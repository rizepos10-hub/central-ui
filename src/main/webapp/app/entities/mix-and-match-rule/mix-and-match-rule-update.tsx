import React, {useEffect, useMemo, useState} from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import {Button, Row, Col, FormGroup, Label, Input, Table, ListGroup} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './mix-and-match-rule.reducer';
import {InputText} from "primereact/inputtext";
import {Card as PrimeCard} from 'primereact/card'
import {IMixAndMatchRule, IQuantityConfigurationProperties} from "app/shared/model/mix-and-match-rule.model";
import {SelectButton} from "primereact/selectbutton";
import Select from "react-select";
import {getEntities as getDiscounts} from "app/entities/discount/discount.reducer";
import {InputNumber} from "primereact/inputnumber";
import {Checkbox} from "primereact/checkbox";
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {IAccountingGroups} from "app/shared/model/TAX/accounting-groups.model";
import {getEntities as getAccountingGroups} from "app/entities/settings/accounting-groups/accounting-groups.reducer";

interface INewQuantityRule extends IQuantityConfigurationProperties {
  quantity?: number;
}

type Rule = {
  quantity?: number;
  accountingGroup?: IAccountingGroups;
}

export const MixAndMatchRuleUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;


  const [newQuantityConfig, setNewQuantityConfig] = useState<INewQuantityRule>({
    type: "PRICE",
  });

  const [mixAndMatchRule, setMixAndMatchRule] = useState<IMixAndMatchRule>({
    name: '',

  });

  const mixAndMatchRuleEntity :IMixAndMatchRule = useAppSelector(state => state.mixAndMatchRule.entity);
  const discountList = useAppSelector(state => state.discount.entities);
  const accountingGroupList :IAccountingGroups[] = useAppSelector(state => state.accountingGroups.entities);
  const loading = useAppSelector(state => state.mixAndMatchRule.loading);
  const updating = useAppSelector(state => state.mixAndMatchRule.updating);
  const updateSuccess = useAppSelector(state => state.mixAndMatchRule.updateSuccess);

  const isAddButtonDisabled = !newQuantityConfig.quantity ||  !newQuantityConfig?.discount?.id  && !newQuantityConfig.price;

  const handleClose = () => {
    navigate('/mix-and-match-rule' + location.search);
  };


  const valueTemplate = (rowData) => {
    if (rowData?.type === 'DISCOUNT' && rowData?.discount.type === "PERCENTAGE") {
      return `${rowData?.discount.value}%`;
    } else if (rowData?.type === 'DISCOUNT') {
      return `${rowData?.discount.value} ${rowData?.discount.type}`;
    } else {
      return rowData?.price;
    }
  }

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

    dispatch(getDiscounts({

    }));
    dispatch(getAccountingGroups({

    }))
  }, []);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
    if (mixAndMatchRuleEntity) {
      setMixAndMatchRule(mixAndMatchRuleEntity);
    }

  }, [updateSuccess, mixAndMatchRuleEntity?.id]);

  const handleChange = (e, value) => {
    const { name } = e.target;
    setMixAndMatchRule(prevState => ({ ...prevState, [name]: value }));
  };

  const handleRuleChange = (fieldName, value) => {
    setMixAndMatchRule(prevState => ({
      ...prevState,
      rules: [
        {
          ...(prevState.rules?.[0] || {}),
          [fieldName]: value
        }
      ]
    }));
  };


  const handleAdd = () => {
    if (mixAndMatchRule.configPerQuantity?.some(cnfg => cnfg.quantity === newQuantityConfig.quantity)) {
      alert('Quantity already exists.');
    } else {
      const updatedConfigPerQuantity = [...(mixAndMatchRule?.configPerQuantity || []), newQuantityConfig];

      setMixAndMatchRule(prevState => ({
        ...prevState,
        configPerQuantity: updatedConfigPerQuantity,
      }));
      setNewQuantityConfig({ type: "PRICE" });
    }
  };


  const saveEntity = (e) => {
    e.preventDefault()
    const entity: IMixAndMatchRule = {
      ...mixAndMatchRule,

    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };



  return (
    <div>
      <Row>
        <Col md="8">
          <h2>{isNew ? 'Add New Mix And Match Rule' : 'Edit Mix And Match Rule'}</h2>
        </Col>
      </Row>
      <Row>
        <Col md="8" className="d-flex flex-column p-3 ">
          <PrimeCard>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <form onSubmit={saveEntity}>
                <FormGroup className={"d-flex flex-column gap-3"}>
                  <div className={'d-flex flex-column'}>
                    <Label className={'font-bold'} for="name">Name</Label>
                    <InputText
                      type="text" name="name" required={true} id="name" value={mixAndMatchRule.name}
                      onChange={(e) => handleChange(e, e.target.value)}
                    />
                  </div>

                  <div className={'d-flex flex-row gap-2'}>
                    <Label className={'font-bold'} for="exactValue">Exact Quantity</Label>
                    <Checkbox
                      name="exactValue"  id="exactValue" checked={mixAndMatchRule.exactValue}
                      onChange={(e) => handleChange(e, e.checked)}
                    />
                  </div>

                  <div className={'d-flex flex-row gap-2'}>
                    <Label className={'font-bold'} for="requireToBeSameSKU">Require to be same Item ID</Label>
                    <Checkbox
                      name="requireToBeSameSKU"  id="requireToBeSameSKU" checked={mixAndMatchRule.requireToBeSameSKU}
                      onChange={(e) => handleChange(e, e.checked)}
                    />
                  </div>


                  <Table>
                    <Label className={"font-bold"}>Conditions To Apply</Label>
                    <tbody>
                      <tr>
                        <td className={'font-bold'}>Quantity</td>
                        <td className={'font-bold'}>Type</td>
                        <td className={'font-bold'}>{newQuantityConfig?.type === "DISCOUNT" ? "Discount" : "Price"}</td>
                      </tr>
                      <tr>
                        <td>
                          <InputNumber
                            value={newQuantityConfig?.quantity}
                            min={0}
                            onChange={e => setNewQuantityConfig(prev => ({...prev, quantity: e.value}))}
                          />
                        </td>
                        <td>
                          <SelectButton
                            value={newQuantityConfig?.type}
                            unselectable={false}
                            options={[ 'PRICE', 'DISCOUNT']}
                            required
                            id="type"
                            onChange={e => setNewQuantityConfig(prev => ({...prev, price: null, discount: null, type: e.value}))}
                          />
                        </td>
                        <td style={{  minWidth: '10rem'}}>
                          {newQuantityConfig?.type === "DISCOUNT" ? (
                            <Select
                              value={newQuantityConfig?.discount}
                              options={discountList}
                              getOptionLabel={option => option.type === 'PERCENTAGE' ? `${option.value}%` : `${option.value} ${option.type}`}
                              getOptionValue={option => option.id}
                              onChange={(discount) => setNewQuantityConfig(prev => ({...prev, discount}))}
                            />
                          ) : newQuantityConfig?.type === "PRICE" ? (
                            <InputNumber
                              value={newQuantityConfig?.price}
                              min={0}
                              size={5}
                              onChange={e => setNewQuantityConfig(prev => ({...prev, price: e.value}))}
                              />
                          ) : null}
                        </td>
                        <td className={'w-2'}>
                          <Button
                            disabled={isAddButtonDisabled}
                            color={'success'}
                            onClick={handleAdd}
                          >
                            Add
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </Table>

                  <DataTable
                    value={mixAndMatchRule?.configPerQuantity}
                    header={"Mix And Match Rules"}
                  >
                    <Column field={"quantity"} header={"Quantity"} />
                    <Column field={"type"} header={"Type"} />
                    <Column field={"value"} header={"Value"} body={valueTemplate} />
                  </DataTable>

                  <div className={'d-flex flex-row gap-3'}>
                    <div className={'d-flex flex-column gap-2'}>
                      <Label><strong>Tax Rule</strong></Label>
                      <div className="p-inputgroup w-full md:w-50rem">
                        <span className="p-inputgroup-addon">
                        Above This Quantity
                        </span>
                        <InputNumber
                          value={mixAndMatchRule?.rules?.[0]?.aboveQuantity}
                          id="ruleQuantity"
                          size={3}
                          onChange={(e) => handleRuleChange('aboveQuantity', e.value)}
                        />
                        <span className="p-inputgroup-addon">Apply</span>
                        <Select
                          id="ruleGroup"
                          styles={{
                            control: (baseStyles, state) => ({
                              ...baseStyles,
                              paddingTop: '0.5rem',
                              paddingBottom: '0.5rem',
                              minWidth: '15rem'
                            }),
                          }}
                          isDisabled={!mixAndMatchRule?.rules?.[0]?.aboveQuantity}
                          value={mixAndMatchRule?.rules?.[0]?.accountingGroup}
                          options={accountingGroupList}
                          getOptionLabel={option => option.name}
                          getOptionValue={option => option.id}
                          onChange={(selectedOption) => handleRuleChange('accountingGroup', selectedOption)}
                        />
                        <span className="p-inputgroup-addon">Accounting group</span>
                      </div>
                    </div>
                  </div>

                </FormGroup>
                <Button tag={Link} to="/mix-and-match-rule" replace color="info">
                  <FontAwesomeIcon icon="arrow-left" />
                  &nbsp;Back
                </Button>
                &nbsp;
                <Button color="primary" type="submit" disabled={updating}>
                  <FontAwesomeIcon icon="save" />
                  &nbsp;Save
                </Button>
              </form>
            )}
          </PrimeCard>
        </Col>
      </Row>
    </div>
  );
};

export default MixAndMatchRuleUpdate;
