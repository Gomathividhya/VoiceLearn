
import React, { useState } from 'react';
import { AppView, LibraryItem } from './types';
import Home from './components/Home';
import Reader from './components/Reader';
import DoubtSolver from './components/DoubtSolver';
import Search from './components/Search';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);

  const navigateTo = (view: AppView, item?: LibraryItem) => {
    if (item) setSelectedItem(item);
    setCurrentView(view);
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.HOME:
        return <Home userName="Alex Rivera" onNavigate={navigateTo} />;
      case AppView.READER:
        return selectedItem ? (
          <Reader 
            item={selectedItem} 
            onBack={() => setCurrentView(AppView.HOME)} 
            onNavigateSolver={() => setCurrentView(AppView.SOLVER)}
          />
        ) : <Home userName="Alex Rivera" onNavigate={navigateTo} />;
      case AppView.SOLVER:
        return <DoubtSolver onBack={() => setCurrentView(selectedItem ? AppView.READER : AppView.HOME)} />;
      case AppView.SEARCH:
        return <Search onBack={() => setCurrentView(AppView.HOME)} />;
      default:
        return <Home userName="Alex Rivera" onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col max-w-md mx-auto relative overflow-hidden">
      {/* Conditionally render header based on view */}
      {currentView === AppView.HOME && (
        <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#1c1b2e] sticky top-0 z-10 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 overflow-hidden">
              <img alt="Profile" className="w-full h-full object-cover" src="https://picsum.photos/seed/alex/100/100" />
            </div>
            <div>
              <p className="text-xs text-[#656487] dark:text-gray-400 font-medium">Welcome back,</p>
              <h2 className="text-sm font-bold leading-tight">Alex Rivera</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-[#656487] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <h1 className="text-lg font-bold text-primary ml-2">VoiceLearn</h1>
          </div>
        </header>
      )}

      {renderContent()}

      {/* Nav for Views that aren't Reader or Solver */}
      {(currentView === AppView.HOME || currentView === AppView.SEARCH) && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-[#1c1b2e]/90 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 px-6 pt-3 pb-8 flex items-center justify-between z-20 max-w-md mx-auto">
          <button onClick={() => setCurrentView(AppView.HOME)} className={`flex flex-col items-center gap-1 ${currentView === AppView.HOME ? 'text-primary' : 'text-[#656487] dark:text-gray-400'}`}>
            <span className={`material-symbols-outlined ${currentView === AppView.HOME ? 'fill-1' : ''}`}>home</span>
            <span className="text-[10px] font-bold">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#656487] dark:text-gray-400">
            <span className="material-symbols-outlined">library_books</span>
            <span className="text-[10px] font-medium">Library</span>
          </button>
          
          <div className="relative -top-10">
            <button 
              onClick={() => setCurrentView(AppView.SOLVER)}
              className="size-16 rounded-full bg-primary text-white flex flex-col items-center justify-center shadow-xl shadow-primary/40 border-4 border-white dark:border-[#121121] active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-3xl">mic</span>
            </button>
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-max text-[10px] font-bold text-primary">Start Session</span>
          </div>

          <button 
            onClick={() => setCurrentView(AppView.SEARCH)} 
            className={`flex flex-col items-center gap-1 ${currentView === AppView.SEARCH ? 'text-primary' : 'text-[#656487] dark:text-gray-400'}`}
          >
            <span className={`material-symbols-outlined ${currentView === AppView.SEARCH ? 'fill-1' : ''}`}>explore</span>
            <span className="text-[10px] font-medium">Explore</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#656487] dark:text-gray-400">
            <span className="material-symbols-outlined">person</span>
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </nav>
      )}

      {/* Background Decoration */}
      <div className="fixed top-0 right-0 -z-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
    </div>
  );
};

export default App;
