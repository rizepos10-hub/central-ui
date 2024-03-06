// VersionUpdateChecker.js
import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {Button} from "primereact/button";
import appVersion from "./version.json";

function VersionUpdateChecker() {
  const [isNewVersion, setIsNewVersion] = useState(false);

  useEffect(() => {
    const checkForNewVersion = () => {
      const storedVersion = localStorage.getItem('appVersion');
      const currentVersion = appVersion.version;

      if (storedVersion !== currentVersion) {
        localStorage.setItem('appVersion', currentVersion);
        setIsNewVersion(true);
      }
    };

    checkForNewVersion();
  }, []);

  useEffect(() => {
    if (isNewVersion) {
      toast.info('A new version is available! Please reload for the latest updates.', {
        autoClose: false,
        closeButton: <Button onClick={reloadWithCacheBusting}>Reload</Button>,
      });
    }
  }, [isNewVersion]);

  const reloadWithCacheBusting = () => {
    const url = `${window.location.href}?${Date.now()}`; // Append timestamp as query parameter
    window.location.href = url;
  };

  return <ToastContainer position="top-left" className="toastify-container" toastClassName="toastify-toast" />;
}

export default VersionUpdateChecker;
