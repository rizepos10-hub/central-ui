import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const PaginationFilter = ({ totalPages }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const searchParams = new URLSearchParams(location.search);
    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    const pagesToShow = 3;
    const halfToShow = Math.floor(pagesToShow / 2);

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
        <nav aria-label="Page navigation example">
            <ul className="pagination">
                {currentPage > 1 && (
                    <li className="page-item">
                        <a className="page-link" onClick={() => handleNavigation(createQueryString('page', Math.max(1, currentPage - 1).toString()))}>Previous</a>
                    </li>
                )}
                {startPage > 1 && (
                    <li className="page-item">
                        <a className="page-link" onClick={() => handleNavigation(createQueryString('page', '1'))}>1</a>
                    </li>
                )}
                {startPage > 2 && <li className="page-item"><span className="page-link">...</span></li>}
                {Array.from({ length: endPage - startPage + 1 }, (_, index) => (
                    <li key={index} className={`page-item ${startPage + index === currentPage ? 'active' : ''}`}>
                        <a className="page-link" onClick={() => handleNavigation(createQueryString('page', (startPage + index).toString()))}>{startPage + index}</a>
                    </li>
                ))}
                {endPage < totalPages - 1 && <li className="page-item"><span className="page-link">...</span></li>}
                {endPage < totalPages && (
                    <li className="page-item">
                        <a className="page-link" onClick={() => handleNavigation(createQueryString('page', totalPages.toString()))}>{totalPages}</a>
                    </li>
                )}
                {currentPage < totalPages && (
                    <li className="page-item">
                        <a className="page-link" onClick={() => handleNavigation(createQueryString('page', Math.min(totalPages, currentPage + 1).toString()))}>Next</a>
                    </li>
                )}
            </ul>
        </nav>
    );
};

export default PaginationFilter;
