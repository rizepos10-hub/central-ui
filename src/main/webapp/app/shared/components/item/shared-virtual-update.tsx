import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Row, Col, FormGroup } from 'reactstrap';
import { getSortState, Translate, translate } from 'react-jhipster';
import { overridePaginationStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import Select from 'react-select';
import { IItem } from 'app/shared/model/ITEM/item.model';
import { InputTextarea } from 'primereact/inputtextarea';
import { getEntities as getTags } from 'app/entities/tag/tag.reducer';
import MediaLibrary from '../media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { InputText } from 'primereact/inputtext';

type OnFieldChangeFunction = (fieldName: string, value: any) => void;

type SharedItemProps = {
  item: IItem;
  onFieldChange: OnFieldChangeFunction;
};

export const SharedVirtualItemUpdate = ({ item, onFieldChange }: SharedItemProps) => {
  const dispatch = useAppDispatch();
  const location = useLocation();

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const tags = useAppSelector(state => state.tag.entities);

  const addImage = files => {
    onFieldChange('attachments', transformAttachmentStructure(files, 'toIAttachment'));
  };

  useEffect(() => {
    dispatch(
      getTags({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
  }, []);


  return (
    <div>
      <Row>
        <FormGroup className={'d-flex flex-column gap-1'}>
          <Col md="12">
            <div className="row">
                <div className={'d-flex flex-column gap-1  col'}>
                  <label className={'font-semibold'}>
                    <Translate contentKey={'items.update.name'}>Name</Translate>
                  </label>
                  <InputText
                    type="text"
                    name="name"
                    id="name"
                    required={true}
                    placeholder={translate('items.update.placeholders.itemName')}
                    value={item.name || ''}
                    onChange={e => onFieldChange('name', e.target.value)}
                  />
                </div>

              <div className={'d-flex flex-column gap-1  col'}>
                <label className={'font-semibold'}>
                  <Translate contentKey={'items.update.shortDescription'}>Short Description</Translate>
                </label>
                <InputTextarea
                  name="desc"
                  id="desc"
                  placeholder={translate('items.update.placeholders.shortDescription')}
                  value={item.desc || ''}
                  onChange={e => onFieldChange('desc', e.target.value)}
                />
              </div>
            </div>

            <div className="row">
              <div className={'d-flex flex-column gap-1  col'}>
                <label className={'font-semibold'}>
                  <Translate contentKey="items.update.tags">Tags</Translate>
                </label>
                <Select
                  value={item?.tags || []}
                  isMulti={true}
                  options={tags}
                  getOptionLabel={option => option.name}
                  getOptionValue={option => option.id}
                  onChange={selectedTags => onFieldChange('tags', selectedTags)}
                  onMenuOpen={() => {
                    dispatch(
                      getTags({
                        page: paginationState.activePage - 1,
                        size: paginationState.itemsPerPage,
                        sort: `${paginationState.sort},${paginationState.order}`,
                      })
                    );
                  }}
                />
              </div>
            </div>

            <Row className={''}>
              <Col md={'7'}>
                <div className={'d-flex flex-column '}>
                  <label className={'font-semibold'}>
                    <Translate contentKey={'items.update.image'}>Image</Translate>
                  </label>
                  <MediaLibrary
                    handleFilesSelectCallback={files => addImage(files)}
                    defaultValues={transformAttachmentStructure(item?.attachments, 'toFileLibraryListItem')}
                  />
                </div>
              </Col>
            </Row>

          </Col>
        </FormGroup>
      </Row>
    </div>
  );
};

export default SharedVirtualItemUpdate;
