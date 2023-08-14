import React, {useEffect, useLayoutEffect} from 'react';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { logout } from 'app/shared/reducers/authentication';
import {useNavigate} from "react-router-dom";
import {Button} from "primereact/button";

export const Logout = () => {
  const logoutUrl = useAppSelector(state => state.authentication.logoutUrl);
  const dispatch = useAppDispatch();
  const navigate = useNavigate()

  console.log(logoutUrl, 'logouturl')
  useLayoutEffect(() => {
    dispatch(logout());
    if (logoutUrl) {
      console.log(logoutUrl, 'logout')
    }
  });


  return (
    <div className="p-5">
      <h4>Logged out successfully!</h4>
      <br />
      <Button onClick={() => navigate('/login')}>Login</Button>
    </div>
  );
};

export default Logout;
