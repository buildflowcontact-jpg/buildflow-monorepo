
import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "./button";
import { Spinner } from "./Spinner";

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    if (!email) {
      setError("L'email est requis.");
      setLoading(false);
      return;
    }
    if (!password) {
      setError("Le mot de passe est requis.");
      setLoading(false);
      return;
    }
    if (mode === "login") {
      // Connexion classique email + mot de passe
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else setMessage("Connexion réussie.");
    } else {
      // Création de compte
      if (!password || password.length < 6) {
        setError("Mot de passe requis (min. 6 caractères)");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage("Compte créé ! Vérifiez vos emails pour valider votre inscription.");
    }
    setLoading(false);
  }

  return (
    <div className="bf-auth-card w-full max-w-md mx-auto p-6 md:p-7">
      <h2 className="bf-text-primary text-2xl font-black tracking-tight mb-5 text-center">
        {mode === "login" ? "Connexion" : "Créer un compte"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="bf-text-primary block text-sm font-semibold mb-1.5">Email</label>
          <input
            id="email"
            type="email"
            required
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="bf-input w-full rounded-xl px-3.5 py-2.5 outline-none transition"
          />
        </div>
        <div>
          <label htmlFor="password" className="bf-text-primary block text-sm font-semibold mb-1.5">Mot de passe</label>
          <input
            id="password"
            type="password"
            required
            placeholder={mode === "signup" ? "Mot de passe (min. 6 caractères)" : "Mot de passe"}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="bf-input w-full rounded-xl px-3.5 py-2.5 outline-none transition"
          />
        </div>
        <Button
          type="submit"
          className="bf-primary-button w-full h-11 rounded-xl"
          disabled={loading}
        >
          {loading ? <Spinner size={16} /> : mode === "login" ? "Se connecter" : "Créer un compte"}
        </Button>
      </form>
      <div className="mt-4 text-center">
        {mode === "login" ? (
          <button
            type="button"
            className="bf-link-accent font-semibold"
            onClick={() => {
              setMode("signup");
              setMessage(null);
              setError(null);
            }}
          >
            Créer un compte
          </button>
        ) : (
          <button
            type="button"
            className="bf-link-accent font-semibold"
            onClick={() => {
              setMode("login");
              setMessage(null);
              setError(null);
            }}
          >
            Déjà un compte ? Se connecter
          </button>
        )}
      </div>
      {error && <div className="mt-4 text-center text-sm font-semibold text-red-600">{error}</div>}
      {message && <div className="mt-4 text-center text-sm font-semibold text-emerald-700">{message}</div>}
    </div>
  );
}
