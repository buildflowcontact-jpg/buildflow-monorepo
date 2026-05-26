import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { signOut, useAuth } from '@/modules/chantier/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useProjectStore } from '@/store/projectStore';
import { CURRENCY_OPTIONS, SupportedCurrency, normalizeCurrency } from '@/utils/currency';
import {
  normalizeTemperatureUnit,
  TEMPERATURE_UNIT_OPTIONS,
  TemperatureUnit,
} from '@/utils/temperature';
import { UITheme, uiThemeLabels, useUIStore } from '../../../store/uiStore';

const THEMES: Array<{ id: UITheme; description: string }> = [
  {
    id: 'industrial',
    description: 'Contraste eleve pour usage chantier et forte luminosite.',
  },
  {
    id: 'cockpit',
    description: 'Cockpit moderne et dense pour pilotage bureau.',
  },
  {
    id: 'streamline',
    description: 'Mode epure et mobile-first pour actions rapides.',
  },
];

const EXTRA_SETTINGS = [
  'Notifications e-mail et push par module',
  'Photo de profil et avatar equipe',
  'Langue, fuseau horaire et format de date',
  'Historique des sessions actives et appareils connectes',
  'Double authentification et securite du compte',
  'Signature automatique pour rapports et validations',
];

const LANGUAGE_OPTIONS = [
  { value: 'fr', label: 'Francais' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Espanol' },
];

const DATE_FORMAT_OPTIONS = [
  { value: 'dd/mm/yyyy', label: 'JJ/MM/AAAA' },
  { value: 'yyyy-mm-dd', label: 'AAAA-MM-JJ' },
  { value: 'mm/dd/yyyy', label: 'MM/JJ/AAAA' },
];

type AccountTab = 'profile' | 'security' | 'appearance' | 'preferences' | 'project';

const ACCOUNT_TABS: Array<{ id: AccountTab; label: string }> = [
  { id: 'profile', label: 'Profil' },
  { id: 'security', label: 'Securite' },
  { id: 'appearance', label: 'Apparence' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'project', label: 'Projet' },
];

function getInitials(firstName: string, lastName: string, fallback: string) {
  const composed = `${firstName} ${lastName}`.trim();
  const source = composed || fallback;
  return source
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function AccountSettings() {
  const { user } = useAuth();
  const { data: projects = [] } = useProjects();
  const currentProjectId = useProjectStore((state) => state.currentProjectId);
  const uiTheme = useUIStore((state) => state.uiTheme);
  const setUITheme = useUIStore((state) => state.setUITheme);
  const isThemeSyncing = useUIStore((state) => state.isThemeSyncing);
  const themeSyncError = useUIStore((state) => state.themeSyncError);
  const retryThemeSync = useUIStore((state) => state.retryThemeSync);
  const userMetadata = useMemo(() => (user?.user_metadata ?? {}) as Record<string, unknown>, [user?.user_metadata]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileTitle, setProfileTitle] = useState('');
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [signature, setSignature] = useState('');
  const [language, setLanguage] = useState('fr');
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris');
  const [dateFormat, setDateFormat] = useState('dd/mm/yyyy');
  const [defaultCurrency, setDefaultCurrency] = useState<SupportedCurrency>('EUR');
  const [projectCurrencyOverrides, setProjectCurrencyOverrides] = useState<Record<string, SupportedCurrency>>({});
  const [selectedProjectForCurrency, setSelectedProjectForCurrency] = useState<string>('');
  const [projectCurrency, setProjectCurrency] = useState<SupportedCurrency>('EUR');
  const [defaultTemperatureUnit, setDefaultTemperatureUnit] = useState<TemperatureUnit>('C');
  const [projectTemperatureUnitOverrides, setProjectTemperatureUnitOverrides] = useState<Record<string, TemperatureUnit>>({});
  const [projectTemperatureUnit, setProjectTemperatureUnit] = useState<TemperatureUnit>('C');
  const [notifyIncidentEmail, setNotifyIncidentEmail] = useState(true);
  const [notifyIncidentPush, setNotifyIncidentPush] = useState(true);
  const [notifyPlanningEmail, setNotifyPlanningEmail] = useState(false);
  const [notifyPlanningPush, setNotifyPlanningPush] = useState(true);
  const [notifyApproEmail, setNotifyApproEmail] = useState(true);
  const [notifyApproPush, setNotifyApproPush] = useState(false);
  const [preferenceMessage, setPreferenceMessage] = useState<string | null>(null);
  const [preferenceError, setPreferenceError] = useState<string | null>(null);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [projectCurrencyMessage, setProjectCurrencyMessage] = useState<string | null>(null);
  const [projectCurrencyError, setProjectCurrencyError] = useState<string | null>(null);
  const [isSavingProjectCurrency, setIsSavingProjectCurrency] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<AccountTab>('profile');
  const currentSessionLabel = useMemo(() => {
    const parts = [navigator.platform, navigator.language].filter(Boolean);
    return parts.join(' · ');
  }, []);
  const currentInitials = useMemo(
    () => getInitials(firstName, lastName, user?.email?.slice(0, 2) ?? 'BU'),
    [firstName, lastName, user?.email]
  );

  useEffect(() => {
    setFirstName(typeof userMetadata.first_name === 'string' ? userMetadata.first_name : '');
    setLastName(typeof userMetadata.last_name === 'string' ? userMetadata.last_name : '');
    setProfileTitle(typeof userMetadata.profile_title === 'string' ? userMetadata.profile_title : '');
    setAvatarUrl(typeof userMetadata.avatar_url === 'string' ? userMetadata.avatar_url : '');
    setAvatarFile(null);
    setAvatarPreviewUrl(null);
    setSignature(typeof userMetadata.signature === 'string' ? userMetadata.signature : '');
    setLanguage(typeof userMetadata.language === 'string' ? userMetadata.language : 'fr');
    setTimezone(typeof userMetadata.timezone === 'string' ? userMetadata.timezone : (Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris'));
    setDateFormat(typeof userMetadata.date_format === 'string' ? userMetadata.date_format : 'dd/mm/yyyy');
    const accountCurrency = normalizeCurrency(userMetadata.default_currency, 'EUR');
    setDefaultCurrency(accountCurrency);
    const overridesRaw = userMetadata.project_currency_overrides;
    const normalizedOverrides: Record<string, SupportedCurrency> = {};
    if (overridesRaw && typeof overridesRaw === 'object' && !Array.isArray(overridesRaw)) {
      for (const [projectId, currency] of Object.entries(overridesRaw as Record<string, unknown>)) {
        normalizedOverrides[projectId] = normalizeCurrency(currency, accountCurrency);
      }
    }
    setProjectCurrencyOverrides(normalizedOverrides);
    const accountTemperatureUnit = normalizeTemperatureUnit(userMetadata.default_temperature_unit, 'C');
    setDefaultTemperatureUnit(accountTemperatureUnit);
    const temperatureOverridesRaw = userMetadata.project_temperature_unit_overrides;
    const normalizedTemperatureOverrides: Record<string, TemperatureUnit> = {};
    if (temperatureOverridesRaw && typeof temperatureOverridesRaw === 'object' && !Array.isArray(temperatureOverridesRaw)) {
      for (const [projectId, unit] of Object.entries(temperatureOverridesRaw as Record<string, unknown>)) {
        normalizedTemperatureOverrides[projectId] = normalizeTemperatureUnit(unit, accountTemperatureUnit);
      }
    }
    setProjectTemperatureUnitOverrides(normalizedTemperatureOverrides);
    setNotifyIncidentEmail(Boolean(userMetadata.notify_incident_email ?? true));
    setNotifyIncidentPush(Boolean(userMetadata.notify_incident_push ?? true));
    setNotifyPlanningEmail(Boolean(userMetadata.notify_planning_email ?? false));
    setNotifyPlanningPush(Boolean(userMetadata.notify_planning_push ?? true));
    setNotifyApproEmail(Boolean(userMetadata.notify_appro_email ?? true));
    setNotifyApproPush(Boolean(userMetadata.notify_appro_push ?? false));
  }, [userMetadata]);

  useEffect(() => {
    const fallbackProject = currentProjectId ?? projects[0]?.id ?? '';
    if (!fallbackProject) {
      setSelectedProjectForCurrency('');
      setProjectCurrency(defaultCurrency);
      return;
    }

    setSelectedProjectForCurrency((prev) => prev || fallbackProject);
  }, [currentProjectId, projects, defaultCurrency]);

  useEffect(() => {
    if (!selectedProjectForCurrency) {
      setProjectCurrency(defaultCurrency);
      setProjectTemperatureUnit(defaultTemperatureUnit);
      return;
    }

    setProjectCurrency(projectCurrencyOverrides[selectedProjectForCurrency] ?? defaultCurrency);
    setProjectTemperatureUnit(projectTemperatureUnitOverrides[selectedProjectForCurrency] ?? defaultTemperatureUnit);
  }, [
    selectedProjectForCurrency,
    projectCurrencyOverrides,
    defaultCurrency,
    projectTemperatureUnitOverrides,
    defaultTemperatureUnit,
  ]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const previewClassName = (theme: UITheme) => {
    if (theme === 'industrial') return 'bf-preview-card bf-preview-industrial';
    if (theme === 'streamline') return 'bf-preview-card bf-preview-streamline';
    return 'bf-preview-card bf-preview-cockpit';
  };

  const handleProfileSave = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    setProfileMessage(null);
    setProfileError(null);

    let nextAvatarUrl = avatarUrl.trim();

    if (avatarFile) {
      const safeName = avatarFile.name.replace(/\s+/g, '_');
      const filePath = `profiles/${user.id}/avatar-${Date.now()}-${safeName}`;
      const { data, error: uploadError } = await supabase.storage
        .from('project-media')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        setProfileError('Impossible de televerser votre photo de profil pour le moment.');
        setIsSavingProfile(false);
        return;
      }

      nextAvatarUrl = supabase.storage.from('project-media').getPublicUrl(data.path).data.publicUrl;
    }

    const { error } = await supabase.auth.updateUser({
      data: {
        ...userMetadata,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        profile_title: profileTitle.trim(),
        avatar_url: nextAvatarUrl,
      },
    });

    if (error) {
      setProfileError('Impossible de mettre a jour votre profil pour le moment.');
    } else {
      setAvatarUrl(nextAvatarUrl);
      setAvatarFile(null);
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
      setAvatarPreviewUrl(null);
      setProfileMessage('Profil mis a jour.');
    }

    setIsSavingProfile(false);
  };

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }

    if (!file) {
      setAvatarFile(null);
      setAvatarPreviewUrl(null);
      return;
    }

    setAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
    setProfileMessage(null);
    setProfileError(null);
  };

  const displayedAvatarUrl = avatarPreviewUrl ?? avatarUrl;

  const handlePreferenceSave = async () => {
    if (!user) return;
    setIsSavingPreferences(true);
    setPreferenceMessage(null);
    setPreferenceError(null);

    const { error } = await supabase.auth.updateUser({
      data: {
        ...userMetadata,
        signature: signature.trim(),
        language,
        timezone,
        date_format: dateFormat,
        default_currency: defaultCurrency,
        project_currency_overrides: projectCurrencyOverrides,
        default_temperature_unit: defaultTemperatureUnit,
        project_temperature_unit_overrides: projectTemperatureUnitOverrides,
        notify_incident_email: notifyIncidentEmail,
        notify_incident_push: notifyIncidentPush,
        notify_planning_email: notifyPlanningEmail,
        notify_planning_push: notifyPlanningPush,
        notify_appro_email: notifyApproEmail,
        notify_appro_push: notifyApproPush,
      },
    });

    if (error) {
      setPreferenceError('Impossible de sauvegarder vos preferences pour le moment.');
    } else {
      setPreferenceMessage('Preferences enregistrees.');
    }

    setIsSavingPreferences(false);
  };

  const handleProjectCurrencySave = async () => {
    if (!user || !selectedProjectForCurrency) return;
    setIsSavingProjectCurrency(true);
    setProjectCurrencyMessage(null);
    setProjectCurrencyError(null);

    const nextOverrides: Record<string, SupportedCurrency> = {
      ...projectCurrencyOverrides,
      [selectedProjectForCurrency]: projectCurrency,
    };
    const nextTemperatureOverrides: Record<string, TemperatureUnit> = {
      ...projectTemperatureUnitOverrides,
      [selectedProjectForCurrency]: projectTemperatureUnit,
    };

    const { error } = await supabase.auth.updateUser({
      data: {
        ...userMetadata,
        default_currency: defaultCurrency,
        project_currency_overrides: nextOverrides,
        default_temperature_unit: defaultTemperatureUnit,
        project_temperature_unit_overrides: nextTemperatureOverrides,
      },
    });

    if (error) {
      setProjectCurrencyError('Impossible de sauvegarder la devise du projet pour le moment.');
    } else {
      setProjectCurrencyOverrides(nextOverrides);
      setProjectTemperatureUnitOverrides(nextTemperatureOverrides);
      setProjectCurrencyMessage('Devise du projet enregistree.');
    }

    setIsSavingProjectCurrency(false);
  };

  const handlePasswordSave = async () => {
    setPasswordMessage(null);
    setPasswordError(null);

    if (!newPassword || newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('La confirmation du mot de passe ne correspond pas.');
      return;
    }

    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordError('Impossible de modifier le mot de passe pour le moment.');
    } else {
      setPasswordMessage('Mot de passe mis a jour.');
      setNewPassword('');
      setConfirmPassword('');
    }

    setIsUpdatingPassword(false);
  };

  return (
    <section className="space-y-5">
      <div className="surface-panel p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight bf-text-primary">Compte utilisateur</h2>
            <p className="mt-1 text-sm bf-text-muted">
              Gerez vos informations personnelles, votre securite et l apparence de votre interface.
            </p>
            <p className="mt-2 text-xs bf-text-muted">
              {isThemeSyncing ? 'Synchronisation du style avec votre compte...' : 'Vos preferences sont memorisees localement et synchronisees avec votre compte.'}
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="bf-button-secondary rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            Deconnexion
          </button>
        </div>
        {themeSyncError ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <span>{themeSyncError}</span>
            <button
              type="button"
              onClick={retryThemeSync}
              disabled={isThemeSyncing}
              className="rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white disabled:opacity-60"
            >
              Reessayer
            </button>
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="surface-panel p-5 md:p-6 space-y-4">
          <div>
            <h3 className="text-lg font-black bf-text-primary">Profil</h3>
            <p className="text-sm bf-text-muted mt-1">Mettez a jour votre identite utilisateur et la fonction affichee dans l application.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-semibold bf-text-primary">
              Prenom
              <input className="bf-input w-full" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold bf-text-primary">
              Nom
              <input className="bf-input w-full" value={lastName} onChange={(event) => setLastName(event.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold bf-text-primary md:col-span-2">
              Profil / fonction
              <input className="bf-input w-full" value={profileTitle} onChange={(event) => setProfileTitle(event.target.value)} placeholder="Ex: Conducteur de travaux" />
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold bf-text-primary md:col-span-2">
              Photo de profil
              <input type="file" accept="image/*" className="bf-input w-full file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-bold file:text-white" onChange={handleAvatarFileChange} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold bf-text-primary md:col-span-2">
              E-mail
              <input className="bf-input w-full opacity-80" value={user?.email ?? ''} disabled readOnly />
            </label>
          </div>
          <p className="text-xs bf-text-muted">
            Selectionnez directement une image depuis votre appareil. La photo sera envoyee a votre espace de stockage lors de l enregistrement du profil.
          </p>
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            {displayedAvatarUrl ? (
              <img src={displayedAvatarUrl} alt="Avatar utilisateur" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-sm font-black text-white">{currentInitials}</div>
            )}
            <div>
              <p className="text-sm font-black bf-text-primary">{`${firstName} ${lastName}`.trim() || user?.email || 'Utilisateur'}</p>
              <p className="text-sm bf-text-muted">{profileTitle || 'Fonction non renseignee'}</p>
              <p className="text-xs text-slate-500">{avatarFile ? `Nouveau fichier pret: ${avatarFile.name}` : 'Aucune nouvelle photo selectionnee.'}</p>
            </div>
          </div>
          {profileMessage ? <p className="text-sm text-emerald-700">{profileMessage}</p> : null}
          {profileError ? <p className="text-sm text-red-600">{profileError}</p> : null}
          <div className="flex justify-end">
            <button type="button" onClick={handleProfileSave} disabled={isSavingProfile} className="bf-primary-button rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-60">
              {isSavingProfile ? 'Enregistrement...' : 'Enregistrer le profil'}
            </button>
          </div>
        </div>

        <div className="surface-panel p-5 md:p-6 space-y-4">
          <div>
            <h3 className="text-lg font-black bf-text-primary">Securite</h3>
            <p className="text-sm bf-text-muted mt-1">Changez votre mot de passe pour securiser votre compte.</p>
          </div>
          <label className="flex flex-col gap-1 text-sm font-semibold bf-text-primary">
            Nouveau mot de passe
            <input type="password" className="bf-input w-full" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold bf-text-primary">
            Confirmer le mot de passe
            <input type="password" className="bf-input w-full" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" />
          </label>
          {passwordMessage ? <p className="text-sm text-emerald-700">{passwordMessage}</p> : null}
          {passwordError ? <p className="text-sm text-red-600">{passwordError}</p> : null}
          <div className="flex justify-end">
            <button type="button" onClick={handlePasswordSave} disabled={isUpdatingPassword} className="bf-primary-button rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-60">
              {isUpdatingPassword ? 'Mise a jour...' : 'Mettre a jour le mot de passe'}
            </button>
          </div>
        </div>
      </div>

      <div className="surface-panel p-5 md:p-6">
        <h3 className="text-lg font-black bf-text-primary">Preference d apparence</h3>
        <p className="mt-1 text-sm bf-text-muted">Choisissez votre style d interface selon votre contexte d usage.</p>
      </div>

      <div className="bf-tabs-shell">
        <div className="bf-tabs-bar flex flex-wrap">
          {ACCOUNT_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`bf-tab min-w-[140px] flex-1 px-4 py-3 font-medium text-center border-b-2 transition-colors ${
                activeTab === tab.id ? 'bf-tab-active' : 'bf-tab-inactive'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5 md:p-6">
          {activeTab === 'profile' ? (
            <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="surface-panel p-5 md:p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-black bf-text-primary">Profil</h3>
                  <p className="text-sm bf-text-muted mt-1">Mettez a jour votre identite utilisateur et la fonction affichee dans l application.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm font-semibold bf-text-primary">
                    Prenom
                    <input className="bf-input w-full" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-semibold bf-text-primary">
                    Nom
                    <input className="bf-input w-full" value={lastName} onChange={(event) => setLastName(event.target.value)} />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-semibold bf-text-primary md:col-span-2">
                    Profil / fonction
                    <input className="bf-input w-full" value={profileTitle} onChange={(event) => setProfileTitle(event.target.value)} placeholder="Ex: Conducteur de travaux" />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-semibold bf-text-primary md:col-span-2">
                    Photo de profil
                    <input type="file" accept="image/*" className="bf-input w-full file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-bold file:text-white" onChange={handleAvatarFileChange} />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-semibold bf-text-primary md:col-span-2">
                    E-mail
                    <input className="bf-input w-full opacity-80" value={user?.email ?? ''} disabled readOnly />
                  </label>
                </div>
                <p className="text-xs bf-text-muted">
                  Selectionnez directement une image depuis votre appareil. La photo sera envoyee a votre espace de stockage lors de l enregistrement du profil.
                </p>
                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  {displayedAvatarUrl ? (
                    <img src={displayedAvatarUrl} alt="Avatar utilisateur" className="h-14 w-14 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-sm font-black text-white">{currentInitials}</div>
                  )}
                  <div>
                    <p className="text-sm font-black bf-text-primary">{`${firstName} ${lastName}`.trim() || user?.email || 'Utilisateur'}</p>
                    <p className="text-sm bf-text-muted">{profileTitle || 'Fonction non renseignee'}</p>
                    <p className="text-xs text-slate-500">{avatarFile ? `Nouveau fichier pret: ${avatarFile.name}` : 'Aucune nouvelle photo selectionnee.'}</p>
                  </div>
                </div>
                {profileMessage ? <p className="text-sm text-emerald-700">{profileMessage}</p> : null}
                {profileError ? <p className="text-sm text-red-600">{profileError}</p> : null}
                <div className="flex justify-end">
                  <button type="button" onClick={handleProfileSave} disabled={isSavingProfile} className="bf-primary-button rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-60">
                    {isSavingProfile ? 'Enregistrement...' : 'Enregistrer le profil'}
                  </button>
                </div>
              </div>

              <div className="surface-panel p-5 md:p-6">
                <h3 className="text-lg font-black bf-text-primary">Resume du compte</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide bf-text-muted">Nom affiche</p>
                    <p className="mt-1 font-bold bf-text-primary">{`${firstName} ${lastName}`.trim() || 'Non renseigne'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide bf-text-muted">Fonction</p>
                    <p className="mt-1 font-bold bf-text-primary">{profileTitle || 'Non renseignee'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide bf-text-muted">Adresse e-mail</p>
                    <p className="mt-1 font-bold bf-text-primary">{user?.email ?? 'Non disponible'}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'security' ? (
            <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
              <div className="surface-panel p-5 md:p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-black bf-text-primary">Securite</h3>
                  <p className="text-sm bf-text-muted mt-1">Changez votre mot de passe pour securiser votre compte.</p>
                </div>
                <label className="flex flex-col gap-1 text-sm font-semibold bf-text-primary">
                  Nouveau mot de passe
                  <input type="password" className="bf-input w-full" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" />
                </label>
                <label className="flex flex-col gap-1 text-sm font-semibold bf-text-primary">
                  Confirmer le mot de passe
                  <input type="password" className="bf-input w-full" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" />
                </label>
                {passwordMessage ? <p className="text-sm text-emerald-700">{passwordMessage}</p> : null}
                {passwordError ? <p className="text-sm text-red-600">{passwordError}</p> : null}
                <div className="flex justify-between gap-3">
                  <button
                    type="button"
                    onClick={signOut}
                    className="bf-button-secondary rounded-xl px-4 py-2.5 text-sm font-semibold"
                  >
                    Deconnexion
                  </button>
                  <button type="button" onClick={handlePasswordSave} disabled={isUpdatingPassword} className="bf-primary-button rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-60">
                    {isUpdatingPassword ? 'Mise a jour...' : 'Mettre a jour le mot de passe'}
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                <div className="surface-panel p-5 md:p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-black bf-text-primary">Session et appareils</h3>
                    <p className="mt-1 text-sm bf-text-muted">Vue rapide de votre session courante.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                    <p className="text-sm font-black bf-text-primary">Session active</p>
                    <p className="text-sm bf-text-muted">{currentSessionLabel}</p>
                    <p className="text-sm bf-text-muted">Derniere connexion: {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('fr-FR') : 'Non disponible'}</p>
                    <p className="text-xs text-slate-500">La liste complete des autres appareils n est pas exposee par le client frontend actuel.</p>
                  </div>
                </div>

                <div className="surface-panel p-5 md:p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-black bf-text-primary">Double authentification</h3>
                    <p className="mt-1 text-sm bf-text-muted">Renforcez la securite du compte avec un second facteur.</p>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-black text-amber-800">Bientot disponible</p>
                    <p className="mt-1 text-sm text-amber-700">Le support 2FA n est pas encore branche dans cette interface. Je peux l ajouter des que la configuration MFA Supabase est activee sur le projet.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'appearance' ? (
            <div className="space-y-5">
              <div className="surface-panel p-5 md:p-6">
                <h3 className="text-lg font-black bf-text-primary">Preference d apparence</h3>
                <p className="mt-1 text-sm bf-text-muted">Choisissez votre style d interface selon votre contexte d usage.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {THEMES.map((theme) => {
                  const selected = uiTheme === theme.id;

                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setUITheme(theme.id)}
                      className={`surface-panel p-4 text-left transition-all ${selected ? 'ring-2 ring-cyan-500' : 'hover:-translate-y-0.5'}`}
                      aria-pressed={selected}
                      disabled={isThemeSyncing}
                    >
                      <p className="text-sm font-black uppercase tracking-wide bf-text-primary">
                        {uiThemeLabels[theme.id]}
                      </p>
                      <p className="mt-2 text-sm bf-text-muted">{theme.description}</p>

                      <div className={`mt-4 p-3 ${previewClassName(theme.id)}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-600">Apercu</span>
                          <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${theme.id === 'industrial' ? 'bg-slate-900 text-amber-300' : theme.id === 'cockpit' ? 'bg-cyan-700 text-white' : 'bg-blue-600 text-white'}`}>Etat</span>
                        </div>
                        <div className={`mt-3 rounded-lg p-2 text-xs ${theme.id === 'industrial' ? 'border-2 border-slate-900 bg-white text-slate-900' : theme.id === 'cockpit' ? 'border border-cyan-100 bg-white/80 text-slate-700' : 'border border-slate-200 bg-slate-50 text-slate-600'}`}>
                          Carte document / action / statut
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <span className={`h-3 w-3 rounded-full ${theme.id === 'industrial' ? 'bg-amber-400' : theme.id === 'cockpit' ? 'bg-cyan-500' : 'bg-blue-500'}`} />
                          <div className={`h-8 flex-1 rounded-lg ${theme.id === 'industrial' ? 'border-2 border-slate-900 bg-slate-50' : theme.id === 'cockpit' ? 'border border-white/60 bg-white/70' : 'bg-white border border-slate-200'}`} />
                          <div className={`h-8 w-16 rounded-lg ${theme.id === 'industrial' ? 'bg-slate-900' : theme.id === 'cockpit' ? 'bg-cyan-700' : 'bg-blue-600'}`} />
                        </div>
                      </div>

                      {selected ? (
                        <p className="mt-3 text-xs font-bold text-emerald-700">Style actif</p>
                      ) : (
                        <p className="mt-3 text-xs font-semibold text-slate-500">Cliquer pour activer</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {activeTab === 'preferences' ? (
            <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="surface-panel p-5 md:p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-black bf-text-primary">Notifications et preferences regionales</h3>
                  <p className="mt-1 text-sm bf-text-muted">Choisissez comment vous souhaitez etre prevenu et comment les donnees sont affichees.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm font-semibold bf-text-primary">
                    Langue
                    <select className="bf-select w-full rounded-xl px-3 py-2" value={language} onChange={(event) => setLanguage(event.target.value)}>
                      {LANGUAGE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-semibold bf-text-primary">
                    Fuseau horaire
                    <input className="bf-input w-full" value={timezone} onChange={(event) => setTimezone(event.target.value)} placeholder="Europe/Paris" />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-semibold bf-text-primary md:col-span-2">
                    Format de date
                    <select className="bf-select w-full rounded-xl px-3 py-2" value={dateFormat} onChange={(event) => setDateFormat(event.target.value)}>
                      {DATE_FORMAT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-semibold bf-text-primary md:col-span-2">
                    Devise par defaut (compte)
                    <select className="bf-select w-full rounded-xl px-3 py-2" value={defaultCurrency} onChange={(event) => setDefaultCurrency(normalizeCurrency(event.target.value, 'EUR'))}>
                      {CURRENCY_OPTIONS.map((option) => (
                        <option key={option.code} value={option.code}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-semibold bf-text-primary md:col-span-2">
                    Unite de temperature par defaut (compte)
                    <select className="bf-select w-full rounded-xl px-3 py-2" value={defaultTemperatureUnit} onChange={(event) => setDefaultTemperatureUnit(normalizeTemperatureUnit(event.target.value, 'C'))}>
                      {TEMPERATURE_UNIT_OPTIONS.map((option) => (
                        <option key={option.code} value={option.code}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-semibold bf-text-primary md:col-span-2">
                    Signature automatique
                    <textarea className="bf-textarea w-full rounded-xl px-3 py-2" rows={4} value={signature} onChange={(event) => setSignature(event.target.value)} placeholder="Ex: Valide par Jean Dupont, conducteur de travaux" />
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-black bf-text-primary mb-3">Incidents</p>
                    <label className="flex items-center justify-between gap-3 text-sm bf-text-muted">
                      E-mail
                      <input type="checkbox" checked={notifyIncidentEmail} onChange={(event) => setNotifyIncidentEmail(event.target.checked)} />
                    </label>
                    <label className="mt-2 flex items-center justify-between gap-3 text-sm bf-text-muted">
                      Push
                      <input type="checkbox" checked={notifyIncidentPush} onChange={(event) => setNotifyIncidentPush(event.target.checked)} />
                    </label>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-black bf-text-primary mb-3">Planning</p>
                    <label className="flex items-center justify-between gap-3 text-sm bf-text-muted">
                      E-mail
                      <input type="checkbox" checked={notifyPlanningEmail} onChange={(event) => setNotifyPlanningEmail(event.target.checked)} />
                    </label>
                    <label className="mt-2 flex items-center justify-between gap-3 text-sm bf-text-muted">
                      Push
                      <input type="checkbox" checked={notifyPlanningPush} onChange={(event) => setNotifyPlanningPush(event.target.checked)} />
                    </label>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-black bf-text-primary mb-3">Approvisionnement</p>
                    <label className="flex items-center justify-between gap-3 text-sm bf-text-muted">
                      E-mail
                      <input type="checkbox" checked={notifyApproEmail} onChange={(event) => setNotifyApproEmail(event.target.checked)} />
                    </label>
                    <label className="mt-2 flex items-center justify-between gap-3 text-sm bf-text-muted">
                      Push
                      <input type="checkbox" checked={notifyApproPush} onChange={(event) => setNotifyApproPush(event.target.checked)} />
                    </label>
                  </div>
                </div>

                {preferenceMessage ? <p className="text-sm text-emerald-700">{preferenceMessage}</p> : null}
                {preferenceError ? <p className="text-sm text-red-600">{preferenceError}</p> : null}

                <div className="flex justify-end">
                  <button type="button" onClick={handlePreferenceSave} disabled={isSavingPreferences} className="bf-primary-button rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-60">
                    {isSavingPreferences ? 'Enregistrement...' : 'Enregistrer les preferences'}
                  </button>
                </div>
              </div>

              <div className="surface-panel p-5 md:p-6">
                <h3 className="text-lg font-black bf-text-primary">Autres elements utiles</h3>
                <p className="mt-1 text-sm bf-text-muted">Pistes complementaires pour enrichir l espace compte.</p>
                <div className="mt-4 grid gap-3">
                  {EXTRA_SETTINGS.map((item) => (
                    <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'project' ? (
            <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="surface-panel p-5 md:p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-black bf-text-primary">Parametres du projet</h3>
                  <p className="mt-1 text-sm bf-text-muted">La devise et l unite de temperature du projet surchargent les valeurs par defaut de votre compte.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm font-semibold bf-text-primary md:col-span-2">
                    Projet cible
                    <select
                      className="bf-select w-full rounded-xl px-3 py-2"
                      value={selectedProjectForCurrency}
                      onChange={(event) => setSelectedProjectForCurrency(event.target.value)}
                    >
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>{project.name}{project.code ? ` (${project.code})` : ''}</option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-sm font-semibold bf-text-primary md:col-span-2">
                    Devise du projet
                    <select className="bf-select w-full rounded-xl px-3 py-2" value={projectCurrency} onChange={(event) => setProjectCurrency(normalizeCurrency(event.target.value, defaultCurrency))}>
                      {CURRENCY_OPTIONS.map((option) => (
                        <option key={option.code} value={option.code}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-semibold bf-text-primary md:col-span-2">
                    Unite de temperature du projet
                    <select className="bf-select w-full rounded-xl px-3 py-2" value={projectTemperatureUnit} onChange={(event) => setProjectTemperatureUnit(normalizeTemperatureUnit(event.target.value, defaultTemperatureUnit))}>
                      {TEMPERATURE_UNIT_OPTIONS.map((option) => (
                        <option key={option.code} value={option.code}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {projectCurrencyMessage ? <p className="text-sm text-emerald-700">{projectCurrencyMessage}</p> : null}
                {projectCurrencyError ? <p className="text-sm text-red-600">{projectCurrencyError}</p> : null}

                <div className="flex justify-end">
                  <button type="button" onClick={handleProjectCurrencySave} disabled={isSavingProjectCurrency || !selectedProjectForCurrency} className="bf-primary-button rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-60">
                    {isSavingProjectCurrency ? 'Enregistrement...' : 'Enregistrer la devise projet'}
                  </button>
                </div>
              </div>

              <div className="surface-panel p-5 md:p-6">
                <h3 className="text-lg font-black bf-text-primary">Resume devises et temperature</h3>
                <p className="mt-1 text-sm bf-text-muted">Devise par defaut du compte: {defaultCurrency}</p>
                <p className="mt-1 text-sm bf-text-muted">Unite de temperature par defaut: °{defaultTemperatureUnit}</p>
                <div className="mt-4 space-y-3">
                  {Object.entries(projectCurrencyOverrides).length === 0 ? (
                    <p className="text-sm bf-text-muted">Aucune surcharge projet pour le moment.</p>
                  ) : (
                    Object.entries(projectCurrencyOverrides).map(([projectId, currency]) => {
                      const projectLabel = projects.find((project) => project.id === projectId)?.name ?? projectId;
                      const unit = projectTemperatureUnitOverrides[projectId] ?? defaultTemperatureUnit;
                      return (
                        <div key={projectId} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                          <p className="font-bold bf-text-primary">{projectLabel}</p>
                          <p className="bf-text-muted">{currency} · °{unit}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
