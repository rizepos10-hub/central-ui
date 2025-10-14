import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSortState, Translate } from 'react-jhipster';
import { Save, ArrowLeft, Trash2, Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, updateEntity, createEntity, reset, changeEntityField } from './tax-profile.reducer';
import Select from 'react-select';
import { getEntities as getTaxRates } from 'app/entities/settings/tax/tax.reducer';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { ITaxProfile, ITaxRule } from 'app/shared/model/TAX/tax-profile.model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

const conditionOptions: ITaxRule['type'][] = ['ITEM_UNIT_PRICE', 'DATES'];

export const TaxProfileUpdate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const taxProfileEntity: ITaxProfile = useAppSelector(state => state.taxProfiles.entity);
  const loading = useAppSelector(state => state.taxProfiles.loading);
  const updating = useAppSelector(state => state.taxProfiles.updating);
  const taxRates = useAppSelector(state => state.tax.entities);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleChange = <T extends keyof ITaxProfile>(field: T, value: ITaxProfile[T]) => {
    dispatch(changeEntityField({ field, value }));
  };

  const handleClose = () => {
    navigate(-1);
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

  const saveEntity = (e, createNew = false) => {
    e.preventDefault();

    const entity = {
      ...taxProfileEntity,
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
            navigate(`/tax-profiles/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/tax-profiles/new`)
        }
      })
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

  if (loading) return <div className="p-4 text-xs">Loading...</div>;

  return (
    <PageWrapper>
      <div className="space-y-4">
        <h2 className="text-base font-bold">Edit Tax Profile</h2>

        <form className="space-y-6">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3">
              <h4 className="text-sm font-semibold">General</h4>
            </div>
            <div className="col-span-9">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-semibold">Name</Label>
                    <Input
                      id="name"
                      required
                      placeholder="Enter name"
                      value={taxProfileEntity.name || ''}
                      onChange={e => handleChange('name', e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-xs font-semibold">Description</Label>
                    <Input
                      id="description"
                      placeholder="Enter description"
                      value={taxProfileEntity.description || ''}
                      onChange={e => handleChange('description', e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3">
              <h4 className="text-sm font-semibold">Tax Rules</h4>
              <p className="text-xs text-muted-foreground mt-2">Create rules by assigning conditions to a specific tax rate and account profile.</p>
            </div>
            <div className="col-span-9">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxRate" className="text-xs font-semibold">Tax Rate</Label>
                    <Select
                      options={taxRates}
                      id="taxRate"
                      required
                      getOptionLabel={tax => `${tax.code} ${tax.description}`}
                      getOptionValue={option => option.id}
                      value={taxProfileEntity.taxRate || null}
                      onChange={selectedOption => handleChange('taxRate', selectedOption)}
                      placeholder="Select a tax rate..."
                      className="text-xs"
                      styles={{
                        control: (base) => ({ ...base, minHeight: '28px', fontSize: '0.75rem' }),
                        option: (base) => ({ ...base, fontSize: '0.75rem' }),
                      }}
                    />
                  </div>

                  {taxProfileEntity?.rules && taxProfileEntity?.rules?.length !== 0 ? (
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-12 gap-2 text-xs font-semibold">
                        <div className="col-span-4">CONDITIONS</div>
                        <div className="col-span-3">MIN/START VALUE</div>
                        <div className="col-span-3">MAX/END VALUE</div>
                        <div className="col-span-2"></div>
                      </div>

                      {taxProfileEntity?.rules?.map((condition, index) => (
                        <div key={condition.type} className="border-t pt-4">
                          <div className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-4">
                              <h5 className="text-xs font-medium">{condition.type === 'ITEM_UNIT_PRICE' ? 'Item Unit Price' : 'Dates to apply this tax rule'}</h5>
                            </div>
                            <div className="col-span-3">
                              {condition.type === 'ITEM_UNIT_PRICE' && (
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={condition.min as number || ''}
                                  onChange={e => handleConditionChange(parseFloat(e.target.value), index, 'min')}
                                  className="h-7 text-xs"
                                />
                              )}
                              {condition.type === 'DATES' && (
                                <Input
                                  type="date"
                                  value={condition.min ? new Date(condition.min).toISOString().split('T')[0] : ''}
                                  onChange={e => handleConditionChange(new Date(e.target.value).toISOString(), index, 'min')}
                                  className="h-7 text-xs"
                                />
                              )}
                            </div>
                            <div className="col-span-3">
                              {condition.type === 'ITEM_UNIT_PRICE' && (
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={condition.max as number || ''}
                                  onChange={e => handleConditionChange(parseFloat(e.target.value), index, 'max')}
                                  className="h-7 text-xs"
                                />
                              )}
                              {condition.type === 'DATES' && (
                                <Input
                                  type="date"
                                  value={condition.max ? new Date(condition.max).toISOString().split('T')[0] : ''}
                                  onChange={e => handleConditionChange(new Date(e.target.value).toISOString(), index, 'max')}
                                  className="h-7 text-xs"
                                />
                              )}
                            </div>
                            <div className="col-span-2">
                              <button type="button" onClick={() => handleDeleteCondition(index)} className="text-destructive hover:text-destructive/80">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </CardContent>

                <CardFooter className="flex justify-between">
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="default"
                        className="h-8 text-xs"
                        disabled={conditionOptions.every(option => taxProfileEntity?.rules?.map(c => c.type).includes(option))}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Condition
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2">
                      <div className="space-y-1">
                        {conditionOptions.map(option => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              handleConditionSelection(option);
                              setPopoverOpen(false);
                            }}
                            disabled={taxProfileEntity?.rules?.map(c => c.type).includes(option)}
                            className={`w-full text-left px-3 py-2 text-xs rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed ${
                              taxProfileEntity?.rules?.map(c => c.type).includes(option) ? 'bg-accent' : ''
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Button variant="destructive" className="h-8 text-xs" type="button">Delete a Tax Rule</Button>
                </CardFooter>
              </Card>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              id="cancel-save"
              data-cy="entityCreateCancelButton"
              onClick={() => navigate(-1)}
              variant="secondary"
              className="h-8 text-xs"
              type="button"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <Translate contentKey="entity.action.back">Back</Translate>
            </Button>
            <Button
              onClick={saveEntity}
              id="save-entity"
              data-cy="entityCreateSaveButton"
              type="button"
              disabled={updating}
              className="h-8 text-xs"
            >
              <Save className="h-4 w-4 mr-2" />
              <Translate contentKey="entity.action.save">Save</Translate>
            </Button>
            <Button
              onClick={(e) => saveEntity(e, true)}
              type="button"
              disabled={updating}
              className="h-8 text-xs"
            >
              <Save className="h-4 w-4 mr-2" />
              <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
            </Button>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default TaxProfileUpdate;
