import { useState } from 'react';
import { FigmaAccountViewer } from './components/FigmaAccountViewer';
import { ReplitViewer } from './components/ReplitViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Code, Figma } from 'lucide-react';

export default function App() {
  return (
    <div className="size-full bg-gray-900">
      <Tabs defaultValue="figma" className="size-full flex flex-col">
        <div className="bg-gray-800 border-b border-gray-600 px-6 py-3">
          <TabsList className="bg-transparent">
            <TabsTrigger value="figma" className="data-[state=active]:bg-gray-700 text-gray-200 text-lg">
              <svg className="size-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              Figma
            </TabsTrigger>
            <TabsTrigger value="replit" className="data-[state=active]:bg-gray-700 text-gray-200 text-lg">
              <Code className="size-5 mr-2" />
              Replit → HTML
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="figma" className="flex-1 m-0">
          <FigmaAccountViewer />
        </TabsContent>

        <TabsContent value="replit" className="flex-1 m-0">
          <ReplitViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
