import AppSubMenu from './AppSubMenu';
import React from "react";

const AppMenu = () => {

  const model: any = [
                          {
                            label: 'Control Panel',
                            icon: 'pi pi-home',
                            items: [
                              {
                                label: 'Dashboard',
                                to: '/'
                              },
                            ]
                          },
                          {
                            label: 'Users',
                            role: ['ROLE_ADMIN'],
                            icon: 'pi pi-user',
                            items: [
                              {
                                label: 'Backoffice users',
                                to: '/back-office-user'
                              },
                              {
                                label: 'Pos users',
                                to: '/branch-pos-user'
                              },
                            ]
                          },

                          {
                            label: 'Catalogue',
                            role: ['ROLE_ADMIN'],
                            icon: 'pi pi-book',
                            items: [
                              {
                                label: 'Restaurant',
                                items: [
                                  {
                                    label: 'Category',
                                    to: '/category/restaurant-items'
                                  },
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
                                  {
                                    label: 'Addons',
                                    to: '/addon'
                                  },

                                  {
                                    label: 'Addon Groups',
                                    to: '/addon-groups'
                                  },
                                ]
                              },
                              {
                                label: 'Retail',
                                items: [
                                  {
                                    label: 'Category',
                                    to: '/category/retail-items'
                                  },
                                  {
                                    label: 'Products',
                                    to: '/product'
                                  },
                                  // {
                                  //   label: 'Simple',
                                  //   icon: 'pi pi-folder-open',
                                  //   to: 'retail/simple'
                                  // },
                                  // {
                                  //   label: 'Variable',
                                  //   icon: 'pi pi-folder-open',
                                  //   to: 'retail/variable'
                                  // },
                                  // {
                                  //   label: 'Grouped',
                                  //   icon: 'pi pi-folder-open',
                                  //   to: 'retail/grouped'
                                  // },
                                  {
                                    label: 'Attributes',
                                    to: 'retail/attributes'
                                  },
                                ]
                              },
                              {
                                label: 'Measures',
                                role: ['ROLE_ADMIN'],
                                to: '/item-measure'
                              },
                              {
                                label: 'Mix & Match Rule',
                                role: ['ROLE_ADMIN'],
                                to: '/mix-and-match-rule'
                              }

                            ]
                          },
                          {
                            label: 'Menus',
                            role: ['ROLE_ADMIN'],
                            icon: 'pi pi-bars',
                            items: [
                              {
                                label: 'Category',
                                to: '/category/menus'
                              },
                              {
                                label: 'Pos List',
                                to: '/menu?type=POS'
                              },
                              {
                                label: 'Online List',
                                to: '/menu?type=ONLINE_ORDERING'
                              },

                            ]
                          },

                          {
                            label: 'Sales',
                            role: ['ROLE_ADMIN'],
                            icon: 'pi pi-dollar',
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
                            label: 'Analytics',
                            role: ['ROLE_ADMIN'],
                            icon: ' pi pi-chart-bar',
                            items: [
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
                            label: 'Customers',
                            role: ['ROLE_ADMIN'],
                            icon: ' pi pi-users',
                            items: [
                              {
                                label: 'All Customers',
                                role: ['ROLE_ADMIN'],
                                to: '/customer'

                              },
                              {
                                label: 'Loyalty',
                                role: ['ROLE_ADMIN'],
                                to: '/loyalty'
                              },
                            ]
                          },

                          {
                            label: 'Inventory',
                            role: ['ROLE_ADMIN'],
                            icon: 'pi pi-box',
                            items: [
                              {
                                label: 'Stock',
                                role: ['ROLE_ADMIN'],
                                to: '/inventory/stock'
                              },
                              {
                                label: 'Suppliers',
                                role: ['ROLE_ADMIN'],
                                to: '/inventory/supplier'
                              },
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
                                label: 'Transfer Requests',
                                role: ['ROLE_ADMIN'],
                                to: '/inventory/transfer-request'
                              },
                              {
                                label: 'Supplier Returns',
                                role: ['ROLE_ADMIN'],
                                to: '/inventory/supplier-return'
                              },
                              {
                                label: 'Purchase Orders',
                                role: ['ROLE_ADMIN'],
                                to: '/inventory/purchase-order'
                              },
                            ]
                          },


                            {
                              label: 'Online Ordering',
                              role: ['ROLE_ADMIN'],
                              icon: 'pi pi-tablet',
                              items: [
                                {
                                  label: 'Users',
                                  role: ['ROLE_ADMIN'],
                                  to: '/online-ordering/user'
                                },
                                {
                                  label: 'Sales',
                                  role: ['ROLE_ADMIN'],
                                  to: '/online-ordering/order'
                                },
                                {
                                  label: 'UI Settings',
                                  role: ['ROLE_ADMIN'],
                                  to: '/online-ordering/settings'
                                },
                                {
                                  label: 'Layout Settings',
                                  role: ['ROLE_ADMIN'],
                                  to: '/online-ordering/layout-settings'
                                },

                              ]
                            },

                          {
                            label: 'Settings',
                            icon: 'pi pi-cog',
                            role: ['ROLE_ADMIN', 'ROLE_BO-BUSINESS-SETTING'],
                            items: [
                              {
                                label: 'Business settings',
                                role: ['ROLE_ADMIN', 'ROLE_BO-BUSINESS-SETTING'],
                                to: '/details'
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
                              {
                                label: 'Reporting shifts ',
                                role: ['ROLE_ADMIN'],
                                to: '/reporting-shifts'
                              },
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
                                label: 'Discounts',
                                role: ['ROLE_ADMIN'],
                                to: '/discount'
                              },
                              {
                                label: 'Account profiles',
                                role: ['ROLE_ADMIN'],
                                to: '/account-profiles'
                              },
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
                              {
                                label: 'Accounting Groups ',
                                role: ['ROLE_ADMIN'],
                                to: '/accounting-groups'
                              },
                              {
                                label: 'Payment methods ',
                                role: ['ROLE_ADMIN'],
                                to: '/payment-methods'
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
                                label: 'Voids ',
                                role: ['ROLE_ADMIN'],
                                to: '/void-reasons'
                              },
                              {
                                label: 'Instructions',
                                to: '/instructions'
                              },
                              {
                                label: 'Reporting automations',
                                role: ['ROLE_ADMIN'],
                                to: '/reporting-automations'
                              },
                              {
                                label: 'Theme',
                                role: ['ROLE_ADMIN'],
                                to: '/theme'
                              },
                              {
                                label: 'Item languages',
                                role: ['ROLE_ADMIN'],
                                to: '/items-languages'
                              },
                            ]
                          },


    ];

  // eslint-disable-next-line react/react-in-jsx-scope
    return <AppSubMenu model={model} />;
};

export default AppMenu;
