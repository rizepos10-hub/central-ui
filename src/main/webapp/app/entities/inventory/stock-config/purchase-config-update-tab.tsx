// PurchaseConfigUpdateTab.tsx
import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Row, Col, FormGroup, Label, Table, Button } from 'reactstrap';
import { useAppSelector } from 'app/config/store';
import { IPurchaseConfig } from 'app/shared/model/STOCK/purchase-config.model';
import { translate } from 'react-jhipster';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';

interface PurchaseConfigUpdateTabProps {
  id?: string;
  variantIndex: number;
  onConfigChange: (config: IPurchaseConfig, variantIndex: number) => void;
  purchaseConfig: IPurchaseConfig;
}

export const PurchaseConfigUpdateTab: React.FC<PurchaseConfigUpdateTabProps> = ({
  variantIndex,
  id,
  onConfigChange,
  purchaseConfig
}) => {
  const location = useLocation();
  const isNew = id === undefined;
  const suppliers = useAppSelector(state => state.supplier.entities);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(
      supplier =>
        !purchaseConfig.supplierConfigurations?.some(
          config => config.supplier.id === supplier.id
        )
    );
  }, [purchaseConfig.supplierConfigurations, suppliers]);

  const handleNumberChange = (field: string, num: number | null) => {
    const newConfig = { ...purchaseConfig, [field]: num };
    onConfigChange(newConfig, variantIndex);
  };

  const handleAddSupplier = (selectedSupplier: any) => {
    const newEntry = {
      supplier: selectedSupplier.value,
      defaultPrice: null,
      code: ''
    };
    const newConfig = {
      ...purchaseConfig,
      supplierConfigurations: [...(purchaseConfig.supplierConfigurations || []), newEntry]
    };
    onConfigChange(newConfig, variantIndex);
  };

  const handleSupplierConfigChange = (configIndex: number, price: number | null) => {
    const updatedConfigurations = purchaseConfig.supplierConfigurations?.map((supConfig, index) =>
      index === configIndex ? { ...supConfig, defaultPrice: price } : supConfig
    );
    const newConfig = { ...purchaseConfig, supplierConfigurations: updatedConfigurations };
    onConfigChange(newConfig, variantIndex);
  };

  const handleSupplierCodeChange = (configIndex: number, newCode: string) => {
    const updatedConfigurations = purchaseConfig.supplierConfigurations?.map((supConfig, index) =>
      index === configIndex ? { ...supConfig, code: newCode } : supConfig
    );
    const newConfig = { ...purchaseConfig, supplierConfigurations: updatedConfigurations };
    onConfigChange(newConfig, variantIndex);
  };

  const handleDeleteSupplier = (configIndex: number) => {
    const updatedConfigurations = purchaseConfig.supplierConfigurations?.filter((_, index) => index !== configIndex);
    const newConfig = { ...purchaseConfig, supplierConfigurations: updatedConfigurations };
    onConfigChange(newConfig, variantIndex);
  };

  return (
    <div>
      <Row>
        <Col md="8">
          <h2>
            {isNew
              ? translate('tempApp.stockConfig.addNewPurchaseConfig')
              : translate('tempApp.stockConfig.editPurchaseConfig')}
          </h2>
        </Col>
      </Row>
      <Row>
        <Col className="d-flex flex-column p-3">
          <FormGroup>
            <Row>
              <Col md="6">
                <div className="d-flex flex-column mt-2">
                  <strong>
                    <Label for="defaultPrice">{translate('tempApp.stockConfig.defaultPrice')}</Label>
                  </strong>
                  <InputNumber
                    name="defaultPrice"
                    id="defaultPrice"
                    value={purchaseConfig?.defaultPrice}
                    onChange={(e) => handleNumberChange('defaultPrice', e.value)}
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    inputStyle={{
                      borderColor:
                        (purchaseConfig?.supplierConfigurations?.length > 0 &&
                          purchaseConfig?.defaultPrice == null) ||
                          (purchaseConfig?.minOrderQuantity != null && purchaseConfig?.defaultPrice == null)
                          ? 'red'
                          : ''
                    }}
                  />
                </div>
              </Col>
              <Col md="6">
                <div className="d-flex flex-column mt-2">
                  <strong>
                    <Label for="minOrderQuantity">{translate('tempApp.stockConfig.minOrderQuantity')}</Label>
                  </strong>
                  <InputNumber
                    name="minOrderQuantity"
                    id="minOrderQuantity"
                    value={purchaseConfig.minOrderQuantity}
                    onChange={(e) => handleNumberChange('minOrderQuantity', e.value)}
                  />
                </div>
              </Col>
            </Row>
            <div className="d-flex flex-column mt-2">
              <strong>
                <Label>{translate('tempApp.stockConfig.supplierConfig')}</Label>
              </strong>
              <div className="d-flex flex-column border p-3">
                <Label>{translate('tempApp.stockConfig.selectSupplier')}</Label>
                <Dropdown
                  options={filteredSuppliers}
                  placeholder={translate('tempApp.stockConfig.selectSupplier')}
                  className="w-full md:w-14rem"
                  optionLabel="name"
                  filter
                  onChange={handleAddSupplier}
                />
                <Table bordered className="mt-2">
                  <thead>
                    <tr>
                      <th>{translate('common.supplier')}</th>
                      <th>{translate('common.costPrice')}</th>
                      <th>{translate('common.supplierCode')}</th>
                      <th>{translate('common.delete')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseConfig?.supplierConfigurations?.map((supConfig, index) => (
                      <tr key={supConfig.supplier.id}>
                        <td>{supConfig.supplier.name}</td>
                        <td>
                          <InputNumber
                            required
                            onWheel={(e: any) => e.target.blur()}
                            size={20}
                            value={supConfig?.defaultPrice}
                            onChange={(e) => handleSupplierConfigChange(index, e.value)}
                            minFractionDigits={2}
                            maxFractionDigits={2}
                          />
                        </td>
                        <td>
                          <InputText
                            value={supConfig.code}
                            onChange={(e) => handleSupplierCodeChange(index, e.target.value)}
                          />
                        </td>
                        <td>
                          <Button color="danger" onClick={() => handleDeleteSupplier(index)}>
                            {translate('common.delete')}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          </FormGroup>
        </Col>
      </Row>
    </div>
  );
};

export default PurchaseConfigUpdateTab;
