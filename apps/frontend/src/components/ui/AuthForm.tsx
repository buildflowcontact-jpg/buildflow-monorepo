
import React, { useState } from "react";
import { supabase } from "@/utils/supabaseClient";
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
    if (mode === "login") {
      // Connexion avec lien magique
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) setError(error.message);
      else setMessage("Un lien magique a été envoyé à votre email.");
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
    <div className="max-w-sm mx-auto mt-10 p-6 bg-white dark:bg-zinc-900 rounded shadow">
      <h2 className="text-xl font-bold mb-4 text-center">
        {mode === "login" ? "Connexion" : "Créer un compte"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
        {mode === "signup" && (
          <input
            type="password"
            required
            placeholder="Mot de passe (min. 6 caractères)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? <Spinner size={16} /> : mode === "login" ? "Recevoir le lien magique" : "Créer un compte"}
        </Button>
      </form>
      <div className="mt-4 text-center">
        {mode === "login" ? (
          <button className="text-blue-600 hover:underline" onClick={() => setMode("signup")}>Créer un compte</button>
        ) : (
          <button className="text-blue-600 hover:underline" onClick={() => setMode("login")}>Déjà un compte ? Se connecter</button>
        )}
      </div>
      {error && <div className="mt-4 text-center text-sm text-red-600 dark:text-red-400">{error}</div>}
      {message && <div className="mt-4 text-center text-sm text-green-700 dark:text-green-400">{message}</div>}
    </div>
  );
}
