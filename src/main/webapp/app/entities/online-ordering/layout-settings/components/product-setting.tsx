import { useAppDispatch, useAppSelector } from 'app/config/store';
import React, { useEffect, useState } from 'react'
import { IItem } from 'app/shared/model/ITEM/item.model';
import { MultiSelect } from 'primereact/multiselect';
import { searchEntities } from 'app/entities/item/all-items.reducer';
import { FormGroup, Input, Label, Row, Spinner } from 'reactstrap';
import { translate } from 'react-jhipster';
import { Checkbox } from 'primereact/checkbox';
import LayoutOne from './items/layout-one/layout-one';
import { ILayoutSettings } from 'app/shared/model/ONLINE_ORDERING/layout-settings';
import { changeLayoutField } from '../../settings/settings.reducer';

const ProductSetting = ({
    productSetting
}: {
    productSetting: ILayoutSettings['productSetting']
}) => {
    const dispatch = useAppDispatch();
    const items: IItem[] = useAppSelector(state => state.allItems.entities);
    const loading = useAppSelector((state) => state.allItems.loading);

    const [filterValue, setFilterValue] = useState<string>("");

    useEffect(() => {
        const debouncer = setTimeout(() => {
            dispatch(searchEntities({
                query: filterValue,
                sort: 'id,asc',
                page: 0,
                size: 10,
                taxonomyName: 'retail-item-category'
            }))
        }, 300);

        return () => clearTimeout(debouncer);
    }, [filterValue]);


    return (
        <div>
            <Row>
                <MultiSelect
                    value={productSetting.FEATURED.items}
                    onChange={(e) => {
                        dispatch(changeLayoutField({
                            name: "productSetting",
                            value: { ...productSetting, FEATURED: { ...productSetting.FEATURED, items: e.value } }
                        }))
                    }}
                    options={items}
                    optionLabel="name"
                    filter
                    placeholder="Select Products"
                    maxSelectedLabels={5}
                    selectionLimit={5}
                    className="w-full md:w-20rem"
                    onFilter={(e) => {
                        setFilterValue(e.filter);
                    }}
                />
            </Row>
            <Row style={{ 
                marginTop: '1rem'
             }}>
                <div className="flex align-items-center">
                    <Checkbox
                        onChange={e => {
                            dispatch(changeLayoutField({
                                name: "productSetting",
                                value: {
                                    ...productSetting, FEATURED: {
                                        ...productSetting.FEATURED,
                                        showImages: e.checked
                                    }
                                }
                            }))
                        }}
                        checked={productSetting.FEATURED.showImages} />
                    <label htmlFor="ingredient1" className="ml-2">Show Images</label>
                </div>
            </Row>
            {/* <LayoutOne items={items}/> */}
        </div>
    )
}

export default ProductSetting