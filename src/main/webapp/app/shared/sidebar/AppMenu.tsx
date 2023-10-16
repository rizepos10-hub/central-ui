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
                                label: 'Category',
                                icon: 'pi pi-folder-open',
                                to: '/term/items'
                              },
                              {
                                label: 'Items',
                                icon: ' pi pi-th-large',
                                to: '/item'
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
                            label: 'Menus',
                            role: ['ROLE_ADMIN'],
                            icon: 'pi pi-bars',
                            items: [
                              {
                                label: 'Category',
                                icon: 'pi pi-folder',
                                to: '/term/menus'
                              },
                              {
                                label: 'List',
                                icon: 'pi pi-list',
                                to: '/menu'
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
                            label: 'Inventory',
                            role: ['ROLE_ADMIN'],
                            icon: 'pi pi-box',
                            to: '/inventory'
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
                                to: '/floor-plans'
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
                                label: 'Stock',
                                role: ['ROLE_ADMIN'],
                                icon: ' pi pi-th-large',
                                to: '/stock'
                              },
                              {
                                label: 'Voids ',
                                role: ['ROLE_ADMIN'],
                                icon: 'pi pi-folder-open',
                                to: '/void-reasons'
                              },
                              {
                                label: 'Instructions',
                                icon: ' pi pi-th-large',
                                to: '/instructions'
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
