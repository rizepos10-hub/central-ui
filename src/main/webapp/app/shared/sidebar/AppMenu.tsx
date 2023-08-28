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
                                icon: 'pi pi-calendar',
                                to: '/user'
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
                        ]
                      },



    ];

  // eslint-disable-next-line react/react-in-jsx-scope
    return <AppSubMenu model={model} />;
};

export default AppMenu;
