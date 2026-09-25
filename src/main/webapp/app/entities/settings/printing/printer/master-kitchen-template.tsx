import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save } from 'lucide-react';

import { KitchenPrintComponent } from 'app/shared/model/PRINTER/printer.model';
import { Button } from '@/components/ui/button';
import { defaultKitchenLayout, KitchenLayoutEditor } from './kitchen-layout-editor';

const apiUrl = 'api/settings/kitchen-print-template';

export const MasterKitchenTemplate = () => {
  const [components, setComponents] = useState<KitchenPrintComponent[]>(defaultKitchenLayout());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    axios.get(apiUrl).then(response => {
      const stored = response.data?.components;
      if (Array.isArray(stored) && stored.length > 0) setComponents(stored);
    }).finally(() => setLoading(false));
  }, []);

  const save = () => {
    setSaving(true);
    setSaved(false);
    axios.put(apiUrl, { components }).then(response => {
      if (Array.isArray(response.data?.components)) setComponents(response.data.components);
      setSaved(true);
    }).finally(() => setSaving(false));
  };

  return (
    <div className="p-4 max-w-3xl">
      <h2 className="text-xl font-bold mb-1">Master Kitchen Template</h2>
      <p className="text-sm text-muted-foreground mb-4">
        This is the company kitchen ticket. A printer copies it, then drops font settings that model cannot print.
      </p>
      {loading ? <p>Loading...</p> : (
        <div className="space-y-4 bg-white p-4 rounded-md border">
          <KitchenLayoutEditor components={components} supportsRed onChange={setComponents} />
          <div className="flex gap-2 pt-2">
            <Button variant="outline" asChild className="h-8 text-xs">
              <Link to="/printer"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link>
            </Button>
            <Button onClick={save} disabled={saving} className="h-8 text-xs">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save template'}
            </Button>
            {saved && <span className="text-xs self-center text-muted-foreground">Saved</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterKitchenTemplate;
