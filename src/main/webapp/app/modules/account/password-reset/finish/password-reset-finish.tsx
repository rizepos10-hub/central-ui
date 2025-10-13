import React, { useState, useEffect } from 'react';
import { Translate, translate } from 'react-jhipster';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';

import { handlePasswordResetFinish, reset } from '../password-reset.reducer';
import PasswordStrengthBar from 'app/shared/layout/password/password-strength-bar';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getTenant } from 'app/shared/tenant/TenantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock } from 'lucide-react';

export const PasswordResetFinishPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const tenant = useAppSelector(state => state.tenant.tenant);
  const [searchParams] = useSearchParams();
  const key = searchParams.get('key');

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const newPasswordValue = watch('newPassword', '');

  useEffect(() => {
    const fetchData = async () => {
      await dispatch(getTenant);
      setLoading(false);
    };

    fetchData();

    return () => {
      dispatch(reset());
    };
  }, [dispatch]);

  useEffect(() => {
    setPassword(newPasswordValue);
  }, [newPasswordValue]);

  const onSubmit = (data) => {
    dispatch(handlePasswordResetFinish({ confirmationCode: key, password: data.newPassword, tenant })).then(() => {
      navigate('/' + tenant + '/login');
    });
  };

  if (loading || !key) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            <Translate contentKey="reset.finish.title">Reset password</Translate>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">{translate('global.form.newpassword.label')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type="password"
                  className="pl-9"
                  placeholder={translate('global.form.newpassword.placeholder')}
                  data-cy="resetPassword"
                  {...register('newPassword', {
                    required: translate('global.messages.validate.newpassword.required'),
                    minLength: {
                      value: 4,
                      message: translate('global.messages.validate.newpassword.minlength'),
                    },
                    maxLength: {
                      value: 50,
                      message: translate('global.messages.validate.newpassword.maxlength'),
                    },
                  })}
                />
              </div>
              {errors.newPassword && (
                <p className="text-xs text-destructive">{errors.newPassword.message as string}</p>
              )}
            </div>

            <PasswordStrengthBar password={password} />

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{translate('global.form.confirmpassword.label')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  className="pl-9"
                  placeholder={translate('global.form.confirmpassword.placeholder')}
                  data-cy="confirmResetPassword"
                  {...register('confirmPassword', {
                    required: translate('global.messages.validate.confirmpassword.required'),
                    minLength: {
                      value: 4,
                      message: translate('global.messages.validate.confirmpassword.minlength'),
                    },
                    maxLength: {
                      value: 50,
                      message: translate('global.messages.validate.confirmpassword.maxlength'),
                    },
                    validate: v => v === newPasswordValue || translate('global.messages.error.dontmatch'),
                  })}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message as string}</p>
              )}
            </div>

            <Button onClick={handleSubmit(onSubmit)} className="w-full" data-cy="submit">
              <Translate contentKey="reset.finish.form.button">Validate new password</Translate>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordResetFinishPage;
