import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  User,
  Store,
  LogOut,
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  Phone,
  Lock,
  Mail,
} from 'lucide-react';
import { loginAuthApi, registerAuthApi } from '../services/api';
import type { AuthUser } from '../types';
import { formatCurrency } from '../lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  initialRole?: 'consumer' | 'retailer';
  onAuthSuccess: (user: AuthUser, token: string) => void;
  onLogout: () => void;
  onSwitchTab?: (tab: 'consumer' | 'retailer') => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PK_PHONE_REGEX = /^(\+92|0)(3\d{9}|[2-9]\d{8,10})$/;

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialRole = 'consumer',
  onAuthSuccess,
  onLogout,
  onSwitchTab,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'consumer' | 'retailer'>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeCategory, setStoreCategory] = useState<'grocery' | 'bakery' | 'restaurant'>('bakery');
  const [storeAddress, setStoreAddress] = useState('');
  const [city, setCity] = useState('Lahore');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRole(initialRole);
      setError(null);
      setFieldErrors({});
    }
  }, [isOpen, initialRole]);

  const passwordChecks = useMemo(
    () => ({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /\d/.test(password),
    }),
    [password]
  );

  const isPasswordStrong =
    passwordChecks.length && passwordChecks.upper && passwordChecks.lower && passwordChecks.number;

  if (!isOpen) return null;

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/[\s()-]/g, '').trim();

    if (!EMAIL_REGEX.test(cleanEmail)) {
      errs.email = 'Enter a valid email address (e.g. name@domain.com).';
    }

    if (mode === 'login') {
      if (!password) {
        errs.password = 'Enter your password.';
      }
    } else {
      const cleanName = name.trim();
      if (cleanName.length < 2 || !/[a-zA-Z]/.test(cleanName)) {
        errs.name = 'Enter your full name (at least 2 letters).';
      }

      if (!PK_PHONE_REGEX.test(cleanPhone)) {
        errs.phone = 'Enter a valid Pakistani phone number (e.g. 03001234567 or +923001234567).';
      }

      if (!isPasswordStrong) {
        errs.password = 'Password does not meet all strength requirements below.';
      }

      if (password !== confirmPassword) {
        errs.confirmPassword = 'Passwords do not match.';
      }

      if (role === 'retailer') {
        if (storeName.trim().length < 2) {
          errs.storeName = 'Store / Bakery name is required (min 2 characters).';
        }
        if (storeAddress.trim().length < 5) {
          errs.storeAddress = 'Enter full street address for customer pickup (min 5 characters).';
        }
      }

      if (!acceptedTerms) {
        errs.terms = 'Please accept the terms & accuracy confirmation.';
      }
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const resetSensitiveInputs = () => {
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFieldErrors({});
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);
    const normalizedPhone = phone.replace(/[\s()-]/g, '').trim();

    try {
      if (mode === 'register') {
        const res = await registerAuthApi({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: normalizedPhone,
          password,
          confirmPassword,
          role,
          storeName: role === 'retailer' ? storeName.trim() : undefined,
          storeCategory: role === 'retailer' ? storeCategory : undefined,
          storeAddress: role === 'retailer' ? storeAddress.trim() : undefined,
          city: role === 'retailer' ? city : undefined,
        });
        if (!res.user || !res.token) {
          throw new Error(res.error || 'Registration failed. Please try again.');
        }
        onAuthSuccess({ ...res.user, retailer: res.retailer || res.user.retailer }, res.token);
      } else {
        const res = await loginAuthApi(
          email.trim().toLowerCase(),
          password,
          initialRole === 'retailer' ? 'retailer' : undefined
        );
        if (!res.user || !res.token) {
          throw new Error(res.error || 'Invalid email or password.');
        }
        onAuthSuccess({ ...res.user, retailer: res.retailer || res.user.retailer }, res.token);
      }
      resetSensitiveInputs();
      onClose();
    } catch (err: any) {
      const message = err?.message || 'Unable to authenticate. Please verify your details.';
      setError(
        message.includes('Failed to fetch')
          ? 'Cannot reach server. Please verify the backend API is running.'
          : message
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-stone-200 rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
          title="Close"
        >
          <X className="size-5" />
        </button>

        {currentUser ? (
          <div className="flex flex-col items-center text-center gap-4 py-2">
            <div className="size-16 rounded-full bg-[#1b4332] text-white flex items-center justify-center text-2xl font-black shadow-md">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>

            <div>
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-xl font-black text-stone-900 tracking-tight">{currentUser.name}</h3>
                <CheckCircle2 className="size-4 text-[#2e7d32]" />
              </div>
              <p className="text-xs text-stone-500 font-medium mt-0.5">{currentUser.email}</p>
              {currentUser.contactPhone && (
                <p className="text-xs text-stone-500 font-medium">{currentUser.contactPhone}</p>
              )}

              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold">
                {currentUser.role === 'retailer' ? (
                  <span className="px-3 py-1 rounded-full bg-[#fff3e0] text-[#e65100] border border-[#ffe0b2] font-black flex items-center gap-1">
                    <Store className="size-3.5" />
                    {currentUser.retailer?.name || 'Verified Merchant Partner'}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-[#edf7ed] text-[#2e7d32] border border-[#c8e6c9] font-black flex items-center gap-1">
                    <ShoppingBag className="size-3.5" />
                    Customer Account
                  </span>
                )}
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-3 mt-1">
              <div className="p-3 rounded-2xl bg-[#f7f5f0] border border-[#e8e2d8] text-center">
                <span className="text-[10px] text-stone-500 font-semibold uppercase block">Orders Rescued</span>
                <span className="text-base font-black text-[#2e7d32]">
                  {currentUser.itemsRescuedCount || 0} Bags
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#f7f5f0] border border-[#e8e2d8] text-center">
                <span className="text-[10px] text-stone-500 font-semibold uppercase block">Total Savings</span>
                <span className="text-base font-black text-[#f37021]">
                  {formatCurrency(currentUser.totalSavedPkr || 0)}
                </span>
              </div>
            </div>

            {currentUser.role === 'retailer' ? (
              <button
                onClick={() => {
                  if (onSwitchTab) onSwitchTab('retailer');
                  onClose();
                }}
                className="w-full py-3 rounded-xl bg-[#1b4332] hover:bg-[#133326] text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all mt-1"
              >
                <Store className="size-4" />
                <span>Open Merchant POS Portal</span>
                <ArrowRight className="size-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  if (onSwitchTab) onSwitchTab('consumer');
                  onClose();
                }}
                className="w-full py-3 rounded-xl bg-[#1b4332] hover:bg-[#133326] text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all mt-1"
              >
                <ShoppingBag className="size-4" />
                <span>Browse Surplus Deals</span>
                <ArrowRight className="size-4" />
              </button>
            )}

            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-xs flex items-center justify-center gap-2 transition-colors mt-1"
            >
              <LogOut className="size-4" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div>
            {/* Header & Mode Switch Tabs */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-xl bg-[#edf7ed] text-[#1b4332] border border-[#c8e6c9] flex items-center justify-center">
                  <Lock className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-stone-900 tracking-tight">
                    {mode === 'login' ? 'Sign In to Foodsave' : 'Create Verified Account'}
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    {mode === 'login'
                      ? initialRole === 'retailer'
                        ? 'Merchant Partner authentication required'
                        : 'Access reservations & account tools'
                      : 'Strict verification keeps pickups reliable'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#f7f5f0] border border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setFieldErrors({});
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    mode === 'login' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                    setFieldErrors({});
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    mode === 'register' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Create Account
                </button>
              </div>
            </div>

            {/* Role Selector on Sign Up */}
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-2 mb-4 p-1.5 rounded-xl bg-[#f7f5f0] border border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setRole('consumer');
                    setFieldErrors({});
                    setError(null);
                  }}
                  className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    role === 'consumer'
                      ? 'bg-[#1b4332] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <User className="size-3.5" />
                  <span>Customer</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole('retailer');
                    setFieldErrors({});
                    setError(null);
                  }}
                  className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    role === 'retailer'
                      ? 'bg-[#f37021] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Store className="size-3.5" />
                  <span>Merchant Store</span>
                </button>
              </div>
            )}

            {error && (
              <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="size-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs text-stone-700 mb-1 font-semibold">Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Sara Ahmed"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        clearFieldError('name');
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#f7f5f0] border text-stone-900 text-xs font-semibold focus:outline-none ${
                        fieldErrors.name ? 'border-red-400 focus:border-red-500' : 'border-stone-200 focus:border-[#1b4332]'
                      }`}
                    />
                    {fieldErrors.name && <p className="text-[11px] text-red-600 mt-1 font-medium">{fieldErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs text-stone-700 mb-1 font-semibold">
                      Pakistani Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="size-3.5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        placeholder="03001234567 or +923001234567"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          clearFieldError('phone');
                        }}
                        className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#f7f5f0] border text-stone-900 text-xs font-semibold focus:outline-none ${
                          fieldErrors.phone
                            ? 'border-red-400 focus:border-red-500'
                            : 'border-stone-200 focus:border-[#1b4332]'
                        }`}
                      />
                    </div>
                    {fieldErrors.phone && <p className="text-[11px] text-red-600 mt-1 font-medium">{fieldErrors.phone}</p>}
                  </div>
                </>
              )}

              {mode === 'register' && role === 'retailer' && (
                <div className="p-3.5 rounded-2xl bg-[#fff8f1] border border-[#f37021]/25 flex flex-col gap-2.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#e65100]">
                    Store Verification Details
                  </span>

                  <div>
                    <label className="block text-xs text-stone-700 mb-1 font-semibold">Store / Bakery Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Royal Oven Bakers"
                      value={storeName}
                      onChange={(e) => {
                        setStoreName(e.target.value);
                        clearFieldError('storeName');
                      }}
                      className={`w-full px-3.5 py-2 rounded-xl bg-white border text-stone-900 text-xs font-semibold focus:outline-none ${
                        fieldErrors.storeName
                          ? 'border-red-400 focus:border-red-500'
                          : 'border-stone-200 focus:border-[#f37021]'
                      }`}
                    />
                    {fieldErrors.storeName && (
                      <p className="text-[11px] text-red-600 mt-1 font-medium">{fieldErrors.storeName}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs text-stone-700 mb-1 font-semibold">Category *</label>
                      <select
                        value={storeCategory}
                        onChange={(e) => setStoreCategory(e.target.value as 'grocery' | 'bakery' | 'restaurant')}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 text-xs font-semibold focus:outline-none focus:border-[#f37021]"
                      >
                        <option value="bakery">Bakery</option>
                        <option value="grocery">Grocery</option>
                        <option value="restaurant">Restaurant</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-stone-700 mb-1 font-semibold">City *</label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 text-xs font-semibold focus:outline-none focus:border-[#f37021]"
                      >
                        <option value="Lahore">Lahore</option>
                        <option value="Karachi">Karachi</option>
                        <option value="Islamabad">Islamabad</option>
                        <option value="Rawalpindi">Rawalpindi</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-stone-700 mb-1 font-semibold">Pickup Street Address *</label>
                    <input
                      type="text"
                      placeholder="e.g. Block K, Main Market, Gulberg II"
                      value={storeAddress}
                      onChange={(e) => {
                        setStoreAddress(e.target.value);
                        clearFieldError('storeAddress');
                      }}
                      className={`w-full px-3.5 py-2 rounded-xl bg-white border text-stone-900 text-xs font-semibold focus:outline-none ${
                        fieldErrors.storeAddress
                          ? 'border-red-400 focus:border-red-500'
                          : 'border-stone-200 focus:border-[#f37021]'
                      }`}
                    />
                    {fieldErrors.storeAddress && (
                      <p className="text-[11px] text-red-600 mt-1 font-medium">{fieldErrors.storeAddress}</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-stone-700 mb-1 font-semibold">Email Address *</label>
                <div className="relative">
                  <Mail className="size-3.5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearFieldError('email');
                    }}
                    className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#f7f5f0] border text-stone-900 text-xs font-semibold focus:outline-none ${
                      fieldErrors.email
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-stone-200 focus:border-[#1b4332]'
                    }`}
                  />
                </div>
                {fieldErrors.email && <p className="text-[11px] text-red-600 mt-1 font-medium">{fieldErrors.email}</p>}
              </div>

              <div>
                <label className="block text-xs text-stone-700 mb-1 font-semibold">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={mode === 'register' ? '8+ chars with A-Z, a-z, 0-9' : 'Enter your password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearFieldError('password');
                    }}
                    className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#f7f5f0] border text-stone-900 text-xs font-semibold focus:outline-none ${
                      fieldErrors.password
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-stone-200 focus:border-[#1b4332]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-[11px] text-red-600 mt-1 font-medium">{fieldErrors.password}</p>
                )}

                {mode === 'register' && (
                  <div className="grid grid-cols-2 gap-1.5 mt-2 p-2.5 rounded-xl bg-[#f7f5f0] border border-stone-200 text-[11px]">
                    {[
                      { ok: passwordChecks.length, label: '8+ characters' },
                      { ok: passwordChecks.upper, label: '1 uppercase (A-Z)' },
                      { ok: passwordChecks.lower, label: '1 lowercase (a-z)' },
                      { ok: passwordChecks.number, label: '1 number (0-9)' },
                    ].map((rule) => (
                      <span
                        key={rule.label}
                        className={`flex items-center gap-1 font-semibold ${
                          rule.ok ? 'text-[#2e7d32]' : 'text-stone-400'
                        }`}
                      >
                        <Check className={`size-3 ${rule.ok ? 'text-[#2e7d32]' : 'text-stone-300'}`} />
                        {rule.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs text-stone-700 mb-1 font-semibold">Confirm Password *</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          clearFieldError('confirmPassword');
                        }}
                        className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#f7f5f0] border text-stone-900 text-xs font-semibold focus:outline-none ${
                          fieldErrors.confirmPassword
                            ? 'border-red-400 focus:border-red-500'
                            : 'border-stone-200 focus:border-[#1b4332]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="text-[11px] text-red-600 mt-1 font-medium">{fieldErrors.confirmPassword}</p>
                    )}
                  </div>

                  <label className="flex items-start gap-2.5 text-[11px] text-stone-600 font-medium cursor-pointer pt-0.5">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => {
                        setAcceptedTerms(e.target.checked);
                        clearFieldError('terms');
                      }}
                      className="mt-0.5 rounded border-stone-300 text-[#1b4332] focus:ring-[#1b4332]"
                    />
                    <span>
                      I confirm these details are accurate and agree to pickup rules &amp; food safety standards.
                    </span>
                  </label>
                  {fieldErrors.terms && <p className="text-[11px] text-red-600 font-medium">{fieldErrors.terms}</p>}
                </>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-[#1b4332] hover:bg-[#133326] disabled:opacity-50 text-white text-xs font-black shadow-md transition-all mt-1"
              >
                {isSubmitting
                  ? 'Please wait...'
                  : mode === 'login'
                  ? 'Sign In'
                  : role === 'retailer'
                  ? 'Create Merchant Account'
                  : 'Create Customer Account'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
