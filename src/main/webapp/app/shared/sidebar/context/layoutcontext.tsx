import React, {useContext, useEffect, useState} from 'react';
import type { ChildContainerProps, LayoutContextProps, LayoutConfig, LayoutState, Breadcrumb } from '../types/types';
import {PrimeReactContext} from "primereact/api";

export const LayoutContext = React.createContext({} as LayoutContextProps);

export const LayoutProvider = (props: ChildContainerProps) => {
    const { changeTheme } = useContext(PrimeReactContext);
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
    const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({

        ripple: false,
        inputStyle: 'outlined',
        menuMode: 'reveal',
        menuTheme: 'primaryColor',
        colorScheme: 'dark',
        theme: 'indigo',
        scale: 14
    });

    const [layoutState, setLayoutState] = useState<LayoutState>({
        staticMenuDesktopInactive: false,
        overlayMenuActive: false,
        overlaySubmenuActive: false,
        profileSidebarVisible: false,
        configSidebarVisible: false,
        staticMenuMobileActive: false,
        menuHoverActive: false,
        resetMenu: false,
        sidebarActive: false,
        anchored: false
    });

  useEffect(() => {
    const storedLayoutConfig = localStorage.getItem('layoutConfig');
    if (storedLayoutConfig) {
      const parsedLayoutConfig = JSON.parse(storedLayoutConfig);
      const { colorScheme , theme} = parsedLayoutConfig;

      changeTheme?.(layoutConfig.theme, theme, "theme-link",
        () => {
          changeTheme?.(layoutConfig.colorScheme, colorScheme, "theme-link", () => {
            setLayoutConfig({...parsedLayoutConfig})
          })
        }
      );

    }

    const storedLayoutState = localStorage.getItem('layoutState');
    if (storedLayoutState) {
      setLayoutState(JSON.parse(storedLayoutState));
    }
  }, []);

  useEffect(() => {

    localStorage.setItem('layoutConfig', JSON.stringify(layoutConfig));
  }, [layoutConfig]);

  useEffect(() => {
    localStorage.setItem('layoutState', JSON.stringify(layoutState));
  }, [layoutState]);

    const onMenuToggle = () => {
        if (isOverlay()) {
            setLayoutState((prevLayoutState) => ({
                ...prevLayoutState,
                overlayMenuActive: !prevLayoutState.overlayMenuActive
            }));
        }

        if (isDesktop()) {
            setLayoutState((prevLayoutState) => ({
                ...prevLayoutState,
                staticMenuDesktopInactive: !prevLayoutState.staticMenuDesktopInactive
            }));
        } else {
            setLayoutState((prevLayoutState) => ({
                ...prevLayoutState,
                staticMenuMobileActive: !prevLayoutState.staticMenuMobileActive
            }));
        }
    };

    const showConfigSidebar = () => {
        setLayoutState((prevLayoutState) => ({
            ...prevLayoutState,
            configSidebarVisible: true
        }));
    };

    const showProfileSidebar = () => {
        setLayoutState((prevLayoutState) => ({
            ...prevLayoutState,
            profileSidebarVisible: !prevLayoutState.profileSidebarVisible
        }));
    };

    const isOverlay = () => {
        return layoutConfig.menuMode === 'overlay';
    };

    const isSlim = () => {
        return layoutConfig.menuMode === 'slim';
    };

    const isSlimPlus = () => {
        return layoutConfig.menuMode === 'slim-plus';
    };

    const isHorizontal = () => {
        return layoutConfig.menuMode === 'horizontal';
    };

    const isDesktop = () => {
        return window.innerWidth > 991;
    };

    const value = {
        layoutConfig,
        setLayoutConfig,
        layoutState,
        setLayoutState,
        onMenuToggle,
        showConfigSidebar,
        showProfileSidebar,
        isSlim,
        isSlimPlus,
        isHorizontal,
        isDesktop,
        breadcrumbs,
        setBreadcrumbs
    };

    return (
        <LayoutContext.Provider value={value}>
            <>
                <header>
                    <title>PrimeReact - APOLLO</title>
                    <meta charSet="UTF-8" />
                    <meta name="description" content="The ultimate collection of design-agnostic, flexible and accessible React UI Components." />
                    <meta name="robots" content="index, follow" />
                    <meta name="viewport" content="initial-scale=1, width=device-width" />
                    <meta property="og:type" content="website"></meta>
                    <meta property="og:title" content="Apollo by PrimeReact for NextJS"></meta>
                    <meta property="og:url" content="https://www.primefaces.org/apollo-react"></meta>
                    <meta property="og:description" content="The ultimate collection of design-agnostic, flexible and accessible React UI Components." />
                    <meta property="og:image" content="https://www.primefaces.org/static/social/apollo-react.png"></meta>
                    <meta property="og:ttl" content="604800"></meta>
                    <link rel="icon" href={`/favicon.ico`} type="image/x-icon"></link>
                </header>
                {props.children}
            </>
        </LayoutContext.Provider>
    );
};
