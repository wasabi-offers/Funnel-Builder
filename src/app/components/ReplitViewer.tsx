import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Download, Eye, Loader2, Save } from 'lucide-react';

// Leggi variabili d'ambiente
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export function ReplitViewer() {
  const [loading, setLoading] = useState(false);
  const [replitUrl, setReplitUrl] = useState('');
  const [appName, setAppName] = useState('');
  const [reactCode, setReactCode] = useState('');
  const [htmlCode, setHtmlCode] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [savedUrl, setSavedUrl] = useState('');

  async function loadFromReplit() {
    if (!replitUrl.trim()) {
      alert('Inserisci l\'URL della tua app Replit');
      return;
    }

    setLoading(true);
    try {
      // Estrai username e nome progetto dall'URL
      // Formato: https://replit.com/@username/project-name
      const match = replitUrl.match(/replit\.com\/@([^/]+)\/([^/?]+)/);
      if (!match) {
        throw new Error('URL Replit non valido. Usa il formato: https://replit.com/@username/project-name');
      }

      const [, username, projectName] = match;
      setAppName(projectName);

      // Prova a caricare da GitHub (se sincronizzato)
      const githubUrl = `https://github.com/${username}/${projectName}`;

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
            `https://api.github.com/repos/${username}/${projectName}/contents/${filePath}`,
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
        alert(`✅ Codice caricato da ${projectName}!`);
      } else {
        setReactCode('// Nessun file React trovato. Assicurati che il progetto sia sincronizzato con GitHub.');
        alert('⚠️ Nessun file React trovato. Verifica che il progetto Replit sia sincronizzato con GitHub.');
      }
    } catch (error: any) {
      console.error('Errore caricamento:', error);
      alert(error.message || 'Errore nel caricamento. Verifica l\'URL e che il progetto sia pubblico su GitHub.');
      setReactCode('');
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
  <title>${appName || 'App'}</title>
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
          app_name: appName,
          repo_url: replitUrl,
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

  return (
    <div className="size-full flex flex-col bg-gray-900">
      <div className="bg-gray-800 border-b border-gray-600 p-4">
        <h2 className="text-2xl text-white font-bold mb-4">Importa da Replit</h2>

        <div className="flex gap-3 mb-4">
          <Input
            type="text"
            placeholder="https://replit.com/@username/project-name"
            value={replitUrl}
            onChange={(e) => setReplitUrl(e.target.value)}
            className="flex-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                loadFromReplit();
              }
            }}
          />
          <Button
            onClick={loadFromReplit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
          >
            {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : '📥'} Carica
          </Button>
        </div>

        {appName && (
          <div className="text-sm text-gray-400">
            App caricata: <span className="text-white font-semibold">{appName}</span>
          </div>
        )}
      </div>

      {reactCode && (
        <div className="bg-gray-800 border-b border-gray-600 p-4 flex items-center justify-between">
          <div className="text-white font-semibold">
            {appName || 'App Replit'}
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
      )}

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
