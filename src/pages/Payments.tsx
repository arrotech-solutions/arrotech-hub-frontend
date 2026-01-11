import {
  BarChart3,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  Filter,
  RefreshCw,
  Search,
  Zap,
  Sparkles,
  Smartphone,
  XCircle,
  Star,
  Calendar,
  AlertCircle,
  Info,
  Check,
  TrendingUp,
  Users
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import apiService from '../services/api';
import { useNavigate } from 'react-router-dom';
import { MpesaPaymentRequest, Payment, StripePaymentRequest, Subscription } from '../types';

const Payments: React.FC = () => {
  useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [mpesaForm, setMpesaForm] = useState<MpesaPaymentRequest>({
    phone_number: '',
    amount: 0,
    reference: '',
    description: 'Mini-Hub Payment'
  });
  const [stripeForm, setStripeForm] = useState<StripePaymentRequest>({
    amount: 0,
    currency: 'kes'
  });

  // Subscription management state
  const { tier, user, refetch: refetchSubscription } = useSubscription();
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelFeedback, setCancelFeedback] = useState('');

  const plans = [
    {
      id: 'free',
      name: 'Lite',
      price: 0,
      features: ['1 Active Workflow', '5 AI Messages / day', 'Google Analytics 4', 'Standard Support'],
      color: 'gray'
    },
    {
      id: 'starter',
      name: 'Starter',
      price: 1500,
      features: ['10 Active Workflows', '100 AI Messages / day', 'GA4 + M-Pesa + Slack', 'Priority Support'],
      color: 'indigo'
    },
    {
      id: 'pro',
      name: 'Business',
      price: 5000,
      features: ['Unlimited Workflows', 'Unlimited AI Messages', 'All Connections', 'Dedicated Support'],
      color: 'purple'
    }
  ];

  const currentPlan = plans.find(p => p.id === tier) || plans[0];
  const isActive = user?.subscription_status === 'active';
  const isCanceled = user?.subscription_status === 'canceled';
  const isGracePeriod = user?.subscription_status === 'grace_period';
  const isExpired = user?.subscription_status === 'expired';
  const isFree = tier === 'free';

  // Mock stats for demonstration
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalAmount: 0,
    successfulPayments: 0,
    failedPayments: 0,
    pendingPayments: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    averagePayment: 0
  });

  useEffect(() => {
    fetchPaymentData();
  }, []);

  useEffect(() => {
    const totalPayments = payments.length;
    const successfulPayments = payments.filter(p => p.status === 'completed').length;
    const failedPayments = payments.filter(p => p.status === 'failed').length;
    const pendingPayments = payments.filter(p => p.status === 'pending').length;
    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
    const monthlyRevenue = payments
      .filter(p => {
        const paymentDate = new Date(p.created_at);
        const now = new Date();
        return paymentDate.getMonth() === now.getMonth() &&
          paymentDate.getFullYear() === now.getFullYear() &&
          p.status === 'completed';
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const averagePayment = totalPayments > 0 ? totalAmount / totalPayments : 0;

    setStats({
      totalPayments,
      totalAmount,
      successfulPayments,
      failedPayments,
      pendingPayments,
      activeSubscriptions,
      monthlyRevenue,
      averagePayment
    });
  }, [payments, subscriptions]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, subscriptionsRes] = await Promise.allSettled([
        apiService.getPaymentHistory(),
        apiService.getSubscriptions()
      ]);

      if (paymentsRes.status === 'fulfilled') {
        setPayments(paymentsRes.value.data);
      }

      if (subscriptionsRes.status === 'fulfilled') {
        setSubscriptions(subscriptionsRes.value.data);
      }
    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason) {
      toast.error('Please select a reason for cancellation');
      return;
    }

    setCanceling(true);
    try {
      const response = await apiService.cancelSubscription(cancelReason, cancelFeedback);
      if (response.success) {
        toast.success(response.message || 'Subscription canceled successfully');
        setShowCancelModal(false);
        setCancelReason('');
        setCancelFeedback('');
        refetchSubscription();
        fetchPaymentData();
      } else {
        toast.error(response.error || 'Failed to cancel subscription');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to cancel subscription');
    } finally {
      setCanceling(false);
    }
  };

  const handleReactivate = async () => {
    setReactivating(true);
    try {
      const response = await apiService.reactivateSubscription();
      if (response.success) {
        toast.success(response.message || 'Subscription reactivated successfully');
        refetchSubscription();
        fetchPaymentData();
      } else {
        toast.error(response.error || 'Failed to reactivate subscription');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to reactivate subscription');
    } finally {
      setReactivating(false);
    }
  };

  const getSubscriptionStatusBadge = () => {
    if (isFree) {
      return <span className="px-3 py-1 bg-gray-900/10 text-gray-900 rounded-lg text-[10px] font-black uppercase tracking-widest border border-black/5">Lite Tier</span>;
    }
    const statusConfig: Record<string, { bg: string, text: string, label: string }> = {
      active: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'Nodes Active' },
      canceled: { bg: 'bg-rose-500/10', text: 'text-rose-500', label: 'Decommissioned' },
      grace_period: { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'Access Unstable' },
      expired: { bg: 'bg-gray-500/10', text: 'text-gray-500', label: 'Offline' }
    };
    const config = statusConfig[user?.subscription_status || 'expired'] || statusConfig.expired;
    return <span className={`px-3 py-1 ${config.bg} ${config.text} rounded-lg text-[10px] font-black uppercase tracking-widest border border-current/10`}>{config.label}</span>;
  };

  const handleMpesaPayment = async () => {
    try {
      const response = await apiService.initiateMpesaPayment(mpesaForm);
      if (response.success) {
        toast.success('M-Pesa payment initiated successfully');
        setShowMpesaModal(false);
        setMpesaForm({ phone_number: '', amount: 0, reference: '', description: 'Mini-Hub Payment' });
        fetchPaymentData();
      } else {
        toast.error(response.error || 'Payment initiation failed');
      }
    } catch (error) {
      console.error('Error initiating M-Pesa payment:', error);
      toast.error('Failed to initiate payment');
    }
  };

  const handleStripePayment = async () => {
    try {
      // Stripe expects amount in cents
      const stripePayload = {
        ...stripeForm,
        amount: Math.round(stripeForm.amount * 100)
      };
      const response = await apiService.createStripePaymentIntent(stripePayload);
      if (response.success) {
        toast.success('Stripe payment intent created');
        setShowStripeModal(false);
        setStripeForm({ amount: 0, currency: 'kes' });
        fetchPaymentData();
      } else {
        toast.error(response.error || 'Payment intent creation failed');
      }
    } catch (error) {
      console.error('Error creating Stripe payment intent:', error);
      toast.error('Failed to create payment intent');
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'mpesa':
        return <Smartphone className="w-5 h-5 text-green-600" />;
      case 'stripe':
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      default:
        return <DollarSign className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatAmount = (amount: number, currency: string = 'KES') => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const toggleExpandedItem = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const filteredPayments = payments.filter(payment => {
    const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;
    const matchesMethod = selectedMethod === 'all' || payment.payment_method === selectedMethod;
    const matchesSearch = !searchTerm ||
      payment.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesMethod && matchesSearch;
  });

  const renderPaymentCard = (payment: Payment) => (
    <div key={payment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-blue-300 group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              {getPaymentIcon(payment.payment_method)}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {payment.reference || `Payment #${payment.id}`}
              </h3>
              <p className="text-sm text-gray-600 capitalize">
                {payment.payment_method} • {formatDate(payment.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(payment.status)}
            <button
              onClick={() => toggleExpandedItem(String(payment.id))}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {expandedItems.has(String(payment.id)) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Amount and Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {formatAmount(payment.amount, payment.currency)}
            </p>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
              {payment.status}
            </span>
          </div>
        </div>

        {/* Expanded Details */}
        {expandedItems.has(String(payment.id)) && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Transaction ID:</span>
                <span className="ml-2 text-gray-600">{payment.transaction_id || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <span className="ml-2 text-gray-600">{new Date(payment.created_at).toLocaleString()}</span>
              </div>
              {payment.updated_at && (
                <div>
                  <span className="font-medium text-gray-700">Updated:</span>
                  <span className="ml-2 text-gray-600">{new Date(payment.updated_at).toLocaleString()}</span>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">Currency:</span>
                <span className="ml-2 text-gray-600">{payment.currency.toUpperCase()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );


  const renderStats = () => (
    <div className="payment-stats grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {[
        { label: 'Total Inflow', value: stats.totalPayments, icon: DollarSign, color: 'blue', detail: `${stats.successfulPayments} successful` },
        { label: 'Settled Value', value: formatAmount(stats.totalAmount), icon: TrendingUp, color: 'emerald', detail: 'Lifetime volume' },
        { label: 'Monthly Throughput', value: formatAmount(stats.monthlyRevenue), icon: BarChart3, color: 'purple', detail: 'Current cycle' },
        { label: 'Active Clusters', value: stats.activeSubscriptions, icon: Users, color: 'orange', detail: 'Neural nodes' }
      ].map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div key={i} className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-10 -mt-10 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity bg-${stat.color}-500`}></div>
            <div className="flex flex-col">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-white/50 bg-white group-hover:scale-110 transition-transform duration-500`}>
                <Icon className={`w-6 h-6 text-${stat.color}-500`} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-gray-900 tracking-tight mb-1">{stat.value}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.detail}</p>
            </div>
          </div>
        )
      })}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading payment data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/20">
      <main className="max-w-7xl mx-auto px-6 md:px-10 py-10">
        {/* Header with Mesh Gradient */}
        <div className="relative overflow-hidden bg-white rounded-[40px] border border-gray-200 shadow-sm mb-12 group payments-header">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl animate-pulse group-hover:bg-emerald-400/30 transition-colors duration-1000"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-green-400/20 rounded-full blur-3xl animate-pulse group-hover:bg-green-400/30 transition-colors duration-1000" style={{ animationDelay: '2s' }}></div>

          <div className="relative px-8 py-12 md:px-12">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-emerald-100/80 rounded-xl">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em]">Billing Nexus</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
                  Node <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Settlement</span> Center
                </h1>
                <p className="text-gray-500 max-w-xl font-medium text-lg leading-relaxed">
                  Consolidated ledger for your autonomous clusters. Manage subscriptions, purge logs, and track infrastructure inflow.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-4 payment-actions">
                <button
                  onClick={() => setShowStripeModal(true)}
                  className="flex items-center space-x-2 px-8 py-4 bg-gray-900 hover:bg-emerald-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-xl active:scale-95"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Direct Ledger</span>
                </button>
                <button
                  onClick={() => setShowMpesaModal(true)}
                  className="flex items-center space-x-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[24px] font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-xl active:scale-95"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>STK Push</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {renderStats()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-12">
            <section className="bg-white/60 backdrop-blur-xl rounded-[48px] border border-white p-10 payment-history">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center space-x-4">
                  <div className="p-1 bg-emerald-100 rounded-lg">
                    <RefreshCw className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Ledger Logs</h2>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Filter nodes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 pr-6 py-3 bg-white/40 border-none rounded-2xl w-full text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-3 rounded-2xl border transition-all ${showFilters ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white/40 text-gray-400 border-white/60 hover:bg-white/80'}`}
                  >
                    <Filter className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="mb-10 p-6 bg-white/40 rounded-3xl border border-white/60 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Protocol Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full bg-white/60 border-none rounded-xl text-sm font-black"
                    >
                      <option value="all">Global Logs</option>
                      <option value="completed">Settled</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Payment Pathway</label>
                    <select
                      value={selectedMethod}
                      onChange={(e) => setSelectedMethod(e.target.value)}
                      className="w-full bg-white/60 border-none rounded-xl text-sm font-black"
                    >
                      <option value="MPesa">M-Pesa Only</option>
                      <option value="all">All Pathways</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {filteredPayments.length > 0 ? (
                  filteredPayments.map(payment => renderPaymentCard(payment))
                ) : (
                  <div className="text-center py-20 bg-gray-50/50 rounded-[32px] border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <Search className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="font-black text-gray-400 uppercase tracking-widest">No matching payloads</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-12">
            <section className="bg-gray-900 rounded-[48px] p-1 text-white shadow-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl"></div>

              <div className="p-10 relative">
                <div className="flex items-center space-x-3 mb-10">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Zap className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-black tracking-tight uppercase">Current Tier</h2>
                </div>

                <div className="bg-white/5 rounded-[32px] p-8 border border-white/10 mb-10 text-center relative overflow-hidden group/card shadow-inner">
                  <div className={`absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rounded-full blur-2xl opacity-20 bg-emerald-500`}></div>
                  <div className="relative">
                    <div className="w-16 h-16 bg-white/10 rounded-[20px] flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/10 group-hover/card:scale-110 transition-transform duration-500">
                      <Star className="w-8 h-8 text-white fill-white/20" />
                    </div>
                    <h3 className="text-3xl font-black mb-2 tracking-tighter uppercase">{currentPlan.name}</h3>
                    <p className="text-emerald-400 font-black text-sm uppercase tracking-widest mb-6">
                      {currentPlan.price > 0 ? `KES ${currentPlan.price.toLocaleString()} / mo` : 'Open Source'}
                    </p>
                    <div className="inline-block">
                      {getSubscriptionStatusBadge()}
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-5 mb-10">
                  {currentPlan.features.slice(0, 4).map((f, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="p-1 bg-emerald-500/20 rounded-full">
                        <Check className="w-3 h-3 text-emerald-500" />
                      </div>
                      <span className="text-sm font-medium text-gray-400">{f}</span>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                  {isFree ? (
                    <button
                      onClick={() => navigate('/pricing')}
                      className="w-full py-5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-[24px] font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-xl shadow-emerald-900/40 active:scale-95 flex items-center justify-center space-x-2"
                    >
                      <Zap className="w-4 h-4 fill-white" />
                      <span>Boost Performance</span>
                    </button>
                  ) : (
                    <>
                      {isCanceled ? (
                        <button
                          onClick={handleReactivate}
                          disabled={reactivating}
                          className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[24px] font-black text-xs uppercase tracking-widest transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                          <RefreshCw className={`w-4 h-4 ${reactivating ? 'animate-spin' : ''}`} />
                          <span>Reactivate Node</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate('/pricing')}
                          className="w-full py-5 bg-white/10 hover:bg-white text-white hover:text-gray-900 rounded-[24px] border border-white/10 transition-all duration-300 font-black text-xs uppercase tracking-widest active:scale-95 flex items-center justify-center space-x-2"
                        >
                          <Zap className="w-4 h-4" />
                          <span>Change Protocol</span>
                        </button>
                      )}

                      {isActive && (
                        <button
                          onClick={() => setShowCancelModal(true)}
                          className="w-full py-4 text-rose-500 hover:text-rose-400 font-black text-xs uppercase tracking-widest transition-all hover:underline"
                        >
                          Decommission Tier
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* Billing Timeline Mini-Card */}
            {!isFree && user?.subscription_end_date && (
              <section className="bg-white/60 backdrop-blur-xl rounded-[40px] border border-white p-8 group">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="p-1 bg-blue-100 rounded-lg">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">Timeline</h2>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex flex-col items-center">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    <div className="w-0.5 h-10 bg-gray-100"></div>
                    <div className="w-1.5 h-1.5 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="flex-1 space-y-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Cycle Transition</p>
                      <p className="text-sm font-black text-gray-900 tracking-tight">
                        {new Date(user.subscription_end_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Estimated Charge</p>
                      <p className="text-sm font-black text-blue-600 tracking-tight">
                        {formatAmount(currentPlan.price)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Modals */}
        {showMpesaModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] p-10 w-full max-w-md shadow-2xl border border-white group relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-emerald-100 rounded-full blur-2xl opacity-50"></div>
              <div className="flex items-center space-x-4 mb-10">
                <div className="p-3 bg-emerald-100 rounded-2xl">
                  <Smartphone className="w-6 h-6 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">M-Pesa STK</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Protocol Address (Phone)</label>
                  <input
                    type="tel"
                    value={mpesaForm.phone_number}
                    onChange={(e) => setMpesaForm({ ...mpesaForm, phone_number: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-black text-gray-900 focus:ring-2 focus:ring-emerald-500"
                    placeholder="254700000000"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Payload Value (KES)</label>
                  <input
                    type="number"
                    value={mpesaForm.amount}
                    onChange={(e) => setMpesaForm({ ...mpesaForm, amount: parseInt(e.target.value) || 0 })}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-black text-gray-900 focus:ring-2 focus:ring-emerald-500"
                    placeholder="Amount"
                  />
                </div>
              </div>

              <div className="flex space-x-4 mt-10">
                <button
                  onClick={() => setShowMpesaModal(false)}
                  className="flex-1 py-4 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-900 transition-colors"
                >
                  Abort
                </button>
                <button
                  onClick={handleMpesaPayment}
                  disabled={!mpesaForm.phone_number || !mpesaForm.amount}
                  className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg disabled:opacity-50"
                >
                  Execute
                </button>
              </div>
            </div>
          </div>
        )}

        {showStripeModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] p-10 w-full max-w-md shadow-2xl border border-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-blue-100 rounded-full blur-2xl opacity-50"></div>
              <div className="flex items-center space-x-4 mb-10">
                <div className="p-3 bg-blue-100 rounded-2xl">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Ledger Credit</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Value Units (KES)</label>
                  <input
                    type="number"
                    value={stripeForm.amount}
                    onChange={(e) => setStripeForm({ ...stripeForm, amount: parseInt(e.target.value) || 0 })}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-black text-gray-900 focus:ring-2 focus:ring-blue-500"
                    placeholder="Amount"
                  />
                </div>
              </div>

              <div className="flex space-x-4 mt-10">
                <button
                  onClick={() => setShowStripeModal(false)}
                  className="flex-1 py-4 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-900 transition-colors"
                >
                  Abort
                </button>
                <button
                  onClick={handleStripePayment}
                  disabled={!stripeForm.amount}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg disabled:opacity-50"
                >
                  Authorize
                </button>
              </div>
            </div>
          </div>
        )}

        {showCancelModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] p-10 w-full max-w-md shadow-2xl border border-white">
              <div className="flex items-center space-x-4 mb-8">
                <div className="p-3 bg-rose-100 rounded-full">
                  <AlertCircle className="w-6 h-6 text-rose-600" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Decommission?</h2>
              </div>

              <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                Primary node will remain active until <strong>{new Date(user?.subscription_end_date || '').toLocaleDateString()}</strong>. Infrastructure will then transition to open-source tier.
              </p>

              <div className="space-y-6 mb-10">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Rationale</label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-black text-gray-900 focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">Select Rationale</option>
                    <option value="too_expensive">Resource Allocation</option>
                    <option value="not_using">Low Utilization</option>
                    <option value="other">Other Protocol</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-all"
                >
                  Maintain Node
                </button>
                <button
                  onClick={handleCancel}
                  disabled={!cancelReason || canceling}
                  className="flex-1 py-4 text-rose-600 font-black text-xs uppercase tracking-widest hover:underline disabled:opacity-50"
                >
                  {canceling ? 'Purging...' : 'Confirm Purge'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Payments; 