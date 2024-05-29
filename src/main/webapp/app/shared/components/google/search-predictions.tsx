import React from 'react';
import { setKey } from 'react-geocode';
import { InputText } from 'primereact/inputtext';
import { Spinner } from 'reactstrap';
import { FaSearch } from 'react-icons/fa';
import { width } from '@fortawesome/free-solid-svg-icons/faTrash';

interface SearchPredictionsProps {
    placeHolder?: string;
    handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    searchTerm: string;
    searchResults: string[];
    isLoading?: boolean;
    showResults: boolean;
    handleClick: (result: string) => void;
}

const SearchPredictions: React.FC<SearchPredictionsProps> = ({
    placeHolder,
    handleInputChange,
    searchTerm,
    searchResults,
    isLoading,
    showResults,
    handleClick
}) => {
    return (
        <div className="position-relative">
            <div>
                <div className="">
                    <div className=''>
                        <div className="">
                            <div className="position-relative" style={{ width: '500px' }}>
                                <InputText
                                    type="search"
                                    placeholder={placeHolder}
                                    value={searchTerm}
                                    onChange={handleInputChange}
                                    style={{
                                        width: '500px',
                                    }}
                                >
                                </InputText>
                                <div
                                    className='position-absolute'
                                    style={{
                                        cursor: 'pointer',
                                        right: '10px',
                                        top: '10px',
                                    }}
                                >
                                    {isLoading ? (
                                        <Spinner />
                                    ) : (
                                        <FaSearch />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {showResults && searchResults.length > 0 && (
                <div style={{
                    position: 'absolute',
                    width: '500px',
                    zIndex: 1,
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    boxShadow: '0px 8px 16px 0px rgba(0,0,0,0.2)',
                    maxHeight: '200px',
                    overflowY: 'scroll',
                    marginTop: '5px',
                    padding: '5px',
                }}>
                    {searchResults.map((result, index) => (
                        <button
                            key={index}
                            onClick={() => handleClick(result)}
                            style={{
                                cursor: 'pointer',
                                padding: '5px',
                                borderBottom: '1px solid #ccc'
                            }}
                            className='btn w-100 text-start'
                        >
                            {result}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchPredictions;
