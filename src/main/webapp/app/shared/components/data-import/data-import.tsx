import { Button } from "primereact/button";
import React from "react";
import { useAppDispatch, useAppSelector } from "app/config/store";
import { FileType, importData, importRetailData, importSupplierData, importAddonGroupsData } from "app/shared/reducers/import-data";
import { Tooltip } from "reactstrap";

type ItemImportProps = {
  type: FileType
}

const ImportButton = ({ type }: ItemImportProps) => {
  const dispatch = useAppDispatch();

  const { importSuccess, loading, errorMessage } = useAppSelector(state => state.dataImport);


  const handleImportButtonClick = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".xlsx";
    fileInput.onchange = (e) => {
      const inputElement = e.target as HTMLInputElement;
      const selectedFile = inputElement.files?.[0] || null;

      if (selectedFile) {
        if (type === 'RETAIL') {
          dispatch(importRetailData({ file: selectedFile }));
        } else if (type === 'SUPPLIER') {
          dispatch(importSupplierData({ file: selectedFile }));
        } else if (type === 'ADDON_GROUPS') {
          dispatch(importAddonGroupsData({ file: selectedFile }));
        } else {
          dispatch(importData({ file: selectedFile, type }));
        }
      }
    };
    fileInput.click();
  };

  const downloadFile = (filePath: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = filePath;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSampleClick = () => {
    let filePath = "";
    let fileName = "";

    switch (type) {
      case "ADDON":
        filePath = "content/samples/addons.xlsx";
        fileName = "addons.xlsx";
        break;
      case "REGULAR_RESTAURANT":
        // here i want to add online link instead of local file
        filePath = "https://cloudlinksai-my.sharepoint.com/:x:/g/personal/ali_aboud_cloudlinks_ai/Eed3nKJRNN9Hl7wwGS-_jnIBtvC758ukjTsuxUoiZsI9BA?e=Zr3iOr&wdOrigin=TEAMS-WEB.p2p_ns.rwc&wdExp=TEAMS-TREATMENT&wdhostclicktime=1748442817249&web=1";
        fileName = "regular-item.xlsx";
        break;
      case "TOPPING":
        filePath = "content/samples/toppings.xlsx";
        fileName = "toppings.xlsx";
        break;
      case "RETAIL":
        filePath = "https://cloudlinksai-my.sharepoint.com/:x:/g/personal/ali_aboud_cloudlinks_ai/Ef1RRc-9m2xCnjNmZ0OW090BBM2YR4UHnS2DA39oZg2qQg?e=FnJfhS";
        fileName = "retail.xlsx";
        break;
      case "SUPPLIER":
        filePath = "https://cloudlinksai-my.sharepoint.com/:x:/g/personal/hussein_aboud_cloudlinks_ai/ESp-D84npNhIjNpF2UYxJ8YBa5Hr0LNaijbJ9rsLhqToiw?e=6xS1XW&wdOrigin=TEAMS-WEB.p2p_ns.rwc&wdExp=TEAMS-TREATMENT&wdhostclicktime=1756735856496&web=1";
        fileName = "suppliers.xlsx";
        break;
      case "ADDON_GROUPS":
        filePath = "https://cloudlinksai-my.sharepoint.com/:x:/g/personal/hussein_aboud_cloudlinks_ai/EXSnB54nng9FrKGUc9qK9VkB2pRJdaU-sQh5FWmvo3xk0w?rtime=RJsVX2Dp3Ug&wdOrigin=TEAMS-WEB.p2p_ns.rwc&wdExp=TEAMS-TREATMENT&wdhostclicktime=1756735492746&web=1";
        fileName = "addon-groups.xlsx";
        break;
      default:
        return;
    }

    downloadFile(filePath, fileName);
  };


  return (
    <>

    <Button 
      icon="pi pi-upload" 
      severity="help" 
      raised 
      onClick={handleImportButtonClick} 
      disabled={loading} 
      tooltip="Import Data"
      data-pr-position="top"
    />
    
    <Button 
      icon="pi pi-download" 
      severity="secondary" 
      raised 
      onClick={handleDownloadSampleClick} 
      tooltip="Download Sample"
      data-pr-position="top"
    />

    </>
  )
}

export default ImportButton