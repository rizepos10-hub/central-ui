import { Button } from "primereact/button";
import React from "react";
import { useAppDispatch, useAppSelector } from "app/config/store";
import { FileType, importData, importRetailData } from "app/shared/reducers/import-data";

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
        filePath = "content/samples/regular-item.xlsx";
        fileName = "regular-item.xlsx";
        break;
      case "TOPPING":
        filePath = "content/samples/toppings.xlsx";
        fileName = "toppings.xlsx";
        break;
      case "RETAIL":
        filePath = "content/samples/retail.xlsx";
        fileName = "retail.xlsx";
        break;
      default:
        return;
    }

    downloadFile(filePath, fileName);
  };


  return (
    <>
      <Button label="Import Data" severity="help" raised color="help" onClick={handleImportButtonClick} disabled={loading} />
      <Button label="Download Sample" severity="secondary" raised className={"mr-4"} onClick={handleDownloadSampleClick} />

    </>
  )
}

export default ImportButton