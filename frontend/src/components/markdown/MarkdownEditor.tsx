'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { MarkdownPreview } from './MarkdownPreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Eye } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Écrivez votre description en Markdown...',
  className = '',
  rows = 10,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Éditer
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Aperçu
          </TabsTrigger>
        </TabsList>
        <TabsContent value="edit" className="mt-2">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Support Markdown : **gras**, *italique*, `code`, [lien](url), - liste, etc.
          </p>
        </TabsContent>
        <TabsContent value="preview" className="mt-2">
          <div className="border rounded-md p-4 min-h-[200px] bg-muted/50">
            <MarkdownPreview content={value || placeholder} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

