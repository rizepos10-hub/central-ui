import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import React, { useEffect, useState } from "react";
import {Button} from "primereact/button";
import {useNavigate} from "react-router-dom";
import MinimumStockLevelModal from "./minimum-stock-level-modal";
import { useAppDispatch } from 'app/config/store';
import { IStockQuantity } from "app/shared/model/STOCK/stock-quantity.model";
import { partialUpdateMiniStockLevelEntity } from "app/entities/inventory/stock-config/stock-quantity.reducer";
import { Spinner } from "reactstrap";

const ItemStockTab = ({variants, itemId, refreshProduct }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [openedMinimumStockLevelModal, setOpenedMinimumStockLevelModal] = useState(false);
  const [minimumStockLevel, setMinimumStockLevel] = useState(null);
  const [variantsWithItemId, setVariantsWithItemId] = useState(null);
  const [variantSpinnerId, setVariantSpinnerId] = useState(null);
  const [loading, setLoading] = useState(false); // Loading stat
  useEffect(() => {
    const variantsWithItemId = variants.map(variant => ({
      ...variant,
      itemId
    }));

    setVariantsWithItemId(variantsWithItemId);
  }, [variants, itemId]);
  
  const handleMinimumStockLevelModalSave = (stockQuantities: IStockQuantity[]) => {
    setLoading(true);
    dispatch(partialUpdateMiniStockLevelEntity(stockQuantities)).then(() => {
      setLoading(false);
      setVariantSpinnerId(null);
      refreshProduct();
    });
  };

  const handleMinimumStockLevelModalClose = () => {
    setOpenedMinimumStockLevelModal(false);
  };

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

  const minimumStockLevelBodyTemplate = (rowData) => {
    const {stockQuantities: minimumStockLevel} = rowData;
    const icon = minimumStockLevel?.length > 0 ? "pi pi-pencil" : "pi pi-ban";

    const updatedMinimumStockLevel = minimumStockLevel?.map(stock => ({
      ...stock,
      itemId: rowData?.itemId,
      variantId: rowData?.id,
      location: {
        ...stock.location,
        type: "SALES_LOCATION"
      }
    }));

    const handleClick = (event) => {
      setVariantSpinnerId(rowData?.id)
      event.preventDefault();
      setOpenedMinimumStockLevelModal(true);
      setMinimumStockLevel(updatedMinimumStockLevel);
    }

    if(loading && rowData?.id == variantSpinnerId) {
      return <Spinner/>
    } else
    return minimumStockLevel?.length > 0 ? <Button className={'ml-5'} icon={icon} onClick={handleClick} /> : <i className={icon} style={{ fontSize: '1.5rem'}} />;

  };

  return (
    <div className="p-3">
      <DataTable value={variantsWithItemId}>
        <Column field="name" header="Variant Name" sortable />
        <Column field="price" header="Price" sortable />
        <Column field="sku" header="Sku" sortable />
        <Column headerStyle={{ width: '9rem' }} header={"Quantity"} body={quantityConfigBodyTemplate} />
        <Column headerStyle={{ width: '12rem' }} header={"Purchase Config"} body={purchaseConfigBodyTemplate} />
        <Column headerStyle={{ width: '12rem' }} header={"Minimum Stock Level"} body={minimumStockLevelBodyTemplate} />
      </DataTable>

      {openedMinimumStockLevelModal && (
        <MinimumStockLevelModal
          showModal={openedMinimumStockLevelModal}
          handleSave={handleMinimumStockLevelModalSave}
          handleClose={handleMinimumStockLevelModalClose}
          minimumStockLevel={minimumStockLevel}
        />
      )}

    </div>
  );
};

export default ItemStockTab;
