import React from 'react';
import { importDataFromOldSystem } from 'app/shared/reducers/import-data';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { Button } from 'primereact/button';

const ImportFromOldSystem = () => {
    const dispatch = useAppDispatch()
    const loading = useAppSelector(state => state.dataImport.loading);

    const handleImportButtonClick = () => {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".json";
        fileInput.onchange = (e) => {
            const inputElement = e.target as HTMLInputElement;
            const selectedFile = inputElement.files?.[0] || null;

            if (selectedFile) {
                dispatch(importDataFromOldSystem({ file: selectedFile }));
            }
        };
        fileInput.click();
    };

    return (
        <div className="card">
            <h3>Add a file to Import From Old System</h3>
            <Button
                label="Import Data"
                severity="help"
                raised
                color="help"
                onClick={handleImportButtonClick}
                disabled={loading}
                style={{
                    width: '140px',
                }}
            >
                {loading ? <i className="pi pi-spin pi-spinner" /> : <i className="pi pi-upload" />}
            </Button>
        </div>
    );
};

export default ImportFromOldSystem;
