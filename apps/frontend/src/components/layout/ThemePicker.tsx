import React from 'react';
import { uiThemeLabels, UITheme, useUIStore } from '../../store/uiStore';

const THEME_OPTIONS: UITheme[] = ['industrial', 'cockpit', 'streamline'];

export function ThemePicker() {
  const uiTheme = useUIStore((state) => state.uiTheme);
  const setUITheme = useUIStore((state) => state.setUITheme);
  const isThemeSyncing = useUIStore((state) => state.isThemeSyncing);

  return (
    <label className="bf-theme-picker">
      <span className="bf-theme-picker-label">Style UI</span>
      <select
        value={uiTheme}
        onChange={(event) => setUITheme(event.target.value as UITheme)}
        className="bf-theme-select"
        aria-label="Choisir un style d interface"
        disabled={isThemeSyncing}
      >
        {THEME_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {uiThemeLabels[option]}
          </option>
        ))}
      </select>
      {isThemeSyncing ? <span className="bf-theme-picker-label">Sync...</span> : null}
    </label>
  );
}
