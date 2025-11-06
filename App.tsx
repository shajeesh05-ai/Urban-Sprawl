
import React, { useState, useEffect, useCallback } from 'react';
import { fetchGtaPopulationInfo, askChatbot } from './services/geminiService';
import type { GtaPopulationData } from './types';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorDisplay from './components/ErrorDisplay';
import PopulationChart from './components/PopulationChart';
import GtaMap from './components/GtaMap';
import UrbanSprawlSection from './components/UrbanSprawlSection';
import PredictedHotspots from './components/PredictedHotspots';
import ChatModal from './components/ChatModal';
import type { Content } from '@google/genai';

const urbanSprawlFactors = [
  "Population growth",
  "Economic indicators (job growth, income levels)",
  "Land Use and Land Cover (LULC)",
  "Transportation Infrastructure",
  "Zoning and Land Use Regulations",
  "Proximity to essential services",
  "Proximity to natural features",
];

type Page = 'intro' | 'hotspots' | 'population';
export type ChatMessage = { role: 'user' | 'model'; text: string; };

// --- Page Components ---

const IntroPage: React.FC<{ data: GtaPopulationData }> = ({ data }) => (
  <div className="space-y-8 animate-fade-in">
    <section className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 transform hover:scale-[1.01] transition-transform duration-300">
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-4">
        Executive Summary
      </h2>
      <p className="text-base sm:text-lg leading-relaxed text-gray-600 dark:text-gray-300">
        {data.summary}
      </p>
    </section>

    <section>
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-6 text-center">
        Key Insights & Projections
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.keyPoints.map((point, index) => (
          <div key={index} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 flex flex-col items-start space-y-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex-shrink-0 bg-teal-100 dark:bg-teal-900 p-3 rounded-full">
              <CheckCircleIcon className="h-6 w-6 text-teal-500 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">{point.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-6">
                {point.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  </div>
);

const HotspotsPage: React.FC<{ data: GtaPopulationData, location: string, onLocationChange: (loc: string) => void }> = ({ data, location, onLocationChange }) => (
  <div className="space-y-8 animate-fade-in">
    <GtaMap location={location} onLocationChange={onLocationChange} />
    {data.predictedHotspots && data.predictedHotspots.length > 0 && (
      <PredictedHotspots hotspots={data.predictedHotspots} onViewHotspot={onLocationChange} />
    )}
    <section className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
      <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-6 text-center">
        Factors Considered for Estimates
      </h3>
      <ul className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-gray-600 dark:text-gray-400 text-sm sm:text-base">
        {urbanSprawlFactors.map((factor, index) => (
          <li key={index} className="flex items-start">
            <svg className="w-5 h-5 mr-3 mt-1 text-teal-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
            <span>{factor}</span>
          </li>
        ))}
      </ul>
    </section>
  </div>
);

const PopulationPage: React.FC<{ data: GtaPopulationData, location: string }> = ({ data, location }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      {data.populationTrend && data.populationTrend.length > 0 && (
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-6 text-center">
            Population Trend for {location}
          </h2>
          <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
            <PopulationChart data={data.populationTrend} />
          </div>
        </section>
      )}

      {data.urbanSprawlPredictions && data.urbanSprawlPredictions.length > 0 && (
          <UrbanSprawlSection predictions={data.urbanSprawlPredictions} />
      )}
    </div>
  );
};

// --- Helper Icons ---
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const MapIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 16.382V5.618a1 1 0 00-1.447-.894L15 7m-6 10v-5m6 5v-5m0 0l-6-3m6 3l6-3" />
  </svg>
);

const ChartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
  </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m1-12a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1h-6a1 1 0 01-1-1V6zM17.657 17.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
  </svg>
);


// --- Sidebar Component ---

const Sidebar: React.FC<{ activePage: Page, setPage: (page: Page) => void, onOpenChat: () => void }> = ({ activePage, setPage, onOpenChat }) => {
  const navItems = [
    { id: 'intro', label: 'Introduction', icon: <HomeIcon className="h-5 w-5" /> },
    { id: 'hotspots', label: 'Growth Hotspots', icon: <MapIcon className="h-5 w-5" /> },
    { id: 'population', label: 'Population Analysis', icon: <ChartIcon className="h-5 w-5" /> },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-800 p-4 flex-shrink-0 border-r border-gray-200 dark:border-slate-700 hidden md:flex md:flex-col">
      <div className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 mb-10 pl-2">
        GTA Insights
      </div>
      <nav>
        <ul className="space-y-2">
          {navItems.map(item => (
            <li key={item.id}>
              <button
                onClick={() => setPage(item.id as Page)}
                className={`flex items-center w-full text-left p-3 rounded-lg transition-colors duration-200 ${
                  activePage === item.id 
                  ? 'bg-teal-50 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 font-semibold' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto">
         <div className="border-t border-gray-200 dark:border-slate-700 my-4"></div>
         <button
            onClick={onOpenChat}
            className="flex items-center w-full text-left p-3 rounded-lg transition-colors duration-200 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <SparklesIcon className="h-5 w-5 text-fuchsia-500" />
            <span className="ml-3 font-semibold">Ask Urbo</span>
         </button>
      </div>
    </aside>
  );
};


// --- Main App Component ---

const App: React.FC = () => {
  const [data, setData] = useState<GtaPopulationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<string>('Greater Toronto Area');
  const [page, setPage] = useState<Page>('intro');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  const fetchData = useCallback(async (loc: string) => {
    setIsLoading(true);
    setError(null);
    setData(null); // Clear old data to prevent showing stale info
    try {
      const result = await fetchGtaPopulationInfo(loc);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(location);
  }, [location, fetchData]);

  const handleSendMessage = useCallback(async (message: string) => {
    setIsChatLoading(true);
    const updatedMessages: ChatMessage[] = [...chatMessages, { role: 'user', text: message }];
    setChatMessages(updatedMessages);

    try {
      // Convert our simple ChatMessage format to the format required by the GenAI SDK
      const history: Content[] = updatedMessages.slice(0, -1).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));
      
      const response = await askChatbot(message, history);
      setChatMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setChatMessages(prev => [...prev, { role: 'model', text: `Sorry, something went wrong: ${errorMessage}` }]);
    } finally {
      setIsChatLoading(false);
    }
  }, [chatMessages]);

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-500">
      <Sidebar activePage={page} setPage={setPage} onOpenChat={() => setIsChatOpen(true)} />
      <div className="flex-1 flex flex-col max-h-screen overflow-y-auto">
        <Header title={data?.title || 'GTA Population Growth'} />
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          {isLoading && <LoadingSpinner />}
          {error && <ErrorDisplay message={error} onRetry={() => fetchData(location)} />}
          
          <div className="max-w-4xl mx-auto space-y-8">
            {data && !isLoading && !error && (
              <>
                {page === 'intro' && <IntroPage data={data} />}
                {page === 'hotspots' && <HotspotsPage data={data} location={location} onLocationChange={setLocation} />}
                {page === 'population' && <PopulationPage data={data} location={location} />}
              </>
            )}
          </div>
        </main>
        <footer className="text-center py-6 mt-auto text-gray-500 dark:text-gray-400 text-sm flex-shrink-0">
          <p>Generated by Google Gemini API</p>
          <p>UI/UX by a World-Class Senior Frontend React Engineer</p>
        </footer>
      </div>
      {isChatOpen && (
        <ChatModal 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          isLoading={isChatLoading}
        />
      )}
    </div>
  );
};

export default App;
