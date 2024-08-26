import React from "react";
import "./notifications-center.scss";
import { AiOutlineBell } from "react-icons/ai";
import { useEffect, useRef, useState } from "react";
import { InputSwitch } from "primereact/inputswitch";

const NotificationsCenter = () => {
    const notifications = [
        {
            "is_unread": true,
            "verb": "Your order has been shipped!",
            "created_at": "2024-08-25T14:23:00",
            "level": "info"
        },
        {
            "is_unread": true,
            "verb": "Your order has been shipped!",
            "created_at": "2024-08-25T14:23:00",
            "level": "info"
        },
        {
            "is_unread": false,
            "verb": "Your payment was successful.",
            "created_at": "2024-08-24T09:45:00",
            "level": "success"
        },
        {
            "is_unread": false,
            "verb": "Your payment was successful.",
            "created_at": "2024-08-24T09:45:00",
            "level": "success"
        },
        {
            "is_unread": false,
            "verb": "Your payment was successful.",
            "created_at": "2024-08-24T09:45:00",
            "level": "success"
        },
        {
            "is_unread": true,
            "verb": "Update available for your application.",
            "created_at": "2024-08-23T16:00:00",
            "level": "warning"
        }
    ]

    const [showMenu, setShowMenu] = useState(false);

    // const [notifications, setNotifications] = useState([]);
    const [onlyUnread, setOnlyUnread] = useState(false);
    const [unreadClicked, setUnreadClicked] = useState(false);
    const [notificationsNext, setNotificationsNext] = useState(true);
    const [notificationsOffset, setNotificationsOffset] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const url = "/api/v1/notifications/notifications/";

    //get NotificationsCenter Request
    // const applyGetNotifications = (res) => {
    //     if (unreadClicked) {
    //         setNotifications(res.results.notifications);
    //         setUnreadClicked(false);
    //     } else {
    //         setNotifications([...notifications, ...res.results.notifications]);
    //     }
    //     setUnreadCount(res.results.unread_count);
    //     setNotificationsOffset(notificationsOffset + 10);
    //     if (res.next !== null) {
    //         // setNotificationsPageNumber(notificationsPageNumber + 1);
    //         setNotificationsNext(true);
    //     } else {
    //         setNotificationsNext(false);
    //     }
    // };

    // const {
    //     sendReqeust: getNotifications,
    //     isLoading: isLoadingGetNotifications,
    // } = useAxios(
    //     {
    //         url,
    //         unread: onlyUnread ? "unread" : "",
    //         limit: 10,
    //         offset: notificationsOffset,
    //     },
    //     applyGetNotifications
    // );

    // //get Unread NotificationsCenter Request
    // const applyGetUnreadNotifications = (res) => {
    //     console.log(res);
    // };

    // const {
    //     sendReqeust: getUnreadNotifications,
    //     isLoading: isLoadingGetUnreadNotifications,
    // } = useAxios(
    //     {
    //         url: url + "?unread",
    //     },
    //     applyGetUnreadNotifications
    // );

    // useEffect(() => {
    //     getNotifications();
    // }, []);

    //mark as read Request
    const applyMarkAsRead = (res) => { };

    // const { sendReqeust: markAsRead, isLoading: isLoadingMarkAsRead } =
    //     useAxios(
    //         {
    //             url: url + "update-status/",
    //             method: "POST",
    //         },
    //         applyMarkAsRead
    //     );

    //Handlers
    // const getNotificationsHandler = () => {
    //     if (notificationsNext) {
    //         getNotifications();
    //     }
    // };

    const getUnreadNotificationsHandler = (e) => {
        setNotificationsOffset(0);
        setUnreadClicked(true);
        if (e.target.checked) {
            setOnlyUnread(true);
        } else {
            setOnlyUnread(false);
        }
    };

    //refresh notifications
    const refreshNotifications = () => {
        // setNotifications([""]);
        // setNotificationsOffset(0);
        // getNotifications();
        // not working
    };
    // useEffect(() => {
    //     getNotifications();
    // }, [onlyUnread]);

    const markAsReadHandler = (notification) => {
        // if (notification.is_unread) {
        //     markAsRead({ ids: [notification.id], status: "READ" });
        // } else {
        //     markAsRead({ ids: [notification.id], status: "UNREAD" });
        // }
        // refreshNotifications();
    };

    const markAllAsReadHandler = () => {
        // markAsRead({ is_all: true, status: "READ" });
        // let unreadNotifications = [];
        // notifications.map((notification) => {
        //     if (notification.is_unread) {
        //         unreadNotifications.push(notification.id);
        //     }
        // });
        // console.log(unreadNotifications);

        refreshNotifications();
    };

    const listInnerRef = useRef();

    const onScroll = () => {
        if (listInnerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } =
                listInnerRef.current;
            if (scrollTop + clientHeight >= scrollHeight - 1) {
                console.log("reached bottom!");
                // getNotificationsHandler();
            }
        }
    };

    return (
        <>
            <div
                className={
                    showMenu ? "notificationIcon notificationsIsActive" : "notificationIcon"
                }
                data-cy="notification-icon"
            >
                <button type="button" className="p-link" onClick={() => setShowMenu(!showMenu)}>
                    <i className="pi pi-bell" style={{ fontSize: '1.2rem', translate: '33%' }}></i>
                </button>
            </div>
            <div className={showMenu ? "notificationsContainer notificationsVisible" : "notificationsContainer"}>
                <div
                    className="popup-dropback--2"
                    onClick={() => setShowMenu(false)}
                ></div>

                <div
                    className={
                        showMenu
                            ? "notificationsMenu notificationsVisible"
                            : "notificationsMenu"
                    }
                    onScroll={() => onScroll()}
                    ref={listInnerRef}
                    data-cy="notification-scroll"
                >
                    <div className="notificationsStickyHeader">
                        <div className="notificationHeader">
                            <div className="menuTitle">Notifications</div>
                            <div className="readOptions">
                                <div className="notificationsReadOption">
                                    Show only unread
                                    <InputSwitch
                                        onChange={() => setOnlyUnread(prev => !prev)}
                                        checked={onlyUnread}
                                    />
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "end",
                            }}
                        >
                            {unreadCount !== 0 ? (
                                <div
                                    className="notificationsReadOption notificationsTxtButton"
                                    onClick={markAllAsReadHandler}
                                >
                                    Mark all as read
                                </div>
                            ) : (
                                " "
                            )}
                        </div>
                    </div>

                    {notifications.map((notification, key) => (
                        <div className="notifications" key={key}>
                            <div
                                className="notificationCon"
                                onClick={() => {
                                    markAsReadHandler(notification);
                                }}
                            >
                                <div
                                    className={
                                        notification.is_unread
                                            ? "notification unread"
                                            : "notification"
                                    }
                                >
                                    <span>
                                        {notification.verb}
                                        <span style={{ color: "#9ca3a9" }}>
                                            {notification.created_at}
                                        </span>
                                    </span>
                                    <span className="mark-as-read">
                                        {notification.is_unread && (
                                            <span className="marked-as-read"></span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default NotificationsCenter;
