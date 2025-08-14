import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import Select from "react-select";
import { Translate } from "react-jhipster";
import { changeEntityField, getEntity, updateEntity } from './pizza-settings.reducer';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { FilterMatchMode } from 'primereact/api';
import { filterEntities } from 'app/entities/item/restaurant/pizza-item/pizza-item.reducer';
import { IPizzaItem } from 'app/shared/model/ITEM/restaurant/pizza-item.model';
import { IPizzaSettings } from 'app/shared/model/PIZZA/pizza-settings.model';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { IBranch } from 'app/shared/model/branch.model';
import { TabPanel, TabView } from 'primereact/tabview';
import { Checkbox } from 'primereact/checkbox';

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
        { label: 'Base', value: 'BASE' }
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

    return (
        <div>
            <Row>
                <Col md="8">
                    <h2>Pizza Settings</h2>
                </Col>
            </Row>
            <Row>
                <Col md="8" className="d-flex flex-column p-3 bg-white">
                    <form>
                        <FormGroup>
                            <div className="d-flex flex-column">
                                <Label for="basePizza">Select a base pizza</Label>
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
                        </FormGroup>
                        <FormGroup>
                            <div className="d-flex flex-column">
                                <Label for="makeYourOwnPizza">Select a Make Your Own pizza</Label>
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
                        </FormGroup>
                        <FormGroup>
                            <div className="d-flex flex-column">
                                <TabView scrollable>
                                    {branchList.map((branch, idx) => {
                                        const branchSetting = pizzaSettings.pizzaSettingsByBranch
                                            ? pizzaSettings.pizzaSettingsByBranch.find(b => b.branch.id === branch.id)
                                            : null;
                                        const selectedFallback = branchSetting
                                            ? fallbackOptions.find(opt => opt.value === branchSetting.selectedPizzaFallbackOption)
                                            : null;
                                        return (
                                            <TabPanel header={branch.name} key={idx} className='d-flex flex-column gap-2'>
                                                <div>
                                                    <Label for="pizzaSettingsByBranch">Default fallback to</Label>
                                                    <Select
                                                        options={fallbackOptions}
                                                        onChange={option => handleBranchSettingChange(branch, 'selectedPizzaFallbackOption', option.value)}
                                                        value={selectedFallback}
                                                        placeholder="Select fallback default"
                                                    />
                                                </div>
                                                <div className='d-flex flex-column'>
                                                    <Label for="showToppingsOnPredefinedPizza">Show Toppings on predefined pizza</Label>
                                                    <Checkbox 
                                                        checked={branchSetting?.showToppingsOnPredefinedPizza || false}
                                                        value={branchSetting?.showToppingsOnPredefinedPizza || false}
                                                        onChange={e => handleBranchSettingChange(branch, 'showToppingsOnPredefinedPizza', e.checked)}
                                                    />
                                                </div>
                                            </TabPanel>
                                        );
                                    })}
                                </TabView>
                            </div>
                        </FormGroup>
                        &nbsp;
                        <Button onClick={saveEntity} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit">
                            <FontAwesomeIcon icon="save" />
                            &nbsp;
                            <Translate contentKey="entity.action.save">Save</Translate>
                        </Button>
                    </form>
                </Col>
            </Row>
        </div>
    );
};

export default PizzaSettings;
