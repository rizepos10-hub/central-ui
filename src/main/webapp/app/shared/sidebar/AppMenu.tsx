import AppSubMenu from './AppSubMenu';
import React from "react";

const AppMenu = () => {

  const model: any = [
                          {
                            label: 'Control Panel',
                            icon: 'pi pi-home',
                            to: '/',
                            items: [
                              {
                                label: 'Dashboard',
                                to: '/'
                              },
                            ]
                          },
                          {
                            label: 'POS',
                            role: ['ROLE_ADMIN'],
                            icon: 'pi pi-desktop',
                            to: '/switch-register',
                            items: [
                              {
                                label: 'Switch Register',
                                to: '/switch-register',
                              },
                              {
                                label: 'Close Sales',
                                to: '/close-sales',
                              },
                              {
                                label: 'Daily Sales Report',
                                to: '/daily-sales-report',
                              },
                            ]
                          },
                          {
                            label: 'Users',
                            role: ['ROLE_ADMIN'],
                            icon: 'pi pi-user',
                            to: '/back-office-user',
                            items: [
                              {
                                label: 'Back End',
                                to: '/back-office-user'
                              },
                              {
                                label: 'POS',
                                to: '/branch-pos-user'
                              },
                              {
                                label: 'Activities',
                                to: '/branch-pos-user'
                              },
                            ]
                          },
                          {
                            label: 'Online Ordering',
                            role: ['ROLE_ADMIN'],
                            icon: 'pi pi-tablet',
                            to: '/menu?type=ONLINE_ORDERING',
                            items: [
                              {
                                label: 'Menu',
                                to: '/menu?type=ONLINE_ORDERING'
                              },
                              {
                                label: 'Online Orders',
                                role: ['ROLE_ADMIN'],
                                to: '/online-ordering/order'
                              },
                              {
                                label: 'Users',
                                role: ['ROLE_ADMIN'],
                                to: '/online-ordering/user'
                              },
                              {
                                label: 'UI Settings',
                                role: ['ROLE_ADMIN'],
                                to: '/online-ordering/settings'
                              },
                            ]
                          },

                          {
                            label: 'Restaurant Catalog',
                            role: ['ROLE_ADMIN'],
                            icon: 'pi pi-book',
                            to: '/category/restaurant-items',
                            items: [
                              {
                                label: 'Categories',
                                to: '/category/restaurant-items'
                              },
                              {
                                label: 'Products',
                                items: [
                                  {
                                    label: 'Regular',
                                    to: 'restaurant/regular'
                                  },
                                  {
                                    label: 'Combo',
                                    to: 'restaurant/combo'
                                  },
                                  {
                                    label: 'Pizza',
                                    to: 'restaurant/pizza'
                                  },
                                ]
                              },
                              {
                                label: 'Pizza Settings',
                                items: [
                                  {
                                    label: 'Sizes',
                                    to: '/pizza-size'
                                  },
                                  {
                                    label: 'Crust Settings',
                                    to: '/pizza-crust'
                                  },
                                  {
                                    label: 'Toppings',
                                    to: '/pizza-topping'
                                  },
                                  {
                                    label: 'Topping Groups',
                                    to: '/pizza-topping-group'
                                  },
                                  {
                                    label: 'Pricing Class',
                                    to: '/pizza-pricing-class?type=CRUST_TYPE'
                                  },
                                  {
                                    label: 'Predefined Pizza',
                                    to: '/predefined-pizza'
                                  },
                                ]
                                  },
                                  {
                                    label: 'Addon Groups',
                                    to: '/addon-groups'
                                  },
                                  {
                                    label: 'Addons',
                                    to: '/addon'
                                  },
                                  {
                                    label: 'Tags',
                                    to: '/tags'
                                  },
                                  {
                                    label: 'Pos List',
                                    to: '/menu?type=POS'
                                  },
                                ]
                              },
                              {
                                label: 'Retail Catalog',
                                icon: 'pi pi-tags',
                                to: '/category/retail-items',
                                items: [
                                  {
                                    label: 'Categories',
                                    to: '/category/retail-items'
                                  },
                                  {
                                    label: 'Products',
                                    to: '/product'
                                  },

                                  {
                                    label: 'Attributes',
                                    to: 'retail/attributes'
                                  },
                                  {
                                    label: 'Mix & Match',
                                    role: ['ROLE_ADMIN'],
                                    to: '/mix-and-match-rule'
                                  },
                                  {
                                    label: 'Suppliers',
                                    role: ['ROLE_ADMIN'],
                                    to: '/supplier'
                                  },
                                  {
                                    label: 'Brands',
                                    role: ['ROLE_ADMIN'],
                                    to: '/mix-and-match-rule'
                                  },
                                  {
                                    label: 'Tags',
                                    role: ['ROLE_ADMIN'],
                                    to: '/mix-and-match-rule'
                                  },
                                  {
                                    label: 'Menus',
                                    role: ['ROLE_ADMIN'],
                                    to: '/mix-and-match-rule'
                                  },

                                ]
                              },
                              {
                                label: 'Inventory',
                                role: ['ROLE_ADMIN'],
                                icon: 'pi pi-box',
                                to: '/inventory/warehouse',
                                items: [
                                  {
                                    label: 'Warehouses',
                                    role: ['ROLE_ADMIN'],
                                    to: '/inventory/warehouse'
                                  },
                                  {
                                    label: 'Sales Locations',
                                    role: ['ROLE_ADMIN'],
                                    to: '/inventory/sales-location'
                                  },
                                  {
                                    label: 'Stock',
                                    role: ['ROLE_ADMIN'],
                                    to: '/inventory/stock'
                                  },
                                  {
                                    label: 'Purchase Orders',
                                    role: ['ROLE_ADMIN'],
                                    to: '/inventory/purchase-order'
                                  },
                                  {
                                    label: 'Transfers',
                                    role: ['ROLE_ADMIN'],
                                    to: '/inventory/transfer-request'
                                  },
                                  {
                                    label: 'Returns',
                                    role: ['ROLE_ADMIN'],
                                    to: '/inventory/supplier-return'
                                  },
                                  {
                                    label: 'Inventory Count',
                                    role: ['ROLE_ADMIN'],
                                    items: [
                                      {
                                        label: 'Due',
                                        role: ['ROLE_ADMIN'],
                                        to: '/inventory/due'
                                      },
                                      {
                                        label: 'Upcoming',
                                        role: ['ROLE_ADMIN'],
                                        to: '/inventory/upcoming'
                                      },
                                      {
                                        label: 'Completed',
                                        role: ['ROLE_ADMIN'],
                                        to: '/inventory/completed'
                                      },
                                      {
                                        label: 'Canceled',
                                        role: ['ROLE_ADMIN'],
                                        to: '/inventory/canceled'
                                      },
                                    ]
                                  },
                                  {
                                    label: 'Fulfillments',
                                    role: ['ROLE_ADMIN'],
                                    items: [
                                      {
                                        label: 'All',
                                        role: ['ROLE_ADMIN'],
                                        to: '/inventory/all'
                                      },
                                      {
                                        label: 'Pack Orders',
                                        role: ['ROLE_ADMIN'],
                                        to: '/inventory/pack-orders'
                                      },
                                      {
                                        label: 'Customer Pickup',
                                        role: ['ROLE_ADMIN'],
                                        to: '/inventory/customer-pickup'
                                      },
                                      {
                                        label: 'Delivery',
                                        role: ['ROLE_ADMIN'],
                                        to: '/inventory/delivery'
                                      },
                                    ]
                                  },
                                  {
                                    label: 'Serial Numbers',
                                    role: ['ROLE_ADMIN'],
                                    to: '/inventory/serial-number'
                                  },
                                  {
                                    label: 'Suppliers',
                                    role: ['ROLE_ADMIN'],
                                    to: '/inventory/supplier'
                                  },
                                ]
                              },
                              {
                                label: 'Customers',
                                role: ['ROLE_ADMIN'],
                                icon: ' pi pi-users',
                                to: '/customer/group',
                                items: [
                                  {
                                    label: 'Groups',
                                    role: ['ROLE_ADMIN'],
                                    to: '/customer/group'
                                  },
                                  {
                                    label: 'Customers',
                                    role: ['ROLE_ADMIN'],
                                    to: '/customer'
                                  },
                                ]
                              },

                          // {
                          //   label: 'Menus',
                          //   role: ['ROLE_ADMIN'],
                          //   icon: 'pi pi-bars',
                          //   items: [
                          //     {
                          //       label: 'Category',
                          //       to: '/category/menus'
                          //     },
                          //
                          //
                          //   ]
                          // },

                          {
                            label: 'Orders',
                            role: ['ROLE_ADMIN'],
                            icon: 'pi pi-dollar',
                            to: '/order/today',
                            items: [
                              {
                                label: 'Today',
                                to: '/order/today'
                              },
                              {
                                label: 'History',
                                to: '/order'
                              }
                            ]
                          },
                          {
                            label: 'Loyalty',
                            role: ['ROLE_ADMIN'],
                            icon: 'pi pi-wallet',
                            to: '/loyalty'
                          },
                          {
                            label: 'Digital Signage',
                            icon:  'pi pi-desktop',
                            role: ['ROLE_ADMIN'],
                            to: '/tv',
                            items: [
                              {
                                label: 'Tv Config',
                                items: [
                                  {
                                    label: 'Tvs',
                                    to: '/tv'
                                  },
                                  {
                                    label: 'Tv Displays',
                                    to: '/tv-display'
                                  },
                                ]
                              },
                            ]
                          },
                          {
                            label: 'Reports',
                            role: ['ROLE_ADMIN'],
                            icon: ' pi pi-chart-bar',
                            to: '/analytics/retail-dashboard',
                            items: [
                              {
                                label: 'Retail Dashboard',
                                to: '/analytics/retail-dashboard'
                              },
                              {
                                label: 'Restaurant Dashboard',
                                to: '/analytics/restaurant-dashboard'
                              },
                              {
                                label: 'Sales Reports',
                                items: [
                                  {
                                    label: 'Individual Performance',
                                    to: '/analytics/individual-performance'
                                  },
                                  {
                                    label: 'Sales by Hour',
                                    to: '/analytics/sales-by-hour'
                                  },
                                  {
                                    label: 'Sales by Hour',
                                    to: '/analytics/summary'
                                  },
                                ]
                              },
                              {
                                label: 'Inventory Reports',
                                items: [
                                  {
                                    label: 'Out of Stock',
                                    to: '/analytics/out-of-stock'
                                  },
                                  {
                                    label: 'Sell Through',
                                    to: '/analytics/sell-through'
                                  },
                                  {
                                    label: 'Dusty Inventory',
                                    to: '/analytics/dusty-inventory'
                                  },
                                  {
                                    label: 'Performance',
                                    to: '/analytics/performance'
                                  },
                                ]
                              },
                              {
                                label: 'Payment Reports',
                                to: '/analytics/payment-report'
                              },
                              {
                                label: 'Register Closures',
                                to: '/analytics/register-closure'
                              },
                              {
                                label: 'Shift Closures',
                                to: '/analytics/shift-closure'
                              },
                              {
                                label: 'Gift Cards',
                                to: '/analytics/gift-card'
                              },
                              {
                                label: 'Store Credits',
                                to: '/analytics/store-credit'
                              },
                              {
                                label: 'Tax Reports',
                                to: '/analytics/tax-report'
                              },
                              {
                                label: 'AI Reporting',
                                to: '/analytics/ai-reporting'
                              },
                              {
                                label: 'Top Items',
                                to: '/analytics/topItems'
                              },
                              {
                                label: 'End Of Day',
                                to: '/analytics/endofday'
                              },
                              {
                                label: 'Sales Report',
                                to: '/analytics/sales'
                              },
                              {
                                label: 'Report',
                                to: '/analytics/reports'
                              },
                            ]
                          },
                          {
                            label: 'Accounting',
                            icon: 'pi pi-money-bill',
                            to: "/accounting"
                          },

                          {
                            label: 'Settings',
                            icon: 'pi pi-cog',
                            role: ['ROLE_ADMIN', 'ROLE_BO-BUSINESS-SETTING'],
                            to: '/details',
                            items: [
                              {
                                label: 'Business Information',
                                role: ['ROLE_ADMIN', 'ROLE_BO-BUSINESS-SETTING'],
                                to: '/details'
                              },
                              {
                                label: 'Billing',
                                role: ['ROLE_ADMIN'],
                                to: '/billing'
                              },
                              {
                                label: 'Branches',
                                role: ['ROLE_ADMIN'],
                                to: '/branch'
                              },
                              {
                                label: 'Registers',
                                role: ['ROLE_ADMIN'],
                                to: '/register'
                              },
                              {
                                label: 'Payment Types',
                                role: ['ROLE_ADMIN'],
                                to: '/payment-types'
                              },
                              {
                                label: 'Discounts',
                                role: ['ROLE_ADMIN'],
                                to: '/discount'
                              },
                              {
                                label: 'Voids',
                                role: ['ROLE_ADMIN'],
                                to: '/void-reasons'
                              },
                              {
                                label: 'On Account',
                                role: ['ROLE_ADMIN'],
                                to: '/on-account'
                              },
                              {
                                label: 'Taxes',
                                role: ['ROLE_ADMIN'],
                                items: [
                                  {
                                    label: 'Taxes',
                                    role: ['ROLE_ADMIN'],
                                    to: '/tax'
                                  },
                                  {
                                    label: 'Tax profiles ',
                                    role: ['ROLE_ADMIN'],
                                    to: '/tax-profiles'
                                  },
                                ]
                              },
                              {
                                label: 'Accounting Groups ',
                                role: ['ROLE_ADMIN'],
                                to: '/accounting-groups'
                              },
                              {
                                label: 'Units of Measures',
                                role: ['ROLE_ADMIN'],
                                to: '/item-measure'
                              },
                              {
                                label: 'Floor plans',
                                role: ['ROLE_ADMIN'],
                                items: [
                                  {
                                    label: 'List',
                                    to: '/floor-plan'
                                  },
                                  {
                                    label: 'Tables',
                                    to: '/floor-plan/table'
                                  },
                                  {
                                    label: 'Settings',
                                    to: '/floor-plan/settings'
                                  },
                                ]
                              },
                              {
                                label: 'App Integrations',
                                role: ['ROLE_ADMIN'],
                                to: '/app-integration'
                              },
                              {
                                label: 'Themes',
                                role: ['ROLE_ADMIN'],
                                to: '/theme'
                              },
                              {
                                label: 'Language',
                                role: ['ROLE_ADMIN'],
                                to: '/language'
                              },
                              {
                                label: 'Instructions',
                                to: '/instructions'
                              },

                              // {
                              //   label: 'Reporting shifts ',
                              //   role: ['ROLE_ADMIN'],
                              //   to: '/reporting-shifts'
                              // },

                              {
                                label: 'Printers',
                                role: ['ROLE_ADMIN'],
                                to: '/printer'
                              },
                              {
                                label: 'Printing Profiles',
                                role: ['ROLE_ADMIN'],
                                to: '/printing-profiles'
                              },
                              {
                                label: 'Production Centers',
                                role: ['ROLE_ADMIN'],
                                to: '/production-center'
                              },
                              {
                                label: 'Currencies',
                                role: ['ROLE_ADMIN'],
                                to: '/currencies'
                              },

                              {
                                label: 'Account profiles',
                                role: ['ROLE_ADMIN'],
                                to: '/account-profiles'
                              },


                              {
                                label: 'Payment methods ',
                                role: ['ROLE_ADMIN'],
                                to: '/payment-methods'
                              },

                              {
                                label: 'Transfer Operations',
                                role: ['ROLE_ADMIN'],
                                to: '/transfer-operations'
                              },
                              {
                                label: 'Web extensions',
                                role: ['ROLE_ADMIN'],
                                to: '/web-extensions'
                              },



                              {
                                label: 'Reporting automations',
                                role: ['ROLE_ADMIN'],
                                to: '/reporting-automations'
                              },


                            ]
                          },


    ];

  // eslint-disable-next-line react/react-in-jsx-scope
    return <AppSubMenu model={model} />;
};

export default AppMenu;
