import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import AppBreadcrumb from './AppBreadCrumb';
import { LayoutContext } from './context/layoutcontext';
import { AppTopbarRef } from "app/shared/sidebar/types/layout";
import NotificationsCenter from '../components/notifications-center/notifications-center';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getItems } from 'app/entities/item/all-items.reducer';
import { getEntities as getOrders } from 'app/entities/order/order.reducer';
import { getEntities as getCustomers } from 'app/entities/customer/customer.reducer';
import { Link, useNavigate } from 'react-router-dom';
import { IItem } from '../model/ITEM/item.model';
import { IOrder } from '../model/ORDER/order.model';
import { ICustomer } from '../model/CUSTOMER/customer.model';
import { ThemeToggle } from '../components/theme-toggle';
import { cn } from '@/src/main/webapp/app/lib/utils';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, Bell, User, Package, ShoppingCart, Users, Loader2, ArrowRight, Globe } from 'lucide-react';
import AppProfileSidebar from './AppProfileSidebar';
import './AppTopbar.scss';
import allTimeZones from '../../../content/samples/all_time_zones.json';
import { getBusinessTimeZone, updateBusinessTimeZone } from 'app/entities/settings/business-details/business-timezone.reducer';
import Select from 'react-select';
import { toast } from 'react-toastify';

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const [notificationsCount, setNotificationsCount] = useState(parseInt(localStorage.getItem('notificationsCount'), 10) || 0);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    useEffect(() => {
        const handleNotificationsCountUpdated = (event: any) => {
            setNotificationsCount(event.detail);
        };

        window.addEventListener('notificationsCountUpdated', handleNotificationsCountUpdated);

        return () => {
            window.removeEventListener('notificationsCountUpdated', handleNotificationsCountUpdated);
        };
    }, []);

    useImperativeHandle(ref, () => ({}));

    return (
        <>
            <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
                {/* Sidebar Trigger (mobile) */}
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />

                {/* Logo */}
                <div className="flex items-center gap-2">
                    <img src="/content/images/rize-pos-align-left.png" alt="Logo" className="h-10 max-w-[150px] object-contain" />
                </div>

                {/* Breadcrumb */}
                <AppBreadcrumb />

                {/* Right side actions */}
                <div className="ml-auto flex items-center gap-2">
                    <TopBarSearch />
                    <TimeZoneSelector />
                    <NotificationsButton notificationsCount={notificationsCount} />
                    {/* <ThemeToggle /> */}
                    <ProfileButton isProfileOpen={isProfileOpen} setIsProfileOpen={setIsProfileOpen} />
                </div>
            </header>
            <AppProfileSidebar isOpen={isProfileOpen} setIsOpen={setIsProfileOpen} />
        </>
    );
});

const TopBarSearch = () => {
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Search className="h-4 w-4" />
                    <span className="sr-only">Search</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[500px] p-0" align="end">
                <div className="flex items-center border-b px-3">
                    <Search className="h-4 w-4 shrink-0 opacity-50" />
                    <Input
                        type="text"
                        placeholder="Search items, orders, customers..."
                        className="h-12 border-0 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground"
                        value={inputValue}
                        onChange={handleInputChange}
                    />
                </div>
                <Tabs defaultValue="items" className="w-full">
                    <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                        <TabsTrigger
                            value="items"
                            className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                        >
                            <Package className="h-4 w-4 mr-2" />
                            Items
                        </TabsTrigger>
                        <TabsTrigger
                            value="orders"
                            className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                        >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Orders
                        </TabsTrigger>
                        <TabsTrigger
                            value="customers"
                            className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                        >
                            <Users className="h-4 w-4 mr-2" />
                            Customers
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="items" className="m-0 max-h-[400px] overflow-y-auto">
                        <ItemsSearch inputValue={inputValue} setDropdownOpen={setIsOpen} />
                    </TabsContent>
                    <TabsContent value="orders" className="m-0 max-h-[400px] overflow-y-auto">
                        <OrdersSearch inputValue={inputValue} setDropdownOpen={setIsOpen} />
                    </TabsContent>
                    <TabsContent value="customers" className="m-0 max-h-[400px] overflow-y-auto">
                        <CustomersSearch inputValue={inputValue} setDropdownOpen={setIsOpen} />
                    </TabsContent>
                </Tabs>
            </PopoverContent>
        </Popover>
    );
};

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
        }, 350);
        return () => {
            clearTimeout(timeout);
        };
    }, [inputValue, dispatch]);

    return (
        <div className="p-2">
            {loading ? (
                <div className="flex items-center justify-center gap-2 p-8">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Searching...</span>
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
                        icon={<Package className="h-4 w-4" />}
                    >
                        {item.name}
                    </ClickableLink>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                    <Search className="h-8 w-8 text-muted-foreground opacity-50" />
                    <span className="text-sm text-muted-foreground">No items found</span>
                </div>
            )}
        </div>
    );
};

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
        }, 350);

        return () => {
            clearTimeout(timeout);
        };
    }, [inputValue, dispatch]);

    return (
        <div className="p-2">
            {loading ? (
                <div className="flex items-center justify-center gap-2 p-8">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Searching...</span>
                </div>
            ) : orderList.length > 0 ? (
                orderList.map((order) => (
                    <ClickableLink
                        key={order.id}
                        to={`order/${order.id}`}
                        setDropdownOpen={setDropdownOpen}
                        icon={<ShoppingCart className="h-4 w-4" />}
                    >
                        Order #{order.sequenceNumber}
                    </ClickableLink>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                    <Search className="h-8 w-8 text-muted-foreground opacity-50" />
                    <span className="text-sm text-muted-foreground">No orders found</span>
                </div>
            )}
        </div>
    );
};

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
        }, 350);

        return () => {
            clearTimeout(timeout);
        };
    }, [inputValue, dispatch]);

    return (
        <div className="p-2">
            {loading ? (
                <div className="flex items-center justify-center gap-2 p-8">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Searching...</span>
                </div>
            ) : customerList.length > 0 ? (
                customerList.map((customer) => (
                    <ClickableLink
                        key={customer.id}
                        to={`customer/${customer.id}`}
                        setDropdownOpen={setDropdownOpen}
                        icon={<Users className="h-4 w-4" />}
                    >
                        {customer.firstName} {customer.lastName}
                    </ClickableLink>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                    <Search className="h-8 w-8 text-muted-foreground opacity-50" />
                    <span className="text-sm text-muted-foreground">No customers found</span>
                </div>
            )}
        </div>
    );
};

const ClickableLink = ({
    to,
    children,
    setDropdownOpen,
    icon
}: {
    to: string;
    children: React.ReactNode;
    setDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
    icon?: React.ReactNode;
}) => {
    const navigate = useNavigate();

    const handleNavigate = () => {
        navigate(to);
        setDropdownOpen(false);
    };

    return (
        <div
            className="flex items-center gap-3 rounded-md p-3 cursor-pointer transition-colors hover:bg-accent group"
            onClick={handleNavigate}
        >
            {icon && <div className="text-primary">{icon}</div>}
            <span className="flex-1 text-sm">{children}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
};

const NotificationsButton = ({ notificationsCount }: { notificationsCount: number }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 relative" data-cy="notification-icon">
                    <Bell className="h-4 w-4" />
                    {notificationsCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center p-0 px-1 text-xs"
                        >
                            {notificationsCount > 99 ? '99+' : notificationsCount}
                        </Badge>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </SheetTrigger>
            <SheetContent
                side="right"
                className="flex h-full w-full max-w-full flex-col gap-0 border-l border-border/60 bg-card p-0 shadow-2xl sm:max-w-[420px]"
            >
                <SheetHeader className="sr-only">
                    <SheetTitle>Notifications</SheetTitle>
                </SheetHeader>
                <NotificationsCenter setShowMenu={setIsOpen} showMenu={isOpen} />
            </SheetContent>
        </Sheet>
    );
};

const TimeZoneSelector = () => {
    const dispatch = useAppDispatch();
    const timeZone = useAppSelector(state => state.businessTimeZone.timeZone);
    const loading = useAppSelector(state => state.businessTimeZone.loading);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        dispatch(getBusinessTimeZone());
    }, [dispatch]);

    const handleTimeZoneChange = (selectedTimeZone: any) => {
        if (selectedTimeZone) {
            dispatch(updateBusinessTimeZone(selectedTimeZone.ZoneId))
                .unwrap()
                .then(() => {
                    toast.success('Time zone updated successfully');
                    setIsOpen(false);
                })
                .catch(() => {
                    toast.error('Failed to update time zone');
                });
        }
    };

    const selectedTimezone = allTimeZones.find(tz => tz.ZoneId === timeZone);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10" title={timeZone || 'Select Time Zone'}>
                    <Globe className="h-4 w-4" />
                    <span className="sr-only">Time Zone</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="end">
                <div className="p-3">
                    <h3 className="font-semibold text-sm mb-2">Business Time Zone</h3>
                    {loading ? (
                        <div className="flex items-center justify-center gap-2 p-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Loading...</span>
                        </div>
                    ) : (
                        <Select
                            value={selectedTimezone}
                            options={allTimeZones}
                            getOptionLabel={option => `${option.Continent}/${option.City} (${option.ZoneId})`}
                            getOptionValue={option => option.ZoneId}
                            onChange={handleTimeZoneChange}
                            placeholder="Select time zone..."
                            isClearable={false}
                            isSearchable
                            className="text-xs"
                            menuPortalTarget={document.body}
                            styles={{
                                menuPortal: (base) => ({ ...base, zIndex: 9999 } as any)
                            }}
                        />
                    )}
                    {selectedTimezone && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                            <div><strong>Current:</strong> {selectedTimezone.Continent}/{selectedTimezone.City}</div>
                            <div className="text-muted-foreground">{selectedTimezone.ZoneId}</div>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};

const ProfileButton = ({ isProfileOpen, setIsProfileOpen }: { isProfileOpen: boolean; setIsProfileOpen: (open: boolean) => void }) => {
    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => setIsProfileOpen(true)}
        >
            <User className="h-4 w-4" />
            <span className="sr-only">Profile</span>
        </Button>
    );
};

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
