import AppSubMenu from './AppSubMenu';
import AppSidebarNew from './AppSidebarNew';
import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBusinessTypes } from 'app/entities/settings/business-type/business-type.reducer';
import { BusinessType, BusinessTypeEnum } from '../model/business-type';

export type MenuItem = {
  label: string;
  to: string;
  role?: string[];
  icon?: string;
  items?: MenuItem[];
  type: BusinessTypeEnum[];
};


export const model: MenuItem[] = [
  {
    label: 'Control Panel',
    icon: 'pi pi-home',
    role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_ONLINE_ORDERING_USER'],
    to: '/',
    items: [
      {
        label: 'Dashboard',
        to: '/',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
    ],
    type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
  },
  {
    label: 'POS',
    role: ['ROLE_ADMINISTRATOR'],
    icon: 'pi pi-desktop',
    to: '/menu?type=POS',
    items: [
      {
        label: 'Menus',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/menu?type=POS',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Branch Register',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/branch-register',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'General Report',
        to: '/analytics/sales',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Sell',
        to: '/order/choose-branch',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'End of Day',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/end-of-day',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Payout Types',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/payout-type',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Cash Payments',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/cash-payment',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
    ],
    type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
  },
  {
    label: 'Users',
    role: ['ROLE_ADMINISTRATOR'],
    icon: 'pi pi-user',
    to: '/back-office-user',
    items: [
      {
        label: 'Back End',
        to: '/back-office-user',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'POS',
        to: '/branch-pos-user',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'POS Authority Groups',
        to: '/pos-authority-group',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Salesmen',
        to: '/salesmen-user',
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Bookkeeper',
        to: '/bookkeeper-user',
        type: [BusinessTypeEnum.RETAIL],
      },
    ],
    type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
  },
  {
    label: 'Tags',
    role: ['ROLE_ADMINISTRATOR'],
    icon: 'pi pi-ticket',
    to: '/tag',
    items: [
      {
        label: 'Tags',
        to: '/tag',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Tag Groups',
        to: '/tag-group',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
    ],
    type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
  },
  {
    label: 'Restaurant Catalog',
    role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
    icon: 'pi pi-utensils',
    to: '/category/restaurant-items/tree',
    items: [
      // {
      //   label: 'Categories',
      //   to: '/category/restaurant-items',
      //   type: [BusinessTypeEnum.RESTAURANT],
      // },
      {
        label: 'Categories',
        to: '/category/restaurant-items/tree',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        type: [BusinessTypeEnum.RESTAURANT],
      },
      {
        label: 'Products',
        to: '/restaurant/regular',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        items: [
          {
            label: 'Regular',
            to: '/restaurant/regular',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
            type: [BusinessTypeEnum.RESTAURANT],
          },
          {
            label: 'Combo',
            to: '/restaurant/combo',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
            type: [BusinessTypeEnum.RESTAURANT],
          },
          {
            label: 'Pizza',
            to: '/restaurant/pizza',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
            type: [BusinessTypeEnum.RESTAURANT],
          },
        ],
        type: [BusinessTypeEnum.RESTAURANT],
      },
      {
        label: 'Pizza Settings',
        to: '/pizza-size',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        items: [
          {
            label: 'Sizes',
            to: '/pizza-size',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
            type: [BusinessTypeEnum.RESTAURANT],
          },
          {
            label: 'Crust Settings',
            to: '/pizza-crust',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
            type: [BusinessTypeEnum.RESTAURANT],
          },
          {
            label: 'Toppings',
            to: '/pizza-topping',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
            type: [BusinessTypeEnum.RESTAURANT],
          },
          {
            label: 'Topping Groups',
            to: '/pizza-topping-group',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
            type: [BusinessTypeEnum.RESTAURANT],
          },
          {
            label: 'Pricing Class',
            to: '/pizza-pricing-class?type=CRUST_TYPE',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
            type: [BusinessTypeEnum.RESTAURANT],
          },
          {
            label: 'Predefined Pizza',
            to: '/predefined-pizza',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
            type: [BusinessTypeEnum.RESTAURANT],
          },
          {
            label: 'Pizza Settings',
            to: '/base-pizza',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
            type: [BusinessTypeEnum.RESTAURANT],
          },
        ],
        type: [BusinessTypeEnum.RESTAURANT],
      },
      {
        label: 'Addon Groups',
        to: '/addon-groups',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        type: [BusinessTypeEnum.RESTAURANT],
      },
      {
        label: 'Addons',
        to: '/addon',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        type: [BusinessTypeEnum.RESTAURANT],
      },
    ],
    type: [BusinessTypeEnum.RESTAURANT],
  },
  {
    label: 'Retail Catalog',
    icon: 'pi pi-tags',
    role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER', 'ROLE_ONLINE_ORDERING_ADMIN'],
    to: '/category/retail-items/tree',
    items: [
      // {
      //   label: 'Categories',
      //   to: '/category/retail-items',
      //   type: [BusinessTypeEnum.RETAIL],
      // },
      {
        label: 'Categories',
        to: '/category/retail-items/tree',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER', 'ROLE_ONLINE_ORDERING_ADMIN'],
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Products',
        to: '/product',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER', 'ROLE_ONLINE_ORDERING_ADMIN'],
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Labels',
        to: '/labels',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER', 'ROLE_ONLINE_ORDERING_ADMIN'],
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Barcodes',
        to: '/barcodes',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER', 'ROLE_ONLINE_ORDERING_ADMIN'],
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Attributes',
        to: '/retail/attributes',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER', 'ROLE_ONLINE_ORDERING_ADMIN'],
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Suppliers',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/supplier',
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Brands',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/brand',
        type: [BusinessTypeEnum.RETAIL],
      },
    ],
    type: [BusinessTypeEnum.RETAIL],
  },
  {
    label: 'Wholesale',
    icon: 'pi pi-truck',
    role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER', 'ROLE_WHOLESALE_SALESMAN'],
    to: '/logistics/wholesale-orders',
    items: [
      {
        label: 'Create Order',
        to: '/logistics/create-order',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER', 'ROLE_WHOLESALE_SALESMAN'],
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Processed Orders',
        to: '/logistics/wholesale-orders',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER', 'ROLE_WHOLESALE_SALESMAN'],
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Saved Orders',
        to: '/logistics/saved-orders',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER', 'ROLE_WHOLESALE_SALESMAN'],
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Routes',
        to: '/logistics/routes',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER', 'ROLE_WHOLESALE_SALESMAN'],
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Map',
        to: '/logistics/map',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER', 'ROLE_WHOLESALE_SALESMAN'],
        type: [BusinessTypeEnum.RETAIL],
      },
    ],
    type: [BusinessTypeEnum.RETAIL],
  },
  {
    label: 'Inventory',
    role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER'],
    icon: 'pi pi-box',
    to: '/inventory/warehouse',
    items: [
      {
        label: 'Warehouses',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER'],
        to: '/inventory/warehouse',
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Sales Locations',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER'],
        to: '/inventory/sales-location',
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Stock',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER'],
        to: '/inventory/stock',
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Purchase Orders',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER'],
        to: '/inventory/purchase-order',
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Settings',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER'],
        to: '/inventory/settings',
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Transfers',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER'],
        to: '/inventory/transfer-request',
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Returns',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN'],
        to: '/inventory/supplier-return',
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Suppliers',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN'],
        to: '/inventory/supplier',
        type: [BusinessTypeEnum.RETAIL],
      },
      // {
      //   label: 'To Be Stocked',
      //   role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN'],
      //   to: '/inventory/to-be-stocked',
      //   type: [BusinessTypeEnum.RETAIL],
      // },
    ],
    type: [BusinessTypeEnum.RETAIL],
  },
  {
    label: 'Customers',
    role: ['ROLE_ADMINISTRATOR', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER', 'ROLE_WHOLESALE_SALESMAN'],
    icon: 'pi pi-users',
    to: '/customer',
    items: [
      {
        label: 'Customers',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER', 'ROLE_WHOLESALE_SALESMAN'],
        to: '/customer',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
    ],
    type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
  },
  {
    label: 'Orders',
    role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER', 'ROLE_WHOLESALE_SALESMAN'],
    icon: 'pi pi-dollar',
    to: '/order/today',
    items: [
      {
        label: 'Today',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER', 'ROLE_WHOLESALE_SALESMAN'],
        to: '/order/today',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'History',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER', 'ROLE_WHOLESALE_SALESMAN'],
        to: '/order',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Scheduled',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER', 'ROLE_WHOLESALE_SALESMAN'],
        to: '/order/scheduled',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Ai Ordering',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER', 'ROLE_WHOLESALE_SALESMAN'],
        to: '/order/ai-ordering',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Saved',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER', 'ROLE_WHOLESALE_SALESMAN'],
        to: '/order/saved',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
    ],
    type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
  },
  {
    label: 'Loyalty',
    role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],

    icon: 'pi pi-wallet',
    to: '/loyalty-cards',
    items: [
      {
        label: 'Loyalty Cards',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],

        to: '/loyalty-cards',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Loyalty Points',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],

        to: '/loyalty',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Gift Cards Catalog',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],

        icon: '',
        to: '/gift-cards',
        items: [
          {
            label: 'Gift Cards',
            to: '/gift-cards',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          }
        ],
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
    ],
    type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
  },
  {
    label: 'Digital Signage',
    icon: 'pi pi-desktop',
    role: ['ROLE_ADMINISTRATOR'],
    to: '/tv',
    items: [
      {
        label: 'Tv Config',
        to: '/tv',
        items: [
          {
            label: 'Tvs',
            to: '/tv',
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
          {
            label: 'Tv Displays',
            to: '/tv-display',
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
        ],
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
    ],
    type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
  },
  {
    label: 'Reports',
    role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER'],
    icon: ' pi pi-chart-bar',
    to: '/analytics/sales',
    items: [
      {
        label: 'Retail Dashboard',
        to: '/analytics/retail-dashboard',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER'],
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Sales Reports',
        to: '/analytics/sales',
        items: [
          {
            label: 'General Report',
            to: '/analytics/sales',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER'],
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
          {
            label: 'Sales by Product',
            to: '/analytics/sales-report/sales-by-product',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER'],
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
          {
            label: 'Sales by Category',
            to: '/analytics/sales-report/sales-by-category',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER'],
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
          {
            label: 'Sales by Branch',
            to: '/analytics/sales-report/sales-by-branch',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER'],
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
          {
            label: 'Sales by User',
            to: '/analytics/sales-report/sales-by-user',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER'],
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
          {
            label: 'Sales by Menu',
            to: '/analytics/sales-report/sales-by-menu',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER'],
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
          {
            label: 'Sales by Catalog',
            to: '/analytics/sales-report/sales-by-catalog',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER'],
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
        ],
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Register Closures',
        to: '/analytics/register-closure',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER'],
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Shift Report',
        to: '/analytics/shift-report',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER'],
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Employee Hours',
        to: '/analytics/employee-hours-report',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER'],
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Top Items',
        to: '/analytics/topItems',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER'],
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'End Of Day',
        to: '/analytics/endofday',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER'],
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Report',
        to: '/analytics/reports',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER'],
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Inventory Reports',
        to: '/analytics/inventory-report',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER'],
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'On Hand Report',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER'],
        to: '/inventory/reports/on-hand',
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Customer Balance Report',
        to: '/analytics/customer-balance-report',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER'],
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'House Charges Report',
        to: '/analytics/house-charges-report',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER'],
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Commission Fees Report',
        to: '/analytics/commission-fees-report',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER'],
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Sales Activity Summary Report',
        to: '/analytics/sales-activity-summary-report',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER'],
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Optimized Product Sales Report',
        to: '/analytics/optimized-product-sales-report',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER'],
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Cashier By Terminal Report',
        to: '/analytics/cashier-by-terminal-report',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN', 'ROLE_WHOLESALE_ADMIN', 'ROLE_WHOLESALE_BOOKKEEPER'],
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
    ],
    type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
  },
  {
    label: 'Online Ordering',
    role: ['ROLE_ADMINISTRATOR'],
    icon: 'pi pi-monitor',
    to: '/menu?type=ONLINE_ORDERING',
    items: [
      {
        label: 'Menus',
        to: '/menu?type=ONLINE_ORDERING',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Users',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/online-ordering/user',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Sales',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/online-ordering/order',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Branding',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/online-ordering/branding',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Checkout & Ordering',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/online-ordering/checkout-ordering',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Branch SEO',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/online-ordering/branch-seo',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Content Pages',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/online-ordering/content-pages',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Localization',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/online-ordering/localization',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Landing Pages',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/online-ordering/pages',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'UI/UX',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/online-ordering/ui-ux',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Pick A Layout',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/online-ordering/pick-a-layout',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Storefront Settings',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/online-ordering/storefront-settings',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Scripts',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/online-ordering/scripts',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
    ],
    type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
  },
  // {
  //   label: 'Accounting',
  //   icon: 'pi pi-money-bill',
  //   to: '/accounting',
  //   type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
  // },
  {
    label: 'Settings',
    role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
    to: '/details',
    items: [
      {
        label: 'Business Information',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/details',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Branches',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/branches',
        items: [
          {
            label: 'Branches',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
            to: '/branches',
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
          {
            label: 'Zones Settings',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
            to: '/zones',
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
        ],
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Service Charge',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/service-charge',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Payment Method Settings',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/payment-method-setting',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'On Account Settings',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/on-account-settings',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      // {
      //   label: 'Tookan Delivery',
      //   role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
      //   to: '/tookan-settings',
      //   type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      // },
      {
        label: 'Kiosk Slides',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/kiosk-slides-settings',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Discounts',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/discount',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Voids',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/void-reasons',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Pricing Points',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/pricing-point',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Flyers',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/flyers',
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Custom Definitions',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/custom-definitions',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Taxes',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/tax',
        items: [
          {
            label: 'Taxes',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
            to: '/tax',
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
          {
            label: 'Tax profiles ',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
            to: '/tax-profiles',
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
          {
            label: 'Profile Groups ',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
            to: '/profile-groups',
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
        ],
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Units of Measures',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/item-measure',
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Mix & Match',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/mix-and-match-rule',
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Restaurant',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/course-definition',
        items: [
          {
            label: 'Course Definitions',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
            to: '/course-definition',
            type: [BusinessTypeEnum.RESTAURANT],
          },
          {
            label: 'Floor plans',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
            to: '/floor-plan',
            items: [
              {
                label: 'List',
                to: '/floor-plan',
                role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
                type: [BusinessTypeEnum.RESTAURANT],
              },
              {
                label: 'Tables',
                to: '/floor-plan/table',
                role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
                type: [BusinessTypeEnum.RESTAURANT],
              },
              {
                label: 'Settings',
                to: '/floor-plan/settings',
                role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
                type: [BusinessTypeEnum.RESTAURANT],
              },
            ],
            type: [BusinessTypeEnum.RESTAURANT],
          },
        ],
        type: [BusinessTypeEnum.RESTAURANT],
      },
      {
        label: 'Themes',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/theme',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Currencies',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/currencies',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Instructions',
        to: '/instructions',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Printers',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/printer',
        items: [
          {
            label: 'Printers',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
            to: '/printer',
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
          {
            label: 'Printing Profiles',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
            to: '/printing-profiles',
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
        ],
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Production Centers',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/production-center',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Data Management Tools',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
        to: '/import-from-old-system',
        items: [
          {
            label: 'Import From Old System',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
            to: '/import-from-old-system',
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
          {
            label: 'Catalog import (Excel)',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
            to: '/catalog-import',
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
          {
            label: 'Customer import (Excel)',
            role: ['ROLE_ADMINISTRATOR', 'ROLE_ONLINE_ORDERING_ADMIN'],
            to: '/customer-import',
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
        ],
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
    ],
    type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
  },
];

const AppMenu = () => {
  const dispatch = useAppDispatch();
  const businessTypes: BusinessType = useAppSelector(state => state.businessType.entities);
  useEffect(() => {
    dispatch(getBusinessTypes({}));
  }, []);

  // eslint-disable-next-line react/react-in-jsx-scope
  return <AppSidebarNew businessTypes={businessTypes} />;
};

export default AppMenu;
