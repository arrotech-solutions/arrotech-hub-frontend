import React, { useState } from 'react';
import {
    Landmark,             // BuildingLibraryIcon replacement
    CreditCard,           // IdentificationIcon replacement
    FileCheck,            // DocumentCheckIcon replacement
    Loader2               // ArrowPath/Spinner replacement
} from 'lucide-react';
import { apiService as api } from '../../services/api';

const KraDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'pin' | 'nil-return' | 'self-register' | 'etims'>('pin');

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KRA GavaConnect</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Access your tax services securely via the Government Developer Portal.
                    </p>
                </div>
                <div className="flex space-x-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Sandbox Environment
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('pin')}
                        className={`${activeTab === 'pin'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                        <CreditCard className="w-5 h-5 mr-2" />
                        PIN Checker
                    </button>
                    <button
                        onClick={() => setActiveTab('nil-return')}
                        className={`${activeTab === 'nil-return'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                        <FileCheck className="w-5 h-5 mr-2" />
                        NIL Return Filing
                    </button>
                    <button
                        onClick={() => setActiveTab('self-register')}
                        className={`${activeTab === 'self-register'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                        {/* You might want to import UserPlus icon if available, or use another icon */}
                        <FileCheck className="w-5 h-5 mr-2" />
                        Self Register
                    </button>
                    <button
                        onClick={() => setActiveTab('etims')}
                        className={`${activeTab === 'etims'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                        <Landmark className="w-5 h-5 mr-2" />
                        eTIMS
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div className="mt-6">
                {activeTab === 'pin' && <PinChecker />}
                {activeTab === 'nil-return' && <NilFiling />}
                {activeTab === 'self-register' && <PinGeneration />}
                {activeTab === 'etims' && <EtimsPlaceholder />}
            </div>
        </div>
    );
};

const PinChecker: React.FC = () => {
    const [pin, setPin] = useState('');
    const [idNumber, setIdNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<'pin' | 'id'>('pin');
    const [taxpayerType, setTaxpayerType] = useState('KE');

    const taxpayerTypes = [
        { value: 'KE', label: 'Kenyan Resident' },
        { value: 'NKE', label: 'Non-Kenyan Resident' },
        { value: 'NKENR', label: 'Non-Kenyan Non-Resident' },
        { value: 'COMP', label: 'Company (Non-Individual)' }
    ];

    const handleCheck = async () => {
        setLoading(true);
        setError('');
        setResult(null);

        try {
            let response;
            if (mode === 'pin') {
                response = await api.checkKraPin(pin);
            } else {
                response = await api.checkKraId(idNumber, taxpayerType);
            }
            const data = response.data;
            if (data?.ErrorCode || data?.ErrorMessage) {
                setError(data.ErrorMessage || `Error: ${data.ErrorCode}`);
                setResult(null);
            } else if (data?.Status === 'NOK' || (data?.ResponseCode && !['23000', '30000'].includes(data.ResponseCode))) {
                // 23000 = Valid PIN (PIN Check), 30000 = Success (ID Check)
                setError(data.Message || 'Validation failed');
                setResult(null);
            } else {
                setResult(response);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to verify PIN');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 max-w-2xl">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Validate Taxpayer PIN</h3>

            <div className="flex space-x-4 mb-4">
                <label className="inline-flex items-center">
                    <input type="radio" className="form-radio" checked={mode === 'pin'} onChange={() => setMode('pin')} />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">By PIN</span>
                </label>
                <label className="inline-flex items-center">
                    <input type="radio" className="form-radio" checked={mode === 'id'} onChange={() => setMode('id')} />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">By National ID</span>
                </label>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {mode === 'pin' ? 'KRA PIN' : 'National ID Number'}
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                            type="text"
                            value={mode === 'pin' ? pin : idNumber}
                            onChange={(e) => mode === 'pin' ? setPin(e.target.value.toUpperCase()) : setIdNumber(e.target.value)}
                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder={mode === 'pin' ? "A00..." : "12345678"}
                        />
                    </div>
                </div>

                {mode === 'id' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Taxpayer Type
                        </label>
                        <div className="mt-1">
                            <select
                                value={taxpayerType}
                                onChange={(e) => setTaxpayerType(e.target.value)}
                                className="block w-full px-3 py-2 rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                {taxpayerTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleCheck}
                    disabled={loading || (mode === 'pin' ? !pin : !idNumber)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Verify
                </button>
            </div>

            {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">
                    {error}
                </div>
            )}

            {result && (
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Result</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
                            <span className="block text-xs text-gray-500 dark:text-gray-400">PIN</span>
                            <span className="block font-medium text-gray-900 dark:text-white">
                                {result.data?.PINDATA?.KRAPIN || result.data?.pin || result.data?.TaxpayerPIN}
                            </span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
                            <span className="block text-xs text-gray-500 dark:text-gray-400">Status</span>
                            <span className={`block font-medium ${(result.data?.PINDATA?.StatusOfPIN || result.data?.status) === 'Active' || ['30000', '23000'].includes(result.data?.ResponseCode)
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-yellow-600 dark:text-yellow-400'
                                }`}>
                                {result.data?.PINDATA?.StatusOfPIN || result.data?.status || (['30000', '23000'].includes(result.data?.ResponseCode) ? 'Active' : 'Unknown')}
                            </span>
                        </div>
                        <div className="col-span-2 bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
                            <span className="block text-xs text-gray-500 dark:text-gray-400">Taxpayer Name</span>
                            <span className="block font-medium text-gray-900 dark:text-white">
                                {result.data?.PINDATA?.Name || result.data?.taxpayer_name || result.data?.TaxpayerName}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const NilFiling: React.FC = () => {
    const [pin, setPin] = useState('');
    const [obligationCode, setObligationCode] = useState('1');
    const [month, setMonth] = useState(new Date().getMonth().toString().padStart(2, '0'));
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    const handleFiling = async () => {
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const response = await api.fileKraNilReturn(pin, obligationCode, month, year);
            const data = response.data;

            if (data?.ErrorCode || data?.ErrorMessage) {
                setError(data.ErrorMessage || `Error: ${data.ErrorCode}`);
                setResult(null);
            } else if (data?.RESPONSE?.Status === 'NOK' || (data?.RESPONSE?.ResponseCode && data.RESPONSE.ResponseCode.trim() !== '82000')) {
                setError(data?.RESPONSE?.Message || 'Filing failed');
                setResult(null);
            } else {
                setResult(data?.RESPONSE || data);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to file return');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 max-w-2xl">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">File NIL Return</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Submit a NIL return for Income Tax - Resident Individual.
            </p>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">KRA PIN</label>
                    <input
                        type="text"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.toUpperCase())}
                        className="mt-1 block w-full px-3 py-2 rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="P00..."
                    />
                </div>

                {/* Obligation code selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Obligation</label>
                    <div className="mt-1">
                        <select
                            value={obligationCode}
                            onChange={(e) => setObligationCode(e.target.value)}
                            className="block w-full px-3 py-2 rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="1">Income Tax - Individual Resident</option>
                            <option value="2">Income Tax - Individual Non-Resident</option>
                            <option value="3">Income Tax - Individual Partnership</option>
                            <option value="4">Income Tax - Company</option>
                            <option value="5">Value Added Tax (VAT)</option>
                            <option value="6">Income Tax - PAYE</option>
                            <option value="7">Excise</option>
                            <option value="8">Income Tax - Rent Income (MRI)</option>
                        </select>
                    </div>
                </div>

                {/* Month and Year selectors */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Month</label>
                        <input
                            type="text"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            placeholder="MM"
                            maxLength={2}
                            className="mt-1 block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Year</label>
                        <input
                            type="text"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            placeholder="YYYY"
                            maxLength={4}
                            className="mt-1 block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                        />
                    </div>
                </div>

                <button
                    onClick={handleFiling}
                    disabled={loading || !pin || !month || !year}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Submit NIL Return
                </button>
            </div>

            {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">
                    {error}
                </div>
            )}

            {result && (
                <div className="mt-6 bg-green-50 dark:bg-green-900/20 p-4 rounded-md border border-green-200 dark:border-green-800">
                    <div className="flex">
                        <FileCheck className="h-5 w-5 text-green-400" aria-hidden="true" />
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                                {result.Message || 'Return Filed Successfully'}
                            </h3>
                            <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                                <p>Ack Number: {result.AckNumber}</p>
                                <p>Status: {result.Status}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};



const PinGeneration: React.FC = () => {
    const [idNumber, setIdNumber] = useState('');
    const [dob, setDob] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [taxpayerType, setTaxpayerType] = useState('KE'); // [NEW] State for Taxpayer Type
    const [isPinWithNoOblig, setIsPinWithNoOblig] = useState('Yes'); // Default: Register without obligations (Yes = No Obligations)
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    const taxpayerTypes = [
        { value: 'KE', label: 'Kenyan Resident' },
        { value: 'NKE', label: 'Non-Kenyan Resident' },
        { value: 'NKENR', label: 'Non-Kenyan Non-Resident' },
        { value: 'COMP', label: 'Company (Non-Individual)' }
    ];

    const handleRegister = async () => {
        setLoading(true);
        setError('');
        setResult(null);

        try {
            // Ensure DOB is DD/MM/YYYY
            const formattedDob = new Date(dob).toLocaleDateString('en-GB');
            const response = await api.generateKraPin(idNumber, formattedDob, mobile, email, taxpayerType, isPinWithNoOblig);


            const data = response.data;
            if (data?.ErrorCode || data?.ErrorMessage) {
                setError(data.ErrorMessage || `Error: ${data.ErrorCode}`);
                setResult(null);
            } else if (data?.RESPONSE?.ResponseCode && data.RESPONSE.ResponseCode !== '80000') {
                setError(data.RESPONSE.Message || 'Registration failed');
                setResult(null);
            } else {
                setResult(data?.RESPONSE);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to generate PIN');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 max-w-2xl">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Generate KRA PIN</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Taxpayer Type</label>
                    <select
                        value={taxpayerType}
                        onChange={(e) => setTaxpayerType(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        {taxpayerTypes.map((type) => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">National ID</label>
                    <input type="text" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className="mt-1 block w-full px-3 py-2 rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</label>
                    <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="mt-1 block w-full px-3 py-2 rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Number</label>
                    <input type="text" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="0700000000" className="mt-1 block w-full px-3 py-2 rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>

                <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Register with Tax Obligations?</span>
                    <div className="mt-2 flex space-x-4">
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                className="form-radio text-indigo-600"
                                name="obligation"
                                checked={isPinWithNoOblig === 'No'}
                                onChange={() => setIsPinWithNoOblig('No')}
                            />
                            <span className="ml-2 text-gray-700 dark:text-gray-300">Yes (With Obligations)</span>
                        </label>
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                className="form-radio text-indigo-600"
                                name="obligation"
                                checked={isPinWithNoOblig === 'Yes'}
                                onChange={() => setIsPinWithNoOblig('Yes')}
                            />
                            <span className="ml-2 text-gray-700 dark:text-gray-300">No (Without Obligations)</span>
                        </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {isPinWithNoOblig === 'Yes'
                            ? "PIN will be generated WITHOUT specific tax obligations."
                            : "PIN will be generated WITH applicable tax obligations."}
                    </p>
                </div>

                <button onClick={handleRegister} disabled={loading || !idNumber || !dob || !mobile || !email} className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Register PIN
                </button>
            </div>

            {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">{error}</div>
            )}

            {result && (
                <div className="mt-6 bg-green-50 dark:bg-green-900/20 p-4 rounded-md border border-green-200 dark:border-green-800">
                    <h3 className="text-sm font-medium text-green-800 dark:text-green-200">{result.Message}</h3>
                    <p className="mt-2 text-lg font-bold text-green-700 dark:text-green-300">PIN: {result.PIN}</p>
                </div>
            )}
        </div>
    );
};

const EtimsPlaceholder: React.FC = () => (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-12 text-center">
        <Landmark className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">eTIMS Management</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your virtual ETR, invoices, and stock.</p>
        <div className="mt-6">
            <button disabled className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 opacity-50 cursor-not-allowed">
                Coming Soon
            </button>
        </div>
    </div>
);

export default KraDashboard;
