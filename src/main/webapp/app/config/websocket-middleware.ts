import SockJS from 'sockjs-client';

import Stomp from 'webstomp-client';
import { Observable } from 'rxjs';
import { Storage } from 'react-jhipster';

// import { websocketActivityMessage } from 'app/modules/administration/administration.reducer';
import { getAccount, logoutSession } from 'app/shared/reducers/authentication';
import { toast } from 'react-toastify';


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
  const token = Storage.local.get('jhi-authenticationToken') || Storage.session.get('jhi-authenticationToken');

  let tenant = sessionStorage.getItem('TENANT');

  let activity = '/topic/activity/' + tenant;
  console.log('WS Sending Activity to : '+ activity )

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
    let tenant = sessionStorage.getItem('TENANT');
    console.log("WS SUBSCRIBE : "+ tenant)
    subscriber = stompClient.subscribe('/topic/tracker/' + tenant, data => {
      console.log("WS RECEIVED MESSAGE : " + data)
      listenerObserver.next(JSON.parse(data.body));
    });
  });
};

const subscribeToNotifications = () => {
  connection.then(() => {
    let tenant = sessionStorage.getItem('TENANT');
    console.log("WS SUBSCRIBE notifications : "+ tenant)
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
  const authToken = Storage.local.get('jhi-authenticationToken') || Storage.session.get('jhi-authenticationToken');
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

export default store => next => action => {
  if (getAccount.fulfilled.match(action)) {
    connect();
    console.log("WS already connected : {}", alreadyConnectedOnce)
    if (!alreadyConnectedOnce) {
      // subscribe();
      subscribeToNotifications();
      console.log(store)
      // receive().subscribe(activity => {
      //   console.log(activity)
      //   // toast.info(activity.page)
      //   return store.dispatch(websocketActivityMessage(activity));
      // });
      receiveNotifications().subscribe(notification => {
        console.log("WS RECEIVED NOTIFICATION : " + notification);
        toast.info(notification.message)
        handleNewNotification(notification);
        // store.dispatch(websocketNotificationMessage(notification)); // Update state with the new notification
      });
    }
  } else if (getAccount.rejected.match(action) || action.type === logoutSession().type) {
    unsubscribe();
    disconnect();
  }
  return next(action);
};

const handleNewNotification = (notification: any) => {
  updateTabTitle();
  playNotificationSound();
};

const playNotificationSound = () => {
  const audio = new Audio('/content/audio/notification-sound.mp3');
  audio.play().catch(error => {
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
