import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { cloneDeep } from 'lodash';
import { camelToTitle } from 'app/shared/util/string-utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type PaymentEnvironment = 'TEST' | 'PROD';

const CONVERGE_MODULE_CODE = 'CONVERGE_LIGHTBOX';
const FAKE_MODULE_CODE = 'FAKE_ONLINE_CARD';

/** Demo lightbox matches commented examples in onlineordering layouts; API paths are standard Converge hosted-payments endpoints. */
const CONVERGE_DEFAULT_URLS: Record<PaymentEnvironment, { apiUrl: string; lightboxUrl: string }> = {
  TEST: {
    apiUrl: 'https://api.demo.convergepay.com/hostedpayments/transactions',
    lightboxUrl: 'https://demo.convergepay.com/hosted-payments/PayWithConverge.js',
  },
  PROD: {
    apiUrl: 'https://api.convergepay.com/hosted-payments/transaction_token',
    lightboxUrl: 'https://www.convergepay.com/hosted-payments/PayWithConverge.js',
  },
};

function isBlank(value: unknown): boolean {
  return value == null || (typeof value === 'string' && value.trim() === '');
}

/** Converge token / transaction defaults (hosted payments lightbox). */
const CONVERGE_DEFAULT_SSL = {
  sslTransactionType: 'CCsale',
  sslGetToken: 'Y',
  sslAddToken: 'Y',
} as const;

/** Fills apiUrl, lightboxUrl, sslTransactionType, sslGetToken, sslAddToken when missing (Converge only). */
function applyConvergeIntegrationDefaults(config: any): any {
  if (config?.moduleCode !== CONVERGE_MODULE_CODE || !config.integrationKeys) {
    return config;
  }
  const env: PaymentEnvironment = config.environment === 'PROD' ? 'PROD' : 'TEST';
  const urlDefaults = CONVERGE_DEFAULT_URLS[env];
  const keys = { ...config.integrationKeys };
  let touched = false;

  if (isBlank(keys.apiUrl)) {
    keys.apiUrl = urlDefaults.apiUrl;
    touched = true;
  }
  if (isBlank(keys.lightboxUrl)) {
    keys.lightboxUrl = urlDefaults.lightboxUrl;
    touched = true;
  }
  if (isBlank(keys.sslTransactionType)) {
    keys.sslTransactionType = CONVERGE_DEFAULT_SSL.sslTransactionType;
    touched = true;
  }
  if (isBlank(keys.sslGetToken)) {
    keys.sslGetToken = CONVERGE_DEFAULT_SSL.sslGetToken;
    touched = true;
  }
  if (isBlank(keys.sslAddToken)) {
    keys.sslAddToken = CONVERGE_DEFAULT_SSL.sslAddToken;
    touched = true;
  }

  if (!touched) return config;
  return { ...config, integrationKeys: keys };
}

type BranchPaymentConfigProps = {
  branchIndex?: number;
  editingBranchPayments?: any;
  setEditingBranchPayments?: any;
  moduleCode?: string;
  onPaymentConfigChange?: (branchIndex: number, paymentConfigs: any[]) => void;
};

function createDefaultPaymentConfig(moduleCode: string) {
  const baseConfig = {
    active: false,
    defaultSelected: false,
    environment: 'TEST' as PaymentEnvironment,
    gateway: null as string | null,
    moduleCode,
  };

  if (moduleCode === FAKE_MODULE_CODE) {
    return {
      ...baseConfig,
      integrationKeys: {},
    };
  }

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
  }

  return {
    ...baseConfig,
    integrationKeys: {
      sslMerchantId: '',
      sslUserId: '',
      sslPin: '',
      sslTransactionType: CONVERGE_DEFAULT_SSL.sslTransactionType,
      sslGetToken: CONVERGE_DEFAULT_SSL.sslGetToken,
      sslAddToken: CONVERGE_DEFAULT_SSL.sslAddToken,
      apiUrl: '',
      lightboxUrl: '',
    },
  };
}

function normalizeFakePaymentConfigs(payments: any[]): any[] {
  let changed = false;
  const normalized = payments.map((config) => {
    if (config?.moduleCode !== FAKE_MODULE_CODE || config.gateway === null) {
      return config;
    }
    changed = true;
    return { ...config, gateway: null };
  });
  return changed ? normalized : payments;
}

function ensureTestAndProdConfigs(
  payments: any[] | undefined,
  moduleCode: string
): any[] {
  const list = cloneDeep(payments || []);
  const oldModule = list.filter((c) => c.moduleCode === moduleCode);
  const rest = list.filter((c) => c.moduleCode !== moduleCode);

  let testCfg = oldModule.find((c) => c.environment === 'TEST');
  let prodCfg = oldModule.find((c) => c.environment === 'PROD');

  if (!testCfg && !prodCfg && oldModule.length === 1) {
    const o = cloneDeep(oldModule[0]);
    const env: PaymentEnvironment = o.environment === 'PROD' ? 'PROD' : 'TEST';
    o.environment = env;
    if (env === 'TEST') {
      testCfg = o;
    } else {
      prodCfg = o;
    }
  }

  if (!testCfg) {
    testCfg = { ...createDefaultPaymentConfig(moduleCode), environment: 'TEST' };
  } else {
    testCfg.environment = 'TEST';
  }

  if (!prodCfg) {
    prodCfg = { ...createDefaultPaymentConfig(moduleCode), environment: 'PROD' };
  } else {
    prodCfg.environment = 'PROD';
  }

  if (moduleCode === CONVERGE_MODULE_CODE) {
    testCfg = applyConvergeIntegrationDefaults(testCfg);
    prodCfg = applyConvergeIntegrationDefaults(prodCfg);
  }

  // Fake card is identified by its module code. The gateway field is an
  // optional legacy PaymentType enum and must remain unset for this module.
  if (moduleCode === FAKE_MODULE_CODE) {
    testCfg.gateway = null;
    prodCfg.gateway = null;
  }

  return [...rest, testCfg, prodCfg];
}

const BranchPaymentConfig = ({
  editingBranchPayments,
  setEditingBranchPayments,
  branchIndex,
  moduleCode = 'CONVERGE_LIGHTBOX',
  onPaymentConfigChange,
}: BranchPaymentConfigProps) => {
  const onPaymentConfigChangeRef = useRef(onPaymentConfigChange);
  onPaymentConfigChangeRef.current = onPaymentConfigChange;

  useLayoutEffect(() => {
    if (branchIndex === undefined) return;

    const current = editingBranchPayments || [];
    const hasTest = current.some((c) => c.moduleCode === moduleCode && c.environment === 'TEST');
    const hasProd = current.some((c) => c.moduleCode === moduleCode && c.environment === 'PROD');

    let merged = current;
    if (!hasTest || !hasProd) {
      merged = ensureTestAndProdConfigs(current, moduleCode);
    }

    if (moduleCode === FAKE_MODULE_CODE) {
      merged = normalizeFakePaymentConfigs(merged);
    }

    const structuralChange = merged !== current;

    if (moduleCode === CONVERGE_MODULE_CODE) {
      let urlChange = false;
      const next = merged.map((c) => {
        if (c.moduleCode !== CONVERGE_MODULE_CODE) return c;
        const u = applyConvergeIntegrationDefaults(c);
        if (u !== c) urlChange = true;
        return u;
      });
      if (structuralChange || urlChange) {
        onPaymentConfigChangeRef.current?.(branchIndex, next);
      }
      return;
    }

    if (structuralChange) {
      onPaymentConfigChangeRef.current?.(branchIndex, merged);
    }
  }, [editingBranchPayments, moduleCode, branchIndex]);

  const testIndex = useMemo(
    () => (editingBranchPayments ?? []).findIndex((c) => c.moduleCode === moduleCode && c.environment === 'TEST'),
    [editingBranchPayments, moduleCode]
  );
  const prodIndex = useMemo(
    () => (editingBranchPayments ?? []).findIndex((c) => c.moduleCode === moduleCode && c.environment === 'PROD'),
    [editingBranchPayments, moduleCode]
  );

  const handleChange = (index: number, field: string, value: any) => {
    if (index < 0 || !editingBranchPayments?.[index]) return;

    const newState = cloneDeep(editingBranchPayments || []);
    const [parentKey, childKey] = field.split('.');
    if (childKey) {
      if (!newState[index][parentKey]) newState[index][parentKey] = {};
      newState[index][parentKey][childKey] = value;
    } else {
      newState[index][field] = value;
    }

    const row = newState[index];
    if (row?.moduleCode === moduleCode) {
      const testIdx = newState.findIndex((c) => c.moduleCode === moduleCode && c.environment === 'TEST');
      const prodIdx = newState.findIndex((c) => c.moduleCode === moduleCode && c.environment === 'PROD');
      const turnOn = value === true;

      if (field === 'active' && turnOn) {
        if (row.environment === 'TEST' && prodIdx >= 0) {
          newState[prodIdx].active = false;
        }
        if (row.environment === 'PROD' && testIdx >= 0) {
          newState[testIdx].active = false;
        }
      }

      if (field === 'defaultSelected' && turnOn) {
        if (row.environment === 'TEST' && prodIdx >= 0) {
          newState[prodIdx].defaultSelected = false;
        }
        if (row.environment === 'PROD' && testIdx >= 0) {
          newState[testIdx].defaultSelected = false;
        }
      }
    }

    const nextState = moduleCode === FAKE_MODULE_CODE ? normalizeFakePaymentConfigs(newState) : newState;
    setEditingBranchPayments?.(nextState);
    if (onPaymentConfigChange && branchIndex !== undefined) {
      onPaymentConfigChange(branchIndex, nextState);
    }
  };

  const isFakeModule = moduleCode === FAKE_MODULE_CODE;
  const displayName = isFakeModule ? 'Fake card' : moduleCode === 'BAMBORA' ? 'Bambora' : 'Converge';

  const renderIntegrationFields = (actualIndex: number) => {
    const config = editingBranchPayments?.[actualIndex];
    if (!config?.integrationKeys) return null;
    if (isFakeModule) {
      return <p className="text-xs leading-relaxed text-muted-foreground">No gateway credentials are required for fake card payments.</p>;
    }
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.keys(config.integrationKeys).map((key) => (
          <div key={key} className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">{camelToTitle(key)}</Label>
            <Input
              value={config.integrationKeys[key] ?? ''}
              onChange={(e) => handleChange(actualIndex, `integrationKeys.${key}`, e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        ))}
      </div>
    );
  };

  const renderEnvironmentCard = (
    actualIndex: number,
    title: string,
    description: string,
    badgeClass: string
  ) => {
    if (actualIndex < 0 || !editingBranchPayments?.[actualIndex]) {
      return (
        <Card className="border-dashed">
          <CardContent className="py-6 text-center text-xs text-muted-foreground">Loading {title.toLowerCase()}…</CardContent>
        </Card>
      );
    }

    const config = editingBranchPayments[actualIndex];

    return (
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/20 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-semibold">{title}</CardTitle>
              <CardDescription className="text-[11px] leading-relaxed">{description}</CardDescription>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeClass}`}
            >
              {config.environment}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`active-${actualIndex}`}
                checked={!!config.active}
                onCheckedChange={(checked) => handleChange(actualIndex, 'active', checked)}
              />
              <Label htmlFor={`active-${actualIndex}`} className="cursor-pointer text-xs font-medium">
                Active
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`default-${actualIndex}`}
                checked={!!config.defaultSelected}
                onCheckedChange={(checked) => handleChange(actualIndex, 'defaultSelected', checked)}
              />
              <Label htmlFor={`default-${actualIndex}`} className="cursor-pointer text-xs font-medium">
                Default for {displayName}
              </Label>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">{isFakeModule ? 'Payment type' : 'Gateway (optional)'}</Label>
              {isFakeModule ? (
                <Input value="FAKE_CARD" disabled className="h-8 text-xs bg-muted/50" />
              ) : (
                <Input
                  value={config.gateway || ''}
                  onChange={(e) => handleChange(actualIndex, 'gateway', e.target.value)}
                  className="h-8 text-xs"
                  placeholder="Gateway label or id"
                />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Module</Label>
              <Input value={config.moduleCode} disabled className="h-8 text-xs bg-muted/50" />
            </div>
          </div>

          <div>
            <Label className="mb-2 block text-xs font-semibold">{isFakeModule ? 'Payment behavior' : 'Integration credentials'}</Label>
            {renderIntegrationFields(actualIndex)}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground leading-relaxed">
        {isFakeModule ? (
          <>
            Fake card payments are controlled independently for this branch. Activate the environment you want available in Online Ordering; only one
            should typically be <strong>Active</strong> at a time.
          </>
        ) : (
          <>
            {displayName} uses separate credentials for <strong>testing</strong> (sandbox) and <strong>production</strong> (live). Fill in the
            environment you use; only one should typically be <strong>Active</strong> at a time.
          </>
        )}
      </p>

      {renderEnvironmentCard(
        testIndex,
        'Testing (sandbox)',
        isFakeModule ? 'Use fake card numbers for training and QA.' : 'Use test merchant IDs and sandbox URLs. Safe for training and QA.',
        'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
      )}

      {renderEnvironmentCard(
        prodIndex,
        'Production (live)',
        isFakeModule ? 'Enable this for branches that should accept simulated card payments in production.' : 'Live transactions. Double-check keys before activating.',
        'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200'
      )}
    </div>
  );
};

export default BranchPaymentConfig;
