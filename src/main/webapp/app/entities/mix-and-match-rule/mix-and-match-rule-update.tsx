import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity, reset } from './mix-and-match-rule.reducer';
import { IMixAndMatchRule, IQuantityConfigurationProperties } from "app/shared/model/mix-and-match-rule.model";
import Select from 'app/shared/components/select/select';
import { getEntities as getDiscounts } from "app/entities/discount/discount.reducer";
import { IProfileGroup } from "app/shared/model/TAX/profile-group.model";
import { getEntities as getProfileGroups } from "app/entities/settings/profile-group/profile-group.reducer";
import { Translate } from 'react-jhipster';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

interface INewQuantityRule extends IQuantityConfigurationProperties {
  quantity?: number;
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

  const mixAndMatchRuleEntity: IMixAndMatchRule = useAppSelector(state => state.mixAndMatchRule.entity);
  const discountList = useAppSelector(state => state.discount.entities);
  const profileGroupList: IProfileGroup[] = useAppSelector(state => state.profileGroup.entities);
  const loading = useAppSelector(state => state.mixAndMatchRule.loading);
  const updating = useAppSelector(state => state.mixAndMatchRule.updating);

  const isAddButtonDisabled = !newQuantityConfig.quantity || !newQuantityConfig?.discount?.id && !newQuantityConfig.price;

  const handleClose = () => {
    navigate(-1);
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
    dispatch(getProfileGroups({

    }))
  }, []);

  useEffect(() => {
    if (mixAndMatchRuleEntity) {
      setMixAndMatchRule(mixAndMatchRuleEntity);
    }
  }, [mixAndMatchRuleEntity?.id]);

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


  const saveEntity = (e, createNew = false) => {
    e.preventDefault()
    const entity: IMixAndMatchRule = {
      ...mixAndMatchRule,

    };

    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;

          // @ts-expect-error -- unknown type
          if (!res?.error) {
            navigate(`/mix-and-match-rule/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/mix-and-match-rule/new`)
        }
      })
    }
  };


  const customSelectStyles = {
    control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.75rem' }),
    valueContainer: (base) => ({ ...base, padding: '0 8px' }),
    input: (base) => ({ ...base, margin: 0, padding: 0 }),
    menu: (base) => ({ ...base, fontSize: '0.75rem' }),
    option: (base) => ({ ...base, fontSize: '0.75rem' }),
  };

  return (
    <PageWrapper>
      <div className="grid grid-cols-1 gap-3">
        <div>
          <h2 className="text-base font-semibold">{isNew ? 'Add New Mix And Match Rule' : 'Edit Mix And Match Rule'}</h2>
        </div>
        <div className="md:col-span-8">
          <Card>
            <CardContent>
              {loading ? (
                <p className="text-xs">Loading...</p>
              ) : (
                <form>
                  <div className="flex flex-col gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="name" className="text-xs font-medium">Name</Label>
                      <Input
                        type="text"
                        name="name"
                        required={true}
                        id="name"
                        value={mixAndMatchRule.name || ''}
                        onChange={(e) => handleChange(e, e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        name="exactValue"
                        id="exactValue"
                        checked={mixAndMatchRule.exactValue}
                        onCheckedChange={(checked) => handleChange({ target: { name: 'exactValue' } } as any, checked)}
                      />
                      <Label htmlFor="exactValue" className="text-xs font-medium">Exact Quantity</Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        name="requireToBeSameSKU"
                        id="requireToBeSameSKU"
                        checked={mixAndMatchRule.requireToBeSameSKU}
                        onCheckedChange={(checked) => handleChange({ target: { name: 'requireToBeSameSKU' } } as any, checked)}
                      />
                      <Label htmlFor="requireToBeSameSKU" className="text-xs font-medium">Require to be same Item ID</Label>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Conditions To Apply</Label>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="h-7 text-xs font-medium">Quantity</TableHead>
                            <TableHead className="h-7 text-xs font-medium">Type</TableHead>
                            <TableHead className="h-7 text-xs font-medium">{newQuantityConfig?.type === "DISCOUNT" ? "Discount" : "Price"}</TableHead>
                            <TableHead className="h-7 text-xs font-medium w-20"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="text-xs">
                              <Input
                                type="number"
                                value={newQuantityConfig?.quantity || 0}
                                min={0}
                                onChange={e => setNewQuantityConfig(prev => ({ ...prev, quantity: parseFloat(e.target.value) }))}
                                className="h-8 text-xs"
                              />
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant={newQuantityConfig?.type === 'PRICE' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setNewQuantityConfig(prev => ({ ...prev, price: null, discount: null, type: 'PRICE' }))}
                                  className="h-7 text-xs"
                                >
                                  PRICE
                                </Button>
                                <Button
                                  type="button"
                                  variant={newQuantityConfig?.type === 'DISCOUNT' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setNewQuantityConfig(prev => ({ ...prev, price: null, discount: null, type: 'DISCOUNT' }))}
                                  className="h-7 text-xs"
                                >
                                  DISCOUNT
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs" style={{ minWidth: '10rem' }}>
                              {newQuantityConfig?.type === "DISCOUNT" ? (
                                <Select
                                  value={newQuantityConfig?.discount || null}
                                  options={discountList}
                                  getOptionLabel={option => option.type === 'PERCENTAGE' ? `${option.value}%` : `${option.value} ${option.type}`}
                                  getOptionValue={option => option.id}
                                  onChange={(discount) => setNewQuantityConfig(prev => ({ ...prev, discount }))}
                                />
                              ) : newQuantityConfig?.type === "PRICE" ? (
                                <Input
                                  type="number"
                                  value={newQuantityConfig?.price || 0}
                                  min={0}
                                  step={0.01}
                                  onChange={e => setNewQuantityConfig(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                                  className="h-8 text-xs"
                                />
                              ) : null}
                            </TableCell>
                            <TableCell className="text-xs">
                              <Button
                                type="button"
                                disabled={isAddButtonDisabled}
                                onClick={handleAdd}
                                className="h-7 text-xs"
                              >
                                Add
                              </Button>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xs font-medium">Mix And Match Rules</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="h-7 text-xs">Quantity</TableHead>
                            <TableHead className="h-7 text-xs">Type</TableHead>
                            <TableHead className="h-7 text-xs">Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mixAndMatchRule?.configPerQuantity?.length > 0 ? (
                            mixAndMatchRule.configPerQuantity.map((config, index) => (
                              <TableRow key={index}>
                                <TableCell className="text-xs">{config.quantity}</TableCell>
                                <TableCell className="text-xs">{config.type}</TableCell>
                                <TableCell className="text-xs">{valueTemplate(config)}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} className="h-16 text-center text-xs">No rules configured</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Tax Rule</Label>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs">Above This Quantity</span>
                        <Input
                          type="number"
                          value={mixAndMatchRule?.rules?.[0]?.aboveQuantity || ''}
                          id="ruleQuantity"
                          onChange={(e) => handleRuleChange('aboveQuantity', parseFloat(e.target.value))}
                          className="h-8 text-xs w-24"
                        />
                        <span className="text-xs">Apply</span>
                        <div style={{ minWidth: '15rem' }}>
                          <Select
                            id="ruleGroup"
                            isDisabled={!mixAndMatchRule?.rules?.[0]?.aboveQuantity}
                            value={mixAndMatchRule?.rules?.[0]?.accountingGroup}
                            options={profileGroupList}
                            getOptionLabel={option => option.name}
                            getOptionValue={option => option.id}
                            onChange={(selectedOption) => handleRuleChange('accountingGroup', selectedOption)}
                          />
                        </div>
                        <span className="text-xs">Profile Group</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      id="cancel-save"
                      data-cy="entityCreateCancelButton"
                      onClick={() => navigate(-1)}
                      className="h-8 text-xs"
                    >
                      <ArrowLeft className="h-3 w-3 mr-1" />
                      <span className="hidden md:inline">
                        <Translate contentKey="entity.action.back">Back</Translate>
                      </span>
                    </Button>
                    <Button
                      type="button"
                      onClick={saveEntity}
                      id="save-entity"
                      data-cy="entityCreateSaveButton"
                      disabled={updating}
                      className="h-8 text-xs"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      <Translate contentKey="entity.action.save">Save</Translate>
                    </Button>
                    <Button
                      type="button"
                      onClick={(e) => saveEntity(e, true)}
                      id="save-entity-new"
                      data-cy="entityCreateSaveButton"
                      disabled={updating}
                      className="h-8 text-xs"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
};

export default MixAndMatchRuleUpdate;
