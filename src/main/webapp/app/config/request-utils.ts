export const isRequestCancellation = (error: any): boolean =>
  Boolean(
    error &&
      (error.name === 'AbortError' ||
        error.name === 'CanceledError' ||
        error.code === 'ERR_CANCELED' ||
        error.message === 'Request superseded by a newer request'),
  );
