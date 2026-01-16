import React, { useState } from 'react';
import { Globe } from 'lucide-react';

const Settings: React.FC = () => {
  const [language, setLanguage] = useState('en');

  return (
    <div style={{ padding: 'var(--spectrum-spacing-400)', fontFamily: 'adobe-clean, sans-serif' }}>
      <h2 className="spectrum-heading-xl">
        Settings
      </h2>
      <p className="spectrum-body-s" style={{ marginBottom: 'var(--spectrum-spacing-400)' }}>
        Configure your language preferences.
      </p>

      {/* Language Setting */}
      <div style={{
        padding: 'var(--spectrum-spacing-300)',
        backgroundColor: 'var(--spectrum-background-layer-2)',
        borderRadius: 'var(--spectrum-corner-radius-100)',
        border: '1px solid var(--spectrum-border-color)',
      }}>
        <label style={{
          display: 'block',
          fontSize: 'var(--spectrum-body-s-text-size)',
          fontWeight: 600,
          color: 'var(--spectrum-body-color)',
          marginBottom: 'var(--spectrum-spacing-100)'
        }}>
          <Globe size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          Language
        </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="spectrum-input"
          style={{
            width: '100%',
          }}
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
          <option value="ja">日本語</option>
        </select>
      </div>
    </div>
  );
};

export default Settings;
