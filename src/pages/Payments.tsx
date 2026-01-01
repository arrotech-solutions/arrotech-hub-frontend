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
    Smartphone,
    Star,
    TrendingUp,
    Users,
    XCircle
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
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
      const response = await apiService.createStripePaymentIntent(stripeForm);
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

  const renderSubscriptionCard = (subscription: Subscription) => (
    <div key={subscription.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-green-300 group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                {subscription.tier} Plan
              </h3>
              <p className="text-sm text-gray-600 capitalize">
                Status: {subscription.status}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
            subscription.status === 'active' 
              ? 'bg-green-100 text-green-800 border-green-200' 
              : 'bg-gray-100 text-gray-800 border-gray-200'
          }`}>
            {subscription.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {subscription.current_period_start && (
            <div>
              <span className="font-medium text-gray-700">Start Date:</span>
              <span className="ml-2 text-gray-600">
                {new Date(subscription.current_period_start).toLocaleDateString()}
              </span>
            </div>
          )}
          {subscription.current_period_end && (
            <div>
              <span className="font-medium text-gray-700">End Date:</span>
              <span className="ml-2 text-gray-600">
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </span>
            </div>
          )}
          {subscription.stripe_subscription_id && (
            <div className="col-span-2">
              <span className="font-medium text-gray-700">Stripe ID:</span>
              <span className="ml-2 text-gray-600 font-mono text-xs">
                {subscription.stripe_subscription_id}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Payments</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalPayments}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-lg">
            <DollarSign className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900">{formatAmount(stats.totalAmount)}</p>
          </div>
          <div className="p-3 bg-green-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
            <p className="text-2xl font-bold text-gray-900">{formatAmount(stats.monthlyRevenue)}</p>
          </div>
          <div className="p-3 bg-purple-100 rounded-lg">
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
            <p className="text-2xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
          </div>
          <div className="p-3 bg-orange-100 rounded-lg">
            <Users className="w-6 h-6 text-orange-600" />
          </div>
        </div>
      </div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="payments-header mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-green-600 bg-clip-text text-transparent">
                  Payments
                </h1>
              </div>
              <p className="text-gray-600">Manage your payments, subscriptions, and billing</p>
            </div>
            <div className="payment-actions flex items-center space-x-3">
              <button
                onClick={fetchPaymentData}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setShowMpesaModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
              >
                <Smartphone className="w-4 h-4" />
                <span>M-Pesa</span>
              </button>
              <button
                onClick={() => setShowStripeModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
              >
                <CreditCard className="w-4 h-4" />
                <span>Stripe</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="payment-stats">
          {renderStats()}
        </div>

        {/* Filters and Search */}
        <div className="payment-filters bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {showFilters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>

                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Methods</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="stripe">Stripe</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Content Grid */}
        <div className="payment-history grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment History */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
              <span className="text-sm text-gray-500">{filteredPayments.length} payments</span>
            </div>
            
            {filteredPayments.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <CreditCard className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No payments found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {searchTerm || selectedStatus !== 'all' || selectedMethod !== 'all'
                    ? 'Try adjusting your search or filters to find what you\'re looking for.'
                    : 'No payment history available yet.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayments.map(renderPaymentCard)}
              </div>
            )}
          </div>

          {/* Subscriptions */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Subscriptions</h2>
              <span className="text-sm text-gray-500">{subscriptions.length} subscriptions</span>
            </div>
            
            {subscriptions.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Star className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No subscriptions</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  No active subscriptions found.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {subscriptions.map(renderSubscriptionCard)}
              </div>
            )}
          </div>
        </div>

        {/* M-Pesa Payment Modal */}
        {showMpesaModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">M-Pesa Payment</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={mpesaForm.phone_number}
                    onChange={(e) => setMpesaForm({ ...mpesaForm, phone_number: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="254700000000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (KES)
                  </label>
                  <input
                    type="number"
                    value={mpesaForm.amount}
                    onChange={(e) => setMpesaForm({ ...mpesaForm, amount: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference
                  </label>
                  <input
                    type="text"
                    value={mpesaForm.reference}
                    onChange={(e) => setMpesaForm({ ...mpesaForm, reference: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Payment reference"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={mpesaForm.description}
                    onChange={(e) => setMpesaForm({ ...mpesaForm, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Payment description"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowMpesaModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMpesaPayment}
                  disabled={!mpesaForm.phone_number || !mpesaForm.amount || !mpesaForm.reference}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                >
                  Send Payment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stripe Payment Modal */}
        {showStripeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Stripe Payment</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (cents)
                  </label>
                  <input
                    type="number"
                    value={stripeForm.amount}
                    onChange={(e) => setStripeForm({ ...stripeForm, amount: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={stripeForm.currency}
                    onChange={(e) => setStripeForm({ ...stripeForm, currency: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="kes">KES</option>
                    <option value="usd">USD</option>
                    <option value="eur">EUR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer ID (optional)
                  </label>
                  <input
                    type="text"
                    value={stripeForm.customer_id || ''}
                    onChange={(e) => setStripeForm({ ...stripeForm, customer_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="cus_..."
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowStripeModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStripePayment}
                  disabled={!stripeForm.amount}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                >
                  Create Payment Intent
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments; 