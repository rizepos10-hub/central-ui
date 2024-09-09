import React, { useState, useEffect, useContext } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import store, { useAppDispatch, useAppSelector } from 'app/config/store';
import { login } from 'app/shared/reducers/authentication';
import LoginModal from './login-modal';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { LayoutContext } from 'app/shared/sidebar/context/layoutcontext';
import { getTenant, tenantReducer } from 'app/shared/tenant/TenantContext';
export const Login = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(state => state.authentication.isAuthenticated);
  const loginError = useAppSelector(state => state.authentication.loginError);
  const showModalLogin = useAppSelector(state => state.authentication.showModalLogin);
  const [showModal, setShowModal] = useState(showModalLogin);
  const navigate = useNavigate();
  const location = useLocation();

  const tenant = useAppSelector(state => state.tenant.tenant);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const handleLogin = () => {
    if (email && password) {
      dispatch(login(email, password, tenant, rememberMe));
    }
  };

  useEffect(() => {
    setShowModal(true);
    dispatch(getTenant);
  }, []);

  // const handleLogin = (username, password, rememberMe = false) => dispatch(login(username, password, tenant, rememberMe));

  const handleClose = () => {
    setShowModal(false);
    navigate('/');
  };

  const { layoutConfig } = useContext(LayoutContext);
  const dark = layoutConfig.colorScheme !== 'light';

  const { from } = (location.state as any) || { from: { pathname: '/', search: location.search } };
  console.log(isAuthenticated)
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }
  return (
    <div className='row p-0 m-0'>
      <div className='col p-0 m-0'
        style={{
          display: window.innerWidth < 768 ? 'none' : 'block',
        }}
      >
        <img
          src="/content/images/login-image.png"
          alt="login-image"
          className="w-100 h-100"
          style={{
            objectFit: 'cover',
          }}
        />
      </div>
      <div className='col p-0 m-0'>
        <div className="px-5 min-h-screen flex justify-content-center align-items-center ">
          <div className="border-1 surface-border surface-card border-round py-7 px-4 md:px-7 z-1">
            <div className="mb-4">
              <div className="text-900 font-semibold mb-2">Log in</div>
              <span className="text-600 font-medium">Please enter your details</span>
            </div>
            <div className="flex flex-column">
              <span className="p-input-icon-left w-full mb-4">
                <i className="pi pi-envelope"></i>
                <InputText
                  id="email"
                  type="text"
                  className="w-full md:w-25rem"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </span>
              <span className="p-input-icon-left w-full mb-4">
                <i className="pi pi-lock"></i>
                <InputText
                  id="password"
                  type="password"
                  className="w-full md:w-25rem"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </span>
              <div className="mb-4 flex flex-wrap gap-3">
                <div>
                  {/* <Checkbox name="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.checked ?? false)} className="mr-2"></Checkbox> */}
                  <label htmlFor="checkbox" className="text-900 font-medium mr-8">
                    Remember Me
                  </label>
                </div>
                <a className="text-600 cursor-pointer hover:text-primary cursor-pointer ml-auto transition-colors transition-duration-300">
                  Reset password
                </a>
              </div>
              <Button label="Log In" className="w-full" onClick={handleLogin}></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
