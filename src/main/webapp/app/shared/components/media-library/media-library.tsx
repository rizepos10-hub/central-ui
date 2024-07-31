import React, { ReactElement, useEffect, useMemo, useState } from 'react'
import { FileLibrarySelectedItems, ReactMediaLibrary } from 'react-media-library-cloud-links'
import { useAppDispatch } from '../../../config/store';
import { deleteEntities, getEntities, uploadImage } from '../../../entities/attachment/attachment.reducer';
import { IAttachment } from '../../model/attachment.model';
import { toast } from 'react-toastify';
import { FileLibraryListItem } from 'react-media-library-cloud-links';
import { Card } from 'primereact/card';
import { useDropzone } from 'react-dropzone'
import { Spinner } from 'reactstrap';
import { Button } from 'primereact/button';
import { TiDelete } from "react-icons/ti";

interface MediaLibraryProps {
    sizePerPage?: number
    multiSelect?: boolean
    handleFilesSelectCallback: (files: FileLibraryListItem[]) => void
    defaultValues?: FileLibraryListItem[]
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({
    sizePerPage = 30,
    multiSelect,
    handleFilesSelectCallback,
    defaultValues
}) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [attachments, setAttachments] = useState<IAttachment[]>([]);
    const [selectedItems, setSelectedItems] = useState<Array<FileLibraryListItem>>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const dispatch = useAppDispatch();

    const onDrop = acceptedFiles => {
        if (!multiSelect && acceptedFiles.length > 1) {
            toast.error('Only one image can be added for this field');
            return;
        } else {
            setAttachments(acceptedFiles);
            fileUploadCallback(acceptedFiles);
        }
    };

    const fileUploadCallback = async (files: File[]) => {
        const formData = new FormData();

        for (const file of files) {
            formData.append('file', file);
        }

        try {
            setLoading(true);
            await dispatch(uploadImage(formData)).then((res) => {
                const response = res.payload as any;
                setAttachments([]);
                setSelectedItems(files.map(file => ({
                    _id: file.name,
                    name: file.name,
                    path: file.name,
                    size: file.size,
                    type: file.type,
                    updatedAt: new Date().toISOString(),
                    thumbnailUrl: response?.url,
                })));
                handleFilesSelectCallback(files.map(file => ({
                    _id: file.name,
                    name: file.name,
                    path: file.name,
                    size: file.size,
                    type: file.type,
                    updatedAt: new Date().toISOString(),
                    thumbnailUrl: response?.url,
                })));
            });
            setLoading(false);
            return true;
        } catch (error) {
            toast.error(error || 'Unknown error!');
            setLoading(false);
            return false;
        }
    };

    const { getRootProps, getInputProps } = useDropzone({ onDrop });

    useEffect(() => {
        if (defaultValues) {
            setSelectedItems(defaultValues);
        }
    }, [defaultValues]);

    const handleClick = (e) => {
        e.stopPropagation();
        setIsOpen(prev => !prev);
    };

    const handleRemove = (index) => {
        const isConfirmed = window.confirm("Are you sure you want to delete the selected items?");
        if (!isConfirmed) return;

        const newSelectedItems = selectedItems.filter((_, i) => i !== index);
        setSelectedItems(newSelectedItems);
        handleFilesSelectCallback(newSelectedItems);
    };

    return (
        <>
            <div
                {...getRootProps({
                    onClick: handleClick
                })}
                className="dropzone p-5 border border-primary rounded"
                style={{ textAlign: 'center' }}
            >
                <input {...getInputProps()} />
                <p>Drag n drop some files here, or click to open the media library</p>
                {loading && <Spinner style={{ width: '3rem', height: '3rem' }} />}
            </div>
            <div className="d-flex flex-wrap gap-3 my-3">
                {defaultValues.map((item, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                        <img
                            src={item.thumbnailUrl}
                            alt={item.name}
                            className="img-fluid"
                            style={{
                                maxWidth: '100px',
                                maxHeight: '100px',
                            }}
                        />
                        <TiDelete
                            onClick={() => handleRemove(index)}
                            style={{
                                position: 'absolute',
                                top: '-0.5rem',
                                right: '-0.5rem'
                            }}
                            className='cursor-pointer text-bg-light'
                            size={20}
                        />
                    </div>
                ))}
            </div>
            {isOpen && (
                <MediaLibraryTest
                    handleFilesSelectCallback={handleFilesSelectCallback}
                    defaultValues={defaultValues}
                    sizePerPage={sizePerPage}
                    isOpen={isOpen}
                    setIsOpen={setIsOpen}
                    multiSelect={multiSelect}
                    selectedItems={selectedItems}
                    setSelectedItems={setSelectedItems}
                    attachments={attachments}
                    setAttachments={setAttachments}
                />
            )}
        </>
    );
};

const MediaLibraryTest = ({
    handleFilesSelectCallback,
    defaultValues,
    sizePerPage,
    isOpen,
    setIsOpen,
    multiSelect,
    selectedItems,
    setSelectedItems,
    attachments,
    setAttachments
}: {
    handleFilesSelectCallback: (files: FileLibraryListItem[]) => void;
    defaultValues?: FileLibraryListItem[];
    sizePerPage?: number;
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    multiSelect?: boolean;
    selectedItems: FileLibraryListItem[];
    setSelectedItems: React.Dispatch<React.SetStateAction<FileLibraryListItem[]>>;
    attachments: IAttachment[];
    setAttachments: React.Dispatch<React.SetStateAction<IAttachment[]>>;
}) => {
    const memoizedAttachments = useMemo(() => attachments, [attachments]);

    const [page, setPage] = useState<number>(0)
    const [totalPages, setTotalPages] = useState<number>(0)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [searchValue, setSearchValue] = useState<string>('');
    const dispatch = useAppDispatch()

    const fetchAttachments = (pageNumber: number) => {
        setIsLoading(true)
        dispatch(getEntities({
            page: pageNumber,
            size: sizePerPage,
            sort: 'updatedAt,desc',
            name: searchValue
        })).then(res => {
            // @ts-expect-error -- unknown type ;
            const newAttachments = res.payload.data as IAttachment[];
            if (newAttachments.length > 0) {
                const { headers } = res.payload as any;
                const totalCount = headers['x-total-count']
                if (headers['x-total-count']) {
                    setTotalPages(Math.floor(totalCount / sizePerPage))
                }
                if (pageNumber === 0) {
                    setAttachments(newAttachments)
                } else {
                    setAttachments(prev => [...prev, ...newAttachments])
                }
            }

        }).finally(() => {
            setIsLoading(false)
        })
    }
    useEffect(() => {
        if (attachments.length !== 0) {
            fetchAttachments(page)
        }
    }, [page])

    // fetch the images again with the new uploaded image
    useEffect(() => {
        if (attachments.length === 0) {
            fetchAttachments(0)
        }
    }, [attachments]);

    const filesSelectCallback = (files: FileLibraryListItem[]) => {
        setSelectedItems(files)
        handleFilesSelectCallback(files)
        setIsOpen(prev => !prev)
    }

    const filesDeleteCallback = async (files: FileLibraryListItem[]) => {
        const idsToDelete = files.map(att => att._id) as IAttachment['id'][]
        await dispatch(deleteEntities(idsToDelete))
        fetchAttachments(0)
    }

    const handleLoadMore = () => {
        setPage(prev => prev + 1)
    }

    const fileUploadCallback = async (file: File) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            await dispatch(uploadImage(formData));
            return true;
        } catch (error) {
            toast.error(error || 'Unknown error!');
            return false;
        }
    }

    const finishUploadCallback = () => {
        setAttachments([]);
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchAttachments(0)
        }, 500);

        return () => {
            clearTimeout(timeout);
        }
    }, [searchValue])

    return (
        <>
            <ReactMediaLibrary
                fileLibraryList={
                    memoizedAttachments.map(item => ({
                        _id: item.id,
                        // createdAt: new Date(item.)
                        description: '',
                        fileName: item.name + '.' + item.type.toLowerCase(),
                        size: item.size,
                        thumbnailUrl: item.url,
                        title: item.name
                    }))
                }
                fileUploadCallback={fileUploadCallback}
                filesDeleteCallback={(files) => void filesDeleteCallback(files)}
                filesSelectCallback={filesSelectCallback}
                finishUploadCallback={finishUploadCallback}
                onClose={() => { setIsOpen(prev => !prev) }}
                isOpen={isOpen}
                currentPage={page + 1}
                totalPages={totalPages}
                handleLoadMore={handleLoadMore}
                itemsPerPage={sizePerPage * (page + 1)}
                loadMoreDisabled={isLoading}
                multiSelect={multiSelect}
                selectedItemsComponent={() => (
                    <FileLibrarySelectedItems
                        itemComponent={(item) => (<CustomSelectedFormComponent {...item} />)}
                    />
                )}
                selectedItems={selectedItems}
                setSelectedItems={setSelectedItems}
                topBarComponent={() => (
                    <div className="d-flex align-items-center justify-content-center w-100 my-1">
                        <input
                            type="text"
                            placeholder="Search"
                            className="p-1"
                            onChange={(e) => setSearchValue(e.target.value)}
                            value={searchValue}
                        />
                    </div>
                )}
            />
        </>
    )
}

const CustomSelectedFormComponent: React.FC<FileLibraryListItem> = (props: FileLibraryListItem): ReactElement => {
    const header = <img alt={props.fileName} src={props.thumbnailUrl} style={{ width: '100%' }} />;

    return (
        <Card title={props.name} header={header}>
            <div>
                <p><strong>Title:</strong> {props.title}</p>
                <p><strong>File Name:</strong> {props.fileName}</p>
                <p><strong>Size:</strong> {props.size} bytes</p>
            </div>
        </Card>
    );
}

export default MediaLibrary