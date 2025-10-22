import React, { useState, useEffect } from 'react';
import { getSortState, Translate } from 'react-jhipster';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { createEntity, reset } from '../addon/addon.reducer';
import { getEntities as getDiscounts } from 'app/entities/discount/discount.reducer';
import Select from 'react-select';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { IAddon } from 'app/shared/model/ADDON/addon.model';
import { getEntities as getAddons } from 'app/entities/addon/addon.reducer';
import { getEntity, updateAddons, updateEntity } from './addon-groups.reducer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeftRight } from 'lucide-react';

export const CreateAddonModal = ({ isOpen, toggle, addonGroup }) => {
  const dispatch = useAppDispatch();
  const [inputMode, setInputMode] = useState<'normal' | 'string'>('normal');
  const [stringAddons, setStringAddons] = useState<string>('');
  const [stringValidationError, setStringValidationError] = useState<string>('');

  const discounts = useAppSelector(state => state.discount.entities);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );
  const [addon, setAddon] = useState<IAddon>();

  // Regex to validate the string format: name1,name2@price2,name3@price3...
  // const stringAddonsRegex = /^[a-zA-Z0-9\s]+(@\d+(\.\d{1,2})?)?(\s*,\s*[a-zA-Z0-9\s]+(@\d+(\.\d{1,2})?)?)*$/;

  const validateStringAddons = (value: string): boolean => {
    if (!value.trim()) {
      setStringValidationError('Please enter addons');
      return false;
    }
    // if (!stringAddonsRegex.test(value.trim())) {
    //   setStringValidationError('Invalid format. Use: name1,name2@price2,name3@price3 (e.g., lettuce,tomato@2,cheese@5.10)');
    //   return false;
    // }
    setStringValidationError('');
    return true;
  };

  const parseStringAddons = (addonString: string): any[] => {
    return addonString
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .map((item, index) => {
        const parts = item.split('@');
        const name = parts[0].trim();
        const price = parts.length > 1 ? parseFloat(parts[1]) : 0;
        
        return {
          name,
          price,
          desc: '',
          discounts: [],
          archived: false
        };
      });
  };

  const handleDiscountsChange = selectedOptions => {
    setAddon(prevState => ({
      ...prevState,
      discounts: selectedOptions,
    }));
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setAddon(prevState => ({ ...prevState, [name]: value }));
  };

  useEffect(() => {
    dispatch(
      getDiscounts({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );

    return () => {
      reset();
      setAddon({});
    };
  }, []);

  const saveEntity = (e, createNew = false) => {
    e.preventDefault();

    if (inputMode === 'normal') {
      const entity = {
        ...addon,
      };
      dispatch(createEntity(entity)).then((res) => {
        const payload = res.payload as any;
          const newGroupEntity = {
            ...addonGroup,
            addons: [...(addonGroup?.addons || []), {
              ...entity,
              id: payload?.data?.id,
            }],
          };
          dispatch(updateEntity(newGroupEntity));
      });
      setAddon({
        name: '',
        desc: '',
      });
    } else {
      if (!validateStringAddons(stringAddons)) {
        return;
      }
      
      const parsedAddons = parseStringAddons(stringAddons);
      
      dispatch(updateAddons({
        id: addonGroup?.id,
        addonGroupId: addonGroup?.id,
        addons: parsedAddons
      }));
      
      setStringAddons('');
      setStringValidationError('');
    }
    if (!createNew) {
      toggle();
    }
  };

  const discountsOptions = discounts.map(discount => ({
    label: `${discount.type === 'PERCENTAGE' ? `${discount.value}%` : `${discount.value} ${discount.type}`}`,
    id: discount.id,
    type: discount.type,
    value: discount.value,
  }));

  return (
    <Dialog open={isOpen} onOpenChange={toggle}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-sm">
            <Translate contentKey={'tempApp.addon.createNewAddon'}>Create New Addon</Translate>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-end mb-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => (inputMode === 'normal' ? setInputMode('string') : setInputMode('normal'))}
                >
                  <ArrowLeftRight className="h-3 w-3 mr-1" />
                  {inputMode === 'normal' ? (
                    <Translate contentKey={'tempApp.addon.string'}>String</Translate>
                  ) : (
                    <Translate contentKey={'tempApp.addon.normal'}>Normal</Translate>
                  )}
                </Button>
              </div>

              {inputMode === 'normal' ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="addon-name" className="text-xs">
                      <Translate contentKey={'tempApp.addon.name'}>Addon Name</Translate>
                    </Label>
                    <Input
                      type="text"
                      name="name"
                      required={true}
                      id="addon-name"
                      value={addon?.name || ''}
                      onChange={handleChange}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="addon-desc" className="text-xs">
                      <Translate contentKey={'tempApp.addon.description'}>Addon Description</Translate>
                    </Label>
                    <Input
                      type="text"
                      name="desc"
                      id="addon-desc"
                      value={addon?.desc || ''}
                      onChange={handleChange}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="addon-price" className="text-xs">
                      <Translate contentKey={'tempApp.addon.price'}>Addon Price</Translate>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      name="price"
                      id="addon-price"
                      value={addon?.price || ''}
                      onChange={(e) => setAddon(prevState => ({ ...prevState, price: parseFloat(e.target.value) || 0 }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs">
                      <Translate contentKey="tempApp.addon.discount">Discount</Translate>
                    </Label>
                    <Select
                      isMulti={true}
                      value={addon?.discounts}
                      options={discountsOptions}
                      onChange={handleDiscountsChange}
                      menuPortalTarget={document.body}
                      styles={{
                        control: (base) => ({ ...base, minHeight: '32px', fontSize: '0.75rem' }),
                        valueContainer: (base) => ({ ...base, padding: '0 8px' }),
                        input: (base) => ({ ...base, margin: 0, padding: 0 }),
                        menu: (base) => ({ ...base, fontSize: '0.75rem' }),
                        option: (base) => ({ ...base, fontSize: '0.75rem' }),
                        menuPortal: (base) => ({ ...base, zIndex: 9999 })
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <small className="text-xs text-muted-foreground">
                    Format: name1,name2@price2,name3@price3 (e.g., lettuce,tomato@2,cheese@5.10)
                  </small>
                  <Input
                    type="text"
                    name="stringAddons"
                    id="addon-string"
                    value={stringAddons}
                    onChange={e => {
                      setStringAddons(e.target.value);
                      if (stringValidationError) {
                        validateStringAddons(e.target.value);
                      }
                    }}
                    className={`h-8 text-xs ${stringValidationError ? 'border-destructive' : ''}`}
                    placeholder="lettuce,tomato@2,cheese@5.10,mustard,honey@3.99"
                  />
                  {stringValidationError && (
                    <small className="text-xs text-destructive">{stringValidationError}</small>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={toggle}
            >
              <Translate contentKey="common.buttons.cancel">Cancel</Translate>
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs"
              onClick={e => saveEntity(e, false)}
            >
              <Translate contentKey="tempApp.addon.createAddon">Create Addon</Translate>
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs"
              onClick={e => saveEntity(e, true)}
            >
              <Translate contentKey="tempApp.addon.createAndContinue">Create & Continue</Translate>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAddonModal;
