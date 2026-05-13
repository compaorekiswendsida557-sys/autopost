'use client';

import { useRef, useEffect, useCallback } from 'react';

const FONTS = [
  { value: 'inherit', label: 'Défaut' },
  { value: 'Arial, sans-serif', label: 'Sans-serif' },
  { value: '"Times New Roman", serif', label: 'Serif' },
  { value: '"Courier New", monospace', label: 'Mono' },
];

const SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px'];

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function RichTextEditor({ value, onChange, placeholder = 'Écrivez votre contenu ici…', minHeight = 200 }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (editorRef.current && !initialized.current) {
      editorRef.current.innerHTML = value;
      initialized.current = true;
    }
  }, []);

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange();
  }, []);

  const restoreSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
    editorRef.current?.focus();
  }, []);

  const exec = useCallback((cmd: string, val?: string) => {
    restoreSelection();
    document.execCommand(cmd, false, val);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [restoreSelection, onChange]);

  const applySize = useCallback((px: string) => {
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;
    try {
      const span = document.createElement('span');
      span.style.fontSize = px;
      const fragment = range.extractContents();
      span.appendChild(fragment);
      range.insertNode(span);
    } catch { /* ignore */ }
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [restoreSelection, onChange]);

  const ToolBtn = ({ label, cmd, val, title, className = '' }: { label: string; cmd: string; val?: string; title: string; className?: string }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); exec(cmd, val); }}
      className={`w-8 h-8 rounded-lg flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-sm text-sm transition-all ${className}`}
    >
      {label}
    </button>
  );

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-2 bg-gray-50 border-b border-gray-200">
        <ToolBtn label="B" cmd="bold" title="Gras (Ctrl+B)" className="font-bold" />
        <ToolBtn label="I" cmd="italic" title="Italique (Ctrl+I)" className="italic" />
        <ToolBtn label="U" cmd="underline" title="Souligné (Ctrl+U)" className="underline" />
        <ToolBtn label="S" cmd="strikeThrough" title="Barré" className="line-through" />

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <ToolBtn label="•" cmd="insertUnorderedList" title="Liste à puces" />
        <ToolBtn label="1." cmd="insertOrderedList" title="Liste numérotée" />

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Font family */}
        <select
          defaultValue="inherit"
          onMouseDown={saveSelection}
          onChange={(e) => exec('fontName', e.target.value)}
          className="h-7 px-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer"
          title="Police"
        >
          {FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>

        {/* Font size */}
        <select
          defaultValue="16px"
          onMouseDown={saveSelection}
          onChange={(e) => applySize(e.target.value)}
          className="h-7 px-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer"
          title="Taille"
        >
          {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Color */}
        <label title="Couleur du texte" className="relative cursor-pointer" onMouseDown={saveSelection}>
          <span className="flex items-center justify-center w-8 h-7 rounded-lg border border-gray-200 bg-white hover:shadow-sm transition-all text-sm">🎨</span>
          <input
            type="color"
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            onChange={(e) => exec('foreColor', e.target.value)}
          />
        </label>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <ToolBtn label="↩" cmd="undo" title="Annuler (Ctrl+Z)" />
        <ToolBtn label="↪" cmd="redo" title="Refaire (Ctrl+Y)" />

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <ToolBtn label="≡L" cmd="justifyLeft" title="Aligner à gauche" />
        <ToolBtn label="≡C" cmd="justifyCenter" title="Centrer" />
        <ToolBtn label="≡R" cmd="justifyRight" title="Aligner à droite" />
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={() => { if (editorRef.current) onChange(editorRef.current.innerHTML); }}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        style={{ minHeight }}
        className="p-4 text-sm text-gray-800 focus:outline-none leading-relaxed
          [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-gray-400 [&:empty]:before:pointer-events-none"
      />
    </div>
  );
}
