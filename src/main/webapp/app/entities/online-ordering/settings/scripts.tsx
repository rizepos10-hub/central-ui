import React, { useEffect } from 'react';
import { Save } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IScriptsSettings } from 'app/shared/model/ONLINE_ORDERING/ui-settings-sections.model';
import { ScriptSnippets } from './components/script-snippets';
import { changeEntityField, getEntity, updateEntity } from './scripts.reducer';

const ScriptsSettingsPage = () => {
  const dispatch = useAppDispatch();
  const entity: IScriptsSettings = useAppSelector(state => state.scriptsSettings.entity);
  const loading = useAppSelector(state => state.scriptsSettings.loading);
  const updating = useAppSelector(state => state.scriptsSettings.updating);

  useEffect(() => {
    dispatch(getEntity());
  }, []);

  return (
    <PageWrapper className="max-w-5xl mx-auto">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Scripts</h2>
          <p className="text-xs text-muted-foreground">Custom storefront scripts and snippets</p>
        </div>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Script snippets</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ScriptSnippets snippets={entity.scriptSnippets || []} onChange={snippets => dispatch(changeEntityField({ name: 'scriptSnippets', value: snippets }))} />
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

export default ScriptsSettingsPage;
