import menu from 'app/entities/menu/menu.reducer';
import branch from 'app/entities/branch/branch.reducer';
import discount from 'app/entities/discount/discount.reducer';
import attachment from 'app/entities/attachment/attachment.reducer';
import customer from 'app/entities/customer/customer.reducer';
import item from 'app/entities/item/item.reducer';
import taxonomy from 'app/entities/taxonomy/taxonomy.reducer';
import addon from 'app/entities/addon/addon.reducer';
import term from 'app/entities/term/term.reducer';
import order from 'app/entities/order/order.reducer';
import user from 'app/entities/back-office-user/user.reducer';
import PosBranchUser from 'app/entities/branch-pos-user/user.reducer';
import tax from 'app/entities/settings/taxes/tax.reducer';
import accountingGroups from 'app/entities/settings/void-reasons/void-reasons.reducer';
import voidReasons from 'app/entities/settings/void-reasons/void-reasons.reducer';

import taxProfiles from 'app/entities/settings/tax-profiles/tax-profile.reducer';
import businessDetail from 'app/entities/business-details/business-detail.reducer';
/* jhipster-needle-add-reducer-import - JHipster will add reducer here */

const entitiesReducers = {
  menu,
  branch,
  discount,
  attachment,
  customer,
  item,
  taxonomy,
  addon,
  term,
  order,
  user,
  PosBranchUser,
  tax,
  taxProfiles,
  accountingGroups,
  businessDetail,
  voidReasons
  /* jhipster-needle-add-reducer-combine - JHipster will add reducer here */
};

export default entitiesReducers;
