import { Tooltip } from 'primereact/tooltip';
import React, { useContext, useEffect, useRef } from 'react';
import AppMenuitem from './AppMenuitem';
import {LayoutContext, LayoutProvider} from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import {useAppSelector} from "app/config/store";
import {hasAnyAuthority} from "app/shared/auth/private-route";
import {AUTHORITIES} from "app/config/constants";

const AppSubMenu = (props) => {
    const { layoutState, setBreadcrumbs } = useContext(LayoutContext);
    const tooltipRef = useRef<Tooltip | null>(null);


  const isAdminRole = useAppSelector(state => hasAnyAuthority(state.authentication.account.authorities, [AUTHORITIES.ADMIN]));
  const isBusinessSettingsRole = useAppSelector(state => hasAnyAuthority(state.authentication.account.authorities, [AUTHORITIES.BUSINESS_SETTING]));

  const adminSideBarMenu = props.model;
  const businessSettingsSideBarMenu = props.model.map(item => {
    if (item.label === "Control Panel") {
      const settingsItem = {
        label: 'Control Panel',
        icon: 'pi pi-home',
        items: [
          {
            label: "Dashboard",
            icon: "pi pi-home",
            to: "/"
          },
          {
            label: "Settings",
            icon: "pi pi-book",
            items: [
              {
                label: "Business settings",
                icon: "pi pi-th-large",
                to: "/details",
              }
            ]
          },
        ]
      };
      return settingsItem;
    }
  });

  let menuToRender = [];

  switch (true) {
    case isAdminRole:
      menuToRender = adminSideBarMenu;
      break;
    case isBusinessSettingsRole:
      menuToRender = businessSettingsSideBarMenu;
      break;
    default:
      menuToRender = adminSideBarMenu
  }









  useEffect(() => {
        if (tooltipRef.current) {
            tooltipRef.current.hide();
            (tooltipRef.current as any).updateTargetEvents();
        }
      console.log(tooltipRef.current, 'tooltipRef')

    }, [layoutState?.overlaySubmenuActive]);

    useEffect(() => {
        generateBreadcrumbs(props.model);
      console.log(props.model, 'props.model')

    }, []);

    const generateBreadcrumbs = (model: any) => {
        let breadcrumbs: any[] = [];

        const getBreadcrumb = (item: any, labels: string[] = []) => {
            const { label, to, items } = item;

            console.log(item, 'labelo')

            label && labels.push(label);
            items &&
                items.forEach((_item) => {
                    getBreadcrumb(_item, labels.slice());
                });
            to && breadcrumbs.push({ labels, to });
        };

        model.forEach((item) => {
            getBreadcrumb(item);
        });
        console.log(breadcrumbs, 'breadcum')
        setBreadcrumbs(breadcrumbs);
    };

    return (
      <MenuProvider>
        {<ul className="layout-menu">
          {menuToRender.map((item, i) => {
            return !item?.seperator ? (
              <AppMenuitem item={item} root={true} index={i} key={item?.label}/>
            ) : (
              <li className="menu-separator"></li>
            );
          })}
        </ul>}
        <Tooltip ref={tooltipRef} target="li:not(.active-menuitem)>.tooltip-target" />
      </MenuProvider>
    );
};

export default AppSubMenu;
