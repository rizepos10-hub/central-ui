import React, { useEffect, useState } from 'react';
import { Translate, translate } from 'react-jhipster';
import { toast } from 'react-toastify';
import { Save, ArrowLeft } from 'lucide-react';

import { locales, languages } from 'app/config/translation';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getSession } from 'app/shared/reducers/authentication';
import { saveAccountSettings, reset } from './settings.reducer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const SettingsPage = () => {
  const dispatch = useAppDispatch();
  const account = useAppSelector(state => state.authentication.account);
  const successMessage = useAppSelector(state => state.settings.successMessage);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [langKey, setLangKey] = useState('');

  useEffect(() => {
    dispatch(getSession());
    return () => {
      dispatch(reset());
    };
  }, []);

  useEffect(() => {
    if (account) {
      setFirstName(account.firstName || '');
      setLastName(account.lastName || '');
      setEmail(account.email || '');
      setLangKey(account.langKey || 'en');
    }
  }, [account]);

  useEffect(() => {
    if (successMessage) {
      toast.success(translate(successMessage));
    }
  }, [successMessage]);

  const handleSubmit = () => {
    dispatch(
      saveAccountSettings({
        ...account,
        firstName,
        lastName,
        email,
        langKey,
      })
    );
  };

  return (
    <PageWrapper>
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="p-3">
          <CardTitle className="text-sm font-semibold">
            <Translate contentKey="settings.title" interpolate={{ username: account.login }}>
              User settings for {account.login}
            </Translate>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <form className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="firstName" className="text-xs">
                {translate('settings.form.firstname')}
              </Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                required
                minLength={1}
                maxLength={50}
                placeholder={translate('settings.form.firstname.placeholder')}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-8 text-xs"
                data-cy="firstname"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="lastName" className="text-xs">
                {translate('settings.form.lastname')}
              </Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                required
                minLength={1}
                maxLength={50}
                placeholder={translate('settings.form.lastname.placeholder')}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-8 text-xs"
                data-cy="lastname"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs">
                {translate('global.form.email.label')}
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                minLength={5}
                maxLength={254}
                placeholder={translate('global.form.email.placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-8 text-xs"
                data-cy="email"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="langKey" className="text-xs">
                {translate('settings.form.language')}
              </Label>
              <Select value={langKey} onValueChange={setLangKey}>
                <SelectTrigger className="h-8 text-xs" data-cy="langKey">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locales.map(locale => (
                    <SelectItem key={locale} value={locale} className="text-xs">
                      {languages[locale].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                className="h-8 text-xs"
                onClick={handleSubmit}
                data-cy="submit"
              >
                <Save className="h-4 w-4 mr-1" />
                <Translate contentKey="settings.form.button">Save</Translate>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default SettingsPage;
