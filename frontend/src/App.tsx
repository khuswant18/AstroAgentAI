import { useEffect } from "react";
import { useStore } from "./store/useStore";
import BirthForm from "./components/BirthForm";
import Chat from "./components/Chat";
import Sidebar from "./components/Sidebar";
import { Menu } from "lucide-react";
import { useState } from "react";
import "./index.css";

export default function App() {
  const { birthDetails, loadHistory, sessionId } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [sessionId, loadHistory]);

  return (
    <div className="h-screen w-screen flex bg-ara-bg overflow-hidden">
      {/* Sidebar (Desktop) */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Sidebar (Mobile Overlay) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-64 h-full bg-[#0d0c1d]" onClick={e => e.stopPropagation()}>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col relative">
        {/* Header Bar */}
        {birthDetails && (
          <header className="h-[56px] border-b border-ara-accent/10 bg-[rgba(11,10,20,0.8)] backdrop-blur-[10px] flex items-center justify-between px-4 md:px-8 z-10 shrink-0">
            <div className="flex items-center gap-3">
              <button 
                className="md:hidden p-2 -ml-2 text-ara-text-dim hover:text-ara-accent"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu size={20} />
              </button>
              <BirthForm />
            </div>
          </header>
        )}

        {/* Chat */}
        <div className="flex-1 overflow-hidden">
          <Chat />
        </div>
      </main>

      {/* Birth form overlay (when not set) */}
      {!birthDetails && <BirthForm isOverlay />}
    </div>
  );
}
