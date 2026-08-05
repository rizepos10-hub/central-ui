import React, { useEffect, useState } from "react";
import {useNavigate} from "react-router-dom";
import MinimumStockLevelModal from "./minimum-stock-level-modal";
import { useAppDispatch } from 'app/config/store';
import { IStockQuantity } from "app/shared/model/STOCK/stock-quantity.model";
import { partialUpdateMiniStockLevelEntity } from "app/entities/inventory/stock-config/stock-quantity.reducer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Wallet, Ban, Settings, Plus, Pencil, Loader2 } from 'lucide-react';
import { formatSkuList } from 'app/shared/util/sku-utils';

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
    const icon = quantity?.length > 0 ? <Wallet className="h-4 w-4" /> : <Ban className="h-4 w-4 text-muted-foreground" />;
    const handleClick = () => {
      navigate(editUrl)
    }
    return quantity?.length > 0 ?
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleClick}>{icon}</Button> :
      <span className="inline-flex items-center justify-center">{icon}</span>;
  };


  const purchaseConfigBodyTemplate = (rowData) => {
    const {purchaseConfig: config} = rowData;
    const createUrl = `/inventory/stock/purchase-config/new?variantId=${rowData.id}&variantName=${rowData.name}&itemId=${rowData.itemId}`
    const editUrl = `/inventory/stock/purchase-config/${rowData?.id}/edit?`;
    const icon = config ? <Settings className="h-4 w-4" /> : <Plus className="h-4 w-4" />;
    const handleClick = () => {
      if(!config){
        navigate(createUrl);
      }else{
        navigate(editUrl)
      }
    }
    return <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleClick}>{icon}</Button>;
  };

  const minimumStockLevelBodyTemplate = (rowData) => {
    const {stockQuantities: minimumStockLevel} = rowData;
    const icon = minimumStockLevel?.length > 0 ? <Pencil className="h-4 w-4" /> : <Ban className="h-4 w-4 text-muted-foreground" />;

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
      return <Loader2 className="h-4 w-4 animate-spin" />
    } else
    return minimumStockLevel?.length > 0 ?
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleClick}>{icon}</Button> :
      <span className="inline-flex items-center justify-center">{icon}</span>;

  };

  return (
    <div className="p-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Variant Name</TableHead>
            <TableHead className="text-xs">Price</TableHead>
            <TableHead className="text-xs">Sku</TableHead>
            <TableHead className="text-xs w-24">Quantity</TableHead>
            <TableHead className="text-xs w-32">Purchase Config</TableHead>
            <TableHead className="text-xs w-32">Minimum Stock Level</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {variantsWithItemId?.map((variant) => (
            <TableRow key={variant.id}>
              <TableCell className="text-xs">{variant.name}</TableCell>
              <TableCell className="text-xs">{variant.price}</TableCell>
              <TableCell className="text-xs">{formatSkuList(variant)}</TableCell>
              <TableCell className="text-xs text-center">{quantityConfigBodyTemplate(variant)}</TableCell>
              <TableCell className="text-xs text-center">{purchaseConfigBodyTemplate(variant)}</TableCell>
              <TableCell className="text-xs text-center">{minimumStockLevelBodyTemplate(variant)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
