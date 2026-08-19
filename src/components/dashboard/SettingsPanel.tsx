'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'next-auth/react';
import {
  ChevronLeft,
  X,
  CreditCard,
  UserCheck,
  User,
  Key,
  Globe,
  LogOut,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Camera,
  Upload,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/utils';
import { useLanguage } from '@/lib/i18n';

// ============================================
// Settings Panel - Slide-out from Right
// ============================================

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  onOpenKYC?: () => void;
}

type SettingsView = 'main' | 'payments' | 'verification' | 'personal' | 'security' | 'account';

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

// Country list
const countries = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 
  'Nigeria', 'South Africa', 'India', 'Brazil', 'Mexico', 'Japan', 'China',
  'Singapore', 'United Arab Emirates', 'Saudi Arabia', 'Netherlands', 'Spain',
  'Italy', 'Switzerland', 'Other'
];

export function SettingsPanel({ isOpen, onClose, user, onOpenKYC }: SettingsPanelProps) {
  // Translation hook
  const { t } = useLanguage();
  
  const [currentView, setCurrentView] = useState<SettingsView>('main');
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Security form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Personal form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [avatar, setAvatar] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('unverified');

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isTogglingTwoFA, setIsTogglingTwoFA] = useState(false);
  const [isLoadingSecurity, setIsLoadingSecurity] = useState(false);

  // Delete account state
  const [deleteStep, setDeleteStep] = useState<'warning' | 'password' | 'code' | 'success' | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteCode, setDeleteCode] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMaskedEmail, setDeleteMaskedEmail] = useState('');

  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Fetch profile data when personal view opens
  useEffect(() => {
    if (currentView === 'personal' || currentView === 'main') {
      fetchProfile();
    }
  }, [currentView]);

  const fetchProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const res = await fetch('/api/user/profile');
      const data = await res.json();
      if (res.ok) {
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setPhone(data.phone || '');
        setCountry(data.country || '');
        setAvatar(data.avatar || '');
        setVerificationStatus(data.verificationStatus || 'unverified');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const addToast = (type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast('error', 'Image must be less than 5MB');
        return;
      }
      setAvatarFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      addToast('error', 'First and last name are required');
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('firstName', firstName.trim());
      formData.append('lastName', lastName.trim());
      formData.append('phone', phone.trim());
      formData.append('country', country);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        addToast('success', 'Profile updated successfully');
        setAvatarFile(null);
        if (data.profile?.avatar) {
          setAvatar(data.profile.avatar);
        }
      } else {
        addToast('error', data.error || 'Failed to update profile');
      }
    } catch (error) {
      addToast('error', 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      addToast('error', 'Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      addToast('error', 'Password must be at least 8 characters');
      return;
    }

    setIsSaving(true);
    
    try {
      const res = await fetch('/api/user/security', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_password',
          currentPassword,
          newPassword,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        addToast('success', 'Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        addToast('error', data.error || 'Failed to update password');
      }
    } catch (error) {
      addToast('error', 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  // Fetch security settings
  const fetchSecuritySettings = async () => {
    try {
      setIsLoadingSecurity(true);
      const res = await fetch('/api/user/security');
      const data = await res.json();
      if (res.ok) {
        setTwoFactorEnabled(data.twoFactorEnabled || false);
      }
    } catch (error) {
      console.error('Failed to fetch security settings:', error);
    } finally {
      setIsLoadingSecurity(false);
    }
  };

  // Toggle 2FA
  const handleToggleTwoFA = async () => {
    const newStatus = !twoFactorEnabled;
    
    setIsTogglingTwoFA(true);
    
    try {
      const res = await fetch('/api/user/security', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_2fa',
          enable2FA: newStatus,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setTwoFactorEnabled(newStatus);
        addToast('success', newStatus ? '2FA enabled - you will receive a code via email when logging in' : '2FA disabled');
      } else {
        addToast('error', data.error || 'Failed to update 2FA settings');
      }
    } catch (error) {
      addToast('error', 'An error occurred');
    } finally {
      setIsTogglingTwoFA(false);
    }
  };

  // Fetch security settings when security view is opened
  useEffect(() => {
    if (currentView === 'security') {
      fetchSecuritySettings();
    }
  }, [currentView]);

  // Delete account - Step 1: Verify password and send code
  const handleDeleteRequestCode = async () => {
    if (!deletePassword) {
      setDeleteError('Please enter your password');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request',
          password: deletePassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setDeleteMaskedEmail(data.maskedEmail);
        setDeleteStep('code');
      } else {
        setDeleteError(data.error || 'Failed to verify password');
      }
    } catch (error) {
      setDeleteError('An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete account - Step 2: Verify code and delete
  const handleDeleteConfirm = async () => {
    if (deleteCode.length !== 6) {
      setDeleteError('Please enter the 6-digit code');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
          code: deleteCode,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setDeleteStep('success');
        // Sign out after short delay
        setTimeout(() => {
          signOut({ callbackUrl: '/login' });
        }, 2000);
      } else {
        setDeleteError(data.error || 'Failed to delete account');
      }
    } catch (error) {
      setDeleteError('An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset delete flow
  const resetDeleteFlow = () => {
    setDeleteStep(null);
    setDeletePassword('');
    setDeleteCode('');
    setDeleteError('');
    setDeleteMaskedEmail('');
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const handleClose = () => {
    setCurrentView('main');
    resetDeleteFlow();
    onClose();
  };

  const goBack = () => {
    setCurrentView('main');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleOpenVerification = () => {
    if (onOpenKYC) {
      onOpenKYC();
    }
  };

  // Get verification status badge
  const getVerificationBadge = () => {
    switch (verificationStatus) {
      case 'verified':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-[#22c55e]/10 text-[#22c55e]">Verified</span>;
      case 'pending':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/10 text-yellow-500">Pending</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/10 text-red-500">Rejected</span>;
      default:
        return <span className="px-2 py-0.5 text-xs rounded-full bg-[#6b7a90]/10 text-[#6b7a90]">Unverified</span>;
    }
  };

  // Main menu items
  const menuItems = [
    { id: 'payments', icon: CreditCard, label: t.settings.payments, description: `${t.nav.deposit} & ${t.nav.withdraw}` },
  ];

  const profileItems = [
    { id: 'verification', icon: UserCheck, label: t.settings.verification, description: t.settings.verification, action: handleOpenVerification, badge: getVerificationBadge() },
    { id: 'personal', icon: User, label: t.settings.personal, description: t.settings.personalInfo },
    { id: 'security', icon: Key, label: t.settings.security, description: t.settings.changePassword },
  ];

  const setupItems = [
    { id: 'account', icon: Globe, label: t.settings.account, description: t.settings.language },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-[380px] bg-[#0f1419] border-l border-[#1e2733] z-50 flex flex-col"
          >
            {/* Main View */}
            {currentView === 'main' && (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-[#1e2733]">
                  <div className="flex items-center gap-2">
                    <ChevronLeft className="h-5 w-5 text-[#6b7a90]" />
                    <span className="text-white font-medium">{t.nav.settings}</span>
                  </div>
                  <button onClick={handleClose} className="p-1 text-[#6b7a90] hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* User Info */}
                <div className="flex items-center gap-3 px-4 py-4">
                  {avatar ? (
                    <div className="h-12 w-12 rounded-full overflow-hidden">
                      <Image src={avatar} alt="Avatar" width={48} height={48} className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-[#22c55e] flex items-center justify-center text-white font-bold text-lg">
                      {getInitials(firstName && lastName ? `${firstName} ${lastName}` : user.name)}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-medium">
                      {firstName && lastName ? `${firstName} ${lastName}` : firstName || user.name}
                    </p>
                    <p className="text-sm text-[#6b7a90]">{user.email}</p>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="flex-1 overflow-y-auto px-4">
                  {/* Payments */}
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id as SettingsView)}
                      className="w-full flex items-center gap-3 py-3 hover:bg-[#151c24] rounded-lg px-2 -mx-2 transition-colors"
                    >
                      <item.icon className="h-5 w-5 text-[#6b7a90]" />
                      <div className="flex-1 text-left">
                        <p className="text-white font-medium">{item.label}</p>
                        <p className="text-xs text-[#6b7a90]">{item.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#6b7a90]" />
                    </button>
                  ))}

                  {/* Profile Section */}
                  <div className="mt-4 pt-4 border-t border-[#1e2733]">
                    <p className="text-xs text-[#6b7a90] uppercase tracking-wide mb-2">Profile</p>
                    {profileItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={item.action || (() => setCurrentView(item.id as SettingsView))}
                        className="w-full flex items-center gap-3 py-3 hover:bg-[#151c24] rounded-lg px-2 -mx-2 transition-colors"
                      >
                        <item.icon className="h-5 w-5 text-[#6b7a90]" />
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">{item.label}</p>
                            {item.badge}
                          </div>
                          <p className="text-xs text-[#6b7a90]">{item.description}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#6b7a90]" />
                      </button>
                    ))}
                  </div>

                  {/* Setup Section */}
                  <div className="mt-4 pt-4 border-t border-[#1e2733]">
                    <p className="text-xs text-[#6b7a90] uppercase tracking-wide mb-2">Setup</p>
                    {setupItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setCurrentView(item.id as SettingsView)}
                        className="w-full flex items-center gap-3 py-3 hover:bg-[#151c24] rounded-lg px-2 -mx-2 transition-colors"
                      >
                        <item.icon className="h-5 w-5 text-[#6b7a90]" />
                        <div className="flex-1 text-left">
                          <p className="text-white font-medium">{item.label}</p>
                          <p className="text-xs text-[#6b7a90]">{item.description}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#6b7a90]" />
                      </button>
                    ))}

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 py-3 hover:bg-[#151c24] rounded-lg px-2 -mx-2 transition-colors mt-2"
                    >
                      <LogOut className="h-5 w-5 text-[#6b7a90]" />
                      <span className="text-white font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Security View */}
            {currentView === 'security' && (
              <>
                <div className="flex items-center justify-between px-4 py-4 border-b border-[#1e2733]">
                  <button onClick={goBack} className="flex items-center gap-2 text-white">
                    <ChevronLeft className="h-5 w-5" />
                    <span className="font-medium">Security</span>
                  </button>
                  <button onClick={handleClose} className="p-1 text-[#6b7a90] hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-6">
                  {/* Change Password Section */}
                  <div className="mb-8">
                    <h3 className="text-white font-semibold mb-1">Change password</h3>
                    <p className="text-sm text-[#6b7a90] mb-4">
                      Use a strong password that you don&apos;t use elsewhere
                    </p>
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          placeholder="Current password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white placeholder-[#6b7a90] focus:outline-none focus:border-[#22c55e] pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b7a90] hover:text-white"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="New password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white placeholder-[#6b7a90] focus:outline-none focus:border-[#22c55e] pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b7a90] hover:text-white"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white placeholder-[#6b7a90] focus:outline-none focus:border-[#22c55e] pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b7a90] hover:text-white"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handleSavePassword}
                      disabled={isSaving}
                      className="w-full py-3 mt-4 bg-[#22c55e] text-white font-semibold rounded-lg hover:bg-[#1ea550] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isSaving ? 'Saving...' : 'Save Password'}
                    </button>
                  </div>

                  {/* 2FA Section */}
                  <div className="mb-8">
                    <h3 className="text-white font-semibold mb-1">Two-Factor Authentication</h3>
                    <p className="text-sm text-[#6b7a90] mb-4">
                      Add an extra layer of security to your account. When enabled, you will receive a 6-digit verification code via email each time you sign in.
                    </p>
                    
                    {isLoadingSecurity ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 text-[#22c55e] animate-spin" />
                      </div>
                    ) : (
                      <div className="bg-[#0a0e14] border border-[#1e2733] rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-10 w-10 rounded-lg flex items-center justify-center",
                              twoFactorEnabled ? "bg-[#22c55e]/10" : "bg-[#1e2733]"
                            )}>
                              <Key className={cn(
                                "h-5 w-5",
                                twoFactorEnabled ? "text-[#22c55e]" : "text-[#6b7a90]"
                              )} />
                            </div>
                            <div>
                              <p className="text-white font-medium">Email Verification</p>
                              <p className="text-xs text-[#6b7a90]">
                                {twoFactorEnabled ? 'Enabled - codes sent to your email' : 'Disabled'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={handleToggleTwoFA}
                            disabled={isTogglingTwoFA}
                            className={cn(
                              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50",
                              twoFactorEnabled ? "bg-[#22c55e]" : "bg-[#1e2733]"
                            )}
                          >
                            {isTogglingTwoFA ? (
                              <span className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="h-4 w-4 text-white animate-spin" />
                              </span>
                            ) : (
                              <span
                                className={cn(
                                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                  twoFactorEnabled ? "translate-x-6" : "translate-x-1"
                                )}
                              />
                            )}
                          </button>
                        </div>
                        
                        {twoFactorEnabled && (
                          <div className="mt-3 pt-3 border-t border-[#1e2733]">
                            <p className="text-xs text-[#6b7a90]">
                              A 6-digit verification code will be sent to your registered email address each time you attempt to sign in. This code expires after 10 minutes.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Delete Account Section */}
                  <div>
                    <h3 className="text-white font-semibold mb-1">Delete account</h3>
                    <p className="text-sm text-[#6b7a90] mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button 
                      onClick={() => setDeleteStep('warning')}
                      className="w-full py-3 bg-transparent border border-[#ef4444] text-[#ef4444] font-semibold rounded-lg hover:bg-[#ef4444]/10 transition-colors"
                    >
                      Delete your account
                    </button>
                  </div>
                </div>

                {/* Delete Account Modal */}
                <AnimatePresence>
                  {deleteStep && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 z-10"
                        onClick={deleteStep !== 'success' ? resetDeleteFlow : undefined}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-x-4 top-1/2 -translate-y-1/2 bg-[#0f1419] border border-[#1e2733] rounded-xl p-6 z-20"
                      >
                        {/* Warning Step */}
                        {deleteStep === 'warning' && (
                          <div className="text-center">
                            <div className="h-16 w-16 rounded-full bg-[#ef4444]/10 flex items-center justify-center mx-auto mb-4">
                              <AlertTriangle className="h-8 w-8 text-[#ef4444]" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Delete Your Account?</h3>
                            <p className="text-sm text-[#6b7a90] mb-6">
                              This action cannot be undone. Your profile and preferences will be permanently removed. Transaction history will be retained for regulatory compliance.
                            </p>
                            <div className="flex gap-3">
                              <button
                                onClick={resetDeleteFlow}
                                className="flex-1 py-3 bg-[#1e2733] text-white font-semibold rounded-lg hover:bg-[#2a3441] transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => setDeleteStep('password')}
                                className="flex-1 py-3 bg-[#ef4444] text-white font-semibold rounded-lg hover:bg-[#dc2626] transition-colors"
                              >
                                Continue
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Password Step */}
                        {deleteStep === 'password' && (
                          <div>
                            <div className="flex items-center gap-3 mb-4">
                              <button onClick={() => setDeleteStep('warning')} className="p-1 text-[#6b7a90] hover:text-white">
                                <ChevronLeft className="h-5 w-5" />
                              </button>
                              <h3 className="text-lg font-semibold text-white">Confirm Your Identity</h3>
                            </div>
                            <p className="text-sm text-[#6b7a90] mb-4">
                              Enter your password to verify it&apos;s you. A verification code will be sent to your email.
                            </p>
                            
                            {deleteError && (
                              <div className="flex items-center gap-2 p-3 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg mb-4">
                                <AlertCircle className="h-4 w-4 text-[#ef4444]" />
                                <p className="text-sm text-[#ef4444]">{deleteError}</p>
                              </div>
                            )}

                            <div className="relative mb-4">
                              <input
                                type="password"
                                placeholder="Enter your password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white placeholder-[#6b7a90] focus:outline-none focus:border-[#ef4444]"
                              />
                            </div>

                            <div className="flex gap-3">
                              <button
                                onClick={resetDeleteFlow}
                                className="flex-1 py-3 bg-[#1e2733] text-white font-semibold rounded-lg hover:bg-[#2a3441] transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleDeleteRequestCode}
                                disabled={isDeleting || !deletePassword}
                                className="flex-1 py-3 bg-[#ef4444] text-white font-semibold rounded-lg hover:bg-[#dc2626] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                                {isDeleting ? 'Verifying...' : 'Send Code'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Code Step */}
                        {deleteStep === 'code' && (
                          <div>
                            <div className="flex items-center gap-3 mb-4">
                              <button onClick={() => setDeleteStep('password')} className="p-1 text-[#6b7a90] hover:text-white">
                                <ChevronLeft className="h-5 w-5" />
                              </button>
                              <h3 className="text-lg font-semibold text-white">Enter Verification Code</h3>
                            </div>
                            <p className="text-sm text-[#6b7a90] mb-4">
                              A 6-digit code was sent to <span className="text-white">{deleteMaskedEmail}</span>. Enter it below to permanently delete your account.
                            </p>
                            
                            {deleteError && (
                              <div className="flex items-center gap-2 p-3 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg mb-4">
                                <AlertCircle className="h-4 w-4 text-[#ef4444]" />
                                <p className="text-sm text-[#ef4444]">{deleteError}</p>
                              </div>
                            )}

                            <input
                              type="text"
                              value={deleteCode}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setDeleteCode(val);
                              }}
                              placeholder="Enter 6-digit code"
                              className="w-full h-14 bg-[#0a0e14] border border-[#1e2733] rounded-lg px-4 text-center text-2xl font-mono tracking-[0.5em] text-white placeholder:text-[#6b7a90] placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-[#ef4444] mb-4"
                              autoFocus
                            />

                            <div className="flex gap-3">
                              <button
                                onClick={resetDeleteFlow}
                                className="flex-1 py-3 bg-[#1e2733] text-white font-semibold rounded-lg hover:bg-[#2a3441] transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting || deleteCode.length !== 6}
                                className="flex-1 py-3 bg-[#ef4444] text-white font-semibold rounded-lg hover:bg-[#dc2626] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                                {isDeleting ? 'Deleting...' : 'Delete Account'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Success Step */}
                        {deleteStep === 'success' && (
                          <div className="text-center">
                            <div className="h-16 w-16 rounded-full bg-[#22c55e]/10 flex items-center justify-center mx-auto mb-4">
                              <CheckCircle2 className="h-8 w-8 text-[#22c55e]" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Account Deleted</h3>
                            <p className="text-sm text-[#6b7a90]">
                              Your account has been successfully deleted. You will be signed out shortly.
                            </p>
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </>
            )}

            {/* Personal View */}
            {currentView === 'personal' && (
              <>
                <div className="flex items-center justify-between px-4 py-4 border-b border-[#1e2733]">
                  <button onClick={goBack} className="flex items-center gap-2 text-white">
                    <ChevronLeft className="h-5 w-5" />
                    <span className="font-medium">Personal Information</span>
                  </button>
                  <button onClick={handleClose} className="p-1 text-[#6b7a90] hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-6">
                  {isLoadingProfile ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 text-[#22c55e] animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Avatar Upload */}
                      <div className="flex flex-col items-center mb-6">
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                        <button
                          onClick={() => avatarInputRef.current?.click()}
                          className="relative group"
                        >
                          {avatar ? (
                            <div className="h-24 w-24 rounded-full overflow-hidden">
                              <Image 
                                src={avatar} 
                                alt="Avatar" 
                                width={96} 
                                height={96} 
                                className="object-cover w-full h-full" 
                              />
                            </div>
                          ) : (
                            <div className="h-24 w-24 rounded-full bg-[#22c55e] flex items-center justify-center text-white font-bold text-2xl">
                              {getInitials(user.name)}
                            </div>
                          )}
                          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="h-6 w-6 text-white" />
                          </div>
                        </button>
                        <p className="text-sm text-[#6b7a90] mt-2">Click to change photo</p>
                      </div>

                      <div>
                        <label className="block text-sm text-[#6b7a90] mb-1">First Name</label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Enter your first name"
                          className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white placeholder-[#6b7a90] focus:outline-none focus:border-[#22c55e]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[#6b7a90] mb-1">Last Name</label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Enter your last name"
                          className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white placeholder-[#6b7a90] focus:outline-none focus:border-[#22c55e]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[#6b7a90] mb-1">Phone Number</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Enter your phone number"
                          className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white placeholder-[#6b7a90] focus:outline-none focus:border-[#22c55e]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[#6b7a90] mb-1">Country</label>
                        <select
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]"
                        >
                          <option value="">Select your country</option>
                          {countries.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <button 
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="w-full py-3 bg-[#22c55e] text-white font-semibold rounded-lg hover:bg-[#1ea550] transition-colors mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Payments View */}
            {currentView === 'payments' && (
              <>
                <div className="flex items-center justify-between px-4 py-4 border-b border-[#1e2733]">
                  <button onClick={goBack} className="flex items-center gap-2 text-white">
                    <ChevronLeft className="h-5 w-5" />
                    <span className="font-medium">Payments</span>
                  </button>
                  <button onClick={handleClose} className="p-1 text-[#6b7a90] hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-6">
                  <a
                    href="/deposit"
                    className="block w-full py-4 px-4 bg-[#0a0e14] border border-[#1e2733] rounded-lg mb-3 hover:border-[#22c55e] transition-colors"
                  >
                    <p className="text-white font-medium">Deposit Funds</p>
                    <p className="text-sm text-[#6b7a90]">Add money to your account</p>
                  </a>
                  <a
                    href="/withdraw"
                    className="block w-full py-4 px-4 bg-[#0a0e14] border border-[#1e2733] rounded-lg hover:border-[#22c55e] transition-colors"
                  >
                    <p className="text-white font-medium">Withdraw Funds</p>
                    <p className="text-sm text-[#6b7a90]">Transfer money to your bank</p>
                  </a>
                </div>
              </>
            )}

            {/* Account View */}
            {currentView === 'account' && (
              <>
                <div className="flex items-center justify-between px-4 py-4 border-b border-[#1e2733]">
                  <button onClick={goBack} className="flex items-center gap-2 text-white">
                    <ChevronLeft className="h-5 w-5" />
                    <span className="font-medium">Account Settings</span>
                  </button>
                  <button onClick={handleClose} className="p-1 text-[#6b7a90] hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-[#6b7a90] mb-1">Language</label>
                      <select className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]">
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-[#6b7a90] mb-1">Currency</label>
                      <select className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]">
                        <option value="usd">USD ($)</option>
                        <option value="eur">EUR (€)</option>
                        <option value="gbp">GBP (£)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-[#6b7a90] mb-1">Timezone</label>
                      <select className="w-full px-4 py-3 bg-[#0a0e14] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#22c55e]">
                        <option value="utc">UTC</option>
                        <option value="est">EST (UTC-5)</option>
                        <option value="pst">PST (UTC-8)</option>
                        <option value="gmt">GMT</option>
                      </select>
                    </div>
                    <button className="w-full py-3 bg-[#22c55e] text-white font-semibold rounded-lg hover:bg-[#1ea550] transition-colors mt-4">
                      Save Changes
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Toast Messages */}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
              <AnimatePresence>
                {toasts.map((toast) => (
                  <motion.div
                    key={toast.id}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl min-w-[250px]',
                      toast.type === 'success' && 'bg-[#22c55e] text-white',
                      toast.type === 'error' && 'bg-[#ef4444] text-white'
                    )}
                  >
                    {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <span className="text-sm font-medium">{toast.message}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default SettingsPanel;
