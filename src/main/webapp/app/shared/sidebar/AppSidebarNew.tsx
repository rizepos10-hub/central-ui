import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { model, MenuItem } from './AppMenu';
import { useAppSelector } from 'app/config/store';
import { cn } from '@/src/main/webapp/app/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Home,
  Monitor,
  Users,
  Tag,
  BookOpen,
  Tags,
  Package,
  DollarSign,
  Wallet,
  BarChart3,
  Tablet,
  Banknote,
  Settings,
  ChevronRight,
  ChevronDown,
  Command,
  Circle,
  Newspaper,
  Utensils,
  MonitorSmartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlobalSearch from '../components/global-search/global-search';

interface AppSidebarNewProps {
  businessTypes?: any;
}

// Icon mapping from PrimeReact to Lucide
const iconMap: Record<string, React.ElementType> = {
  'pi pi-home': Home,
  'pi pi-desktop': Monitor,
  'pi pi-user': Users,
  'pi pi-ticket': Tag,
  'pi pi-book': BookOpen,
  'pi pi-utensils': Utensils,
  'pi pi-tags': Tags,
  'pi pi-box': Package,
  'pi pi-users': Users,
  'pi pi-dollar': DollarSign,
  'pi pi-wallet': Wallet,
  'pi pi-chart-bar': Newspaper,
  ' pi pi-chart-bar': Newspaper,
  'pi pi-tablet': Tablet,
  'pi pi-monitor': MonitorSmartphone,
  'pi pi-money-bill': Banknote,
  'pi pi-cog': Settings,
};

const getIconComponent = (iconClass?: string): React.ElementType => {
  if (!iconClass) return Settings;
  return iconMap[iconClass] || Settings;
};

const AppSidebarNew: React.FC<AppSidebarNewProps> = ({ businessTypes }) => {
  const { state, setOpen } = useSidebar();
  const [activeMainMenu, setActiveMainMenu] = useState<string>('');
  const [expandedSubmenus, setExpandedSubmenus] = useState<Set<string>>(new Set());
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [tourState, setTourState] = useState<{ isActive: boolean; waitingForSave: boolean; stepIndex: number }>({
    isActive: false,
    waitingForSave: false,
    stepIndex: 0,
  });
  const location = useLocation();
  const navigate = useNavigate();
  const authorities = useAppSelector(state => state.authentication.account?.authorities || []);

  // Get shortcuts from Redux state
  const shortcuts = useAppSelector(state => state.shortcuts.shortcuts);

  // LocalStorage keys
  const STORAGE_KEYS = {
    activeMainMenu: 'sidebar_active_main_menu',
    expandedSubmenus: 'sidebar_expanded_submenus',
  };

  // Tour-related keys (same as guided tour component)
  const TOUR_STORAGE_KEYS = {
    completed: 'setup_tour_completed',
    currentStep: 'tour_current_step',
  };

  // Enhance menu model with shortcuts
  const enhanceMenuModel = (model: MenuItem[]) => {
    return useMemo(() => {
      if (shortcuts.length > 0) {
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

  const modelWithShortcuts = enhanceMenuModel(model);

  // Filter menu items based on user access
  const getFilteredMenuItems = (items: MenuItem[]) => {
    return items.filter(item => {
      const hasRoleAccess = !item.role || item.role.length === 0 || item.role.some(role => authorities.includes(role));
      const hasBusinessTypeAccess =
        !item.type || item.type.length === 0 || (businessTypes?.types && item.type.some(type => businessTypes.types.includes(type))) || true;
      return hasRoleAccess && hasBusinessTypeAccess;
    });
  };

  const filteredMainMenuItems = getFilteredMenuItems(modelWithShortcuts);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedActiveMenu = localStorage.getItem(STORAGE_KEYS.activeMainMenu);
    const savedExpandedSubmenus = localStorage.getItem(STORAGE_KEYS.expandedSubmenus);

    if (savedActiveMenu) {
      setActiveMainMenu(savedActiveMenu);
    }

    if (savedExpandedSubmenus) {
      try {
        const expandedArray = JSON.parse(savedExpandedSubmenus);
        setExpandedSubmenus(new Set(expandedArray));
      } catch (e) {
        console.warn('Failed to parse expanded submenus from localStorage');
      }
    }

    // Auto-open menu based on current route if no saved state
    if (!savedActiveMenu) {
      filteredMainMenuItems.forEach((item, index) => {
        if (item.items) {
          const hasMatchingRoute = item.items.some(subItem => isActiveRoute(subItem.to));
          if (hasMatchingRoute) {
            setActiveMainMenu(index.toString());
          }
        } else if (isActiveRoute(item.to)) {
          setActiveMainMenu(index.toString());
        }
      });
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.activeMainMenu, activeMainMenu);
  }, [activeMainMenu]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.expandedSubmenus, JSON.stringify(Array.from(expandedSubmenus)));
  }, [expandedSubmenus]);

  // Monitor tour state from localStorage
  useEffect(() => {
    const checkTourState = () => {
      const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEYS.completed) === 'true';
      const currentStep = localStorage.getItem(TOUR_STORAGE_KEYS.currentStep);

      if (!tourCompleted && currentStep) {
        const stepIndex = parseInt(currentStep, 10);
        const waitingForSave = stepIndex === 3 || stepIndex === 6;

        const newTourState = { isActive: true, waitingForSave, stepIndex };

        setTourState(prevState => {
          if (
            prevState.isActive !== newTourState.isActive ||
            prevState.waitingForSave !== newTourState.waitingForSave ||
            prevState.stepIndex !== newTourState.stepIndex
          ) {
            return newTourState;
          }
          return prevState;
        });

        if (stepIndex >= 1 && stepIndex <= 6) {
          const settingsIndex = filteredMainMenuItems.findIndex(item => item.label === 'Settings');
          if (settingsIndex !== -1) {
            setActiveMainMenu(prev => (prev !== settingsIndex.toString() ? settingsIndex.toString() : prev));
          }
        }
      } else {
        setTourState(prevState => {
          if (prevState.isActive || prevState.waitingForSave || prevState.stepIndex !== 0) {
            return { isActive: false, waitingForSave: false, stepIndex: 0 };
          }
          return prevState;
        });
      }
    };

    checkTourState();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TOUR_STORAGE_KEYS.currentStep || e.key === TOUR_STORAGE_KEYS.completed) {
        checkTourState();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    let pollInterval: number | null = null;
    if (!tourState.isActive) {
      pollInterval = setInterval(checkTourState, 2000);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [filteredMainMenuItems, tourState.isActive]);

  // Check if a route is active
  const isActiveRoute = (to: string) => {
    if (!to) return false;
    return location.pathname === to || location.pathname.startsWith(to + '/');
  };

  // Helper function to get data-tour attribute
  const getDataTourAttribute = (item: MenuItem) => {
    if (item?.label === 'Settings') return 'settings-menu';
    if (item?.label === 'Currencies' && item?.to === '/currencies') return 'currencies-menu';
    if (item?.label === 'Business Information' && item?.to === '/details') return 'business-info-menu';
    return undefined;
  };

  // Toggle submenu expansion
  const toggleSubmenu = (key: string) => {
    const newExpanded = new Set(expandedSubmenus);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSubmenus(newExpanded);
  };

  // Check if navigation is blocked by tour
  const isNavigationBlocked = () => {
    const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEYS.completed) === 'true';
    const currentStep = localStorage.getItem(TOUR_STORAGE_KEYS.currentStep);
    const stepIndex = currentStep ? parseInt(currentStep, 10) : 0;
    return !tourCompleted && (stepIndex === 3 || stepIndex === 6);
  };

  // Render submenu items recursively
  const renderSubmenuItems = (items: MenuItem[], parentKey: string, level = 0) => {
    const filteredItems = getFilteredMenuItems(items);

    return filteredItems.map((item, index) => {
      const itemKey = `${parentKey}-${index}`;
      const hasSubitems = item.items && item.items.length > 0;
      const isExpanded = expandedSubmenus.has(itemKey);
      const isActive = isActiveRoute(item.to);
      const isBlocked = isNavigationBlocked();

      const isTourTarget =
        tourState.isActive &&
        ((tourState.stepIndex >= 1 && tourState.stepIndex <= 3 && item.to === '/details') ||
          (tourState.stepIndex >= 4 && tourState.stepIndex <= 6 && item.to === '/currencies'));

      if (hasSubitems) {
        return (
          <SidebarMenuItem key={itemKey}>
            <SidebarMenuButton
              onClick={() => {
                if (isBlocked) {
                  console.log('Submenu expansion blocked - please complete the current step first');
                  return;
                }
                toggleSubmenu(itemKey);
              }}
              className={cn(
                'justify-between h-9 px-3 hover:bg-sidebar-accent transition-colors !text-sidebar-accent-foreground',
                isExpanded && 'bg-sidebar-accent font-medium'
              )}
            >
              <span className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm truncate">{item.label}</span>
              </span>
              {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
            </SidebarMenuButton>
            {isExpanded && (
              <SidebarMenuSub className="ml-2 border-l-2 border-sidebar-accent pl-2 mt-1 mb-1 space-y-1 overflow-hidden">
                {item.items?.map((subItem, subIndex) => {
                  const subItemKey = `${itemKey}-${subIndex}`;
                  const subHasChildren = subItem.items && subItem.items.length > 0;

                  // Check role and business type access for sub-items
                  const hasRoleAccess = !subItem.role || subItem.role.length === 0 || subItem.role.some(role => authorities.includes(role));
                  const hasBusinessTypeAccess =
                    !subItem.type || subItem.type.length === 0 || (businessTypes?.types && subItem.type.some(type => businessTypes.types.includes(type))) || true;

                  if (!hasRoleAccess || !hasBusinessTypeAccess) {
                    return null;
                  }

                  if (subHasChildren) {
                    const subIsExpanded = expandedSubmenus.has(subItemKey);
                    const subIsActive = isActiveRoute(subItem.to);

                    return (
                      <SidebarMenuSubItem key={subItemKey}>
                        <SidebarMenuSubButton
                          onClick={() => {
                            if (isBlocked) {
                              console.log('Submenu expansion blocked - please complete the current step first');
                              return;
                            }
                            toggleSubmenu(subItemKey);
                          }}
                          className={cn(
                            'h-8 px-3 hover:bg-sidebar-accent/70 transition-colors rounded-md justify-between !text-sidebar-accent-foreground',
                            subIsExpanded && 'bg-sidebar-accent/70 font-medium'
                          )}
                        >
                          <span className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-sm truncate">{subItem.label}</span>
                          </span>
                          {subIsExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                        </SidebarMenuSubButton>
                        {subIsExpanded && (
                          <div className="ml-2 border-l-2 border-sidebar-accent/50 pl-2 mt-1 space-y-1 overflow-hidden">
                            {subItem.items?.map((nestedItem, nestedIndex) => {
                              const nestedItemKey = `${subItemKey}-${nestedIndex}`;
                              const nestedIsActive = isActiveRoute(nestedItem.to);

                              return (
                                <div key={nestedItemKey} className="py-0.5">
                                  <Link
                                    to={isBlocked ? '#' : nestedItem.to}
                                    className={cn(
                                      'flex items-center gap-2 h-7 px-3 rounded-md text-sm hover:bg-sidebar-accent/70 transition-colors !text-sidebar-accent-foreground',
                                      nestedIsActive && 'bg-primary/10 font-medium hover:bg-primary/15'
                                    )}
                                    onClick={(e) => {
                                      if (isBlocked) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('Navigation blocked - please complete the current step first');
                                        return false;
                                      }
                                    }}
                                  >
                                    <span className="truncate">{nestedItem.label}</span>
                                  </Link>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </SidebarMenuSubItem>
                    );
                  }

                  const subIsActive = isActiveRoute(subItem.to);
                  const subIsTourTarget =
                    tourState.isActive &&
                    ((tourState.stepIndex >= 1 && tourState.stepIndex <= 3 && subItem.to === '/details') ||
                      (tourState.stepIndex >= 4 && tourState.stepIndex <= 6 && subItem.to === '/currencies'));

                  return (
                    <SidebarMenuSubItem key={subItemKey}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={subIsActive}
                        className={cn(
                          'h-8 px-3 hover:bg-sidebar-accent/70 transition-colors rounded-md',
                          subIsActive && 'bg-primary/10 font-medium text-primary hover:bg-primary/15',
                          subIsTourTarget && 'tour-target',
                          isBlocked && 'blocked'
                        )}
                      >
                        <Link
                          to={isBlocked ? '#' : subItem.to}
                          data-tour={getDataTourAttribute(subItem)}
                          onClick={(e) => {
                            if (isBlocked) {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Navigation blocked - please complete the current step first');
                              return false;
                            }
                          }}
                        >
                          <span className="text-sm truncate">{subItem.label}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  );
                })}
              </SidebarMenuSub>
            )}
          </SidebarMenuItem>
        );
      }

      return (
        <SidebarMenuItem key={itemKey}>
          <SidebarMenuButton
            asChild
            isActive={isActive}
            className={cn(
              'h-9 px-3 hover:bg-sidebar-accent transition-colors',
              isActive && 'bg-primary/10 font-medium text-primary hover:bg-primary/15',
              isTourTarget && 'tour-target',
              isBlocked && 'blocked'
            )}
          >
            <Link
              to={isBlocked ? '#' : item.to}
              data-tour={getDataTourAttribute(item)}
              onClick={(e) => {
                if (isBlocked) {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Navigation blocked - please complete the current step first');
                  return false;
                }
              }}
              className="flex items-center gap-2 min-w-0"
            >
              {item.icon && React.createElement(getIconComponent(item.icon), { className: "h-4 w-4 text-muted-foreground flex-shrink-0" })}
              <span className="text-sm truncate">{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });
  };

  // Get the active main menu item
  const getActiveMainMenuItem = () => {
    if (!activeMainMenu) return null;
    const index = parseInt(activeMainMenu, 10);
    return filteredMainMenuItems[index] || null;
  };

  const activeMenuItem = getActiveMainMenuItem();

  return (
    <>
      <GlobalSearch data={modelWithShortcuts} isOpen={isGlobalSearchOpen} setIsOpen={setIsGlobalSearchOpen} />
      <Sidebar collapsible="icon" className="[&>[data-sidebar=sidebar]]:flex-row overflow-hidden">
        {/* Icon sidebar (first) */}
        <Sidebar collapsible="none" className="!w-[calc(var(--sidebar-width-icon)+1px)] border-r">
          <SidebarHeader className="h-12 border-b p-0 flex items-center justify-center">
            <Button
              variant="default"
              size="icon"
              className="w-full h-full rounded-none bg-primary hover:bg-primary/90"
              onClick={() => setIsGlobalSearchOpen(true)}
            >
              <Command className="h-5 w-5" />
            </Button>
          </SidebarHeader>

          <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredMainMenuItems.map((item, index) => {
                  const isActive = activeMainMenu === index.toString();
                  const hasActiveRoute = item.items
                    ? item.items.some(subitem => isActiveRoute(subitem.to))
                    : isActiveRoute(item.to);
                  const IconComponent = getIconComponent(item.icon);
                  const isBlocked = isNavigationBlocked();

                  return (
                    <SidebarMenuItem key={index}>
                      <SidebarMenuButton
                        tooltip={{ children: item.label, hidden: false }}
                        onClick={() => {
                          if (isBlocked && !isActive) {
                            console.log('Navigation blocked - please complete the current step first');
                            return;
                          }

                          // If sidebar is collapsed, expand it first
                          if (state === "collapsed") {
                            setOpen(true);
                          }

                          // Always set active menu - don't toggle off when clicking same item
                          setActiveMainMenu(index.toString());

                          if (!tourState.isActive) {
                            const isOnChildRoute = item.items && item.items.some(subItem => subItem.to && isActiveRoute(subItem.to));

                            if (!isOnChildRoute) {
                              if (item.items && item.items.length > 0) {
                                const firstAccessibleItem = item.items.find(subItem => {
                                  const hasRoleAccess =
                                    !subItem.role || subItem.role.length === 0 || subItem.role.some(role => authorities.includes(role));
                                  const hasBusinessTypeAccess =
                                    !subItem.type ||
                                    subItem.type.length === 0 ||
                                    (businessTypes?.types && subItem.type.some(type => businessTypes.types.includes(type))) ||
                                    true;
                                  return hasRoleAccess && hasBusinessTypeAccess && subItem.to;
                                });

                                if (firstAccessibleItem?.to) {
                                  navigate(firstAccessibleItem.to);
                                }
                              } else if (item.to) {
                                navigate(item.to);
                              }
                            }
                          }
                        }}
                        isActive={isActive || hasActiveRoute}
                        data-tour={getDataTourAttribute(item)}
                      >
                        <IconComponent />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* Submenu sidebar (second) */}
      {activeMenuItem && state === "expanded" && (
        <Sidebar collapsible="none" className="!w-56 !min-w-56 !max-w-56 border-r">
          <SidebarHeader className="h-12 border-b flex items-center justify-center bg-sidebar-accent/50 px-2">
            <div className="flex items-center gap-2 min-w-0 w-full overflow-hidden">
              {activeMenuItem.icon && React.createElement(getIconComponent(activeMenuItem.icon), { className: "h-4 w-4 text-primary flex-shrink-0" })}
              <span className="text-xs font-semibold tracking-wide truncate">{activeMenuItem.label}</span>
            </div>
          </SidebarHeader>

          <SidebarContent className="overflow-y-auto overflow-x-hidden">
            <SidebarGroup>
              <SidebarGroupContent className="px-2">
                <SidebarMenu className="w-full overflow-hidden">
                  {activeMenuItem.items && activeMenuItem.items.length > 0 ? (
                    renderSubmenuItems(activeMenuItem.items, `main-${activeMainMenu}`)
                  ) : (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={isActiveRoute(activeMenuItem.to)}
                      >
                        <Link
                          to={isNavigationBlocked() ? '#' : activeMenuItem.to}
                          data-tour={getDataTourAttribute(activeMenuItem)}
                          onClick={(e) => {
                            if (isNavigationBlocked()) {
                              e.preventDefault();
                              console.log('Navigation blocked - please complete the current step first');
                              return;
                            }
                          }}
                        >
                          <span>{activeMenuItem.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      )}
      </Sidebar>
    </>
  );
};

export default AppSidebarNew;
