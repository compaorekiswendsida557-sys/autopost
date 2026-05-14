'use client';

import { useState } from 'react';
import { Eye, Edit3, CheckCircle, Clock, Phone, Mail, MapPin, Globe, MessageCircle, Plus, ChevronDown, ChevronUp } from 'lucide-react';
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

const CONTACT_FIELDS = [
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, placeholder: '+226 XX XX XX XX', emoji: '💬', color: 'text-green-600' },
  { key: 'phone', label: 'Téléphone', icon: Phone, placeholder: '+226 XX XX XX XX', emoji: '📞', color: 'text-blue-600' },
  { key: 'email', label: 'Email', icon: Mail, placeholder: 'contact@example.com', emoji: '📧', color: 'text-orange-600' },
  { key: 'address', label: 'Adresse', icon: MapPin, placeholder: 'Votre adresse complète', emoji: '📍', color: 'text-red-600' },
  { key: 'website', label: 'Site web', icon: Globe, placeholder: 'https://www.example.com', emoji: '🌐', color: 'text-indigo-600' },
];

function ContactBlock({ onInsert }: { onInsert: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({
    whatsapp: '', phone: '', email: '', address: '', website: '',
  });

  const handleInsert = () => {
    const lines = CONTACT_FIELDS
      .filter((f) => values[f.key]?.trim())
      .map((f) => `${f.emoji} ${f.label} : ${values[f.key].trim()}`);

    if (lines.length === 0) return;

    const block = '\n\n' + lines.join('\n');
    onInsert(block);
    setOpen(false);
  };

  const filledCount = CONTACT_FIELDS.filter((f) => values[f.key]?.trim()).length;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-medium text-gray-700">Bloc Contact</span>
          {filledCount > 0 && (
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-xs rounded-full font-medium">
              {filledCount} rempli{filledCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Insérer vos coordonnées dans le post</span>
          {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </button>

      {/* Fields */}
      {open && (
        <div className="p-4 space-y-3 bg-white">
          {CONTACT_FIELDS.map((field) => (
            <div key={field.key} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 ${field.color}`}>
                <field.icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={values[field.key]}
                  onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder-gray-300"
                />
              </div>
              <span className="text-base flex-shrink-0">{field.emoji}</span>
            </div>
          ))}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Les champs vides seront ignorés
            </p>
            <button
              type="button"
              onClick={handleInsert}
              disabled={filledCount === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Insérer dans le post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PostEditorModal({ open, onClose, index, content, imageUrl, slotLabel, pageName, pageAvatar, onSave }: Props) {
  const [editContent, setEditContent] = useState(content);
  const [editImage, setEditImage] = useState(imageUrl);
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');

  const handleSave = () => {
    onSave(editContent, editImage);
    onClose();
  };

  const handleInsertContact = (text: string) => {
    setEditContent((prev) => prev + text);
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

            {/* Contact Block */}
            <ContactBlock onInsert={handleInsertContact} />

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
