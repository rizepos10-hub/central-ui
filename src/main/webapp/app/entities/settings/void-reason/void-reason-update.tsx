import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity, updateEntity, createEntity, reset, changeEntityField } from "./void-reason.reducer";
import { getEntities as getTaxProfiles } from 'app/entities/settings/tax-profile/tax-profile.reducer';
import { Save, ArrowLeft } from 'lucide-react';
import { getSortState, Translate } from "react-jhipster";
import { overridePaginationStateWithQueryParams } from "app/shared/util/entity-utils";
import { ITEMS_PER_PAGE } from "app/shared/util/pagination.constants";
import { IVoidReason } from "app/shared/model/void-reason.model";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const VoidReasonUpdate = () => {
  const dispatch = useAppDispatch();
  const { id } = useParams<'id'>();
  const isNew = id === undefined;
  const navigate = useNavigate();
  const voidReason: IVoidReason = useAppSelector(state => state.voidReason.entity);
  const updating = useAppSelector(state => state.voidReason.updating);
  const loading = useAppSelector(state => state.voidReason.loading);

  const [paginationState, setPaginationState] = useState(
    overridePaginationStateWithQueryParams(getSortState(location, ITEMS_PER_PAGE, 'id'), location.search)
  );

  const handleChange = <T extends keyof IVoidReason>(field: T, value: IVoidReason[T]) => {
    dispatch(changeEntityField({ field, value }))
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }
    dispatch(getTaxProfiles({
      page: paginationState.activePage - 1,
      size: paginationState.itemsPerPage,
      sort: `${paginationState.sort},${paginationState.order}`,
    }));
  }, []);


  const saveEntity = (e, createNew = false) => {
    e.preventDefault();
    const entity = {
      ...voidReason
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
            navigate(`/void-reasons/${newId}/edit`)
          }
        }
      })
    } else {
      dispatch(updateEntity(entity)).then(() => {
        if (createNew) {
          navigate(`/void-reasons/new`)
        }
      })
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="space-y-4">
        <h2 className="text-xl font-bold">
          {isNew ? (
            <Translate contentKey="tempApp.voidReason.home.createLabel">Create new Void Reason</Translate>
          ) : (
            <Translate contentKey="tempApp.voidReason.home.editLabel">Edit Void Reason</Translate>
          )}
          {!isNew && voidReason.code && ` - ${voidReason.code}`}
        </h2>

        <form onSubmit={saveEntity} className="space-y-4">
          <div className="bg-white p-4 rounded-md border space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-xs font-semibold">
                <Translate contentKey="tempApp.voidReason.code">Code</Translate>
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="code"
                name="code"
                value={voidReason.code || ''}
                onChange={(e) => handleChange("code", e.target.value)}
                className="h-7 text-xs"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason" className="text-xs font-semibold">
                <Translate contentKey="tempApp.voidReason.reason">Reason</Translate>
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="reason"
                name="reason"
                value={voidReason.reason || ''}
                onChange={(e) => handleChange("reason", e.target.value)}
                className="h-7 text-xs"
                required
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              id="cancel-save"
              data-cy="entityCreateCancelButton"
              onClick={() => navigate(-1)}
              className="h-8 text-xs"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <Translate contentKey="entity.action.back">Back</Translate>
            </Button>
            <Button
              type="submit"
              id="save-entity"
              data-cy="entityCreateSaveButton"
              disabled={updating}
              className="h-8 text-xs"
            >
              <Save className="h-4 w-4 mr-2" />
              <Translate contentKey="entity.action.save">Save</Translate>
            </Button>
            <Button
              type="button"
              onClick={(e) => saveEntity(e, true)}
              id="save-and-new-entity"
              disabled={updating}
              className="h-8 text-xs"
            >
              <Save className="h-4 w-4 mr-2" />
              <Translate contentKey="entity.action.saveandnew">Save & create</Translate>
            </Button>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default VoidReasonUpdate;
