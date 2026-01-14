import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Download, Loader2, Save, Code2, ExternalLink, Clock } from 'lucide-react';

const SUPABASE_URL = 'https://yqcyglodttblvhwnasjg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_WaCd9Kp0J1yKZzpxHDUjAg_MQnaC4d3';
const REPLIT_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjB1a2x0QSJ9.eyJpc3MiOiJodHRwczovL3Nlc3Npb24uZmlyZWJhc2UuZ29vZ2xlLmNvbS9yZXBsaXQtd2ViIiwibmFtZSI6InRvb2xzIHdhc2FiaSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NMZVVsYlA4QXpuTDFTSzNybE1rWFFFY3B1bDd2WFNxNmVVelNFQVFOSEN1T1k5bkFcdTAwM2RzOTYtYyIsImF1ZCI6InJlcGxpdC13ZWIiLCJhdXRoX3RpbWUiOjE3NjgyNDE0ODMsInVzZXJfaWQiOiJlTW5ydGJMNDJPYjdUcGxBdXY2UlFaTDdZMmwyIiwic3ViIjoiZU1ucnRiTDQyT2I3VHBsQXV2NlJRWkw3WTJsMiIsImlhdCI6MTc2ODQyMzg0NiwiZXhwIjoxNzY5MDI4NjQ2LCJlbWFpbCI6InRvb2xzQHdhc2FiaW9mZmVycy5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJnb29nbGUuY29tIjpbIjExMzIyODQ0MjE5ODM5NjUyMDEzNiJdLCJlbWFpbCI6WyJ0b29sc0B3YXNhYmlvZmZlcnMuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoiZ29vZ2xlLmNvbSJ9fQ.lyAUObZN9rgzxmnk_z_2bDe920kCxhcPoC9kr6q5RxXhqn7c4r2r0fvcqWbO5d9uU0OfaswvWZE5RO6JxenRgW68KuIf2lspxe-NnaRBUFazuoM7j3BZ4y_PEnY6YRpsTe5NwD0tH4bL4x3LObcaWqO5jxP_ZssU6PyZNf8VoLloEmQo0ILm8RYAwO2sySFyT3wx3w5gK79xQI9IOJsBg5CxBhCzlbJ7pNgD6AT8EQhnHFIaT85BsFUR4BRP8yE_2Mysxsp9Qq6QUafrln2-55PD0OafQ7OJHY4NZOslHD_gPXVEMWgMCBRyh6vsKWpo4gUqv2PW_iLNskkRv7xddg';
const CORS_PROXY = 'https://corsproxy.io/?';

interface ReplitApp {
  id: string;
  title: string;
  url: string;
  timeCreated: string;
  imageUrl?: string;
  language?: string;
}

export function ReplitViewer() {
  const [loading, setLoading] = useState(false);
  const [apps, setApps] = useState<ReplitApp[]>([]);
  const [selectedApp, setSelectedApp] = useState<ReplitApp | null>(null);
  const [appName, setAppName] = useState('');
  const [reactCode, setReactCode] = useState('');
  const [htmlCode, setHtmlCode] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [savedUrl, setSavedUrl] = useState('');

  useEffect(() => {
    loadReplitApps();
  }, []);

  async function loadReplitApps() {
    setLoading(true);
    try {
      // GraphQL query per ottenere i repl dell'utente
      const query = `
        query ReplDashboardRepls {
          currentUser {
            repls(count: 50) {
              items {
                id
                title
                url
                timeCreated
                imageUrl
                language
              }
            }
          }
        }
      `;

      const response = await fetch(CORS_PROXY + encodeURIComponent('https://replit.com/graphql'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${REPLIT_TOKEN}`,
        },
        body: JSON.stringify({
          query,
          variables: {}
        })
      });

      if (!response.ok) {
        throw new Error('Errore nel caricamento delle app Replit');
      }

      const data = await response.json();

      if (data.errors) {
        console.error('GraphQL errors:', data.errors);
        throw new Error(data.errors[0]?.message || 'Errore GraphQL');
      }

      const replItems = data.data?.currentUser?.repls?.items || [];
      setApps(replItems);

      console.log(`✅ Caricate ${replItems.length} app Replit`);
    } catch (error) {
      console.error('Errore caricamento app:', error);
      alert('Errore nel caricamento delle app Replit. Verifica il token.');
    } finally {
      setLoading(false);
    }
  }

  async function loadAppCode(app: ReplitApp) {
    setLoading(true);
    setSelectedApp(app);
    setAppName(app.title);

    try {
      // GraphQL query per ottenere i file del repl
      const query = `
        query ReplFiles($id: String!) {
          repl(id: $id) {
            id
            title
            files {
              path
              content
            }
          }
        }
      `;

      const response = await fetch(CORS_PROXY + encodeURIComponent('https://replit.com/graphql'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${REPLIT_TOKEN}`,
        },
        body: JSON.stringify({
          query,
          variables: { id: app.id }
        })
      });

      const data = await response.json();

      if (data.errors) {
        console.error('GraphQL errors:', data.errors);
        throw new Error('Errore nel caricamento dei file');
      }

      const files = data.data?.repl?.files || [];

      // Cerca il file principale React (App.jsx, App.tsx, index.jsx, ecc.)
      const mainFile = files.find((f: any) =>
        f.path.match(/App\.(jsx|tsx)$/) ||
        f.path.match(/index\.(jsx|tsx)$/) ||
        f.path.match(/main\.(jsx|tsx)$/)
      );

      if (mainFile && mainFile.content) {
        setReactCode(mainFile.content);
        console.log(`✅ Caricato file: ${mainFile.path}`);
      } else {
        // Se non trova file React, mostra tutti i file disponibili
        const filesList = files.map((f: any) => f.path).join(', ');
        alert(`File React non trovato. File disponibili: ${filesList || 'nessuno'}`);
      }
    } catch (error) {
      console.error('Errore caricamento codice:', error);
      alert('Errore nel caricamento del codice dell\'app');
    } finally {
      setLoading(false);
    }
  }

  function convertReactToHTML() {
    if (!reactCode.trim()) {
      alert('Nessun codice React disponibile!');
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
          repo_url: selectedApp?.url || '',
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

  function downloadHTML() {
    const blob = new Blob([htmlCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${appName || 'app'}.html`;
    a.click();
  }

  return (
    <div className="size-full flex flex-col bg-gray-900">
      <div className="bg-gray-800 border-b border-gray-600 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl text-white font-bold">Replit → HTML</h2>
          <Button
            onClick={loadReplitApps}
            disabled={loading}
            variant="outline"
            size="sm"
            className="text-gray-300"
          >
            {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Ricarica
          </Button>
        </div>

        {selectedApp && (
          <div className="flex gap-3 items-center">
            <div className="flex-1 text-white">
              <span className="text-sm text-gray-400">App selezionata:</span>
              <span className="ml-2 font-semibold">{selectedApp.title}</span>
            </div>

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

                <Button
                  onClick={downloadHTML}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Download className="size-4 mr-2" />
                  Download
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Lista App Replit */}
        {!selectedApp && (
          <div className="flex-1 p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="size-8 animate-spin text-blue-500" />
              </div>
            ) : apps.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p className="text-lg mb-2">Nessuna app Replit trovata</p>
                <p className="text-sm">Verifica che il token Replit sia valido</p>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {apps.map((app) => (
                    <Card
                      key={app.id}
                      className="p-4 bg-gray-800 border-gray-700 hover:border-blue-500 cursor-pointer transition-all"
                      onClick={() => loadAppCode(app)}
                    >
                      {app.imageUrl && (
                        <img
                          src={app.imageUrl}
                          alt={app.title}
                          className="w-full h-32 object-cover rounded mb-3"
                        />
                      )}
                      <h3 className="text-white font-semibold mb-2 truncate">
                        {app.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Clock className="size-3" />
                        {new Date(app.timeCreated).toLocaleDateString('it-IT')}
                      </div>
                      {app.language && (
                        <div className="mt-2">
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                            {app.language}
                          </span>
                        </div>
                      )}
                      {app.url && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-2 w-full text-gray-400 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(app.url, '_blank');
                          }}
                        >
                          <ExternalLink className="size-3 mr-1" />
                          Apri su Replit
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        {/* Editor e Preview */}
        {selectedApp && (
          <>
            {/* Codice React */}
            <div className="flex-1 flex flex-col border-r border-gray-600">
              <div className="bg-gray-800 p-2 border-b border-gray-600 flex items-center justify-between">
                <span className="text-gray-300 font-mono text-sm">Codice React</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedApp(null);
                    setReactCode('');
                    setHtmlCode('');
                    setShowPreview(false);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ← Torna alle app
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <pre className="p-4 text-sm text-gray-300 bg-gray-900 font-mono">
                  {reactCode || 'Caricamento...'}
                </pre>
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
          </>
        )}
      </div>
    </div>
  );
}
