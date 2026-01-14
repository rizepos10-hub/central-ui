import SockJS from 'sockjs-client';

import Stomp from 'webstomp-client';
import { Observable } from 'rxjs';
import { Storage } from 'react-jhipster';

// import { websocketActivityMessage } from 'app/modules/administration/administration.reducer';
import { getAccount, logoutSession } from 'app/shared/reducers/authentication';
import { toast } from 'react-toastify';
import { buildAuthTokenKey, getActiveTenant } from 'app/shared/util/tenant-utils';


let stompClient = null;

let subscriber = null;
let connection: Promise<any>;
let connectedPromise: any = null;
let listener: Observable<any>;
let notificationListener: Observable<any>;
let listenerObserver: any;
let notificationListenerObserver: any;
let alreadyConnectedOnce = false;


const createConnection = (): Promise<any> => new Promise(resolve => (connectedPromise = resolve));

const createListener = (): Observable<any> =>
  new Observable(observer => {
    listenerObserver = observer;
  });

const createNotificationListener = (): Observable<any> =>
  new Observable(observer => {
    notificationListenerObserver = observer;
  });

export const sendActivity = (page: string) => {
  const tenant = getActiveTenant();
  const token = Storage.local.get(buildAuthTokenKey(tenant)) || Storage.session.get(buildAuthTokenKey(tenant));


  const activity = '/topic/activity/' + tenant;
  console.log('WS Sending Activity to : ' + activity)

  connection?.then(() => {
    stompClient?.send(
      activity, // destination
      JSON.stringify({ page, token }), // body
      {} // header
    );
  });
};

const subscribe = () => {
  connection.then(() => {
    const tenant = getActiveTenant();
    console.log("WS SUBSCRIBE : " + tenant)
    subscriber = stompClient.subscribe('/topic/tracker/' + tenant, data => {
      console.log("WS RECEIVED MESSAGE : " + data)
      listenerObserver.next(JSON.parse(data.body));
    });
  });
};

const subscribeToNotifications = () => {
  connection.then(() => {
    const tenant = getActiveTenant();
    console.log("WS SUBSCRIBE notifications : " + tenant)
    subscriber = stompClient.subscribe('/topic/notifications/' + tenant, data => {
      console.log("WS RECEIVED NOTIFICATION : " + data)
      notificationListenerObserver.next(JSON.parse(data.body));
    });
  });
};

const connect = () => {
  if (connectedPromise !== null || alreadyConnectedOnce) {
    // the connection is already being established
    return;
  }
  connection = createConnection();
  // listener = createListener();
  notificationListener = createNotificationListener();

  // building absolute path so that websocket doesn't fail when deploying with a context path
  const loc = window.location;
  const baseHref = document.querySelector('base').getAttribute('href').replace(/\/$/, '');

  const headers = {};
  let url = SERVER_API_URL + '/websocket/tracker';
  const authTokenKey = buildAuthTokenKey();
  const authToken = Storage.local.get(authTokenKey) || Storage.session.get(authTokenKey);
  if (authToken) {
    url += '?access_token=' + authToken;
  }
  const socket = new SockJS(url);
  stompClient = Stomp.over(socket, { protocols: ['v12.stomp'] });

  stompClient.connect(headers, () => {
    connectedPromise('success');
    connectedPromise = null;
    // sendActivity(window.location.pathname);
    alreadyConnectedOnce = true;
  });
};

const disconnect = () => {
  if (stompClient !== null) {
    if (stompClient.connected) {
      stompClient.disconnect();
    }
    stompClient = null;
  }
  alreadyConnectedOnce = false;
};

const receive = () => listener;
const receiveNotifications = () => notificationListener;

const unsubscribe = () => {
  if (subscriber !== null) {
    subscriber.unsubscribe();
  }
  // listener = createListener();
};

let notificationSubscriptionSet = false;

export default store => next => action => {
  if (getAccount.fulfilled.match(action)) {
    connect();
    console.log("WS already connected : {}", alreadyConnectedOnce);
    if (!notificationSubscriptionSet) {
      notificationSubscriptionSet = true;
      subscribeToNotifications();
      console.log(store);
      receiveNotifications().subscribe(notification => {
        console.log("WS RECEIVED NOTIFICATION : " + notification);
        toast.info(notification.message);
        handleNewNotification(notification);
      });
    }
  } else if (getAccount.rejected.match(action) || action.type === logoutSession().type) {
    unsubscribe();
    disconnect();
    notificationSubscriptionSet = false; // Reset the flag on disconnect
  }
  return next(action);
};


const handleNewNotification = async (notification: any) => {
  updateTabTitle();
  await playNotificationSound();
  incrementUnreadCount();
};

const playNotificationSound = async () => {
  const audio = new Audio('/content/audio/notification-sound.mp3');
  await audio.play().catch(error => {
    console.error("Error playing notification sound:", error);
  });
};

let titleTimeout;
const updateTabTitle = () => {
  document.title = `Rize Cloud - Notifications`;
  if (titleTimeout) {
    clearTimeout(titleTimeout);
  }
  setTimeout(() => {
    document.title = "Rize Cloud";
  }, 5000);
};

const incrementUnreadCount = () => {
  const currentCount = parseInt(localStorage.getItem('notificationsCount'), 10) || 0;
  const newCount = currentCount + 1;
  localStorage.setItem('notificationsCount', newCount.toString());

  // Dispatch a custom event to notify components
  const event = new CustomEvent('notificationsCountUpdated', { detail: newCount });
  window.dispatchEvent(event);

}