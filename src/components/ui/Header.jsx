export default function Header({ user, onLogout, children }) {
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
        <span className="font-semibold tracking-tight">Kanban</span>
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
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
          {(user.displayName || user.email).charAt(0).toUpperCase()}
        </div>
        <button
          onClick={onLogout}
          className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 px-3 py-1.5 rounded-lg transition-colors"
        >
          Esci
        </button>
      </div>
    </header>
  );
}
