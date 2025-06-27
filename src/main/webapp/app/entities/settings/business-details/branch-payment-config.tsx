import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { cloneDeep } from "lodash";
import { SelectButton } from "primereact/selectbutton";
import { camelToTitle } from "app/shared/util/string-utils";
import { Button } from "primereact/button";

type BranchPaymentConfigProps = {
  branchIndex?: number;
  editingBranchPayments?: any;
  setEditingBranchPayments?: any;
  moduleCode?: string;
  onPaymentConfigChange?: (branchIndex: number, paymentConfigs: any[]) => void;
};

const BranchPaymentConfig = ({ editingBranchPayments, setEditingBranchPayments, branchIndex, moduleCode = 'CONVERGE_LIGHTBOX', onPaymentConfigChange }: BranchPaymentConfigProps) => {
  const getDefaultConfig = () => {
    const baseConfig = {
      active: false,
      defaultSelected: false,
      environment: 'TEST',
      gateway: null,
      moduleCode,
    };

    if (moduleCode === 'BAMBORA') {
      return {
        ...baseConfig,
        integrationKeys: {
          merchantId: '',
          paymentPasscode: '',
          profileApiKey: '',
          bamboraBaseUrl: '',
          tokenizationEndPoint: '',
          paymentsEndPoint: '',
          ProfileEndPoint: '',
          ReportsEndPoint: '',
        },
      };
    } else {
      return {
        ...baseConfig,
        integrationKeys: {
          sslMerchantId: '',
          sslUserId: '',
          sslPin: '',
          sslTransactionType: '',
          sslGetToken: '',
          sslAddToken: '',
          apiUrl: '',
          lightboxUrl: '',
        },
      };
    }
  };

  const defaultConfig = getDefaultConfig();

  const handleChange = (index: number, field: string, value: any) => {
    setEditingBranchPayments(prevState => {
      const newState = cloneDeep(prevState);
      const [parentKey, childKey] = field.split('.');
      if (childKey) {
        newState[index][parentKey][childKey] = value;
      } else {
        newState[index][field] = value;
      }
      
      // Sync with main business details state
      if (onPaymentConfigChange && branchIndex !== undefined) {
        onPaymentConfigChange(branchIndex, newState);
      }
      
      return newState;
    });
  };

  const addNewPaymentConfig = (e: any) => {
    e.preventDefault();
    setEditingBranchPayments(prevState => {
      const newState = cloneDeep(prevState) || [];
      newState.push(defaultConfig);
      
      // Sync with main business details state
      if (onPaymentConfigChange && branchIndex !== undefined) {
        onPaymentConfigChange(branchIndex, newState);
      }
      
      return newState;
    });
  };
  console.log(branchIndex, 'branchIndexbranchIndex');

  return (
    <div className={'d-flex flex-column gap-1'}>
      <div>
        <Button onClick={addNewPaymentConfig}>Add New {moduleCode} Config</Button>
      </div>
      {editingBranchPayments?.filter(config => config.moduleCode === moduleCode).map((config, index) => {
        const actualIndex = editingBranchPayments.findIndex(c => c === config);
        return (
          <React.Fragment key={actualIndex}>
            <div className="d-flex gap-2">
              <div className="d-flex flex-column gap-2 col-6">
                <div className={'d-flex flex-column gap-'}>
                  <label className="fw-bold">Active</label>
                  <Checkbox checked={config.active} onChange={e => handleChange(actualIndex, 'active', e.checked)} />
                </div>

                <div className={'d-flex flex-column gap-'}>
                  <label className="fw-bold">Default Selected</label>
                  <Checkbox checked={config.defaultSelected} onChange={e => handleChange(actualIndex, 'defaultSelected', e.checked)} />
                </div>

                <div className={'d-flex flex-column gap-'}>
                  <label className="fw-bold">Environment</label>
                  <SelectButton
                    options={['TEST', 'PROD']}
                    value={config.environment}
                    onChange={e => handleChange(actualIndex, 'environment', e.target.value)}
                  />
                </div>

                <div className={'d-flex flex-column gap-'}>
                  <label className="fw-bold">Gateway</label>
                  <InputText value={config.gateway} onChange={e => handleChange(actualIndex, 'gateway', e.target.value)} />
                </div>
                <div className={'d-flex flex-column gap-'}>
                  <label className="fw-bold">Module Code</label>
                  <InputText value={config.moduleCode} disabled />
                </div>
              </div>
              <div key={actualIndex} className="d-flex flex-column gap-2 col-6">
                {config.integrationKeys && (
                  <div>
                    {Object.keys(config.integrationKeys).map(key => (
                      <div key={key} className={'d-flex flex-column my-2'}>
                        <label className={'fw-bold'}>{camelToTitle(key)}</label>
                        <InputText
                          value={config.integrationKeys[key]}
                          onChange={e => handleChange(actualIndex, `integrationKeys.${key}`, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {index < editingBranchPayments.filter(c => c.moduleCode === moduleCode).length - 1 && <hr className="my-5 border border-dark" />}
          </React.Fragment>
        );
      })}
      
      {(!editingBranchPayments?.some(config => config.moduleCode === moduleCode)) && (
        <div className="text-center p-4">
          <p>No {moduleCode} configurations found. Click &quot;Add New {moduleCode} Config&quot; to create one.</p>
        </div>
      )}
    </div>
  );
};

export default BranchPaymentConfig;
