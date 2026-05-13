'use client';

import { useState, useRef } from 'react';
import { X, Upload, Link } from 'lucide-react';

interface Props {
  imageUrl: string;
  onImageChange: (url: string) => void;
}

export function ImageUploader({ imageUrl, onImageChange }: Props) {
  const [tab, setTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => { if (e.target?.result) onImageChange(e.target.result as string); };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      {imageUrl ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 group">
          <img src={imageUrl} alt="" className="w-full max-h-56 object-cover" />
          <button
            onClick={() => onImageChange('')}
            className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
            Image ajoutée
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {[{ id: 'upload', label: 'Importer', icon: Upload }, { id: 'url', label: 'URL', icon: Link }].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as 'upload' | 'url')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  tab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'upload' ? (
            <div
              onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-400 hover:bg-gray-50'
              }`}
            >
              <Upload className="h-7 w-7 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                Glissez une image ou{' '}
                <span className="text-indigo-600 font-medium">cliquez pour importer</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF — aperçu local</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && urlInput) { onImageChange(urlInput); setUrlInput(''); } }}
                placeholder="https://exemple.com/image.jpg"
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => { if (urlInput) { onImageChange(urlInput); setUrlInput(''); } }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                OK
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
