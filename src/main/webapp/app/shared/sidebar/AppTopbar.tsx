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
import './AppTopbar.scss';

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { showProfileSidebar, showConfigSidebar, layoutState, isDesktop } = useContext(LayoutContext);

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

    useImperativeHandle(ref, () => ({}));

    const logo = "/content/images/rize-pos-align-left.png";

    return (
        <div className="modern-topbar">
            <div className="topbar-start">
                {isDesktopEnvironment && (
                    <div className="topbar-logo-container">
                        <img src={logo} alt="Rize POS" className="topbar-logo" />
                    </div>
                )}
                
                <div className="topbar-breadcrumb-container">
                    <AppBreadcrumb className="modern-breadcrumb"></AppBreadcrumb>
                </div>
            </div>

            <div className="topbar-end">
                <div className="topbar-actions">
                    <div className="topbar-search-container">
                        <TopBarSearch />
                    </div>
                    
                    <div className="topbar-notifications">
                        <div
                            className={`notification-button ${isNotificationsMenuOpen ? 'active' : ''}`}
                            data-cy="notification-icon"
                            onClick={() => setIsNotificationsMenuOpen(!isNotificationsMenuOpen)}
                            title="Notifications"
                        >
                            {notificationsCount > 0 && (
                                <span className="notification-badge">
                                    {notificationsCount > 99 ? '99+' : notificationsCount}
                                </span>
                            )}
                            <i className="pi pi-bell"></i>
                        </div>
                        
                        {isNotificationsMenuOpen && (
                            <NotificationsCenter setShowMenu={setIsNotificationsMenuOpen} showMenu={isNotificationsMenuOpen} />
                        )}
                    </div>
                    
                    <button 
                        type="button" 
                        className="profile-button" 
                        onClick={showProfileSidebar}
                        title="Profile"
                    >
                        <i className="pi pi-user"></i>
                    </button>
                </div>
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
        <div className="modern-search-wrapper">
            <div className="search-input-container">
                <i className="pi pi-search search-icon"></i>
                <InputText
                    ref={inputRef}
                    type="text"
                    placeholder="Search items, orders, customers..."
                    className="modern-search-input"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => setDropdownOpen(true)}
                />
            </div>
            
            {dropdownOpen && (
                <div ref={dropdownRef} className="search-dropdown">
                    <TabView className="search-tabs">
                        <TabPanel header="Items" leftIcon="pi pi-box">
                            <ItemsSearch inputValue={inputValue} setDropdownOpen={setDropdownOpen} />
                        </TabPanel>
                        <TabPanel header="Orders" leftIcon="pi pi-shopping-cart">
                            <OrdersSearch inputValue={inputValue} setDropdownOpen={setDropdownOpen} />
                        </TabPanel>
                        <TabPanel header="Customers" leftIcon="pi pi-users">
                            <CustomersSearch inputValue={inputValue} setDropdownOpen={setDropdownOpen} />
                        </TabPanel>
                    </TabView>
                </div>
            )}
        </div>
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
        <div className="search-results">
            {loading ? (
                <div className="search-loading">
                    <Spinner size="sm" />
                    <span>Searching...</span>
                </div>
            ) : itemList.length > 0 ? (
                itemList.map((item) => (
                    <ClickableLink
                        key={item.id}
                        to={
                            item.itemVariantType === "RESTAURANT_VARIABLE" ? `/restaurant/regular/${item.id}/edit`
                                : item.itemVariantType === "RESTAURANT_PIZZA" ? `/restaurant/pizza/${item.id}/edit`
                                    : item.itemVariantType === "RESTAURANT_COMBO" ? `/restaurant/combo/${item.id}/edit`
                                        : `/product/${item.id}/edit`
                        }
                        setDropdownOpen={setDropdownOpen}
                        icon="pi pi-box"
                    >
                        {item.name}
                    </ClickableLink>
                ))
            ) : (
                <div className="search-no-results">
                    <i className="pi pi-search"></i>
                    <span>No items found</span>
                </div>
            )}
        </div>
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
        <div className="search-results">
            {loading ? (
                <div className="search-loading">
                    <Spinner size="sm" />
                    <span>Searching...</span>
                </div>
            ) : orderList.length > 0 ? (
                orderList.map((order) => (
                    <ClickableLink
                        key={order.id}
                        to={`order/${order.id}`}
                        setDropdownOpen={setDropdownOpen}
                        icon="pi pi-shopping-cart"
                    >
                        Order #{order.sequenceNumber}
                    </ClickableLink>
                ))
            ) : (
                <div className="search-no-results">
                    <i className="pi pi-search"></i>
                    <span>No orders found</span>
                </div>
            )}
        </div>
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
        <div className="search-results">
            {loading ? (
                <div className="search-loading">
                    <Spinner size="sm" />
                    <span>Searching...</span>
                </div>
            ) : customerList.length > 0 ? (
                customerList.map((customer) => (
                    <ClickableLink
                        key={customer.id}
                        to={`customer/${customer.id}/edit`}
                        setDropdownOpen={setDropdownOpen}
                        icon="pi pi-user"
                    >
                        {customer.firstName} {customer.lastName}
                    </ClickableLink>
                ))
            ) : (
                <div className="search-no-results">
                    <i className="pi pi-search"></i>
                    <span>No customers found</span>
                </div>
            )}
        </div>
    )
}

const ClickableLink = ({
    to,
    children,
    setDropdownOpen,
    icon
}: {
    to: string;
    children: any;
    setDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
    icon?: string;
}) => {
    const navigate = useNavigate();

    const handleNavigate = () => {
        navigate(to);
        setDropdownOpen(false);
    }

    return (
        <div className="search-result-item" onClick={handleNavigate}>
            {icon && <i className={icon}></i>}
            <span>{children}</span>
            <i className="pi pi-arrow-right arrow-icon"></i>
        </div>
    )
}

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
