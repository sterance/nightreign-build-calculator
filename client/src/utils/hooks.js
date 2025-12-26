import { useState, useEffect, useCallback } from 'react';

const DEFAULT_USER_OPTIONS = {
  showDeepOfNight: false,
  showForsakenHollows: false,
  showUnknownRelics: 'no',
  showRelicIdToggle: false,
  showScoreInfoToggle: false,
  calculateGuaranteeableRelics: true,
  openPopoutInNewTab: false,
  primaryColor: '#646cff',
  selectedRelicsCharacter: '',
};

export function useUserOptions() {
  const [options, setOptions] = useState(() => {
    const saved = localStorage.getItem('userOptions');
    if (saved) {
      try {
        return { ...DEFAULT_USER_OPTIONS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_USER_OPTIONS;
      }
    }
    return DEFAULT_USER_OPTIONS;
  });

  useEffect(() => {
    localStorage.setItem('userOptions', JSON.stringify(options));
  }, [options]);

  const updateOption = useCallback((key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  return [options, updateOption, setOptions];
}
