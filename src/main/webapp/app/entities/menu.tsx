import React from 'react';
import { Translate } from 'react-jhipster';

import MenuItem from 'app/shared/layout/menus/menu-item';

const EntitiesMenu = () => {
  return (
    <>
      {/* prettier-ignore */}
      <MenuItem icon="asterisk" to="/menu">
        <Translate contentKey="global.menu.entities.menu" />
      </MenuItem>
      <MenuItem icon="asterisk" to="/branch">
        <Translate contentKey="global.menu.entities.branch" />
      </MenuItem>
      <MenuItem icon="asterisk" to="/discount">
        <Translate contentKey="global.menu.entities.discount" />
      </MenuItem>
      <MenuItem icon="asterisk" to="/attachment">
        <Translate contentKey="global.menu.entities.attachment" />
      </MenuItem>
      <MenuItem icon="asterisk" to="/customer">
        <Translate contentKey="global.menu.entities.customer" />
      </MenuItem>
      <MenuItem icon="asterisk" to="/item">
        <Translate contentKey="global.menu.entities.item" />
      </MenuItem>
      <MenuItem icon="asterisk" to="/taxonomy">
        <Translate contentKey="global.menu.entities.taxonomy" />
      </MenuItem>
      <MenuItem icon="asterisk" to="/addon">
        <Translate contentKey="global.menu.entities.addon" />
      </MenuItem>
      <MenuItem icon="asterisk" to="/term">
        <Translate contentKey="global.menu.entities.term" />
      </MenuItem>
      {/* jhipster-needle-add-entity-to-menu - JHipster will add entities to the menu here */}
    </>
  );
};

export default EntitiesMenu;
