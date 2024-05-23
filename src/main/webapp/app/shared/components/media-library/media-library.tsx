import React, { ReactElement, useEffect, useMemo, useState } from 'react'
import { FileLibrarySelectedItems, ReactMediaLibrary } from 'react-media-library-cloud-links'
import { useAppDispatch, useAppSelector } from '../../../config/store';
import { getEntities, uploadImage } from '../../../entities/attachment/attachment.reducer';
import { IAttachment } from '../../model/attachment.model';
import { toast } from 'react-toastify';
import { FileLibraryListItem } from 'react-media-library-cloud-links';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';

const MediaLibrary = ({
    sizePerPage = 30,
    multiSelect,
    handleFilesSelectCallback,
    defaultValues
}: {
    sizePerPage: number
    multiSelect?: boolean
    handleFilesSelectCallback: (files: FileLibraryListItem[]) => void
    defaultValues?: FileLibraryListItem[]
}) => {
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const [page, setPage] = useState<number>(0)
    const [totalPages, setTotalPages] = useState<number>(500)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [selectedItems, setSelectedItems] = useState<Array<FileLibraryListItem>>([]);
    const dispatch = useAppDispatch()

    // const attachments: IAttachment[] = useAppSelector(state => state.attachment.entities);
    const [attachments, setAttachments] = useState<IAttachment[]>([])
    const memoizedAttachments = useMemo(() => attachments, [attachments]);

    const fetchAttachments = (pageNumber: number) => {
        setIsLoading(true)
        dispatch(getEntities({
            page: pageNumber,
            size: sizePerPage,
            sort: 'updatedAt,desc'
        })).then(res => {
            // @ts-expect-error -- unknown type ;
            const newAttachments = res.payload.data as IAttachment[];
            if (newAttachments.length > 0) {
                setAttachments(prev => [...prev, ...newAttachments])
            } else {
                // to remove the load more button since there is no total pages in the api
                setTotalPages(0)
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

    useEffect(() => {
        if (defaultValues) {
            setSelectedItems(prev => [...prev, ...defaultValues])
        }
    }, []);

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

    // fetch the images again with the new uploaded image
    useEffect(() => {
        if (attachments.length === 0) {
            fetchAttachments(0)
        }
    }, [attachments]);

    const filesSelectCallback = (files: FileLibraryListItem[]) => {
        handleFilesSelectCallback(files)
        setIsOpen(prev => !prev)
    }

    const filesDeleteCallback = (files: FileLibraryListItem[]) => {
        // todo: to handle BULK DELETE
    }

    return (
        <>
            <Button
                onClick={() => setIsOpen(prev => !prev)}
                type='button'
            >
                Select Media
            </Button>
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
                filesDeleteCallback={filesDeleteCallback}
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