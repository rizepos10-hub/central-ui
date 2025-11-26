import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from 'app/lib/utils';

const MenuPosPreview = ({ data }) => {
  const [subScreensList, setSubScreensList] = useState([]);
  const [selectedMainScreenIndex, setSelectedMainScreenIndex] = useState(0);

  useEffect(() => {
    // Initialize with first main screen if available
    if (data?.menuScreens?.length > 0) {
      setSubScreensList([data.menuScreens[0]]);
      setSelectedMainScreenIndex(0);
    }
  }, [data]);

  function mainScreenBtnClickHandler(mainScreen: any, index: number) {
    setSubScreensList([mainScreen]);
    setSelectedMainScreenIndex(index);
  }

  function subScreenBtnClickHandler(subScreen: any) {
    if (subScreen?.componentType === 'SUB_SCREENS') {
      setSubScreensList(prev => [...prev, subScreen]);
    }
  }

  function subScreenLinkClickHandler(index: number) {
    if (index < subScreensList.length - 1) {
      const newList = [...subScreensList];
      newList.splice(index + 1);
      setSubScreensList(newList);
    }
  }

  const currentSubScreens = subScreensList[subScreensList.length - 1]?.subScreens || [];
  const selectedMainScreen = data?.menuScreens?.[selectedMainScreenIndex];
  const currentScreen = subScreensList[subScreensList.length - 1];

  // Always use the current sub-screen's numberOfColumns for displaying its items
  const cols = currentScreen?.numberOfColumns || 1;

  // Group main screens by rows based on numberOfColumns
  const groupedMainScreens = [];
  const numberOfColumns = data?.numberOfColumns || 1;
  if (data?.menuScreens) {
    for (let i = 0; i < data.menuScreens.length; i += numberOfColumns) {
      groupedMainScreens.push(data.menuScreens.slice(i, i + numberOfColumns));
    }
  }

  // Group sub-screens by rows based on current screen's numberOfColumns
  const groupedSubScreens = [];
  if (currentSubScreens.length > 0) {
    for (let i = 0; i < currentSubScreens.length; i += cols) {
      groupedSubScreens.push(currentSubScreens.slice(i, i + cols));
    }
  }

  return (
    <div className="flex gap-4 h-[600px]">
      {/* Main Screens Sidebar */}
      <div className="w-64 flex flex-col bg-muted/20 rounded-lg border overflow-hidden">
        <div className="p-3 border-b bg-background/95">
          <h3 className="text-sm font-semibold">Main Screens</h3>
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-2">
          {groupedMainScreens.map((row, rowIndex) => (
            <div
              key={rowIndex}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${numberOfColumns}, 1fr)`,
                height: `${150 * (data?.rowHeight?.[rowIndex] || 1)}px`,
                gap: '0.5rem',
              }}
            >
              {row.map((mainScreen, colIndex) => {
                const index = rowIndex * numberOfColumns + colIndex;
                return (
                  <Card
                    key={index}
                    onClick={() => mainScreenBtnClickHandler(mainScreen, index)}
                    className={cn(
                      'p-3 cursor-pointer transition-all hover:shadow-md border-2 overflow-hidden h-full',
                      selectedMainScreenIndex === index
                        ? 'border-primary shadow-md'
                        : 'border-border/60 hover:border-primary/50'
                    )}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <h5 className="text-sm font-semibold text-center">{mainScreen?.name}</h5>
                      <div
                        style={{ backgroundColor: mainScreen?.backgroundColor || '#94a3b8' }}
                        className="w-full h-1.5 mt-2 rounded"
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Sub Screens Content */}
      <div className="flex-1 flex flex-col bg-background rounded-lg border overflow-hidden">
        {/* Breadcrumb */}
        <div className="p-3 border-b bg-background/95">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-semibold tracking-tight">
              {subScreensList.map((subScreen, index) => (
                <span
                  key={index}
                  onClick={() => subScreenLinkClickHandler(index)}
                  className="cursor-pointer hover:text-primary transition-colors inline-flex items-center"
                >
                  {subScreen?.name}
                  {index < subScreensList.length - 1 && (
                    <span className="mx-1 text-muted-foreground">/</span>
                  )}
                </span>
              ))}
            </h3>
          </div>
        </div>

        {/* Sub Screens Grid */}
        <div className="flex-1 overflow-auto p-4 bg-muted/10">
          {currentSubScreens.length > 0 ? (
            <div className="space-y-3">
              {groupedSubScreens.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    height: `${150 * (currentScreen?.rowHeight?.[rowIndex] || 1)}px`,
                    gap: '0.75rem',
                  }}
                >
                  {row.map((subScreen, colIndex) => (
                    <Card
                      key={colIndex}
                      onClick={() => subScreenBtnClickHandler(subScreen)}
                      className={cn(
                        'flex flex-col p-0 cursor-pointer transition-all hover:shadow-md border-2 hover:border-primary/50 overflow-hidden relative h-full',
                        subScreen?.componentType === 'SUB_SCREENS' && 'hover:border-primary'
                      )}
                    >
                      <div className="flex items-center justify-between p-2 pb-1">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {subScreen?.componentType === 'SUB_SCREENS' ? 'Screen' : 'Item'}
                        </span>
                        {subScreen?.componentType === 'SUB_SCREENS' && (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1 flex flex-col items-center justify-center px-2 pb-2">
                        <h4 className="text-sm font-semibold truncate w-full text-center">
                          {subScreen?.name}
                        </h4>
                        {subScreen?.numberOfColumns && (
                          <span className="text-xs text-muted-foreground mt-1">
                            {subScreen.numberOfColumns} col{subScreen.numberOfColumns > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      <div
                        style={{ backgroundColor: subScreen?.backgroundColor || '#94a3b8' }}
                        className="w-full h-1.5 mt-auto"
                      />
                    </Card>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <p className="text-sm">No items or sub-screens in this screen</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuPosPreview;
