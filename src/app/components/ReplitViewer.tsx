import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Code, Download, Eye, Loader2, Save, Github } from 'lucide-react';

interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  default_branch: string;
}

export function ReplitViewer() {
  const [githubToken, setGithubToken] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
  const [reactCode, setReactCode] = useState('');
  const [htmlCode, setHtmlCode] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [savedUrl, setSavedUrl] = useState('');

  async function handleAuth() {
    // GitHub token è opzionale per repo pubblici
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      alert('Inserisci almeno Supabase URL e Key');
      return;
    }

    setLoading(true);
    try {
      if (githubToken) {
        localStorage.setItem('github_token', githubToken);
      }
      localStorage.setItem('supabase_url', supabaseUrl);
      localStorage.setItem('supabase_key', supabaseKey);

      setIsAuthenticated(true);
      await loadRepos();
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore durante la connessione');
    } finally {
      setLoading(false);
    }
  }

  async function loadRepos() {
    setLoading(true);
    try {
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json'
      };

      if (githubToken) {
        headers['Authorization'] = `Bearer ${githubToken}`;
      }

      // Carica repository dell'utente o dell'organizzazione wasabi-offers
      const response = await fetch('https://api.github.com/users/wasabi-offers/repos?per_page=100', {
        headers
      });

      if (!response.ok) {
        throw new Error('Errore caricamento repository');
      }

      const data = await response.json();
      setRepos(data);
    } catch (error) {
      console.error('Errore caricamento repo:', error);
      alert('Errore nel caricamento dei repository. Se sono privati, serve il GitHub token.');
    } finally {
      setLoading(false);
    }
  }

  async function selectRepo(repo: GithubRepo) {
    setSelectedRepo(repo);
    setLoading(true);

    try {
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3.raw'
      };

      if (githubToken) {
        headers['Authorization'] = `Bearer ${githubToken}`;
      }

      // Prova a caricare vari file comuni di React
      const possibleFiles = [
        'src/App.tsx',
        'src/App.jsx',
        'src/app/App.tsx',
        'App.tsx',
        'App.jsx'
      ];

      let code = '';
      for (const filePath of possibleFiles) {
        try {
          const response = await fetch(
            `https://api.github.com/repos/${repo.full_name}/contents/${filePath}`,
            { headers }
          );

          if (response.ok) {
            const data = await response.json();
            // Decodifica base64
            code = atob(data.content);
            console.log(`Trovato: ${filePath}`);
            break;
          }
        } catch (e) {
          console.log(`File ${filePath} non trovato`);
        }
      }

      if (code) {
        setReactCode(code);
      } else {
        setReactCode('// Nessun file React trovato. Prova a specificare il percorso manualmente.');
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
  <title>${selectedRepo?.name || 'App'}</title>
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
      const response = await fetch(`${supabaseUrl}/rest/v1/html_exports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          app_name: selectedRepo?.name,
          repo_url: selectedRepo?.html_url,
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
      const downloadUrl = `${supabaseUrl}/rest/v1/html_exports?id=eq.${fileId}&select=html_content`;
      setSavedUrl(downloadUrl);

      alert('✅ Salvato su Supabase!');
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert('Errore durante il salvataggio. Verifica le credenziali Supabase e che la tabella html_exports esista.');
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="size-full flex items-center justify-center bg-gray-900 p-6">
        <Card className="w-full max-w-2xl p-8 bg-gray-800 border-gray-600">
          <div className="text-center mb-6">
            <Github className="size-16 mx-auto mb-4 text-white" />
            <h1 className="text-2xl text-white mb-2">GitHub → HTML Converter</h1>
            <p className="text-gray-400 text-sm">Converti le tue app React da GitHub in HTML</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                GitHub Token (opzionale per repo pubblici)
              </label>
              <Input
                type="password"
                placeholder="ghp_xxx... (opzionale)"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                className="bg-gray-700 border-gray-500 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                Serve solo per repository privati. Crea su: Settings → Developer settings → Personal access tokens
              </p>
            </div>

            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                Supabase URL *
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
                Supabase Anon Key *
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Github className="size-4 mr-2" />}
              Connetti
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!selectedRepo) {
    return (
      <div className="size-full flex flex-col bg-gray-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl text-white font-bold">Repository GitHub (wasabi-offers)</h2>
          <Button
            onClick={loadRepos}
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
              {repos.map((repo) => (
                <Card
                  key={repo.id}
                  className="bg-gray-800 border-gray-600 hover:border-blue-400 cursor-pointer transition-all p-6"
                  onClick={() => selectRepo(repo)}
                >
                  <h3 className="text-white font-semibold text-lg mb-2">{repo.name}</h3>
                  <p className="text-gray-400 text-sm mb-3">{repo.description || 'Nessuna descrizione'}</p>
                  <p className="text-xs text-gray-500">{repo.full_name}</p>
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
            onClick={() => { setSelectedRepo(null); setHtmlCode(''); setShowPreview(false); }}
            className="text-gray-300 hover:text-white mb-2"
          >
            ← Indietro
          </Button>
          <h2 className="text-xl text-white font-bold">{selectedRepo.name}</h2>
          <p className="text-sm text-gray-400">{selectedRepo.full_name}</p>
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
                    // Crea un blob e scarica
                    const blob = new Blob([htmlCode], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${selectedRepo.name}.html`;
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
