import React, { forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState } from 'react';
import AppBreadcrumb from './AppBreadCrumb';
import { LayoutContext } from './context/layoutcontext';
import { AppTopbarRef } from "app/shared/sidebar/types/layout";
import NotificationsCenter from '../components/notifications-center/notifications-center';
import { InputText } from 'primereact/inputtext';
import { TabPanel, TabView } from 'primereact/tabview';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getItems } from 'app/entities/item/all-items.reducer';
import { getEntities as getOrders } from 'app/entities/order/order.reducer';
import { getEntities as getCustomers } from 'app/entities/customer/customer.reducer';
import { Link, useNavigate } from 'react-router-dom';
import { IItem } from '../model/ITEM/item.model';
import { Button } from 'primereact/button';
import { Spinner } from 'reactstrap';
import { IOrder } from '../model/ORDER/order.model';
import { ICustomer } from '../model/CUSTOMER/customer.model';
import "../components/notifications-center/notifications-center.scss";

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { onMenuToggle, showProfileSidebar, showConfigSidebar, layoutState, isDesktop } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);

    const giveMargin = layoutState?.staticMenuDesktopInactive === false;
    const isDesktopEnvironment = isDesktop();
    const onConfigButtonClick = () => {
        showConfigSidebar();
    };

    const [isNotificationsMenuOpen, setIsNotificationsMenuOpen] = useState(false)
    const [notificationsCount, setNotificationsCount] = useState(parseInt(localStorage.getItem('notificationsCount'), 10) || 0);


    useEffect(() => {
        // Event handler to update state when notificationsCount changes
        const handleNotificationsCountUpdated = (event) => {
            setNotificationsCount(event.detail);
        };

        // Add event listener for the custom event
        window.addEventListener('notificationsCountUpdated', handleNotificationsCountUpdated);

        return () => {
            // Clean up the event listener on unmount
            window.removeEventListener('notificationsCountUpdated', handleNotificationsCountUpdated);
        };
    }, []);

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current
    }));

    const logo = "/content/images/rize-pos-align-left.png";

    return (
        // for static Menu
        // <div className="layout-topbar bg-white p-3" style={{ marginLeft: isDesktopEnvironment &&  giveMargin ? '18rem' : '0' }}>
        <div className="layout-topbar" style={{

        }}>
            <div className="topbar-start">
                <button ref={menubuttonRef} type="button" className="topbar-menubutton p-link p-trigger" onClick={onMenuToggle}>
                    <i className="pi pi-bars"></i>
                </button>
                {isDesktopEnvironment && (
                    <img src={logo} alt="logo" className="topbar-logo" style={{
                        height: '7vh',
                        width: '238px',
                        marginRight: '44px',
                        paddingTop: '0.5vh',
                        paddingBottom: '0.5vh',
                        paddingLeft: '0.5vh',
                    }} />
                )}
                <AppBreadcrumb className="topbar-breadcrumb"></AppBreadcrumb>
            </div>

            <div className="topbar-end">
                <ul className="topbar-menu">
                    <li className="topbar-search">
                        <TopBarSearch />
                    </li>
                    <li className="ml-3">
                        {/* <Button type="button" icon="pi pi-cog" text rounded className="p-button-text p-button-secondary flex-shrink-0" onClick={onConfigButtonClick}></Button> */}
                    </li>
                    <li className="topbar-profile">
                        <div
                            className={
                                isNotificationsMenuOpen ? "notificationIcon notificationsIsActive" : "notificationIcon"
                            }
                            data-cy="notification-icon"
                        >
                            {notificationsCount ? (
                                <div className='notificationsBadge'>
                                    {notificationsCount}
                                </div>
                            ) : <></>}
                            <button type="button" className="p-link" onClick={() => setIsNotificationsMenuOpen(!isNotificationsMenuOpen)}>
                                <i className="pi pi-bell" style={{ fontSize: '1.2rem', translate: '33%' }}></i>
                            </button>
                        </div>
                        {isNotificationsMenuOpen && (
                            <NotificationsCenter setShowMenu={setIsNotificationsMenuOpen} showMenu={isNotificationsMenuOpen} />
                        )}
                        <button type="button" className="p-link" onClick={showProfileSidebar}>
                            <i className="pi pi-user" style={{ fontSize: '1.2rem', translate: '33%' }}></i>
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    );
});

const TopBarSearch = () => {
    const [inputValue, setInputValue] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    const handleInputChange = (event) => {
        setInputValue(event.target.value);
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                inputRef.current !== event.target) {
                setDropdownOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <span className="p-input-icon-left">
            <i className="pi pi-search"></i>
            <InputText
                ref={inputRef}
                type="text"
                placeholder="Search"
                style={{
                    borderRadius: '0.8em',
                    width: dropdownOpen ? '700px' : '100%',
                }}
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => setDropdownOpen(true)}
            />
            {dropdownOpen && (
                <div
                    ref={dropdownRef}
                    style={{
                        position: 'absolute',
                        zIndex: 1000,
                        height: '500px',
                        width: '700px',
                        background: 'var(--primary-color-text)',
                        overflowY: 'auto',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                        border: '0.5px solid var(--primary-color-text)',
                        borderRadius: '0.8em',
                    }}
                >
                    <TabView>
                        <TabPanel header="Items">
                            <ItemsSearch inputValue={inputValue} setDropdownOpen={setDropdownOpen} />
                        </TabPanel>
                        <TabPanel header="Orders">
                            <OrdersSearch inputValue={inputValue} setDropdownOpen={setDropdownOpen} />
                        </TabPanel>
                        <TabPanel header="Customers">
                            <CustomersSearch inputValue={inputValue} setDropdownOpen={setDropdownOpen} />
                        </TabPanel>
                    </TabView>
                </div>
            )
            }
        </span >
    );
}

const ItemsSearch = ({
    inputValue,
    setDropdownOpen
}: {
    inputValue: string;
    setDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const dispatch = useAppDispatch();
    const itemList: IItem[] = useAppSelector((state) => state.allItems.entities);
    const loading = useAppSelector((state) => state.allItems.loading);

    useEffect(() => {
        const timeout = setTimeout(() => {
            dispatch(getItems({
                name: inputValue || '',
                sort: 'id,asc',
                page: 0,
                size: 15,
                categoryId: '',
                unassignedItems: ''
            }));
        }, 350)
        return () => {
            clearTimeout(timeout);
        }
    }, [inputValue])

    return (
        !loading ? (
            <div className='d-flex flex-column'>
                {itemList.map((item) => (
                    <ClickableLink
                        key={item.id}
                        to={
                            item.itemVariantType === "RESTAURANT_VARIABLE" ? `/restaurant/regular/${item.id}/edit`
                                : item.itemVariantType === "RESTAURANT_PIZZA" ? `/restaurant/pizza/${item.id}/edit`
                                    : item.itemVariantType === "RESTAURANT_COMBO" ? `/restaurant/combo/${item.id}/edit`
                                        : `/product/${item.id}/edit`
                        }
                        setDropdownOpen={setDropdownOpen}
                    >
                        {item.name}
                    </ClickableLink>
                ))}
            </div>
        ) : (
            <div><Spinner /></div>
        )
    )
}

const OrdersSearch = ({
    inputValue,
    setDropdownOpen
}: {
    inputValue: string;
    setDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const dispatch = useAppDispatch();
    const orderList: IOrder[] = useAppSelector(state => state.order.entities);
    const loading = useAppSelector(state => state.order.loading);

    useEffect(() => {
        const timeout = setTimeout(() => {
            dispatch(getOrders({
                query: inputValue || '',
                sort: 'id,asc',
                page: 0,
                size: 15,
            }));
        }, 350)

        return () => {
            clearTimeout(timeout);
        }
    }, [inputValue])

    return (
        !loading ? (
            <div className='d-flex flex-column'>
                {orderList.map((order) => (
                    <ClickableLink
                        key={order.id}
                        to={`order/${order.id}`}
                        setDropdownOpen={setDropdownOpen}
                    >
                        {order.sequenceNumber}
                    </ClickableLink>
                ))}
            </div>
        ) : (
            <div><Spinner /></div>
        )
    )
}

const CustomersSearch = ({
    inputValue,
    setDropdownOpen
}: {
    inputValue: string;
    setDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const dispatch = useAppDispatch();
    const customerList: ICustomer[] = useAppSelector(state => state.customer.entities);
    const loading = useAppSelector(state => state.customer.loading);

    useEffect(() => {
        const timeout = setTimeout(() => {
            dispatch(getCustomers({
                query: inputValue || '',
                sort: 'id,asc',
                page: 0,
                size: 15,
            }));
        }, 350)

        return () => {
            clearTimeout(timeout);
        }
    }, [inputValue])

    return (
        !loading ? (
            <div className='d-flex flex-column'>
                {customerList.map((customer) => (
                    <ClickableLink
                        key={customer.id}
                        to={`customer/${customer.id}/edit`}
                        setDropdownOpen={setDropdownOpen}
                    >
                        {customer.firstName} {customer.lastName}
                    </ClickableLink>
                ))}
            </div>
        ) : (
            <div><Spinner /></div>
        )
    )
}

const ClickableLink = ({
    to,
    children,
    setDropdownOpen
}: {
    to: string;
    children: any;
    setDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const navigate = useNavigate();

    const handleNavigate = () => {
        navigate(to);
        setDropdownOpen(false);
    }

    return (
        <Button text onClick={handleNavigate} className="text-dark">
            {children}
        </Button>
    )
}

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
