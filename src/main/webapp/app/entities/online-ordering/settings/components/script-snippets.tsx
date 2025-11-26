import React, { useState } from 'react';
import { translate } from 'react-jhipster';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { IScriptSnippet } from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';

interface ScriptSnippetsProps {
  snippets: IScriptSnippet[];
  onChange: (snippets: IScriptSnippet[]) => void;
}

export const ScriptSnippets: React.FC<ScriptSnippetsProps> = ({ snippets = [], onChange }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const addSnippet = () => {
    const newSnippet: IScriptSnippet = {
      title: 'New Script',
      active: true,
      content: '// Add your JavaScript code here'
    };
    onChange([...snippets, newSnippet]);
    setExpandedIndex(snippets.length);
  };

  const removeSnippet = (index: number) => {
    const newSnippets = snippets.filter((_, i) => i !== index);
    onChange(newSnippets);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
  };

  const updateSnippet = (index: number, field: keyof IScriptSnippet, value: any) => {
    const newSnippets = [...snippets];
    newSnippets[index] = { ...newSnippets[index], [field]: value };
    onChange(newSnippets);
  };

  const toggleExpanded = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Script Snippets</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Add custom JavaScript snippets to your online ordering page (e.g., analytics, chat widgets)
          </p>
        </div>
        <Button
          type="button"
          onClick={addSnippet}
          size="sm"
          className="h-8 text-xs gap-1"
        >
          <Plus className="h-3 w-3" />
          Add Snippet
        </Button>
      </div>

      {snippets.length === 0 && (
        <div className="border border-dashed rounded-lg p-8 text-center">
          <p className="text-sm text-muted-foreground">No script snippets yet</p>
          <p className="text-xs text-muted-foreground mt-1">Click "Add Snippet" to create your first script</p>
        </div>
      )}

      <div className="space-y-3">
        {snippets.map((snippet, index) => (
          <div
            key={index}
            className="border rounded-lg overflow-hidden"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-3 bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => toggleExpanded(index)}
            >
              <div className="flex items-center gap-3 flex-1">
                {expandedIndex === index ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">{snippet.title || 'Untitled Script'}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    snippet.active
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {snippet.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSnippet(index);
                }}
                className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Content */}
            {expandedIndex === index && (
              <div className="p-4 space-y-4 bg-background">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`snippet-title-${index}`} className="text-xs font-semibold">
                    Title
                  </Label>
                  <Input
                    id={`snippet-title-${index}`}
                    value={snippet.title}
                    onChange={(e) => updateSnippet(index, 'title', e.target.value)}
                    className="h-7 text-xs"
                    placeholder="e.g., Google Analytics, Facebook Pixel, Chat Widget"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`snippet-active-${index}`}
                    checked={snippet.active}
                    onCheckedChange={(checked) => updateSnippet(index, 'active', checked)}
                  />
                  <Label htmlFor={`snippet-active-${index}`} className="text-xs font-semibold cursor-pointer">
                    Active (Include this script in the page)
                  </Label>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor={`snippet-content-${index}`} className="text-xs font-semibold">
                    JavaScript Code
                  </Label>
                  <div className="border rounded-md overflow-hidden">
                    <Editor
                      height="200px"
                      defaultLanguage="javascript"
                      value={snippet.content}
                      onChange={(value) => updateSnippet(index, 'content', value || '')}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 12,
                        lineNumbers: 'on',
                        roundedSelection: true,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: 'on',
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This code will be injected into the page. Make sure it's safe and tested.
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
