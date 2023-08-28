import React, { useState, useEffect } from 'react';
import { DataView, DataViewLayoutOptions } from 'primereact/dataview';
import { Button } from 'primereact/button';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { Rating } from 'primereact/rating';
import { PickList } from 'primereact/picklist';
import { OrderList } from 'primereact/orderlist';
import { InputText } from 'primereact/inputtext';
import type { Demo } from '../../shared/sidebar/types/types';

const ListDemo = ({items}) => {


  console.log(items, 'filteredItemList1')
  // const [picklistSourceValue, setPicklistSourceValue] = useState(listValue);
  // const [picklistTargetValue, setPicklistTargetValue] = useState([]);
  // const [orderlistValue, setOrderlistValue] = useState(listValue);
  // const [dataViewValue, setDataViewValue] = useState<Demo.Product[]>([]);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [filteredValue, setFilteredValue] = useState<Demo.Product[]>([]);
  const [layout, setLayout] = useState<'grid' | 'list' | (string & Record<string, unknown>)>('grid');
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState<0 | 1 | -1 | null>(null);
  const [sortField, setSortField] = useState('');

  const sortOptions = [
    { label: 'Price High to Low', value: '!price' },
    { label: 'Price Low to High', value: 'price' }
  ];



  const onFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGlobalFilterValue(value);
    if (value.length === 0) {
      setFilteredValue([]);
    } else {
      const filtered = items?.filter((product) => {
         console.log(product.name.toLowerCase().includes(value), 'log');
      });
      setFilteredValue(filtered);
    }
  };

  const onSortChange = (event: DropdownChangeEvent) => {
    const value = event.value;

    if (value.indexOf('!') === 0) {
      setSortOrder(-1);
      setSortField(value.substring(1, value.length));
      setSortKey(value);
    } else {
      setSortOrder(1);
      setSortField(value);
      setSortKey(value);
    }
  };

  const dataViewHeader = (
    <div className="flex flex-column md:flex-row md:justify-content-between gap-2">
      <Dropdown value={sortKey} options={sortOptions} optionLabel="label" placeholder="Sort By Price" onChange={onSortChange} />
      <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText value={globalFilterValue} onChange={onFilter} placeholder="Search by Name" />
            </span>
      <DataViewLayoutOptions layout={layout} onChange={(e) => setLayout(e.value)} />
    </div>
  );

  const dataviewListItem = (data: Demo.Product) => {
    console.log(data, 'data in demo')
    return (
      <div className="col-12">
        <div className="flex flex-column md:flex-row align-items-center p-3 w-full">
          <img src={`/demo/images/product/${data.image}`} alt={data.name} className="my-4 md:my-0 w-9 md:w-10rem shadow-2 mr-5" />
          <div className="flex-1 flex flex-column align-items-center text-center md:text-left">
            <div className="font-bold text-2xl">{data.name}</div>
            <div className="mb-2">{data.description}</div>
            <Rating value={data.rating} readOnly cancel={false} className="mb-2"></Rating>
            <div className="flex align-items-center">
              <i className="pi pi-tag mr-2"></i>
              <span className="font-semibold">{data.category}</span>
            </div>
          </div>
          <div className="flex flex-row md:flex-column justify-content-between w-full md:w-auto align-items-center md:align-items-end mt-5 md:mt-0">
            <span className="text-2xl font-semibold mb-2 align-self-center md:align-self-end">${data.price}</span>
            <Button icon="pi pi-shopping-cart" label="Add to Cart" disabled={data.inventoryStatus === 'OUTOFSTOCK'} className="mb-2 p-button-sm"></Button>
            <span className={`product-badge status-${data.inventoryStatus?.toLowerCase()}`}>{data.inventoryStatus}</span>
          </div>
        </div>
      </div>
    );
  };


  const dataviewGridItem = (data: Demo.Product) => {
    return (
      <div className="col-12 lg:col-4">
        <div className="card m-3 border-1 surface-border">
          <div className="flex flex-wrap gap-2 align-items-center justify-content-between mb-2">
            <div className="flex align-items-center">
              <i className="pi pi-tag mr-2" />
              <span className="font-semibold">{data.terms[0]?.name || 'Uncategorized'}</span>
            </div>
            {/* <span className={`product-badge status-${data.inventoryStatus?.toLowerCase()}`}>{data.inventoryStatus}</span> */}
          </div>
          <div className="flex flex-column align-items-center text-center mb-3">
            <img  src={data?.attachments && data?.attachments[0]?.url} alt={data.name} className="w-9 shadow-2 my-3 mx-0" />
            <div className="text-2xl font-bold">{data.name}</div>
            <div className="mb-3">{data.description}</div>
            {/* <Rating value={data.rating} readOnly cancel={false} /> */}
          </div>
          <div className="flex align-items-center justify-content-between">
            <span className="text-2xl font-semibold">${data.price}</span>
            <Button icon="pi pi-trash" disabled={data.inventoryStatus === 'OUTOFSTOCK'} />
          </div>
        </div>
      </div>
    );
  };

  const itemTemplate = (data: Demo.Product, layout: 'grid' | 'list' | (string & Record<string, unknown>)) => {
    if (!data) {
      return;
    }

    if (layout === 'list') {
      return dataviewListItem(data);
    } else if (layout === 'grid') {
      return dataviewGridItem(data);
    }
  };

  return (
    <div className="grid list-demo">
      <div className="col-12">
        <div className="card">
          <h5>DataView</h5>
          <DataView value={ items || filteredValue } layout={layout} paginator rows={9} sortOrder={sortOrder} sortField={sortField} itemTemplate={itemTemplate} header={dataViewHeader}></DataView>
        </div>
      </div>

    </div>
  );
};

export default ListDemo;
