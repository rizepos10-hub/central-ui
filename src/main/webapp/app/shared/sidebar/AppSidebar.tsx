import React, { useContext } from 'react';
import AppMenu from './AppMenu';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import {Link} from "react-router-dom";
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import 'primereact/resources/primereact.css';
const AppSidebar = () => {
    const { setLayoutState,layoutConfig } = useContext(LayoutContext);

    const width = layoutConfig.menuMode === "slim-plus" ? 75 : 150;
    const normalLogo = "/content/images/rize-pos-align-left.png";
    const smallLogo = "/content/images/spinner-logo.png"
    const anchor = () => {
        setLayoutState((prevLayoutState) => ({ ...prevLayoutState, anchored: !prevLayoutState.anchored }));
    };
    return (
        <>
            <div className="sidebar-header" >
                <Link to="/" className="app-logo">
                  <img  src={normalLogo} alt="logo" width={150} height={32}  className="app-logo-normal" />
                  <img src={smallLogo} alt="logo" width={18} height={25}  className="app-logo-small" />
                </Link>
                <button className="layout-sidebar-anchor p-link z-2 mb-2" type="button" onClick={anchor}></button>
            </div>

            <div className="layout-menu-container">
                <MenuProvider>
                    <AppMenu />
                </MenuProvider>
            </div>
        </>
    );
};

export default AppSidebar;
