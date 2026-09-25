/* eslint-disable complexity */
import { translate } from 'react-jhipster';
import { toast } from 'react-toastify';
import { isFulfilledAction, isRejectedAction } from 'app/shared/reducers/reducer.utils';
import { isRequestCancellation } from 'app/config/request-utils';

const addErrorAlert = (message, key?, data?, localizedMessage?) => {
  key = key ? key : message;
  localizedMessage ? toast.error(localizedMessage) : toast.error(translate(key, data));
};

export default () => next => action => {
  const { error, payload } = action;

  /** Load-more uses inline retry in the panel; avoid toast spam when offline (scroll no longer retries until user taps). */
  if (action.type === 'notification/fetch_entity_list/rejected' && action.meta?.arg?.append === true) {
    return next(action);
  }

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
      toast.success(translate(alert, { param: entityName ?? alertParam }));
    }
  }

  if (isRejectedAction(action) && error && error.isAxiosError) {
    // Don't show error toasts for aborted requests
    if (isRequestCancellation(error)) {
      return next(action);
    }

    // The initial session lookup can return 401 when the visitor is not signed in.
    // Let the authentication flow show the login screen without an error toast.
    if (action.type === 'authentication/get_account/rejected' && error.response?.status === 401) {
      return next(action);
    }
    
    const isLoginPage = location.pathname.endsWith('login');
    const isLogoutPage = location.pathname.endsWith('logout');
    if (error.response && !isLoginPage && !isLogoutPage) {
      const response = error.response;
      const data = response.data;
      const localizedMessage = data?.localizedMessage
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
              const entityName = translate('global.menu.entities.' + entityKey);
              addErrorAlert(errorHeader, errorHeader, { entityName }, localizedMessage);
            } else if (data?.fieldErrors) {
              const fieldErrors = data.fieldErrors;
              for (const fieldError of fieldErrors) {
                if (['Min', 'Max', 'DecimalMin', 'DecimalMax'].includes(fieldError.message)) {
                  fieldError.message = 'Size';
                }
                // convert 'something[14].other[4].id' to 'something[].other[].id' so translations can be written to it
                const convertedField = fieldError.field.replace(/\[\d*\]/g, '[]');
                const fieldName = translate(`tempApp.${fieldError.objectName}.${convertedField}`);
                addErrorAlert(`Error on field "${fieldName}"`, `error.${fieldError.message}`, { fieldName }, localizedMessage);
              }
            } else if (typeof data === 'string' && data !== '') {
              addErrorAlert(data);
            } else {
              toast.error(data?.message || data?.error || data?.title || 'Unknown error!');
            }
            break;
          }
          case 404:
            addErrorAlert('Not found', 'error.url.not.found');
            break;
          case 401:
            break;
          case 403:
            toast.error('You are not authorized to access this resource');
            break;
          case 500:
            toast.error('An error occurred, please try again later.');
            break;
          default:
            if (typeof data === 'string' && data !== '') {
              addErrorAlert(data);
            } else {
              toast.error(data?.message || data?.error || data?.title || 'Unknown error!');
            }
        }
      }
    } else if (isLoginPage) {
      toast.warning('Wrong username or password');
    } else {
      // Don't show error toasts for aborted requests
      if (isRequestCancellation(error)) {
        return next(action);
      }
      toast.error(error.message || 'Unknown error!');
    }
  } else if (error && error.response?.status !== 401) {
    // Don't show error toasts for aborted requests
    if (isRequestCancellation(error)) {
      return next(action);
    }
    toast.error(error.message || 'Unknown error!');
  }
  return next(action);
};
