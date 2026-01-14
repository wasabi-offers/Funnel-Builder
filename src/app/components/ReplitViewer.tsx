import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Download, Eye, Loader2, Save } from 'lucide-react';

interface ReplitApp {
  id: string;
  title: string;
  description: string;
  url: string;
  language: string;
  timeCreated: string;
}

// Leggi variabili d'ambiente
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://yqcyglodttblvhwnasjg.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_WaCd9Kp0J1yKZzpxHDUjAg_MQnaC4d3';
const REPLIT_TOKEN = import.meta.env.VITE_REPLIT_TOKEN || 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjB1a2x0QSJ9.eyJpc3MiOiJodHRwczovL3Nlc3Npb24uZmlyZWJhc2UuZ29vZ2xlLmNvbS9yZXBsaXQtd2ViIiwibmFtZSI6InRvb2xzIHdhc2FiaSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NMZVVsYlA4QXpuTDFTSzNybE1rWFFFY3B1bDd2WFNxNmVVelNFQVFOSEN1T1k5bkFcdTAwM2RzOTYtYyIsImF1ZCI6InJlcGxpdC13ZWIiLCJhdXRoX3RpbWUiOjE3NjgyNDE0ODMsInVzZXJfaWQiOiJlTW5ydGJMNDJPYjdUcGxBdXY2UlFaTDdZMmwyIiwic3ViIjoiZU1ucnRiTDQyT2I3VHBsQXV2NlJRWkw3WTJsMiIsImlhdCI6MTc2ODQyMzg0NiwiZXhwIjoxNzY5MDI4NjQ2LCJlbWFpbCI6InRvb2xzQHdhc2FiaW9mZmVycy5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJnb29nbGUuY29tIjpbIjExMzIyODQ0MjE5ODM5NjUyMDEzNiJdLCJlbWFpbCI6WyJ0b29sc0B3YXNhYmlvZmZlcnMuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoiZ29vZ2xlLmNvbSJ9fQ.lyAUObZN9rgzxmnk_z_2bDe920kCxhcPoC9kr6q5RxXhqn7c4r2r0fvcqWbO5d9uU0OfaswvWZE5RO6JxenRgW68KuIf2lspxe-NnaRBUFazuoM7j3BZ4y_PEnY6YRpsTe5NwD0tH4bL4x3LObcaWqO5jxP_ZssU6PyZNf8VoLloEmQo0ILm8RYAwO2sySFyT3wx3w5gK79xQI9IOJsBg5CxBhCzlbJ7pNgD6AT8EQhnHFIaT85BsFUR4BRP8yE_2Mysxsp9Qq6QUafrln2-55PD0OafQ7OJHY4NZOslHD_gPXVEMWgMCBRyh6vsKWpo4gUqv2PW_iLNskkRv7xddg';

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
    console.log('=== DEBUG TOKEN ===');
    console.log('REPLIT_TOKEN:', REPLIT_TOKEN);
    console.log('REPLIT_TOKEN length:', REPLIT_TOKEN?.length);
    console.log('import.meta.env:', import.meta.env);
    console.log('==================');

    if (!REPLIT_TOKEN) {
      alert('Token Replit non configurato. Aggiungi VITE_REPLIT_TOKEN nel file .env');
      return;
    }

    setLoading(true);
    try {
      const query = `
        query {
          currentUser {
            repls(count: 100) {
              items {
                id
                title
                description
                url
                language
                timeCreated
              }
            }
          }
        }
      `;

      const response = await fetch('https://replit.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Authorization': `Bearer ${REPLIT_TOKEN}`
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error('Errore caricamento app Replit');
      }

      const data = await response.json();
      const replsList = data.data?.currentUser?.repls?.items || [];
      setApps(replsList);

      if (replsList.length === 0) {
        alert('Nessuna app trovata. Verifica che il token sia valido.');
      }
    } catch (error) {
      console.error('Errore caricamento app:', error);
      alert('Errore nel caricamento delle app Replit. Verifica il token.');
    } finally {
      setLoading(false);
    }
  }

  async function selectApp(app: ReplitApp) {
    setSelectedApp(app);
    setLoading(true);

    try {
      // Query GraphQL per ottenere i file della repl
      const query = `
        query ReplFiles($replId: String!) {
          repl(id: $replId) {
            ... on Repl {
              id
              files {
                items {
                  path
                  content
                }
              }
            }
          }
        }
      `;

      const response = await fetch('https://replit.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Authorization': `Bearer ${REPLIT_TOKEN}`
        },
        body: JSON.stringify({
          query,
          variables: { replId: app.id }
        })
      });

      if (!response.ok) {
        throw new Error('Errore caricamento file dalla Repl');
      }

      const data = await response.json();
      const files = data.data?.repl?.files?.items || [];

      // Cerca file React comuni
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
      for (const fileName of possibleFiles) {
        const file = files.find((f: any) => f.path === fileName);
        if (file && file.content) {
          code = file.content;
          console.log(`✅ Trovato: ${fileName}`);
          break;
        }
      }

      if (code) {
        setReactCode(code);
      } else {
        setReactCode('// Nessun file React trovato in questa app Replit.');
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
  <title>${selectedApp?.title || 'App'}</title>
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
          app_name: selectedApp?.title,
          repo_url: selectedApp?.url,
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
                    <h3 className="text-white font-semibold text-lg">{app.title}</h3>
                    {app.language && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">{app.language}</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mb-3">{app.description || 'Nessuna descrizione'}</p>
                  <p className="text-xs text-gray-500">{new Date(app.timeCreated).toLocaleDateString()}</p>
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
          <h2 className="text-xl text-white font-bold">{selectedApp.title}</h2>
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
                    a.download = `${selectedApp.title}.html`;
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
