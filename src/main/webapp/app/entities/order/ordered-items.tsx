import React from 'react';
import { ActionCreatorWithOptionalPayload } from '@reduxjs/toolkit';
import { IBill } from 'app/shared/model/ORDER/bill.model';
import { useAppDispatch } from 'app/config/store';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

  const handleCheckboxChange = (rowData: any, checked: boolean) => {
    if (checked) {
      dispatch(changeEntityField({
        name: 'items',
        value: [...(entity.items || []), {
          id: rowData.id,
          amount: rowData.amount,
        }]
      }));
    } else {
      dispatch(changeEntityField({
        name: 'items',
        value: (entity.items || []).filter(item => item.id !== rowData.id)
      }));
    }
  };

  const handleQuantityChange = (rowData: any, value: string) => {
    const numValue = parseInt(value) ?? 0;
    const clampedValue = Math.max(0, Math.min(numValue, rowData.amount));

    const existingItemIndex = (entity.items || []).findIndex(item => item.id === rowData.id);
    const updatedItems = [...(entity.items || [])];

    if (existingItemIndex >= 0) {
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        amount: clampedValue
      };
    } else {
      updatedItems.push({
        id: rowData.id,
        amount: clampedValue,
      });
    }

    dispatch(changeEntityField({
      name: 'items',
      value: updatedItems
    }));
  };

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

            .print-table {
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
      <div className="border rounded-md">
        <Table className="print-table">
          <TableHeader>
            <TableRow>
              {refundMode && <TableHead className="w-12 text-xs"></TableHead>}
              {refundMode && <TableHead className="text-xs">Refund Quantity</TableHead>}
              <TableHead className="w-[15%] text-xs">Name</TableHead>
              <TableHead className="w-[15%] text-xs">Quantity</TableHead>
              <TableHead className="w-[15%] text-xs">Price</TableHead>
              <TableHead className="w-[15%] text-xs">Taxes</TableHead>
              <TableHead className="w-[15%] text-xs">Discount</TableHead>
              <TableHead className="w-[15%] text-xs">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataTableValues?.map((rowData: any) => (
              <TableRow key={rowData.id} className="ctmBorder">
                {refundMode && (
                  <TableCell>
                    {!rowData?.isAddon && (
                      <Checkbox
                        checked={entity?.items?.some(item => item.id === rowData.id)}
                        onCheckedChange={(checked) => handleCheckboxChange(rowData, checked as boolean)}
                      />
                    )}
                  </TableCell>
                )}
                {refundMode && (
                  <TableCell>
                    {!rowData?.isAddon && (
                      <Input
                        type="number"
                        max={rowData.amount}
                        min={0}
                        value={entity?.items?.find(item => item.id === rowData.id)?.amount || rowData.amount}
                        onChange={(e) => handleQuantityChange(rowData, e.target.value)}
                        className="h-7 text-xs w-20"
                      />
                    )}
                  </TableCell>
                )}
                <TableCell className={`text-xs ${rowData?.isAddon ? 'pl-6' : 'font-bold'}`}>
                  {rowData?.isAddon && '+'} {rowData?.itemName}
                </TableCell>
                <TableCell className="text-xs">{rowData?.amount}</TableCell>
                <TableCell className="text-xs">{rowData?.price}</TableCell>
                <TableCell className="text-xs">
                  {Object.keys(rowData?.taxIdsToValues || {}).length > 0 && (
                    <div className="flex flex-col gap-1">
                      {Object.keys(rowData.taxIdsToValues).map((key) => (
                        <div key={key}>
                          {rowData.taxIdsToValues[key].code} : {rowData.taxIdsToValues[key].value?.toFixed(2)}
                        </div>
                      ))}
                      <div className="pl-3 font-bold">Total : {rowData?.taxValue?.toFixed(2)}</div>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {rowData?.discount && (
                    <div>
                      {rowData.discount.value} {rowData.discount.type === "PERCENTAGE" && '%'}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-xs">{rowData?.total}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});

export default OrderedItems;
