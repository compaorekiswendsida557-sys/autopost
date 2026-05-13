'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle } from 'lucide-react';

function OAuthContent() {
  const params = useSearchParams();
  const status = params.get('status');
  const count = params.get('count') || '0';
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage(
        { type: 'FB_OAUTH_SUCCESS', status, count: Number(count) },
        window.location.origin
      );
    }
    const timer = setTimeout(() => {
      setClosing(true);
      window.close();
    }, 2000);
    return () => clearTimeout(timer);
  }, [status, count]);

  const ok = status === 'connected';

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-sm w-full mx-4">
        {ok ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Connexion réussie !</h2>
            <p className="text-gray-500 text-sm">
              {count} page{Number(count) > 1 ? 's' : ''} connectée{Number(count) > 1 ? 's' : ''}
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Connexion échouée</h2>
            <p className="text-gray-500 text-sm">Vérifiez vos identifiants Meta et réessayez.</p>
          </>
        )}
        <p className="text-xs text-gray-400 mt-6">{closing ? 'Fermeture…' : 'Cette fenêtre se ferme automatiquement…'}</p>
      </div>
    </div>
  );
}

export default function OAuthSuccessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p className="text-gray-400">Chargement…</p></div>}>
      <OAuthContent />
    </Suspense>
  );
}
