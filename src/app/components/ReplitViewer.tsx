import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Download, Eye, Loader2, Save } from 'lucide-react';

interface ReplitApp {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  language: string;
  created_at: string;
}

// Leggi variabili d'ambiente
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export function ReplitViewer() {
  const [loading, setLoading] = useState(false);
  const [apps, setApps] = useState<ReplitApp[]>([]);
  const [selectedApp, setSelectedApp] = useState<ReplitApp | null>(null);
  const [reactCode, setReactCode] = useState('');
  const [htmlCode, setHtmlCode] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [savedUrl, setSavedUrl] = useState('');

  useEffect(() => {
    loadApps();
  }, []);

  async function loadApps() {
    setLoading(true);
    try {
      const response = await fetch('https://api.github.com/users/wasabi-offers/repos?per_page=100', {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error('Errore caricamento app');
      }

      const data = await response.json();
      setApps(data);
    } catch (error) {
      console.error('Errore caricamento app:', error);
      alert('Errore nel caricamento delle app');
    } finally {
      setLoading(false);
    }
  }

  async function selectApp(app: ReplitApp) {
    setSelectedApp(app);
    setLoading(true);

    try {
      const possibleFiles = [
        'src/App.tsx',
        'src/App.jsx',
        'src/app/App.tsx',
        'App.tsx',
        'App.jsx',
        'index.jsx',
        'index.tsx',
        'src/index.tsx',
        'src/index.jsx'
      ];

      let code = '';
      for (const filePath of possibleFiles) {
        try {
          const response = await fetch(
            `https://api.github.com/repos/${app.full_name}/contents/${filePath}`,
            {
              headers: {
                'Accept': 'application/vnd.github.v3.raw'
              }
            }
          );

          if (response.ok) {
            const text = await response.text();
            try {
              const json = JSON.parse(text);
              if (json.content) {
                code = atob(json.content.replace(/\n/g, ''));
              }
            } catch {
              code = text;
            }
            console.log(`✅ Trovato: ${filePath}`);
            break;
          }
        } catch (e) {
          console.log(`❌ File ${filePath} non trovato`);
        }
      }

      if (code) {
        setReactCode(code);
      } else {
        setReactCode('// Nessun file React trovato in questo repository.');
      }
    } catch (error) {
      console.error('Errore caricamento codice:', error);
      setReactCode('// Errore nel caricamento del codice');
    } finally {
      setLoading(false);
    }
  }

  function convertReactToHTML() {
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
  <title>${selectedApp?.name || 'App'}</title>
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

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      alert('Configura VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nel file .env');
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
          app_name: selectedApp?.name,
          repo_url: selectedApp?.html_url,
          html_content: htmlCode,
          created_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Errore salvataggio su Supabase');
      }

      const data = await response.json();
      const fileId = data[0]?.id || Date.now();

      // Genera URL per download
      const downloadUrl = `${SUPABASE_URL}/rest/v1/html_exports?id=eq.${fileId}&select=html_content`;
      setSavedUrl(downloadUrl);

      alert('✅ Salvato su Supabase!');
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert('Errore durante il salvataggio. Verifica le credenziali Supabase nel file .env e che la tabella html_exports esista.');
    } finally {
      setLoading(false);
    }
  }

  if (!selectedApp) {
    return (
      <div className="size-full flex flex-col bg-gray-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl text-white font-bold">Le tue App Replit</h2>
          <Button
            onClick={loadApps}
            disabled={loading}
            variant="outline"
            className="text-white border-gray-600"
          >
            {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : '🔄'} Ricarica
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="size-12 text-blue-400 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {apps.map((app) => (
                <Card
                  key={app.id}
                  className="bg-gray-800 border-gray-600 hover:border-blue-400 cursor-pointer transition-all p-6"
                  onClick={() => selectApp(app)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-semibold text-lg">{app.name}</h3>
                    {app.language && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">{app.language}</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mb-3">{app.description || 'Nessuna descrizione'}</p>
                  <p className="text-xs text-gray-500">{new Date(app.created_at).toLocaleDateString()}</p>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    );
  }

  return (
    <div className="size-full flex flex-col bg-gray-900">
      <div className="bg-gray-800 border-b border-gray-600 p-4 flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => { setSelectedApp(null); setHtmlCode(''); setShowPreview(false); }}
            className="text-gray-300 hover:text-white mb-2"
          >
            ← Indietro
          </Button>
          <h2 className="text-xl text-white font-bold">{selectedApp.name}</h2>
          <p className="text-sm text-gray-400">{selectedApp.language || 'N/A'}</p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={convertReactToHTML}
            disabled={loading || !reactCode}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Eye className="size-4 mr-2" />
            Estrai HTML
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
                    a.download = `${selectedApp.name}.html`;
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
        {/* Codice React */}
        <div className="flex-1 flex flex-col border-r border-gray-600">
          <div className="bg-gray-800 p-2 border-b border-gray-600">
            <span className="text-gray-300 font-mono text-sm">React Code (src/App.tsx)</span>
          </div>
          <ScrollArea className="flex-1">
            <pre className="p-4 text-sm text-gray-300 font-mono whitespace-pre-wrap">{reactCode}</pre>
          </ScrollArea>
        </div>

        {/* HTML o Preview */}
        {showPreview && (
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
