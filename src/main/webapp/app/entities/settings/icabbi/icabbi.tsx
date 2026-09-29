import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Truck } from 'lucide-react';
import { toast } from 'react-toastify';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { IBranch } from 'app/shared/model/branch.model';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface IIcabbiSettings {
  branchId: string;
  active: boolean;
  live?: boolean;
  url?: string;
  accountId?: string;
  vehicleType?: string;
  assignDriver?: 'AUTO' | 'MANUAL';
  serviceCredentialsConfigured: boolean;
  accountCredentialsConfigured: boolean;
}

const emptySettings = (branchId = ''): IIcabbiSettings => ({
  branchId,
  active: false,
  live: false,
  url: '',
  accountId: '',
  vehicleType: '',
  assignDriver: 'AUTO',
  serviceCredentialsConfigured: false,
  accountCredentialsConfigured: false,
});

const IcabbiSettingsPage = () => {
  const dispatch = useAppDispatch();
  const branches: IBranch[] = useAppSelector(state => state.branch.entities);
  const [branchId, setBranchId] = useState('');
  const [settings, setSettings] = useState<IIcabbiSettings>(emptySettings());
  const [serviceUsername, setServiceUsername] = useState('');
  const [servicePassword, setServicePassword] = useState('');
  const [accountUsername, setAccountUsername] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(getBranches({}));
  }, [dispatch]);

  useEffect(() => {
    if (!branchId && branches.length > 0 && branches[0].id) setBranchId(branches[0].id);
  }, [branches, branchId]);

  useEffect(() => {
    if (!branchId) {
      setSettings(emptySettings());
      return;
    }
    let current = true;
    setLoading(true);
    axios.get<IIcabbiSettings>(`/api/settings/icabbi/${encodeURIComponent(branchId)}`)
      .then(response => { if (current) setSettings({ ...emptySettings(branchId), ...response.data }); })
      .catch(error => { if (current) toast.error(getApiErrorMessage(error, 'Could not load iCabbi settings.')); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [branchId]);

  const updateSettings = <K extends keyof IIcabbiSettings>(key: K, value: IIcabbiSettings[K]) => {
    setSettings(current => ({ ...current, [key]: value }));
  };

  const onSave = async () => {
    if (!branchId) {
      toast.error('Select a branch first.');
      return;
    }
    if (settings.active && (!settings.serviceCredentialsConfigured && (!serviceUsername.trim() || !servicePassword.trim()))) {
      toast.error('Enter the iCabbi service username and password before enabling this branch.');
      return;
    }
    if (settings.active && (!settings.accountCredentialsConfigured && (!accountUsername.trim() || !accountPassword.trim()))) {
      toast.error('Enter the iCabbi account username and password before enabling this branch.');
      return;
    }

    setSaving(true);
    try {
      const response = await axios.put<IIcabbiSettings>('/api/settings/icabbi', {
        branchId,
        value: {
          active: settings.active,
          live: settings.live,
          url: settings.url?.trim(),
          username: serviceUsername.trim(),
          password: servicePassword.trim(),
          accountId: settings.accountId?.trim(),
          vehicleType: settings.vehicleType?.trim(),
          assignDriver: settings.assignDriver,
          icabbiCredentials: { username: accountUsername.trim(), password: accountPassword.trim() },
        },
      });
      setSettings({ ...emptySettings(branchId), ...response.data });
      setServiceUsername('');
      setServicePassword('');
      setAccountUsername('');
      setAccountPassword('');
      toast.success('iCabbi settings saved for this branch.');
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to save iCabbi settings.'));
    } finally {
      setSaving(false);
    }
  };

  const branchName = branches.find(branch => branch.id === branchId)?.name;

  return (
    <PageWrapper className="space-y-5">
      <div className="space-y-3">
        <Button asChild variant="outline" size="sm" className="self-start">
          <Link to="/integrations"><ArrowLeft className="mr-1.5 h-4 w-4" />All integrations</Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">iCabbi</h2>
              <p className="mt-1 text-sm text-muted-foreground">Set up iCabbi separately for each branch.</p>
            </div>
          </div>
          <Button type="button" size="sm" disabled={saving || loading || !branchId} onClick={onSave}><Save className="mr-1.5 h-4 w-4" />{saving ? 'Saving…' : 'Save branch setup'}</Button>
        </div>
      </div>

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <CardTitle className="text-base">Branch connection</CardTitle>
          <CardDescription className="text-xs">The connection, credentials, and driver settings below are saved only for the selected branch.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="icabbi-branch">Branch</Label>
              <Select value={branchId || 'none'} onValueChange={value => setBranchId(value === 'none' ? '' : value)}>
                <SelectTrigger id="icabbi-branch"><SelectValue placeholder="Choose a branch" /></SelectTrigger>
                <SelectContent>
                  {branches.length === 0 && <SelectItem value="none">No branches available</SelectItem>}
                  {branches.map(branch => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border p-3">
              <Checkbox checked={settings.active} onCheckedChange={checked => updateSettings('active', checked === true)} />
              <span><span className="block text-sm font-semibold">Enable iCabbi for {branchName || 'this branch'}</span><span className="text-xs text-muted-foreground">Delivery bookings for this branch will use iCabbi.</span></span>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="icabbi-url">Service URL</Label><Input id="icabbi-url" value={settings.url || ''} onChange={event => updateSettings('url', event.target.value)} placeholder="iCabbi service URL" /></div>
            <div className="space-y-1.5"><Label htmlFor="icabbi-account-id">Account ID</Label><Input id="icabbi-account-id" value={settings.accountId || ''} onChange={event => updateSettings('accountId', event.target.value)} placeholder="Account ID" /></div>
            <div className="space-y-1.5"><Label htmlFor="icabbi-vehicle-type">Vehicle type</Label><Input id="icabbi-vehicle-type" value={settings.vehicleType || ''} onChange={event => updateSettings('vehicleType', event.target.value)} placeholder="Vehicle type" /></div>
            <div className="space-y-1.5">
              <Label htmlFor="icabbi-driver">Driver assignment</Label>
              <Select value={settings.assignDriver || 'AUTO'} onValueChange={value => updateSettings('assignDriver', value as 'AUTO' | 'MANUAL')}>
                <SelectTrigger id="icabbi-driver"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="AUTO">Automatic</SelectItem><SelectItem value="MANUAL">Manual</SelectItem></SelectContent>
              </Select>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm"><Checkbox checked={!!settings.live} onCheckedChange={checked => updateSettings('live', checked === true)} />Use live iCabbi service</label>

          <div className="grid gap-4 border-t pt-5 md:grid-cols-2">
            <CredentialInput id="icabbi-service-username" label="Service username" configured={settings.serviceCredentialsConfigured} value={serviceUsername} onChange={setServiceUsername} />
            <CredentialInput id="icabbi-service-password" label="Service password" configured={settings.serviceCredentialsConfigured} value={servicePassword} onChange={setServicePassword} />
            <CredentialInput id="icabbi-account-username" label="iCabbi account username" configured={settings.accountCredentialsConfigured} value={accountUsername} onChange={setAccountUsername} />
            <CredentialInput id="icabbi-account-password" label="iCabbi account password" configured={settings.accountCredentialsConfigured} value={accountPassword} onChange={setAccountPassword} />
          </div>
          <p className="text-xs text-muted-foreground">Saved passwords are encrypted and never returned to the page. Leave a credential blank to keep its saved value.</p>
          {loading && <p className="text-xs text-muted-foreground">Loading settings…</p>}
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

function CredentialInput(props: { id: string; label: string; configured: boolean; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={props.id}>{props.label}</Label>
      <Input id={props.id} type="password" value={props.value} onChange={event => props.onChange(event.target.value)} placeholder={props.configured ? 'Saved — leave blank to keep it' : `Enter ${props.label.toLowerCase()}`} autoComplete="new-password" />
      <p className="text-xs text-muted-foreground">{props.configured ? 'Credential is saved.' : 'No credential saved.'}</p>
    </div>
  );
}

function getApiErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data;
  return data?.message || data?.detail || data?.title || error?.message || fallback;
}

export default IcabbiSettingsPage;
