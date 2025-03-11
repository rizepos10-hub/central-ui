import { Tooltip } from 'primereact/tooltip';
import React, { useMemo, useContext, useEffect, useRef } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext, LayoutProvider } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import { useAppSelector } from "app/config/store";
import { hasAnyAuthority } from "app/shared/auth/private-route";
import { AUTHORITIES } from "app/config/constants";

const AppSubMenu = (props) => {
  const { layoutState, setBreadcrumbs } = useContext(LayoutContext);
  const tooltipRef = useRef<Tooltip | null>(null);
  const authorities = useAppSelector(state => state.authentication.account.authorities);

  useEffect(() => {
    if (tooltipRef.current) {
      tooltipRef.current.hide();
      (tooltipRef.current as any).updateTargetEvents();
    }

  }, [layoutState?.overlaySubmenuActive]);

  useEffect(() => {
    generateBreadcrumbs(props.model);

  }, []);

  const generateBreadcrumbs = (model: any) => {
    const breadcrumbs: any[] = [];

    const getBreadcrumb = (item: any, labels: string[] = []) => {
      const { label, to, items } = item;


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
    setBreadcrumbs(breadcrumbs);
  };

  const enhanceMenuModel = (model) => {
    const shortcuts = useAppSelector(state => state.shortcuts.shortcuts);

    return useMemo(() => {
      if (shortcuts.length > 0) {
        // Make a deep copy of the model to avoid mutating the original object
        const modelCopy = JSON.parse(JSON.stringify(model));

        const controlPanel = modelCopy.find(item => item.label === 'Control Panel');
        if (controlPanel && controlPanel.items) {
          const alreadyAdded = controlPanel.items.some(item => shortcuts.some(shortcut => shortcut.label === item.label));
          if (!alreadyAdded) {
            const dashboardIndex = controlPanel.items.findIndex(item => item.label === 'Dashboard');
            const insertIndex = dashboardIndex !== -1 ? dashboardIndex + 1 : controlPanel.items.length;
            controlPanel.items.splice(insertIndex, 0, ...shortcuts);
          }
        }
        return modelCopy;
      }
      return model;
    }, [model, shortcuts]);
  };

  const modelWithShortcuts = enhanceMenuModel(props.model);
  if (!props?.businessTypes?.types) return
  return (
    <MenuProvider>
      {<ul className="layout-menu">
        {modelWithShortcuts?.map((item, i) => {
          const hasRoleAccess = item?.role?.some(role => authorities?.includes(role));
          const hasBusinessTypeAccess = item?.type
            ? item.type.some(type => props?.businessTypes?.types?.includes(type))
            : true;
          const hasAccess = hasRoleAccess && hasBusinessTypeAccess;

          if (!hasAccess) {
            return null;
          }

          // const hasAccess = item?.role?.some(role => authorities?.includes(role));
          // if (!hasAccess) {
          //   return null;
          // }

          return !item?.seperator ? (
            <AppMenuitem item={item} root={true} index={i} key={item?.label} />
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
