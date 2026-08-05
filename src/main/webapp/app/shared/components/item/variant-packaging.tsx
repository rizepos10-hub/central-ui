import { IVariableItemVariant } from 'app/shared/model/ITEM/retail/variable-item.model';
import React, { useMemo, useState } from 'react';
import AsyncSelect from 'app/shared/components/select/async-select';
import { useAppDispatch } from 'app/config/store';
import { Package, ArrowRight, Trash2, Plus } from 'lucide-react';
import { IProduct } from 'app/shared/model/ITEM/retail/product.model';
import { filterEntities } from 'app/entities/item/retail/product/product.reducer';
import { applyMatchModeMap } from 'app/shared/util/filter-match-model-util';
import { initialItemFilterState } from "app/shared/model/filter-state.model";
import { FilterMatchMode } from 'primereact/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatSkuList } from 'app/shared/util/sku-utils';

const customSelectStyles = {
  control: (base) => ({
    ...base,
    minHeight: '32px',
    fontSize: '0.75rem',
  }),
  valueContainer: (base) => ({
    ...base,
    padding: '0 8px',
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
  }),
  menu: (base) => ({
    ...base,
    fontSize: '0.75rem',
  }),
  option: (base) => ({
    ...base,
    fontSize: '0.75rem',
  }),
};

const VariantPackaging = ({
    product,
    variantIndex,
    variant,
    handleVariantFieldChange
}: {
    product: IProduct;
    variantIndex: number;
    variant: IVariableItemVariant;
    handleVariantFieldChange: any;
}) => {
    const [showInputs, setShowInputs] = useState<boolean>(variant?.variantPackage ? true : false);
    const dispatch = useAppDispatch();

    const baseVariantOptions = useMemo(() => {
        return (product?.variants || [])
            .filter(productVariant => productVariant?.measureValue?.isBase && productVariant?.id)
            .map(productVariant => ({
                variantId: productVariant.id,
                name: `(${product?.name || 'Current item'}) ${productVariant?.name || 'Base variant'}`,
            }));
    }, [product?.name, product?.variants]);

    const selectedVariantOption = useMemo(() => {
        if (!variant?.variantPackage?.variantId) {
            return null;
        }

        return (
            baseVariantOptions.find(option => option.variantId === variant.variantPackage.variantId) || {
                variantId: variant.variantPackage.variantId,
                name: variant.variantPackage.name,
            }
        );
    }, [baseVariantOptions, variant?.variantPackage?.name, variant?.variantPackage?.variantId]);

    const loadVariantOptions = async (inputValue) => {
        if (!inputValue) return baseVariantOptions;

        try {
            const updatedQuery = applyMatchModeMap({
                ...initialItemFilterState,
                filters: {
                    ...initialItemFilterState.filters,
                    name: { value: inputValue, matchMode: FilterMatchMode.CONTAINS },
                    'variants.measureValue.isBase': { value: true, matchMode: FilterMatchMode.EQUALS },
                }
            });
            const response = await dispatch(
                filterEntities({
                    query: updatedQuery,
                })
            );
            const payload = response.payload as any;
            const data = payload?.data;

            const remoteOptions =
                data?.flatMap(item =>
                    item?.variants
                        ?.filter(productVariant => productVariant?.measureValue?.isBase)
                        ?.map(productVariant => ({
                            variantId: productVariant?.id,
                            name: `(${item?.name}) ${productVariant?.name}`,
                        }))
                ) || [];

            const allOptions = [...baseVariantOptions, ...remoteOptions];
            const deduped = allOptions.filter(
                (option, index, array) => option?.variantId && array.findIndex(candidate => candidate.variantId === option.variantId) === index
            );

            return deduped;
        } catch (error) {
            return baseVariantOptions;
        }
    };

    const handleDeleteInput = () => {
        handleVariantFieldChange(variantIndex, 'variantPackage', null)
        setShowInputs(false)
    }

    return (
        <div>
            <div className="mb-4">
                <div className="flex flex-col gap-1 items-center justify-center">
                    <h5 className="text-sm font-semibold">The product that this product breaks into</h5>
                    <h6 className="text-xs text-muted-foreground">Products can only break into one other product</h6>
                </div>
            </div>
            {showInputs ? (
                <div className="w-full">
                    <div className="flex items-center gap-3 p-3 border rounded-md">
                        <div className="flex items-center w-8">
                            <span className="text-xs">1</span>
                        </div>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-xs font-medium truncate">{variant.name}</span>
                            <span className="text-xs text-muted-foreground truncate">{formatSkuList(variant)}</span>
                        </div>
                        <div className="flex justify-end w-8">
                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="w-24">
                            <Input
                                type="number"
                                placeholder="Qty"
                                onChange={(e) => handleVariantFieldChange(variantIndex, 'variantPackage', {
                                    ...variant?.variantPackage,
                                    quantity: e.target.value
                                })}
                                value={variant?.variantPackage?.quantity ?? ''}
                                className="h-8 text-xs"
                            />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <AsyncSelect
                                value={selectedVariantOption}
                                defaultOptions={baseVariantOptions}
                                getOptionLabel={option => option.name}
                                getOptionValue={option => option.variantId}
                                loadOptions={loadVariantOptions}
                                className="w-full"
                                cacheOptions
                                onChange={(val) => {
                                    handleVariantFieldChange(variantIndex, 'variantPackage', {
                                        ...variant?.variantPackage,
                                        variantId: val?.variantId,
                                        name: val?.name
                                    })
                                }}
                                placeholder="Search to add a base variant"
                                styles={customSelectStyles}
                            />
                        </div>
                        <div className="w-10 flex justify-end">
                            <Button variant="destructive" size="sm" className="h-8 w-8 p-0" onClick={handleDeleteInput}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center mt-8">
                    <div className="flex flex-col items-center gap-3">
                        <Package className="h-16 w-16 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">If this product breaks into another product, add the product here</p>
                        <hr className="w-full border-t" />
                        <Button variant="link" className="text-xs" onClick={() => setShowInputs(true)}>
                            <Plus className="h-4 w-4 mr-1" /> Add a product relationship
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default VariantPackaging
