import { useEffect, useState } from 'react';
import { Toaster as SonnerToaster } from 'sonner';

/**
 * Branded sonner toaster — Night Violet surfaces, Dragon Fruit actions,
 * Solar Amber warning accents. Type-specific left borders so toasts
 * visually belong to the 60/30/10 system.
 */
export function Toaster() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light'
  );

  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => {
      setTheme(el.classList.contains('dark') ? 'dark' : 'light');
    });
    observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <SonnerToaster
      position="top-right"
      theme={theme}
      closeButton
      gap={10}
      offset={16}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            'group !rounded-xl !border !shadow-surface !backdrop-blur-md ' +
            '!bg-white/95 !border-secondary-200 !text-secondary-900 ' +
            'dark:!bg-secondary-900/95 dark:!border-secondary-700 dark:!text-secondary-50 ' +
            '!border-l-4',
          title: '!text-sm !font-semibold !text-secondary-900 dark:!text-secondary-50',
          description: '!text-sm !text-secondary-500 dark:!text-secondary-400',
          actionButton:
            '!rounded-lg !bg-primary-500 !px-3 !py-1.5 !text-xs !font-semibold !text-white ' +
            'hover:!bg-primary-600 !shadow-brand',
          cancelButton:
            '!rounded-lg !bg-secondary-100 !px-3 !py-1.5 !text-xs !font-semibold ' +
            '!text-secondary-700 dark:!bg-secondary-800 dark:!text-secondary-200',
          closeButton:
            '!border-secondary-200 !bg-white !text-secondary-500 ' +
            'dark:!border-secondary-700 dark:!bg-secondary-800 dark:!text-secondary-300',
          success: '!border-l-emerald-500',
          error: '!border-l-red-500',
          warning: '!border-l-accent-500',
          info: '!border-l-primary-500',
          loading: '!border-l-primary-500',
        },
      }}
    />
  );
}

export default Toaster;
