import React from "react";

import "./sidebar.scss";
import SidebarMenu from "app/shared/sidebar/SidebarMenu";

export interface ISideBarProps {
  isAuthenticated: boolean;
}
export const Sidebar = (props: ISideBarProps) => {

  let sidebarContent = (<div className="sidebar invisible"></div>);
  if (props.isAuthenticated) {
   sidebarContent = <SidebarMenu />;
  }

  return (
    <div className="sidebar col-2">
    {sidebarContent}
    </div>
  );
};

export default Sidebar;
