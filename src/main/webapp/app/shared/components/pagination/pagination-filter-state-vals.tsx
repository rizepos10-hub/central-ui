import React from 'react';

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
    <nav aria-label="Page navigation example">
      <ul className="pagination">
        {currentPage > 1 && (
          <li className="page-item">
            <a
              className="page-link"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            >
              Previous
            </a>
          </li>
        )}

        {startPage > 1 && (
          <li className="page-item">
            <a className="page-link" onClick={() => setCurrentPage(1)}>
              1
            </a>
          </li>
        )}

        {startPage > 2 && (
          <li className="page-item">
            <span className="page-link">...</span>
          </li>
        )}

        {Array.from({ length: endPage - startPage + 1 }, (_, index) => (
          <li
            key={index}
            className={`page-item ${
              startPage + index === currentPage ? 'active' : ''
            }`}
          >
            <a
              className="page-link"
              onClick={() => setCurrentPage(startPage + index)}
            >
              {startPage + index}
            </a>
          </li>
        ))}

        {endPage < totalPages - 1 && (
          <li className="page-item">
            <span className="page-link">...</span>
          </li>
        )}

        {endPage < totalPages && (
          <li className="page-item">
            <a
              className="page-link"
              onClick={() => setCurrentPage(totalPages)}
            >
              {totalPages}
            </a>
          </li>
        )}

        {currentPage < totalPages && (
          <li className="page-item">
            <a
              className="page-link"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            >
              Next
            </a>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default PaginationFilterStateVals;
