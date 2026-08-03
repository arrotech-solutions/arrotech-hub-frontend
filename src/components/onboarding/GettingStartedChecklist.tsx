import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ListChecks, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  CHECKLIST_BY_GOAL,
  ONBOARDING_GOALS,
} from './onboardingConfig';
import type { OnboardingPrimaryGoal } from '../../types';

const STORAGE_KEY = 'hub_getting_started_dismissed';
const DONE_KEY = 'hub_getting_started_done';

const GettingStartedChecklist: React.FC = () => {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [doneIds, setDoneIds] = useState<string[]>([]);

  const primary = (user?.primary_goal || 'exploring') as OnboardingPrimaryGoal;
  const secondary = (user?.secondary_goals || []) as OnboardingPrimaryGoal[];

  const items = useMemo(() => {
    const map = new Map<string, { id: string; label: string; href: string }>();
    for (const item of CHECKLIST_BY_GOAL[primary] || []) map.set(item.id, item);
    for (const goal of secondary.slice(0, 2)) {
      for (const item of (CHECKLIST_BY_GOAL[goal] || []).slice(0, 2)) {
        if (!map.has(item.id)) map.set(item.id, item);
      }
    }
    return Array.from(map.values()).slice(0, 6);
  }, [primary, secondary]);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === '1');
      const raw = localStorage.getItem(DONE_KEY);
      if (raw) setDoneIds(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  if (!user?.onboarding_completed_at || dismissed || items.length === 0) {
    return null;
  }

  const goalTitle =
    ONBOARDING_GOALS.find((g) => g.id === primary)?.title || 'Getting started';
  const completedCount = items.filter((i) => doneIds.includes(i.id)).length;

  const toggleDone = (id: string) => {
    setDoneIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(DONE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 mb-2 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 py-4 flex items-start justify-between gap-3 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
            <ListChecks className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
              Getting started — {goalTitle}
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {completedCount} of {items.length} complete
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 min-h-[40px] min-w-[40px] flex items-center justify-center"
          aria-label="Dismiss checklist"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <ul className="p-2 sm:p-3 space-y-1">
        {items.map((item) => {
          const done = doneIds.includes(item.id);
          return (
            <li key={item.id}>
              <div className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors">
                <button
                  type="button"
                  onClick={() => toggleDone(item.id)}
                  className="shrink-0 p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                  aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                >
                  {done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
                <Link
                  to={item.href}
                  className={`flex-1 text-sm min-w-0 truncate ${
                    done
                      ? 'text-gray-400 dark:text-slate-500 line-through'
                      : 'text-gray-800 dark:text-slate-100 font-medium'
                  }`}
                >
                  {item.label}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default GettingStartedChecklist;
