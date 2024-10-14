import React from 'react';
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Checkbox } from 'primereact/checkbox';
import { ActionCreatorWithOptionalPayload } from '@reduxjs/toolkit';
import { InputNumber } from 'primereact/inputnumber';
import { IBill } from 'app/shared/model/ORDER/bill.model';
import { useAppDispatch } from 'app/config/store';
interface OrderedItemsProps {
  dataTableValues: any;
  rowClick?: boolean;
  entity?: IBill;
  changeEntityField?: ActionCreatorWithOptionalPayload<{
    name: string;
    value: any;
  }, string>;
  refundMode?: boolean;
}

const OrderedItems = React.forwardRef<HTMLDivElement, OrderedItemsProps>(({
  dataTableValues,
  rowClick = false,
  entity = {},
  changeEntityField,
  refundMode = false
}, ref) => {
  const dispatch = useAppDispatch();

  const itemNameTemplate = (rowData) => {
    return (
      <div className={`${rowData?.isAddon ? 'ps-3' : 'fw-bold'}`}>{rowData?.isAddon && '+'} {rowData?.itemName}</div>
    )
  }

  const taxesTemplate = (rowData) => {
    if (Object.keys(rowData?.taxIdsToValues).length === 0) {
      return <span></span>
    }
    return (
      <div className="d-flex flex-column gap-2">
        {Object.keys(rowData?.taxIdsToValues).map((key) => (
          <div key={key} className="d-flex flex-column gap-2">
            {rowData?.taxIdsToValues[key].code} : {rowData?.taxIdsToValues[key].value?.toFixed(2)}
          </div>
        ))}
        <div className='ps-3 fw-bold'>Total : {rowData?.taxValue?.toFixed(2)}</div>
      </div>
    )
  }

  const discountTemplate = (rowData) => {
    if (!rowData?.discount) return null
    return (
      <div>
        {rowData.discount.value} {rowData.discount.type === "PERCENTAGE" && '%'}
      </div>
    )
  }
  const multiSelectTemplate = (rowData) => {
    if (rowData?.isAddon) return null
    return (
      <Checkbox
        inputId={`${rowData.id}`}
        checked={entity?.items?.some(item => item.id === rowData.id)}
        onChange={(e) => {
          dispatch(changeEntityField({
            name: 'items',
            value: [...entity.items, {
              id: rowData.id,
              amount: rowData.amount,
            }]
          }))
        }}
      />
    )
  }

  const refundQuantityTemplate = (rowData) => {
    if (rowData?.isAddon) return null
    return (
      <div>
        <InputNumber
          max={rowData.amount}
          min={0}
          value={rowData.amount}
          onChange={(e) => {
            dispatch(changeEntityField({
              name: 'items',
              value: [...entity.items, {
                id: rowData.id,
                amount: e.value,
              }]
            }))
          }}
        />
      </div>
    )
  }

  return (
    <div ref={ref} className="print-container">
      <style>
        {`
          @media print {
            body,
              html {
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden;
                box-sizing: border-box;
              }

            .print-container {
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden;
              box-sizing: border-box;
            }

            .p-datatable-table {
              width: 50% !important;
            }

            tbody,
            td,
            tfoot,
            th,
            thead,
            tr {
              border: 1px solid #ccc !important;
            }
          }
        `}
      </style>
      <DataTable
        value={dataTableValues}
        dataKey="id"
        tableStyle={{ minWidth: '100%' }}
        selectionMode={rowClick ? null : 'checkbox'}
        selection={entity?.items}
        onSelectionChange={(e) => changeEntityField({ name: 'items', value: e.value })}
        rowClassName={() => 'ctmBorder'}
      >
        {refundMode ? <Column headerStyle={{ width: '3rem' }} body={multiSelectTemplate}></Column> : null}
        {refundMode ? <Column header="Refund Quantity" headerStyle={{ width: '3rem' }} body={refundQuantityTemplate}></Column> : null}
        <Column headerStyle={{ width: '15%' }} style={{ width: '15%' }} field="itemName" header="Name" sortable body={itemNameTemplate} />
        <Column headerStyle={{ width: '15%' }} style={{ width: '15%' }} field="amount" header="Quantity" sortable />
        <Column headerStyle={{ width: '15%' }} style={{ width: '15%' }} field="price" header="Price" sortable />
        <Column headerStyle={{ width: '15%' }} style={{ width: '15%' }} field="taxIdsToValues" header="Taxes" sortable body={taxesTemplate} />
        <Column headerStyle={{ width: '15%' }} style={{ width: '15%' }} field="discount" header="Discount" sortable body={discountTemplate} />
        <Column headerStyle={{ width: '15%' }} style={{ width: '15%' }} field="total" header="Total" sortable />
      </DataTable>
    </div>
  );
});

export default OrderedItems;