import { Button, Card, Col, ListGroup, ListGroupItem, Row, Table } from 'reactstrap';
import { translate, Translate } from 'react-jhipster';
import React from 'react';
import { IOrderedItem } from 'app/shared/model/ORDER/ordered-item.model';
import { IOrderedAddon } from 'app/shared/model/ORDER/ordered-addon.model';
import { TreeTable } from "primereact/treetable";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";

export const OrderedItems = ({ dataTableValues }) => {

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

  return (
    <div>
      <DataTable
        value={dataTableValues}
        dataKey="id"
        tableStyle={{ minWidth: '60rem' }}
      >
        <Column field="itemName" header="Name" sortable body={itemNameTemplate} />
        <Column field="amount" header="Quantity" sortable />
        <Column field="price" header="Price" sortable />
        <Column field="taxIdsToValues" header="Taxes" sortable body={taxesTemplate} />
        <Column field="discount" header="Discount" sortable body={discountTemplate} />
        <Column field="total" header="Total" sortable />
      </DataTable>

      {/* {list.length > 0 && (
        <Row>
          <Col md={7}>
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
            </Card>
          </Col>
        </Row>
      )} */}
    </div>
  );
};
