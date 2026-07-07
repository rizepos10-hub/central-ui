import React, { ReactElement, useEffect, useMemo, useState } from 'react'
import { FileLibrarySelectedItems, ReactMediaLibrary } from 'react-media-library-cloud-links'
import { useAppDispatch } from '../../../config/store';
import { deleteEntities, getEntities, uploadImage } from '../../../entities/attachment/attachment.reducer';
import { IAttachment } from '../../model/attachment.model';
import { toast } from 'react-toastify';
import { FileLibraryListItem } from 'react-media-library-cloud-links';
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, Maximize2, Trash2 } from 'lucide-react';
import ImageLightbox from '../image-lightbox';

interface MediaLibraryProps {
    sizePerPage?: number
    multiSelect?: boolean
    handleFilesSelectCallback: (files: FileLibraryListItem[]) => void
    defaultValues?: FileLibraryListItem[]
    /** compact: small add zone + open library only (no duplicate thumbnail grid — use with ProductImageGallery). */
    layout?: 'default' | 'compact'
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({
    sizePerPage = 30,
    multiSelect,
    handleFilesSelectCallback,
    defaultValues,
    layout = 'default',
}) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [attachments, setAttachments] = useState<IAttachment[]>([]);
    const [selectedItems, setSelectedItems] = useState<Array<FileLibraryListItem>>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

    const dispatch = useAppDispatch();

    const onDrop = acceptedFiles => {
        if (!multiSelect && acceptedFiles.length > 1) {
            toast.error('Only one image can be added for this field');
            return;
        } else {
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
                const uploaded = files.map(file => ({
                    _id: response?.id,
                    name: file.name,
                    path: file.name,
                    size: file.size,
                    type: undefined as string | undefined,
                    updatedAt: new Date().toISOString(),
                    thumbnailUrl: response?.url,
                }));
                setAttachments([]);
                if (multiSelect && defaultValues?.length) {
                    const existingIds = new Set(defaultValues.map(d => d._id));
                    const merged = [...defaultValues];
                    for (const u of uploaded) {
                        if (u._id && !existingIds.has(u._id)) {
                            merged.push(u);
                            existingIds.add(u._id);
                        }
                    }
                    setSelectedItems(merged);
                    handleFilesSelectCallback(merged);
                } else if (multiSelect && (!defaultValues || defaultValues.length === 0)) {
                    setSelectedItems(uploaded);
                    handleFilesSelectCallback(uploaded);
                } else {
                    setSelectedItems(uploaded);
                    handleFilesSelectCallback(uploaded);
                }
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

    const confirm1 = (index) => {
        setItemToDelete(index);
        setShowDeleteDialog(true);
    };

    const handleRemove = () => {
        if (itemToDelete !== null) {
            const newSelectedItems = selectedItems.filter((_, i) => i !== itemToDelete);
            setSelectedItems(newSelectedItems);
            handleFilesSelectCallback(newSelectedItems);
            setItemToDelete(null);
            setShowDeleteDialog(false);
        }
    };

    const isCompact = layout === 'compact';

    return (
        <>
            <div
                {...getRootProps({
                    onClick: handleClick
                })}
                className={
                    isCompact
                        ? 'p-3 border border-dashed border-border rounded-md cursor-pointer hover:bg-muted/40 transition-colors text-center'
                        : 'p-5 border border-primary rounded cursor-pointer hover:bg-muted/50 transition-colors text-center'
                }
            >
                <input {...getInputProps()} />
                <p className="text-xs text-muted-foreground">
                    {isCompact
                        ? 'Drop files to upload, or click to browse the media library'
                        : 'Drag n drop some files here, or click to open the media library'}
                </p>
                {loading && (
                    <Loader2 className={isCompact ? 'animate-spin h-6 w-6 mx-auto mt-2' : 'animate-spin h-12 w-12 mx-auto mt-3'} />
                )}
            </div>
            {!isCompact ? (
                <div className="flex flex-wrap gap-3 my-3">
                    {defaultValues?.map((item, index) => (
                        <div
                            key={index}
                            className="group relative w-24 h-24 rounded-md border overflow-hidden bg-muted/40 shrink-0"
                        >
                            <img
                                src={item.thumbnailUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    type="button"
                                    className="rounded-full bg-white/20 hover:bg-white/40 p-1.5 text-white transition-colors"
                                    onClick={() => setLightboxSrc(item.thumbnailUrl)}
                                    aria-label="Enlarge image"
                                >
                                    <Maximize2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    className="rounded-full bg-white/20 hover:bg-destructive/80 p-1.5 text-white transition-colors"
                                    onClick={() => confirm1(index)}
                                    aria-label="Remove image"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}

            {lightboxSrc && (
                <ImageLightbox
                    src={lightboxSrc}
                    open={!!lightboxSrc}
                    onClose={() => setLightboxSrc(null)}
                />
            )}

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base">Confirmation</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs">
                            Are you sure you want to proceed?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowDeleteDialog(false)} className="h-8 text-xs">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemove} className="h-8 text-xs">
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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
                    setTotalPages(Math.ceil(totalCount / sizePerPage))
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
                        fileName: item.name + '.' + item.type?.toLowerCase(),
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
                    <div className="flex items-center justify-center w-full my-1">
                        <input
                            type="text"
                            placeholder="Search"
                            className="p-1 border rounded text-xs"
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
    return (
        <Card>
            <CardHeader className="p-0">
                <img alt={props.fileName} src={props.thumbnailUrl} style={{ width: '100%' }} />
            </CardHeader>
            <CardContent className="p-3">
                <CardTitle className="text-sm mb-2">{props.name}</CardTitle>
                <div className="text-xs space-y-1">
                    <p><strong>Title:</strong> {props.title}</p>
                    <p><strong>File Name:</strong> {props.fileName}</p>
                    <p><strong>Size:</strong> {props.size} bytes</p>
                </div>
            </CardContent>
        </Card>
    );
}

export default MediaLibrary
