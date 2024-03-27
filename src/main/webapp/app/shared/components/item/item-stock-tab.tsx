import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import React from "react";
import {Button} from "primereact/button";
import {useNavigate} from "react-router-dom";

const ItemStockTab = ({variants, itemId}) => {
  const navigate = useNavigate();


  const variantsWithItemId = variants.map(variant => ({
    ...variant,
    itemId
  }));

  const quantityConfigBodyTemplate = (rowData) => {
    const {stockQuantities: quantity} = rowData;
    const editUrl = `/inventory/stock/stock-quantity/${rowData?.id}/edit?variantId=${rowData.id}&variantName=${rowData.name}&itemId=${rowData.itemId}`;
    const icon = quantity?.length > 0 ? "pi pi-wallet" : "pi pi-ban";
    const handleClick = () => {
      navigate(editUrl)
    }
    return quantity?.length > 0 ?  <Button icon={icon} onClick={handleClick} /> : <i className={icon} style={{ fontSize: '1.5rem'}} />;
  };


  const purchaseConfigBodyTemplate = (rowData) => {
    const {purchaseConfig: config} = rowData;
    const createUrl = `/inventory/stock/purchase-config/new?variantId=${rowData.id}&variantName=${rowData.name}&itemId=${rowData.itemId}`
    const editUrl = `/inventory/stock/purchase-config/${rowData?.id}/edit?`;
    const icon = config ? "pi pi-spin pi-cog" : "pi pi-plus";
    const handleClick = () => {
      if(!config){
        navigate(createUrl);
      }else{
        navigate(editUrl)
      }
    }
    return <Button className={'ml-5'} icon={icon} onClick={handleClick} />;
  };


  return (
    <div className="p-3">
      <DataTable value={variantsWithItemId}>
        <Column field="name" header="Variant Name" sortable />
        <Column field="price" header="Price" sortable />
        <Column field="sku" header="Sku" sortable />
        <Column headerStyle={{ width: '9rem' }} header={"Quantity"} body={quantityConfigBodyTemplate} />
        <Column headerStyle={{ width: '12rem' }} header={"Purchase Config"} body={purchaseConfigBodyTemplate} />
      </DataTable>
    </div>
  );
};

export default ItemStockTab;
