import { useEffect, useRef } from 'react';

import { subscribeToTopic } from 'app/config/websocket-middleware';
import { getActiveTenant } from 'app/shared/util/tenant-utils';

import { IFactorySocketEvent } from './operations.model';

export const factoryTopic = (factoryId: string) => `/topic/wholesale-factory/${getActiveTenant()}/${factoryId}`;

/**
 * Calls [onEvent] when a factory order of one of [factoryIds] changes, and every [pollMs] as a fallback: the socket
 * broker runs per server instance, so an update made on another instance only arrives through the poll.
 */
export const useFactoryUpdates = (factoryIds: string[], onEvent: (event?: IFactorySocketEvent) => void, pollMs = 30000) => {
  const handler = useRef(onEvent);
  handler.current = onEvent;
  const key = [...factoryIds].sort().join(',');

  useEffect(() => {
    const unsubscribers = factoryIds.map(id => subscribeToTopic(factoryTopic(id), event => handler.current(event)));
    const timer = window.setInterval(() => handler.current(), pollMs);
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
      window.clearInterval(timer);
    };
  }, [key, pollMs]);
};
