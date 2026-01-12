import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ExternalLink, Maximize2, Minimize2 } from 'lucide-react';

interface FigmaEmbedProps {
  defaultUrl?: string;
}

export function FigmaEmbed({ defaultUrl = '' }: FigmaEmbedProps) {
  const [figmaUrl, setFigmaUrl] = useState(defaultUrl);
  const [embedUrl, setEmbedUrl] = useState(defaultUrl ? convertToEmbedUrl(defaultUrl) : '');
  const [isFullscreen, setIsFullscreen] = useState(false);

  function convertToEmbedUrl(url: string): string {
    if (!url) return '';
    
    // Se è già un URL di embed, ritornalo così com'è
    if (url.includes('embed')) return url;
    
    // Converti URL normale di Figma in embed URL
    // Da: https://www.figma.com/file/ABC123/Nome-File
    // A: https://www.figma.com/embed?embed_host=share&url=https://www.figma.com/file/ABC123/Nome-File
    const encodedUrl = encodeURIComponent(url);
    return `https://www.figma.com/embed?embed_host=share&url=${encodedUrl}`;
  }

  function handleLoadFigma() {
    if (figmaUrl) {
      setEmbedUrl(convertToEmbedUrl(figmaUrl));
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleLoadFigma();
    }
  }

  return (
    <div className="size-full flex flex-col">
      {/* Header con controlli */}
      <div className="bg-[#24292e] text-white p-4 flex items-center gap-3 border-b border-gray-700">
        <div className="flex-1 flex items-center gap-2">
          <Input
            type="text"
            placeholder="Incolla l'URL del file Figma qui..."
            value={figmaUrl}
            onChange={(e) => setFigmaUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            className="bg-[#1b1f23] border-gray-600 text-white placeholder:text-gray-400"
          />
          <Button 
            onClick={handleLoadFigma}
            variant="default"
            className="bg-[#2ea44f] hover:bg-[#2c974b] text-white"
          >
            Carica
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {embedUrl && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="text-gray-300 hover:text-white hover:bg-gray-700"
                title={isFullscreen ? "Esci da schermo intero" : "Schermo intero"}
              >
                {isFullscreen ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(figmaUrl, '_blank')}
                className="text-gray-300 hover:text-white hover:bg-gray-700"
                title="Apri in Figma"
              >
                <ExternalLink className="size-5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Area principale con iframe Figma */}
      <div className={`flex-1 bg-gray-100 ${isFullscreen ? 'fixed inset-0 z-50 flex flex-col' : ''}`}>
        {isFullscreen && (
          <div className="bg-[#24292e] text-white p-2 flex items-center justify-between border-b border-gray-700">
            <span className="text-sm text-gray-400">Modalità schermo intero</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(false)}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <Minimize2 className="size-4 mr-2" />
              Esci
            </Button>
          </div>
        )}
        
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="size-full border-0"
            allowFullScreen
            title="Figma Embed"
          />
        ) : (
          <div className="size-full flex flex-col items-center justify-center text-gray-500">
            <svg className="size-24 mb-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <p className="text-lg mb-2">Nessun file Figma caricato</p>
            <p className="text-sm text-gray-400">Incolla l'URL del tuo file Figma qui sopra per iniziare</p>
            <div className="mt-6 p-4 bg-white rounded-lg border border-gray-300 max-w-md">
              <p className="text-sm text-gray-600 mb-2"><strong>Come ottenere l'URL:</strong></p>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Apri il tuo file in Figma</li>
                <li>Clicca su "Share" in alto a destra</li>
                <li>Copia il link di condivisione</li>
                <li>Incollalo nel campo qui sopra</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
