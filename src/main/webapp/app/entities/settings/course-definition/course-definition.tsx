import React, { useMemo, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { ICourseDefinition } from 'app/shared/model/COURSE-DEFINITION/course-definition';
import { changeEntityField, getEntities } from './course-definition.reducer';
import { translate } from 'react-jhipster';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

export const CourseDefinition = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const courseDefinitionList: ICourseDefinition[] = useAppSelector(state => state.courseDefinition.entities);
  const loading = useAppSelector(state => state.courseDefinition.loading);

  const [orderFilter, setOrderFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [descriptionFilter, setDescriptionFilter] = useState('');

  const courseDefinitionListSorted = useMemo(() => {
    if (!courseDefinitionList) return [];

    return [...courseDefinitionList].sort((a, b) => {
      const orderA = a?.order ?? 0;
      const orderB = b?.order ?? 0;
      return orderA - orderB;
    });
  }, [courseDefinitionList]);

  const filteredList = useMemo(() => {
    return courseDefinitionListSorted.filter(item => {
      const matchesOrder = !orderFilter || (item.order?.toString() || '').includes(orderFilter);
      const matchesName = !nameFilter || (item.name || '').toLowerCase().includes(nameFilter.toLowerCase());
      const matchesDescription = !descriptionFilter || (item.description || '').toLowerCase().includes(descriptionFilter.toLowerCase());
      return matchesOrder && matchesName && matchesDescription;
    });
  }, [courseDefinitionListSorted, orderFilter, nameFilter, descriptionFilter]);

  useEffect(() => {
    dispatch(getEntities({
      page: 0,
      size: 1000,
      sort: 'id,desc'
    }));
  }, []);

  const handleSync = () => {
    dispatch(getEntities({
      page: 0,
      size: 1000,
      sort: 'id,desc'
    }));
  };

  const handleCreate = () => {
    navigate('/course-definition/new')
  }

  return (
    <PageWrapper>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Course Definitions</h2>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleSync} size="sm" className="h-7 text-xs">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleCreate} disabled={loading} size="sm" className="h-7 text-xs">
              <Plus className="h-4 w-4 mr-2" />
              Add New Course Definition
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Order</TableHead>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Description</TableHead>
              <TableHead className="text-xs text-center">{translate('items.view.fields.edit')}</TableHead>
              <TableHead className="text-xs text-center">{translate('items.view.fields.delete')}</TableHead>
            </TableRow>
            <TableRow>
              <TableHead>
                <Input
                  placeholder="Search..."
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                  className="h-7 text-xs"
                />
              </TableHead>
              <TableHead>
                <Input
                  placeholder="Search by name"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="h-7 text-xs"
                />
              </TableHead>
              <TableHead>
                <Input
                  placeholder="Search by description"
                  value={descriptionFilter}
                  onChange={(e) => setDescriptionFilter(e.target.value)}
                  className="h-7 text-xs"
                />
              </TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredList.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-xs">{row.order}</TableCell>
                <TableCell className="text-xs">{row.name}</TableCell>
                <TableCell className="text-xs">{row.description}</TableCell>
                <TableCell className="text-center">
                  <Link to={`/course-definition/${row.id}/edit`}>
                    <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground inline-block cursor-pointer" />
                  </Link>
                </TableCell>
                <TableCell className="text-center">
                  <Link to={`/course-definition/${row.id}/delete`}>
                    <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700 inline-block cursor-pointer" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </PageWrapper>
  );
};

export default CourseDefinition;
