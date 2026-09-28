import { useEffect, useRef } from 'react';

import { subscribeToTopic } from 'app/config/websocket-middleware';
import { getActiveTenant } from 'app/shared/util/tenant-utils';

import { IDeliverySocketEvent } from './delivery.model';

export const deliveryTopic = () => `/topic/wholesale-delivery/${getActiveTenant()}`;

/**
 * Calls [onEvent] when any delivery run or stop changes, and every [pollMs] as a fallback: the socket broker runs per
 * server instance, so a change made on another instance only arrives through the poll.
 */
export const useDeliveryUpdates = (onEvent: (event?: IDeliverySocketEvent) => void, pollMs = 30000) => {
  const handler = useRef(onEvent);
  handler.current = onEvent;

  useEffect(() => {
    const unsubscribe = subscribeToTopic(deliveryTopic(), event => handler.current(event));
    const timer = window.setInterval(() => handler.current(), pollMs);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [pollMs]);
};
