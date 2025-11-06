
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

type Page = 'intro' | 'analysis';
export type ChatMessage = { role: 'user' | 'model'; text: string; };

// --- Urbis Logo ---
const UrbisLogo: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`inline-block text-green-700 dark:text-green-500 ${className}`}>
        <svg viewBox="0 0 100 60" className="w-full h-full" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Buildings and Chart lines */}
            <path d="M10 55 V 40 L 20 30 L 30 40 V 55" />
            <path d="M35 55 V 25 H 48 V 55" />
            <path d="M53 55 V 15 H 66 V 55" />
            <path d="M71 55 V 45" />
            <path d="M79 55 V 35" />
            {/* Windows */}
            <circle cx="41.5" cy="35" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="41.5" cy="45" r="1.2" fill="currentColor" stroke="none" />
            {/* Arrow */}
            <path d="M15 35 L 50 5 L 90 20" />
            <path d="M80 13 L 90 20 L 78 26" />
        </svg>
    </div>
);


// --- Page Components ---

const IntroPage: React.FC = () => (
  <div className="space-y-8 animate-fade-in">
    <section className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 transform hover:scale-[1.01] transition-transform duration-300">
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-4">
        Introduction
      </h2>
      <p className="text-base sm:text-lg leading-relaxed text-gray-600 dark:text-gray-300">
        Welcome to Urbis. Created by a passionate team of four, Urbis is a revolutionary tool designed to empower the urban planners of tomorrow. By harnessing the predictive power of Google's Gemini API, we provide deep, data-driven insights into population trends and urban sprawl. Our mission is to help build smarter, more sustainable cities by giving planners the clarity they need to make informed decisions for the future.
      </p>
    </section>

     <section className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-6 text-center">
        Our Vision for Canada
      </h2>
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
        <div className="md:w-1/3 flex-shrink-0">
          <UrbisLogo className="w-40 h-40 md:w-48 md:h-48 mx-auto" />
        </div>
        <div className="md:w-2/3">
          <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg leading-relaxed text-center md:text-left">
            Our journey begins with the Greater Toronto Area, but our vision extends far beyond. We are driven by the goal of expanding Urbis to cover every major urban center across Canada. We believe that by providing this powerful analytical tool nationwide, we can contribute to more efficient, equitable, and forward-thinking urban development for all Canadians.
          </p>
        </div>
      </div>
    </section>
  </div>
);

const AnalysisPage: React.FC<{ data: GtaPopulationData, location: string, onLocationChange: (loc: string) => void }> = ({ data, location, onLocationChange }) => (
    <div className="space-y-8 animate-fade-in">
      <GtaMap location={location} onLocationChange={onLocationChange} />
      
      {data.predictedHotspots && data.predictedHotspots.length > 0 && (
        <PredictedHotspots hotspots={data.predictedHotspots} onViewHotspot={onLocationChange} />
      )}
      
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


// --- Helper Icons ---
const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const ChartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
  </svg>
);

const UrboIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Head */}
    <rect x="7" y="4" width="10" height="8" rx="1.5" />
    {/* Antenna */}
    <line x1="12" y1="4" x2="12" y2="2" />
    <circle cx="12" cy="1.5" r="0.5" fill="currentColor" />
    {/* Eyes */}
    <circle cx="10" cy="8" r="0.5" fill="currentColor" />
    <circle cx="14" cy="8" r="0.5" fill="currentColor" />
    {/* Mouth */}
    <path d="M10 10 C 11 11, 13 11, 14 10" />
    {/* Body */}
    <rect x="6" y="13" width="12" height="7" rx="1.5" />
    {/* Button on body */}
    <circle cx="12" cy="16.5" r="1.5" />
    {/* Waving arm */}
    <path d="M6 15 C 3.5 15 3 12 5 11" />
    {/* Other arm */}
    <path d="M18 15 V 17" />
    {/* Feet */}
    <path d="M8 20v1.5a1 1 0 0 0 2 0V20" />
    <path d="M14 20v1.5a1 1 0 0 0 2 0V20" />
  </svg>
);


// --- Sidebar Component ---

const Sidebar: React.FC<{ activePage: Page, setPage: (page: Page) => void, onOpenChat: () => void }> = ({ activePage, setPage, onOpenChat }) => {
  const navItems = [
    { id: 'intro', label: 'Introduction', icon: <HomeIcon className="h-5 w-5" /> },
    { id: 'analysis', label: 'Growth & Population', icon: <ChartIcon className="h-5 w-5" /> },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-800 p-4 flex-shrink-0 border-r border-gray-200 dark:border-slate-700 hidden md:flex md:flex-col">
      <div className="flex flex-col items-center text-center mb-10 px-2">
        <UrbisLogo className="w-24 h-auto" />
        <h1 className="text-3xl font-bold text-green-700 dark:text-green-500 mt-2">Urbis</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Predicting Urban Growth</p>
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
            <UrboIcon className="h-6 w-6 text-green-600 dark:text-green-500" />
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
    // Only fetch data if on analysis page. Intro page is static.
    if (page === 'analysis') {
      fetchData(location);
    } else {
        setIsLoading(false); // No loading needed for intro
    }
  }, [location, page, fetchData]);

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

  const handleSetPage = (newPage: Page) => {
      setPage(newPage);
      // Reset location to default when going to analysis from intro
      // and data for GTA hasn't been fetched yet
      if (newPage === 'analysis' && location !== 'Greater Toronto Area' && !data) {
          setLocation('Greater Toronto Area');
      }
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-500">
      <Sidebar activePage={page} setPage={handleSetPage} onOpenChat={() => setIsChatOpen(true)} />
      <div className="flex-1 flex flex-col max-h-screen overflow-y-auto">
        <Header title={page === 'intro' ? 'Welcome to Urbis' : (data?.title || 'Urban Growth Analysis')} />
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          
          <div className="max-w-4xl mx-auto space-y-8">
            {page === 'intro' && <IntroPage />}

            {page === 'analysis' && (
              <>
                {isLoading && <LoadingSpinner />}
                {error && <ErrorDisplay message={error} onRetry={() => fetchData(location)} />}
                {data && !isLoading && !error && (
                  <AnalysisPage data={data} location={location} onLocationChange={setLocation} />
                )}
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
