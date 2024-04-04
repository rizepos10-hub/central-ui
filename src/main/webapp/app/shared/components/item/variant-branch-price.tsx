import React from 'react';
import {  Col, Row, Table } from "reactstrap";
import { InputNumber } from 'primereact/inputnumber';
import { IBranchVariantDetails, IVariableItemVariant } from "app/shared/model/ITEM/retail/variable-item.model";
import { IRegularItemVariant } from "app/shared/model/ITEM/restaurant/regular-item.model";
import { translate, Translate } from "react-jhipster";
import { IBranch } from "app/shared/model/branch.model";


interface BranchPriceComponentProps<T extends IVariableItemVariant | IRegularItemVariant> {
  variantIndex: number;
  branchVariantDetails: IBranchVariantDetails;
  branchList: IBranch[];
  handleBranchPriceChange: (variantIndex: number, branchId: string, field: string, value: number) => void;
}


const VariantBranchPrice = <T extends IVariableItemVariant | IRegularItemVariant>({
                                                                                  variantIndex,
                                                                                  branchList,
                                                                                  handleBranchPriceChange,
                                                                                  branchVariantDetails
                                                                                }: BranchPriceComponentProps<T>) => {
  return (
              <Col md="12" className={"mt-3"}>
                <h4>
                  <Translate contentKey={'items.update.branchPrices'}>
                    Branch Prices
                  </Translate>
                </h4>
                <Table>
                  <thead>
                  <tr>
                    <th><Translate contentKey={'items.update.branch'}>Branch</Translate></th>
                    <th><Translate contentKey={'items.update.price'}>Price</Translate></th>
                    <th><Translate contentKey={'items.update.salePrice'}>Sale Price</Translate></th>
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
                          onWheel={(e) => {
                            if (e.target instanceof HTMLInputElement) e.target.blur();
                           }
                          }
                          maxFractionDigits={2}
                          min={0}
                          value={branchVariantDetails?.[branch.id]?.price}
                          onChange={e => handleBranchPriceChange(variantIndex, branch.id, "price", e.value)}
                        />
                      </td>
                      <td>
                        <InputNumber
                          name={`branchSalePrice_${branch.id}`}
                          placeholder={translate('items.update.placeholders.itemBranchSalePrice', { branchName: branch.name })}
                          onWheel={(e) => {
                            if (e.target instanceof HTMLInputElement) e.target.blur();
                          }
                        }
                          min={0}
                          maxFractionDigits={2}
                          value={branchVariantDetails?.[branch.id]?.salePrice}
                          onChange={e => handleBranchPriceChange(variantIndex, branch.id, "salePrice", e.value)}
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
