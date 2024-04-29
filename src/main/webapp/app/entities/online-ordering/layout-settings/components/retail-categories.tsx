import { useAppDispatch, useAppSelector } from 'app/config/store';
import { searchEntities } from 'app/entities/term/retail-item-category/retail-item-category.reducer';
import { ITerm } from 'app/shared/model/term.model';
import { MultiSelect } from 'primereact/multiselect';
import React, { useEffect, useState } from 'react'
import { Button, Row, Spinner } from 'reactstrap';
import CategoriesLayout from './categories/categories';
import { ILayoutSettings } from 'app/shared/model/ONLINE_ORDERING/layout-settings';
import { TabPanel, TabView } from 'primereact/tabview';
import { CategoryLayout } from 'app/shared/model/ENUMS/categories-layout.model';
import { changeLayoutField } from '../../settings/settings.reducer';
import { Checkbox } from 'primereact/checkbox';

export const RetailCategories = ({
    retailCategorySetting
}: {
    retailCategorySetting: ILayoutSettings['retailCategorySetting'];
}) => {
    const dispatch = useAppDispatch();

    const categoriesOptions: ITerm[] = useAppSelector(state => state.retailCategory.entities);
    const loading = useAppSelector(state => state.retailCategory.loading);
    const updating = useAppSelector(state => state.retailCategory.updating);

    const [filterValue, setFilterValue] = useState<string>("");
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const debouncer = setTimeout(() => {
            dispatch(searchEntities({
                query: filterValue,
                sort: 'id,asc',
                page: 0,
                size: 10
            }))
        }, 300);

        return () => clearTimeout(debouncer);
    }, [filterValue]);

    const layouts = [
        {
            id: 1,
            name: 'layout 1',
            value: CategoryLayout.layoutOne
        },
        {
            id: 2,
            name: 'layout 2',
            value: CategoryLayout.layoutTwo
        }
    ]

    return (
        <div>
            {loading && <div className="d-flex my-5">
                <Spinner />
            </div>}
            <div>
                <MultiSelect
                    value={retailCategorySetting.categories}
                    onChange={(e) => dispatch(changeLayoutField({ name: "retailCategorySetting", value: { ...retailCategorySetting, categories: e.value } }))}
                    options={categoriesOptions}
                    optionLabel="name"
                    filter
                    placeholder="Select Categories"
                    maxSelectedLabels={5}
                    selectionLimit={5}
                    className="w-full md:w-20rem"
                    onFilter={(e) => {
                        setFilterValue(e.filter);
                    }}
                />
                <Row style={{
                    marginTop: '1rem'
                }}>
                    <div className="flex align-items-center">
                        <Checkbox
                            onChange={e => {
                                dispatch(changeLayoutField({
                                    name: "retailCategorySetting",
                                    value: {
                                        ...retailCategorySetting, showImages: e.checked
                                    }
                                }))
                            }
                            }
                            checked={retailCategorySetting.showImages}
                        />
                        <label htmlFor="ingredient1" className="ml-2">Show Images</label>
                    </div>
                </Row>
                <div>
                    <TabView activeIndex={activeIndex} onTabChange={(e) => {
                        setActiveIndex(e.index)
                        dispatch(changeLayoutField({
                            name: "retailCategorySetting",
                            value: {
                                ...retailCategorySetting, layout: layouts[e.index].value
                            }
                        }))
                    }}>
                        {layouts.map((layout, index) => (
                            <TabPanel key={layout.id} header={layout.name}>
                                <CategoriesLayout layout={layout.value} categories={retailCategorySetting.categories} />
                            </TabPanel>
                        ))}
                    </TabView>
                </div>
            </div>
        </div>
    )
}

