import { useState } from "react";
import {
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from "firebase/auth";
import { auth } from "../../services/firebase";
import ConfirmModal from "./ConfirmModal";

const TABS = ["Nome", "Email", "Password", "Account"];

export default function ProfileModal({ user, onClose }) {
  const [activeTab, setActiveTab] = useState("Nome");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Nome
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState("");

  // Email
  const [newEmail, setNewEmail] = useState(user.email || "");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Delete
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const reauth = (password) => {
    const credential = EmailAuthProvider.credential(user.email, password);
    return reauthenticateWithCredential(auth.currentUser, credential);
  };

  const handleUpdateName = async () => {
    if (!displayName.trim()) return;
    setNameSaving(true);
    setNameError("");
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim(),
      });
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 2000);
    } catch {
      setNameError("Errore durante il salvataggio.");
    } finally {
      setNameSaving(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim() || !emailPassword) return;
    setEmailSaving(true);
    setEmailError("");
    try {
      await reauth(emailPassword);
      await updateEmail(auth.currentUser, newEmail.trim());
      setEmailSuccess(true);
      setEmailPassword("");
      setTimeout(() => setEmailSuccess(false), 2000);
    } catch (err) {
      setEmailError(getErrorMessage(err.code));
    } finally {
      setEmailSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) return;
    if (newPassword.length < 6) return setPasswordError("Min. 6 caratteri.");
    setPasswordSaving(true);
    setPasswordError("");
    try {
      await reauth(currentPassword);
      await updatePassword(auth.currentUser, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setPasswordSuccess(false), 2000);
    } catch (err) {
      setPasswordError(getErrorMessage(err.code));
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");
    try {
      await reauth(deletePassword);
      await deleteUser(auth.currentUser);
    } catch (err) {
      setDeleteError(getErrorMessage(err.code));
      setConfirmDelete(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-base font-semibold">Profilo</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 px-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm py-3 px-3 border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-indigo-500 text-white font-medium"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {activeTab === "Nome" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateName();
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Nome visualizzato
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  autoFocus
                />
              </div>
              {nameError && <p className="text-xs text-red-400">{nameError}</p>}
              {nameSuccess && (
                <p className="text-xs text-green-400">Nome aggiornato!</p>
              )}
              <button
                type="submit"
                disabled={nameSaving}
                className="self-end bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {nameSaving ? "Salvataggio…" : "Salva"}
              </button>
            </form>
          )}

          {activeTab === "Email" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateEmail();
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Nuova email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  autoComplete="username"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Password attuale
                </label>
                <input
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Conferma identità"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              {emailError && (
                <p className="text-xs text-red-400">{emailError}</p>
              )}
              {emailSuccess && (
                <p className="text-xs text-green-400">Email aggiornata!</p>
              )}
              <button
                type="submit"
                disabled={emailSaving}
                className="self-end bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {emailSaving ? "Salvataggio…" : "Salva"}
              </button>
            </form>
          )}

          {activeTab === "Password" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdatePassword();
              }}
              className="flex flex-col gap-4"
            >
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={user.email}
                readOnly
                className="hidden"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Password attuale
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="new-password"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Nuova password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Min. 6 caratteri"
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              {passwordError && (
                <p className="text-xs text-red-400">{passwordError}</p>
              )}
              {passwordSuccess && (
                <p className="text-xs text-green-400">Password aggiornata!</p>
              )}
              <button
                type="submit"
                disabled={passwordSaving}
                className="self-end bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {passwordSaving ? "Salvataggio…" : "Salva"}
              </button>
            </form>
          )}

          {activeTab === "Account" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setConfirmDelete(true);
              }}
              className="flex flex-col gap-4"
            >
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={user.email}
                readOnly
                className="hidden"
              />
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex flex-col gap-3">
                <div>
                  <p className="text-sm font-medium text-red-400">
                    Elimina account
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Questa azione è irreversibile. Tutte le tue board e task
                    verranno eliminate.
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Conferma con la tua password
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Password attuale"
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                {deleteError && (
                  <p className="text-xs text-red-400">{deleteError}</p>
                )}
                <button
                  type="submit"
                  disabled={!deletePassword}
                  className="self-start bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Elimina account
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Elimina account"
          message="Sei sicura? Tutte le tue board e task verranno eliminate definitivamente."
          confirmLabel="Sì, elimina"
          onConfirm={handleDeleteAccount}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

function getErrorMessage(code) {
  const map = {
    "auth/wrong-password": "Password non corretta.",
    "auth/invalid-credential": "Password non corretta.",
    "auth/email-already-in-use": "Email già in uso.",
    "auth/invalid-email": "Email non valida.",
    "auth/weak-password": "Password troppo debole.",
    "auth/requires-recent-login": "Sessione scaduta. Rieffettua il login.",
  };
  return map[code] ?? "Errore. Riprova.";
}
