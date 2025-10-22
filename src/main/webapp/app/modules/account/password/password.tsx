import React, { useState, useEffect } from 'react';
import { Translate, translate } from 'react-jhipster';
import { toast } from 'react-toastify';
import { Save } from 'lucide-react';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getSession } from 'app/shared/reducers/authentication';
import PasswordStrengthBar from 'app/shared/layout/password/password-strength-bar';
import { savePassword, reset } from './password.reducer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const PasswordPage = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(reset());
    dispatch(getSession());
    return () => {
      dispatch(reset());
    };
  }, []);

  const handleSubmit = () => {
    if (newPassword !== confirmPassword) {
      toast.error(translate('global.messages.error.dontmatch'));
      return;
    }
    dispatch(savePassword({ currentPassword, newPassword }));
  };

  const account = useAppSelector(state => state.authentication.account);
  const successMessage = useAppSelector(state => state.password.successMessage);
  const errorMessage = useAppSelector(state => state.password.errorMessage);

  useEffect(() => {
    if (successMessage) {
      toast.success(translate(successMessage));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else if (errorMessage) {
      toast.error(translate(errorMessage));
    }
    dispatch(reset());
  }, [successMessage, errorMessage]);

  return (
    <PageWrapper>
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="p-3">
          <CardTitle className="text-sm font-semibold">
            <Translate contentKey="password.title" interpolate={{ username: account.login }}>
              Password for {account.login}
            </Translate>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <form className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="currentPassword" className="text-xs">
                {translate('global.form.currentpassword.label')}
              </Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                placeholder={translate('global.form.currentpassword.placeholder')}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-8 text-xs"
                data-cy="currentPassword"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="newPassword" className="text-xs">
                {translate('global.form.newpassword.label')}
              </Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={4}
                maxLength={50}
                placeholder={translate('global.form.newpassword.placeholder')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-8 text-xs"
                data-cy="newPassword"
              />
            </div>

            <PasswordStrengthBar password={newPassword} />

            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-xs">
                {translate('global.form.confirmpassword.label')}
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={4}
                maxLength={50}
                placeholder={translate('global.form.confirmpassword.placeholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-8 text-xs"
                data-cy="confirmPassword"
              />
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
                <Translate contentKey="password.form.button">Save</Translate>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default PasswordPage;
