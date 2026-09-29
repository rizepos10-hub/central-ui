import { WholesalePageKey } from '../wholesale-access';

export interface HelpTable {
  headers: string[];
  rows: string[][];
}

export interface HelpSection {
  heading: string;
  text?: string[];
  steps?: string[];
  bullets?: string[];
  table?: HelpTable;
}

export interface HelpTopic {
  id: string;
  title: string;
  group: string;
  summary: string;
  /** The page the topic describes; its roles decide whether the topic counts as "yours". */
  page?: WholesalePageKey;
  path?: string;
  /** Who uses it, in words, for topics without a web page (the mobile apps). */
  audience?: string;
  sections: HelpSection[];
}

export const HELP_GROUPS = [
  'Getting started',
  'Configuration',
  'Order Preparation',
  'Production',
  'Audits and Reconciliation',
  'Settings',
  'Other',
  'Mobile and kiosk apps',
  'Reference',
];

const ROLE_TABLE: HelpTable = {
  headers: ['Role', 'What they do in Wholesale'],
  rows: [
    ['Administrator / Wholesale Admin', 'Everything: setup, settings, users, ordering, operations and money. Only they change Wholesale Settings and create sales managers and drivers.'],
    ['Wholesale Sales Manager', 'Customers, routes, closures, ordering, order sheet approval, factory orders and shortages, delivery runs, Live Route and the Dashboard. No money pages except Stale Returns and Credit Memos.'],
    ['Wholesale Salesman', 'Call List, Order Entry, Customer Notes, Order Sheets and the order lists.'],
    ['Wholesale Bookkeeper', 'Money: Cash Handover, Reconciliation, Alerts, Customer Accounts, Invoices, issuing invoices, unlocking runs. Reads setup pages.'],
    ['Wholesale Factory', 'Factory Fulfillment (or the Factory Approval app), Production and Loading Lists for their own factories.'],
    ['Wholesale Driver', 'Only the Wholesale Driver app: delivers the runs assigned to them. No web pages.'],
  ],
};

export const HELP_TOPICS: HelpTopic[] = [
  // ---------------------------------------------------------------- getting started
  {
    id: 'overview',
    title: 'How Wholesale works',
    group: 'Getting started',
    summary: 'The path of a wholesale order from the call to the customer to the money in the bank.',
    sections: [
      {
        heading: 'The big picture',
        text: [
          'Wholesale customers are regular customers with a wholesale profile: a route, delivery days, a factory and payment terms. Each delivery day, salespeople take their orders, managers approve each route, the orders go to the factory as one factory order, the factory approves and bakes, drivers deliver and collect, and the office counts the money and follows up what is still owed.',
        ],
      },
      {
        heading: 'One delivery day, step by step',
        steps: [
          'Day before, morning: salespeople work the Call List and enter orders in Order Entry (or generate usual orders). Reminders go out at the times set in Settings.',
          'Before the cut-off: each route is submitted on Order Sheets and approved by a sales manager.',
          'At the cut-off (or when all routes are approved, or by hand, depending on the factory): the factory order is sent from Factory Orders.',
          'The factory answers in Factory Fulfillment or the Factory Approval app: it approves, or returns the order with shortages. If it is short, the office covers the shortages and sends a new version.',
          'Once approved, invoices are issued (depending on the Issue invoices setting) and the orders are released into one delivery run per route. The factory produces, loads the trucks with the Loading Lists and marks each route Ready and Dispatched.',
          'Delivery day: drivers deliver with the Wholesale Driver app, record quantities, stale returns, payment and proof, and submit the run at the end. Managers follow along on Delivery Runs and Live Route.',
          'After delivery: the bookkeeper counts each driver\u2019s cash and checks on Cash Handover, checks Reconciliation and Alerts, and follows up balances on Customer Accounts.',
        ],
      },
      {
        heading: 'Where to start',
        bullets: [
          'New setup: Factories, then Route Setup, then Wholesale Customers, then Wholesale Users and Wholesale Settings.',
          'Salespeople: Call List and Order Entry.',
          'Managers: Order Sheets, Factory Orders, Delivery Runs and the Dashboard.',
          'Bookkeepers: Cash Handover, Reconciliation, Alerts and Customer Accounts.',
        ],
      },
    ],
  },
  {
    id: 'roles',
    title: 'Roles and what each can see',
    group: 'Getting started',
    summary: 'Who can open which page. The menu only shows the pages your role can open.',
    sections: [
      { heading: 'Roles', table: ROLE_TABLE },
      {
        heading: 'Good to know',
        bullets: [
          'Some pages are read only for some roles, for example bookkeepers can read Route Setup and Wholesale Customers but not change them. The page says "Read only" when that is the case.',
          'Factory users only see the factories they are assigned to on Wholesale Users.',
          'Opening Wholesale takes admins, sales managers and bookkeepers to the Dashboard, factory users to Factory Fulfillment and everyone else to Processed Orders.',
          'Roles are given on Wholesale Users (sales managers, factory users, drivers) or in the company user settings.',
        ],
      },
    ],
  },
  {
    id: 'daily-checklists',
    title: 'Daily checklists by role',
    group: 'Getting started',
    summary: 'A short list of what each role does on a normal day.',
    sections: [
      {
        heading: 'Salesperson',
        steps: [
          'Open Call List for tomorrow and call everyone marked To call.',
          'Take each order with Take order (it opens Order Entry for that customer) and log the call.',
          'Submit your routes on Order Sheets before the cut-off.',
        ],
      },
      {
        heading: 'Sales manager',
        steps: [
          'Check the Dashboard.',
          'Approve submitted routes on Order Sheets; reopen with a reason if something is wrong.',
          'Send factory orders from Factory Orders if the factory sends by hand, and cover shortages when a factory returns an order.',
          'On delivery day, watch Delivery Runs and Live Route; change a driver if needed.',
        ],
      },
      {
        heading: 'Factory',
        steps: [
          'Answer new orders in Factory Fulfillment or the Factory Approval app: approve, or return with shortages.',
          'Start production, then print Production and Loading Lists.',
          'Mark each route Ready and then Dispatched.',
        ],
      },
      {
        heading: 'Bookkeeper',
        steps: [
          'Issue invoices on the factory order if invoices are issued manually.',
          'When drivers are back: count and close each run on Cash Handover.',
          'Check Reconciliation and acknowledge Alerts.',
          'Receive payments and apply credit memos on Customer Accounts; send statements.',
        ],
      },
      {
        heading: 'Driver',
        steps: [
          'Sign in to the Wholesale Driver app and open today\u2019s run.',
          'Deliver each stop and complete it with the payment.',
          'Submit the run and hand the cash, checks and baskets to the office.',
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- configuration
  {
    id: 'factories',
    title: 'Factories',
    group: 'Configuration',
    page: 'factories',
    path: '/logistics/factories',
    summary: 'Each bakery or plant: its location, order cut-off, how its factory order is sent and whether it uses the fulfillment screen.',
    sections: [
      {
        heading: 'Who can change it',
        text: ['Admins and wholesale admins add and edit factories. Sales managers and factory users can open a factory to read it.'],
      },
      {
        heading: 'Add a factory',
        steps: [
          'Click New factory.',
          'Enter the Name (required) and an optional Code.',
          'Search the Address, or click the map to drop the pin. The pin is used to suggest the nearest factory for each customer and as the start of each route.',
          'Set the Order cut-off (HH:mm, for example 19:00) and the Time zone.',
          'Choose how to Send the factory order: When all routes are approved, At the cut-off time, or Manually (a manager sends it from Factory Orders).',
          'Leave Uses the Factory Fulfillment Screen (kiosk) ticked if the factory answers orders on a screen or in the Factory Approval app.',
          'Click Save.',
        ],
      },
      {
        heading: 'Rules',
        bullets: [
          'New factories start with cut-off 19:00, time zone America/Toronto, sending Manually and the fulfillment screen on.',
          'The cut-off is in the factory\u2019s own time zone.',
          'A factory that routes or customers still use can\u2019t be deleted; untick Active instead.',
        ],
      },
      {
        heading: 'Messages you may see',
        bullets: ['Enter the factory name', 'Use HH:mm, for example 19:00', 'Choose the time zone from the list', 'Set both latitude and longitude, or neither'],
      },
    ],
  },
  {
    id: 'route-setup',
    title: 'Route Setup',
    group: 'Configuration',
    page: 'routeDefinitions',
    path: '/logistics/route-definitions',
    summary: 'Delivery routes: their factory, default driver and days, and the order of the stops.',
    sections: [
      {
        heading: 'Create a route',
        steps: [
          'Click New route.',
          'Enter the Name, an optional Code and a Colour (used on the maps).',
          'Choose the Factory and the Default driver. The default driver is put on each new delivery run of this route.',
          'Toggle the Delivery days.',
          'Click Save.',
        ],
      },
      {
        heading: 'Set the stop order',
        steps: [
          'Select the route on the left. Its stops show in order next to a map.',
          'Drag a stop, or use the up and down arrows, to change the order.',
          'Click Save order (or Undo to go back).',
          'To let the system find a shorter order, click Optimise, check the distance it found, then Use this order and Save order.',
        ],
      },
      {
        heading: 'Add or remove a stop',
        bullets: [
          'Add stop searches customers by name, phone, email or account. The customer is added as the last stop; a customer on another route moves to this one.',
          'The X next to a stop takes the customer off the route. Save or undo a new order before removing stops.',
          'Stops without a map pin are marked No location and stay at the end when optimising.',
        ],
      },
      {
        heading: 'Rules',
        bullets: [
          'Bookkeepers can read routes but not change them.',
          'A route with customers on it can\u2019t be deleted; move them or untick Active.',
        ],
      },
    ],
  },
  {
    id: 'wholesale-customers',
    title: 'Wholesale Customers',
    group: 'Configuration',
    page: 'customers',
    path: '/logistics/customers',
    summary: 'Turn customers into wholesale customers and set their route, days, factory, payment terms and usual order.',
    sections: [
      {
        heading: 'Make a customer wholesale',
        steps: [
          'Click Add wholesale customer and search by name or business name. New customers are created on the Customers page first.',
          'Pick the Delivery address, Route, Delivery days and Receiving window.',
          'Leave the factory on Nearest factory, or Choose one.',
          'Set Payment (Cash, On account or Check) and Order method (Delivery or Pick up).',
          'Tick Cash only if the driver must always collect cash; an unpaid stop then raises an alert.',
          'Set the Allocation priority: lower numbers keep their quantities first when a factory is short.',
          'Click Make wholesale customer.',
        ],
      },
      {
        heading: 'Usual order',
        text: [
          'Open an existing customer and click Usual order to set what they normally get. Each line has a product, quantity and how often: Every delivery, On weekdays (choose the days) or Every N days (with a first date). Usual orders pre-fill Order Entry and are used by Generate usual orders.',
        ],
      },
      {
        heading: 'Pausing',
        bullets: [
          'Untick Active to pause a customer. Paused customers drop out of the Call List, reminders and usual orders.',
          'Contact details and addresses are edited on the Customers page (use the link in the editor).',
        ],
      },
      {
        heading: 'Filters',
        bullets: ['Search by name, phone, email or account', 'Status: all, active or paused', 'All routes / All factories'],
      },
    ],
  },
  {
    id: 'salesmen',
    title: 'Salesmen',
    group: 'Configuration',
    page: 'salesmen',
    path: '/logistics/salesmen',
    summary: 'Add salesmen and choose which customers they sell to and which product categories they can order.',
    sections: [
      {
        heading: 'Add a salesman',
        steps: [
          'Click New salesman.',
          'Enter the First name, Last name and Email. The Username defaults to the email.',
          'Set a Password. Leave Ask them to choose a new password ticked so they pick their own at first sign-in.',
          'Tick their Branches and click Create salesman.',
        ],
      },
      {
        heading: 'Assign customers and categories',
        steps: [
          'Pick the salesman on the left.',
          'Under Customers, search for a wholesale customer and click Assign. Click the X next to a customer to remove them.',
          'Under Product categories, tick the categories they can order from. Changes are saved as soon as you tick.',
        ],
      },
      {
        heading: 'What it changes',
        bullets: [
          'Salesmen only see their assigned customers in Order Entry, the Call List and Order Sheets.',
          'Salesmen can only order items from their categories. With no categories they can\u2019t order any products.',
          'A customer can be assigned to more than one salesman.',
          'Wholesale admins and sales managers manage salesmen; salesmen and bookkeepers don\u2019t see this page.',
        ],
      },
    ],
  },
  {
    id: 'customer-portal',
    title: 'Customer portal',
    group: 'Configuration',
    page: 'customers',
    path: '/logistics/customers',
    summary: 'Let wholesale customers place and change their own orders online until the factory cut-off, at their own prices.',
    sections: [
      {
        heading: 'Turn the portal on',
        steps: [
          'Open Wholesale Settings and, under Customer portal, choose the branch portal orders are recorded under. Save.',
          'Without a branch, customers can sign in but can\u2019t order.',
        ],
      },
      {
        heading: 'Give a customer access',
        steps: [
          'Open Wholesale Customers and click the customer.',
          'Click Portal access.',
          'Check the email, set a temporary password and tick the categories they can order from.',
          'Leave Email the sign-in link ticked and click Give access. The customer gets the link, their username and the temporary password.',
          'They choose their own password after signing in.',
        ],
      },
      {
        heading: 'What the customer sees',
        bullets: [
          'Their delivery days for the next four weeks, skipping closures, with the time ordering closes.',
          'Their usual items first, prefilled with their usual quantities, then the categories you ticked, with a search.',
          'Their own prices, from their pricing points.',
          'After the cut-off, or once the day is being prepared, the day is locked and they are asked to contact their salesman.',
          'They can change or cancel an order until the cut-off. Items a salesman added from other categories stay on the order.',
        ],
      },
      {
        heading: 'Change or stop access',
        bullets: [
          'Open Portal access again to change the categories, email a new temporary password or untick Can sign in and order.',
          'Salesmen see orders customers placed or changed on the portal at the top of their Wholesale home page.',
        ],
      },
    ],
  },
  {
    id: 'closures',
    title: 'Closures',
    group: 'Configuration',
    page: 'closures',
    path: '/logistics/closures',
    summary: 'Holidays and days without deliveries, for the whole business, a factory, a route or one customer.',
    sections: [
      {
        heading: 'Add a closure',
        steps: [
          'Click New closure, or click a day on the calendar.',
          'Choose what it Applies to: Whole business, Factory, Route or Customer (and pick which one).',
          'Set From and To.',
          'Choose Skip deliveries, or Move deliveries and pick the Move to day.',
          'Enter a Reason, for example Thanksgiving, and Save.',
        ],
      },
      {
        heading: 'What it changes',
        bullets: [
          'Skipped days disappear from the Call List and Order Entry for the customers affected.',
          'Moved deliveries show on the new day, marked Moved in Order Entry.',
          'Deliveries can\u2019t be moved to a day inside the same closure.',
          'The calendar can show one route to see exactly which of its days are skipped or moved.',
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- order preparation
  {
    id: 'call-list',
    title: 'Call List',
    group: 'Order Preparation',
    page: 'callList',
    path: '/logistics/call-list',
    summary: 'The customers due for a delivery date who still need a call. The number next to the menu item is how many are left for tomorrow.',
    sections: [
      {
        heading: 'Work the list',
        steps: [
          'The Delivery date starts on tomorrow. Filter by route if you only cover some.',
          'Call the customer (the phone number is a link).',
          'Click Take order to open Order Entry for that customer, or Log call to record the outcome: Ordered, No order needed, Call back (with a time), No answer or Called.',
          'Use Note to leave a note for the sales managers, salespeople, factory, bookkeepers or admins. Tick Urgent to flag it in the email subject.',
        ],
      },
      {
        heading: 'Statuses',
        table: {
          headers: ['Status', 'Meaning'],
          rows: [
            ['To call', 'Delivers that day, has no order and no final call outcome yet.'],
            ['Ordered', 'Already has an order for that day.'],
            ['Done', 'A call was logged that needs no more calls.'],
          ],
        },
      },
      { heading: 'Tip', text: ['Tick Show done to see everyone, including customers already handled.'] },
    ],
  },
  {
    id: 'order-entry',
    title: 'Order Entry',
    group: 'Order Preparation',
    page: 'orderEntry',
    path: '/logistics/order-entry',
    summary: 'The fast way to take wholesale orders: pick a date and customer, fill in quantities, save.',
    sections: [
      {
        heading: 'Take an order',
        steps: [
          'Choose the Delivery date and the Register the orders are placed on (it is remembered).',
          'Pick the customer on the left. Badges show Ordered, Usual, Off day and Moved.',
          'Quantities start from the Usual order. The Ordered before and Other items groups hold everything else; use Find item to search.',
          'Add a Line note or a note for the whole order if needed, and choose Delivery or Pick up.',
          'Click Save, Save & Next (moves to the next customer) or Save & Print.',
        ],
      },
      {
        heading: 'Warnings on the customer',
        bullets: [
          'Cash only and Blocked badges.',
          'Over the credit limit, and unpaid orders with the oldest date.',
          'Off day: the date is not one of the customer\u2019s delivery days; the order is marked off schedule.',
          'Route on this date: puts the customer on another route for that one day.',
          'If the customer already ordered, saving adds another order.',
        ],
      },
      {
        heading: 'Generate usual orders',
        steps: [
          'Choose the date, route and register, then click Generate usual orders.',
          'The preview lists every customer delivering that day with the order they would get. Untick anyone who should not get one. Customers who can\u2019t get one are listed under Not generated with the reason.',
          'Click Generate. Each order is saved as you and marked as generated from the usual order.',
        ],
      },
      {
        heading: 'Messages you may see',
        bullets: ['Choose the register the order is placed on.', 'Enter a quantity for at least one item.'],
      },
    ],
  },
  {
    id: 'customer-notes',
    title: 'Customer Notes',
    group: 'Order Preparation',
    page: 'customerNotes',
    path: '/logistics/customer-notes',
    summary: 'Notes left about customers from the Call List, Order Entry or by drivers, until someone resolves them.',
    sections: [
      {
        heading: 'Use it',
        bullets: [
          'Filter Open, Resolved or All, and Urgent only.',
          'Each note shows who it was sent to and where it came from: Call list, Order entry, Driver or Other.',
          'Click Resolve once the note has been dealt with.',
        ],
      },
    ],
  },
  {
    id: 'order-sheets',
    title: 'Order Sheets',
    group: 'Order Preparation',
    page: 'orderSheets',
    path: '/logistics/order-sheets',
    summary: 'One sheet per route and day: salespeople submit it, a manager approves it, and only approved routes go to the factory.',
    sections: [
      {
        heading: 'Submit and approve',
        steps: [
          'Pick the day (and factory). Each route shows its customers, orders, quantity and status.',
          'Salesperson: click Submit for approval. The route\u2019s orders are locked for editing.',
          'Manager: click Approve. The route now counts toward the factory order.',
          'To fix something, the manager clicks Reopen and says why. The orders can be edited again and the route has to be submitted again.',
          'Print gives a paper copy of the day.',
        ],
      },
      {
        heading: 'Statuses',
        table: {
          headers: ['Status', 'Meaning'],
          rows: [
            ['Not submitted', 'Still being filled in.'],
            ['Waiting for approval', 'Submitted and locked; a manager has to approve or reopen it.'],
            ['Approved', 'Goes into the factory order.'],
            ['Reopened', 'Sent back for changes, with the reason shown.'],
          ],
        },
      },
      { heading: 'Rule', text: ['A route with no orders can\u2019t be submitted.'] },
    ],
  },
  {
    id: 'factory-orders',
    title: 'Factory Orders',
    group: 'Order Preparation',
    page: 'factoryOrders',
    path: '/logistics/factory-orders',
    summary: 'The order each factory gets for a delivery day: send it, cover shortages, amend it and issue invoices.',
    sections: [
      {
        heading: 'The board',
        text: [
          'Each factory shows how many routes are approved, the order status, its version and the last update. The page refreshes every 30 seconds.',
        ],
      },
      {
        heading: 'Send a factory order',
        steps: [
          'Click Send next to the factory (at least one route must be approved).',
          'The dialog says how many approved routes go out now and how many unapproved routes are left out.',
          'Add an optional note and click Send. The order opens.',
        ],
      },
      {
        heading: 'When the factory returns it with shortages',
        steps: [
          'Open the order. Cover the shortages lists each short product, how many are available and why.',
          'For each product choose how to cover it: Proportional (every customer loses the same share), By priority (best priority filled first), Manual (enter each customer\u2019s quantity), Order it from another factory, or Replace with another product.',
          'Add a note and click Allocate and send version N. The factory gets the new version, and the customers whose orders changed are listed.',
        ],
      },
      {
        heading: 'Amend an approved order',
        text: [
          'While the order is Approved or In production, Amend lets a manager change customer quantities. The factory has to approve the new version before production goes on.',
        ],
      },
      {
        heading: 'Invoices',
        steps: [
          'Once the order is approved, the Invoices panel lists every customer order with its invoice number or Not issued.',
          'Bookkeepers and admins click Issue all, or tick some and Issue selected. Invoices are emailed to customers with an email address.',
          'If Issue invoices in Settings is On delivery or When the factory approves, this happens by itself.',
        ],
      },
      {
        heading: 'Statuses',
        table: {
          headers: ['Status', 'Meaning'],
          rows: [
            ['Not sent', 'No factory order yet for that day.'],
            ['Waiting for the factory', 'Sent; the factory has to approve or return it.'],
            ['Returned with shortages', 'The factory can\u2019t make everything; the office has to cover the shortages.'],
            ['Approved', 'The factory accepted this version.'],
            ['In production', 'The factory started baking.'],
            ['Ready / Dispatched', 'Routes are loaded / have left.'],
            ['Cancelled', 'No longer used.'],
          ],
        },
      },
      {
        heading: 'History',
        text: ['The detail page keeps every step: built, sent, returned, shortages allocated, re-submitted, approved, amended, production started, route ready, dispatched, invoiced, and whether it came from the web or the factory screen.'],
      },
    ],
  },

  // ---------------------------------------------------------------- production
  {
    id: 'factory-fulfillment',
    title: 'Factory Fulfillment',
    group: 'Production',
    page: 'factoryFulfillment',
    path: '/logistics/factory-fulfillment',
    summary: 'The factory\u2019s side of the factory order on the web: approve or return, run production, mark routes ready and dispatched.',
    sections: [
      {
        heading: 'Answer an order',
        steps: [
          'The inbox lists orders from today on. Open one that is Waiting for the factory.',
          'For each product, Can make starts at the requested quantity. Lower it if you can\u2019t make it all and choose Why (Not enough capacity, Missing ingredients, Equipment problem, Not enough staff, Other).',
          'Add a note for the office if needed.',
          'Click Approve version N when everything can be made, or Return with shortages.',
        ],
      },
      {
        heading: 'Production and trucks',
        steps: [
          'On an approved order click Start production.',
          'Set each product to Not started, In progress or Done.',
          'Mark each route Ready when loaded and Dispatched when it leaves.',
        ],
      },
      {
        heading: 'Good to know',
        bullets: [
          'The page updates live and shows "New version for …" when the office sends or amends an order.',
          'It is the web version of the Factory Approval app; use whichever is handier.',
          'Wholesale admins can use it too when the factory can\u2019t.',
        ],
      },
    ],
  },
  {
    id: 'production',
    title: 'Production',
    group: 'Production',
    page: 'production',
    path: '/logistics/production',
    summary: 'How much of each product to bake for a factory and day, by route.',
    sections: [
      {
        heading: 'Use it',
        bullets: [
          'Pick the day and factory. The table shows each route\u2019s quantities per product and the totals.',
          'A warning shows when routes are not approved yet, because their quantities can still change.',
          'Purchased items are not baked, so they only show on the Loading Lists.',
          'Print gives the production sheet.',
        ],
      },
    ],
  },
  {
    id: 'loading-lists',
    title: 'Loading Lists',
    group: 'Production',
    page: 'loadingLists',
    path: '/logistics/loading-lists',
    summary: 'What to load on each truck, stop by stop, including purchased items.',
    sections: [
      {
        heading: 'Use it',
        bullets: [
          'Pick the day, factory and route (or all routes).',
          'Each route lists its stops in order with customer, products, quantities and notes, and the totals to load.',
          'Print puts one route per page.',
        ],
      },
    ],
  },
  {
    id: 'delivery-runs',
    title: 'Delivery Runs',
    group: 'Production',
    page: 'deliveryRuns',
    path: '/logistics/delivery-runs',
    summary: 'Each route\u2019s run for a delivery day: who drives, how far they are and what happened at each stop. Updates live.',
    sections: [
      {
        heading: 'How runs are made',
        text: [
          'When the factory approves its order, the orders are released into one run per route, with the route\u2019s default driver. A manager can also click Release now to release waiting orders without waiting for the factory.',
        ],
      },
      {
        heading: 'Release now',
        steps: ['Click Release now.', 'Choose the Factory and Every route of the factory or one route.', 'Click Release. Runs that were already submitted are skipped; unlock them first.'],
      },
      {
        heading: 'Change the driver',
        text: ['Select a run that is not submitted and pick another driver, or No driver. Only active users with the Wholesale Driver role are listed.'],
      },
      {
        heading: 'Look at a stop',
        text: [
          'Click a stop to see the products (ordered, approved, delivered and the reason for changes), how it was paid, baskets, stale returns, the signature, photo and location, the driver\u2019s note and any credit memos.',
        ],
      },
      {
        heading: 'Unlock a submitted run',
        text: [
          'When the driver submits, the run is locked. Bookkeepers and admins can click Unlock so the driver can change it again; the driver then has to submit again.',
        ],
      },
      {
        heading: 'Run statuses',
        table: {
          headers: ['Status', 'Meaning'],
          rows: [
            ['Not started', 'No stop done yet.'],
            ['On the road', 'Some stops done.'],
            ['All stops done', 'Every stop done, not submitted yet.'],
            ['Submitted', 'The driver submitted; locked until unlocked.'],
            ['Cancelled', 'No longer used.'],
          ],
        },
      },
    ],
  },
  {
    id: 'live-route',
    title: 'Live Route',
    group: 'Production',
    page: 'liveRoute',
    path: '/logistics/live-route',
    summary: 'A map of where each driver is right now, their progress and the path driven so far.',
    sections: [
      {
        heading: 'Use it',
        steps: [
          'Pick the day and factory. The list shows each run with its driver, status, stops done and when the driver last reported.',
          'Each driver is a marker on the map at their last position.',
          'Click a run (or its marker) to show its stops (done stops are faded) and the path driven.',
        ],
      },
      {
        heading: 'Not reporting',
        text: [
          'The driver app shares its location while it is open, every "Driver location every" seconds from Settings (60 by default). A run that is still open and hasn\u2019t reported for three intervals shows as Not reporting in red. Submitted runs are not flagged.',
        ],
      },
      { heading: 'Good to know', bullets: ['Positions move live without refreshing.', 'The driver app only shares while it is in the foreground.'] },
    ],
  },

  // ---------------------------------------------------------------- audits and reconciliation
  {
    id: 'reconciliation',
    title: 'Reconciliation',
    group: 'Audits and Reconciliation',
    page: 'reconciliation',
    path: '/logistics/reconciliation',
    summary: 'For a delivery day: what was ordered, approved, delivered and paid per run, the handover difference and every quantity change.',
    sections: [
      {
        heading: 'Read the day',
        bullets: [
          'The top cards total the day: Invoiced, Cash, Checks, On account, Not paid, Stale credit, Delivered and Stale returned.',
          'Runs submitted, Handovers closed, Handover difference and Quantity changes (with how many have no reason).',
          'With All factories and more than one factory, a table splits the totals per factory.',
        ],
      },
      {
        heading: 'Check a run',
        steps: [
          'Click a run. Its products show ordered, approved, delivered and stale returned.',
          'Quantity changes lists every line delivered differently from what was approved, with the reason.',
          'Click a change to open that stop.',
        ],
      },
      {
        heading: 'Change types',
        table: {
          headers: ['Label', 'Meaning'],
          rows: [
            ['Short', 'Less delivered than approved, with a reason.'],
            ['No reason', 'Less delivered than approved and no reason given. Also raises an alert.'],
            ['Over', 'More delivered than approved. Also raises an alert.'],
          ],
        },
      },
      {
        heading: 'Handover column',
        text: ['Matches, the difference (for example -$2.00), Not counted (submitted but not counted yet) or Delivering.'],
      },
    ],
  },
  {
    id: 'alerts',
    title: 'Alerts',
    group: 'Audits and Reconciliation',
    page: 'alerts',
    path: '/logistics/alerts',
    summary: 'Things the office should look at. The red number next to the menu item is how many are open.',
    sections: [
      {
        heading: 'Alert types and when they are raised',
        table: {
          headers: ['Alert', 'Raised when'],
          rows: [
            ['Cash not handed in', 'A handover is closed with less cash than expected, or with checks missing.'],
            ['Quantity changed without a reason', 'A driver delivered less than approved and gave no reason.'],
            ['Over-delivery', 'A driver delivered more than approved.'],
            ['Cash-only customer not paid', 'A cash-only customer\u2019s stop was left not paid with money still due (if the setting is on).'],
            ['High stale return rate', 'Every night, for customers whose stale returns over the last "Return rate period" days are above the "Alert above return rate" percentage.'],
          ],
        },
      },
      {
        heading: 'Acknowledge an alert',
        steps: ['Click Acknowledge.', 'Write what was done about it (optional).', 'Confirm. The alert keeps who acknowledged it, when and the note.'],
      },
      {
        heading: 'Filters',
        bullets: ['The page opens on open alerts of the last 30 days.', 'Filter by dates, status, type and factory.', 'The customer name opens their account.'],
      },
      { heading: 'Rule', text: ['The same event never raises a second alert.'] },
    ],
  },
  {
    id: 'cash-handover',
    title: 'Cash Handover',
    group: 'Audits and Reconciliation',
    page: 'cashHandover',
    path: '/logistics/cash-handover',
    summary: 'Count what each driver hands in against what they collected, then close the handover for good.',
    sections: [
      {
        heading: 'Count and close',
        steps: [
          'Pick the day. Runs show Still delivering, Ready to count or Closed.',
          'Open a run that is Ready to count. The left side shows what the driver should hand in: cash, each check, on account, not paid, stale credit and baskets.',
          'Enter the Cash handed in. The difference shows as you type (Matches, short or over).',
          'Tick each check received; missing checks are listed.',
          'Enter the Baskets and an optional Note.',
          'Click Close handover and confirm.',
        ],
      },
      {
        heading: 'Rules',
        bullets: [
          'A handover can only be closed after the driver submits the run.',
          'A closed handover can\u2019t be changed. It shows who closed it and when.',
          'Short cash or missing checks raise a "Cash not handed in" alert.',
        ],
      },
    ],
  },
  {
    id: 'stale-returns',
    title: 'Stale Returns',
    group: 'Audits and Reconciliation',
    page: 'staleReturns',
    path: '/logistics/stale-returns',
    summary: 'Bread brought back at the door, by product and by line, with the credit given.',
    sections: [
      {
        heading: 'Use it',
        bullets: [
          'Filter by dates (last 7 days to start), route, customer and product.',
          'The cards total the returns, quantity and credit.',
          'The detail shows each return with the reason (Stale, Damaged, Unsold, Other), the credit per unit and the credit memo it went on.',
        ],
      },
      {
        heading: 'How the credit is worked out',
        text: [
          'Credit per unit = the price (as sold, or the current price, per the Credit at setting) times the Credit percentage in Settings. Returns go on a Stale return credit memo for the customer.',
        ],
      },
    ],
  },
  {
    id: 'credit-memos',
    title: 'Credit Memos',
    group: 'Audits and Reconciliation',
    page: 'creditMemos',
    path: '/logistics/credit-memos',
    summary: 'Credit owed to customers for delivery changes and stale returns.',
    sections: [
      {
        heading: 'Where memos come from',
        bullets: [
          'Delivery change: the driver delivered less than an invoice that was already issued. One open memo per order holds the difference.',
          'Stale return: bread taken back at the door with a credit.',
        ],
      },
      {
        heading: 'Use it',
        bullets: [
          'Filter by dates, route, customer, reason and status (Open, Applied, Void).',
          'Click a memo to see its lines, total and source invoice.',
          'To use a memo against a bill, go to Customer Accounts (office) or let the driver use it at the door.',
        ],
      },
      {
        heading: 'Statuses',
        table: {
          headers: ['Status', 'Meaning'],
          rows: [
            ['Open', 'Has credit left to use.'],
            ['Applied', 'Fully used on bills.'],
            ['Void', 'Cancelled; it no longer credits anything and is left out of the totals.'],
          ],
        },
      },
    ],
  },
  {
    id: 'customer-accounts',
    title: 'Customer Accounts',
    group: 'Audits and Reconciliation',
    page: 'customerAccounts',
    path: '/logistics/customer-accounts',
    summary: 'What each customer owes by age, their statement, payments received at the office and their credit memos.',
    sections: [
      {
        heading: 'The aging list',
        bullets: [
          'Pick the As of date, factory and route, or search a customer.',
          'Columns split what is owed by age: Current, 1-30, 31-60, 61-90 and 90+ days.',
          'The cards show Owed, Overdue (older than Current), Over 60 days and Open credit.',
          'Click a customer to open their account.',
        ],
      },
      {
        heading: 'Receive a payment',
        steps: [
          'Open the customer and click Receive payment.',
          'Enter the Date, Method (Cash, Check or Bank transfer) and Amount. A check needs its number.',
          'The amount is spread over the open invoices oldest first. Change the Pay amounts to pay other invoices; they must add up to the payment.',
          'Add a Reference or Note and click Save payment. The aging and statement update at once.',
        ],
      },
      {
        heading: 'Apply or void a credit memo',
        steps: [
          'In Open credit memos click Apply, choose the invoice and the amount (up to what is left on the memo and on the invoice), then Apply.',
          'Or click Void and say why. What is left of the memo is no longer owed to the customer; parts already applied stay applied.',
        ],
      },
      {
        heading: 'Statement',
        steps: [
          'Switch to the Statement tab and choose the dates.',
          'It shows the opening balance, each invoice, payment at delivery, office payment and credit memo with a running balance, and the closing balance.',
          'Click Print to print or save it as PDF for the customer.',
        ],
      },
      {
        heading: 'What "open" means',
        bullets: [
          'An invoice is open for what is not paid yet. Putting a bill on account does not close it; it stays owed until a payment or memo settles it.',
          'The aging total on a date equals the statement closing balance on the same date.',
          'A payment can\u2019t be more than the customer owes.',
        ],
      },
    ],
  },
  {
    id: 'invoices',
    title: 'Invoices',
    group: 'Audits and Reconciliation',
    page: 'invoices',
    path: '/logistics/invoices',
    summary: 'Every issued invoice in a period, with its payment status, and a reprint.',
    sections: [
      {
        heading: 'Use it',
        bullets: [
          'Filter by dates (this month to start), factory, route, customer, status and invoice number.',
          'The cards total the invoices, invoiced, paid and open amounts.',
          'Click the customer to open their account, or Print to reprint the invoice.',
          'Use Previous and Next when there are more than 50 invoices.',
        ],
      },
      {
        heading: 'Statuses',
        table: {
          headers: ['Status', 'Meaning'],
          rows: [
            ['Open', 'Nothing paid yet.'],
            ['Partly paid', 'Some paid, some still owed.'],
            ['Paid', 'Fully paid.'],
          ],
        },
      },
    ],
  },

  // ---------------------------------------------------------------- settings
  {
    id: 'dashboard',
    title: 'Dashboard',
    group: 'Getting started',
    page: 'dashboard',
    path: '/logistics/dashboard',
    summary: 'The wholesale day at a glance: orders, deliveries, money, runs, receivables, alerts and stale returns.',
    sections: [
      {
        heading: 'Use it',
        bullets: [
          'Choose Today, Last 7 days or This month, or any range up to 31 days, and a factory.',
          'Cards: Orders, Delivered, Invoiced, Not paid, Stale rate, Open alerts, Runs, Stops done, Handovers closed, Factory shortages, Receivables and Overdue.',
          'Click a card to open the page behind it (when your role can open it).',
          'Per day compares ordered, invoiced, cash and checks; Most stale returns lists the customers with the highest return rate.',
        ],
      },
      { heading: 'Good to know', text: ['The figures are the same as on Reconciliation, Alerts and Customer Accounts for the same days.'] },
    ],
  },
  {
    id: 'wholesale-users',
    title: 'Wholesale Users',
    group: 'Settings',
    page: 'users',
    path: '/logistics/users',
    summary: 'Accounts for sales managers, factory users and drivers.',
    sections: [
      {
        heading: 'Create a user',
        steps: [
          'Pick the tab: Sales managers, Factory users or Drivers.',
          'Click New and fill in first name, last name and email. The username is the email unless you change it.',
          'Set a password (at least 8 characters) and optionally ask them to choose a new one at first sign-in.',
          'Factory users: tick at least one factory; they only see those factories.',
          'Click Create.',
        ],
      },
      {
        heading: 'Who can manage whom',
        bullets: ['Admins and wholesale admins: everyone.', 'Sales managers: factory users only.', 'Bookkeepers: read only.'],
      },
    ],
  },
  {
    id: 'wholesale-settings',
    title: 'Wholesale Settings',
    group: 'Settings',
    page: 'settings',
    path: '/logistics/settings',
    summary: 'Rules for every wholesale customer, route and factory. Only admins and wholesale admins can change them.',
    sections: [
      {
        heading: 'Settings',
        table: {
          headers: ['Setting', 'What it does', 'Default'],
          rows: [
            ['Salesmen see past orders', 'Salespeople can open orders from earlier delivery days.', 'Off'],
            ['Reason for quantity changes', 'A reason is needed when a quantity is changed after the order is placed.', 'On'],
            ['Allow over-delivery', 'Drivers can deliver more than ordered, with a reason; it raises an alert.', 'Off'],
            ['Reminder times', 'When salespeople get reminders about customers who haven\u2019t ordered.', 'None'],
            ['Tell the sales manager at cut-off', 'Customers still without an order at the cut-off are sent to the sales manager.', 'On'],
            ['Draft usual orders at cut-off', 'Customers still without an order at the cut-off get a draft from their usual order.', 'Off'],
            ['Approval email recipients', 'Who receives order approval emails.', 'None'],
            ['Alert above return rate', 'Raise a High stale return rate alert above this percentage. Empty means no alert.', 'Empty'],
            ['Credit', 'Share of the price credited for stale returns.', '100%'],
            ['Return rate period', 'Days the return rate alert looks back (1 to 90).', '7 days'],
            ['Credit at', 'Price it was sold at, or the Current price.', 'Price it was sold at'],
            ['Issue invoices', 'When the factory approves, On delivery, or Manually.', 'On delivery'],
            ['When a factory is short', 'Default split: Proportionally, By customer priority, or Manually.', 'Proportionally'],
            ['Proof of delivery', 'Nothing extra, Signature, or Signature and photo.', 'Signature'],
            ['Alert on unpaid cash-only stops', 'Raise an alert when a cash-only customer is left unpaid.', 'On'],
            ['Driver location every', 'Seconds between the driver app\u2019s location shares for Live Route (15 to 900).', '60 seconds'],
            ['Footer', 'Text printed at the bottom of the delivery note (up to 2000 characters).', 'Empty'],
          ],
        },
      },
      { heading: 'Saving', text: ['Changes show a bar at the bottom: Save settings, or Discard to go back.'] },
    ],
  },

  // ---------------------------------------------------------------- other
  {
    id: 'order-lists',
    title: 'Create Order, Saved Orders and Processed Orders',
    group: 'Other',
    page: 'wholesaleOrders',
    path: '/logistics/wholesale-orders',
    summary: 'The regular order screens, filtered to wholesale orders.',
    sections: [
      {
        heading: 'Use them',
        bullets: [
          'Create Order asks for the online register, then opens the full order screen in wholesale mode. Order Entry is usually faster for wholesale.',
          'Saved Orders lists wholesale drafts.',
          'Processed Orders lists placed wholesale orders; open one to see, print or change it.',
        ],
      },
    ],
  },
  {
    id: 'routes-map',
    title: 'Routes and Map (older pages)',
    group: 'Other',
    page: 'routes',
    path: '/logistics/routes',
    summary: 'The older warehouse routes with Google Maps navigation. Wholesale deliveries use Route Setup, Delivery Runs and Live Route instead.',
    sections: [
      {
        heading: 'Use them',
        bullets: [
          'Routes lists warehouse routes by branch and date; Create Route adds one, and each route holds its stops and a navigation link.',
          'Map shows the directions of a planned or in-progress route.',
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- apps
  {
    id: 'driver-app',
    title: 'Wholesale Driver app',
    group: 'Mobile and kiosk apps',
    audience: 'Drivers',
    summary: 'What drivers do on the road: deliver each stop, collect payment, take stale returns and submit the run.',
    sections: [
      {
        heading: 'Sign in',
        bullets: [
          'Enter the Account ID, username and password and tap Sign in. The user needs the Wholesale Driver role.',
          'The app stays signed in; the password is never stored. Sign out keeps the Account ID and username for next time.',
        ],
      },
      {
        heading: 'Pick the run',
        bullets: [
          'The runs screen opens on today. Use the arrows or the date to change day.',
          'Runs appear once the factory approves the orders (or the office releases them).',
          'If there are several runs, tap the one to drive. The header shows stops done and the money to collect.',
          'Directions opens Google Maps for the remaining stops (up to 10 at a time).',
        ],
      },
      {
        heading: 'At a stop',
        steps: [
          'Tap the stop. Check the customer, address and notes; call them from the app bar if needed.',
          'Adjust the delivered quantity of each product. If it differs from what was approved, pick a reason (Damaged, Customer refused, Short on the truck, Customer asked for more or Other).',
          'Add return records stale bread taken back: choose the product (from the last 14 days of deliveries), the quantity and the reason. The credit shows at once.',
          'Tap Save changes, then Complete stop.',
        ],
      },
      {
        heading: 'Complete the stop',
        steps: [
          'Credit memos: if the customer has open credit, tap Use $x to take it off the bill. Only the office can undo this.',
          'Choose how they paid: Cash, Check (enter the check number), On account (within their limit) or Not paid. Cash-only customers can\u2019t pay by check or on account. Enter the amount received; a partial amount leaves the rest on the bill.',
          'Count the Baskets returned.',
          'Get the signature and take the photo if the office requires them.',
          'The location is recorded automatically; if it can\u2019t be found, say why.',
          'Add an optional note and tap Complete stop.',
        ],
      },
      {
        heading: 'Delivery note',
        text: [
          'After completing, print or share the delivery note (A4 or 80 mm receipt). It lists the products ordered and delivered, the total, credit memos used, what was paid and the balance, stale returns and their credit, baskets and the footer from Settings.',
        ],
      },
      {
        heading: 'Submit the run',
        steps: [
          'When every stop is done, tap Review and submit run.',
          'Check the hand-in totals: cash, each check, baskets, on account, not paid and stale credit.',
          'Tap Submit run. The run is locked; nothing can change until the office unlocks it.',
          'Hand the cash, checks and baskets to the office.',
        ],
      },
      {
        heading: 'Location sharing',
        text: [
          'While today\u2019s run is open and the app is on screen, it shares the phone\u2019s location with the office for Live Route, about once a minute (set in Settings). It stops when the run is submitted or the app is in the background.',
        ],
      },
    ],
  },
  {
    id: 'factory-app',
    title: 'Factory Approval app',
    group: 'Mobile and kiosk apps',
    audience: 'Factory users',
    summary: 'The factory\u2019s screen for answering factory orders and printing production and loading lists.',
    sections: [
      {
        heading: 'Sign in',
        bullets: [
          'Enter the Account ID, username and password of a factory user, then Choose the factory.',
          'Only factories assigned on Wholesale Users with the fulfillment screen turned on can be chosen.',
          'Change factory and Sign out are in the menu.',
        ],
      },
      {
        heading: 'Orders',
        steps: [
          'New orders chime and flash; tap the banner or the order to open it.',
          'Enter Can make for each product; if short, choose Why?.',
          'Everything can be made resets all quantities to what was ordered.',
          'Tap Approve version N, or Return with shortages. When the office sends a new version it flashes again.',
          'After approval: Start production, set each product In progress or Done, and mark each route Ready and Dispatched.',
        ],
      },
      {
        heading: 'Production and Loading lists',
        bullets: [
          'Production shows the quantities per route for the chosen day (tomorrow to start). Print production sheet prints it.',
          'Loading lists shows each route\u2019s stops and products. Print loading lists prints one route per section with a check box per stop.',
        ],
      },
      { heading: 'Good to know', text: ['The app updates live. If the connection drops it refreshes every 30 seconds.'] },
    ],
  },

  // ---------------------------------------------------------------- reference
  {
    id: 'money-flow',
    title: 'How money is tracked',
    group: 'Reference',
    summary: 'From the invoice to the payment: bills, payments at the door, on account, credit memos and office payments.',
    sections: [
      {
        heading: 'The flow',
        steps: [
          'An invoice is issued for each order (when the factory approves, on delivery or by hand).',
          'At the door the driver records Cash, Check, On account or Not paid, and can use open credit memos.',
          'Cash and checks are counted on Cash Handover.',
          'Whatever is not paid stays open on the invoice and shows on Customer Accounts.',
          'The office receives later payments and applies or voids credit memos on Customer Accounts.',
        ],
      },
      {
        heading: 'Payment types at the door',
        table: {
          headers: ['Paid by', 'What happens'],
          rows: [
            ['Cash', 'The driver collects it and hands it in. A partial amount leaves the rest open.'],
            ['Check', 'Same as cash, with the check number recorded and checked at handover.'],
            ['On account', 'The bill goes on the customer\u2019s account within their limit. It is still owed until paid.'],
            ['Not paid', 'Nothing collected; the bill stays open. Raises an alert for cash-only customers.'],
            ['Credit memo', 'Open credit taken off the bill at the door or at the office.'],
          ],
        },
      },
    ],
  },
  {
    id: 'glossary',
    title: 'Glossary',
    group: 'Reference',
    summary: 'Words used across the Wholesale pages.',
    sections: [
      {
        heading: 'Terms',
        table: {
          headers: ['Term', 'Meaning'],
          rows: [
            ['Route', 'A fixed group of customers delivered together on set days, set up in Route Setup.'],
            ['Run', 'One route on one delivery day, with its driver and stops.'],
            ['Stop', 'One customer\u2019s delivery on a run.'],
            ['Order sheet', 'A route\u2019s orders for one day, submitted and approved before the factory order.'],
            ['Factory order', 'Everything one factory has to make for one day, in versions.'],
            ['Version', 'Each time the factory order changes (shortages covered, amended), it gets a new version the factory approves again.'],
            ['Shortage', 'Less than ordered can be made; the office decides who gets less.'],
            ['Cut-off', 'The time by which the factory order goes out.'],
            ['Usual order', 'What a customer normally gets, used to pre-fill and generate orders.'],
            ['Stale return', 'Unsold bread taken back at the door for a credit.'],
            ['Credit memo', 'Credit owed to a customer, used on later bills.'],
            ['Handover', 'The driver handing in cash, checks and baskets after a run.'],
            ['Aging', 'What a customer owes split by how old the invoices are.'],
            ['Closure', 'Days without deliveries, skipped or moved.'],
          ],
        },
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    group: 'Reference',
    summary: 'Common questions and what to do.',
    sections: [
      {
        heading: 'Questions',
        table: {
          headers: ['Problem', 'What to do'],
          rows: [
            ['I don\u2019t see a page in the menu', 'Your role can\u2019t open it. Ask an admin to give you the right role.'],
            ['A customer is missing from the Call List', 'Check they are Active, have that delivery day and route, and there is no closure that day.'],
            ['A route isn\u2019t in the factory order', 'Only approved routes are sent. Approve it on Order Sheets; the factory order may need to be sent again.'],
            ['The driver sees no run', 'Runs appear once the factory approves. Use Release now on Delivery Runs, and check the driver is set on the run.'],
            ['The driver can\u2019t change a stop', 'The run was submitted. Unlock it on Delivery Runs.'],
            ['A driver shows Not reporting', 'The app must be open on screen with location allowed. Ask the driver to open it.'],
            ['A handover can\u2019t be closed', 'The driver has to submit the run first.'],
            ['A payment is refused', 'It can\u2019t be more than the customer owes, and the invoice amounts must add up to the payment.'],
            ['A credit memo can\u2019t be applied', 'It must be open, have credit left and belong to the same customer as the invoice.'],
          ],
        },
      },
    ],
  },
];

const topicText = (topic: HelpTopic) =>
  [
    topic.title,
    topic.summary,
    topic.group,
    ...topic.sections.flatMap(s => [s.heading, ...(s.text ?? []), ...(s.steps ?? []), ...(s.bullets ?? []), ...(s.table ? s.table.rows.flat() : [])]),
  ]
    .join(' ')
    .toLowerCase();

/** Topics whose text contains every word of [query]. */
export const searchTopics = (topics: HelpTopic[], query: string) => {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return topics;
  return topics.filter(topic => {
    const text = topicText(topic);
    return words.every(word => text.includes(word));
  });
};
