import AppSubMenu from './AppSubMenu';
import React from "react";

const AppMenu = () => {

    const model: any = [
                      {
                        label: 'Control Panel',
                        icon: 'pi pi-home',
                        items: [
                          {
                            label:'Dashboard',
                            icon: 'pi pi-home',
                            to: '/'
                          },
                          {
                            label: 'Users',
                            role: ['ROLE_ADMIN'],
                            icon: 'pi pi-shopping-cart',
                            items: [
                              {
                                label: 'Backoffice users',
                                icon: 'pi pi-user',
                                to: '/back-office-user'
                              },
                              {
                                label: 'Pos users',
                                icon: 'pi pi-user',
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
                                icon: 'pi pi-folder-open',
                                items: [
                                  {
                                    label: 'Category',
                                    icon: 'pi pi-folder-open',
                                    to: '/category/restaurant-items'
                                  },
                                  {
                                    label: 'Regular',
                                    icon: 'pi pi-folder-open',
                                    to: 'restaurant/regular'
                                  },
                                  {
                                    label: 'Combo',
                                    icon: 'pi pi-folder-open',
                                    to: 'restaurant/combo'
                                  },
                                  {
                                    label: 'Pizza',
                                    icon: 'pi pi-folder-open',
                                    to: 'restaurant/pizza'
                                  },
                                  {
                                    label: 'Addons',
                                    icon: 'pi pi-plus-circle',
                                    to: '/addon'
                                  },

                                  {
                                    label: 'Addon Groups',
                                    icon: 'pi pi-plus-circle',
                                    to: '/addon-groups'
                                  },
                                ]
                              },
                              {
                                label: 'Retail',
                                icon: 'pi pi-folder-open',
                                items: [
                                  {
                                    label: 'Category',
                                    icon: 'pi pi-folder-open',
                                    to: '/category/retail-items'
                                  },
                                  {
                                    label: 'Simple',
                                    icon: 'pi pi-folder-open',
                                    to: 'retail/simple'
                                  },
                                  {
                                    label: 'Variable',
                                    icon: 'pi pi-folder-open',
                                    to: 'retail/variable'
                                  },
                                  {
                                    label: 'Grouped',
                                    icon: 'pi pi-folder-open',
                                    to: 'retail/grouped'
                                  },
                                  {
                                    label: 'Attributes',
                                    icon: 'pi pi-folder-open',
                                    to: 'retail/attributes'
                                  },
                                ]
                              },


                            ]
                          },
                          {
                            label: 'Menus',
                            role: ['ROLE_ADMIN'],
                            icon: 'pi pi-bars',
                            items: [
                              {
                                label: 'Category',
                                icon: 'pi pi-folder',
                                to: '/category/menus'
                              },
                              {
                                label: 'Pos List',
                                icon: 'pi pi-list',
                                to: '/menu?type=POS'
                              },
                              {
                                label: 'Online List',
                                icon: 'pi pi-list',
                                to: '/menu?type=ONLINE_ORDERING'
                              },

                            ]
                          },

                          {
                            label: 'Orders',
                            role: ['ROLE_ADMIN'],
                            icon: 'pi pi-shopping-cart',
                            items: [
                              {
                                label: 'Today',
                                icon: 'pi pi-calendar',
                                to: '/order/today'
                              },
                              {
                                label: 'History',
                                icon: 'pi pi-clock',
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
                                icon: 'pi pi-star',
                                to: '/analytics/topItems'
                              },
                              {
                                label: 'End Of Day',
                                icon: 'pi pi-moon',
                                to: '/analytics/endofday'
                              },
                              {
                                label: 'Sales Report',
                                icon: 'pi pi-star',
                                to: '/analytics/sales'
                              },
                              {
                                label: 'Report',
                                icon: 'pi pi-file-pdf',
                                to: '/analytics/reports'
                              },
                            ]
                          },
                          {
                            label: 'Customers',
                            role: ['ROLE_ADMIN'],
                            icon: ' pi pi-users',
                            to: '/customer'
                          },
                          {
                            label: 'Loyalty',
                            role: ['ROLE_ADMIN'],
                            icon: ' pi pi-dollar',
                            to: 'customer/loyalty'
                          },
                          {
                            label: 'Stock',
                            role: ['ROLE_ADMIN'],
                            icon: ' pi pi-th-large',
                            to: '/stock'
                          },
                          {
                            label: 'Inventory',
                            role: ['ROLE_ADMIN'],
                            icon: 'pi pi-box',
                            to: '/inventory'
                          },
                          {
                            label: 'Instructions',
                            icon: ' pi pi-th-large',
                            to: '/instructions'
                          },
                          {
                            label: 'Settings',
                            icon: 'pi pi-book',
                            role: ['ROLE_ADMIN', 'ROLE_BO-BUSINESS-SETTING'],
                            items: [
                              {
                                label: 'Business settings',
                                icon: ' pi pi-th-large',
                                role: ['ROLE_ADMIN', 'ROLE_BO-BUSINESS-SETTING'],
                                to: '/details'
                              },
                              {
                                label: 'Pizza Settings',
                                icon: 'pi pi-folder-open',
                                items: [
                                  {
                                    label: 'Sizes',
                                    icon: 'pi pi-folder-open',
                                    to: '/pizza-size'
                                  },
                                  {
                                    label: 'Crust Settings',
                                    icon: 'pi pi-folder-open',
                                    to: '/pizza-crust'
                                  },
                                  {
                                    label: 'Toppings',
                                    icon: 'pi pi-folder-open',
                                    to: '/pizza-topping'
                                  },
                                  {
                                    label: 'Topping Groups',
                                    icon: 'pi pi-folder-open',
                                    to: '/pizza-topping-group'
                                  },
                                  {
                                    label: 'Pricing Class',
                                    icon: 'pi pi-folder-open',
                                    to: '/pizza-pricing-class?type=CRUST_TYPE'
                                  },
                                  {
                                    label: 'Predefined Pizza',
                                    icon: 'pi pi-folder-open',
                                    to: '/predefined-pizza'
                                  },

                                ]
                              },
                              {
                                label: 'Reporting shifts ',
                                icon: 'pi pi-folder-open',
                                role: ['ROLE_ADMIN'],
                                to: '/reporting-shifts'
                              },
                              {
                                label: 'Printers',
                                role: ['ROLE_ADMIN'],
                                icon: 'pi pi-plus-circle',
                                to: '/printer'
                              },
                              {
                                label: 'Printing Profiles',
                                role: ['ROLE_ADMIN'],
                                icon: 'pi pi-plus-circle',
                                to: '/printing-profiles'
                              },
                              {
                                label: 'Production Centers',
                                role: ['ROLE_ADMIN'],
                                icon: 'pi pi-plus-circle',
                                to: '/production-center'
                              },
                              {
                                label: 'Currencies',
                                role: ['ROLE_ADMIN'],
                                icon: 'pi pi-plus-circle',
                                to: '/currencies'
                              },
                              {
                                label: 'Discounts',
                                role: ['ROLE_ADMIN'],
                                icon: 'pi pi-percentage',
                                to: '/discount'
                              },
                              {
                                label: 'Account profiles',
                                role: ['ROLE_ADMIN'],
                                icon: ' pi pi-th-large',
                                to: '/account-profiles'
                              },
                              {
                                label: 'Taxes',
                                role: ['ROLE_ADMIN'],
                                icon: ' pi pi-th-large',
                                to: '/tax'
                              },
                              {
                                label: 'Tax profiles ',
                                role: ['ROLE_ADMIN'],
                                icon: 'pi pi-folder-open',
                                to: '/tax-profiles'
                              },
                              {
                                label: 'Accounting Groups ',
                                role: ['ROLE_ADMIN'],
                                icon: 'pi pi-folder-open',
                                to: '/accounting-groups'
                              },
                              {
                                label: 'Payment methods ',
                                role: ['ROLE_ADMIN'],
                                icon: 'pi pi-folder-open',
                                to: '/payment-methods'
                              },
                              {
                                label: 'Floor plans',
                                role: ['ROLE_ADMIN'],
                                icon: 'pi pi-plus-circle',
                                items: [
                                  {
                                    label: 'List',
                                    icon: 'pi pi-star',
                                    to: '/floor-plan'
                                  },
                                  {
                                    label: 'Tables',
                                    icon: 'pi pi-moon',
                                    to: '/floor-plan/table'
                                  },
                                  {
                                    label: 'Settings',
                                    icon: 'pi pi-moon',
                                    to: '/floor-plan/settings'
                                  },
                                ]
                              },
                              {
                                label: 'Transfer Operations',
                                role: ['ROLE_ADMIN'],
                                icon: 'pi pi-percentage',
                                to: '/transfer-operations'
                              },
                              {
                                label: 'Web extensions',
                                role: ['ROLE_ADMIN'],
                                icon: 'pi pi-percentage',
                                to: '/web-extensions'
                              },

                              {
                                label: 'Voids ',
                                role: ['ROLE_ADMIN'],
                                icon: 'pi pi-folder-open',
                                to: '/void-reasons'
                              },
                              {
                                label: 'Reporting automations',
                                role: ['ROLE_ADMIN'],
                                icon: 'pi pi-plus-circle',
                                to: '/reporting-automations'
                              },
                              {
                                label: 'Item languages',
                                role: ['ROLE_ADMIN'],
                                icon: 'pi pi-percentage',
                                to: '/items-languages'
                              },
                            ]
                          },
                        ]
                      },


    ];

  // eslint-disable-next-line react/react-in-jsx-scope
    return <AppSubMenu model={model} />;
};

export default AppMenu;
