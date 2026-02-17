
import React from 'react';
import { SAMPLE_LIBRARY } from '../constants';
import { AppView, LibraryItem } from '../types';

interface HomeProps {
  userName: string;
  onNavigate: (view: AppView, item?: LibraryItem) => void;
}

const Home: React.FC<HomeProps> = ({ userName, onNavigate }) => {
  const activeItem = SAMPLE_LIBRARY[0];

  return (
    <main className="flex-1 px-6 py-4 space-y-8 overflow-y-auto pb-32">
      <section>
        <h2 className="text-2xl font-bold tracking-tight">Ready to listen?</h2>
        <p className="text-[#656487] dark:text-gray-400">Continue where you left off or add new notes.</p>
      </section>

      {/* Continue Learning Card */}
      <section className="relative">
        <div className="bg-white dark:bg-[#1c1b2e] rounded-xl p-5 shadow-md border border-gray-100 dark:border-gray-800">
          <div className="flex items-start justify-between mb-4">
            <div className="flex gap-4">
              <div className="size-14 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-3xl">menu_book</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">{activeItem.title}</h3>
                <p className="text-sm text-[#656487] dark:text-gray-400">Chapter 4: The 1% Rule</p>
              </div>
            </div>
            <button 
              onClick={() => onNavigate(AppView.READER, activeItem)}
              className="size-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
            >
              <span className="material-symbols-outlined text-3xl">play_arrow</span>
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-primary">{activeItem.progress}% completed</span>
              <span className="text-[#656487]">{activeItem.lastRead}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all" 
                style={{ width: `${activeItem.progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* Upload Card */}
      <section>
        <div className="bg-primary rounded-xl p-6 text-white shadow-xl shadow-primary/20 flex flex-col items-center text-center gap-4 border border-white/10">
          <div className="size-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
            <span className="material-symbols-outlined text-4xl">cloud_upload</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold">Upload Book or Notes</h3>
            <p className="text-white/80 text-sm">Turn any PDF, EPUB, or photo into a voice lesson instantly.</p>
          </div>
          <button className="w-full bg-white text-primary font-bold py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">add_circle</span>
            Add New Material
          </button>
        </div>
      </section>

      {/* Your Library Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Your Library</h3>
          <button className="text-primary text-sm font-semibold">View All</button>
        </div>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          {SAMPLE_LIBRARY.map((item) => (
            <div 
              key={item.id} 
              className="min-w-[140px] w-[140px] space-y-2 cursor-pointer"
              onClick={() => onNavigate(AppView.READER, item)}
            >
              <div className="aspect-[3/4] rounded-lg bg-gray-200 dark:bg-gray-800 overflow-hidden relative shadow-sm">
                <img alt={item.title} className="w-full h-full object-cover" src={item.coverUrl} />
                <div className="absolute bottom-2 right-2 size-8 bg-white/90 dark:bg-black/80 backdrop-blur rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-sm">headphones</span>
                </div>
              </div>
              <p className="text-sm font-bold truncate">{item.title}</p>
              <p className="text-xs text-[#656487] dark:text-gray-400 italic">{item.lastRead}</p>
            </div>
          ))}
          <div className="min-w-[140px] w-[140px] space-y-2">
            <div className="aspect-[3/4] rounded-lg bg-gray-200 dark:bg-gray-800 overflow-hidden relative shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-gray-400 text-3xl">add</span>
              <span className="text-xs font-medium text-gray-400">Add Book</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
