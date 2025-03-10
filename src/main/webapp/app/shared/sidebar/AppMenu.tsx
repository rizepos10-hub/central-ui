import AppSubMenu from './AppSubMenu';
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
    role: ['ROLE_ADMINISTRATOR'],
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
        role: ['ROLE_ADMINISTRATOR', 'ROLE_BO-BUSINESS-SETTING'],
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
        to: '/order/create',
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
    role: ['ROLE_ADMINISTRATOR'],
    icon: 'pi pi-book',
    to: '/category/restaurant-items',
    items: [
      {
        label: 'Categories',
        to: '/category/restaurant-items',
        type: [BusinessTypeEnum.RESTAURANT],
      },
      {
        label: 'Categories Tree',
        to: '/category/restaurant-items/tree',
        type: [BusinessTypeEnum.RESTAURANT],
      },
      {
        label: 'Products',
        to: '/restaurant/regular',
        items: [
          {
            label: 'Regular',
            to: '/restaurant/regular',
            type: [BusinessTypeEnum.RESTAURANT],
          },
          {
            label: 'Combo',
            to: '/restaurant/combo',
            type: [BusinessTypeEnum.RESTAURANT],
          },
          {
            label: 'Pizza',
            to: '/restaurant/pizza',
            type: [BusinessTypeEnum.RESTAURANT],
          },
        ],
        type: [BusinessTypeEnum.RESTAURANT],
      },
      {
        label: 'Pizza Settings',
        to: '/pizza-size',
        items: [
          {
            label: 'Sizes',
            to: '/pizza-size',
            type: [BusinessTypeEnum.RESTAURANT],
          },
          {
            label: 'Crust Settings',
            to: '/pizza-crust',
            type: [BusinessTypeEnum.RESTAURANT],
          },
          {
            label: 'Toppings',
            to: '/pizza-topping',
            type: [BusinessTypeEnum.RESTAURANT],
          },
          {
            label: 'Topping Groups',
            to: '/pizza-topping-group',
            type: [BusinessTypeEnum.RESTAURANT],
          },
          {
            label: 'Pricing Class',
            to: '/pizza-pricing-class?type=CRUST_TYPE',
            type: [BusinessTypeEnum.RESTAURANT],
          },
          {
            label: 'Predefined Pizza',
            to: '/predefined-pizza',
            type: [BusinessTypeEnum.RESTAURANT],
          },
          {
            label: 'Pizza Settings',
            to: '/base-pizza',
            type: [BusinessTypeEnum.RESTAURANT],
          },
        ],
        type: [BusinessTypeEnum.RESTAURANT],
      },
      {
        label: 'Addon Groups',
        to: '/addon-groups',
        type: [BusinessTypeEnum.RESTAURANT],
      },
      {
        label: 'Addons',
        to: '/addon',
        type: [BusinessTypeEnum.RESTAURANT],
      },
    ],
    type: [BusinessTypeEnum.RESTAURANT],
  },
  {
    label: 'Retail Catalog',
    icon: 'pi pi-tags',
    role: ['ROLE_ADMINISTRATOR'],
    to: '/category/retail-items',
    items: [
      {
        label: 'Categories',
        to: '/category/retail-items',
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Products',
        to: '/product',
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Barcodes',
        to: '/barcodes',
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Attributes',
        to: '/retail/attributes',
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Mix & Match',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/mix-and-match-rule',
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Suppliers',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/supplier',
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Brands',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/brand',
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
      {
        label: 'To Be Stocked',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN'],
        to: '/inventory/to-be-stocked',
        type: [BusinessTypeEnum.RETAIL],
      },
    ],
    type: [BusinessTypeEnum.RETAIL],
  },
  {
    label: 'Customers',
    role: ['ROLE_ADMINISTRATOR'],
    icon: ' pi pi-users',
    to: '/customer',
    items: [
      {
        label: 'Customers',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/customer',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
    ],
    type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
  },
  {
    label: 'Orders',
    role: ['ROLE_ADMINISTRATOR'],
    icon: 'pi pi-dollar',
    to: '/order/today',
    items: [
      {
        label: 'Today',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/order/today',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'History',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/order',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Scheduled',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/order/scheduled',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Create',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/order/create',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
    ],
    type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
  },
  {
    label: 'Loyalty',
    role: ['ROLE_ADMINISTRATOR'],
    icon: 'pi pi-wallet',
    to: '/loyalty-cards',
    items: [
      {
        label: 'Loyalty Cards',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/loyalty-cards',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Loyalty Points',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/loyalty',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Gift Cards Catalog',
        role: ['ROLE_ADMINISTRATOR'],
        icon: '',
        to: '/gift-cards',
        items: [
          {
            label: 'Gift Cards',
            to: '/gift-cards',
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
    role: ['ROLE_ADMINISTRATOR'],
    icon: ' pi pi-chart-bar',
    to: '/analytics/sales',
    items: [
      {
        label: 'Retail Dashboard',
        to: '/analytics/retail-dashboard',
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Sales Reports',
        to: '/analytics/sales',
        items: [
          {
            label: 'General Report',
            to: '/analytics/sales',
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
          {
            label: 'Sales by Product',
            to: '/analytics/sales-report/sales-by-product',
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
          {
            label: 'Sales by Category',
            to: '/analytics/sales-report/sales-by-category',
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
          {
            label: 'Sales by Branch',
            to: '/analytics/sales-report/sales-by-branch',
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
          {
            label: 'Sales by User',
            to: '/analytics/sales-report/sales-by-user',
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
        ],
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Register Closures',
        to: '/analytics/register-closure',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Shift Report',
        to: '/analytics/shift-report',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Employee Hours',
        to: '/analytics/employee-hours-report',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Top Items',
        to: '/analytics/topItems',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'End Of Day',
        to: '/analytics/endofday',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Report',
        to: '/analytics/reports',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
    ],
    type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
  },
  {
    label: 'Online Ordering',
    role: ['ROLE_ADMINISTRATOR'],
    icon: 'pi pi-tablet',
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
        label: 'UI Settings',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/online-ordering/settings',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Pick A Layout',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/online-ordering/pick-a-layout',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
    ],
    type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
  },
  {
    label: 'Accounting',
    icon: 'pi pi-money-bill',
    to: '/accounting',
    type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
  },
  {
    label: 'Settings',
    icon: 'pi pi-cog',
    role: ['ROLE_ADMINISTRATOR', 'ROLE_BO-BUSINESS-SETTING'],
    to: '/details',
    items: [
      {
        label: 'Business Information',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_BO-BUSINESS-SETTING'],
        to: '/details',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Branches',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/branches',
        items: [
          {
            label: 'Branches',
            role: ['ROLE_ADMINISTRATOR'],
            to: '/branches',
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
          {
            label: 'Zones Settings',
            role: ['ROLE_ADMINISTRATOR'],
            to: '/zones',
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
        ],
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Service Charge',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/service-charge',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Discounts',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/discount',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Voids',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/void-reasons',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Pricing Points',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/pricing-point',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Custom Definitions',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/custom-definitions',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Taxes',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/tax',
        items: [
          {
            label: 'Taxes',
            role: ['ROLE_ADMINISTRATOR'],
            to: '/tax',
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
          {
            label: 'Tax profiles ',
            role: ['ROLE_ADMINISTRATOR'],
            to: '/tax-profiles',
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
          {
            label: 'Profile Groups ',
            role: ['ROLE_ADMINISTRATOR'],
            to: '/profile-groups',
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
        ],
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Units of Measures',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/item-measure',
        type: [BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Restaurant',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/course-definition',
        items: [
          {
            label: 'Course Definitions',
            role: ['ROLE_ADMINISTRATOR'],
            to: '/course-definition',
            type: [BusinessTypeEnum.RESTAURANT],
          },
          {
            label: 'Floor plans',
            role: ['ROLE_ADMINISTRATOR'],
            to: '/floor-plan',
            items: [
              {
                label: 'List',
                to: '/floor-plan',
                type: [BusinessTypeEnum.RESTAURANT],
              },
              {
                label: 'Tables',
                to: '/floor-plan/table',
                type: [BusinessTypeEnum.RESTAURANT],
              },
              {
                label: 'Settings',
                to: '/floor-plan/settings',
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
        role: ['ROLE_ADMINISTRATOR'],
        to: '/theme',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Localization Settings',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/currencies',
        items: [
          {
            label: 'Currencies',
            role: ['ROLE_ADMINISTRATOR'],
            to: '/currencies',
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
        ],
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Instructions',
        to: '/instructions',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Printers',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/printer',
        items: [
          {
            label: 'Printers',
            role: ['ROLE_ADMINISTRATOR'],
            to: '/printer',
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
          {
            label: 'Printing Profiles',
            role: ['ROLE_ADMINISTRATOR'],
            to: '/printing-profiles',
            type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
          },
        ],
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Production Centers',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/production-center',
        type: [BusinessTypeEnum.RESTAURANT, BusinessTypeEnum.RETAIL],
      },
      {
        label: 'Data Management Tools',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/import-from-old-system',
        items: [
          {
            label: 'Import From Old System',
            role: ['ROLE_ADMINISTRATOR'],
            to: '/import-from-old-system',
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
  return <AppSubMenu model={model} businessTypes={businessTypes} />;
};

export default AppMenu;
