import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, Save, Truck } from 'lucide-react';
import { toast } from 'react-toastify';

import { runtimeConfig } from 'app/config/runtime-config';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProviderSettingsResponse {
  providerKey: string;
  enabled: boolean;
  configuredCredentials: Record<string, boolean>;
  options: Record<string, unknown>;
}

const defaultSettings: ProviderSettingsResponse = {
  providerKey: 'tookan',
  enabled: false,
  configuredCredentials: { apiKey: false, webhookSharedSecret: false },
  options: { autoAssignment: false, notify: true, geofence: false, trackingLink: true },
};

const apiUrl = '/api/integration-provider-settings/tookan';

const TookanSettings = () => {
  const [settings, setSettings] = useState<ProviderSettingsResponse>(defaultSettings);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [webhookSecretInput, setWebhookSecretInput] = useState('');
  const [teamIdInput, setTeamIdInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const webhookUrl = useMemo(() => `${runtimeConfig.SERVER_DOMAIN.replace(/\/$/, '')}/api/tookan/event`, []);
  const options = { ...defaultSettings.options, ...(settings.options || {}) };

  useEffect(() => {
    axios.get<ProviderSettingsResponse>(apiUrl)
      .then(response => {
        setSettings({ ...defaultSettings, ...response.data, configuredCredentials: { ...defaultSettings.configuredCredentials, ...response.data.configuredCredentials } });
        setTeamIdInput(response.data.options?.teamId == null ? '' : String(response.data.options.teamId));
      })
      .catch(error => toast.error(getApiErrorMessage(error, 'Could not load Tookan settings.')))
      .finally(() => setLoading(false));
  }, []);

  const updateOption = (name: string, value: boolean) => {
    setSettings(current => ({ ...current, options: { ...current.options, [name]: value } }));
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const response = await axios.put<ProviderSettingsResponse>(apiUrl, {
        enabled: settings.enabled,
        credentials: { apiKey: apiKeyInput.trim(), webhookSharedSecret: webhookSecretInput.trim() },
        options: {
          teamId: teamIdInput.trim() ? Number(teamIdInput) : null,
          autoAssignment: options.autoAssignment,
          notify: options.notify,
          geofence: options.geofence,
          trackingLink: options.trackingLink,
        },
      });
      setSettings({ ...defaultSettings, ...response.data, configuredCredentials: { ...defaultSettings.configuredCredentials, ...response.data.configuredCredentials } });
      setTeamIdInput(response.data.options?.teamId == null ? '' : String(response.data.options.teamId));
      setApiKeyInput('');
      setWebhookSecretInput('');
      toast.success('Tookan settings saved.');
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to save Tookan settings.'));
    } finally {
      setSaving(false);
    }
  };

  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast.success('Webhook URL copied.');
    } catch {
      toast.error('Failed to copy webhook URL.');
    }
  };

  const hasApiKey = !!settings.configuredCredentials.apiKey;
  const hasWebhookSecret = !!settings.configuredCredentials.webhookSharedSecret;

  return (
    <PageWrapper className="space-y-5">
      <div className="space-y-3">
        <Button asChild variant="outline" size="sm" className="self-start">
          <Link to="/integrations"><ArrowLeft className="mr-1.5 h-4 w-4" />All integrations</Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Tookan</h2>
              <p className="mt-1 text-sm text-muted-foreground">Connect your dispatch account and set its business-wide defaults.</p>
            </div>
          </div>
          <Button type="button" size="sm" disabled={saving || loading} onClick={onSave}>
            <Save className="mr-1.5 h-4 w-4" />{saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <CardTitle className="text-base">Tookan account</CardTitle>
          <CardDescription className="text-xs">These credentials are encrypted and shared by branches in this business. They are never sent back to the browser.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 p-5">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/20">
            <Checkbox checked={settings.enabled} onCheckedChange={checked => setSettings(current => ({ ...current, enabled: checked === true }))} />
            <span className="space-y-1">
              <span className="block text-sm font-semibold">Enable Tookan for this business</span>
              <span className="block text-xs text-muted-foreground">Individual branches can still turn Tookan delivery off in their delivery settings.</span>
            </span>
          </label>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="tookan-api-key">API key</Label>
              <Input id="tookan-api-key" type="password" value={apiKeyInput} onChange={event => setApiKeyInput(event.target.value)} placeholder={hasApiKey ? 'Saved — leave blank to keep it' : 'Enter Tookan API key'} autoComplete="new-password" />
              <p className="text-xs text-muted-foreground">{hasApiKey ? 'API key is saved.' : 'No API key saved.'}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tookan-webhook-secret">Webhook shared secret</Label>
              <Input id="tookan-webhook-secret" type="password" value={webhookSecretInput} onChange={event => setWebhookSecretInput(event.target.value)} placeholder={hasWebhookSecret ? 'Saved — leave blank to keep it' : 'Enter webhook shared secret'} autoComplete="new-password" />
              <p className="text-xs text-muted-foreground">{hasWebhookSecret ? 'Webhook secret is saved.' : 'No webhook secret saved.'}</p>
            </div>
          </div>

          <div className="grid gap-4 border-t pt-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="tookan-team-id">Default team ID <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="tookan-team-id" inputMode="numeric" value={teamIdInput} onChange={event => setTeamIdInput(event.target.value.replace(/[^0-9]/g, ''))} placeholder="Use Tookan's default team" />
              <p className="text-xs text-muted-foreground">Used when an order does not select a team directly.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['autoAssignment', 'Auto assign drivers'],
                ['notify', 'Notify driver'],
                ['geofence', 'Use geofence'],
                ['trackingLink', 'Include tracking link'],
              ].map(([name, label]) => (
                <label key={name} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox checked={!!options[name]} onCheckedChange={checked => updateOption(name, checked === true)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 border-t pt-4">
            <Label htmlFor="tookan-webhook-url">Webhook URL</Label>
            <div className="flex gap-2">
              <Input id="tookan-webhook-url" className="font-mono text-xs" value={webhookUrl} readOnly />
              <Button type="button" variant="outline" size="icon" aria-label="Copy webhook URL" onClick={copyWebhookUrl}><Copy className="h-4 w-4" /></Button>
            </div>
            <p className="text-xs text-muted-foreground">Add this URL to Tookan notifications. The shared secret is registered with Tookan when credentials are saved.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-semibold">Branch delivery settings</p>
            <p className="mt-1 text-xs text-muted-foreground">Choose which branches dispatch with Tookan in each branch’s Delivery settings.</p>
          </div>
          <Button asChild variant="outline" size="sm"><Link to="/branches">Manage branches</Link></Button>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

function getApiErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data;
  return data?.message || data?.detail || data?.title || error?.message || fallback;
}

export default TookanSettings;
