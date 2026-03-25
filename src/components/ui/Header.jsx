import { useState, useRef, useEffect } from "react";
import ProfileModal from "../ui/ProfileModal";

export default function Header({ user, onLogout, children }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="border-b border-gray-800 px-6 h-16 flex items-center justify-between gap-6">
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
        </div>
        <span className="font-semibold tracking-tight hidden sm:block">Kanban</span>
      </div>

      {/* Slot centrale — search, back button, ecc. */}
      <div className="flex-1">{children}</div>

      {/* User */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right hidden sm:block">
          <p className="text-xs text-gray-400">Bentornata,</p>
          <p className="text-sm font-medium">
            {user.displayName || user.email}
          </p>
        </div>

        {/* Avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-semibold hover:bg-indigo-500 transition-colors"
          >
            {(user.displayName || user.email).charAt(0).toUpperCase()}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-10 w-44 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
              <button
                onClick={() => {
                  setShowProfile(true);
                  setDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                Profilo
              </button>
              <div className="border-t border-gray-800" />
              <button
                onClick={onLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-gray-800 transition-colors"
              >
                Esci
              </button>
            </div>
          )}
        </div>
      </div>

      {showProfile && (
        <ProfileModal user={user} onClose={() => setShowProfile(false)} />
      )}
    </header>
  );
}
