import React, { useEffect, useState } from 'react';
import { Col, Row, Table } from 'reactstrap';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { IBranchVariantDetails, IPricingPointBranchPrice, IVariableItemVariant } from 'app/shared/model/ITEM/retail/variable-item.model';
import { IRegularItemVariant } from 'app/shared/model/ITEM/restaurant/regular-item.model';
import { translate, Translate } from 'react-jhipster';
import { IBranch } from 'app/shared/model/branch.model';
import { Checkbox } from 'primereact/checkbox';
import PricingPointModal from './pricing-point-modal';
import { getEntities as getPricingPoints } from 'app/entities/settings/pricing-point/pricing-point.reducer';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { IPricingPoint } from 'app/shared/model/PRICING-POINT/pricing-point';

interface BranchPriceComponentProps<T extends IVariableItemVariant | IRegularItemVariant> {
  variantIndex: number;
  branchVariantDetails: IBranchVariantDetails;
  branchList: IBranch[];
  handleBranchPriceChange: (variantIndex: number, branchId: string, field: string, value: number) => void;
  itemVariantType: 'RETAIL' | 'RESTAURANT' | 'VIRTUAL_GIFTCARD';
  handleSavePricingPoint?: (
    variantIndex: number,
    branchId: string,
    pricingPoint: IPricingPoint,
    price: number
  ) => void;
  handleHideItemPerBranch?: (
    branchId: string,
    variantIndex: number,
    field: 'hideItem' | 'hideOnline'
  ) => void;
  variant: T;
  setItem: React.Dispatch<React.SetStateAction<any>>;
}

const VariantBranchPrice = <T extends IVariableItemVariant | IRegularItemVariant>({
  variantIndex,
  branchList,
  handleBranchPriceChange,
  branchVariantDetails,
  itemVariantType,
  handleSavePricingPoint,
  handleHideItemPerBranch,
  variant,
  setItem,
}: BranchPriceComponentProps<T>) => {
  const dispatch = useAppDispatch();

  const pricingPoints: IPricingPoint[] = useAppSelector(state => state.pricingPoint.entities);

  const [pricesModal, setPricesModal] = useState({
    show: false,
    branchId: '',
  });

  const handleShowPricesModal = (branchId?: string) => {
    setPricesModal(prev => ({
      ...prev,
      show: !prev.show,
      branchId,
    }));
  };

  useEffect(() => {
    dispatch(
      getPricingPoints({
        page: 0,
        size: 500,
        sort: 'asc',
      })
    );
  }, [dispatch]);

  const filteredPricingPoints = React.useMemo(() => {
    if (!pricesModal.branchId) return [];
    return pricingPoints.filter(pp =>
      pp.applicableBranches?.some(b => b.id === pricesModal.branchId)
    );
  }, [pricingPoints, pricesModal.branchId]);

  return (
    <Col md="12" className="mt-3">
      {pricesModal.show && (
        <PricingPointModal
          toggle={handleShowPricesModal}
          isOpen={pricesModal.show}
          pricingPoints={filteredPricingPoints}
          branchId={pricesModal.branchId}
          variant={variant}
          setItem={setItem}
        />
      )}
      <h4>
        <Translate contentKey="items.update.branchPrices">Branch Prices</Translate>
      </h4>
      <Table>
        <thead>
          <tr>
            <th>
              <Translate contentKey="items.update.branch">Branch</Translate>
            </th>
            <th>
              <Translate contentKey="items.update.price">Price</Translate>
            </th>
            <th>
              <Translate contentKey="items.update.salePrice">Sale Price</Translate>
            </th>
            <th>
              <Translate contentKey="items.update.pricingPoints">Pricing Points</Translate>
            </th>
            <th>
              <Translate contentKey="items.update.hideItem">Hide Item POS</Translate>
            </th>
            <th>
              <Translate contentKey="items.update.hideOnline">Hide Item Online</Translate>
            </th>
          </tr>
        </thead>
        <tbody>
          {branchList.map(branch => (
            <tr key={branch.id}>
              <td>{branch.name}</td>
              <td>
                <InputNumber
                  name={`branchPrice_${branch.id}`}
                  placeholder={translate('items.update.placeholders.itemBranchPrice', {
                    branchName: branch.name,
                  })}
                  onWheel={e => {
                    if (e.target instanceof HTMLInputElement) e.target.blur();
                  }}
                  maxFractionDigits={2}
                  min={0}
                  size={12}
                  value={branchVariantDetails?.[branch.id]?.price || null}
                  onChange={e => handleBranchPriceChange(variantIndex, branch.id, 'price', e.value)}
                  draggable={false}
                />
              </td>
              <td>
                <InputNumber
                  name={`branchSalePrice_${branch.id}`}
                  placeholder={translate('items.update.placeholders.itemBranchSalePrice', {
                    branchName: branch.name,
                  })}
                  onWheel={e => {
                    if (e.target instanceof HTMLInputElement) e.target.blur();
                  }}
                  min={0}
                  size={12}
                  maxFractionDigits={2}
                  value={branchVariantDetails?.[branch.id]?.salePrice || null}
                  onChange={e =>
                    handleBranchPriceChange(variantIndex, branch.id, 'salePrice', e.value)
                  }
                  draggable={false}
                />
              </td>
              <td>
                <Button
                  type="button"
                  raised
                  onClick={e => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleShowPricesModal(branch.id);
                  }}
                >
                  Pricing Points
                </Button>
              </td>
              <td>
                <Checkbox
                  name={`hideItem_${branch.id}`}
                  value={branchVariantDetails?.[branch.id]?.hideItem || false}
                  onChange={() => handleHideItemPerBranch?.(branch.id, variantIndex, 'hideItem')}
                  checked={branchVariantDetails?.[branch.id]?.hideItem}
                />
              </td>
              <td>
                <Checkbox
                  name={`hideOnline_${branch.id}`}
                  value={branchVariantDetails?.[branch.id]?.hideOnline || false}
                  onChange={() => handleHideItemPerBranch?.(branch.id, variantIndex, 'hideOnline')}
                  checked={branchVariantDetails?.[branch.id]?.hideOnline}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Col>
  );
};

export default VariantBranchPrice;
