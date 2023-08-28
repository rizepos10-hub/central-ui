import { InputText } from 'primereact/inputtext';
import React, { forwardRef, useContext, useImperativeHandle, useRef } from 'react';
import AppBreadcrumb from './AppBreadCrumb';
import { LayoutContext } from './context/layoutcontext';

import { Button } from 'primereact/button';
import {AppTopbarRef} from "app/shared/sidebar/types/layout";

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { onMenuToggle, showProfileSidebar, showConfigSidebar } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);

    const onConfigButtonClick = () => {
        showConfigSidebar();
    };

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current
    }));

    return (
        <div className="layout-topbar">
            <div className="topbar-start">
                <button ref={menubuttonRef} type="button" className="topbar-menubutton p-link p-trigger" onClick={onMenuToggle}>
                    <i className="pi pi-bars"></i>
                </button>

                <AppBreadcrumb className="topbar-breadcrumb"></AppBreadcrumb>
            </div>

            <div className="topbar-end">
                <ul className="topbar-menu">
                    <li className="topbar-search">
                        <span className="p-input-icon-left">
                            <i className="pi pi-search"></i>
                            <InputText type="text" placeholder="Search" className="w-12rem sm:w-full" />
                        </span>
                    </li>
                    <li className="ml-3">
                        {/* <Button type="button" icon="pi pi-cog" text rounded className="p-button-text p-button-secondary flex-shrink-0" onClick={onConfigButtonClick}></Button> */}
                    </li>
                    <li className="topbar-profile">
                        <button type="button" className="p-link" onClick={showProfileSidebar}>
                            <img src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?cs=srgb&dl=pexels-pixabay-220453.jpg&fm=jpg" alt="Profile" />
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
