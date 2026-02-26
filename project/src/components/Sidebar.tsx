import { Menu, X } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  children?: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-3 sm:top-4 left-3 sm:left-4 z-50 bg-white hover:bg-slate-100 text-slate-700 p-2 rounded-lg shadow-md transition-colors"
        aria-label="メニューを開く"
      >
        <Menu className="w-5 h-5" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-xl z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '280px' }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">メニュー</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="メニューを閉じる"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            {children}
          </nav>
        </div>
      </div>
    </>
  );
}
