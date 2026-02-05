import React, { useState } from 'react';
import {
    Landmark,
    CreditCard,
    FileCheck,
    Loader2,
    ShieldCheck,
    UserPlus,
    Building2,
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    ArrowRight
} from 'lucide-react';
import { apiService as api } from '../../services/api';
import { KRALogo } from '../../components/BrandIcons'; // Assuming this exists from KraPinModal usage, if not I'll fallback

// --- Reusable UI Components ---

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden ${className}`}>
        {children}
    </div>
);

const InputGroup: React.FC<{ label: string; children: React.ReactNode; error?: string }> = ({ label, children, error }) => (
    <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{label}</label>
        {children}
        {error && <p className="text-xs text-red-500 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}
    </div>
);

const StyledInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input
        {...props}
        className={`
            w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 
            rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all
            focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white dark:focus:bg-slate-800
            disabled:opacity-60 disabled:cursor-not-allowed
            ${props.className}
        `}
    />
);

const StyledSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <div className="relative">
        <select
            {...props}
            className={`
                w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 
                rounded-2xl text-slate-900 dark:text-white outline-none transition-all appearance-none cursor-pointer
                focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white dark:focus:bg-slate-800
                ${props.className}
            `}
        />
        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronRight className="w-5 h-5 rotate-90" />
        </div>
    </div>
);

const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }> = ({ children, loading, className, ...props }) => (
    <button
        {...props}
        className={`
            relative w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400
            text-white font-bold rounded-2xl shadow-lg shadow-red-500/30 hover:shadow-red-500/40 
            transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none
            flex items-center justify-center gap-2
            ${className}
        `}
    >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
    </button>
);

const ResultCard: React.FC<{ title: string; type: 'success' | 'warning' | 'error'; children: React.ReactNode }> = ({ title, type, children }) => {
    const colors = {
        success: 'bg-emerald-50 border-emerald-100 text-emerald-900 dark:bg-emerald-900/10 dark:border-emerald-800 dark:text-emerald-100',
        warning: 'bg-amber-50 border-amber-100 text-amber-900 dark:bg-amber-900/10 dark:border-amber-800 dark:text-amber-100',
        error: 'bg-red-50 border-red-100 text-red-900 dark:bg-red-900/10 dark:border-red-800 dark:text-red-100'
    };

    return (
        <div className={`p-6 rounded-2xl border ${colors[type]} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
            <div className="flex items-center gap-3 mb-4">
                {type === 'success' && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                {type === 'warning' && <AlertCircle className="w-6 h-6 text-amber-500" />}
                {type === 'error' && <AlertCircle className="w-6 h-6 text-red-500" />}
                <h3 className="font-bold text-lg">{title}</h3>
            </div>
            <div className="space-y-2 opacity-90">
                {children}
            </div>
        </div>
    );
};

// --- Sub-Components ---

const PinChecker: React.FC = () => {
    const [pin, setPin] = useState('');
    const [idNumber, setIdNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<'pin' | 'id'>('pin');
    const [taxpayerType, setTaxpayerType] = useState('KE');

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
            } else if (data?.Status === 'NOK' || (data?.ResponseCode && !['23000', '30000'].includes(data.ResponseCode))) {
                setError(data.Message || 'Validation failed');
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
        <Card className="max-w-2xl mx-auto">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-red-500" />
                        Taxpayer Validation
                    </h3>
                    <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-xl flex gap-1">
                        <button
                            onClick={() => setMode('pin')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'pin' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            By PIN
                        </button>
                        <button
                            onClick={() => setMode('id')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'id' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            By ID
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {mode === 'id' && (
                        <InputGroup label="Taxpayer Type">
                            <StyledSelect
                                value={taxpayerType}
                                onChange={(e) => setTaxpayerType(e.target.value)}
                            >
                                <option value="KE">Kenyan Resident</option>
                                <option value="NKE">Non-Kenyan Resident</option>
                                <option value="NKENR">Non-Kenyan Non-Resident</option>
                                <option value="COMP">Company</option>
                            </StyledSelect>
                        </InputGroup>
                    )}

                    <InputGroup label={mode === 'pin' ? 'KRA PIN' : 'National ID Number'}>
                        <StyledInput
                            type="text"
                            value={mode === 'pin' ? pin : idNumber}
                            onChange={(e) => mode === 'pin' ? setPin(e.target.value.toUpperCase()) : setIdNumber(e.target.value)}
                            placeholder={mode === 'pin' ? "A00..." : "12345678"}
                        />
                    </InputGroup>

                    <PrimaryButton onClick={handleCheck} disabled={loading || (mode === 'pin' ? !pin : !idNumber)} loading={loading}>
                        Verify Taxpayer
                    </PrimaryButton>
                </div>
            </div>

            {(result || error) && (
                <div className="p-8 bg-slate-50/50 dark:bg-slate-800/20">
                    {error && (
                        <ResultCard title="Validation Failed" type="error">
                            <p className="break-words">{error}</p>
                        </ResultCard>
                    )}

                    {result && (
                        <ResultCard
                            title={(['30000', '23000'].includes(result.data?.ResponseCode) || (result.data?.PINDATA?.StatusOfPIN || result.data?.status) === 'Active') ? "Valid Taxpayer" : "Taxpayer Found"}
                            type={(['30000', '23000'].includes(result.data?.ResponseCode) || (result.data?.PINDATA?.StatusOfPIN || result.data?.status) === 'Active') ? "success" : "warning"}
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                                    <span className="text-xs text-slate-500 uppercase font-bold">PIN</span>
                                    <p className="text-lg font-mono font-semibold text-slate-900 dark:text-white break-all">
                                        {result.data?.PINDATA?.KRAPIN || result.data?.pin || result.data?.TaxpayerPIN}
                                    </p>
                                </div>
                                <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                                    <span className="text-xs text-slate-500 uppercase font-bold">Name</span>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-white break-words">
                                        {result.data?.PINDATA?.Name || result.data?.taxpayer_name || result.data?.TaxpayerName}
                                    </p>
                                </div>
                                <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl col-span-1 sm:col-span-2">
                                    <span className="text-xs text-slate-500 uppercase font-bold">Status</span>
                                    <p className="font-medium text-slate-900 dark:text-white break-words">
                                        {result.data?.PINDATA?.StatusOfPIN || result.data?.status || 'Active'}
                                    </p>
                                </div>
                            </div>
                        </ResultCard>
                    )}
                </div>
            )}
        </Card>
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
            } else if (data?.RESPONSE?.Status === 'NOK' || (data?.RESPONSE?.ResponseCode && data.RESPONSE.ResponseCode.trim() !== '82000')) {
                setError(data?.RESPONSE?.Message || 'Filing failed');
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
        <Card className="max-w-2xl mx-auto">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <FileCheck className="w-6 h-6 text-red-500" />
                        File NIL Return
                    </h3>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">
                        Submit a nil return for periods with no taxable transactions.
                    </p>
                </div>

                <div className="space-y-6">
                    <InputGroup label="KRA PIN">
                        <StyledInput
                            value={pin}
                            onChange={(e) => setPin(e.target.value.toUpperCase())}
                            placeholder="P00..."
                        />
                    </InputGroup>

                    <InputGroup label="Tax Obligation">
                        <StyledSelect
                            value={obligationCode}
                            onChange={(e) => setObligationCode(e.target.value)}
                        >
                            <option value="1">Income Tax - Individual Resident</option>
                            <option value="2">Income Tax - Individual Non-Resident</option>
                            <option value="5">Value Added Tax (VAT)</option>
                            <option value="6">Income Tax - PAYE</option>
                            <option value="8">Income Tax - Rent Income (MRI)</option>
                        </StyledSelect>
                    </InputGroup>

                    <div className="grid grid-cols-2 gap-6">
                        <InputGroup label="Month">
                            <StyledInput
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                placeholder="MM"
                                maxLength={2}
                            />
                        </InputGroup>
                        <InputGroup label="Year">
                            <StyledInput
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                placeholder="YYYY"
                                maxLength={4}
                            />
                        </InputGroup>
                    </div>

                    <PrimaryButton onClick={handleFiling} disabled={loading || !pin || !month || !year} loading={loading}>
                        Submit NIL Return
                    </PrimaryButton>
                </div>
            </div>

            {(result || error) && (
                <div className="p-8 bg-slate-50/50 dark:bg-slate-800/20">
                    {error && (
                        <ResultCard title="Filing Failed" type="error">
                            <p className="break-words">{error}</p>
                        </ResultCard>
                    )}
                    {result && (
                        <ResultCard title="Return Filed Successfully" type="success">
                            <p className="font-medium break-all">Acknowledgement Number: {result.AckNumber}</p>
                            <p className="text-sm opacity-80 break-words">{result.Message}</p>
                        </ResultCard>
                    )}
                </div>
            )}
        </Card>
    );
};

const PinGeneration: React.FC = () => {
    const [idNumber, setIdNumber] = useState('');
    const [dob, setDob] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [taxpayerType, setTaxpayerType] = useState('KE');
    const [isPinWithNoOblig, setIsPinWithNoOblig] = useState('Yes');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    const handleRegister = async () => {
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const formattedDob = new Date(dob).toLocaleDateString('en-GB');
            const response = await api.generateKraPin(idNumber, formattedDob, mobile, email, taxpayerType, isPinWithNoOblig);
            const data = response.data;

            if (data?.ErrorCode || data?.ErrorMessage) {
                setError(data.ErrorMessage || `Error: ${data.ErrorCode}`);
            } else if (data?.RESPONSE?.ResponseCode && data.RESPONSE.ResponseCode !== '80000') {
                setError(data.RESPONSE.Message || 'Registration failed');
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
        <Card className="max-w-2xl mx-auto">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <UserPlus className="w-6 h-6 text-red-500" />
                        iTax Registration
                    </h3>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">
                        Generate a new KRA PIN for individuals or companies.
                    </p>
                </div>

                <div className="space-y-6">
                    <InputGroup label="Taxpayer Type">
                        <StyledSelect value={taxpayerType} onChange={(e) => setTaxpayerType(e.target.value)}>
                            <option value="KE">Kenyan Resident</option>
                            <option value="NKE">Non-Kenyan Resident</option>
                            <option value="COMP">Company (Non-Individual)</option>
                        </StyledSelect>
                    </InputGroup>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="National ID / Cert No">
                            <StyledInput value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
                        </InputGroup>
                        <InputGroup label="Date of Birth / Reg">
                            <StyledInput type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                        </InputGroup>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="Mobile Number">
                            <StyledInput value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="0712345678" />
                        </InputGroup>
                        <InputGroup label="Email Address">
                            <StyledInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </InputGroup>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <span className="block text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
                            Tax Obligations
                        </span>
                        <div className="flex gap-6">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    className="w-5 h-5 text-red-600 border-slate-300 focus:ring-red-500"
                                    name="obligation"
                                    checked={isPinWithNoOblig === 'No'}
                                    onChange={() => setIsPinWithNoOblig('No')}
                                />
                                <span className="ml-3 font-medium text-slate-700 dark:text-slate-300">With Obligations</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    className="w-5 h-5 text-red-600 border-slate-300 focus:ring-red-500"
                                    name="obligation"
                                    checked={isPinWithNoOblig === 'Yes'}
                                    onChange={() => setIsPinWithNoOblig('Yes')}
                                />
                                <span className="ml-3 font-medium text-slate-700 dark:text-slate-300">No Obligations</span>
                            </label>
                        </div>
                    </div>

                    <PrimaryButton onClick={handleRegister} disabled={loading || !idNumber || !dob || !mobile || !email} loading={loading}>
                        Generate PIN
                    </PrimaryButton>
                </div>
            </div>

            {(result || error) && (
                <div className="p-8 bg-slate-50/50 dark:bg-slate-800/20">
                    {error && (
                        <ResultCard title="Registration Failed" type="error">
                            <p className="break-words">{error}</p>
                        </ResultCard>
                    )}
                    {result && (
                        <ResultCard title={result.Message} type="success">
                            <div className="mt-2 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                                <p className="text-sm text-slate-500 uppercase">Generated PIN</p>
                                <p className="text-3xl font-mono font-bold text-slate-900 dark:text-white tracking-widest mt-1 break-all">{result.PIN}</p>
                            </div>
                        </ResultCard>
                    )}
                </div>
            )}
        </Card>
    );
};

// --- Main Page Component ---

const KraDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'pin' | 'nil-return' | 'self-register' | 'etims'>('pin');

    const tabs = [
        { id: 'pin', label: 'PIN Checker', icon: CreditCard },
        { id: 'nil-return', label: 'File Return', icon: FileCheck },
        { id: 'self-register', label: 'Register', icon: UserPlus },
        { id: 'etims', label: 'eTIMS', icon: Landmark },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black font-sans selection:bg-red-500/20">
            {/* Banner Background */}
            <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-slate-200 to-slate-50 dark:from-slate-900 dark:to-black overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-overlay"></div>
                <div className="absolute -top-[200px] -right-[200px] w-[500px] h-[500px] bg-red-500/10 blur-[100px] rounded-full"></div>
                <div className="absolute top-[100px] -left-[100px] w-[300px] h-[300px] bg-amber-500/10 blur-[80px] rounded-full"></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 animate-in slide-in-from-top-4 fade-in duration-700">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            {/* Fallback to simple icon if KRALogo not available, but user said it works in modal */}
                            <div className="p-2 bg-red-600 rounded-lg text-white shadow-lg shadow-red-600/20">
                                <Landmark className="w-6 h-6" />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                                GavaConnect <span className="text-slate-400 font-light">Portal</span>
                            </h1>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 max-w-lg text-lg">
                            Secure, unified access to Kenya Revenue Authority services. Validated by GovConnect Protocol.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-full border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">System Online</span>
                        </div>
                    </div>
                </div>

                {/* Styled Tab Navigation */}
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Tabs for Desktop / Top Scroll for Mobile */}
                    <nav className="w-full md:w-64 flex-shrink-0 z-30">
                        <div className="md:sticky md:top-8 space-y-2 p-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`
                                        w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group
                                        ${activeTab === tab.id
                                            ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }
                                    `}
                                >
                                    <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`} />
                                    <span className="font-semibold">{tab.label}</span>
                                    {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto opacity-60" />}
                                </button>
                            ))}
                        </div>

                        {/* Help / Support box */}
                        <div className="mt-8 p-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl text-white shadow-xl hidden md:block">
                            <h4 className="font-bold text-lg mb-2">Need Help?</h4>
                            <p className="text-indigo-100 text-sm mb-4 leading-relaxed">
                                Not sure which obligation to file? Consult the digital tax assistant.
                            </p>
                            <button className="text-sm font-bold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors w-full">
                                Ask Assistant
                            </button>
                        </div>
                    </nav>

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-right-4 duration-500">
                        {activeTab === 'pin' && <PinChecker />}
                        {activeTab === 'nil-return' && <NilFiling />}
                        {activeTab === 'self-register' && <PinGeneration />}
                        {activeTab === 'etims' && (
                            <Card className="h-[400px] flex flex-col items-center justify-center p-12 text-center">
                                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                                    <Building2 className="w-10 h-10 text-slate-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">eTIMS Hub</h3>
                                <p className="text-slate-500 max-w-md mx-auto mb-8">
                                    Manage your virtual ETR, generate invoices, and track stock usage directly from the hub.
                                </p>
                                <button disabled className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 font-semibold rounded-xl cursor-not-allowed">
                                    Module Coming Soon
                                </button>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KraDashboard;
