import React, { useState, useEffect } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { login, loginFromToken } from 'app/shared/reducers/authentication';
import { getTenant } from 'app/shared/tenant/TenantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Lock } from 'lucide-react';
import { getTenantFromURL } from 'app/shared/util/tenant-utils';

export const Login = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(state => state.authentication.isAuthenticated);
  const showModalLogin = useAppSelector(state => state.authentication.showModalLogin);
  const navigate = useNavigate();
  const location = useLocation();

  const tenant = useAppSelector(state => state.tenant.tenant);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);


  const params = new URLSearchParams(window.location.search);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');

  const handleLogin = () => {
    if (email && password) {
      dispatch(login(email, password, tenant, rememberMe));
    }
  };


  useEffect(() => {
    dispatch(getTenant);
  }, []);

  useEffect(() => {
    const fetchData = () => {
      const tenantFromUrl = getTenantFromURL();
      const tenantToUse = tenantFromUrl || tenant;
      if (tenantToUse && access_token) {
        dispatch(loginFromToken(access_token, refresh_token, tenantToUse));
        navigate('/');
      }
    };
    fetchData();
  }, []);

  const { from } = (location.state as any) || { from: { pathname: '/', search: location.search } };
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen p-0 m-0">
      <div className="hidden md:block p-0 m-0">
        <img
          src="/content/images/login-image.png"
          alt="login-image"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-0 m-0">
        <div className="px-5 min-h-screen flex justify-center items-center">
          <div className="w-full max-w-md space-y-6 border rounded-lg p-8 shadow-sm">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
              <p className="text-sm text-muted-foreground">Please enter your details</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="text"
                    className="pl-9"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-9"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label htmlFor="rememberMe" className="text-sm font-medium cursor-pointer">
                    Remember Me
                  </Label>
                </div>
                <Link
                  to="/account/reset/request"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Reset password
                </Link>
              </div>
              <Button onClick={handleLogin} className="w-full">
                Log In
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
