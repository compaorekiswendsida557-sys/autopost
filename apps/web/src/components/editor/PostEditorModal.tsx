'use client';

import { useState } from 'react';
import { Eye, Edit3, CheckCircle, Clock } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { RichTextEditor } from './RichTextEditor';
import { ImageUploader } from './ImageUploader';
import { FacebookPreview } from './FacebookPreview';

interface Props {
  open: boolean;
  onClose: () => void;
  index: number;
  content: string;
  imageUrl: string;
  slotLabel?: string;
  pageName: string;
  pageAvatar?: string | null;
  onSave: (content: string, imageUrl: string) => void;
}

export function PostEditorModal({ open, onClose, index, content, imageUrl, slotLabel, pageName, pageAvatar, onSave }: Props) {
  const [editContent, setEditContent] = useState(content);
  const [editImage, setEditImage] = useState(imageUrl);
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');

  const handleSave = () => {
    onSave(editContent, editImage);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Publication #${index + 1}`} size="xl">
      <div className="space-y-4">
        {/* Slot badge */}
        {slotLabel && (
          <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-100 rounded-xl w-fit">
            <Clock className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium text-purple-700 capitalize">{slotLabel}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {[{ id: 'edit', label: 'Éditer', icon: Edit3 }, { id: 'preview', label: 'Prévisualiser', icon: Eye }].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as 'edit' | 'preview')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'edit' ? (
          <div className="space-y-4">
            <RichTextEditor value={editContent} onChange={setEditContent} minHeight={220} />
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Image <span className="text-gray-400 font-normal">(optionnel)</span></p>
              <ImageUploader imageUrl={editImage} onImageChange={setEditImage} />
            </div>
          </div>
        ) : (
          <div className="py-2">
            <FacebookPreview
              pageName={pageName}
              pageAvatar={pageAvatar}
              content={editContent}
              imageUrl={editImage || undefined}
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <CheckCircle className="h-4 w-4" />
            Valider ce post
          </button>
        </div>
      </div>
    </Modal>
  );
}
