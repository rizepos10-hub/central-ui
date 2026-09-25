const LEGACY_ATTACHMENT_HOST = 'http://164.92.188.249';

export function publicAttachmentUrl(item?: { thumbnailUrl?: string; url?: string | null; path?: string | null } | null): string {
    const raw = String(item?.thumbnailUrl || item?.url || item?.path || '').trim();
    if (!raw) return '';
    const stripped = raw.replace(LEGACY_ATTACHMENT_HOST, '');
    if (/^https?:\/\//i.test(stripped)) return stripped;
    if (/^https?:\/\//i.test(raw)) return raw;
    return stripped;
}

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
            thumbnailUrl: publicAttachmentUrl(item),
            title: item.name ? item.name.split('_')[0] : ''
        }));
    } else if (flag === 'toIAttachment') {
        return array.map(item => {
            const url = publicAttachmentUrl(item);
            return {
                createdAt: new Date().toISOString(),
                id: item._id,
                name: item.title ? `${item.title}_6_1_1` : item.fileName || 'image',
                path: url,
                size: item.size,
                type: item.type,
                updatedAt: new Date().toISOString(),
                url,
            };
        });
    } else {
        throw new Error('Invalid flag');
    }
}
