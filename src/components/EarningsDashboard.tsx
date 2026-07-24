import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  RefreshCw,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import apiService from '../services/api';
import { CreatorEarnings } from '../types';

interface EarningsDashboardProps {
  className?: string;
}

const EarningsDashboard: React.FC<EarningsDashboardProps> = ({ className }) => {
  const [earnings, setEarnings] = useState<CreatorEarnings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCreatorEarnings();
      if (response.success) {
        setEarnings(response.data);
      }
    } catch (error) {
      console.error('Failed to load earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (!earnings) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 ${className}`}>
        <p className="text-center text-gray-500 dark:text-slate-400">Unable to load earnings data</p>
      </div>
    );
  }

  const monthlyChange = earnings.this_month > 0 ?
    ((earnings.this_month / (earnings.total_earnings || 1)) * 100).toFixed(1) : '0';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-primary-500 to-secondary-900 rounded-lg shrink-0 shadow-lg shadow-primary-500/20">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">Earnings Dashboard</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">Track your workflow sales</p>
          </div>
        </div>
        <button
          onClick={loadEarnings}
          className="flex items-center justify-center space-x-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-gray-200 dark:border-slate-700 text-sm text-gray-600 dark:text-slate-300 sm:border-none sm:p-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="sm:hidden">Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Earnings */}
        <div className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-500/10 dark:to-accent-500/5 rounded-xl p-5 border border-primary-200 dark:border-primary-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-emerald-400">Total Earnings</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-white mt-1">
                ${earnings.total_earnings.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-emerald-500/20 rounded-full shrink-0">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="flex items-center mt-3 text-sm">
            <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-emerald-400 mr-1" />
            <span className="text-green-700 dark:text-emerald-500 font-medium">All time earnings</span>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/5 rounded-xl p-5 border border-blue-200 dark:border-blue-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-400">This Month</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-white mt-1">
                ${earnings.this_month.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-full shrink-0">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex items-center mt-3 text-sm">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-1" />
            <span className="text-blue-700 dark:text-blue-500 font-medium">{monthlyChange}% of total</span>
          </div>
        </div>

        {/* Pending Payout */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/5 rounded-xl p-5 border border-amber-200 dark:border-amber-500/20 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Pending Payout</p>
              <p className="text-2xl sm:text-3xl font-bold text-amber-900 dark:text-white mt-1">
                ${earnings.pending_earnings.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-full shrink-0">
              <CreditCard className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="flex items-center mt-3 text-sm">
            <span className="text-amber-700 dark:text-amber-500 font-medium">Processing payments</span>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <h4 className="font-semibold text-gray-900 dark:text-white">Recent Transactions</h4>
          <span className="text-sm text-gray-500 dark:text-slate-400">{earnings.transactions.length} transactions</span>
        </div>

        {earnings.transactions.length === 0 ? (
          <div className="p-8 text-center">
            <Download className="w-12 h-12 text-gray-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-slate-400">No transactions yet</p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Start selling workflows to see your earnings here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {earnings.transactions.map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${tx.status === 'completed' ? 'bg-green-100 dark:bg-green-500/10' :
                    tx.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-500/10' : 'bg-red-100 dark:bg-red-500/10'
                    }`}>
                    {tx.status === 'completed' ? (
                      <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-500" />
                    ) : tx.status === 'pending' ? (
                      <RefreshCw className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Workflow Sale</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {new Date(tx.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${tx.status === 'completed' ? 'text-green-600' :
                    tx.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                    +${tx.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout Info */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/10 rounded-xl border border-purple-200 dark:border-purple-500/20 p-5">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
            <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Payout Information</h4>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
              Payouts are processed automatically at the end of each month for balances over $50.
              You can also request an instant payout at any time from your account settings.
            </p>
            <button className="mt-3 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
              Configure payout settings →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningsDashboard;

