import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const PaginationFilter = ({ totalPages }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const searchParams = new URLSearchParams(location.search);
    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    const pagesToShow = 3;
    const halfToShow = Math.ceil(pagesToShow / 2);

    let startPage = Math.max(1, currentPage - halfToShow);
    let endPage = Math.min(totalPages, currentPage + halfToShow);

    if (currentPage - halfToShow < 1) {
        endPage = Math.min(totalPages, endPage + (halfToShow - currentPage + 1));
    }
    if (currentPage + halfToShow > totalPages) {
        startPage = Math.max(1, startPage - (currentPage + halfToShow - totalPages));
    }

    const createQueryString = useCallback((name, value) => {
        const params = new URLSearchParams(searchParams);
        params.set(name, value);
        return `?${params.toString()}`;
    }, [searchParams]);

    const handleNavigation = (path) => {
        navigate(path);
    }

    return (
        <nav aria-label="Pagination navigation" className="flex items-center justify-center">
            <div className="flex items-center gap-1">
                {currentPage > 1 && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleNavigation(createQueryString('page', Math.max(1, currentPage - 1).toString()))}
                    >
                        <ChevronLeft className="h-3 w-3 mr-1" />
                        Previous
                    </Button>
                )}
                {startPage > 1 && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0 text-xs"
                        onClick={() => handleNavigation(createQueryString('page', '1'))}
                    >
                        1
                    </Button>
                )}
                {startPage > 2 && (
                    <Button variant="ghost" size="sm" disabled className="h-7 w-7 p-0 text-xs">
                        <MoreHorizontal className="h-3 w-3" />
                    </Button>
                )}
                {Array.from({ length: endPage - startPage + 1 }, (_, index) => {
                    const pageNum = startPage + index;
                    const isActive = pageNum === currentPage;
                    return (
                        <Button
                            key={index}
                            variant={isActive ? 'default' : 'outline'}
                            size="sm"
                            className="h-7 w-7 p-0 text-xs"
                            onClick={() => handleNavigation(createQueryString('page', pageNum.toString()))}
                        >
                            {pageNum}
                        </Button>
                    );
                })}
                {endPage < totalPages - 1 && (
                    <Button variant="ghost" size="sm" disabled className="h-7 w-7 p-0 text-xs">
                        <MoreHorizontal className="h-3 w-3" />
                    </Button>
                )}
                {endPage < totalPages && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0 text-xs"
                        onClick={() => handleNavigation(createQueryString('page', totalPages.toString()))}
                    >
                        {totalPages}
                    </Button>
                )}
                {currentPage < totalPages && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleNavigation(createQueryString('page', Math.min(totalPages, currentPage + 1).toString()))}
                    >
                        Next
                        <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                )}
            </div>
        </nav>
    );
};

export default PaginationFilter;
