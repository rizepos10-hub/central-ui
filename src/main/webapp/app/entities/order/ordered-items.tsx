 import {Button, Card, Col, ListGroup, ListGroupItem, Row, Table} from 'reactstrap';
  import {translate, Translate} from 'react-jhipster';
  import React from 'react';
  import { IOrderedItem } from 'app/shared/model/ORDER/ordered-item.model';
  import { IOrderedAddon } from 'app/shared/model/ORDER/ordered-addon.model';
  import {TreeTable} from "primereact/treetable";
  import {Column} from "primereact/column";
  import { DataTable } from "primereact/datatable";

  interface OrderedItems {
    list: IOrderedItem[];
    totalPayments: number
  }
  export const OrderedItems: React.FC<OrderedItems> = ({ list,totalPayments }) => {

    const calculateAllItemsPrice = () => {
      return list.reduce((acc, item) => {
        return acc + calculateTotalItemPriceWithAddonsAndDiscounts(item);
      }, 0);
    }

    const calculateAllItemsPriceBeforeDiscount = () => {
      return list.reduce((acc, item) => {
        return acc + item.price * item.amount;
      }, 0);
    }

    const calculateSubtractedDiscounts = () => {
      return list.reduce((acc, item) => {
        const totalAddonDiscounts = item.addons?.reduce((addonAcc, addon) => {
          return addonAcc + calculateDiscount(addon);
        }, 0) || 0;

        return acc + calculateDiscount(item) + totalAddonDiscounts;
      }, 0);
    }

    const calculateDiscount = (item: IOrderedItem) => {
      if (item.discount?.type === 'PERCENTAGE') {
        return (item.price * item.discount.value) / 100;
      } else if (item.discount?.type === 'FLAT') {
        return item.discount.value !== undefined ? item.discount.value : 0;
      } else {
        return 0;
      }
    }


    const calculateTotalItemPriceWithAddonsAndDiscounts = (item: IOrderedItem) => {
      const itemPrice = item.price * item.amount;
      const addonsPrice = item.addons?.reduce((acc, addon) => {
        return acc + calculateAddonPriceAfterDiscount(addon) * addon.amount;
      }, 0);
      const itemTotalPrice = itemPrice + addonsPrice;
      const itemDiscount = item.discount?.type === 'PERCENTAGE' ? (itemTotalPrice * item.discount.value) / 100 : item.discount?.value !== undefined ? item.discount.value : 0;
      return itemTotalPrice - itemDiscount;
    }

    const calculateAddonPriceAfterDiscount = (addon: IOrderedAddon) => {
      if (addon.discount?.type === 'PERCENTAGE') {
        return addon.price - (addon.price * addon.discount.value) / 100;
      } else if (addon.discount?.type === 'FLAT') {
        return addon.price - (addon.discount.value !== undefined ? addon.discount.value : 0);
      } else {
        return addon.price;
      }
    };

    const calculateAllTaxValues = () => {
      return list.reduce((acc, item) => {
        return acc + item.taxValue * item.amount;
      }, 0);
    }


    const nameBodyTemplate = (rowData: IOrderedItem) => {
      const attributeNames = rowData?.selectedRetailAttributes?.map((attribute) => attribute?.valueName).join(', ');
      return (
        <div className="d-flex flex-column">
          <div>
            <div className={'d-flex gap-2'}>
              {rowData.itemName} {!rowData?.selectedRetailAttributes && rowData.variantCount > 1 && `( ${rowData.variantName} )`}
            </div>

            {rowData?.addons?.length > 0 && (
              <>
                {rowData.addons.map((addon: IOrderedAddon, index: number) => (
                  <div key={index}>
                    + {addon.name} (x {addon.amount.toFixed(1)}) {(calculateAddonPriceAfterDiscount(addon) * addon.amount).toFixed(1)}
                  </div>
                ))}
              </>
            )}
            {attributeNames && <div>*{attributeNames}</div>}
          </div>
        </div>
      );
    }


    return (
      <div >

          <div>
            {list && list.length > 0 ? (
              <DataTable value={list}   resizableColumns showGridlines columnResizeMode="expand" tableStyle={{ minWidth: '70rem' }} className="mt-4">

                <Column field="amount" header={translate('orders.details.common.qty')}  />
                <Column field="itemName" body={nameBodyTemplate}  header={translate('orders.details.itemsCard.table.name')}  />
                <Column body={(rowData) => rowData.taxValue ? "T" : "N"}  header={translate('orders.details.common.taxes')}  />
                {/* <Column field="returnedAmount" headerStyle={{width: '158px'}}  header={translate('orders.details.common.returnedQuantity')} /> */}
                {/* <Column body={(rowData) => rowData.amount - (rowData?.returnedAmount || 0)}  headerStyle={{width: '148px'}} header={translate('orders.details.common.totalQuantity')}  /> */}
                {/* <Column body={(rowDate) => calculateDiscount(rowDate)} header={translate('orders.details.common.discount')} /> */}
                {/* <Column field="price" header={translate('orders.details.common.price')} /> */}
                <Column body={(rowData) => calculateTotalItemPriceWithAddonsAndDiscounts(rowData).toFixed(2)} header={translate('orders.details.common.amount')}  />
              </DataTable>

            ) : (
              <div><Translate contentKey={'orders.details.itemsCard.emptyMessage'}>No items available.</Translate></div>
            )}
          </div>

        { list.length > 0 &&
          <Col md={6}>
            <div className="d-flex justify-content-between my-2">
            <Card className="mt-3 p-3">
              <Table>
                <tbody>
                <tr>
                  <td>
                    <strong>{translate('orders.details.common.subtotal')}</strong>
                  </td>
                  <td className="text-center">{calculateAllItemsPrice().toFixed(2)}</td>
                </tr>
                <tr>
                  <td>
                    <strong>{translate('orders.details.common.taxes')}</strong>
                  </td>
                  <td className="text-center">{calculateAllTaxValues().toFixed(2)}</td>
                </tr>
                <tr>
                  <td>
                    <strong>{translate('orders.details.common.total')}</strong>
                  </td>
                  <td className="text-center">{(calculateAllItemsPrice() + calculateAllTaxValues()).toFixed(2)}</td>
                </tr>
                </tbody>
              </Table>
              {/* <div className="d-flex justify-content-between my-2"> */}
              {/*   <div> */}
              {/*     <strong>{translate('orders.details.common.subtotal')}</strong> */}
              {/*   </div> */}
              {/*   <div className="text-center">{calculateAllItemsPriceBeforeDiscount().toFixed(2)}</div> */}
              {/* </div> */}
              {/* <div className="d-flex justify-content-between my-2"> */}
              {/*   <div> */}
              {/*     <strong>{translate('orders.details.common.totalDiscounts')}</strong> */}
              {/*   </div> */}
              {/*   <div className="text-center">{calculateSubtractedDiscounts().toFixed(2)}</div> */}
              {/* </div> */}
              {/* <div className="d-flex justify-content-between my-2"> */}
              {/*   <div> */}
              {/*     <strong>{translate('orders.details.common.subtotal')}</strong> */}
              {/*   </div> */}
              {/*   <div className="text-center">{calculateAllItemsPrice().toFixed(2)}</div> */}
              {/* </div> */}
              {/* <div className="d-flex justify-content-between my-2"> */}
              {/*   <div> */}
              {/*     <strong>{translate('orders.details.common.taxes')}</strong> */}
              {/*   </div> */}
              {/*   <div className="text-center">{calculateAllTaxValues().toFixed(2)}</div> */}
              {/* </div> */}
              {/* <div className="d-flex justify-content-between my-2"> */}
              {/*   <div> */}
              {/*     <strong>{translate('orders.details.common.paid')}</strong> */}
              {/*   </div> */}
              {/*   <div className="text-center">{totalPayments.toFixed(2)}</div> */}
              {/* </div> */}
              {/* <div className="d-flex justify-content-between my-2"> */}
              {/*   <div> */}
              {/*     <strong>{translate('orders.details.common.remaining')}</strong> */}
              {/*   </div> */}
              {/*   <div className="text-center">{(calculateAllItemsPrice() - totalPayments).toFixed(2) }</div> */}
              {/* </div> */}
            </Card>
            <Card>
              <div className="text-center">{(calculateAllItemsPrice() + calculateAllTaxValues()).toFixed(2)}</div>
            </Card>
              <div></div>
            </div>
          </Col>
        }
      </div>
    );
  };
