import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getTags } from 'app/entities/tag/tag.reducer';
import { getEntity, updateEntity, createEntity, changeEntityField, reset } from './tag-group.reducer';
import Select from 'react-select';
import { ITEMS_PER_PAGE } from 'app/shared/util/pagination.constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save, PlusCircle } from 'lucide-react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { ITag } from "app/shared/model/TAG/tag.model";
import { ITagGroup } from "app/shared/model/TAG/tag-group.model";

export const TagGroupUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const Tags: ITag[] = useAppSelector(state => state.tag.entities);

  const tagGroupEntity: ITagGroup = useAppSelector(state => state.tagGroup.entity);
  const loading = useAppSelector(state => state.tagGroup.loading);
  const updating = useAppSelector(state => state.tagGroup.updating);
  const updateSuccess = useAppSelector(state => state.tagGroup.updateSuccess);

  const [paginationState, setPaginationState] = useState({
    activePage: 1,
    itemsPerPage: ITEMS_PER_PAGE,
    sort: 'id',
    order: 'asc'
  });

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(
      getTags({
        page: paginationState.activePage - 1,
        size: paginationState.itemsPerPage,
        sort: `${paginationState.sort},${paginationState.order}`,
      })
    );
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    dispatch(changeEntityField({ name, value }))
  };

  const saveEntity = (e, createNew = false) => {
    e?.preventDefault();
    const entity = {
      ...tagGroupEntity,
    };

    if (isNew) {
      dispatch(createEntity(entity)).then((res) => {
        if (createNew) {
          dispatch(reset());
        } else {
          const payload = res?.payload as any;
          const newId = payload?.data?.id;

          // @ts-expect-error -- unknown type
          if (!res?.error) {
            navigate(`/tag-group/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/tag-group/new`)
        }
      })
    }
  };

  return (
    <PageWrapper>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">
          {isNew ? (
            <Translate contentKey={'tagGroup.update.create.title'}>Create New tag Group</Translate>
          ) : (
            <Translate contentKey={'tagGroup.update.edit.title'}>Edit tag Group</Translate>
          )}
        </h2>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <p className="text-xs">Loading...</p>
            ) : (
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tag-group-name" className="text-xs">
                    <Translate contentKey={'tagGroup.update.name'}>tag Name</Translate>
                  </Label>
                  <Input
                    type="text"
                    name="name"
                    required={true}
                    id="tag-group-name"
                    value={tagGroupEntity?.name || ''}
                    onChange={handleChange}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-xs">
                    <Translate contentKey="tagGroup.update.tags">Tags</Translate>
                  </Label>
                  <Select
                    isMulti={true}
                    value={tagGroupEntity?.tags || []}
                    onChange={(tags) => dispatch(changeEntityField({ name: "tags", value: tags as ITag[] }))}
                    options={Tags}
                    getOptionLabel={option => option.name}
                    getOptionValue={option => option.id}
                    className="text-xs"
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '32px',
                        fontSize: '0.75rem',
                      }),
                      menu: (base) => ({
                        ...base,
                        fontSize: '0.75rem',
                      })
                    }}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => navigate(-1)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    <Translate contentKey="entity.action.back">Back</Translate>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={saveEntity}
                    disabled={updating}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    <Translate contentKey="entity.action.save">Save</Translate>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={(e) => saveEntity(e, true)}
                    disabled={updating}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default TagGroupUpdate;
