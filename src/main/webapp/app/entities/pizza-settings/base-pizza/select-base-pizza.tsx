import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Row, Col, FormGroup, Label, Input } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import Select from "react-select";
import { Translate } from "react-jhipster";
import { getEntity, updateEntity } from './base-pizza.reducer';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { FilterMatchMode } from 'primereact/api';
import { filterEntities } from 'app/entities/item/restaurant/pizza-item/pizza-item.reducer';
import { IPizzaItem } from 'app/shared/model/ITEM/restaurant/pizza-item.model';
import { IBasePizzaSettings } from 'app/shared/model/PIZZA/base-pizza-settings.model';


export const SelectBasePizza = () => {
    const [selectedPizza, setSelectedPizza] = useState(null);

    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const basePizza: IBasePizzaSettings = useAppSelector(state => state.basePizzaSettings.entity)
    const pizzaItemsList: IPizzaItem[] = useAppSelector(state => state.pizzaItem.entities);
    console.log(basePizza, 'basePizza')

    const handleClose = () => {
        navigate(-1);
    };

    const getBasePizzas = () => {
        const query = {
            first: 0,
            rows: 1000,
            page: 0,
            sortField: null,
            sortOrder: null,
            query: '',
            filters: {
                'variants[0].predefinedPizza.base': true
            }
        };

        const updatedQuery = applyMatchModeMap(query);
        dispatch(
            filterEntities({
                query: updatedQuery,
            })
        );
    };

    useEffect(() => {
        getBasePizzas();
        dispatch(getEntity({}));
    }, []);

    const saveEntity = (e) => {
        e.preventDefault()

        const entity = {
            key: "PIZZA_SETTINGS",
            value: {
                basePizza: {
                    id: selectedPizza?.value
                }
            }
        }

        dispatch(updateEntity(entity));
    }

    const handleChange = (selectedOption: IPizzaItem) => {
        setSelectedPizza(selectedOption);
    };

    return (
        <div>
            <Row>
                <Col md="8">
                    <h2>Select a base pizza</h2>
                </Col>
            </Row>
            <Row>
                <Col md="8" className="d-flex flex-column p-3 bg-white">

                    <form>
                        <FormGroup>
                            <div className={"d-flex flex-column"}>
                                <Select
                                    options={pizzaItemsList.filter(p => p.variants[0]?.predefinedPizza?.base).map(pizza => ({
                                        value: pizza.id, // Assuming each pizza has a unique `id`
                                        label: pizza.name, // Assuming each pizza has a `name` property
                                    }))}
                                    onChange={handleChange}
                                    value={selectedPizza}
                                    placeholder="Select a pizza"
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
                        <Button onClick={saveEntity} color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" >
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

export default SelectBasePizza;
