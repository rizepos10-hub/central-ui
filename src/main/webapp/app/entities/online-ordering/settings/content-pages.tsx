import React, { useEffect } from 'react';
import { Save } from 'lucide-react';
import { Editor } from 'primereact/editor';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IContentPagesSettings } from 'app/shared/model/ONLINE_ORDERING/ui-settings-sections.model';
import { changeEntityField, getEntity, updateEntity } from './content-pages.reducer';

const quillHeader = (
  <span className="ql-formats">
    <select className="ql-size">
      <option value="small"></option>
      <option selected></option>
      <option value="large"></option>
      <option value="huge"></option>
    </select>
    <button className="ql-bold"></button>
    <button className="ql-italic"></button>
    <button className="ql-underline"></button>
    <select className="ql-color"></select>
    <button className="ql-align" value=""></button>
    <button className="ql-align" value="center"></button>
    <button className="ql-align" value="right"></button>
    <button className="ql-list" value="bullet"></button>
  </span>
);

const ContentPagesSettingsPage = () => {
  const dispatch = useAppDispatch();
  const entity: IContentPagesSettings = useAppSelector(state => state.contentPagesSettings.entity);
  const loading = useAppSelector(state => state.contentPagesSettings.loading);
  const updating = useAppSelector(state => state.contentPagesSettings.updating);

  useEffect(() => {
    dispatch(getEntity());
  }, []);

  return (
    <PageWrapper className="max-w-6xl mx-auto">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Content Pages</h2>
          <p className="text-xs text-muted-foreground">Storefront legal and informational content pages</p>
        </div>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Content pages</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <EditorBlock label="Privacy Policy" value={entity.privacyPolicy || null} onChange={value => dispatch(changeEntityField({ name: 'privacyPolicy', value }))} />
            <EditorBlock label="Return Policy" value={entity.returnPolicy || null} onChange={value => dispatch(changeEntityField({ name: 'returnPolicy', value }))} />
            <EditorBlock label="About Us" value={entity.aboutUs || null} onChange={value => dispatch(changeEntityField({ name: 'aboutUs', value }))} />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button className="h-8 text-xs" disabled={loading || updating} onClick={() => dispatch(updateEntity(entity))}>
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
};

const EditorBlock = ({ label, value, onChange }: { label: string; value: string | null; onChange: (value: string | null) => void }) => (
  <div className="flex flex-col gap-2">
    <Label className="text-xs font-semibold">{label}</Label>
    <Editor value={value} onTextChange={e => onChange(e.htmlValue)} style={{ minHeight: '240px' }} headerTemplate={quillHeader} />
  </div>
);

export default ContentPagesSettingsPage;
