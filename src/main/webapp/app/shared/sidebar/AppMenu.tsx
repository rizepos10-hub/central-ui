import AppSubMenu from './AppSubMenu';
import React from "react";

const AppMenu = () => {
    const model: any = [
                      {
                        label: 'Dashboards',
                        icon: 'pi pi-home',
                        items: [
                          {
                            label: 'Dashboard',
                            icon: 'pi pi-fw pi-home',
                            to: '/'
                          },
                          {
                            label: 'Branches',
                            icon: 'pi pi-share-alt',
                            to: '/branch?page=1&sort=id,asc'
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
                                to: '/order?page=1&sort=id,asc'
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
                                to: '/menu?page=1&sort=id,asc'
                              },
                              {
                                label: 'Category',
                                icon: 'pi pi-folder',
                                to: '/term/menus?page=1&sort=id,asc'
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
                                to: '/item?page=1&sort=id,asc'
                              },
                              {
                                label: 'Category',
                                icon: 'pi pi-folder-open',
                                to: '/term/items?page=1&sort=id,asc'
                              },
                              {
                                label: 'Addons',
                                icon: 'pi pi-plus-circle',
                                to: '/addon?page=1&sort=id,asc'
                              },
                              {
                                label: 'Discounts',
                                icon: 'pi pi-percentage',
                                to: '/discount?page=1&sort=id,asc'
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
