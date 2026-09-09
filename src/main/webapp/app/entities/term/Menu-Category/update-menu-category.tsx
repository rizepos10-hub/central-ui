import React, { useState, useEffect } from 'react';
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom';
import {getSortState, Translate, translate} from 'react-jhipster';
import { ArrowLeft, Save } from 'lucide-react';

import {overridePaginationStateWithQueryParams} from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity, updateEntity, createEntity,getEntities, reset, changeEntityField } from './menu-category.reducer';
import {uploadImage} from "app/entities/attachment/attachment.reducer";
import Select from 'app/shared/components/select/select';
import {ITEMS_PER_PAGE} from "app/shared/util/pagination.constants";
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const UpdateMenuCategory = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();


  const { id } = useParams<'id'>();
  console.log(id, 'identity1')

  const isNew = id === undefined;

  const terms = useAppSelector(state => state.menuCategory.entities);
  const termEntity = useAppSelector(state => state.menuCategory.entity);
  const loading = useAppSelector(state => state.menuCategory.loading);
  const updating = useAppSelector(state => state.menuCategory.updating);
  const updateSuccess = useAppSelector(state => state.menuCategory.updateSuccess);
  const newTerm = useAppSelector(state => state.menuCategory.entity)


  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadImageStatus, setUploadImageStatus] = useState('idle');

  const [selectedAttachments, setSelectedAttachments] = useState([])

  const [selectedParent, setSelectedParent] = useState([]);


  const termOptions = terms.map(term => ( {label: term?.name, value: term.id, id: term.id }))

  const handleParentChange = selected => {
    setSelectedParent([selected])
  }



  console.log(terms, 'termss')


  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

    dispatch(getEntities({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }))

    return () => {
      dispatch(reset());
    };

  }, []);


  useEffect(() => {



      const {id: newTermId} = newTerm
      if (updateSuccess && newTermId) {
        navigate(`/category/${newTermId}/menus/edit?page=1&sort=id,asc`)
      }
    if (termEntity?.attachments) {
      setSelectedAttachments(termEntity.attachments.map(attachment => ({ id: attachment.id, url: attachment.url })));
    }
    if (termEntity.parents?.length > 0){
      setSelectedParent((termEntity.parents.map((term) => ( {label: term?.name, value: term?.id, id: term?.id}) )))
    }
    console.log(termEntity, 'termEntity1')

  }, [updateSuccess, termEntity ]);


  const handleImageChange = async (event) => {
    const file = event.target.files[0];

    if (!file) {
      console.error('No image selected.');
      return null;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploadImageStatus('uploading');
      const response: any = await dispatch(uploadImage(formData));
      const imageUrl = response?.payload?.url;
      const imageInfo = {
        id: response?.payload?.id,
        name: response?.payload?.name,
        path: response?.payload?.path,
        size: response?.payload?.size,
        type: response?.payload?.type,
        createdAt: response?.payload?.createdAt,
        updatedAt: response?.payload?.updatedAt,
        url: imageUrl,
      };
      setSelectedAttachments((prevAttachments) => [ imageInfo]);
      setUploadImageStatus('success');

      return imageInfo;
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadImageStatus('error');

      return null;
    }

  };

  console.log(selectedAttachments)
console.log(termEntity)
  const handleChange = e => {
    const { name, value } = e.target;
    dispatch(changeEntityField({ name, value }));
  };

  const saveEntity = () => {
    setSelectedImage('')
    setSelectedAttachments([])

    const entity = {
      ...termEntity,
      parents: selectedParent.map(parent => ({id :parent.id})),
      attachments: selectedAttachments,
    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  const removeAttachment = (attachmentId) => {
    setSelectedAttachments((prevAttachments) =>
      prevAttachments.filter((attachment) => attachment.id !== attachmentId)
    );
  };

  return (
    <PageWrapper>
      <Card className="max-w-2xl">
        <CardHeader className="p-3">
          <CardTitle className="text-sm font-semibold">
            {isNew ?
              <Translate contentKey={'menus.category.update.create.title'}>Create a Menu Category</Translate> :
              <Translate contentKey={'menus.category.update.edit.title'}>Edit Menu Category</Translate>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {loading ? (
            <p className="text-xs">Loading...</p>
          ) : (
            <form>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="term-name" className="text-xs">
                    {translate('menus.category.update.name')}
                  </Label>
                  <Input
                    id="term-name"
                    name="name"
                    data-cy="name"
                    type="text"
                    required
                    value={termEntity?.name || ''}
                    onChange={handleChange}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="term-description" className="text-xs">
                    Description
                  </Label>
                  <Textarea
                    id="term-description"
                    name="description"
                    data-cy="description"
                    rows={3}
                    value={termEntity?.description || ''}
                    onChange={handleChange}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">
                    <Translate contentKey={'common.image'}>Image</Translate>
                  </Label>
                  <MediaLibrary
                    handleFilesSelectCallback={(files) => setSelectedAttachments((prevAttachments) => [transformAttachmentStructure(files, 'toIAttachment')[0]])}
                    defaultValues={transformAttachmentStructure(selectedAttachments ? selectedAttachments : [], 'toFileLibraryListItem')}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">
                    <Translate contentKey={'menus.category.update.parents'}>Parents</Translate>
                  </Label>
                  <Select
                    options={termOptions}
                    value={selectedParent}
                    isClearable
                    onChange={handleParentChange}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                  >
                    <Link to="/category/menus" id="cancel-save" data-cy="entityCreateCancelButton">
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      <Translate contentKey="entity.action.back">Back</Translate>
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={saveEntity}
                    id="save-entity"
                    data-cy="entityCreateSaveButton"
                    disabled={updating}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    <Translate contentKey="entity.action.save">Save</Translate>
                  </Button>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default UpdateMenuCategory;

//
// {isNew ? (
//   <ValidatedField
//     id="term-parents"
//     name="parents"
//     data-cy="parents"
//     label={translate('tempApp.term.parents')}
//     type="select"
//   >
//     <option value="">{''}</option>
//     {terms &&
//       terms
//         .filter(term => term.taxonomy && term.taxonomy.name === 'Menu Category')
//         .map(otherEntity => (
//           <option value={otherEntity.id} key={otherEntity.id}>
//             {otherEntity.name}
//           </option>
//         ))}
//   </ValidatedField>
// ) : (
//   <ValidatedField
//     name="parents"
//     label={translate('tempApp.term.parents')}
//     type="select"
//   >
//     <option defaultValue={termEntity?.parents && termEntity.parents.length > 0 ?  termEntity.parents[0]?.name    : ''}>
//       {termEntity?.parents && termEntity.parents.length > 0 ? termEntity.parents[0]?.name : ''}
//     </option>
//
//     {terms &&
//       terms
//         .filter(term => term.taxonomy && term.taxonomy?.name === 'Menu Category')
//         .map(otherEntity => (
//           <option value={otherEntity.id} key={otherEntity.id}>
//             {otherEntity?.name}
//           </option>
//         ))}
//     {termEntity?.parents && termEntity.parents.length > 0 && termEntity.parents[0]?.name && (
//       <option value="">{''}</option>
//     )}
//   </ValidatedField>
// )}
//
