import { useEffect, useRef } from 'react';

import { subscribeToTopic } from 'app/config/websocket-middleware';
import { getActiveTenant } from 'app/shared/util/tenant-utils';

import { ILiveRouteEvent } from './audits.model';

export const alertsTopic = () => `/topic/wholesale-alerts/${getActiveTenant()}`;
export const liveRouteTopic = () => `/topic/wholesale-live-route/${getActiveTenant()}`;

/** Like useDeliveryUpdates: the socket for changes made on this server instance, the poll for the others. */
const useTopic = <T>(topic: () => string, onEvent: (event?: T) => void, pollMs: number) => {
  const handler = useRef(onEvent);
  handler.current = onEvent;

  useEffect(() => {
    const unsubscribe = subscribeToTopic(topic(), event => handler.current(event as T));
    const timer = window.setInterval(() => handler.current(), pollMs);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [pollMs]);
};

/** Calls [onEvent] when an alert is raised or acknowledged. */
export const useAlertUpdates = (onEvent: () => void, pollMs = 60000) => useTopic<unknown>(alertsTopic, () => onEvent(), pollMs);

/** Calls [onEvent] with each position a driver shares, and without one on every poll. */
export const useLiveRouteUpdates = (onEvent: (event?: ILiveRouteEvent) => void, pollMs = 60000) => useTopic<ILiveRouteEvent>(liveRouteTopic, onEvent, pollMs);
