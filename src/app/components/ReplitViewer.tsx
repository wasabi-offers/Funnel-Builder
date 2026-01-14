import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Code, Download, Eye, Loader2, Save } from 'lucide-react';

interface ReplitApp {
  id: string;
  title: string;
  slug: string;
  description: string;
  url: string;
}

export function ReplitViewer() {
  const [replitToken, setReplitToken] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apps, setApps] = useState<ReplitApp[]>([]);
  const [selectedApp, setSelectedApp] = useState<ReplitApp | null>(null);
  const [reactCode, setReactCode] = useState('');
  const [htmlCode, setHtmlCode] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [savedUrl, setSavedUrl] = useState('');

  async function handleAuth() {
    if (!replitToken.trim() || !supabaseUrl.trim() || !supabaseKey.trim()) {
      alert('Compila tutti i campi');
      return;
    }

    setLoading(true);
    try {
      // Salva in localStorage
      localStorage.setItem('replit_token', replitToken);
      localStorage.setItem('supabase_url', supabaseUrl);
      localStorage.setItem('supabase_key', supabaseKey);

      setIsAuthenticated(true);
      await loadApps();
    } catch (error) {
      console.error('Errore autenticazione:', error);
      alert('Errore durante l\'autenticazione');
    } finally {
      setLoading(false);
    }
  }

  async function loadApps() {
    setLoading(true);
    try {
      const response = await fetch('https://replit.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Cookie': `connect.sid=${replitToken}`
        },
        body: JSON.stringify({
          query: `
            query {
              currentUser {
                replsCreated(count: 50) {
                  items {
                    id
                    title
                    slug
                    description
                    url
                  }
                }
              }
            }
          `
        })
      });

      const data = await response.json();
      if (data.data?.currentUser?.replsCreated?.items) {
        setApps(data.data.currentUser.replsCreated.items);
      }
    } catch (error) {
      console.error('Errore caricamento app:', error);
    } finally {
      setLoading(false);
    }
  }

  async function selectApp(app: ReplitApp) {
    setSelectedApp(app);
    setLoading(true);

    try {
      // Carica il codice React dall'app (esempio con file App.tsx)
      const response = await fetch(`${app.url}/App.tsx`);
      const code = await response.text();
      setReactCode(code);
    } catch (error) {
      console.error('Errore caricamento codice:', error);
      setReactCode('// Codice non disponibile o errore nel caricamento');
    } finally {
      setLoading(false);
    }
  }

  function convertReactToHTML() {
    setLoading(true);

    try {
      // Conversione base JSX → HTML
      let html = reactCode;

      // Rimuovi imports
      html = html.replace(/import .+;/g, '');

      // Converti className in class
      html = html.replace(/className=/g, 'class=');

      // Rimuovi export default
      html = html.replace(/export default /g, '');

      // Estrai il JSX dal return
      const returnMatch = html.match(/return\s*\(([\s\S]*)\);/);
      if (returnMatch) {
        html = returnMatch[1];
      }

      // Wrappa in HTML completo
      const fullHTML = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${selectedApp?.title || 'App'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
${html}
</body>
</html>`;

      setHtmlCode(fullHTML);
      setShowPreview(true);
    } catch (error) {
      console.error('Errore conversione:', error);
      alert('Errore durante la conversione');
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
      const response = await fetch(`${supabaseUrl}/rest/v1/html_exports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          app_name: selectedApp?.title,
          html_content: htmlCode,
          created_at: new Date().toISOString()
        })
      });

      const data = await response.json();

      // Genera URL per download
      const downloadUrl = `${supabaseUrl}/rest/v1/html_exports?id=eq.${data.id}`;
      setSavedUrl(downloadUrl);

      alert('✅ Salvato su Supabase!');
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert('Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="size-full flex items-center justify-center bg-gray-900 p-6">
        <Card className="w-full max-w-2xl p-8 bg-gray-800 border-gray-600">
          <div className="text-center mb-6">
            <Code className="size-16 mx-auto mb-4 text-orange-400" />
            <h1 className="text-2xl text-white mb-2">Connetti Replit & Supabase</h1>
            <p className="text-gray-400 text-sm">Converti le tue app React in HTML</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                Replit API Token
              </label>
              <Input
                type="password"
                placeholder="connect.sid=..."
                value={replitToken}
                onChange={(e) => setReplitToken(e.target.value)}
                className="bg-gray-700 border-gray-500 text-white"
              />
            </div>

            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                Supabase URL
              </label>
              <Input
                placeholder="https://xxx.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="bg-gray-700 border-gray-500 text-white"
              />
            </div>

            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                Supabase Anon Key
              </label>
              <Input
                type="password"
                placeholder="eyJhbGci..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="bg-gray-700 border-gray-500 text-white"
              />
            </div>

            <Button
              onClick={handleAuth}
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : 'Connetti'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!selectedApp) {
    return (
      <div className="size-full flex flex-col bg-gray-900 p-6">
        <h2 className="text-2xl text-white font-bold mb-4">Le tue App Replit</h2>

        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="size-12 text-orange-400 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {apps.map((app) => (
                <Card
                  key={app.id}
                  className="bg-gray-800 border-gray-600 hover:border-orange-400 cursor-pointer transition-all p-6"
                  onClick={() => selectApp(app)}
                >
                  <h3 className="text-white font-semibold text-lg mb-2">{app.title}</h3>
                  <p className="text-gray-400 text-sm">{app.description || 'Nessuna descrizione'}</p>
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
            onClick={() => setSelectedApp(null)}
            className="text-gray-300 hover:text-white mb-2"
          >
            ← Indietro
          </Button>
          <h2 className="text-xl text-white font-bold">{selectedApp.title}</h2>
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
                  onClick={() => window.open(savedUrl, '_blank')}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Download className="size-4 mr-2" />
                  Download
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
            <span className="text-gray-300 font-mono text-sm">React Code</span>
          </div>
          <ScrollArea className="flex-1">
            <pre className="p-4 text-sm text-gray-300 font-mono">{reactCode}</pre>
          </ScrollArea>
        </div>

        {/* HTML o Preview */}
        {showPreview && (
          <div className="flex-1 flex flex-col">
            <div className="bg-gray-800 p-2 border-b border-gray-600">
              <span className="text-gray-300 font-mono text-sm">HTML Preview</span>
            </div>
            <iframe
              srcDoc={htmlCode}
              className="flex-1 bg-white"
              title="Preview"
            />
          </div>
        )}
      </div>
    </div>
  );
}
