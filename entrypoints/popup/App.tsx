import { useEffect, useState } from 'react';
import { Switch } from '@base-ui-components/react/switch';
import { settings, FEATURES, type SettingKey } from '@/utils/settings';

// Bind a storage-backed boolean to React state, synced to live changes.
function useSetting(key: SettingKey): [boolean, (next: boolean) => void] {
  const [value, setValue] = useState(true);

  useEffect(() => {
    let active = true;
    settings[key].getValue().then((v) => {
      if (active) setValue(v);
    });
    const unwatch = settings[key].watch((v) => setValue(v));
    return () => {
      active = false;
      unwatch();
    };
  }, [key]);

  const set = (next: boolean) => {
    setValue(next);
    void settings[key].setValue(next);
  };

  return [value, set];
}

function Row({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="row" data-disabled={disabled ? '' : undefined}>
      <span className="row-text">
        <span className="row-label">{label}</span>
        <span className="row-desc">{description}</span>
      </span>
      <Switch.Root
        className="switch"
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
      >
        <Switch.Thumb className="switch-thumb" />
      </Switch.Root>
    </label>
  );
}

export function App() {
  const [enabled, setEnabled] = useSetting('enabled');

  return (
    <div className="app">
      <header className="header">
        <h1>Clean TweetX</h1>
        <Switch.Root
          className="switch switch-master"
          checked={enabled}
          onCheckedChange={setEnabled}
          aria-label="Enable Clean TweetX"
        >
          <Switch.Thumb className="switch-thumb" />
        </Switch.Root>
      </header>

      <div className="rows" data-off={!enabled ? '' : undefined}>
        {FEATURES.map((f) => (
          <FeatureRow key={f.key} featureKey={f.key} label={f.label} description={f.description} masterOff={!enabled} />
        ))}
      </div>

      <footer className="footer">
        {enabled ? 'Hiding distractions on x.com' : 'Disabled — nothing is hidden'}
      </footer>
    </div>
  );
}

function FeatureRow({
  featureKey,
  label,
  description,
  masterOff,
}: {
  featureKey: SettingKey;
  label: string;
  description: string;
  masterOff: boolean;
}) {
  const [checked, setChecked] = useSetting(featureKey);
  return (
    <Row
      label={label}
      description={description}
      checked={checked}
      disabled={masterOff}
      onChange={setChecked}
    />
  );
}
