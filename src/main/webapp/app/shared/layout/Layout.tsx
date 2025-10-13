import React, { useCallback, useContext, useEffect, useRef } from "react";

import "../sidebar/sidebar.scss";
import AppMenu from "app/shared/sidebar/AppMenu";
import { LayoutContext } from "app/shared/sidebar/context/layoutcontext";
import { classNames, DomHandler } from "primereact/utils";
import { useEventListener, useMountEffect, useResizeListener } from "primereact/hooks";
import PrimeReact from "primereact/api";
import ErrorBoundary from "app/shared/error/error-boundary";
import { useAppDispatch, useAppSelector } from "app/config/store";
import { getSession } from "app/shared/reducers/authentication";
import { hasAnyAuthority } from "app/shared/auth/private-route";
import { AUTHORITIES } from "app/config/constants";
import { toast, ToastContainer } from "react-toastify";
import AppTopbar from "app/shared/sidebar/AppTopbar";
import AppBreadCrumb from "app/shared/sidebar/AppBreadCrumb";
import AppProfileSidebar from "app/shared/sidebar/AppProfileSidebar";
import type { AppTopbarRef, ChildContainerProps } from '../sidebar/types/types';
import Footer from "app/shared/layout/footer/footer";
import { ConfirmDialog } from "primereact/confirmdialog";
import { getTenantFromURL } from "app/app";
import GuidedTour from "../components/guided-tour/guided-tour";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";




export const Layout = (props: ChildContainerProps) => {

  const { layoutConfig, layoutState, setLayoutState, isSlim, isSlimPlus, isHorizontal, isDesktop } = useContext(LayoutContext);
  const topbarRef = useRef<AppTopbarRef>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const containerClass = classNames({
    'layout-light': layoutConfig.colorScheme === 'light',
    'layout-dim': layoutConfig.colorScheme === 'dim',
    'layout-dark': layoutConfig.colorScheme === 'dark',
    'layout-colorscheme-menu': layoutConfig.menuTheme === 'colorScheme',
    'layout-primarycolor-menu': layoutConfig.menuTheme === 'primaryColor',
    'layout-transparent-menu': layoutConfig.menuTheme === 'transparent',
    'layout-overlay': layoutConfig.menuMode === 'overlay',
    'layout-static': layoutConfig.menuMode === 'static',
    'layout-slim': layoutConfig.menuMode === 'slim',
    'layout-slim-plus': layoutConfig.menuMode === 'slim-plus',
    'layout-horizontal': layoutConfig.menuMode === 'horizontal',
    'layout-reveal': layoutConfig.menuMode === 'reveal',
    'layout-drawer': layoutConfig.menuMode === 'drawer',
    'layout-static-inactive': layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static',
    'layout-overlay-active': layoutState.overlayMenuActive,
    'layout-mobile-active': layoutState.staticMenuMobileActive,
    'p-input-filled': layoutConfig.inputStyle === 'filled',
    'p-ripple-disabled': !layoutConfig.ripple,
    'layout-sidebar-active': layoutState.sidebarActive,
    'layout-sidebar-anchored': layoutState.anchored
  });

  const [bindMenuOutsideClickListener, unbindMenuOutsideClickListener] = useEventListener({
    type: 'click',
    listener(event) {
      const isOutsideClicked = !(
        sidebarRef.current?.isSameNode(event.target as Node) ||
        sidebarRef.current?.contains(event.target as Node) ||
        topbarRef.current?.menubutton?.isSameNode(event.target as Node) ||
        topbarRef.current?.menubutton?.contains(event.target as Node)
      );

      if (isOutsideClicked) {
        hideMenu();
      }
    }
  });

  const [bindDocumentResizeListener, unbindDocumentResizeListener] = useResizeListener({
    listener() {
      if (isDesktop() && !DomHandler.isTouchDevice()) {
        hideMenu();
      }
    }
  });

  let timeout: ReturnType<typeof setTimeout> | null = null;

  // const onMouseEnter = () => {
  //   if (!layoutState.anchored) {
  //     if (timeout) {
  //       clearTimeout(timeout);
  //       timeout = null;
  //     }
  //     setLayoutState((prevLayoutState) => ({ ...prevLayoutState, sidebarActive: true }));
  //   }
  // };
  //
  // const onMouseLeave = () => {
  //   if (!layoutState.anchored) {
  //     if (!timeout) {
  //       timeout = setTimeout(() => setLayoutState((prevLayoutState) => ({ ...prevLayoutState, sidebarActive: false })), 300);
  //     }
  //   }
  // };

  const hideMenu = useCallback(() => {
    setLayoutState((prevLayoutState) => ({
      ...prevLayoutState,
      overlayMenuActive: false,
      overlaySubmenuActive: false,
      staticMenuMobileActive: false,
      menuHoverActive: false,
      resetMenu: (isSlim() || isSlimPlus() || isHorizontal()) && isDesktop()
    }));
  }, [isSlim, isSlimPlus, isHorizontal, isDesktop, setLayoutState]);

  const blockBodyScroll = () => {
    if (document.body.classList) {
      document.body.classList.add('blocked-scroll');
    } else {
      document.body.className += ' blocked-scroll';
    }
  };

  const unblockBodyScroll = () => {
    if (document.body.classList) {
      document.body.classList.remove('blocked-scroll');
    } else {
      document.body.className = document.body.className.replace(new RegExp('(^|\\b)' + 'blocked-scroll'.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }
  };

  useMountEffect(() => {
    PrimeReact.ripple = true;
  });

  useEffect(() => {
    if (layoutState.overlayMenuActive || layoutState.staticMenuMobileActive || layoutState.overlaySubmenuActive) {
      // bindMenuOutsideClickListener();
    }

    if (layoutState.staticMenuMobileActive) {
      blockBodyScroll();
      (isSlim() || isSlimPlus() || isHorizontal()) && bindDocumentResizeListener();
    }

    return () => {
      // unbindMenuOutsideClickListener();
      unbindDocumentResizeListener();
      unblockBodyScroll();
    };
  }, [layoutState.overlayMenuActive, layoutState.staticMenuMobileActive, layoutState.overlaySubmenuActive]);

  const dispatch = useAppDispatch();

  const onMouseEnter = () => {
    if (!layoutState.anchored) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      setLayoutState((prevLayoutState) => ({
        ...prevLayoutState,
        sidebarActive: true,
      }));
    }
  };

  const onMouseLeave = () => {
    if (!layoutState.anchored) {
      if (!timeout) {
        timeout = setTimeout(
          () =>
            setLayoutState((prevLayoutState) => ({
              ...prevLayoutState,
              sidebarActive: false,
            })),
          300
        );
      }
    }
  };



  useEffect(() => {
    dispatch(getSession());
  }, []);

  const currentLocale = useAppSelector(state => state.locale.currentLocale);
  const isAuthenticated = useAppSelector(state => state.authentication.isAuthenticated);
  const isAdmin = useAppSelector(state => hasAnyAuthority(state.authentication.account.authorities, [AUTHORITIES.ADMIN]));
  const ribbonEnv = useAppSelector(state => state.applicationProfile.ribbonEnv);
  const isInProduction = useAppSelector(state => state.applicationProfile.inProduction);
  const isOpenAPIEnabled = useAppSelector(state => state.applicationProfile.isOpenAPIEnabled);



  const tenant = getTenantFromURL();

  return (
    <React.Fragment>
      {isAuthenticated && tenant ? (
        <SidebarProvider>
          <div className={classNames('layout-container flex min-h-screen w-full', containerClass)}>
            <AppMenu />

            <SidebarInset className="flex-1">
              <AppTopbar ref={topbarRef} />

              <div className="layout-wrapper">
                <ConfirmDialog />
                <GuidedTour />
                <ToastContainer position={toast.POSITION.BOTTOM_RIGHT} className="toastify-container" toastClassName="toastify-toast" />

                <ErrorBoundary>
                  <div className="layout-content">{props.children}</div>
                </ErrorBoundary>
              </div>

              <Footer />
            </SidebarInset>
          </div>
        </SidebarProvider>
      ) : (
        <div className={classNames('layout-container', containerClass)}>
          <div className="layout-wrapper" style={{ height: '100%' }}>
            <ConfirmDialog />
            <ToastContainer position={toast.POSITION.BOTTOM_RIGHT} className="toastify-container" toastClassName="toastify-toast" />
            <ErrorBoundary>
              <div className="layout-content">{props.children}</div>
            </ErrorBoundary>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default Layout;
