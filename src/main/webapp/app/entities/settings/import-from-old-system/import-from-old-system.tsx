import React from 'react';
import { importDataFromOldSystem } from 'app/shared/reducers/import-data';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { Button } from '@/components/ui/button';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Upload, Loader2 } from 'lucide-react';

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
        <PageWrapper>
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-base font-semibold mb-4">Add a file to Import From Old System</h3>
                <Button
                    onClick={handleImportButtonClick}
                    disabled={loading}
                    className="h-8 text-xs gap-2"
                    variant="default"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Importing...
                        </>
                    ) : (
                        <>
                            <Upload className="h-4 w-4" />
                            Import Data
                        </>
                    )}
                </Button>
            </div>
        </PageWrapper>
    );
};

export default ImportFromOldSystem;
