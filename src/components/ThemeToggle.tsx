import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

function readIsDark(): boolean {
    if (typeof document === 'undefined') return false;
    if (document.documentElement.classList.contains('dark')) return true;
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export const ThemeToggle: React.FC = () => {
    const [isDark, setIsDark] = useState(readIsDark);

    // Follow global theme changes from Chat / other surfaces — do not write on mount.
    useEffect(() => {
        const sync = () => setIsDark(document.documentElement.classList.contains('dark'));
        const observer = new MutationObserver(sync);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const toggle = () => {
        setIsDark((prev) => {
            const next = !prev;
            localStorage.setItem('theme', next ? 'dark' : 'light');
            document.documentElement.classList.toggle('dark', next);
            return next;
        });
    };

    return (
        <button
            onClick={toggle}
            className="p-2.5 text-secondary-500 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 bg-white/50 dark:bg-secondary-800/50 backdrop-blur-sm border border-secondary-200 dark:border-secondary-700 hover:bg-primary-50 dark:hover:bg-primary-500/10 hover:border-primary-200 dark:hover:border-primary-500/30 rounded-full transition-all shadow-sm"
            aria-label="Toggle Dark Mode"
        >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
    );
};
