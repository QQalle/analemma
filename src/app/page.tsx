'use client';

import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { MapPin, Info, Moon, Sun } from 'lucide-react';

// Dynamically import the Map component to avoid SSR issues with Leaflet
const MapWithNoSSR = dynamic(
  () => import('@/components/Map'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-white dark:bg-[#121212]">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin">
            <MapPin className="w-6 h-6 text-red-600" />
          </div>
          <span className="text-sm text-neutral-600 dark:text-neutral-400">Loading map...</span>
        </div>
      </div>
    )
  }
);

// Dynamically import the AnalemmaChart component
const AnalemmaChart = dynamic(
  () => import('@/components/AnalemmaChart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-white dark:bg-[#121212]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-neutral-200 dark:border-neutral-700 border-t-red-600 animate-spin" />
          <span className="text-sm text-neutral-600 dark:text-neutral-400">Calculating sun positions...</span>
        </div>
      </div>
    )
  }
);

// Stockholm coordinates
const STOCKHOLM = {
  lat: 59.3293,
  lng: 18.0686
};

export default function Home() {
  const [location, setLocation] = useState(STOCKHOLM);
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [timezoneOffset, setTimezoneOffset] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [showTodayPath, setShowTodayPath] = useState(false);

  // Handle initial client-side setup
  useEffect(() => {
    setIsClient(true);
    
    // Initialize theme
    const initializeTheme = () => {
      const storedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
        setIsDark(true);
        document.documentElement.classList.add('dark');
      } else {
        setIsDark(false);
        document.documentElement.classList.remove('dark');
      }
      
      if (!storedTheme && prefersDark) {
        localStorage.setItem('theme', 'dark');
      }
    };

    initializeTheme();

    // Set up system theme change listener
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const storedTheme = localStorage.getItem('theme');
      if (!storedTheme) {
        setIsDark(e.matches);
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Handle timezone offset updates
  useEffect(() => {
    if (isClient) {
      const offset = Math.round(location.lng / 15);
      setTimezoneOffset(`UTC${offset >= 0 ? '+' : ''}${offset}`);
    }
  }, [location.lng, isClient]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Show loading state until client-side code is ready
  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#121212] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-200 dark:border-neutral-700 border-t-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <main className="relative min-h-screen transition-colors duration-200" suppressHydrationWarning>
      {/* Gradient overlay at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[30vh] bg-gradient-to-t from-[#ffedd5] via-[#fef3c7] to-transparent dark:from-[#1e1b4b] dark:via-[#312e81] dark:to-transparent opacity-40" />
      <div className="relative p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-7xl"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            {/* Title and Info Button */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold tracking-tight text-black dark:text-white">
                  Analemma
                </h1>
                <div className="flex gap-2 items-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowInfo(!showInfo)}
                    className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <Info className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    {isDark ? (
                      <Sun className="w-5 h-5 text-yellow-400" />
                    ) : (
                      <Moon className="w-5 h-5 text-neutral-400" />
                    )}
                  </motion.button>
                </div>
              </div>
              <p className="text-lg text-neutral-600 dark:text-neutral-400">
                Visualize the sun&apos;s position throughout the year
              </p>
            </div>

            {/* Time and Location Display */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <div className="w-full sm:w-auto flex items-center gap-2 bg-white dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-2 shadow-sm">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  {selectedTime} ({timezoneOffset})
                </span>
              </div>
              <div className="w-full sm:w-auto flex items-center gap-2 bg-white dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-2 shadow-sm">
                <MapPin className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  {location.lat.toFixed(4)}°N, {location.lng.toFixed(4)}°E
                </span>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 mb-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-black dark:text-white mb-2">About the Sun&apos;s Position</h2>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    The graph shows the sun&apos;s position in the sky for each hour throughout the year. Click on a line to highlight that hour. 
                    The altitude (y-axis) shows how high the sun is in the sky, and the azimuth (x-axis) shows the direction of the sun.
                  </p>
        </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chart Container */}
          <div className="relative">
            {/* Mini Map - Positioned relative to chart */}
            <motion.div
              className="absolute top-4 right-4 z-50"
              initial={false}
              animate={{
                width: isMapExpanded ? '300px' : '150px',
                height: isMapExpanded ? '225px' : '120px',
              }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              onHoverStart={() => setIsMapExpanded(true)}
              onHoverEnd={() => setIsMapExpanded(false)}
            >
              <motion.div 
                className="w-full h-full rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] shadow-sm"
                animate={{
                  scale: isMapExpanded ? 1 : 0.98
                }}
                transition={{
                  scale: {
                    type: "spring",
                    stiffness: 400,
                    damping: 25
                  }
                }}
              >
                <MapWithNoSSR 
                  onLocationSelect={setLocation}
                  defaultLocation={STOCKHOLM}
                  isDark={isDark}
                />
              </motion.div>
            </motion.div>

            {/* Settings Panel */}
            <motion.div
              className="absolute top-[calc(120px+1rem)] right-4 z-50 w-[150px]"
              initial={false}
              animate={{
                top: isMapExpanded ? 'calc(225px + 1rem)' : 'calc(120px + 1rem)',
                width: isMapExpanded ? '300px' : '150px',
              }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
            >
              <motion.div 
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] shadow-sm p-3"
                animate={{
                  scale: isMapExpanded ? 1 : 0.98
                }}
                transition={{
                  scale: {
                    type: "spring",
                    stiffness: 400,
                    damping: 25
                  }
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer select-none">
                    Show today&apos;s sun path
                  </label>
                  <div 
                    onClick={() => setShowTodayPath(!showTodayPath)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${showTodayPath ? 'bg-red-600' : 'bg-neutral-200 dark:bg-neutral-700'}`}
                  >
                    <span 
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showTodayPath ? 'translate-x-4' : 'translate-x-0.5'}`}
                      style={{ margin: '2px 0' }}
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Analemma Chart */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-[calc(100vh-16rem)] sm:h-[calc(100vh-12rem)] bg-white dark:bg-[#121212] rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden"
            >
              <AnalemmaChart
                latitude={location.lat}
                longitude={location.lng}
                selectedTime={selectedTime}
                onTimeSelect={setSelectedTime}
                isDark={isDark}
                showTodayPath={showTodayPath}
              />
            </motion.div>
          </div>
        </motion.div>
    </div>
      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-6 left-0 right-0 text-center"
        suppressHydrationWarning
      >
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Made with ❤️ in 🇸🇪 by Carl Liljeberg
        </p>
      </motion.div>
    </main>
  );
}
