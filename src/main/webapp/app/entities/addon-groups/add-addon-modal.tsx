import React, { useState, useEffect } from 'react';
import { getSortState, Translate } from 'react-jhipster';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { createEntity, reset as resetAddon } from '../addon/addon.reducer';
import { getEntities as getDiscounts } from 'app/entities/discount/discount.reducer';
import Select from 'app/shared/components/select/select';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { IAddon } from 'app/shared/model/ADDON/addon.model';
import { getEntities as getAddons } from 'app/entities/addon/addon.reducer';
import { getEntity, updateAddons, updateEntity, excludeAddonsFromItems } from './addon-groups.reducer';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { getEntities as getProfileGroups } from "app/entities/settings/profile-group/profile-group.reducer";
import { ArrowLeftRight } from 'lucide-react';
import { toast } from 'react-toastify';

export const CreateAddonModal = ({ isOpen, toggle, addonGroup }) => {
  const dispatch = useAppDispatch();
  const [inputMode, setInputMode] = useState<'normal' | 'string'>('normal');
  const [stringAddons, setStringAddons] = useState<string>('');
  const [stringValidationError, setStringValidationError] = useState<string>('');
  const [excludePrompt, setExcludePrompt] = useState<{
    open: boolean;
    mode: 'normal' | 'string';
    addonIds: string[];
    continueCreating: boolean;
    pendingStringAddons?: any[];
  }>({ open: false, mode: 'normal', addonIds: [], continueCreating: false });

  const discounts = useAppSelector(state => state.discount.entities);
  const profileGroups = useAppSelector(state => state.profileGroup.entities);

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

    dispatch(getProfileGroups({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));

    return () => {
      dispatch(resetAddon());
      setAddon({});
    };
  }, []);

  const askExcludeOrKeep = (addonIds: string[], continueCreating: boolean) => {
    if (!addonGroup?.id || addonIds.length === 0) {
      if (!continueCreating) toggle();
      return;
    }
    setExcludePrompt({ open: true, mode: 'normal', addonIds, continueCreating });
  };

  const finishExcludePrompt = async (exclude: boolean) => {
    const prompt = excludePrompt;
    setExcludePrompt({ open: false, mode: 'normal', addonIds: [], continueCreating: false });

    if (prompt.mode === 'string') {
      if (!addonGroup?.id || !prompt.pendingStringAddons?.length) return;
      try {
        await dispatch(
          updateAddons({
            id: addonGroup.id,
            addonGroupId: addonGroup.id,
            addons: prompt.pendingStringAddons,
            excludeFromExistingItems: exclude,
          })
        ).unwrap();
        toast.success(
          exclude ? 'Addons created and excluded from existing items' : 'Addons created and included on existing items'
        );
        setStringAddons('');
        setStringValidationError('');
        dispatch(getEntity(addonGroup.id));
        if (!prompt.continueCreating) toggle();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to create addons');
      }
      return;
    }

    if (exclude && addonGroup?.id && prompt.addonIds.length > 0) {
      try {
        const result = await dispatch(excludeAddonsFromItems({ id: addonGroup.id, addonIds: prompt.addonIds })).unwrap();
        toast.success(`Excluded from ${result.data ?? 0} item(s) using this group`);
      } catch (error: any) {
        toast.error(error?.message || 'Failed to exclude addons from related items');
      }
    }
    if (!prompt.continueCreating) {
      toggle();
    }
  };

  const saveEntity = (e, createNew = false) => {
    e.preventDefault();

    if (inputMode === 'normal') {
      const entity = {
        ...addon,
      };
      dispatch(createEntity(entity)).then(res => {
        const payload = res.payload as any;
        const newAddonId = payload?.data?.id;
        const newGroupEntity = {
          ...addonGroup,
          addons: [
            ...(addonGroup?.addons || []),
            {
              ...entity,
              id: newAddonId,
            },
          ],
        };
        dispatch(updateEntity(newGroupEntity)).then(() => {
          askExcludeOrKeep(newAddonId ? [newAddonId] : [], createNew);
        });
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
      setExcludePrompt({
        open: true,
        mode: 'string',
        addonIds: [],
        continueCreating: createNew,
        pendingStringAddons: parsedAddons,
      });
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
                      value={addon?.price ?? ''}
                      onChange={(e) => setAddon(prevState => ({ ...prevState, price: parseFloat(e.target.value) ?? 0 }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="addon-profileGroup" className="text-xs">
                      <Translate contentKey={'common.profileGroup'}>Profile Group</Translate>
                    </Label>
                    <Select
                      value={addon?.accountingGroups?.[0] || null}
                      options={profileGroups}
                      id="addon-profileGroup"
                      getOptionLabel={option => option.name}
                      getOptionValue={option => option.id}
                      onChange={selectedProfileGroup => setAddon(prevState => ({ ...prevState, accountingGroups: selectedProfileGroup ? [selectedProfileGroup] : [] }))}
                      isClearable
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

      <AlertDialog open={excludePrompt.open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exclude from existing items?</AlertDialogTitle>
            <AlertDialogDescription>
              Items that already use this addon group will include the new addon by default (checked). Exclude it from those items so it
              stays unchecked until enabled per item?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={e => {
                e.preventDefault();
                finishExcludePrompt(false);
              }}
            >
              Keep included (checked)
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={e => {
                e.preventDefault();
                finishExcludePrompt(true);
              }}
            >
              Exclude from existing items
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default CreateAddonModal;
