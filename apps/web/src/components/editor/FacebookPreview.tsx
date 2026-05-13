'use client';

import { Globe, ThumbsUp, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';

interface Props {
  pageName: string;
  pageAvatar?: string | null;
  content: string; // HTML
  imageUrl?: string;
}

export function FacebookPreview({ pageName, pageAvatar, content, imageUrl }: Props) {
  const initial = pageName?.[0]?.toUpperCase() || 'P';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-md max-w-[500px] mx-auto overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-start gap-2.5 p-3 pb-2">
        {pageAvatar ? (
          <img src={pageAvatar} alt={pageName} className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-200" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white font-bold text-sm">{initial}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[14px] text-gray-900 leading-tight">{pageName}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[12px] text-gray-500">À l'instant</span>
            <span className="text-gray-300">·</span>
            <Globe className="h-3 w-3 text-gray-400" />
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 p-1">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div
        className="px-3 pb-2.5 text-[14px] text-gray-800 leading-[1.6] break-words"
        dangerouslySetInnerHTML={{ __html: content || '<span class="text-gray-400">Contenu du post...</span>' }}
      />

      {/* Image */}
      {imageUrl && (
        <div className="border-t border-gray-100">
          <img
            src={imageUrl}
            alt=""
            className="w-full object-cover max-h-72"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      {/* Reactions bar */}
      <div className="px-3 py-1.5 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="flex -space-x-0.5">
              <span className="w-4.5 h-4.5 text-base">👍</span>
              <span className="w-4.5 h-4.5 text-base">❤️</span>
            </div>
            <span className="text-[12px] text-gray-500 ml-1">Soyez le premier à réagir</span>
          </div>
          <span className="text-[12px] text-gray-400">0 commentaire</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex border-t border-gray-100">
        {[
          { icon: ThumbsUp, label: "J'aime" },
          { icon: MessageCircle, label: 'Commenter' },
          { icon: Share2, label: 'Partager' },
        ].map((a) => (
          <button
            key={a.label}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] font-medium text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <a.icon className="h-4 w-4" />
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
