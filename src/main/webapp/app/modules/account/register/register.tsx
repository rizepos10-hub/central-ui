import React, { useState, useEffect } from 'react';
import { Translate, translate } from 'react-jhipster';
import { toast } from 'react-toastify';
import { UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

import PasswordStrengthBar from 'app/shared/layout/password/password-strength-bar';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { handleRegister, reset } from './register.reducer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstPassword, setFirstPassword] = useState('');
  const [secondPassword, setSecondPassword] = useState('');
  const dispatch = useAppDispatch();

  useEffect(
    () => () => {
      dispatch(reset());
    },
    []
  );

  const currentLocale = useAppSelector(state => state.locale.currentLocale);

  const handleSubmit = () => {
    if (firstPassword !== secondPassword) {
      toast.error(translate('global.messages.error.dontmatch'));
      return;
    }
    dispatch(handleRegister({ login: username, email, password: firstPassword, langKey: currentLocale }));
  };

  const successMessage = useAppSelector(state => state.register.successMessage);
  const registrationFailure = useAppSelector(state => state.register.registrationFailure);
  const errorMessage = useAppSelector(state => state.register.errorMessage);

  useEffect(() => {
    if (successMessage) {
      toast.success(translate(successMessage));
    }
  }, [successMessage]);

  useEffect(() => {
    if (registrationFailure && errorMessage) {
      toast.error(errorMessage);
    }
  }, [registrationFailure, errorMessage]);

  return (
    <PageWrapper>
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="p-3">
          <CardTitle className="text-sm font-semibold" id="register-title" data-cy="registerTitle">
            <Translate contentKey="register.title">Registration</Translate>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <form id="register-form" className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="username" className="text-xs">
                {translate('global.form.username.label')}
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                minLength={1}
                maxLength={50}
                placeholder={translate('global.form.username.placeholder')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-8 text-xs"
                data-cy="username"
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
              <Label htmlFor="firstPassword" className="text-xs">
                {translate('global.form.newpassword.label')}
              </Label>
              <Input
                id="firstPassword"
                name="firstPassword"
                type="password"
                required
                minLength={4}
                maxLength={50}
                placeholder={translate('global.form.newpassword.placeholder')}
                value={firstPassword}
                onChange={(e) => setFirstPassword(e.target.value)}
                className="h-8 text-xs"
                data-cy="firstPassword"
              />
            </div>

            <PasswordStrengthBar password={firstPassword} />

            <div className="space-y-1">
              <Label htmlFor="secondPassword" className="text-xs">
                {translate('global.form.confirmpassword.label')}
              </Label>
              <Input
                id="secondPassword"
                name="secondPassword"
                type="password"
                required
                minLength={4}
                maxLength={50}
                placeholder={translate('global.form.confirmpassword.placeholder')}
                value={secondPassword}
                onChange={(e) => setSecondPassword(e.target.value)}
                className="h-8 text-xs"
                data-cy="secondPassword"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                id="register-submit"
                type="button"
                size="sm"
                className="h-8 text-xs"
                onClick={handleSubmit}
                data-cy="submit"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                <Translate contentKey="register.form.button">Register</Translate>
              </Button>
            </div>
          </form>

          <Alert className="mt-4">
            <AlertDescription className="text-xs">
              <span>
                <Translate contentKey="global.messages.info.authenticated.prefix">If you want to </Translate>
              </span>
              <Link to="/login" className="alert-link hover:underline">
                <Translate contentKey="global.messages.info.authenticated.link"> sign in</Translate>
              </Link>
              <span>
                <Translate contentKey="global.messages.info.authenticated.suffix">
                  , you can try the default accounts:
                  <br />- Administrator (login=&quot;admin&quot; and password=&quot;admin&quot;)
                  <br />- User (login=&quot;user&quot; and password=&quot;user&quot;).
                </Translate>
              </span>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default RegisterPage;
