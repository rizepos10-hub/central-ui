import React, { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Translate, translate } from 'react-jhipster';
import { RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities } from './custom-definitions.reducer';
import { initialState } from 'app/shared/reducers/authentication';


export const CustomDefinition = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const customDefinitions = useAppSelector(state => state.customDefinitions.entities);
  const loading = useAppSelector(state => state.customDefinitions.loading);
  const totalItems = useAppSelector(state => state.customDefinitions.totalItems);
  const [searchParam, setSearchParams] = useSearchParams();
  const query = JSON.parse(searchParam.get('query')) || initialState;

  useEffect(() => {
    dispatch(getEntities({
      page: 0,
      size: 10,
      sort: 'id,asc',
    }))
  }, []);

  const handleCreate = () => {
    navigate('/custom-definitions/new')
  }

  const handleRefresh = () => {
    dispatch(getEntities({
      page: 0,
      size: 10,
      sort: 'id,asc',
    }))
  }

  return (
    <PageWrapper>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">
            <Translate contentKey={'common.customDefinitions'}>Custom Definitions</Translate>
          </h2>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleRefresh} disabled={loading} className="h-8 text-xs">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              <Translate contentKey="common.refresh">Refresh</Translate>
            </Button>
            <Button onClick={handleCreate} disabled={loading} className="h-8 text-xs">
              <Plus className="h-4 w-4 mr-2" />
              <Translate contentKey={'common.create'}>Create</Translate>
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">
                <Translate contentKey={'common.name'}>Name</Translate>
              </TableHead>
              <TableHead className="text-xs">
                <Translate contentKey={'common.label'}>Label</Translate>
              </TableHead>
              <TableHead className="text-xs">
                <Translate contentKey={'common.type'}>Type</Translate>
              </TableHead>
              <TableHead className="text-xs">
                <Translate contentKey={'common.required'}>Required</Translate>
              </TableHead>
              <TableHead className="text-xs">
                <Translate contentKey={'common.display'}>Display</Translate>
              </TableHead>
              <TableHead className="text-xs w-20">
                <Translate contentKey={'common.edit'}>Edit</Translate>
              </TableHead>
              <TableHead className="text-xs w-20">
                <Translate contentKey={'common.delete'}>Delete</Translate>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-xs">
                  Loading...
                </TableCell>
              </TableRow>
            ) : customDefinitions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-xs">
                  No custom definitions found
                </TableCell>
              </TableRow>
            ) : (
              customDefinitions.map((customDefinition) => (
                <TableRow key={customDefinition.id}>
                  <TableCell className="text-xs">
                    <Link
                      to={`/custom-definitions/${customDefinition.id}/edit`}
                      className="text-primary hover:underline"
                    >
                      {customDefinition.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">{customDefinition.label}</TableCell>
                  <TableCell className="text-xs">{customDefinition.type}</TableCell>
                  <TableCell className="text-xs">{customDefinition.required ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="text-xs">{customDefinition.display ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="text-xs">
                    <Link to={`/custom-definitions/${customDefinition.id}/edit`}>
                      <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer" />
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">
                    <Link to={`/custom-definitions/${customDefinition.id}/delete`}>
                      <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80 cursor-pointer" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </PageWrapper>
  );
};

export default CustomDefinition;
