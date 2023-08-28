import React, { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { DataView, DataViewLayoutOptions } from "primereact/dataview";
import { Rating } from "primereact/rating";
import { Tag } from "primereact/tag";
import {useLocation} from "react-router-dom";

export default function VariantViewTest({variants, itemName}) {

  const [layout, setLayout] = useState<"grid" | "list">("grid");



  console.log(variants, 'varianto')

  const getSeverity = (variant) => {
    switch (variant.inventoryStatus) {
      case "INSTOCK":
        return "success";

      case "LOWSTOCK":
        return "warning";

      case "OUTOFSTOCK":
        return "danger";

      default:
        return null;
    }
  };

  const listItem = (variant) => {
    return (
      <div className="col-12">
        <div className="flex flex-column xl:flex-row xl:align-items-start p-4 gap-4">
          <img
            className="w-6 h-8rem sm:w-16rem xl:w-10rem shadow-2 block xl:block mx-auto border-round"
            src={variant.attachments[0]?.url}
            alt={variant.name}
          />
          <div className="flex flex-column sm:flex-row justify-content-between align-items-center xl:align-items-start flex-1 gap-4">
            <div className="flex flex-column align-items-center sm:align-items-start gap-3">
              <div className="text-2xl font-bold text-900">{variant.name}</div>
              <Rating value={variant.rating} readOnly cancel={false}></Rating>
              <div className="flex align-items-center gap-3">
                <span className="flex align-items-center gap-2">
                  <i className="pi pi-tag"></i>
                  <span className="font-semibold">{itemName}</span>
                </span>
                <Tag
                  value={variant.inventoryStatus}
                  severity={getSeverity(variant)}
                ></Tag>
              </div>
            </div>
            <div className="flex sm:flex-column align-items-center sm:align-items-end gap-3 sm:gap-2">
              <span className="text-2xl font-semibold">${variant.price}</span>
              <Button
                icon="pi pi-shopping-cart"
                className="p-button-rounded"
                disabled={variant.inventoryStatus === "OUTOFSTOCK"}
              ></Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const gridItem = (variant) => {
    return (
      <div className="col-12 sm:col-6 lg:col-12 xl:col-4 p-2">
        <div className="p-4 border-1 surface-border surface-card border-round">
          <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <div className="flex align-items-center gap-2">
              <i className="pi pi-tag"></i>
              <span className="font-semibold">{itemName}</span>
            </div>
            <Tag
              value={variant.inventoryStatus}
              severity={getSeverity(variant)}
            ></Tag>
          </div>
          <div className="flex flex-column align-items-center gap-3 py-5">
            <img
              className="w-6 h-8rem shadow-2 border-round img-fluid"
              src={variant.attachments[0]?.url}
              alt={variant.name}
            />
            <div className="text-2xl font-bold">{variant.name}</div>
            {/* <Rating value={variant.rating} readOnly cancel={false}></Rating> */}
          </div>
          <div className="flex align-items-center justify-content-between">
            <span className="text-2xl font-semibold">${variant.price}</span>
          {/*   <Button */}
          {/*     icon="pi pi-shopping-cart" */}
          {/*     className="p-button-rounded" */}
          {/*     disabled={variant.inventoryStatus === "OUTOFSTOCK"} */}
          {/*   ></Button> */}
          </div>
        </div>
     </div>
    );
  };

  const itemTemplate = (variant, layout) => {
    if (!variant) {
      return;
    }

    if (layout === "list") return listItem(variant);
    else if (layout === "grid") return gridItem(variant);
  };

  const header = () => {
    return (
      <div className="flex justify-content-end">
        <DataViewLayoutOptions
          layout={layout}
          onChange={(e) => setLayout(e.value as "grid" | "list")}
        />
      </div>
    );
  };

  return (
      <DataView
        value={variants}
        itemTemplate={itemTemplate}
        layout={layout}
        header={header()}

      />
  );
}
