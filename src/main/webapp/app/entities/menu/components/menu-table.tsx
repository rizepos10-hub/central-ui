import ImageDisplay from 'app/shared/components/image/image-display'
import PaginationFilter from 'app/shared/components/pagination/pagination-filter'
import { IItem } from 'app/shared/model/ITEM/item.model'
import _ from 'lodash'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const MenuTable = ({
    items,
    saveItems,
    menuCategories,
    handleCheckboxChange,
    checkedItems,
    branchId,
    type,
    totalPages
}: {
    items?: IItem[];
    saveItems?: () => void;
    menuCategories?: any[];
    handleCheckboxChange?: (id: string) => void;
    checkedItems?: IItem[];
    branchId?: string;
    type?: string;
    totalPages?: number;
}) => {
    const [itemName, setItemName] = useState<string>('');

    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);

    const initialRender = useRef(true);

    const createQueryString = useCallback((name, value) => {
        const params = new URLSearchParams(searchParams);
        params.set(name, value);
        return `?${params.toString()}`;
    }, [searchParams]);

    const handleCategoryChange = (e) => {
        if (searchParams.get('categoryId') === e.value.code) {
            return;
        }
        navigate(createQueryString('categoryId', e.value.code));
    }

    const debouncedItemNameNavigate = useCallback(
        _.debounce((newItemName) => {
            if (searchParams.get('name') !== newItemName) {
                navigate(createQueryString('name', newItemName));
            }
        }, 300),
        []
    );

    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;
            return;
        }
        debouncedItemNameNavigate(itemName);
    }, [itemName, debouncedItemNameNavigate]);


    function getPriceForBranch(data) {
        let foundPrice = null;

        data.variants?.forEach(variant => {
            const branchVariantDetails = variant.branchVariantDetails;

            if (branchVariantDetails && branchVariantDetails[branchId]) {
                foundPrice = branchVariantDetails[branchId].price;
            }
        });

        return foundPrice;
    }

    return (
        <div className='card p-0'>
            <div className="card mb-4 p-1">
                <div className="d-flex align-items-center gap-2 justify-content-between w-100">
                    {type === 'Excluded' ? (
                        <div className='d-flex align-items-center gap-2'>
                            <Dropdown
                                value={{ label: menuCategories.find(cat => cat.id === searchParams.get('categoryId'))?.name || 'All Categories', code: searchParams.get('categoryId') }}
                                options={[{ label: 'All Categories', code: '' }, ...menuCategories.map(category => ({ label: category.name, code: category.id }))]}
                                onChange={handleCategoryChange}
                                placeholder="Select a Category"
                                optionLabel="label"
                            />
                            <div className='d-flex align-items-center'>
                                <InputText
                                    placeholder='Search for an item..'
                                    onChange={(e) => setItemName(e.target.value || '')}
                                    value={itemName}
                                />
                            </div>
                        </div>
                    ) : (
                        <div></div>
                    )}
                    <div className="d-flex align-items-center gap-2">
                        <Button label={`${type === 'Excluded' ? 'Include' : type === 'Included' ? "Exclude" : "Save"}`} onClick={saveItems} />
                    </div>
                </div>
            </div>
            <div className="row g-3">
                <div className="container mt-4">
                    <table className="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th scope="col">Select</th>
                                <th scope="col">Product</th>
                                <th scope="col">Category</th>
                                <th scope="col">Price</th>
                                <th scope="col">Image</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item: IItem) => (
                                <tr key={item.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            onChange={(e) => handleCheckboxChange(item.id)}
                                            checked={checkedItems.some(i => i.id === item.id)}
                                        />
                                    </td>
                                    <td>{item.categories?.[0]?.name}</td>
                                    <td>{item.name}</td>
                                    <td>${getPriceForBranch(item) ?? item.variants?.[0]?.price}</td>
                                    <td>
                                        <ImageDisplay height='50px' width='50px' imageUrl={item.attachments[0]?.url} imageType={"product"} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className='d-flex justify-content-center w-100'>
                        {type === 'Excluded' && <PaginationFilter totalPages={totalPages || 10} />}
                    </div>
                </div>

            </div>
        </div>
    )
}

export default MenuTable