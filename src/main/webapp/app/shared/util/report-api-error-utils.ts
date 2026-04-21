import axios from 'axios';

const DEFAULT_REPORT_API_ERROR_MESSAGE = 'There was an error loading data from the API. Please try again.';
const REPORT_API_TIMEOUT_MESSAGE = 'The report API timed out. Please try again.';
const REPORT_API_NETWORK_MESSAGE = 'The report API could not be reached. Please check your connection and try again.';

const getErrorMessageFromPayload = (payload: unknown) => {
  if (!payload) {
    return null;
  }

  if (typeof payload === 'string') {
    return payload.trim() || null;
  }

  if (payload instanceof Error) {
    return payload.message?.trim() || null;
  }

  if (typeof payload === 'object') {
    const message = (payload as { message?: unknown }).message;
    return typeof message === 'string' && message.trim() ? message.trim() : null;
  }

  return null;
};

export const getReportApiErrorMessage = (error: unknown, fallback = DEFAULT_REPORT_API_ERROR_MESSAGE) => {
  if (axios.isAxiosError(error)) {
    const axiosMessage = getErrorMessageFromPayload(error.response?.data) || getErrorMessageFromPayload(error);
    const isTimeout = error.code === 'ECONNABORTED' || /timeout/i.test(error.message || '');

    if (isTimeout) {
      return REPORT_API_TIMEOUT_MESSAGE;
    }

    if (!error.response) {
      return REPORT_API_NETWORK_MESSAGE;
    }

    return axiosMessage || fallback;
  }

  const message = getErrorMessageFromPayload(error);

  if (message && /timeout/i.test(message)) {
    return REPORT_API_TIMEOUT_MESSAGE;
  }

  if (message && /network error/i.test(message)) {
    return REPORT_API_NETWORK_MESSAGE;
  }

  return message || fallback;
};

