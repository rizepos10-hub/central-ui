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
                            icon: 'pi pi-th-large',
                            to: '/branch?page=1&sort=id,asc'
                          },
                          {
                            label: 'Orders',
                            icon: 'pi pi-fw pi-envelope',
                            items: [
                              {
                                label: 'Today',
                                icon: 'pi pi-fw pi-inbox',
                                to: '/order/today'
                              },
                              {
                                label: 'History',
                                icon: 'pi pi-fw pi-pencil',
                                to: '/order?page=1&sort=id,asc'
                              }
                            ]
                          },
                          {
                            label: 'Menus',
                            icon: 'pi pi-fw pi-star-fill',
                            items: [
                              {
                                label: 'List',
                                icon: 'pi pi-fw pi-id-card',
                                to: '/menu?page=1&sort=id,asc'
                              },
                              {
                                label: 'Category',
                                icon: 'pi pi-fw pi-check-square',
                                to: '/term/menus?page=1&sort=id,asc'
                              },

                            ]
                          },

                          {
                            label: 'Catalogue',
                            icon: 'pi pi-fw pi-compass',
                            items: [
                              {
                                label: 'Items',
                                icon: 'pi pi-fw pi-prime',
                                to: '/item?page=1&sort=id,asc'
                              },
                              {
                                label: 'Category',
                                icon: 'pi pi-fw pi-palette',
                                to: '/term/items?page=1&sort=id,asc'
                              },
                              {
                                label: 'Addons',
                                icon: 'pi pi-fw pi-desktop',
                                to: '/addon?page=1&sort=id,asc'
                              },
                            ]
                          },
                          {
                            label: 'Inventory',
                            icon: 'pi pi-home',
                            to: '/'
                          },
                          {
                            label: 'Analytics',
                            icon: 'pi pi-fw pi-compass',
                            items: [
                              {
                                label: 'Top Items',
                                icon: 'pi pi-fw pi-prime',
                                to: '/analytics/topItems'
                              },
                              {
                                label: 'End Of Day',
                                icon: 'pi pi-fw pi-palette',
                                to: '/term/items?page=1&sort=id,asc'
                              },
                              {
                                label: 'Report',
                                icon: 'pi pi-fw pi-desktop',
                                to: '/analytics/reports'
                              },
                            ]
                          },
                          {
                            label: 'Customers',
                            icon: 'pi pi-home',
                            to: '/customer'
                          },
                        ]
                      },



    ];

  // eslint-disable-next-line react/react-in-jsx-scope
    return <AppSubMenu model={model} />;
};

export default AppMenu;
