import './header.scss';

import React, { useState, useEffect } from 'react';
import { Translate, Storage } from 'react-jhipster';
import LoadingBar from 'react-redux-loading-bar';

import { isRTL } from 'app/config/translation';
import { Home, Brand } from './header-components';
import { AdminMenu, EntitiesMenu, AccountMenu, LocaleMenu } from '../menus';
import { useAppDispatch } from 'app/config/store';
import { setLocale } from 'app/shared/reducers/locale';
import { cn } from '@/src/main/webapp/app/lib/utils';
import { Menu } from 'lucide-react';

export interface IHeaderProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
  ribbonEnv: string;
  isInProduction: boolean;
  isOpenAPIEnabled: boolean;
  currentLocale: string;
}

const Header = (props: IHeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => document.querySelector('html').setAttribute('dir', isRTL(Storage.session.get('locale')) ? 'rtl' : 'ltr'));

  const dispatch = useAppDispatch();

  const handleLocaleChange = event => {
    const langKey = event.target.value;
    Storage.session.set('locale', langKey);
    dispatch(setLocale(langKey));
    document.querySelector('html').setAttribute('dir', isRTL(langKey) ? 'rtl' : 'ltr');
  };

  const renderDevRibbon = () =>
    props.isInProduction === false ? (
      <div className="ribbon dev">
        <a href="">
          <Translate contentKey={`global.ribbon.${props.ribbonEnv}`} />
        </a>
      </div>
    ) : null;

  const toggleMenu = () => setMenuOpen(!menuOpen);

  /* jhipster-needle-add-element-to-menu - JHipster will add new menu items here */

  return (
    <div id="app-header">
      {renderDevRibbon()}
      <LoadingBar className="loading-bar" />
      <nav data-cy="navbar" className={cn("jh-navbar", "fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-4 py-2")}>
        <button
          aria-label="Menu"
          onClick={toggleMenu}
          className="jh-navbar-toggler md:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
        <Brand />
        <div className={cn(
          "flex items-center gap-2",
          "max-md:absolute max-md:top-full max-md:left-0 max-md:right-0 max-md:bg-[#353d47] max-md:flex-col max-md:items-stretch",
          !menuOpen && "max-md:hidden"
        )}>
          <div id="header-tabs" className="flex items-center gap-2 max-md:flex-col max-md:items-stretch max-md:p-2">
            <Home />
            {props.isAuthenticated && <EntitiesMenu />}
            {props.isAuthenticated && props.isAdmin && <AdminMenu showOpenAPI={props.isOpenAPIEnabled} />}
            <LocaleMenu currentLocale={props.currentLocale} onClick={handleLocaleChange} />
            <AccountMenu isAuthenticated={props.isAuthenticated} />
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Header;
