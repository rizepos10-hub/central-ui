/* eslint-disable complexity */
import { translate } from 'react-jhipster';
import { toast } from 'react-toastify';
import { isFulfilledAction, isRejectedAction } from 'app/shared/reducers/reducer.utils';

const addErrorAlert = (message, key?, data?, localizedMessage?) => {
  key = key ? key : message;
  console.log(message)
  console.log(key)
  console.log(data)
  localizedMessage ? toast.error(localizedMessage) : toast.error(translate(key, data));
};

export default () => next => action => {
  const { error, payload } = action;

  /**
   *
   * The notification middleware serves to add success and error notifications
   */
  if (isFulfilledAction(action) && payload && payload.headers) {
    const headers = payload?.headers;
    const entityName = payload?.data?.name;
    let alert: string | null = null;
    let alertParams: string | null = null;
    headers &&
      Object.entries<string>(headers).forEach(([k, v]) => {
        if (k.toLowerCase().endsWith('app-alert')) {
          alert = v.replace('centralApp', 'tempApp');
        } else if (k.toLowerCase().endsWith('app-params')) {
          alertParams = decodeURIComponent(v.replace(/\+/g, ' '));
        }
      });
    if (alert) {
      const alertParam = alertParams;
      console.log(entityName)
      console.log(alert)
      console.log(alertParam)
      toast.success(translate(alert, { param: entityName ?? alertParam }));
    }
  }

  if (isRejectedAction(action) && error && error.isAxiosError) {
    const isLoginPage = location.pathname.endsWith('login');
    const isLogoutPage = location.pathname.endsWith('logout');
    if (error.response && !isLoginPage && !isLogoutPage) {
      const response = error.response;
      const data = response.data;
      console.log(data)
      const localizedMessage = data?.localizedMessage
      console.log(localizedMessage)
      if (

        !(
          response.status === 401 &&
          (error.message === '' || (data && data.path && (data.path.includes('/api/account') || data.path.includes('/api/authenticate'))))
        )
      ) {
        switch (response.status) {
          // connection refused, server not reachable
          case 0:
            addErrorAlert('Server not reachable', 'error.server.not.reachable');
            break;

          case 400: {
            let errorHeader: string | null = null;
            let entityKey: string | null = null;
            response?.headers &&
              Object.entries<string>(response.headers).forEach(([k, v]) => {
                if (k.toLowerCase().endsWith('app-error')) {
                  errorHeader = v;
                } else if (k.toLowerCase().endsWith('app-params')) {
                  entityKey = v;
                }
              });
            if (errorHeader) {
              console.log(1)
              const entityName = translate('global.menu.entities.' + entityKey);
              console.log(1)
              addErrorAlert(errorHeader, errorHeader, { entityName }, localizedMessage);
            } else if (data?.fieldErrors) {
              const fieldErrors = data.fieldErrors;
              for (const fieldError of fieldErrors) {
                if (['Min', 'Max', 'DecimalMin', 'DecimalMax'].includes(fieldError.message)) {
                  fieldError.message = 'Size';
                }
                // convert 'something[14].other[4].id' to 'something[].other[].id' so translations can be written to it
                const convertedField = fieldError.field.replace(/\[\d*\]/g, '[]');
                console.log(1)
                const fieldName = translate(`tempApp.${fieldError.objectName}.${convertedField}`);
                console.log(1)
                addErrorAlert(`Error on field "${fieldName}"`, `error.${fieldError.message}`, { fieldName }, localizedMessage);
              }
            } else if (typeof data === 'string' && data !== '') {
              console.log(data)
              addErrorAlert(data);
              console.log(1)
            } else {
              console.log(data)
              toast.error(data?.message || data?.error || data?.title || 'Unknown error!');
              console.log(1)
            }
            break;
          }
          case 404:
            console.log(1)
            addErrorAlert('Not found', 'error.url.not.found');
            break;
          case 401:
            break;

          default:
            if (typeof data === 'string' && data !== '') {
              console.log(1)
              addErrorAlert(data);
              console.log(1)
            } else {
              console.log(1)
              toast.error(data?.message || data?.error || data?.title || 'Unknown error!');
              console.log(1)
            }
        }
      }
    } else if (error.config && error.config.url === 'api/account' && error.config.method === 'get') {
      /* eslint-disable no-console */
      console.log('Authentication Error: Trying to access url api/account with GET.');
    } else if (isLoginPage) {
      console.log(1)
      toast.warning('Wrong username or password');
      console.log(1)
    } else {
      console.log(1)
      toast.error(error.message || 'Unknown error!');
      console.log(1)
    }
  } else if (error && error.response?.status !== 401) {
    console.log(1)
    toast.error(error.message || 'Unknown error!');
    console.log(1)
  }
  return next(action);
};
