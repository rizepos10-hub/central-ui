import { Col, Row } from "reactstrap";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import React, { useEffect, useState } from "react";
import { IStockQuantity } from "app/shared/model/STOCK/stock-quantity.model";
import { Button as PrimeButton } from "primereact/button";
import StockQuantityModal from "app/entities/inventory/stock-config/stock-quantity-modal";
import { useLocation, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "app/config/store";
import { getStockQuantitiesForVariant } from "app/entities/inventory/stock-config/stock-quantity.reducer";
import { translate } from "react-jhipster";

const StockQuantityUpdate = () => {
  const dispatch = useAppDispatch();
  const { id } = useParams<'id'>();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const variantId = searchParams.get('variantId');
  const variantName = searchParams.get('variantName');
  const itemId = searchParams.get('itemId');
  const [editedStock, setEditedStock] = useState();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const stockQuantities = useAppSelector(state => state.stockQuantity.entities);
  const quantityUpdateSuccess = useAppSelector(state => state.stockQuantity.updateSuccess);

  const toggleModal = () => {
    setIsModalOpen(prevState => !prevState)
  }

  const actionBodyTemplate = (rowData) => {
    const handleClick = () => {
      setEditedStock(rowData);
      toggleModal();
    }
    return (
      <PrimeButton type="button" icon="pi pi-cog" rounded onClick={handleClick}></PrimeButton>
    )
  };


  useEffect(() => {
    const query = `itemId=${itemId}&variantId=${variantId}`
    dispatch(getStockQuantitiesForVariant(query));
  }, [quantityUpdateSuccess])


  return (
    <div>
      <Row>
        <Row>
          <Col md="8">
            <h2>Stock</h2>
          </Col>
        </Row>
        <Col md="8">
          <DataTable
            showGridlines
            value={stockQuantities}
            editMode="row"
            header={`${variantName} ${translate("tempApp.stockConfig.config")}`}
            removableSort
            paginator
            key={"id"}
            totalRecords={stockQuantities?.length}
            rows={20}
          >

            <Column field="location.name" header={"Location"} />

            <Column field="quantity" header={"Quantity"} />
            <Column field="unitCost" header={"Unit Cost"} />

            <Column headerStyle={{ width: '10rem' }} header={"Edit Details"} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />

          </DataTable>
          {isModalOpen ? <StockQuantityModal isOpen={isModalOpen} stockQuantity={editedStock} toggle={toggleModal} /> : null}
        </Col>
      </Row>
    </div>
  )
}

export default StockQuantityUpdate
