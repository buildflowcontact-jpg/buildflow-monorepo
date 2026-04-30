import React, { useState } from 'react';
import { signInWithMagicLink } from './useAuth';

export function AuthForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signInWithMagicLink(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (sent) return (
    <div className="p-4 text-center">
      <div className="mb-2">Un lien a été envoyé à <b>{email}</b>.</div>
      <div className="text-gray-600 text-sm">Clique sur le lien reçu pour te connecter ou créer ton compte si tu n’en as pas encore.</div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 max-w-xs mx-auto bg-white rounded shadow">
      <h2 className="font-bold text-lg">Connexion ou création de compte</h2>
      <p className="text-gray-600 text-sm">Entre ton email pour recevoir un lien magique. Si tu n’as pas encore de compte, il sera créé automatiquement.</p>
      <input
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Votre email"
        className="w-full p-2 border rounded"
      />
      <button type="submit" className="w-full bg-blue-700 text-white py-2 rounded font-bold">Recevoir le lien magique</button>
      {error && <div className="text-red-600 text-sm">{error}</div>}
    </form>
  );
}
