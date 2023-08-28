import { ObjectUtils } from 'primereact/utils';
import React, { useContext, useEffect, useState } from 'react';
import { LayoutContext } from './context/layoutcontext';
import type { AppBreadcrumbProps, Breadcrumb } from './types/types';
import {useLocation} from "react-router-dom";

const AppBreadcrumb = (props: AppBreadcrumbProps) => {
  const location = useLocation();
    const [breadcrumb, setBreadcrumb] = useState<Breadcrumb | null>(null);
    const { breadcrumbs } = useContext(LayoutContext);

  useEffect(() => {
    const filteredBreadcrumbs = breadcrumbs?.find((crumb) => {
      return crumb.to?.replace(/\/$/, '') === location.pathname.replace(/\/$/, '');
    });
    console.log("im bread", breadcrumbs)
    setBreadcrumb(filteredBreadcrumbs ?? null);
  }, [location.pathname, breadcrumbs]);

    return (
        <div className={props.className}>
            <nav className="layout-breadcrumb">
                <ol>
                    {ObjectUtils.isNotEmpty(breadcrumb?.labels)
                        ? breadcrumb?.labels?.map((label, index) => {
                              if (index !== 0) {
                                  return (
                                      <React.Fragment key={index}>
                                          <li className="layout-breadcrumb-chevron"> / </li>
                                          <li key={index}>{label}</li>
                                      </React.Fragment>
                                  );
                              }
                              return <li key={index}>{label}</li>;
                          })
                        : null}
                </ol>
            </nav>
        </div>
    );
};

export default AppBreadcrumb;
