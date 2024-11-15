import React, { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Translate, translate } from 'react-jhipster';

const ItemLocation = ({ itemLocaion, onItemLocationChange }) => {

    const handleitemLocationChange = (field, value) => {
        onItemLocationChange(field, value);
    };

  return (
    <div className="p-3">
    <div className="row gap-2 mb-2">
        <label className={'font-semibold p-0'}>
            <Translate contentKey={'items.update.itemLocation.department'}>Department</Translate>
        </label>

      <InputText
        id="department"
        value={itemLocaion?.department || ''}
        onChange={(e) => handleitemLocationChange("department", e.target.value)}
        placeholder={translate('items.update.tabs.itemLocation.departmentPlaceHolder')}
      />
    </div>
    <div className="row gap-2 mb-2">
    <label className={'font-semibold p-0'}>
        <Translate contentKey={'items.update.itemLocation.section'}>Section</Translate>
    </label>
      <InputText
        id="section"
        value={itemLocaion?.section || ''}
        onChange={(e) => handleitemLocationChange("section", e.target.value)}
        placeholder={translate('items.update.tabs.itemLocation.sectionPlaceHolder')}
      />
    </div>
    <div className="row gap-2 mb-2">

      <label className={'font-semibold p-0'}>
        <Translate contentKey={'items.update.itemLocation.isle'}>Isle</Translate>
      </label>

      <InputText
        id="isle"
        value={itemLocaion?.isle || ''}
        onChange={(e) => handleitemLocationChange("isle", e.target.value)}
        placeholder={translate('items.update.tabs.itemLocation.islePlaceHolder')}
      />
    </div>
    <div className="row gap-2 mb-2">

      <label className={'font-semibold p-0'}>
        <Translate contentKey={'items.update.itemLocation.shelf'}>Shelf</Translate>
      </label>

      <InputText
        id="shelf"
        value={itemLocaion?.shelf || ''}
        onChange={(e) => handleitemLocationChange("shelf", e.target.value)}
        placeholder={translate('items.update.tabs.itemLocation.shelfPlaceHolder')}
      />
    </div>
    <div className="row gap-2 mb-2">
      <label className={'font-semibold p-0'}>
        <Translate contentKey={'items.update.itemLocation.shelfLocation'}>Shelf Location</Translate>
      </label>
      <InputText
        id="shelfLocation"
        value={itemLocaion?.shelfLocation || ''}
        onChange={(e) => handleitemLocationChange("shelfLocation", e.target.value)}
        placeholder={translate('items.update.tabs.itemLocation.shelfLocationPlaceHolder')}
      />
    </div>
  </div>
  );
};

export default ItemLocation;
