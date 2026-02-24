import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { model, MenuItem } from './AppMenu';
import { useAppSelector } from 'app/config/store';
import './NewSidebar.scss';
import { cn } from '@/src/main/webapp/app/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface NewSidebarProps {
  businessTypes?: any;
}

const NewSidebar: React.FC<NewSidebarProps> = ({ businessTypes }) => {
  const [activeMainMenu, setActiveMainMenu] = useState<string>('');
  const [expandedSubmenus, setExpandedSubmenus] = useState<Set<string>>(new Set());
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [tourState, setTourState] = useState<{ isActive: boolean; waitingForSave: boolean; stepIndex: number }>({
    isActive: false,
    waitingForSave: false,
    stepIndex: 0
  });
  const location = useLocation();
  const navigate = useNavigate();
  const authorities = useAppSelector(state => state.authentication.account?.authorities || []);
  const hasMatchingRoles = (roles?: MenuItem['role']) => !roles || roles.length === 0 || roles.some(role => authorities.includes(role));
  const hasMatchingBusinessTypes = (types?: MenuItem['type']) =>
    !types ||
    types.length === 0 ||
    (businessTypes?.types && types.some(type => businessTypes.types.includes(type))) ||
    true;
  
  // Get shortcuts from Redux state
  const shortcuts = useAppSelector(state => state.shortcuts.shortcuts);

  // LocalStorage keys
  const STORAGE_KEYS = {
    activeMainMenu: 'sidebar_active_main_menu',
    expandedSubmenus: 'sidebar_expanded_submenus',
    sidebarCollapsed: 'sidebar_collapsed'
  };

  // Tour-related keys (same as guided tour component)
  const TOUR_STORAGE_KEYS = {
    completed: 'setup_tour_completed',
    currentStep: 'tour_current_step'
  };

  // Enhance menu model with shortcuts (similar to old sidebar implementation)
  const enhanceMenuModel = (model: MenuItem[]) => {
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

  const modelWithShortcuts = enhanceMenuModel(model);

  // Filter menu items based on user access
  const getFilteredMenuItems = (items: MenuItem[]) => {
    return items.filter(item => hasMatchingRoles(item.role) && hasMatchingBusinessTypes(item.type));
  };

  const filteredMainMenuItems = getFilteredMenuItems(modelWithShortcuts);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedActiveMenu = localStorage.getItem(STORAGE_KEYS.activeMainMenu);
    const savedExpandedSubmenus = localStorage.getItem(STORAGE_KEYS.expandedSubmenus);
    const savedCollapsed = localStorage.getItem(STORAGE_KEYS.sidebarCollapsed);

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

    if (savedCollapsed) {
      setSidebarCollapsed(JSON.parse(savedCollapsed));
    }

    // Auto-open menu based on current route if no saved state
    if (!savedActiveMenu && !savedCollapsed) {
      const currentPath = location.pathname;
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

    // Set initial margin
    const contentWrapper = document.querySelector('.layout-content-wrapper');
    if (contentWrapper) {
      const baseMargin = window.innerWidth <= 768 ? 60 : 80;
      (contentWrapper as HTMLElement).style.marginLeft = `${baseMargin}px`;
    }
  }, []);

  // Save activeMainMenu to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.activeMainMenu, activeMainMenu);
  }, [activeMainMenu]);

  // Save expandedSubmenus to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.expandedSubmenus, JSON.stringify(Array.from(expandedSubmenus)));
  }, [expandedSubmenus]);

  // Save sidebar collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.sidebarCollapsed, JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);



  // Monitor tour state from localStorage
  useEffect(() => {
    const checkTourState = () => {
      const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEYS.completed) === 'true';
      const currentStep = localStorage.getItem(TOUR_STORAGE_KEYS.currentStep);
      
      if (!tourCompleted && currentStep) {
        const stepIndex = parseInt(currentStep, 10);
        // Steps 3 and 6 are save steps where tour is paused and waiting for save
        const waitingForSave = stepIndex === 3 || stepIndex === 6;
        
        console.log('🔍 [NewSidebar] Tour state calculation:', {
          stepIndex,
          waitingForSave,
          isStep3: stepIndex === 3,
          isStep6: stepIndex === 6
        });
        
        const newTourState = {
          isActive: true,
          waitingForSave,
          stepIndex
        };

        // Only update if state actually changed to prevent infinite loops
        setTourState(prevState => {
          if (prevState.isActive !== newTourState.isActive || 
              prevState.waitingForSave !== newTourState.waitingForSave || 
              prevState.stepIndex !== newTourState.stepIndex) {
            return newTourState;
          }
          return prevState;
        });

        // Auto-open Settings submenu for tour steps that require Settings pages
        if (stepIndex === 1 || stepIndex === 2 || stepIndex === 3 || stepIndex === 4 || stepIndex === 5 || stepIndex === 6) {
          // Find Settings menu index
          const settingsIndex = filteredMainMenuItems.findIndex(item => item.label === 'Settings');
          if (settingsIndex !== -1) {
            setActiveMainMenu(prev => prev !== settingsIndex.toString() ? settingsIndex.toString() : prev);
          }
        }
      } else {
        setTourState(prevState => {
          if (prevState.isActive || prevState.waitingForSave || prevState.stepIndex !== 0) {
            return {
              isActive: false,
              waitingForSave: false,
              stepIndex: 0
            };
          }
          return prevState;
        });
      }
    };

    // Initial check
    checkTourState();

    // Listen for localStorage changes (when tour state updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TOUR_STORAGE_KEYS.currentStep || e.key === TOUR_STORAGE_KEYS.completed) {
        checkTourState();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Reduced polling frequency and only poll when needed
    let pollInterval: number | null = null;
    if (!tourState.isActive) {
      pollInterval = setInterval(checkTourState, 2000); // Slower polling when tour not active
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (pollInterval) {
        clearInterval(pollInterval);
      }
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

  // Render submenu items recursively
  const renderSubmenuItems = (items: MenuItem[], parentKey: string, level = 0) => {
    const filteredItems = getFilteredMenuItems(items);
    
    return filteredItems.map((item, index) => {
      const itemKey = `${parentKey}-${index}`;
      const hasSubitems = item.items && item.items.length > 0;
      const isExpanded = expandedSubmenus.has(itemKey);
      const isActive = isActiveRoute(item.to);
      
      // Check if this item is currently targeted by the tour
      const isTourTarget = tourState.isActive && (
        (tourState.stepIndex >= 1 && tourState.stepIndex <= 3 && item.to === '/details') ||
        (tourState.stepIndex >= 4 && tourState.stepIndex <= 6 && item.to === '/currencies')
      );
      
      return (
        <div key={itemKey} className={`submenu-item level-${level}`}>
          {hasSubitems ? (
            <div
              className={cn('submenu-header', { 'active': isActive, 'expanded': isExpanded })}
              onClick={() => {
                // Check localStorage directly for most up-to-date tour state
                const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEYS.completed) === 'true';
                const currentStep = localStorage.getItem(TOUR_STORAGE_KEYS.currentStep);
                const stepIndex = currentStep ? parseInt(currentStep, 10) : 0;
                const isWaitingForSave = !tourCompleted && (stepIndex === 3 || stepIndex === 6);
                
                // Block ALL submenu expansion during tour save steps
                if ((tourState.isActive && tourState.waitingForSave) || isWaitingForSave) {
                  console.log('🚫 Submenu expansion blocked - please complete the current step first');
                  return;
                }
                toggleSubmenu(itemKey);
              }}
            >
              <i className={cn('submenu-icon', item.icon)} />
              <span className="submenu-label">{item.label}</span>
              {isExpanded ? <ChevronDown className="expand-icon h-3 w-3" /> : <ChevronRight className="expand-icon h-3 w-3" />}
            </div>
          ) : (
                          <Link
                to={(() => {
                  // Check localStorage directly for most up-to-date tour state
                  const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEYS.completed) === 'true';
                  const currentStep = localStorage.getItem(TOUR_STORAGE_KEYS.currentStep);
                  const stepIndex = currentStep ? parseInt(currentStep, 10) : 0;
                  const isWaitingForSave = !tourCompleted && (stepIndex === 3 || stepIndex === 6);
                  
                  return ((tourState.isActive && tourState.waitingForSave) || isWaitingForSave) ? '#' : item.to;
                })()}
                className={cn('submenu-link', { 
                  'active': isActive,
                  'tour-target': isTourTarget,
                  'blocked': (() => {
                    const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEYS.completed) === 'true';
                    const currentStep = localStorage.getItem(TOUR_STORAGE_KEYS.currentStep);
                    const stepIndex = currentStep ? parseInt(currentStep, 10) : 0;
                    const isWaitingForSave = !tourCompleted && (stepIndex === 3 || stepIndex === 6);
                    return (tourState.isActive && tourState.waitingForSave) || isWaitingForSave;
                  })()
                })}
                data-tour={getDataTourAttribute(item)}
                onClick={(e) => {
                  // Check localStorage directly for most up-to-date tour state
                  const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEYS.completed) === 'true';
                  const currentStep = localStorage.getItem(TOUR_STORAGE_KEYS.currentStep);
                  const stepIndex = currentStep ? parseInt(currentStep, 10) : 0;
                  const isWaitingForSave = !tourCompleted && (stepIndex === 3 || stepIndex === 6);
                  
                  console.log('🔍 Submenu click detected:', { 
                    itemTo: item.to, 
                    itemLabel: item.label,
                    tourState,
                    currentStepFromStorage: stepIndex,
                    isWaitingForSaveFromStorage: isWaitingForSave,
                    shouldBlockFromState: tourState.isActive && tourState.waitingForSave,
                    shouldBlockFromStorage: isWaitingForSave
                  });
                  
                  // Block ALL submenu navigation during tour save steps (check both state and localStorage)
                  if ((tourState.isActive && tourState.waitingForSave) || isWaitingForSave) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🚫 Navigation blocked - please complete the current step first');
                    return false;
                  }
                }}
                style={tourState.isActive && tourState.waitingForSave ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
              >
                <i className={cn('submenu-icon', item.icon)} />
                <span className="submenu-label">{item.label}</span>
              </Link>
          )}
          
          {hasSubitems && isExpanded && (
            <div className="submenu-children">
              {renderSubmenuItems(item.items, itemKey, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  // Get the active main menu item and its submenus
  const getActiveMainMenuItem = () => {
    if (!activeMainMenu) return null;
    const index = parseInt(activeMainMenu, 10);
    return filteredMainMenuItems[index] || null;
  };

  const activeMenuItem = getActiveMainMenuItem();

  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    console.log('Toggle button clicked, current state:', sidebarCollapsed);
    setSidebarCollapsed(!sidebarCollapsed);
    // Close active menu when collapsing
    if (!sidebarCollapsed) {
      setActiveMainMenu('');
    }
  };

  // Dynamically adjust content margin based on submenu visibility and collapsed state
  useEffect(() => {
    const contentWrapper = document.querySelector('.layout-content-wrapper');
    if (contentWrapper) {
      if (sidebarCollapsed) {
        // When collapsed, only account for the icon panel
        const baseMargin = window.innerWidth <= 768 ? 60 : 80;
        (contentWrapper as HTMLElement).style.marginLeft = `${baseMargin}px`;
      } else {
        const baseMargin = window.innerWidth <= 768 ? 60 : 80;
        const submenuMargin = window.innerWidth <= 768 ? 
          (window.innerWidth <= 576 ? 0 : 250) : 280;
        
        if (activeMenuItem) {
          (contentWrapper as HTMLElement).style.marginLeft = `${baseMargin + submenuMargin}px`;
        } else {
          (contentWrapper as HTMLElement).style.marginLeft = `${baseMargin}px`;
        }
      }
    }
  }, [activeMenuItem, sidebarCollapsed]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const contentWrapper = document.querySelector('.layout-content-wrapper');
      if (contentWrapper) {
        if (sidebarCollapsed) {
          const baseMargin = window.innerWidth <= 768 ? 60 : 80;
          (contentWrapper as HTMLElement).style.marginLeft = `${baseMargin}px`;
        } else {
          const baseMargin = window.innerWidth <= 768 ? 60 : 80;
          const submenuMargin = window.innerWidth <= 768 ? 
            (window.innerWidth <= 576 ? 0 : 250) : 280;
          
          if (activeMenuItem) {
            (contentWrapper as HTMLElement).style.marginLeft = `${baseMargin + submenuMargin}px`;
          } else {
            (contentWrapper as HTMLElement).style.marginLeft = `${baseMargin}px`;
          }
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeMenuItem, sidebarCollapsed]);

  // Cleanup effect on unmount
  useEffect(() => {
    return () => {
      const contentWrapper = document.querySelector('.layout-content-wrapper');
      if (contentWrapper) {
        (contentWrapper as HTMLElement).style.marginLeft = '';
      }
    };
  }, []);

  return (
    <div className={cn('new-sidebar', { 'collapsed': sidebarCollapsed })}>
      {/* Icon Panel */}
      <div className="icon-panel">
        <div className="icon-panel-content">
          {filteredMainMenuItems.map((item, index) => {
            const isActive = activeMainMenu === index.toString();
            const hasActiveRoute = item.items ? 
              item.items.some(subitem => isActiveRoute(subitem.to)) :
              isActiveRoute(item.to);
            
            return (
              <div
                key={index}
                className={cn('icon-item', { 
                  'active': isActive,
                  'has-active-route': hasActiveRoute
                })}
                onClick={() => {
                  if (sidebarCollapsed) return;
                  
                  // Check localStorage directly for most up-to-date tour state
                  const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEYS.completed) === 'true';
                  const currentStep = localStorage.getItem(TOUR_STORAGE_KEYS.currentStep);
                  const stepIndex = currentStep ? parseInt(currentStep, 10) : 0;
                  const isWaitingForSave = !tourCompleted && (stepIndex === 3 || stepIndex === 6);
                  
                  // Block ALL navigation during tour save steps
                  if ((tourState.isActive && tourState.waitingForSave) || isWaitingForSave) {
                    if (!isActive) {
                      console.log('🚫 Navigation blocked - please complete the current step first');
                      return;
                    }
                  }
                  
                  if (isActive) {
                    // If already active, close the menu (but not during tour save steps)
                    if (!tourState.waitingForSave) {
                      setActiveMainMenu('');
                    }
                  } else {
                    // Open the menu
                    setActiveMainMenu(index.toString());
                    
                    // Only auto-navigate if not during tour (tour handles its own navigation)
                    if (!tourState.isActive) {
                      // Check if user is already on a child route of this menu item
                      const currentPath = location.pathname;
                      const isOnChildRoute = item.items && item.items.some(subItem => 
                        subItem.to && isActiveRoute(subItem.to)
                      );
                      
                      // Only navigate if user is NOT already on a child route
                      if (!isOnChildRoute) {
                        // Find and navigate to the first accessible submenu item
                        if (item.items && item.items.length > 0) {
                          const firstAccessibleItem = item.items.find(
                            subItem => hasMatchingRoles(subItem.role) && hasMatchingBusinessTypes(subItem.type) && subItem.to
                          );
                          
                          if (firstAccessibleItem?.to) {
                            navigate(firstAccessibleItem.to);
                          }
                        } else if (item.to) {
                          // If no subitems, navigate to the main item
                          navigate(item.to);
                        }
                      }
                    }
                  }
                }}
                title={item.label}
                data-tour={getDataTourAttribute(item)}
              >
                <i className={cn('icon', item.icon)} />
              </div>
            );
          })}
          
          {/* Toggle Button */}
          {/* <div className="sidebar-toggle-container">
            <button
              className={cn('sidebar-toggle-btn', { 'collapsed': sidebarCollapsed })}
              onClick={toggleSidebar}
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <i className={cn('pi', sidebarCollapsed ? 'pi-angle-right' : 'pi-angle-left')} />
            </button>
          </div> */}
        </div>
      </div>

      {/* Submenu Panel */}
      <div className={cn('submenu-panel', { 'visible': activeMenuItem && !sidebarCollapsed })}>
        {activeMenuItem && !sidebarCollapsed && (
          <div className="submenu-content">
            <div className="submenu-header-main">
              <i className={cn('main-icon', activeMenuItem.icon)} />
              <span className="main-label">{activeMenuItem.label}</span>
            </div>
            
            <div className="submenu-items">
              {activeMenuItem.items && activeMenuItem.items.length > 0 ? (
                renderSubmenuItems(activeMenuItem.items, `main-${activeMainMenu}`)
              ) : (
                <Link
                  to={activeMenuItem.to}
                  className={cn('submenu-link single', { 
                    'active': isActiveRoute(activeMenuItem.to),
                    'tour-target': tourState.isActive && (
                      (tourState.stepIndex >= 1 && tourState.stepIndex <= 3 && activeMenuItem.to === '/details') ||
                      (tourState.stepIndex >= 4 && tourState.stepIndex <= 6 && activeMenuItem.to === '/currencies')
                    )
                  })}
                  data-tour={getDataTourAttribute(activeMenuItem)}
                  onClick={(e) => {
                    // Check localStorage directly for most up-to-date tour state
                    const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEYS.completed) === 'true';
                    const currentStep = localStorage.getItem(TOUR_STORAGE_KEYS.currentStep);
                    const stepIndex = currentStep ? parseInt(currentStep, 10) : 0;
                    const isWaitingForSave = !tourCompleted && (stepIndex === 3 || stepIndex === 6);
                    
                    // Block ALL navigation during tour save steps
                    if ((tourState.isActive && tourState.waitingForSave) || isWaitingForSave) {
                      e.preventDefault();
                      console.log('🚫 Navigation blocked - please complete the current step first');
                      return;
                    }
                  }}
                >
                  <span className="submenu-label">{activeMenuItem.label}</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewSidebar; 