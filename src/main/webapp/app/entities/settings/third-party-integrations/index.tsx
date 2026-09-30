import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { IBranch } from 'app/shared/model/branch.model';
import { IMenu } from 'app/shared/model/menu.model';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button as LinkButton } from '@/components/ui/button';
import './third-party-integrations.scss';

interface ProviderOption {
  providerKey: string;
  displayName: string;
}

interface ThirdPartyIntegration {
  id?: string;
  providerKey: string;
  branchId: string;
  menuId: string;
  menuName?: string;
  externalStoreId: string;
  enabled: boolean;
  syncStatus?: string;
  lastError?: string;
  lastMenuSyncAt?: string;
}

interface ProviderSettingsResponse {
  providerKey: string;
  enabled: boolean;
  environment?: string;
  configuredCredentials: Record<string, boolean>;
}

const blankIntegration = (providerKey = ''): ThirdPartyIntegration => ({
  providerKey,
  branchId: '',
  menuId: '',
  externalStoreId: '',
  enabled: true,
});

const ThirdPartyIntegrationsPage = () => {
  const dispatch = useAppDispatch();
  const branches: IBranch[] = useAppSelector(state => state.branch.entities);
  const toastRef = React.useRef<Toast | null>(null);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [integrations, setIntegrations] = useState<ThirdPartyIntegration[]>([]);
  const [menus, setMenus] = useState<IMenu[]>([]);
  const [providerSettings, setProviderSettings] = useState<ProviderSettingsResponse>({
    providerKey: 'uber_eats',
    enabled: false,
    environment: 'SANDBOX',
    configuredCredentials: { clientId: false, clientSecret: false },
  });
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [draft, setDraft] = useState<ThirdPartyIntegration>(blankIntegration());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingProviderSettings, setSavingProviderSettings] = useState(false);
  const [loadingMenus, setLoadingMenus] = useState(false);

  const selectedBranch = useMemo(() => branches.find(branch => branch.id === draft.branchId), [branches, draft.branchId]);

  const loadConnections = useCallback(async () => {
    setLoading(true);
    try {
      const [providerResponse, integrationResponse, settingsResponse] = await Promise.all([
        axios.get<ProviderOption[]>('/api/third-party-integrations/providers'),
        axios.get<ThirdPartyIntegration[]>('/api/third-party-integrations'),
        axios.get<ProviderSettingsResponse>('/api/integration-provider-settings/uber_eats'),
      ]);
      setProviders(providerResponse.data);
      setIntegrations(integrationResponse.data);
      setProviderSettings({ ...settingsResponse.data, configuredCredentials: settingsResponse.data.configuredCredentials || {} });
      setDraft(current => current.providerKey ? current : blankIntegration(providerResponse.data[0]?.providerKey || ''));
    } catch (error: any) {
      toastRef.current?.show({ severity: 'error', summary: 'Could not load integrations', detail: error?.response?.data?.message || 'Please try again.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    dispatch(getBranches({}));
    loadConnections();
  }, [dispatch, loadConnections]);

  useEffect(() => {
    if (!draft.branchId) {
      setMenus([]);
      return;
    }
    let active = true;
    setLoadingMenus(true);
    axios.get<IMenu[]>(`/api/menus/branch/${encodeURIComponent(draft.branchId)}?type=ONLINE_ORDERING`)
      .then(response => { if (active) setMenus(response.data); })
      .catch(() => { if (active) setMenus([]); })
      .finally(() => { if (active) setLoadingMenus(false); });
    return () => { active = false; };
  }, [draft.branchId]);

  const updateDraft = (field: keyof ThirdPartyIntegration, value: string | boolean) => {
    setDraft(current => ({ ...current, [field]: value }));
  };

  const saveProviderSettings = async () => {
    setSavingProviderSettings(true);
    try {
      const response = await axios.put<ProviderSettingsResponse>('/api/integration-provider-settings/uber_eats', {
        enabled: providerSettings.enabled,
        environment: providerSettings.environment || 'SANDBOX',
        credentials: { clientId: clientIdInput.trim(), clientSecret: clientSecretInput.trim() },
      });
      setProviderSettings({ ...response.data, configuredCredentials: response.data.configuredCredentials || {} });
      setClientIdInput('');
      setClientSecretInput('');
      toastRef.current?.show({ severity: 'success', summary: 'Uber Eats settings saved' });
    } catch (error: any) {
      toastRef.current?.show({ severity: 'error', summary: 'Could not save Uber Eats settings', detail: error?.response?.data?.message || 'Please check the credentials and try again.' });
    } finally {
      setSavingProviderSettings(false);
    }
  };

  const editIntegration = (integration: ThirdPartyIntegration) => setDraft({ ...integration });

  const saveIntegration = async () => {
    if (!draft.providerKey || !draft.branchId || !draft.menuId || !draft.externalStoreId.trim()) {
      toastRef.current?.show({ severity: 'warn', summary: 'Complete the required fields', detail: 'Choose a provider, branch, Online Ordering menu, and provider store ID.' });
      return;
    }
    setSaving(true);
    try {
      const request = { ...draft, externalStoreId: draft.externalStoreId.trim() };
      if (draft.id) await axios.put(`/api/third-party-integrations/${encodeURIComponent(draft.id)}`, request);
      else await axios.post('/api/third-party-integrations', request);
      toastRef.current?.show({ severity: 'success', summary: 'Integration saved' });
      await loadConnections();
    } catch (error: any) {
      toastRef.current?.show({ severity: 'error', summary: 'Could not save integration', detail: error?.response?.data?.message || 'Please check the connection details.' });
    } finally {
      setSaving(false);
    }
  };

  const syncMenu = async (integration: ThirdPartyIntegration) => {
    if (!integration.id) return;
    try {
      await axios.post(`/api/third-party-integrations/${encodeURIComponent(integration.id)}/sync-menu`);
      toastRef.current?.show({ severity: 'success', summary: 'Menu sync completed' });
      await loadConnections();
    } catch (error: any) {
      toastRef.current?.show({ severity: 'error', summary: 'Menu sync failed', detail: error?.response?.data?.message || 'The connection will retry automatically.' });
    }
  };

  const disconnect = async (integration: ThirdPartyIntegration) => {
    if (!integration.id || !window.confirm('Disable this provider connection?')) return;
    try {
      await axios.delete(`/api/third-party-integrations/${encodeURIComponent(integration.id)}`);
      toastRef.current?.show({ severity: 'success', summary: 'Connection disabled' });
      await loadConnections();
    } catch (error: any) {
      toastRef.current?.show({ severity: 'error', summary: 'Could not disable connection', detail: error?.response?.data?.message || 'Please try again.' });
    }
  };

  const branchName = (row: ThirdPartyIntegration) => branches.find(branch => branch.id === row.branchId)?.name || row.branchId;
  const menuName = (row: ThirdPartyIntegration) => row.menuName || row.menuId;
  const statusBody = (row: ThirdPartyIntegration) => {
    const status = row.enabled ? (row.syncStatus || 'ENABLED') : 'DISABLED';
    const severity = status === 'SYNCED' ? 'success' : status === 'ERROR' ? 'danger' : status === 'DISABLED' ? 'secondary' : 'warning';
    return <Tag value={status} severity={severity as any} />;
  };
  const actionsBody = (row: ThirdPartyIntegration) => (
    <div className="flex gap-2">
      <Button label="Edit" icon="pi pi-pencil" className="p-button-sm p-button-outlined" onClick={() => editIntegration(row)} />
      <Button label="Sync menu" icon="pi pi-refresh" className="p-button-sm" disabled={!row.enabled} onClick={() => syncMenu(row)} />
      <Button label="Disable" icon="pi pi-ban" className="p-button-sm p-button-danger p-button-outlined" disabled={!row.enabled} onClick={() => disconnect(row)} />
    </div>
  );

  return (
    <PageWrapper className="third-party-integrations-page space-y-4">
      <Toast ref={toastRef} />
      <div className="integration-header flex flex-col gap-3">
        <LinkButton asChild variant="outline" size="sm" className="self-start">
          <Link to="/integrations"><ArrowLeft className="mr-1.5 h-4 w-4" />All integrations</Link>
        </LinkButton>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold">Order channels</h2>
            <p className="text-sm text-muted-foreground">Connect marketplace stores to branches and menus. Incoming marketplace orders are created here; Cloudlinks orders are never sent back.</p>
          </div>
          <Button label="New store connection" icon="pi pi-plus" onClick={() => setDraft(blankIntegration(providers[0]?.providerKey || ''))} />
        </div>
      </div>

      <section className="integration-panel provider-credentials-panel">
        <div className="provider-credentials-heading">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">Uber Eats developer app</h3>
              <Tag value={providerSettings.enabled ? 'ENABLED' : 'DISABLED'} severity={providerSettings.enabled ? 'success' : 'secondary'} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">One encrypted account setup for this business. Each Uber Eats store below is mapped to its own branch and menu.</p>
          </div>
        </div>
        <div className="provider-credentials-grid">
          <label className="integration-field flex flex-col gap-1 text-sm"><span>Environment</span>
            <Dropdown className="integration-control" panelClassName="third-party-integrations-dropdown-panel" value={providerSettings.environment || 'SANDBOX'} options={[
              { label: 'Sandbox / test', value: 'SANDBOX' },
              { label: 'Production', value: 'PRODUCTION' },
            ]} optionLabel="label" optionValue="value" onChange={event => setProviderSettings(current => ({ ...current, environment: event.value }))} />
          </label>
          <label className="integration-field flex flex-col gap-1 text-sm"><span>Client ID</span>
            <InputText className="integration-control" value={clientIdInput} onChange={event => setClientIdInput(event.target.value)} placeholder={providerSettings.configuredCredentials.clientId ? 'Saved — leave blank to keep it' : 'Enter client ID'} autoComplete="off" />
          </label>
          <label className="integration-field flex flex-col gap-1 text-sm"><span>Client secret</span>
            <InputText type="password" className="integration-control" value={clientSecretInput} onChange={event => setClientSecretInput(event.target.value)} placeholder={providerSettings.configuredCredentials.clientSecret ? 'Saved — leave blank to keep it' : 'Enter client secret'} autoComplete="new-password" />
          </label>
          <label className="integration-enabled flex items-center gap-2 text-sm">
            <input type="checkbox" checked={providerSettings.enabled} onChange={event => setProviderSettings(current => ({ ...current, enabled: event.target.checked }))} />
            Enable Uber Eats for this business
          </label>
        </div>
        <div className="integration-help my-4 text-sm">
          The client secret is encrypted in the business database, used server-side for Uber API access and webhook signature checks, and never returned to this page. Keep the webhook configured to the Central endpoint.
        </div>
        <div className="integration-form-actions flex flex-wrap gap-2">
          <Button label={savingProviderSettings ? 'Saving…' : 'Save account settings'} icon="pi pi-check" disabled={savingProviderSettings || loading} onClick={saveProviderSettings} />
          <span className="self-center text-xs text-muted-foreground">
            {providerSettings.configuredCredentials.clientId && providerSettings.configuredCredentials.clientSecret ? 'Client ID and secret are saved.' : 'Add both credentials to enable the connection.'}
          </span>
        </div>
      </section>

      <section className="integration-panel">
        <h3 className="mb-1 text-base font-semibold">{draft.id ? 'Edit connection' : 'Add connection'}</h3>
        <p className="mb-4 text-sm text-muted-foreground">Connect one provider store to the branch and menu it should sync with.</p>
        <div className="integration-form-grid grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="integration-field flex flex-col gap-1 text-sm"><span>Provider</span>
            <Dropdown className="integration-control" panelClassName="third-party-integrations-dropdown-panel" value={draft.providerKey} options={providers} optionLabel="displayName" optionValue="providerKey" onChange={event => updateDraft('providerKey', event.value)} placeholder="Choose a provider" disabled={Boolean(draft.id)} />
          </label>
          <label className="integration-field flex flex-col gap-1 text-sm"><span>Branch</span>
            <Dropdown className="integration-control" panelClassName="third-party-integrations-dropdown-panel" value={draft.branchId} options={branches} optionLabel="name" optionValue="id" onChange={event => setDraft(current => ({ ...current, branchId: event.value, menuId: '' }))} placeholder="Choose a branch" />
          </label>
          <label className="integration-field flex flex-col gap-1 text-sm"><span>Central Online Ordering menu</span>
            <Dropdown className="integration-control" panelClassName="third-party-integrations-dropdown-panel" value={draft.menuId} options={menus} optionLabel="name" optionValue="id" onChange={event => updateDraft('menuId', event.value)} placeholder={loadingMenus ? 'Loading menus…' : 'Choose a menu'} disabled={!draft.branchId || loadingMenus} />
          </label>
          <label className="integration-field flex flex-col gap-1 text-sm"><span>Provider store ID</span>
            <InputText className="integration-control" value={draft.externalStoreId} onChange={event => updateDraft('externalStoreId', event.target.value)} placeholder="Store ID from the provider" />
          </label>
          <label className="integration-enabled flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" checked={draft.enabled} onChange={event => updateDraft('enabled', event.target.checked)} />
            Enable this connection
          </label>
        </div>
        <div className="integration-help my-4 text-sm">Store connections are branch-level: each Uber Eats store receives orders in the selected branch and syncs items with the selected Online Ordering menu. The same menu connection can send item changes to Uber Eats; orders created in Cloudlinks are not uploaded there.</div>
        <div className="integration-form-actions flex flex-wrap gap-2">
          <Button label={saving ? 'Saving…' : 'Save connection'} icon="pi pi-check" disabled={saving || loading} onClick={saveIntegration} />
          {draft.id ? <Button label="Cancel edit" className="p-button-outlined" onClick={() => setDraft(blankIntegration(providers[0]?.providerKey || ''))} /> : null}
        </div>
        {selectedBranch && menus.length === 0 && !loadingMenus ? <p className="integration-warning mt-3 text-sm">This branch has no Online Ordering menu to connect.</p> : null}
      </section>

      <div className="integration-panel integration-table-panel">
        <div className="mb-3">
          <h3 className="text-base font-semibold">Connected stores</h3>
          <p className="text-sm text-muted-foreground">View sync status and manage each provider connection.</p>
        </div>
        <DataTable className="integration-datatable" value={integrations} loading={loading} emptyMessage="No third-party connections are configured yet." responsiveLayout="scroll" dataKey="id">
          <Column field="providerKey" header="Provider" body={(row: ThirdPartyIntegration) => providers.find(provider => provider.providerKey === row.providerKey)?.displayName || row.providerKey} />
          <Column header="Branch" body={branchName} />
          <Column header="Central menu" body={menuName} />
          <Column field="externalStoreId" header="Provider store" />
          <Column header="Status" body={statusBody} />
          <Column header="Last menu sync" body={(row: ThirdPartyIntegration) => row.lastMenuSyncAt ? new Date(row.lastMenuSyncAt).toLocaleString() : 'Not synced'} />
          <Column header="Actions" body={actionsBody} />
        </DataTable>
      </div>
    </PageWrapper>
  );
};

export default ThirdPartyIntegrationsPage;
