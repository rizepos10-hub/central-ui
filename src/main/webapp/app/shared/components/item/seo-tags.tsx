import { InputText } from 'primereact/inputtext';
import React from 'react'
import { translate, Translate } from 'react-jhipster';

const SeoTags = ({ field, onFieldChange }) => {
    const handleFieldChange = (fieldName, value) => {
        onFieldChange(fieldName, value);
    };

    return (
        <div className="p-3">
            <div className="row gap-2 mb-2">
                <label className={'font-semibold p-0'}>
                    <Translate contentKey={'items.update.tabs.seo.title'}>Title</Translate>
                </label>

                <InputText
                    id="title"
                    value={field?.title || ''}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                    placeholder={translate('items.update.tabs.seo.title')}
                />
            </div>
            <div className="row gap-2 mb-2">
                <label className={'font-semibold p-0'}>
                    <Translate contentKey={'items.update.tabs.seo.description'}>Description</Translate>
                </label>
                <InputText
                    id="description"
                    value={field?.description || ''}
                    onChange={(e) => handleFieldChange("description", e.target.value)}
                    placeholder={translate('items.update.tabs.seo.description')}
                />
            </div>
            <div className="row gap-2 mb-2">
                <label className={'font-semibold p-0'}>
                    <Translate contentKey={'items.update.tabs.seo.keywords'}>key words</Translate>
                </label>
                <InputText
                    id="keywords"
                    value={field?.keywords || ''}
                    onChange={(e) => handleFieldChange("keywords", e.target.value)}
                    placeholder={translate('items.update.tabs.seo.keywords')}
                />
            </div>
        </div>
    )
}

export default SeoTags