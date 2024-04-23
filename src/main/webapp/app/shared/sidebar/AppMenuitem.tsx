import { Ripple } from 'primereact/ripple';
import { classNames } from 'primereact/utils';
import React, { useContext, useEffect, useRef } from 'react';
import { LayoutContext } from './context/layoutcontext';
import { MenuContext } from './context/menucontext';
import type { AppMenuItemProps } from './types/types';
import { useSubmenuOverlayPosition } from './hooks/useSubmenuOverlayPosition';
import {Link, useLocation} from 'react-router-dom';
import {useAppSelector} from "app/config/store";


const AppMenuitem = (props: AppMenuItemProps) => {
    const { activeMenu, setActiveMenu } = useContext(MenuContext);
    const { isSlim, isSlimPlus, isHorizontal, isDesktop, setLayoutState, layoutState, layoutConfig } = useContext(LayoutContext);
    const location = useLocation();
    const submenuRef = useRef<HTMLUListElement>(null);
    const menuitemRef = useRef<HTMLLIElement>(null);
    const item = props.item;
    const key = props.parentKey ? props.parentKey + '-' + props.index : String(props.index);
    // console.log(key, 'keyyyyy')
    const path = location.pathname;
    const parts = path.split('/');
    const lastPath = parts[parts.length - 1];

    const isActiveRoute = item.to && path === item.to || (path + location.search) === item.to || path?.substring(1) === item.to;
    const account = useAppSelector(state => state.authentication.account);
    const userRole = account.authorities
    const active = activeMenu === key || !!(activeMenu && activeMenu.startsWith(key + '-'));

    useSubmenuOverlayPosition({
        target: menuitemRef.current,
        overlay: submenuRef.current,
        container: menuitemRef.current && menuitemRef.current.closest('.layout-menu-container'),
        when: props.root && active && (isSlim() || isSlimPlus() || isHorizontal()) && isDesktop()
    });

    useEffect(() => {
        if (layoutState.resetMenu) {
            setActiveMenu('');
            setLayoutState((prevLayoutState) => ({ ...prevLayoutState, resetMenu: false }));
        }
    }, [layoutState]);

  useEffect(() => {
    const onRouteChange = () => {
      const isRouteActive =
        item.to && (location.pathname + location.search) === item.to
        || (path + location.search) === item.to
        || path?.substring(1) === item.to;

      if (isRouteActive) {
        setActiveMenu(key);
        const activeRouteItem = menuitemRef.current?.querySelector('.active-menuitem .active-route');
        if (activeRouteItem) {
          activeRouteItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };

    onRouteChange();

    return () => {
      setActiveMenu("")
    };
  }, []);





  useEffect(() => {
    const onRouteChange = (newLocation) => {
      if (!(isSlim() || isHorizontal()) && item?.to && item.to === newLocation.pathname) {
        setActiveMenu(key);
      }
    };

    onRouteChange(location);

    const unlisten = () => {};

    return unlisten;
  }, [location, layoutConfig]);


  const itemClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        // avoid processing disabled items
        if (item.disabled) {
            event.preventDefault();
            return;
        }

        // navigate with hover
        if (props.root && (isSlim() || isHorizontal() || isSlimPlus())) {
            const isSubmenu = event.currentTarget.closest('.layout-root-menuitem.active-menuitem > ul') !== null;
            if (isSubmenu) setLayoutState((prevLayoutState) => ({ ...prevLayoutState, menuHoverActive: true }));
            else setLayoutState((prevLayoutState) => ({ ...prevLayoutState, menuHoverActive: !prevLayoutState.menuHoverActive }));
        }

        // execute command
        if (item?.command) {
            item?.command({ originalEvent: event, item });
        }

        // toggle active state
        if (item?.items && !(isSlim() || isSlimPlus())) {
            setActiveMenu(active ? props.parentKey : key);

            if (props.root && !active && (isHorizontal())) {
                setLayoutState((prevLayoutState) => ({ ...prevLayoutState, overlaySubmenuActive: true }));
            }
        } else {
            if (!isDesktop()) {
                setLayoutState((prevLayoutState) => ({ ...prevLayoutState, staticMenuMobileActive: !prevLayoutState.staticMenuMobileActive }));
            }

            if (isSlim() || isSlimPlus() || isHorizontal()) {
                setLayoutState((prevLayoutState) => ({ ...prevLayoutState, menuHoverActive: false }));
            }

            setActiveMenu(key);
        }
    };

    const onMouseEnter = () => {
        // activate item on hover
        if (props.root && (isSlim() || isHorizontal() || isSlimPlus()) && isDesktop()) {
            if (!active && layoutState.menuHoverActive) {
                setActiveMenu(key);
            }
        }
    };


    const badge = item?.badge ? (
        <span className={classNames('layout-menu-badge p-tag p-tag-rounded ml-2 uppercase', { [`${item?.badge}`]: true, 'p-tag-success': item?.badge === 'new', 'p-tag-info': item?.badge === 'updated' })}>{item?.badge}</span>
    ) : null;
  const subMenu =
    item?.items && item?.visible !== false ? (
      <ul ref={submenuRef}>
        {item?.items.map((child, i) => {
          if (child.role && child.role.length > 0) {
            const hasAccess = child.role.some(role => userRole.includes(role));
            if (!hasAccess) {
              return null
            }
          }
          // console.log(userRole, 'userRole');

          return (
            <AppMenuitem item={child} index={i} className={child.badgeClass} parentKey={key} key={child.label} />
          );
        })}
      </ul>
    ) : null;


    return (
        <li ref={menuitemRef} className={classNames({ 'layout-root-menuitem': props.root, 'active-menuitem': active })}>
            {props.root && item?.visible !== false && <div className="layout-menuitem-root-text">{item?.label}</div>}
            {(!item?.to || item?.items) && item?.visible !== false ? (
                <>
                    <a
                        href={item?.url}
                        onClick={(e) => itemClick(e)}
                        className={classNames(item?.class, 'p-ripple tooltip-target')}
                        target={item?.target}
                        data-pr-tooltip={item?.label}
                        data-pr-disabled={!(isSlim() && props.root && !layoutState.menuHoverActive)}
                        tabIndex={0}
                        style={{ fontWeight: isActiveRoute ? 'bold' : 'normal' }}
                        onMouseEnter={onMouseEnter}
                    >
                        <i className={classNames('layout-menuitem-icon', item?.icon)}></i>
                        <span className="layout-menuitem-text">{item?.label}</span>
                        {item?.items && <i className="pi pi-fw pi-angle-down layout-submenu-toggler"></i>}
                        <Ripple />
                    </a>
                </>
            ) : null}

            {item?.to && !item?.items && item?.visible !== false ? (
                <>
                    <Link   style={{ fontWeight: isActiveRoute ? 'bold' : 'normal' }} to={item?.to} replace={item?.replaceUrl} onClick={(e) => itemClick(e)} className={classNames(item?.class, 'p-ripple ', { 'active-route': isActiveRoute })} tabIndex={0} onMouseEnter={onMouseEnter}>
                        <i className={classNames('layout-menuitem-icon', item?.icon)}></i>
                        <span className="layout-menuitem-text">{item?.label}</span>
                        {badge}
                        {item?.items && <i className="pi pi-fw pi-angle-down layout-submenu-toggler"></i>}
                        <Ripple />
                    </Link>
                </>
            ) : null}
            {subMenu}
        </li>
    );
};

export default AppMenuitem;
