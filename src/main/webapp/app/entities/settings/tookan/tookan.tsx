import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, Save } from 'lucide-react';
import { toast } from 'react-toastify';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { runtimeConfig } from 'app/config/runtime-config';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import {
  defaultTookanSettingValue,
  ITookanSettingRequest,
  ITookanSettingValue,
  normalizeTookanSettingValue,
} from 'app/shared/model/tookan-setting.model';
import { getTenantFromURL } from 'app/shared/util/tenant-utils';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { changeEntityField, getTookanAgents, getTookanSetting, getTookanTeams, updateTookanSetting } from './tookan.reducer';

const TookanSettings = () => {
  const dispatch = useAppDispatch();
  const branches = useAppSelector(state => state.branch.entities);
  const tookanEntity = useAppSelector(state => state.tookanSetting.entity);
  const teams = useAppSelector(state => state.tookanSetting.teams);
  const loading = useAppSelector(state => state.tookanSetting.loading);
  const updating = useAppSelector(state => state.tookanSetting.updating);
  const updateSuccess = useAppSelector(state => state.tookanSetting.updateSuccess);

  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [webhookSecretInput, setWebhookSecretInput] = useState('');

  const tenant = getTenantFromURL() || '{tenant}';
  const webhookBaseUrl = useMemo(() => runtimeConfig.SERVER_DOMAIN.replace(/\/$/, ''), []);
  const webhookUrl = useMemo(() => `${webhookBaseUrl}/api/tookan/event/${tenant}`, [tenant, webhookBaseUrl]);
  const tookanPlatformFeeQuery = useMemo(
    () =>
      encodeURIComponent(
        JSON.stringify({
          first: 0,
          rows: 20,
          page: 0,
          sortField: null,
          sortOrder: null,
          filters: {
            key: { value: 'PLATFORM_FEE', matchMode: 'equals' },
            deliveryProvider: { value: 'TOOKAN', matchMode: 'equals' },
          },
        })
      ),
    []
  );
  const settingValue = normalizeTookanSettingValue(tookanEntity.value || defaultTookanSettingValue);

  useEffect(() => {
    dispatch(getBranches({}));
  }, [dispatch]);

  useEffect(() => {
    if (!selectedBranchId && branches?.length > 0 && branches[0].id) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

  useEffect(() => {
    if (!selectedBranchId) return;
    dispatch(getTookanSetting(selectedBranchId));
    dispatch(getTookanTeams(selectedBranchId));
  }, [dispatch, selectedBranchId]);

  useEffect(() => {
    if (!selectedBranchId) return;
    dispatch(getTookanAgents({ branchId: selectedBranchId, teamId: settingValue.teamId ?? null }));
  }, [dispatch, selectedBranchId, settingValue.teamId]);

  useEffect(() => {
    if (updateSuccess) {
      toast.success('Tookan settings saved.');
      setApiKeyInput('');
      setWebhookSecretInput('');
    }
  }, [updateSuccess]);

  const updateField = (name: keyof ITookanSettingValue, value: any) => {
    dispatch(changeEntityField({ name, value }));
  };

  const getApiErrorMessage = (error: any, fallback: string) => {
    const data = error?.response?.data;
    return (
      data?.message ||
      data?.localizedMessage ||
      data?.detail ||
      data?.title ||
      error?.message ||
      fallback
    );
  };

  const onSave = async () => {
    if (!selectedBranchId) {
      toast.error('Please select a branch first.');
      return;
    }
    const normalized = normalizeTookanSettingValue(settingValue);
    const { deliveryConfiguration: _dc, chargeCalculationSetting: _ccs, ...integrationOnly } = normalized;
    void _dc;
    void _ccs;
    const request: ITookanSettingRequest = {
      branchId: selectedBranchId,
      value: {
        ...integrationOnly,
        apiKey: apiKeyInput.trim(),
        webhookSharedSecret: webhookSecretInput.trim(),
      },
    };
    try {
      await dispatch(updateTookanSetting(request)).unwrap();
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to save Tookan settings.'));
    }
  };

  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast.success('Webhook URL copied.');
    } catch (error) {
      toast.error('Failed to copy webhook URL.');
    }
  };

  return (
    <PageWrapper className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Tookan Settings</h2>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="h-8 text-xs">
            <Link to="/integrations">
              <ArrowLeft className="h-3 w-3 mr-1" />
              Back
            </Link>
          </Button>
          <Button type="button" className="h-8 text-xs" disabled={updating || !selectedBranchId} onClick={onSave}>
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Branch Delivery Provider Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Branch</Label>
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name || branch.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Default Team</Label>
              <Select
                value={settingValue.teamId != null ? String(settingValue.teamId) : 'none'}
                onValueChange={value => updateField('teamId', value === 'none' ? undefined : Number(value))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No default team</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={String(team.team_id)} value={String(team.team_id)}>
                      {team.team_name || `Team ${team.team_id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">API Key</Label>
              <Input
                type="password"
                className="h-8 text-xs"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                placeholder={tookanEntity.hasApiKey ? 'Saved (leave blank to keep current)' : 'Enter API key'}
              />
              <p className="text-[11px] text-muted-foreground">{tookanEntity.hasApiKey ? 'API key already configured.' : 'No API key configured yet.'}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Webhook Shared Secret</Label>
              <Input
                type="password"
                className="h-8 text-xs"
                value={webhookSecretInput}
                onChange={e => setWebhookSecretInput(e.target.value)}
                placeholder={tookanEntity.hasWebhookSecret ? 'Saved (leave blank to keep current)' : 'Enter webhook shared secret'}
              />
              <p className="text-[11px] text-muted-foreground">
                {tookanEntity.hasWebhookSecret ? 'Webhook secret already configured.' : 'No webhook secret configured yet.'}
              </p>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            <label className="flex items-center gap-2">
              <Checkbox checked={!!settingValue.active} onCheckedChange={checked => updateField('active', !!checked)} />
              <span>Active</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox checked={!!settingValue.autoAssignment} onCheckedChange={checked => updateField('autoAssignment', !!checked)} />
              <span>Auto Assignment</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox checked={!!settingValue.notify} onCheckedChange={checked => updateField('notify', !!checked)} />
              <span>Notify Driver</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox checked={!!settingValue.geofence} onCheckedChange={checked => updateField('geofence', !!checked)} />
              <span>Enable Geofence</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox checked={!!settingValue.trackingLink} onCheckedChange={checked => updateField('trackingLink', !!checked)} />
              <span>Tracking Link</span>
            </label>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Webhook URL</Label>
            <div className="flex gap-2">
              <Input className="h-8 text-xs" value={webhookUrl} readOnly />
              <Button type="button" variant="outline" className="h-8 text-xs" onClick={copyWebhookUrl}>
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Configure this URL in Tookan notifications. Append `?task_history=1` if needed.</p>
          </div>

          <div className="text-[11px] text-muted-foreground border-t pt-3 space-y-2">
            <p>
              <strong>Customer delivery fee</strong> (distance bands, min charge, free-delivery threshold) is edited on{' '}
              <Link to="/branches#b0-s2" className="font-medium text-primary underline-offset-2 hover:underline">
                Branches (delivery pricing)
              </Link>{' '}
              <span className="text-muted-foreground">(hash targets branch #0; adjust <code className="text-[10px]">b0</code> if needed)</span>. That data is stored as the{' '}
              <code className="text-[10px]">DELIVERY_PRICING</code> setting for the branch.
            </p>
            <p>
              <strong>Platform / provider fees</strong> use{' '}
              <Link
                to={`/service-charge?query=${tookanPlatformFeeQuery}`}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Service charges
              </Link>{' '}
              with key <code className="text-[10px]">PLATFORM_FEE</code> and the same delivery provider (e.g. Tookan).
            </p>
          </div>

          {loading && <p className="text-[11px] text-muted-foreground">Loading Tookan settings...</p>}
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default TookanSettings;
