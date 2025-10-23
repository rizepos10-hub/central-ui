import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities, searchEntities } from 'app/entities/term/restaurant-Item-category/item-restaurant-category.reducer';
import { ITerm } from 'app/shared/model/term.model';
import React, { useEffect, useState } from 'react'
import CategoriesLayout from './categories/categories';
import { ILayoutSettings } from 'app/shared/model/ONLINE_ORDERING/layout-settings';
import { Layout } from 'app/shared/model/ENUMS/layout.model';
import { changeLayoutField } from '../../settings/settings.reducer';
import { debounce } from 'lodash';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw } from 'lucide-react';
import Select from 'app/shared/components/select/select';

export const RestaurantCategories = ({
    restuarantCategorySetting,
}: {
    restuarantCategorySetting: ILayoutSettings['restuarantCategorySetting'];
}) => {
    const dispatch = useAppDispatch();

    const categoryOptions: ITerm[] = useAppSelector(state => state.restaurantCategory.entities);
    const loading = useAppSelector(state => state.restaurantCategory.loading);
    const updating = useAppSelector(state => state.restaurantCategory.updating);

    const [activeTab, setActiveTab] = useState('layout-1');
    const [filterValue, setFilterValue] = useState<string>("");

    useEffect(() => {
        const handleFilter = debounce(() => {
            dispatch(searchEntities({
                query: filterValue,
                sort: 'id,asc',
                page: 0,
                size: 10,
            }))
        }, 500);

        handleFilter();

        return () => {
            handleFilter.cancel();
        };
    }, [filterValue]);

    const layouts = [
        {
            id: 1,
            name: 'Layout 1',
            value: Layout.layoutOne,
            tabValue: 'layout-1'
        },
        {
            id: 2,
            name: 'Layout 2',
            value: Layout.layoutTwo,
            tabValue: 'layout-2'
        }
    ]

    const handleLayoutChange = (tabValue: string) => {
        setActiveTab(tabValue);
        const selectedLayout = layouts.find(l => l.tabValue === tabValue);
        if (selectedLayout) {
            dispatch(changeLayoutField({
                name: "restuarantCategorySetting",
                value: {
                    ...restuarantCategorySetting, layout: selectedLayout.value
                }
            }))
        }
    }

    return (
        <div className="space-y-4">
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="category-title" className="text-xs font-semibold">
                            Title
                        </Label>
                        <Input
                            id="category-title"
                            value={restuarantCategorySetting.title || ''}
                            onChange={e => dispatch(changeLayoutField({
                                name: "restuarantCategorySetting",
                                value: { ...restuarantCategorySetting, title: e.target.value }
                            }))}
                            className="h-8 text-xs"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold">
                            Select Categories (Max 5)
                        </Label>
                        <Select
                            isMulti
                            value={restuarantCategorySetting.categories || []}
                            onChange={(selected) => dispatch(changeLayoutField({
                                name: "restuarantCategorySetting",
                                value: { ...restuarantCategorySetting, categories: selected as ITerm[] }
                            }))}
                            options={categoryOptions}
                            getOptionLabel={(option) => option.name}
                            getOptionValue={(option) => option.id}
                            placeholder="Select Categories"
                            className="text-xs"
                            isOptionDisabled={() => (restuarantCategorySetting.categories?.length || 0) >= 5}
                            onInputChange={(value) => setFilterValue(value)}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="show-images"
                            checked={restuarantCategorySetting.showImages}
                            onCheckedChange={(checked) => {
                                dispatch(changeLayoutField({
                                    name: "restuarantCategorySetting",
                                    value: {
                                        ...restuarantCategorySetting, showImages: checked as boolean
                                    }
                                }))
                            }}
                        />
                        <Label htmlFor="show-images" className="text-xs font-normal cursor-pointer">
                            Show Images
                        </Label>
                    </div>

                    <div>
                        <Tabs value={activeTab} onValueChange={handleLayoutChange}>
                            <TabsList className="grid w-full grid-cols-2">
                                {layouts.map((layout) => (
                                    <TabsTrigger key={layout.id} value={layout.tabValue} className="text-xs">
                                        {layout.name}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            {layouts.map((layout) => (
                                <TabsContent key={layout.id} value={layout.tabValue} className="mt-4">
                                    <CategoriesLayout
                                        layout={layout.value}
                                        categories={restuarantCategorySetting.categories}
                                    />
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>
                </div>
            )}
        </div>
    )
}
