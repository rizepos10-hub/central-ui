import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import Select from 'app/shared/components/select/select';
import { Translate } from "react-jhipster";
import { changeEntityField, getEntity, updateEntity } from './pizza-settings.reducer';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { FilterMatchMode } from 'primereact/api';
import { filterEntities } from 'app/entities/item/restaurant/pizza-item/pizza-item.reducer';
import { IPizzaItem } from 'app/shared/model/ITEM/restaurant/pizza-item.model';
import { IPizzaSettings } from 'app/shared/model/PIZZA/pizza-settings.model';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { IBranch } from 'app/shared/model/branch.model';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';

export const PizzaSettings = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const pizzaSettings: IPizzaSettings = useAppSelector(state => state.pizzaSettings.entity);
    const pizzaItemsList: IPizzaItem[] = useAppSelector(state => state.pizzaItem.entities);
    const branchList: IBranch[] = useAppSelector(state => state.branch.entities);

    const getBasePizzas = () => {
        const query = {
            first: 0,
            rows: 1000,
            page: 0,
            sortField: null,
            sortOrder: null,
            query: '',
            filters: {
                'variants.pizzaVariantType': {
                    operator: 'OR',
                    constraints: [
                        { value: 'BASE', matchMode: FilterMatchMode.STARTS_WITH },
                        { value: 'MAKE_YOUR_OWN', matchMode: FilterMatchMode.STARTS_WITH }
                    ]
                },
            }
        };

        const updatedQuery = applyMatchModeMap(query);
        dispatch(filterEntities({ query: updatedQuery }));
    };

    useEffect(() => {
        getBasePizzas();
        dispatch(getEntity({}));
        dispatch(
            getBranches({
                page: 0,
                size: 1000,
                sort: `id,asc`,
            })
        );
    }, []);

    const saveEntity = (e) => {
        e.preventDefault();

        const entity = {
            key: "PIZZA_SETTINGS",
            basePizza: {
                id: pizzaSettings.basePizza?.id,
                itemVariantType: 'RESTAURANT_PIZZA'
            },
            makeYourOwnPizza: {
                id: pizzaSettings.makeYourOwnPizza?.id,
                itemVariantType: 'RESTAURANT_PIZZA'
            },
            pizzaSettingsByBranch: pizzaSettings.pizzaSettingsByBranch
        };

        dispatch(updateEntity(entity));
    };

    const basePizzaOptions = pizzaItemsList
        .filter(p => p.variants[0]?.pizzaVariantType === 'BASE')
        .map(pizza => ({
            value: pizza.id,
            label: pizza.name,
        }));

    const makeYourOwnPizzaOptions = pizzaItemsList
        .filter(p => p.variants[0]?.pizzaVariantType === 'MAKE_YOUR_OWN')
        .map(pizza => ({
            value: pizza.id,
            label: pizza.name,
        }));

    const selectedBasePizzaOption = pizzaSettings?.basePizza
        ? { value: pizzaSettings.basePizza.id, label: pizzaSettings.basePizza.name }
        : null;

    const selectedMakeYourOwnPizzaOption = pizzaSettings?.makeYourOwnPizza
        ? { value: pizzaSettings.makeYourOwnPizza.id, label: pizzaSettings.makeYourOwnPizza.name }
        : null;

    const fallbackOptions = [
        { label: 'Make Your Own', value: 'MAKE_YOUR_OWN' },
        { label: 'Base', value: 'BASE' },
        { label: 'Append additional toppings', value: 'APPEND_ADDITIONAL_TOPPINGS' }
    ];

    // Replace handleFallbackChange with a dynamic handler
    const handleBranchSettingChange = (branch, field, value) => {
        const currentSettings = pizzaSettings.pizzaSettingsByBranch || [];
        const branchIndex = currentSettings.findIndex(b => b.branch.id === branch.id);
        let newSettings;
        if (branchIndex >= 0) {
            newSettings = currentSettings.map(item =>
                item.branch.id === branch.id
                    ? { ...item, [field]: value }
                    : item
            );
        } else {
            newSettings = [
                ...currentSettings,
                { branch, [field]: value }
            ];
        }
        dispatch(changeEntityField({ name: 'pizzaSettingsByBranch', value: newSettings }));
    };

    const [activeTab, setActiveTab] = useState(branchList[0]?.id || '0');

    useEffect(() => {
        setActiveTab(branchList[0]?.id)
    }, [branchList])

    return (
        <PageWrapper>
            <div className="mb-4">
                <h2 className="text-lg font-semibold">Pizza Settings</h2>
            </div>
            <div className="max-w-4xl">
                <Card>
                    <CardContent className="p-4">
                        <form>
                            <div className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="basePizza" className="text-xs">Select a base pizza</Label>
                                    <Select
                                        options={basePizzaOptions}
                                        onChange={option => {
                                            const selectedPizza = pizzaItemsList.find(p => p.id === option.value);
                                            dispatch(changeEntityField({ name: 'basePizza', value: selectedPizza }));
                                        }}
                                        value={selectedBasePizzaOption}
                                        placeholder="Select a base pizza"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="makeYourOwnPizza" className="text-xs">Select a Make Your Own pizza</Label>
                                    <Select
                                        options={makeYourOwnPizzaOptions}
                                        onChange={option => {
                                            const selectedPizza = pizzaItemsList.find(p => p.id === option.value);
                                            dispatch(changeEntityField({ name: 'makeYourOwnPizza', value: selectedPizza }));
                                        }}
                                        value={selectedMakeYourOwnPizzaOption}
                                        placeholder="Select a make your own pizza"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label className="text-xs">Branch Settings</Label>
                                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                                        <TabsList className="w-full justify-start overflow-x-auto">
                                            {branchList.map((branch) => (
                                                <TabsTrigger key={branch.id} value={branch.id} className="text-xs">
                                                    {branch.name}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                        {branchList.map((branch) => {
                                            const branchSetting = pizzaSettings.pizzaSettingsByBranch
                                                ? pizzaSettings.pizzaSettingsByBranch.find(b => b.branch.id === branch.id)
                                                : null;
                                            const selectedFallback = branchSetting
                                                ? fallbackOptions.find(opt => opt.value === branchSetting.selectedPizzaFallbackOption)
                                                : null;
                                            return (
                                                <TabsContent key={branch.id} value={branch.id} className="space-y-4 mt-4">
                                                    <div className="flex flex-col gap-2">
                                                        <Label htmlFor={`fallback-${branch.id}`} className="text-xs">Default fallback to</Label>
                                                        <Select
                                                            options={fallbackOptions}
                                                            onChange={option => handleBranchSettingChange(branch, 'selectedPizzaFallbackOption', option.value)}
                                                            value={selectedFallback}
                                                            placeholder="Select fallback default"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox
                                                            id={`toppings-${branch.id}`}
                                                            checked={branchSetting?.showToppingsOnPredefinedPizza === true}
                                                            onCheckedChange={(checked) => handleBranchSettingChange(branch, 'showToppingsOnPredefinedPizza', checked === true)}
                                                        />
                                                        <Label htmlFor={`toppings-${branch.id}`} className="text-xs cursor-pointer">
                                                            Show Toppings on predefined pizza
                                                        </Label>
                                                    </div>
                                                </TabsContent>
                                            );
                                        })}
                                    </Tabs>
                                </div>
                            </div>
                            <div className="mt-4">
                                <Button onClick={saveEntity} id="save-entity" data-cy="entityCreateSaveButton" type="submit" className="h-8 text-xs">
                                    <Save className="h-4 w-4" />
                                    <Translate contentKey="entity.action.save">Save</Translate>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </PageWrapper>
    );
};

export default PizzaSettings;
