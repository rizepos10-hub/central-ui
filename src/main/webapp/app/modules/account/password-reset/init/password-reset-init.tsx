import React, { useEffect, useState } from 'react';
import { Translate, translate, isEmail } from 'react-jhipster';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';

import { handlePasswordResetInit, reset } from '../password-reset.reducer';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getTenant } from 'app/shared/tenant/TenantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, AlertCircle } from 'lucide-react';

export const PasswordResetInit = () => {
  const dispatch = useAppDispatch();
  const tenant = useAppSelector(state => state.tenant.tenant);
  const successMessage = useAppSelector(state => state.passwordReset.successMessage);

  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(false);
    };

    fetchData();

    return () => {
    };
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(translate(successMessage));
    }
  }, [successMessage]);

  const onSubmit = (data) => {
    dispatch(handlePasswordResetInit({ email: data.email, tenant }));
  };

  if (loading) {
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
            <Translate contentKey="reset.request.title">Reset your password</Translate>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <Translate contentKey="reset.request.messages.info">Enter the email address you used to register</Translate>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{translate('global.form.email.label')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="pl-9"
                  placeholder={translate('global.form.email.placeholder')}
                  data-cy="emailResetPassword"
                  {...register('email', {
                    required: translate('global.messages.validate.email.required'),
                    minLength: {
                      value: 5,
                      message: translate('global.messages.validate.email.minlength'),
                    },
                    maxLength: {
                      value: 254,
                      message: translate('global.messages.validate.email.maxlength'),
                    },
                    validate: v => isEmail(v) || translate('global.messages.validate.email.invalid'),
                  })}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message as string}</p>
              )}
            </div>

            <Button onClick={handleSubmit(onSubmit)} className="w-full" data-cy="submit">
              <Translate contentKey="reset.request.form.button">Reset password</Translate>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordResetInit;
