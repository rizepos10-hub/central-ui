import React, { useState, useEffect } from "react";

import { useAppDispatch, useAppSelector } from "app/config/store";
import { IItem } from 'app/shared/model/ITEM/item.model';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button as PrimeButton } from 'primereact/button';
import { initialItemFilterState } from 'app/shared/model/filter-state.model';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import _ from 'lodash';
import DropDownFilter from 'app/shared/components/filter/drop-down-filter';
import { Link, useParams } from "react-router-dom";
import { translate } from "react-jhipster";
import { FilterMatchMode } from "primereact/api";
import { Dropdown } from "primereact/dropdown";

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

    const getEntities = () => {
        const updatedQuery = applyMatchModeMap(query);

        dispatch(fetchEntities({
            query: updatedQuery,
        }));
    }

    useEffect(() => {
        getEntities()
    }, [query, dispatch]);

    const onPage = (event) => {
        setQuery(prev => ({ ...prev, first: event.first, page: event.page }));
    };

    const onFilter = (event) => {
        _.debounce(() => {
            setQuery({ ...query, filters: event.filters, first: 0, page: 0 });
        }, 300)();
    };

    const actionsBody = (rowData) => {
        const updating = isUpdating.value && (rowData.id === isUpdating.id);

        const fieldAssigned = getFieldAssigned(rowData);

        if (fieldAssigned) {
            return (
                <div>
                    <PrimeButton
                        label="Unassign"
                        icon="pi pi-minus"
                        severity='success'
                        className="p-button-text p-button-rounded p-button-plain"
                        onClick={() => onUnassign(rowData)}
                        key={rowData.id}
                        loading={updating}
                    />
                </div>
            )
        }
        return (
            <div>
                <PrimeButton
                    label="Assign"
                    icon="pi pi-plus"
                    severity='warning'
                    className="p-button-text p-button-rounded p-button-plain"
                    onClick={() => onAssign(rowData)}
                    key={rowData.id}
                    loading={updating}
                />
            </div>
        )
    }

    const onAssign = (rowData) => {
        assignNewEntity(rowData);
    }

    const onUnassign = (rowData) => {
        unassignNewEntity(rowData);
    }

    const nameColumnTemplate = rowData => {
        const editUrl = `/restaurant/regular/${rowData.id}/edit`;
        return (
            <Link to={editUrl}>
                {rowData.name}
            </Link>
        );
    };

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

    const assignmentOptions = [
        { label: 'All', value: null },
        { label: 'Assigned', value: 'assigned' },
        { label: 'Unassigned', value: 'unassigned' }
    ];

    const getAssignmentFilterValue = () => {
        const filter = query.filters?.["addonGroups.addonGroup.id"];
        if (filter?.value === id) {
            if (filter.matchMode === FilterMatchMode.EQUALS) {
                return 'assigned';
            }
            if (filter.matchMode === FilterMatchMode.NOT_EQUALS) {
                return 'unassigned';
            }
        }
        return null;
    }

    const onAssignmentFilterChange = e => {
        const selection = e.value;
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


    return (
        <DataTable
            loading={loading}
            value={items}
            sortField={query.sortField}
            editMode="row"
            filters={query.filters}
            filterDisplay="row"
            paginator
            totalRecords={totalItems}
            rows={20}
            lazy
            first={query.first}
            onPage={onPage}
            onFilter={onFilter}
            showGridlines
            scrollHeight="400px"
        >
            <Column
                field="name"
                header={translate('items.view.fields.name')}
                filter
                filterField={"name"}
                filterHeaderStyle={{ width: '400px' }}
                body={nameColumnTemplate}
                filterPlaceholder={translate('items.view.filters.name')}
            />

            <Column
                header="Category"
                field="categories"
                body={rowData => rowData?.categories?.map(cat => cat?.name).join(" | ")}
                filter
                showFilterMatchModes={false}
                filterElement={
                    <DropDownFilter
                        dropDownOptionType={"RESTAURANT_CATEGORY"}
                        selectedOption={query?.filters?.["categories.id"]?.value}
                        fieldName={"categories.id"}
                        handleDropdownChange={handleFilterChange}
                    />
                }
            />
            <Column
                header="Actions"
                body={actionsBody}
                style={{ width: '100px' }}
                filter
                filterElement={
                    <Dropdown
                        value={getAssignmentFilterValue()}
                        options={assignmentOptions}
                        onChange={onAssignmentFilterChange}
                        placeholder="Filter by assignment"
                        showClear
                    />
                }
            />
        </DataTable>
    );
}