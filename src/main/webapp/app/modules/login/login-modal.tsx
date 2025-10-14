import React from 'react';
import { Translate, translate } from 'react-jhipster';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export interface ILoginModalProps {
  showModal: boolean;
  loginError: boolean;
  handleLogin: (username: string, password: string, rememberMe: boolean) => void;
  handleClose: () => void;
}

const LoginModal = (props: ILoginModalProps) => {
  const login = ({ username, password, rememberMe }) => {
    props.handleLogin(username, password, rememberMe);
  };

  const {
    handleSubmit,
    register,
    formState: { errors, touchedFields },
  } = useForm({ mode: 'onTouched' });

  const { loginError, handleClose } = props;

  const handleLoginSubmit = () => {
    handleSubmit(login)();
  };

  return (
    <Dialog open={props.showModal} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle id="login-title" data-cy="loginTitle">
            <Translate contentKey="login.title">Sign in</Translate>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {loginError && (
            <Alert variant="destructive" data-cy="loginError">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <Translate contentKey="login.messages.error.authentication">
                  <strong>Failed to sign in!</strong> Please check your credentials and try again.
                </Translate>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">
              {translate('global.form.username.label')}
            </Label>
            <Input
              id="username"
              type="text"
              placeholder={translate('global.form.username.placeholder')}
              autoFocus
              data-cy="username"
              {...register('username', { required: 'Username cannot be empty!' })}
              className={errors.username && touchedFields.username ? 'border-destructive' : ''}
            />
            {errors.username && touchedFields.username && (
              <p className="text-xs text-destructive">{errors.username.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              {translate('login.form.password')}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={translate('login.form.password.placeholder')}
              data-cy="password"
              {...register('password', { required: 'Password cannot be empty!' })}
              className={errors.password && touchedFields.password ? 'border-destructive' : ''}
            />
            {errors.password && touchedFields.password && (
              <p className="text-xs text-destructive">{errors.password.message as string}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="rememberMe" {...register('rememberMe')} defaultChecked />
            <Label htmlFor="rememberMe" className="text-sm font-medium cursor-pointer">
              {translate('login.form.rememberme')}
            </Label>
          </div>

          <div className="space-y-2 pt-2">
            <Alert>
              <AlertDescription>
                <Link to="/account/reset/request" data-cy="forgetYourPasswordSelector" className="text-sm hover:underline">
                  <Translate contentKey="login.password.forgot">Did you forget your password?</Translate>
                </Link>
              </AlertDescription>
            </Alert>
            <Alert>
              <AlertDescription className="text-sm">
                <span>
                  <Translate contentKey="global.messages.info.register.noaccount">You don&apos;t have an account yet?</Translate>
                </span>{' '}
                <Link to="/account/register" className="hover:underline">
                  <Translate contentKey="global.messages.info.register.link">Register a new account</Translate>
                </Link>
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={handleClose} tabIndex={1}>
              <Translate contentKey="entity.action.cancel">Cancel</Translate>
            </Button>
            <Button onClick={handleLoginSubmit} data-cy="submit">
              <Translate contentKey="login.form.button">Sign in</Translate>
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
