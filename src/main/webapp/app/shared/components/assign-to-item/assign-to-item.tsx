import React, { useState, useEffect } from "react";

import { useAppDispatch, useAppSelector } from "app/config/store";
import { IItem } from 'app/shared/model/ITEM/item.model';
import { initialItemFilterState } from 'app/shared/model/filter-state.model';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import _ from 'lodash';
import DropDownFilter from 'app/shared/components/filter/drop-down-filter';
import { Link, useParams } from "react-router-dom";
import { translate } from "react-jhipster";
import { FilterMatchMode } from "primereact/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Select from 'app/shared/components/select/select';
import { Plus, Minus, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

export const ItemsTable = ({
    items,
    loading,
    totalItems,
    fetchEntities,
    assignNewEntity,
    unassignNewEntity,
    isUpdating,
    getFieldAssigned,
    query,
    setQuery
}: {
    items: IItem[];
    loading: boolean;
    totalItems: number;
    fetchEntities: any;
    assignNewEntity: any;
    unassignNewEntity: any;
    isUpdating: {
        value: boolean;
        id: string;
    };
    getFieldAssigned: any;
    query: any;
    setQuery: any;
}) => {
    const { id } = useParams<'id'>();
    const dispatch = useAppDispatch();
    const [nameFilter, setNameFilter] = useState('');

    const getEntities = () => {
        const updatedQuery = applyMatchModeMap(query);

        dispatch(fetchEntities({
            query: updatedQuery,
        }));
    }

    useEffect(() => {
        getEntities()
    }, [query, dispatch]);

    const handleFilterChange = (field, value) => {
        setQuery(prev => ({
            ...prev,
            filters: {
                ...prev.filters,
                [field]: {
                    ...prev.filters[field],
                    value: value?.value,
                    matchMode: FilterMatchMode.EQUALS
                }
            }
        }));
    };

    const handleNameFilterChange = _.debounce((value) => {
        setQuery(prev => ({
            ...prev,
            first: 0,
            page: 0,
            filters: {
                ...prev.filters,
                name: {
                    value: value,
                    matchMode: FilterMatchMode.CONTAINS
                }
            }
        }));
    }, 300);

    const assignmentOptions = [
        { label: 'All', value: null },
        { label: 'Assigned', value: 'assigned' },
        { label: 'Unassigned', value: 'unassigned' }
    ];

    const getAssignmentFilterValue = () => {
        const filter = query.filters?.["addonGroups.addonGroup.id"];
        if (filter?.value === id) {
            if (filter.matchMode === FilterMatchMode.EQUALS) {
                return assignmentOptions[1];
            }
            if (filter.matchMode === FilterMatchMode.NOT_EQUALS) {
                return assignmentOptions[2];
            }
        }
        return assignmentOptions[0];
    }

    const onAssignmentFilterChange = (option) => {
        const selection = option?.value;
        const field = "addonGroups.addonGroup.id";
        let filterValue = null;
        let matchMode = FilterMatchMode.EQUALS;

        if (selection === 'assigned') {
            filterValue = id;
        } else if (selection === 'unassigned') {
            filterValue = id;
            matchMode = FilterMatchMode.NOT_EQUALS;
        }

        setQuery(prev => ({
            ...prev,
            filters: {
                ...prev.filters,
                [field]: {
                    ...prev.filters[field],
                    value: filterValue,
                    matchMode
                }
            }
        }));
    };

    const onAssign = (rowData) => {
        assignNewEntity(rowData);
    }

    const onUnassign = (rowData) => {
        unassignNewEntity(rowData);
    }

    const currentPage = Math.floor(query.first / 20) + 1;
    const totalPages = Math.ceil(totalItems / 20);

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <Input
                    placeholder={translate('items.view.filters.name')}
                    className="h-8 text-xs max-w-xs"
                    value={nameFilter}
                    onChange={(e) => {
                        setNameFilter(e.target.value);
                        handleNameFilterChange(e.target.value);
                    }}
                />
                <div className="w-48">
                    <DropDownFilter
                        dropDownOptionType={"RESTAURANT_CATEGORY"}
                        selectedOption={query?.filters?.["categories.id"]?.value}
                        fieldName={"categories.id"}
                        handleDropdownChange={handleFilterChange}
                    />
                </div>
                <div className="w-48">
                    <Select
                        value={getAssignmentFilterValue()}
                        options={assignmentOptions}
                        onChange={onAssignmentFilterChange}
                        placeholder="Filter by assignment"
                        isClearable
                    />
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-xs">{translate('items.view.fields.name')}</TableHead>
                            <TableHead className="text-xs">Category</TableHead>
                            <TableHead className="text-xs w-32">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-xs py-8">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-xs py-8">
                                    No items found
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => {
                                const updating = isUpdating.value && (item.id === isUpdating.id);
                                const fieldAssigned = getFieldAssigned(item);

                                return (
                                    <TableRow key={item.id}>
                                        <TableCell className="text-xs">
                                            <Link to={`/restaurant/regular/${item.id}/edit`} className="text-primary hover:underline">
                                                {item.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {item?.categories?.map(cat => cat?.name).join(" | ")}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {fieldAssigned ? (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs text-green-600 hover:text-green-700"
                                                    onClick={() => onUnassign(item)}
                                                    disabled={updating}
                                                >
                                                    {updating ? (
                                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                    ) : (
                                                        <Minus className="h-3 w-3 mr-1" />
                                                    )}
                                                    Unassign
                                                </Button>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs text-orange-600 hover:text-orange-700"
                                                    onClick={() => onAssign(item)}
                                                    disabled={updating}
                                                >
                                                    {updating ? (
                                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                    ) : (
                                                        <Plus className="h-3 w-3 mr-1" />
                                                    )}
                                                    Assign
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                    Showing {items.length === 0 ? 0 : query.first + 1} to {Math.min(query.first + 20, totalItems)} of {totalItems} items
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setQuery(prev => ({ ...prev, first: Math.max(0, prev.first - 20), page: Math.max(0, prev.page - 1) }))}
                        disabled={query.first === 0}
                    >
                        <ChevronLeft className="h-3 w-3 mr-1" />
                        Previous
                    </Button>
                    <span className="text-xs">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setQuery(prev => ({ ...prev, first: prev.first + 20, page: prev.page + 1 }))}
                        disabled={query.first + 20 >= totalItems}
                    >
                        Next
                        <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
