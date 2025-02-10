import AppSubMenu from './AppSubMenu';
import React from 'react';

export type MenuItem = {
  label: string;
  to: string;
  role?: string[];
  icon?: string;
  items?: MenuItem[];
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
      },
    ],
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
      },
      {
        label: 'Branch Register',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_BO-BUSINESS-SETTING'],
        to: '/branch-register',
      },
      // {
      //   label: 'Switch Register',
      //   to: '/switch-register',
      // },
      // {
      //   label: 'Close Sales',
      //   to: '/close-sales',
      // },
      {
        label: 'General Report',
        to: '/analytics/sales',
      },
      {
        label: 'Sell',
        to: '/order/create',
      },
    ],
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
      },
      {
        label: 'POS',
        to: '/branch-pos-user',
      },
      {
        label: 'POS Authority Groups',
        to: '/pos-authority-group',
      },
    ],
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
      },
      {
        label: 'Tag Groups',
        to: '/tag-group',
      },
    ],
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
      },
      {
        label: 'Categories Tree',
        to: '/category/restaurant-items/tree',
      },
      {
        label: 'Products',
        to: '/restaurant/regular',
        items: [
          {
            label: 'Regular',
            to: '/restaurant/regular',
          },
          {
            label: 'Combo',
            to: '/restaurant/combo',
          },
          {
            label: 'Pizza',
            to: '/restaurant/pizza',
          },
        ],
      },
      {
        label: 'Pizza Settings',
        to: '/pizza-size',
        items: [
          {
            label: 'Sizes',
            to: '/pizza-size',
          },
          {
            label: 'Crust Settings',
            to: '/pizza-crust',
          },
          {
            label: 'Toppings',
            to: '/pizza-topping',
          },
          {
            label: 'Topping Groups',
            to: '/pizza-topping-group',
          },
          {
            label: 'Pricing Class',
            to: '/pizza-pricing-class?type=CRUST_TYPE',
          },
          {
            label: 'Predefined Pizza',
            to: '/predefined-pizza',
          },
        ],
      },
      {
        label: 'Addon Groups',
        to: '/addon-groups',
      },
      {
        label: 'Addons',
        to: '/addon',
      },
    ],
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
      },
      {
        label: 'Products',
        to: '/product',
      },

      {
        label: 'Attributes',
        to: '/retail/attributes',
      },
      {
        label: 'Mix & Match',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/mix-and-match-rule',
      },
      {
        label: 'Suppliers',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/supplier',
      },
      {
        label: 'Brands',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/brand',
      },
    ],
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
      },
      {
        label: 'Sales Locations',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER'],
        to: '/inventory/sales-location',
      },
      {
        label: 'Stock',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER'],
        to: '/inventory/stock',
      },
      {
        label: 'Purchase Orders',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER'],
        to: '/inventory/purchase-order',
      },
      {
        label: 'Transfers',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN', 'ROLE_WAREHOUSE_MANAGER'],
        to: '/inventory/transfer-request',
      },
      {
        label: 'Returns',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN'],
        to: '/inventory/supplier-return',
      },
      // {
      //   label: 'Inventory Count',
      //   role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN'],
      //   to: '/inventory/due',
      //   items: [
      //     {
      //       label: 'Due',
      //       role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN'],
      //       to: '/inventory/due',
      //     },
      //     {
      //       label: 'Upcoming',
      //       role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN'],
      //       to: '/inventory/upcoming',
      //     },
      //     {
      //       label: 'Completed',
      //       role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN'],
      //       to: '/inventory/completed',
      //     },
      //     {
      //       label: 'Canceled',
      //       role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN'],
      //       to: '/inventory/canceled',
      //     },
      //   ],
      // },
      // {
      //   label: 'Fulfillments',
      //   role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN'],
      //   to: '/inventory/all',
      //   items: [
      //     {
      //       label: 'All',
      //       role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN'],
      //       to: '/inventory/all',
      //     },
      //     {
      //       label: 'Pack Orders',
      //       role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN'],
      //       to: '/inventory/pack-orders',
      //     },
      //     {
      //       label: 'Customer Pickup',
      //       role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN'],
      //       to: '/inventory/customer-pickup',
      //     },
      //     {
      //       label: 'Delivery',
      //       role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN'],
      //       to: '/inventory/delivery',
      //     },
      //   ],
      // },
      // {
      //   label: 'Serial Numbers',
      //   role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN'],
      //   to: '/inventory/serial-number',
      // },
      {
        label: 'Suppliers',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN'],
        to: '/inventory/supplier',
      },
      {
        label: 'To Be Stocked',
        role: ['ROLE_ADMINISTRATOR', 'ROLE_INVENTORY_ADMIN'],
        to: '/inventory/to-be-stocked',
      },
    ],
  },
  {
    label: 'Customers',
    role: ['ROLE_ADMINISTRATOR'],
    icon: ' pi pi-users',
    to: '/customer',
    items: [
      // {
      //   label: 'Groups',
      //   role: ['ROLE_ADMINISTRATOR'],
      //   to: '/customer/group',
      // },
      {
        label: 'Customers',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/customer',
      },
    ],
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
      },
      {
        label: 'History',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/order',
      },
      {
        label: 'Scheduled',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/order/scheduled',
      },
      {
        label: 'Create',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/order/create',
      },
    ],
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
      },
      {
        label: 'Loyalty Points',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/loyalty'
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
          }
        ],
      },
    ],
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
          },
          {
            label: 'Tv Displays',
            to: '/tv-display',
          },
        ],
      },
    ],
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
      },
      // {
      //   label: 'Restaurant Dashboard',
      //   to: '/analytics/restaurant-dashboard',
      // },
      {
        label: 'Sales Reports',
        to: '/analytics/sales',
        items: [
          {
            label: 'General Report',
            to: '/analytics/sales',
          },
          // {
          //   label: 'Individual Performance',
          //   to: '/analytics/sales-report/individual-performance',
          // },
          // {
          //   label: 'Sales by Hour',
          //   to: '/analytics/sales-report/summary',
          // },
          {
            label: 'Sales by Product',
            to: '/analytics/sales-report/sales-by-product',
          },
          {
            label: 'Sales by Category',
            to: '/analytics/sales-report/sales-by-category',
          },
          {
            label: 'Sales by Branch',
            to: '/analytics/sales-report/sales-by-branch',
          },
          {
            label: 'Sales by User',
            to: '/analytics/sales-report/sales-by-user',
          },
        ],
      },
      // {
      //   label: 'Inventory Reports',
      //   to: '/analytics/out-of-stock',
      //   items: [
      //     {
      //       label: 'Out of Stock',
      //       to: '/analytics/out-of-stock',
      //     },
      //     {
      //       label: 'Sell Through',
      //       to: '/analytics/sell-through',
      //     },
      //     {
      //       label: 'Dusty Inventory',
      //       to: '/analytics/dusty-inventory',
      //     },
      //     {
      //       label: 'Performance',
      //       to: '/analytics/performance',
      //     },
      //   ],
      // },
      // {
      //   label: 'Payment Reports',
      //   to: '/analytics/payment-report',
      // },
      {
        label: 'Register Closures',
        to: '/analytics/register-closure',
      },
      {
        label: 'Shift Report',
        to: '/analytics/shift-report',
      },
      {
        label: 'Employee Hours',
        to: '/analytics/employee-hours-report',
      },
      // {
      //   label: 'Shift Closures',
      //   to: '/analytics/shift-closure',
      // },
      // {
      //   label: 'Gift Cards',
      //   to: '/analytics/gift-card',
      // },
      // {
      //   label: 'Store Credits',
      //   to: '/analytics/store-credit',
      // },
      // {
      //   label: 'Tax Reports',
      //   to: '/analytics/tax-report',
      // },
      // {
      //   label: 'AI Reporting',
      //   to: '/analytics/ai-reporting',
      // },
      {
        label: 'Top Items',
        to: '/analytics/topItems',
      },
      {
        label: 'End Of Day',
        to: '/analytics/endofday',
      },
      {
        label: 'Report',
        to: '/analytics/reports',
      },
    ],
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
      },
      {
        label: 'Users',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/online-ordering/user',
      },
      {
        label: 'Sales',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/online-ordering/order',
      },
      {
        label: 'UI Settings',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/online-ordering/settings',
      },
      // {
      //   label: 'Layout Settings',
      //   role: ['ROLE_ADMINISTRATOR'],
      //   to: '/online-ordering/layout-settings',
      // },
      {
        label: 'Pick A Layout',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/online-ordering/pick-a-layout',
      },
    ],
  },
  {
    label: 'Accounting',
    icon: 'pi pi-money-bill',
    to: '/accounting',
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
      },
      // {
      //   label: 'Billing',
      //   role: ['ROLE_ADMINISTRATOR'],
      //   to: '/billing',
      // },
      {
        label: 'Branches',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/branches',
        items: [
          {
            label: 'Branches',
            role: ['ROLE_ADMINISTRATOR'],
            to: '/branches',
          },
          {
            label: 'Zones Settings',
            role: ['ROLE_ADMINISTRATOR'],
            to: '/zones',
          },
        ]
      },
      {
        label: 'Service Charge',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/service-charge',
      },
      // {
      //   label: 'Registers',
      //   role: ['ROLE_ADMINISTRATOR'],
      //   to: '/register',
      // },
      // {
      //   label: 'Payment Types',
      //   role: ['ROLE_ADMINISTRATOR'],
      //   to: '/payment-types',
      // },
      {
        label: 'Discounts',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/discount',
      },
      {
        label: 'Voids',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/void-reasons',
      },
      {
        label: 'Pricing Points',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/pricing-point',
      },
      {
        label: 'Custom Definitions',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/custom-definitions',
      },
      // {
      //   label: 'On Account',
      //   role: ['ROLE_ADMINISTRATOR'],
      //   to: '/on-account',
      // },
      {
        label: 'Taxes',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/tax',
        items: [
          {
            label: 'Taxes',
            role: ['ROLE_ADMINISTRATOR'],
            to: '/tax',
          },
          {
            label: 'Tax profiles ',
            role: ['ROLE_ADMINISTRATOR'],
            to: '/tax-profiles',
          },
          {
            label: 'Profile Groups ',
            role: ['ROLE_ADMINISTRATOR'],
            to: '/profile-groups',
          },
        ],
      },
      {
        label: 'Units of Measures',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/item-measure',
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
          },
          {
            label: 'Floor plans',
            role: ['ROLE_ADMINISTRATOR'],
            to: '/floor-plan',
            items: [
              {
                label: 'List',
                to: '/floor-plan',
              },
              {
                label: 'Tables',
                to: '/floor-plan/table',
              },
              {
                label: 'Settings',
                to: '/floor-plan/settings',
              },
            ],
          },
        ]
      },
      // {
      //   label: 'Floor plans',
      //   role: ['ROLE_ADMINISTRATOR'],
      //   to: '/floor-plan',
      //   items: [
      //     {
      //       label: 'List',
      //       to: '/floor-plan',
      //     },
      //     {
      //       label: 'Tables',
      //       to: '/floor-plan/table',
      //     },
      //     {
      //       label: 'Settings',
      //       to: '/floor-plan/settings',
      //     },
      //   ],
      // },
      {
        label: 'Themes',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/theme',
      },
      {
        label: 'Localization Settings',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/currencies',
        items: [
          // {
          //   label: 'Language',
          //   role: ['ROLE_ADMINISTRATOR'],
          //   to: '/language',
          // },
          {
            label: 'Currencies',
            role: ['ROLE_ADMINISTRATOR'],
            to: '/currencies',
          },

        ]
      },
      {
        label: 'Instructions',
        to: '/instructions',
      },

      // {
      //   label: 'Reporting shifts ',
      //   role: ['ROLE_ADMINISTRATOR'],
      //   to: '/reporting-shifts'
      // },

      {
        label: 'Printers',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/printer',
        items: [
          {
            label: 'Printers',
            role: ['ROLE_ADMINISTRATOR'],
            to: '/printer',
          },
          {
            label: 'Printing Profiles',
            role: ['ROLE_ADMINISTRATOR'],
            to: '/printing-profiles',
          },
        ]
      },
      {
        label: 'Production Centers',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/production-center',
      },
      // {
      //   label: 'Account profiles',
      //   role: ['ROLE_ADMINISTRATOR'],
      //   to: '/account-profiles',
      // },
      // {
      //   label: 'Payment methods ',
      //   role: ['ROLE_ADMINISTRATOR'],
      //   to: '/payment-methods',
      // },
      {
        label: 'Data Management Tools',
        role: ['ROLE_ADMINISTRATOR'],
        to: '/import-from-old-system',
        items: [
          // {
          //   label: 'Transfer Operations',
          //   role: ['ROLE_ADMINISTRATOR'],
          //   to: '/transfer-operations',
          // },
          // {
          //   label: 'Web extensions',
          //   role: ['ROLE_ADMINISTRATOR'],
          //   to: '/web-extensions',
          // },
          {
            label: 'Import From Old System',
            role: ['ROLE_ADMINISTRATOR'],
            to: '/import-from-old-system',
          },
          // {
          //   label: 'Reporting automations',
          //   role: ['ROLE_ADMINISTRATOR'],
          //   to: '/reporting-automations',
          // },
          // {
          //   label: 'App Integrations',
          //   role: ['ROLE_ADMINISTRATOR'],
          //   to: '/app-integration',
          // },
        ]
      },
    ],
  },
];

const AppMenu = () => {
  // eslint-disable-next-line react/react-in-jsx-scope
  return <AppSubMenu model={model} />;
};

export default AppMenu;
