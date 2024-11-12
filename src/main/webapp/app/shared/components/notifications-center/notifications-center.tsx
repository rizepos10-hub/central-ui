import React, { useEffect, useRef, useState } from "react";
import "./notifications-center.scss";
import { AiOutlineBell } from "react-icons/ai";
import { InputSwitch } from "primereact/inputswitch";
import { UncontrolledTooltip } from "reactstrap";
import { useAppDispatch, useAppSelector } from "app/config/store";
import { INotification } from "app/shared/model/notification.model";
import { useNavigate } from "react-router-dom";
import { getEntities } from "./notifications.reducer";

const NotificationsCenter = ({
    showMenu,
    setShowMenu
} : {
    showMenu: boolean;
    setShowMenu: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    
    const notifications: INotification[] = useAppSelector(state => state.notification.entities);
    console.log(notifications)

    // const [notifications, setNotifications] = useState([]);
    const [onlyUnread, setOnlyUnread] = useState(false);
    const [unreadClicked, setUnreadClicked] = useState(false);
    const [notificationsNext, setNotificationsNext] = useState(true);
    const [notificationsOffset, setNotificationsOffset] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    
    useEffect(() => {
        dispatch(getEntities({
            page: 0,
            size: 100,
            sort: 'sentAt,desc'
        }));
    }, [])

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
                            {/* <div className="readOptions">
                                <div className="notificationsReadOption">
                                    Show only unread
                                    <InputSwitch
                                        onChange={() => setOnlyUnread(prev => !prev)}
                                        checked={onlyUnread}
                                    />
                                </div>
                            </div> */}
                        </div>

                        {/* <div
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
                        </div> */}
                    </div>

                    {notifications.map((notification, key) => (
                        <div className="notifications" key={key}>
                            <div
                                className="notificationCon"
                                onClick={() => {
                                    // markAsReadHandler(notification);
                                    navigate(notification.url)
                                }}
                            >
                                <div className={"notification"}>
                                    <span>
                                        {notification.message}
                                        <span style={{ color: "#9ca3a9" }}>
                                            {new Date(notification.sentAt).toLocaleString()}
                                        </span>
                                    </span>
                                    {/* <span className="mark-as-read">
                                        <>
                                            <span id="marked-as-read" className="marked-as-read"></span>
                                            <UncontrolledTooltip
                                                placement="left"
                                                target="marked-as-read"
                                            >
                                                mark as read
                                            </UncontrolledTooltip>
                                        </>
                                        {notification.is_unread ? (
                                            <>
                                                <span id="marked-as-read" className="marked-as-read"></span>
                                                <UncontrolledTooltip
                                                    placement="left"
                                                    target="marked-as-read"
                                                >
                                                    mark as read
                                                </UncontrolledTooltip>
                                            </>
                                        ) : (
                                            <>
                                                <span id="marked-as-unread" className="marked-as-unread"></span>
                                                <UncontrolledTooltip
                                                    placement="left"
                                                    target="marked-as-unread"
                                                >
                                                    mark as unread
                                                </UncontrolledTooltip>
                                            </>
                                        )}
                                    </span> */}
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
