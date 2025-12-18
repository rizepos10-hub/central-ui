import React, { useState } from "react";
import { cloneDeep } from "lodash";
import { camelToTitle } from "app/shared/util/string-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
    <div className="flex flex-col gap-4">
      <div>
        <Button onClick={addNewPaymentConfig} className="h-7 text-xs">
          Add New {moduleCode} Config
        </Button>
      </div>
      {editingBranchPayments?.filter(config => config.moduleCode === moduleCode).map((config, index) => {
        const actualIndex = editingBranchPayments.findIndex(c => c === config);
        return (
          <React.Fragment key={actualIndex}>
            <div className="flex gap-4">
              <div className="flex flex-col gap-3 w-1/2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`active-${actualIndex}`}
                    checked={config.active}
                    onCheckedChange={(checked) => handleChange(actualIndex, 'active', checked)}
                  />
                  <Label htmlFor={`active-${actualIndex}`} className="font-bold text-xs cursor-pointer">
                    Active
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`default-${actualIndex}`}
                    checked={config.defaultSelected}
                    onCheckedChange={(checked) => handleChange(actualIndex, 'defaultSelected', checked)}
                  />
                  <Label htmlFor={`default-${actualIndex}`} className="font-bold text-xs cursor-pointer">
                    Default Selected
                  </Label>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="font-bold text-xs">Environment</Label>
                  <RadioGroup
                    value={config.environment}
                    onValueChange={(value) => handleChange(actualIndex, 'environment', value)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="TEST" id={`test-${actualIndex}`} />
                      <Label htmlFor={`test-${actualIndex}`} className="text-xs cursor-pointer">
                        TEST
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="PROD" id={`prod-${actualIndex}`} />
                      <Label htmlFor={`prod-${actualIndex}`} className="text-xs cursor-pointer">
                        PROD
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="font-bold text-xs">Gateway</Label>
                  <Input
                    value={config.gateway || ''}
                    onChange={(e) => handleChange(actualIndex, 'gateway', e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="font-bold text-xs">Module Code</Label>
                  <Input
                    value={config.moduleCode}
                    disabled
                    className="h-7 text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 w-1/2">
                {config.integrationKeys && (
                  <div className="space-y-3">
                    {Object.keys(config.integrationKeys).map(key => (
                      <div key={key} className="flex flex-col gap-1">
                        <Label className="font-bold text-xs">{camelToTitle(key)}</Label>
                        <Input
                          value={config.integrationKeys[key]}
                          onChange={(e) => handleChange(actualIndex, `integrationKeys.${key}`, e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {index < editingBranchPayments.filter(c => c.moduleCode === moduleCode).length - 1 && (
              <hr className="my-5 border-t" />
            )}
          </React.Fragment>
        );
      })}

      {(!editingBranchPayments?.some(config => config.moduleCode === moduleCode)) && (
        <div className="text-center p-4">
          <p className="text-sm text-muted-foreground">
            No {moduleCode} configurations found. Click &quot;Add New {moduleCode} Config&quot; to create one.
          </p>
        </div>
      )}
    </div>
  );
};

export default BranchPaymentConfig;
