import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save } from 'lucide-react';

import { KitchenPrintComponent } from 'app/shared/model/PRINTER/printer.model';
import { fontsFor, PrinterCommandMode } from 'app/shared/model/PRINTER/printer-models';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { applyKitchenFontDefaults, defaultKitchenLayout, KitchenLayoutEditor } from './kitchen-layout-editor';

const apiUrl = 'api/settings/kitchen-print-template';

const inferCommandMode = (components?: KitchenPrintComponent[], stored?: string | null): PrinterCommandMode => {
  if (stored === 'WINDOWS_DRIVER' || stored === 'ESC_POS' || stored === 'STAR_LINE') return stored;
  const windowsFace = components?.some(component => {
    const font = component.printerFont;
    return !!font && font !== 'A' && font !== 'B';
  });
  return windowsFace ? 'WINDOWS_DRIVER' : 'ESC_POS';
};

export const MasterKitchenTemplate = () => {
  const [components, setComponents] = useState<KitchenPrintComponent[]>(defaultKitchenLayout());
  const [commandMode, setCommandMode] = useState<PrinterCommandMode>('ESC_POS');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    axios.get(apiUrl).then(response => {
      const stored = response.data?.components;
      const next = Array.isArray(stored) && stored.length > 0 ? stored : defaultKitchenLayout();
      const mode = inferCommandMode(next, response.data?.commandMode);
      setCommandMode(mode);
      setComponents(next);
    }).finally(() => setLoading(false));
  }, []);

  const changeMethod = (mode: PrinterCommandMode) => {
    setCommandMode(mode);
    setComponents(applyKitchenFontDefaults(components, mode));
    setSaved(false);
  };

  const save = () => {
    setSaving(true);
    setSaved(false);
    axios.put(apiUrl, { components, commandMode }).then(response => {
      if (Array.isArray(response.data?.components)) setComponents(response.data.components);
      if (response.data?.commandMode) setCommandMode(inferCommandMode(response.data.components, response.data.commandMode));
      setSaved(true);
    }).finally(() => setSaving(false));
  };

  return (
    <div className="p-4 max-w-3xl">
      <h2 className="text-xl font-bold mb-1">Master Kitchen Template</h2>
      <p className="text-sm text-muted-foreground mb-4">
        This is the company kitchen ticket. A printer copies it, then keeps only the fonts that printing method can print.
      </p>
      {loading ? <p>Loading...</p> : (
        <div className="space-y-4 bg-white p-4 rounded-md border">
          <div>
            <Label className="text-xs">Printing method</Label>
            <Select value={commandMode} onValueChange={value => changeMethod(value as PrinterCommandMode)}>
              <SelectTrigger className="h-8 text-xs max-w-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ESC_POS">ESC/POS — Font A/B and multipliers</SelectItem>
                <SelectItem value="STAR_LINE">Star — Font A/B and multipliers</SelectItem>
                <SelectItem value="WINDOWS_DRIVER">Windows driver — TTF name and size</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <KitchenLayoutEditor
            key={commandMode}
            components={components}
            supportsRed={commandMode !== 'WINDOWS_DRIVER'}
            commandMode={commandMode}
            onChange={setComponents}
          />
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
