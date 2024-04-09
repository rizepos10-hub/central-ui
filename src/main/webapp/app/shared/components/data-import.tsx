import { Button } from "primereact/button";
import React from "react";
import { useAppDispatch, useAppSelector } from "app/config/store";
import { FileType, importData } from "app/shared/reducers/import-data";


type ItemImportProps = {
  type:  FileType
}

const ImportButton = ({type} :ItemImportProps) => {
  const dispatch = useAppDispatch();

  const {importSuccess, loading, errorMessage} = useAppSelector(state => state.dataImport)

  const handleImportButtonClick = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".xlsx";
    fileInput.onchange = (e) => {
      const inputElement = e.target as HTMLInputElement;
      const selectedFile = inputElement.files?.[0] || null;

      if (selectedFile) {
        dispatch(importData({ file: selectedFile, type }));
      }
    };
    fileInput.click();
  };


  return (
    <Button label="Import Data" severity="help" raised className="me-5" color="help"  onClick={handleImportButtonClick} disabled={loading} />
  )
}

export default ImportButton