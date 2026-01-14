import { useState } from 'react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Download, Loader2, Save, Code2 } from 'lucide-react';

// Leggi variabili d'ambiente
const SUPABASE_URL = 'https://yqcyglodttblvhwnasjg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_WaCd9Kp0J1yKZzpxHDUjAg_MQnaC4d3';

export function ReplitViewer() {
  const [loading, setLoading] = useState(false);
  const [appName, setAppName] = useState('');
  const [reactCode, setReactCode] = useState('');
  const [htmlCode, setHtmlCode] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [savedUrl, setSavedUrl] = useState('');

  function convertReactToHTML() {
    if (!reactCode.trim()) {
      alert('Inserisci del codice React prima!');
      return;
    }

    setLoading(true);

    try {
      let html = reactCode;

      // Rimuovi imports
      html = html.replace(/import .+?;/g, '');
      html = html.replace(/import .+? from .+?;/g, '');

      // Converti className in class
      html = html.replace(/className=/g, 'class=');

      // Rimuovi export
      html = html.replace(/export default /g, '');
      html = html.replace(/export /g, '');

      // Estrai il JSX dal return
      const returnMatch = html.match(/return\s*\(([\s\S]*?)\);?\s*}/);
      if (returnMatch) {
        html = returnMatch[1].trim();
      }

      // Wrappa in HTML completo
      const fullHTML = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName || 'App Replit'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;

      setHtmlCode(fullHTML);
      setShowPreview(true);
    } catch (error) {
      console.error('Errore conversione:', error);
      alert('Errore durante la conversione. Il formato potrebbe non essere supportato.');
    } finally {
      setLoading(false);
    }
  }

  async function saveToSupabase() {
    if (!htmlCode) {
      alert('Genera prima l\'HTML');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/html_exports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          app_name: appName || 'App Replit',
          repo_url: '',
          html_content: htmlCode,
          created_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Errore salvataggio su Supabase');
      }

      const data = await response.json();
      const fileId = data[0]?.id || Date.now();

      const downloadUrl = `${SUPABASE_URL}/rest/v1/html_exports?id=eq.${fileId}&select=html_content`;
      setSavedUrl(downloadUrl);

      alert('✅ Salvato su Supabase!');
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert('Errore durante il salvataggio. Verifica che la tabella html_exports esista su Supabase.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="size-full flex flex-col bg-gray-900">
      <div className="bg-gray-800 border-b border-gray-600 p-4">
        <h2 className="text-2xl text-white font-bold mb-4">Converti React → HTML</h2>

        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Nome app (opzionale)"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:border-blue-500"
          />

          <Button
            onClick={convertReactToHTML}
            disabled={loading || !reactCode}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Code2 className="size-4 mr-2" />
            Converti in HTML
          </Button>

          {htmlCode && (
            <>
              <Button
                onClick={saveToSupabase}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="size-4 mr-2" />
                Salva
              </Button>

              {savedUrl && (
                <Button
                  onClick={() => {
                    const blob = new Blob([htmlCode], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${appName || 'app'}.html`;
                    a.click();
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Download className="size-4 mr-2" />
                  Download HTML
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Editor React */}
        <div className="flex-1 flex flex-col border-r border-gray-600">
          <div className="bg-gray-800 p-2 border-b border-gray-600">
            <span className="text-gray-300 font-mono text-sm">Codice React (incolla qui)</span>
          </div>
          <ScrollArea className="flex-1">
            <textarea
              value={reactCode}
              onChange={(e) => setReactCode(e.target.value)}
              placeholder="// Incolla qui il tuo codice React da Replit..."
              className="w-full h-full p-4 text-sm text-gray-300 bg-gray-900 font-mono resize-none focus:outline-none"
            />
          </ScrollArea>
        </div>

        {/* HTML Preview */}
        {showPreview && htmlCode && (
          <div className="flex-1 flex flex-col">
            <div className="bg-gray-800 p-2 border-b border-gray-600 flex items-center justify-between">
              <span className="text-gray-300 font-mono text-sm">HTML Preview</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(htmlCode);
                  alert('HTML copiato negli appunti!');
                }}
                className="text-gray-400 hover:text-white"
              >
                📋 Copia HTML
              </Button>
            </div>
            <iframe
              srcDoc={htmlCode}
              className="flex-1 bg-white"
              title="Preview"
              sandbox="allow-scripts"
            />
          </div>
        )}
      </div>
    </div>
  );
}
