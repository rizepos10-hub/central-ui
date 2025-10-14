import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/src/main/webapp/app/lib/utils';

interface PaginationFilterProps {
  totalPages: number;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

const PaginationFilterStateVals: React.FC<PaginationFilterProps> = ({ totalPages, currentPage, setCurrentPage }) => {
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

  return (
    <nav aria-label="Pagination navigation" className="flex items-center justify-center">
      <div className="flex items-center gap-1">
        {currentPage > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            className="h-7 px-2 text-xs"
          >
            <ChevronLeft className="h-3 w-3 mr-1" />
            Previous
          </Button>
        )}

        {startPage > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            className="h-7 w-7 p-0 text-xs"
          >
            1
          </Button>
        )}

        {startPage > 2 && (
          <Button
            variant="ghost"
            size="sm"
            disabled
            className="h-7 w-7 p-0 text-xs"
          >
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
              onClick={() => setCurrentPage(pageNum)}
              className={cn(
                'h-7 w-7 p-0 text-xs',
                isActive && 'pointer-events-none'
              )}
            >
              {pageNum}
            </Button>
          );
        })}

        {endPage < totalPages - 1 && (
          <Button
            variant="ghost"
            size="sm"
            disabled
            className="h-7 w-7 p-0 text-xs"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        )}

        {endPage < totalPages && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            className="h-7 w-7 p-0 text-xs"
          >
            {totalPages}
          </Button>
        )}

        {currentPage < totalPages && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            className="h-7 px-2 text-xs"
          >
            Next
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
    </nav>
  );
};

export default PaginationFilterStateVals;
