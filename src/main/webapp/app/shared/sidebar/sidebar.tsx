import React from 'react';

import './sidebar.scss';
import SidebarTest from 'app/shared/sidebar/SidebarTest';

export interface ISideBarProps {
  isAuthenticated: boolean;
}
export const Sidebar = (props: ISideBarProps) => {
  let sidebarContent = <div className="sidebar invisible"></div>;
  if (props.isAuthenticated) {
    sidebarContent = <SidebarTest />;
  }

  return <div className="sidebar col-2">{sidebarContent}</div>;
};

export default Sidebar;
