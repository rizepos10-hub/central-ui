export function transformAttachmentStructure(array, flag: 'toIAttachment' | 'toFileLibraryListItem') {
    if (!array || array.length === 0 || !array[0]) {
        return [];
    }

    if (flag === 'toFileLibraryListItem') {
        return array.map(item => ({
            _id: item.id,
            description: '',
            fileName: item.name,
            size: item.size,
            thumbnailUrl: item.url,
            title: item.name ? item.name.split('_')[0] : ''
        }));
    } else if (flag === 'toIAttachment') {
        return array.map(item => ({
            createdAt: new Date().toISOString(),
            id: item._id,
            name: item.title + '_6_1_1',
            path: item.thumbnailUrl.replace('http://164.92.188.249', ''),
            size: item.size,
            type: item.type,
            updatedAt: new Date().toISOString(),
            url: item.thumbnailUrl
        }));
    } else {
        throw new Error('Invalid flag');
    }
}
