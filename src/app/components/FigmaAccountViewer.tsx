import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { 
  Folder, 
  File, 
  Users, 
  ExternalLink, 
  Settings,
  Loader2,
  Eye,
  Clock,
  Search
} from 'lucide-react';

interface FigmaFile {
  key: string;
  name: string;
  thumbnail_url: string;
  last_modified: string;
}

interface FigmaProject {
  id: string;
  name: string;
}

interface FigmaTeam {
  id: string;
  name: string;
}

export function FigmaAccountViewer() {
  console.log('=== FIGMA ACCOUNT VIEWER LOADED - VERSION 2.0 ===');

  const [token, setToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<FigmaTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [projects, setProjects] = useState<FigmaProject[]>([]);
  const [files, setFiles] = useState<FigmaFile[]>([]);
  const [recentFiles, setRecentFiles] = useState<FigmaFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<FigmaFile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [manualTeamId, setManualTeamId] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('figma_token');
    if (savedToken) {
      setToken(savedToken);
      authenticateWithToken(savedToken);
    }
  }, []);

  async function authenticateWithToken(tokenToUse: string) {
    setLoading(true);
    try {
      // Verifica il token ottenendo le info dell'utente
      const userResponse = await fetch('https://api.figma.com/v1/me', {
        headers: {
          'X-Figma-Token': tokenToUse
        }
      });

      if (!userResponse.ok) {
        throw new Error('Token non valido');
      }

      const userData = await userResponse.json();
      setUserInfo(userData);
      setIsAuthenticated(true);
      localStorage.setItem('figma_token', tokenToUse);

      // Carica i team
      await loadTeams(tokenToUse);
      
      // Carica i file recenti
      await loadRecentFiles(tokenToUse);
    } catch (error) {
      console.error('Errore autenticazione:', error);
      alert('Errore: Token non valido. Verifica che sia corretto.');
    } finally {
      setLoading(false);
    }
  }

  async function loadUserFiles(tokenToUse: string) {
    try {
      console.log('Caricamento file per account personale...');

      // Per account personali, proviamo a usare l'ID utente come "team"
      const userResponse = await fetch('https://api.figma.com/v1/me', {
        headers: {
          'X-Figma-Token': tokenToUse
        }
      });
      const userData = await userResponse.json();

      console.log('Dati utente completi:', userData);

      // Prova 1: Usa l'ID utente come se fosse un team
      if (userData.id) {
        console.log('Tentativo di caricare progetti per user ID:', userData.id);

        try {
          const projectsResponse = await fetch(`https://api.figma.com/v1/users/${userData.id}/projects`, {
            headers: {
              'X-Figma-Token': tokenToUse
            }
          });

          if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json();
            console.log('Progetti trovati:', projectsData);

            if (projectsData.projects) {
              setProjects(projectsData.projects);

              // Carica file da tutti i progetti
              const allFiles: FigmaFile[] = [];
              for (const project of projectsData.projects) {
                const filesResponse = await fetch(`https://api.figma.com/v1/projects/${project.id}/files`, {
                  headers: {
                    'X-Figma-Token': tokenToUse
                  }
                });
                const filesData = await filesResponse.json();
                console.log(`File nel progetto ${project.name}:`, filesData.files?.length || 0);
                if (filesData.files) {
                  allFiles.push(...filesData.files);
                }
              }
              setFiles(allFiles);
              console.log('Totale file caricati:', allFiles.length);
              return;
            }
          }
        } catch (e) {
          console.log('Endpoint users non disponibile, provo con approccio alternativo');
        }
      }

      // Se non funziona, proviamo ad accedere come se fosse un team personale
      // Alcuni account personali hanno un team_id che corrisponde all'utente
      setFiles([]);
      setProjects([]);

      console.error('Impossibile caricare file automaticamente. L\'API Figma non espone i file dei Drafts personali.');
    } catch (error) {
      console.error('Errore caricamento file utente:', error);
      setFiles([]);
      setProjects([]);
    }
  }

  async function loadAllFiles(teams: FigmaTeam[], tokenToUse: string) {
    try {
      const allFiles: FigmaFile[] = [];

      console.log('Caricamento file da', teams.length, 'team...');

      // Carica file da tutti i team
      for (const team of teams) {
        const projectsResponse = await fetch(`https://api.figma.com/v1/teams/${team.id}/projects`, {
          headers: {
            'X-Figma-Token': tokenToUse
          }
        });
        const projectsData = await projectsResponse.json();

        console.log(`Team ${team.name}:`, projectsData.projects?.length || 0, 'progetti');

        if (projectsData.projects) {
          // Per ogni progetto, carica i file
          for (const project of projectsData.projects) {
            const filesResponse = await fetch(`https://api.figma.com/v1/projects/${project.id}/files`, {
              headers: {
                'X-Figma-Token': tokenToUse
              }
            });
            const filesData = await filesResponse.json();
            console.log(`Progetto ${project.name}:`, filesData.files?.length || 0, 'file');
            if (filesData.files) {
              allFiles.push(...filesData.files);
            }
          }
        }
      }

      console.log('Totale file caricati da team:', allFiles.length);
      setFiles(allFiles);
    } catch (error) {
      console.error('Errore caricamento tutti i file:', error);
    }
  }

  async function loadTeams(tokenToUse: string) {
    try {
      const response = await fetch('https://api.figma.com/v1/me', {
        headers: {
          'X-Figma-Token': tokenToUse
        }
      });
      const data = await response.json();

      console.log('User info:', data);
      console.log('User info JSON:', JSON.stringify(data, null, 2));

      const teamsData: FigmaTeam[] = [];

      if (data.team_ids && data.team_ids.length > 0) {
        // Carica i dettagli di ogni team
        for (const teamId of data.team_ids) {
          const teamResponse = await fetch(`https://api.figma.com/v1/teams/${teamId}/projects`, {
            headers: {
              'X-Figma-Token': tokenToUse
            }
          });
          const teamData = await teamResponse.json();
          teamsData.push({
            id: teamId,
            name: teamData.name || `Team ${teamId}`
          });
        }
        setTeams(teamsData);

        // Carica TUTTI i file da TUTTI i team
        await loadAllFiles(teamsData, tokenToUse);

        // Seleziona il primo team
        if (teamsData.length > 0) {
          setSelectedTeam(teamsData[0].id);
          await loadProjects(teamsData[0].id, tokenToUse);
        }
      } else {
        // Nessun team - account personale
        console.log('Account personale senza team, carico tutti i file disponibili');

        // Per account personali, dobbiamo usare l'endpoint dei file dell'utente
        // Purtroppo Figma API non ha un endpoint diretto per "tutti i miei file"
        // Dobbiamo usare un workaround: caricare dai file che l'utente può vedere
        await loadUserFiles(tokenToUse);
      }
    } catch (error) {
      console.error('Errore caricamento team:', error);
    }
  }

  async function loadProjects(teamId: string, tokenToUse?: string) {
    const currentToken = tokenToUse || token;
    try {
      const response = await fetch(`https://api.figma.com/v1/teams/${teamId}/projects`, {
        headers: {
          'X-Figma-Token': currentToken
        }
      });
      const data = await response.json();
      setProjects(data.projects || []);
      
      // Carica i file del primo progetto
      if (data.projects && data.projects.length > 0) {
        await loadProjectFiles(data.projects[0].id, currentToken);
      }
    } catch (error) {
      console.error('Errore caricamento progetti:', error);
    }
  }

  async function loadProjectFiles(projectId: string, tokenToUse?: string) {
    const currentToken = tokenToUse || token;
    try {
      const response = await fetch(`https://api.figma.com/v1/projects/${projectId}/files`, {
        headers: {
          'X-Figma-Token': currentToken
        }
      });
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Errore caricamento file:', error);
    }
  }

  async function loadRecentFiles(tokenToUse?: string) {
    const currentToken = tokenToUse || token;
    try {
      // Usa l'endpoint per ottenere i file recenti dell'utente
      const response = await fetch('https://api.figma.com/v1/me', {
        headers: {
          'X-Figma-Token': currentToken
        }
      });
      const data = await response.json();

      console.log('User data:', data);

      // Carica i file recenti se disponibili
      if (data.recent_files) {
        const recentFilesData: FigmaFile[] = data.recent_files.map((file: any) => ({
          key: file.key,
          name: file.name,
          thumbnail_url: file.thumbnail_url || '',
          last_modified: file.last_modified || new Date().toISOString()
        }));
        setRecentFiles(recentFilesData);

        // Se non ci sono file dai progetti, usa i file recenti
        setFiles((prevFiles) => {
          if (prevFiles.length === 0) {
            return recentFilesData;
          }
          return prevFiles;
        });
      }
    } catch (error) {
      console.error('Errore caricamento file recenti:', error);
    }
  }

  function handleAuthenticate() {
    if (token.trim()) {
      authenticateWithToken(token.trim());
    }
  }

  function handleLogout() {
    localStorage.removeItem('figma_token');
    setIsAuthenticated(false);
    setToken('');
    setTeams([]);
    setProjects([]);
    setFiles([]);
    setSelectedFile(null);
  }

  function openFile(file: FigmaFile) {
    setSelectedFile(file);
  }

  function closeFileViewer() {
    setSelectedFile(null);
  }

  async function loadFromManualTeamId() {
    if (!manualTeamId.trim()) {
      alert('Inserisci un Team ID');
      return;
    }

    setLoading(true);
    try {
      const teamsData: FigmaTeam[] = [{
        id: manualTeamId.trim(),
        name: 'Il mio Team'
      }];

      setTeams(teamsData);
      setSelectedTeam(manualTeamId.trim());

      // Carica tutti i file dal team
      await loadAllFiles(teamsData, token);
      await loadProjects(manualTeamId.trim(), token);

      // Aspetta un attimo per dare tempo allo stato di aggiornarsi
      setTimeout(() => {
        console.log('File caricati nello stato:', files.length);
      }, 100);
    } catch (error) {
      console.error('Errore caricamento team manuale:', error);
      alert('Errore nel caricamento del team. Verifica il Team ID.');
    } finally {
      setLoading(false);
    }
  }

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="size-full flex items-center justify-center bg-[#0d1117]">
        <Card className="w-full max-w-md p-8 bg-[#161b22] border-gray-700">
          <div className="text-center mb-6">
            <svg className="size-16 mx-auto mb-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <h1 className="text-2xl text-white mb-2">Accedi al tuo Account Figma</h1>
            <p className="text-gray-400 text-sm">Inserisci il tuo Personal Access Token</p>
          </div>

          <div className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="figd_..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAuthenticate()}
                className="bg-[#0d1117] border-gray-600 text-white placeholder:text-gray-500"
              />
            </div>

            <Button 
              onClick={handleAuthenticate}
              disabled={!token.trim() || loading}
              className="w-full bg-[#238636] hover:bg-[#2ea043] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Connessione...
                </>
              ) : (
                'Accedi'
              )}
            </Button>

            <div className="mt-6 p-4 bg-[#0d1117] rounded border border-gray-700">
              <p className="text-xs text-gray-400 mb-2"><strong className="text-gray-300">Come ottenere il token:</strong></p>
              <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                <li>Vai su Figma → Settings → Account</li>
                <li>Scorri fino a "Personal access tokens"</li>
                <li>Clicca su "Generate new token"</li>
                <li>Copia il token e incollalo qui</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (selectedFile) {
    const embedUrl = `https://www.figma.com/embed?embed_host=share&url=https://www.figma.com/file/${selectedFile.key}/${selectedFile.name}`;
    
    return (
      <div className="size-full flex flex-col bg-[#0d1117]">
        <div className="bg-[#161b22] border-b border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={closeFileViewer}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              ← Indietro
            </Button>
            <File className="size-5 text-gray-400" />
            <h2 className="text-white font-medium">{selectedFile.name}</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open(`https://www.figma.com/file/${selectedFile.key}`, '_blank')}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            title="Apri in Figma"
          >
            <ExternalLink className="size-5" />
          </Button>
        </div>
        <iframe
          src={embedUrl}
          className="flex-1 border-0"
          allowFullScreen
          title={selectedFile.name}
        />
      </div>
    );
  }

  return (
    <div className="size-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <svg className="size-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <div>
              <h1 className="text-xl text-white font-semibold">Il mio Account Figma</h1>
              {userInfo && (
                <p className="text-sm text-gray-400">{userInfo.email}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Settings className="size-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Contenuto principale */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="files" className="size-full flex flex-col">
          <div className="bg-gray-800 border-b border-gray-600 px-4">
            <TabsList className="bg-transparent">
              <TabsTrigger value="files" className="data-[state=active]:bg-gray-700 text-gray-200">
                <File className="size-4 mr-2" />
                File
              </TabsTrigger>
              <TabsTrigger value="projects" className="data-[state=active]:bg-gray-700 text-gray-200">
                <Folder className="size-4 mr-2" />
                Progetti
              </TabsTrigger>
              <TabsTrigger value="teams" className="data-[state=active]:bg-gray-700 text-gray-200">
                <Users className="size-4 mr-2" />
                Team
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="files" className="flex-1 m-0 p-6">
            {files.length === 0 && (
              <div className="mb-4 p-4 bg-yellow-900/20 border-2 border-yellow-500 rounded-md">
                <p className="text-yellow-400 font-semibold mb-2">⚠️ Nessun file caricato automaticamente</p>
                <p className="text-gray-300 text-sm mb-3">Il tuo account non ha team_ids nell'API. Inserisci manualmente il Team ID:</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Team ID (es: 123456789012345678)"
                    value={manualTeamId}
                    onChange={(e) => setManualTeamId(e.target.value)}
                    className="flex-1 bg-gray-700 border-gray-500 text-white placeholder:text-gray-400"
                  />
                  <Button
                    onClick={loadFromManualTeamId}
                    disabled={loading || !manualTeamId.trim()}
                    className="bg-[#238636] hover:bg-[#2ea043] text-white"
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : 'Carica Team'}
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Trova il Team ID nell'URL di Figma quando apri un progetto del team
                </p>
              </div>
            )}

            <div className="mb-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                <Input
                  placeholder="Cerca file..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-500 text-white placeholder:text-gray-400"
                />
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Oppure incolla URL Figma (https://www.figma.com/file/...)"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="flex-1 bg-gray-700 border-gray-500 text-white placeholder:text-gray-400"
                />
                <Button
                  onClick={() => {
                    const match = fileUrl.match(/file\/([a-zA-Z0-9]+)/);
                    if (match) {
                      const fileKey = match[1];
                      const fileName = fileUrl.split('/').pop()?.split('?')[0] || 'File';
                      openFile({
                        key: fileKey,
                        name: fileName,
                        thumbnail_url: '',
                        last_modified: new Date().toISOString()
                      });
                      setFileUrl('');
                    } else {
                      alert('URL non valido. Usa formato: https://www.figma.com/file/...');
                    }
                  }}
                  disabled={!fileUrl.trim()}
                  className="bg-[#238636] hover:bg-[#2ea043] text-white"
                >
                  Apri
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-400px)] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredFiles.map((file) => (
                  <Card
                    key={file.key}
                    className="bg-gray-800 border-gray-600 hover:border-blue-400 cursor-pointer transition-all group shadow-lg hover:shadow-xl"
                    onClick={() => openFile(file)}
                  >
                    <div className="aspect-video bg-gray-700 rounded-t overflow-hidden relative">
                      {file.thumbnail_url ? (
                        <img 
                          src={file.thumbnail_url} 
                          alt={file.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="size-full flex items-center justify-center">
                          <File className="size-12 text-gray-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="size-8 text-white" />
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-medium truncate mb-2">{file.name}</h3>
                      <div className="flex items-center text-xs text-gray-400">
                        <Clock className="size-3 mr-1" />
                        {new Date(file.last_modified).toLocaleDateString('it-IT')}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {filteredFiles.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <File className="size-16 mx-auto mb-4 opacity-50" />
                  <p>Nessun file trovato</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="projects" className="flex-1 m-0 p-6">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-4">
                {projects.map((project) => (
                  <Card
                    key={project.id}
                    className="bg-[#161b22] border-gray-700 p-4 hover:border-gray-600 cursor-pointer transition-all"
                    onClick={() => loadProjectFiles(project.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Folder className="size-6 text-blue-400" />
                      <h3 className="text-white font-medium">{project.name}</h3>
                    </div>
                  </Card>
                ))}
              </div>

              {projects.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Folder className="size-16 mx-auto mb-4 opacity-50" />
                  <p>Nessun progetto trovato</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="teams" className="flex-1 m-0 p-6">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-4">
                {teams.map((team) => (
                  <Card
                    key={team.id}
                    className={`bg-[#161b22] border-gray-700 p-4 hover:border-gray-600 cursor-pointer transition-all ${
                      selectedTeam === team.id ? 'border-blue-500' : ''
                    }`}
                    onClick={() => {
                      setSelectedTeam(team.id);
                      loadProjects(team.id);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Users className="size-6 text-purple-400" />
                      <h3 className="text-white font-medium">{team.name}</h3>
                    </div>
                  </Card>
                ))}
              </div>

              {teams.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Users className="size-16 mx-auto mb-4 opacity-50" />
                  <p>Nessun team trovato</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
