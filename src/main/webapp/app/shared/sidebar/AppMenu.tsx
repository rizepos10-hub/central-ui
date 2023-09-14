import AppSubMenu from './AppSubMenu';
import React from "react";

const AppMenu = () => {
    const model: any = [
                      {
                        label: 'Dashboards',
                        icon: 'pi pi-home',
                        items: [
                          {
                            label:'Dashboard',
                            icon: 'pi pi-home',
                            to: '/'
                          },
                          {
                            label: 'Users',
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
                            label: 'Branches',
                            icon: 'pi pi-share-alt',
                            to: '/branch'
                          },
                          {
                            label: 'Orders',
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
                            label: 'Menus',
                            icon: 'pi pi-bars',
                            items: [
                              {
                                label: 'List',
                                icon: 'pi pi-list',
                                to: '/menu'
                              },
                              {
                                label: 'Category',
                                icon: 'pi pi-folder',
                                to: '/term/menus'
                              },

                            ]
                          },

                          {
                            label: 'Catalogue',
                            icon: 'pi pi-book',
                            items: [
                              {
                                label: 'Items',
                                icon: ' pi pi-th-large',
                                to: '/item'
                              },
                              {
                                label: 'Category',
                                icon: 'pi pi-folder-open',
                                to: '/term/items'
                              },
                              {
                                label: 'Addons',
                                icon: 'pi pi-plus-circle',
                                to: '/addon'
                              },
                              {
                                label: 'Discounts',
                                icon: 'pi pi-percentage',
                                to: '/discount'
                              },
                            ]
                          },
                          {
                            label: 'Inventory',
                            icon: 'pi pi-box',
                            to: '/'
                          },
                          {
                            label: 'Analytics',
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
                            icon: ' pi pi-users',
                            to: '/customer'
                          },
                          {
                            label: 'Settings',
                            icon: 'pi pi-book',
                            items: [
                              {
                                label: 'Business settings',
                                icon: ' pi pi-th-large',
                                to: '/settings'
                              },
                              {
                                label: 'Reporting shifts ',
                                icon: 'pi pi-folder-open',
                                to: '/reporting-shifts'
                              },
                              {
                                label: 'Currencies',
                                icon: 'pi pi-plus-circle',
                                to: '/currencies'
                              },
                              {
                                label: 'Discounts',
                                icon: 'pi pi-percentage',
                                to: '/discount'
                              },
                              {
                                label: 'Account profiles',
                                icon: ' pi pi-th-large',
                                to: '/account-profiles'
                              },
                              {
                                label: 'Taxes',
                                icon: ' pi pi-th-large',
                                to: '/tax'
                              },
                              {
                                label: 'Tax profiles ',
                                icon: 'pi pi-folder-open',
                                to: '/tax-profiles'
                              },
                              {
                                label: 'Accounting Groups ',
                                icon: 'pi pi-folder-open',
                                to: '/accounting-groups'
                              },
                              {
                                label: 'Payment methods ',
                                icon: 'pi pi-folder-open',
                                to: '/payment-methods'
                              },
                              {
                                label: 'Floor plans',
                                icon: 'pi pi-plus-circle',
                                to: '/floor-plans'
                              },
                              {
                                label: 'Transfer Operations',
                                icon: 'pi pi-percentage',
                                to: '/transfer-operations'
                              },
                              {
                                label: 'Web extensions',
                                icon: 'pi pi-percentage',
                                to: '/web-extensions'
                              },
                              {
                                label: 'Stock',
                                icon: ' pi pi-th-large',
                                to: '/stock'
                              },
                              {
                                label: 'Voids ',
                                icon: 'pi pi-folder-open',
                                to: '/voids'
                              },
                              {
                                label: 'Reporting automations',
                                icon: 'pi pi-plus-circle',
                                to: '/reporting-automations'
                              },
                              {
                                label: 'Item languages',
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
