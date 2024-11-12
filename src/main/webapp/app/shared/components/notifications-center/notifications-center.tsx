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
}: {
    showMenu: boolean;
    setShowMenu: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const notifications: INotification[] = useAppSelector(state => state.notification.entities);
    console.log(notifications)

    const [unreadCount, setUnreadCount] = useState<number>(parseInt(localStorage.getItem('notificationsCount'), 10) || 0);

    useEffect(() => {
        dispatch(getEntities({
            page: 0,
            size: 100,
            sort: 'sentAt,desc'
        }));
    }, [])

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

    useEffect(() => {
        if (unreadCount > 0) {
            localStorage.removeItem('notificationsCount');

            const event = new CustomEvent('notificationsCountUpdated', { detail: 0 });
            window.dispatchEvent(event);
        }
    }, [unreadCount])

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
                                <div className={`notification ${key < unreadCount ? 'unread' : ''}`}>
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
