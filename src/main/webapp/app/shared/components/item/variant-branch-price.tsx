import React, { useState } from 'react';
import { Col, Row, Table } from 'reactstrap';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { IBranchVariantDetails, IVariableItemVariant } from 'app/shared/model/ITEM/retail/variable-item.model';
import { IRegularItemVariant } from 'app/shared/model/ITEM/restaurant/regular-item.model';
import { translate, Translate } from 'react-jhipster';
import { IBranch } from 'app/shared/model/branch.model';
import WholesalePrices from 'app/shared/components/item/wholsale-prices-modal';
import { Checkbox } from 'primereact/checkbox';

interface BranchPriceComponentProps<T extends IVariableItemVariant | IRegularItemVariant> {
  variantIndex: number;
  branchVariantDetails: IBranchVariantDetails;
  branchList: IBranch[];
  handleBranchPriceChange: (variantIndex: number, branchId: string, field: string, value: number) => void;
  itemVariantType: 'RETAIL' | 'RESTAURANT';
  handleSaveWholesalePrices?: (prices: number, branchId: string) => void;
  handleHideItemPerBranch?: (branchId: string, variantIndex: number) => void;
}

const VariantBranchPrice = <T extends IVariableItemVariant | IRegularItemVariant>({
  variantIndex,
  branchList,
  handleBranchPriceChange,
  branchVariantDetails,
  itemVariantType,
  handleSaveWholesalePrices,
  handleHideItemPerBranch
}: BranchPriceComponentProps<T>) => {
  const isRetail = itemVariantType === 'RETAIL';
  const [pricesModal, setPricesModal] = useState({
    show: false,
    branchId: '',
  });
  console.log(branchList, 'branchList')

  const handleShowPricesModal = (branchId?) => {
    setPricesModal(prev => ({
      ...prev,
      show: !prev.show,
      branchId,
    }));
  };

  return (
    <Col md="12" className={'mt-3'}>
      {pricesModal?.show && (
        <WholesalePrices
          toggle={handleShowPricesModal}
          isOpen={pricesModal?.show}
          branchWholesalePrices={branchVariantDetails?.[pricesModal?.branchId]?.wholesalePrices}
          savePrices={prices => handleSaveWholesalePrices(prices, pricesModal.branchId)}
        />
      )}
      <h4>
        <Translate contentKey={'items.update.branchPrices'}>Branch Prices</Translate>
      </h4>
      <Table>
        <thead>
          <tr>
            <th>
              <Translate contentKey={'items.update.branch'}>Branch</Translate>
            </th>
            <th>
              <Translate contentKey={'items.update.price'}>Price</Translate>
            </th>
            <th>
              <Translate contentKey={'items.update.salePrice'}>Sale Price</Translate>
            </th>

            {isRetail && branchList.some(branch => branch.wholesale) ? (
              <th>
                <Translate contentKey={'items.update.hideItem'}>Hide Item</Translate>
              </th>
            ) : null}

            {isRetail && branchList.some(branch => branch.wholesale) ? (
              <th>
                <Translate contentKey={'items.update.WholesalePrices'}>Wholesale Prices</Translate>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {branchList.map(branch => (
            <tr key={branch.id}>
              <td>{branch.name}</td>
              <td>
                <InputNumber
                  name={`branchPrice_${branch.id}`}
                  placeholder={translate('items.update.placeholders.itemBranchPrice', { branchName: branch.name })}
                  onWheel={e => {
                    if (e.target instanceof HTMLInputElement) e.target.blur();
                  }}
                  maxFractionDigits={2}
                  min={0}
                  size={12}
                  value={branchVariantDetails?.[branch.id]?.price}
                  onChange={e => handleBranchPriceChange(variantIndex, branch.id, 'price', e.value)}
                />
              </td>
              <td>
                <InputNumber
                  name={`branchSalePrice_${branch.id}`}
                  placeholder={translate('items.update.placeholders.itemBranchSalePrice', { branchName: branch.name })}
                  onWheel={e => {
                    if (e.target instanceof HTMLInputElement) e.target.blur();
                  }}
                  min={0}
                  size={12}
                  maxFractionDigits={2}
                  value={branchVariantDetails?.[branch.id]?.salePrice}
                  onChange={e => handleBranchPriceChange(variantIndex, branch.id, 'salePrice', e.value)}
                />
              </td>

              {isRetail && (
                <td>
                  <Checkbox
                    name={`hideItem_${branch.id}`}
                    value={branchVariantDetails?.[branch.id]?.hideItem}
                    onChange={() => handleHideItemPerBranch(branch.id, variantIndex)}
                    checked={branchVariantDetails?.[branch.id]?.hideItem}
                  />
                </td>
              )}

              {isRetail && branch.wholesale && (
                <td>
                  <Button
                    type={"button"}
                    raised
                    onClick={e => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleShowPricesModal(branch.id);
                    }}
                  >
                    Wholesale Prices
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    </Col>
  );
};

export default VariantBranchPrice;
