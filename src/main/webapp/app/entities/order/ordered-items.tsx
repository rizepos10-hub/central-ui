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

  const formatNumber = (value?: number | string | null) => {
    if (value === null || value === undefined || value === '') {
      return '0.00';
    }

    const numericValue = typeof value === 'number' ? value : Number(value);
    return Number.isNaN(numericValue) ? String(value) : numericValue.toFixed(2);
  };

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
    const numValue = parseInt(value, 10) ?? 0;
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
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <Table className="print-table">
          <TableHeader>
            <TableRow className="border-b border-slate-100 bg-slate-50/80 hover:bg-slate-50/80">
              {refundMode && <TableHead className="w-12 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400"></TableHead>}
              {refundMode && <TableHead className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Refund Qty</TableHead>}
              <TableHead className="w-[34%] text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Item</TableHead>
              <TableHead className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Qty</TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Price</TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Tax</TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Discount</TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataTableValues?.map((rowData: any) => (
              <TableRow
                key={rowData.id}
                className={`border-b border-slate-100 align-top hover:bg-slate-50/50 ${rowData?.isAddon ? 'bg-slate-50/70' : 'bg-white'}`}
              >
                {refundMode && (
                  <TableCell className="px-4 py-4">
                    {!rowData?.isAddon && (
                      <Checkbox
                        checked={entity?.items?.some(item => item.id === rowData.id)}
                        onCheckedChange={(checked) => handleCheckboxChange(rowData, checked as boolean)}
                      />
                    )}
                  </TableCell>
                )}
                {refundMode && (
                  <TableCell className="px-4 py-4">
                    {!rowData?.isAddon && (
                      <Input
                        type="number"
                        max={rowData.amount}
                        min={0}
                        value={entity?.items?.find(item => item.id === rowData.id)?.amount || rowData.amount}
                        onChange={(e) => handleQuantityChange(rowData, e.target.value)}
                        className="h-9 w-20 rounded-xl border-slate-200 text-xs"
                      />
                    )}
                  </TableCell>
                )}
                <TableCell className={`px-4 py-4 text-xs ${rowData?.isAddon ? 'md:pl-10' : ''}`}>
                  <div className={`flex items-start gap-3 ${rowData?.isAddon ? '' : 'font-semibold text-slate-900'}`}>
                    {rowData?.imageUrl ? (
                      <img
                        src={rowData.imageUrl}
                        alt={rowData?.itemName || 'Item image'}
                        className={`mt-0.5 shrink-0 rounded-xl object-cover ${
                          rowData?.isAddon ? 'h-8 w-8' : 'h-10 w-10'
                        }`}
                      />
                    ) : (
                      <div
                        className={`mt-0.5 flex shrink-0 items-center justify-center rounded-xl ${
                          rowData?.isAddon ? 'h-8 w-8 bg-white text-slate-500 shadow-sm' : 'h-10 w-10 bg-slate-100'
                        }`}
                      >
                        {rowData?.isAddon ? '+' : ''}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className={`${rowData?.isAddon ? 'font-medium text-slate-800' : 'font-semibold text-slate-900'}`}>
                        {rowData?.itemName}
                      </div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-400">
                        {rowData?.isAddon ? 'Addon' : 'Main item'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4 text-center text-sm font-medium text-slate-700">{rowData?.amount}</TableCell>
                <TableCell className="px-4 py-4 text-right text-sm font-medium text-slate-700">{formatNumber(rowData?.price)}</TableCell>
                <TableCell className="px-4 py-4 text-right text-sm font-semibold text-slate-700">
                  {Object.keys(rowData?.taxIdsToValues || {}).length > 0 ? 'T' : ''}
                </TableCell>
                <TableCell className="px-4 py-4 text-right text-xs text-slate-600">
                  {rowData?.discount && (
                    <div className="font-medium">
                      {rowData.discount.value} {rowData.discount.type === "PERCENTAGE" && '%'}
                    </div>
                  )}
                </TableCell>
                <TableCell className="px-4 py-4 text-right text-sm font-semibold text-slate-900">{formatNumber(rowData?.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});

export default OrderedItems;
