import React from 'react'
import { translate, Translate } from 'react-jhipster';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SeoTags = ({ field, onFieldChange }) => {
    const handleFieldChange = (fieldName, value) => {
        onFieldChange(fieldName, value);
    };

    return (
        <div className="p-3 space-y-4">
            <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-semibold">
                    <Translate contentKey={'items.update.tabs.seo.title'}>Title</Translate>
                </Label>
                <Input
                    type="text"
                    id="title"
                    value={field?.title || ''}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                    placeholder={translate('items.update.tabs.seo.title')}
                    className="h-8 text-xs"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-semibold">
                    <Translate contentKey={'items.update.tabs.seo.description'}>Description</Translate>
                </Label>
                <Input
                    type="text"
                    id="description"
                    value={field?.description || ''}
                    onChange={(e) => handleFieldChange("description", e.target.value)}
                    placeholder={translate('items.update.tabs.seo.description')}
                    className="h-8 text-xs"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="keywords" className="text-xs font-semibold">
                    <Translate contentKey={'items.update.tabs.seo.keywords'}>key words</Translate>
                </Label>
                <Input
                    type="text"
                    id="keywords"
                    value={field?.keywords || ''}
                    onChange={(e) => handleFieldChange("keywords", e.target.value)}
                    placeholder={translate('items.update.tabs.seo.keywords')}
                    className="h-8 text-xs"
                />
            </div>
        </div>
    )
}

export default SeoTags
