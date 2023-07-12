import item from 'app/entities/item/item.reducer';
import menu from 'app/entities/menu/menu.reducer';
import branch from 'app/entities/branch/branch.reducer';
import attachment from 'app/entities/attachment/attachment.reducer';
import customer from 'app/entities/customer/customer.reducer';
import addon from 'app/entities/addon/addon.reducer';
import taxonomy from 'app/entities/taxonomy/taxonomy.reducer';
import term from 'app/entities/term/term.reducer';
import discount from 'app/entities/discount/discount.reducer';
/* jhipster-needle-add-reducer-import - JHipster will add reducer here */

const entitiesReducers = {
  item,
  menu,
  branch,
  attachment,
  customer,
  addon,
  taxonomy,
  term,
  discount,
  /* jhipster-needle-add-reducer-combine - JHipster will add reducer here */
};

export default entitiesReducers;
