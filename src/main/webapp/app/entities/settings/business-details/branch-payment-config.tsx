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
  setEditingBranchPayments?: any

};

const BranchPaymentConfig = ({ editingBranchPayments, setEditingBranchPayments, branchIndex }: BranchPaymentConfigProps) => {
  const defaultConfig = {
    active: false,
    defaultSelected: false,
    environment: 'TEST',
    gateway: null,
    moduleCode: 'CONVERGE_LIGHTBOX',
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

  const handleChange = (index: number, field: string, value: any) => {
    setEditingBranchPayments(prevState => {
      const newState = cloneDeep(prevState);
      const [parentKey, childKey] = field.split('.');
      if (childKey) {
        newState[index][parentKey][childKey] = value;
      } else {
        newState[index][field] = value;
      }
      return newState;
    });
  };

  const addNewPaymentConfig = () => {
    setEditingBranchPayments(prevState => {
      const newState = cloneDeep(prevState);
      newState.push(defaultConfig);
      return newState;
    });
  };
  console.log(branchIndex, 'branchIndexbranchIndex');

  return (
    <div className={'d-flex flex-column gap-1'}>
      <div>
        <Button onClick={addNewPaymentConfig}>Add New Config</Button>
      </div>
      {editingBranchPayments?.map((config, index) => {
        return (
          <React.Fragment key={index}>
            <div className="d-flex gap-2">
              <div className="d-flex flex-column gap-2 col-6">
                <div className={'d-flex flex-column gap-'}>
                  <label className="fw-bold">Active</label>
                  <Checkbox checked={config.active} onChange={e => handleChange(index, 'active', e.checked)} />
                </div>

                <div className={'d-flex flex-column gap-'}>
                  <label className="fw-bold">Default Selected</label>
                  <Checkbox checked={config.defaultSelected} onChange={e => handleChange(index, 'defaultSelected', e.checked)} />
                </div>

                <div className={'d-flex flex-column gap-'}>
                  <label className="fw-bold">Environment</label>
                  <SelectButton
                    options={['TEST', 'PROD']}
                    value={config.environment}
                    onChange={e => handleChange(index, 'environment', e.target.value)}
                  />
                </div>

                <div className={'d-flex flex-column gap-'}>
                  <label className="fw-bold">Gateway</label>
                  <InputText value={config.gateway} onChange={e => handleChange(index, 'gateway', e.target.value)} />
                </div>
                <div className={'d-flex flex-column gap-'}>
                  <label className="fw-bold">Module Code</label>
                  <InputText value={config.moduleCode} disabled />
                </div>
              </div>
              <div key={index} className="d-flex flex-column gap-2 col-6">
                {config.integrationKeys && (
                  <div>
                    {Object.keys(config.integrationKeys).map(key => (
                      <div key={key} className={'d-flex flex-column my-2'}>
                        <label className={'fw-bold'}>{camelToTitle(key)}</label>
                        <InputText
                          value={config.integrationKeys[key]}
                          onChange={e => handleChange(index, `integrationKeys.${key}`, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {index < editingBranchPayments.length - 1 && <hr className="my-5 border border-dark" />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default BranchPaymentConfig;
