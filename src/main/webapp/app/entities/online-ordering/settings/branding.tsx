import React, { useEffect } from 'react';
import { Save } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IBrandingSettings } from 'app/shared/model/ONLINE_ORDERING/ui-settings-sections.model';
import { ISocialProfiles } from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';
import { changeEntityField, getEntity, updateEntity } from './branding.reducer';

const BrandingSettingsPage = () => {
  const dispatch = useAppDispatch();
  const entity: IBrandingSettings = useAppSelector(state => state.brandingSettings.entity);
  const loading = useAppSelector(state => state.brandingSettings.loading);
  const updating = useAppSelector(state => state.brandingSettings.updating);

  useEffect(() => {
    dispatch(getEntity());
  }, []);

  return (
    <PageWrapper className="max-w-5xl mx-auto">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Branding</h2>
          <p className="text-xs text-muted-foreground">Business identity and social links for the storefront</p>
        </div>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Business details</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <Field
              id="branding-applicationName"
              label="Application Name"
              value={entity.applicationName || ''}
              onChange={value => dispatch(changeEntityField({ name: 'applicationName', value }))}
            />
            <Field
              id="branding-email"
              label="Email"
              value={entity.email || ''}
              onChange={value => dispatch(changeEntityField({ name: 'email', value }))}
            />
            <Field
              id="branding-phoneNumber"
              label="Phone Number"
              value={entity.phoneNumber || ''}
              onChange={value => dispatch(changeEntityField({ name: 'phoneNumber', value }))}
            />
            <Field
              id="branding-address"
              label="Address"
              value={entity.address || ''}
              onChange={value => dispatch(changeEntityField({ name: 'address', value }))}
            />
            <div className="flex flex-col gap-2">
              <Label htmlFor="branding-workingHours" className="text-xs font-semibold">
                Working Hours
              </Label>
              <Textarea
                id="branding-workingHours"
                value={entity.workingHours || ''}
                onChange={e => dispatch(changeEntityField({ name: 'workingHours', value: e.target.value }))}
                className="min-h-[88px] text-xs"
                placeholder={'Mon–Fri 9:00 AM – 9:00 PM\nSat–Sun 10:00 AM – 6:00 PM'}
              />
              <p className="text-[11px] text-muted-foreground">
                Shown as text in the storefront footer. Use new lines for multiple rows.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Social profiles</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <SocialProfiles socialProfiles={entity.socialProfiles} />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button className="h-8 text-xs" disabled={loading || updating} onClick={() => dispatch(updateEntity(entity))}>
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
};

const Field = ({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) => (
  <div className="flex flex-col gap-2">
    <Label htmlFor={id} className="text-xs font-semibold">
      {label}
    </Label>
    <Input id={id} value={value} onChange={e => onChange(e.target.value)} className="h-8 text-xs" />
  </div>
);

const SocialProfiles = ({ socialProfiles }: { socialProfiles?: ISocialProfiles | null }) => {
  const dispatch = useAppDispatch();

  const handleChange = (field: keyof ISocialProfiles, value: string) => {
    const currentSocialProfiles = socialProfiles || ({} as ISocialProfiles);
    const currentField = currentSocialProfiles[field] || ({} as any);
    const next = {
      ...currentSocialProfiles,
      [field]: {
        ...currentField,
        url: value,
        name: field,
      },
    };
    dispatch(changeEntityField({ name: 'socialProfiles', value: next }));
  };

  const socials = [
    { key: 'INSTAGRAM', label: 'Instagram' },
    { key: 'FACEBOOK', label: 'Facebook' },
    { key: 'TWITTER', label: 'Twitter / X' },
    { key: 'TIKTOK', label: 'TikTok' },
    { key: 'YOUTUBE', label: 'YouTube' },
    { key: 'LINKEDIN', label: 'LinkedIn' },
  ] as const;

  return (
    <div className="space-y-4">
      {socials.map(social => (
        <Field
          key={social.key}
          id={`social-${social.key}`}
          label={social.label}
          value={socialProfiles?.[social.key]?.url || ''}
          onChange={value => handleChange(social.key as keyof ISocialProfiles, value)}
        />
      ))}
    </div>
  );
};

export default BrandingSettingsPage;
