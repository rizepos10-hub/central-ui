import React, { useState, useEffect, useRef } from 'react';
import { MenuItem, model } from 'app/shared/sidebar/AppMenu';
import { getTenant } from 'app/shared/tenant/TenantContext';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { removeShortcut, saveShortcut } from './global-search.reducer';
import { Minus, Plus, Search, ChevronRight, ChevronsRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface GlobalSearchProps {
    data: MenuItem[];
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const GlobalSearch = ({ data, isOpen, setIsOpen }: GlobalSearchProps) => {
    const [query, setQuery] = useState('');
    const [filteredData, setFilteredData] = useState([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const tenant = useAppSelector(state => state.tenant.tenant);
    const dispatch = useAppDispatch();

    const shortcuts = useAppSelector(state => state.shortcuts.shortcuts);

    const isShortcutAdded = (item: MenuItem) => {
        return shortcuts.some(shortcut => shortcut.to === item.to);
    };

    const findItemInModel = (model: MenuItem[], targetTo: string, oldItem: MenuItem): MenuItem | undefined => {
        for (const item of model) {
            if (item.to === targetTo) {
                return item;
            }
            if (item.items && item.items.length > 0) {
                const found = findItemInModel(item.items, targetTo, oldItem);
                if (found) {
                    return found;
                }
            }
        }
        return oldItem;
    };

    const handleShortcutToggle = (item: MenuItem) => {
        const fullItem = findItemInModel(model, item.to, item);

        if (isShortcutAdded(fullItem)) {
            dispatch(removeShortcut(fullItem.to));
        } else {
            dispatch(saveShortcut(fullItem));
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setIsOpen]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        dispatch(getTenant);
    }, [dispatch]);

    const searchItems = (items, query) => {
        return items
            .map((item) => {
                if (
                    item.label.toLowerCase().includes(query.toLowerCase()) ||
                    (item.items && searchItems(item.items, query).length > 0)
                ) {
                    return {
                        ...item,
                        items: item.items ? searchItems(item.items, query) : [],
                    };
                }
                return null;
            })
            .filter((item) => item !== null);
    };

    useEffect(() => {
        if (query) {
            const results = searchItems(data, query);
            setFilteredData(results);
        } else {
            setFilteredData([]);
        }
    }, [query, data]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-2xl p-0">
                <DialogHeader className="p-4 pb-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search docs... (Ctrl+K)"
                            className="h-10 pl-9"
                        />
                    </div>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto p-4">
                    {shortcuts.length > 0 && (
                        <>
                            <h3 className="text-sm font-semibold mb-2">Saved Shortcuts</h3>
                            <div className="space-y-1 mb-4">
                                {shortcuts.map((item) => (
                                    <div
                                        key={item.to}
                                        className="flex items-center justify-between rounded-md p-2 hover:bg-accent cursor-pointer"
                                        onClick={() => window.location.href = `${tenant}${item.to}`}
                                    >
                                        <span className="text-sm">{item.label}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleShortcutToggle(item);
                                            }}
                                        >
                                            {isShortcutAdded(item) ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Separator className="my-4" />
                        </>
                    )}
                    {filteredData.length === 0 && query === '' && (
                        <p className="text-sm text-muted-foreground text-center py-8">Start typing to search...</p>
                    )}
                    {filteredData.length === 0 && query !== '' && (
                        <p className="text-sm text-muted-foreground text-center py-8">No results found</p>
                    )}
                    {filteredData.map((parent) => (
                        <div key={parent.to} className="mb-6">
                            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                {parent.label}
                            </h3>
                            <div className="space-y-1">
                                {parent.items.map((item) => (
                                    <div key={item.to}>
                                        <div
                                            className="flex items-center justify-between rounded-md p-2 hover:bg-accent cursor-pointer group"
                                            onClick={() => window.location.href = `${tenant}${item.to}`}
                                        >
                                            <div className="flex items-center gap-2 flex-1">
                                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-sm">{item.label}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleShortcutToggle(item);
                                                }}
                                            >
                                                {isShortcutAdded(item) ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                                            </Button>
                                        </div>
                                        {item.items && item.items.length > 0 && (
                                            <div className="ml-4 space-y-1">
                                                {item.items.map((subItem) => (
                                                    <div
                                                        key={subItem.label}
                                                        className="flex items-center justify-between rounded-md p-2 hover:bg-accent cursor-pointer group"
                                                        onClick={() => window.location.href = `${tenant}${subItem.to}`}
                                                    >
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <ChevronsRight className="h-3 w-3 text-muted-foreground" />
                                                            <span className="text-sm">{subItem.label}</span>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleShortcutToggle(subItem);
                                                            }}
                                                        >
                                                            {isShortcutAdded(subItem) ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default GlobalSearch;
