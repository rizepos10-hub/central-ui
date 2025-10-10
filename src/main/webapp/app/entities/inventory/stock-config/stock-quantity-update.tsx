import React, { useEffect, useState } from "react";
import { IStockQuantity } from "app/shared/model/STOCK/stock-quantity.model";
import StockQuantityModal from "app/entities/inventory/stock-config/stock-quantity-modal";
import { useLocation, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "app/config/store";
import { getStockQuantitiesForVariant } from "app/entities/inventory/stock-config/stock-quantity.reducer";
import { translate } from "react-jhipster";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

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
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleClick}>
        <Settings className="h-4 w-4" />
      </Button>
    )
  };


  useEffect(() => {
    const query = `itemId=${itemId}&variantId=${variantId}`
    dispatch(getStockQuantitiesForVariant(query));
  }, [quantityUpdateSuccess])


  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Stock</h2>
      </div>
      <div className="max-w-4xl">
        <div className="mb-3">
          <h3 className="text-base font-semibold">{variantName} {translate("tempApp.stockConfig.config")}</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Location</TableHead>
              <TableHead className="text-xs">Quantity</TableHead>
              <TableHead className="text-xs">Unit Cost</TableHead>
              <TableHead className="text-xs w-32 text-center">Edit Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stockQuantities?.map((stock) => (
              <TableRow key={stock.id}>
                <TableCell className="text-xs">{stock.location?.name}</TableCell>
                <TableCell className="text-xs">{stock.quantity}</TableCell>
                <TableCell className="text-xs">{stock.unitCost}</TableCell>
                <TableCell className="text-xs text-center">{actionBodyTemplate(stock)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {isModalOpen ? <StockQuantityModal isOpen={isModalOpen} stockQuantity={editedStock} toggle={toggleModal} /> : null}
      </div>
    </div>
  )
}

export default StockQuantityUpdate
