'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Shield,
  Key,
  Smartphone,
  Monitor,
  LogOut,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/utils';

// ============================================
// Security Section Component
// ============================================

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: Date;
  isCurrent: boolean;
}

const mockSessions: Session[] = [
  {
    id: '1',
    device: 'MacBook Pro',
    browser: 'Chrome 120',
    location: 'New York, US',
    ip: '192.168.1.1',
    lastActive: new Date(),
    isCurrent: true,
  },
  {
    id: '2',
    device: 'iPhone 15',
    browser: 'Safari',
    location: 'New York, US',
    ip: '192.168.1.2',
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isCurrent: false,
  },
  {
    id: '3',
    device: 'Windows PC',
    browser: 'Firefox 121',
    location: 'Boston, US',
    ip: '192.168.1.3',
    lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isCurrent: false,
  },
];

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export const SecuritySection: React.FC = () => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [sessions, setSessions] = useState<Session[]>(mockSessions);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsChangingPassword(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsChangingPassword(false);
    setPasswordChanged(true);
    reset();
    setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordChanged(false);
    }, 1500);
  };

  const handleEnable2FA = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIs2FAEnabled(true);
    setShow2FAModal(false);
  };

  const handleRevokeSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const handleRevokeAllSessions = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
  };

  const formatLastActive = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 5) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--color-text-primary)]">
                Change your password
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Last changed 30 days ago
              </p>
            </div>
            <Button variant="secondary" onClick={() => setShowPasswordModal(true)}>
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[var(--color-text-primary)]">
                  Two-Factor Authentication
                </p>
                <Badge variant={is2FAEnabled ? 'success' : 'warning'} size="sm">
                  {is2FAEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <p className="text-sm text-[var(--color-text-muted)]">
                {is2FAEnabled
                  ? 'Your account is protected with 2FA'
                  : 'Add an extra layer of security to your account'}
              </p>
            </div>
            <Button
              variant={is2FAEnabled ? 'secondary' : 'primary'}
              onClick={() => setShow2FAModal(true)}
            >
              {is2FAEnabled ? 'Manage 2FA' : 'Enable 2FA'}
            </Button>
          </div>

          {!is2FAEnabled && (
            <div className="mt-4 p-4 bg-[var(--color-warning-bg)] border border-[var(--color-warning)]/20 rounded-xl">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-[var(--color-warning)] shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[var(--color-warning)]">
                    Recommended Security Measure
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">
                    Enable two-factor authentication to protect your account from unauthorized access.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          {sessions.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-[var(--color-error)]"
              onClick={handleRevokeAllSessions}
            >
              Revoke All Other Sessions
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 bg-[var(--color-surface-elevated)] rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'h-10 w-10 rounded-lg flex items-center justify-center',
                    session.device.includes('iPhone') || session.device.includes('Android')
                      ? 'bg-[var(--color-info-bg)]'
                      : 'bg-[var(--color-primary-muted)]'
                  )}>
                    {session.device.includes('iPhone') || session.device.includes('Android') ? (
                      <Smartphone className="h-5 w-5 text-[var(--color-info)]" />
                    ) : (
                      <Monitor className="h-5 w-5 text-[var(--color-primary)]" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[var(--color-text-primary)]">
                        {session.device}
                      </p>
                      {session.isCurrent && (
                        <Badge variant="success" size="sm">Current</Badge>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {session.browser} • {session.location}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {formatLastActive(session.lastActive)} • IP: {session.ip}
                    </p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[var(--color-error)]"
                    onClick={() => handleRevokeSession(session.id)}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
      >
        {passwordChanged ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[var(--color-success-bg)] mb-4">
              <Check className="h-8 w-8 text-[var(--color-success)]" />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
              Password Changed!
            </h3>
            <p className="text-[var(--color-text-muted)]">
              Your password has been updated successfully.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
            <div className="relative">
              <Input
                label="Current Password"
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Enter current password"
                error={errors.currentPassword?.message}
                {...register('currentPassword')}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-9 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                error={errors.newPassword?.message}
                {...register('newPassword')}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-9 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Confirm new password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" isLoading={isChangingPassword}>
                Change Password
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* 2FA Modal */}
      <Modal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        title={is2FAEnabled ? 'Manage Two-Factor Authentication' : 'Enable Two-Factor Authentication'}
      >
        <div className="space-y-6">
          {!is2FAEnabled ? (
            <>
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[var(--color-primary-muted)] mb-4">
                  <Shield className="h-8 w-8 text-[var(--color-primary)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                  Secure Your Account
                </h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Two-factor authentication adds an extra layer of security by requiring a code from your phone in addition to your password.
                </p>
              </div>

              <div className="p-4 bg-[var(--color-surface-elevated)] rounded-xl">
                <div className="flex items-center justify-center mb-4">
                  <div className="h-32 w-32 bg-white rounded-lg flex items-center justify-center">
                    {/* QR Code Placeholder */}
                    <div className="grid grid-cols-5 gap-1">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            'h-5 w-5',
                            Math.random() > 0.5 ? 'bg-black' : 'bg-white'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-center text-sm text-[var(--color-text-muted)]">
                  Scan this QR code with your authenticator app
                </p>
              </div>

              <Input
                label="Verification Code"
                placeholder="Enter 6-digit code"
                maxLength={6}
              />

              <Button fullWidth onClick={handleEnable2FA}>
                Enable 2FA
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 bg-[var(--color-success-bg)] rounded-xl">
                <Check className="h-6 w-6 text-[var(--color-success)]" />
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">
                    2FA is enabled
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Your account is protected with two-factor authentication.
                  </p>
                </div>
              </div>

              <Button
                variant="secondary"
                fullWidth
                className="text-[var(--color-error)]"
                onClick={() => {
                  setIs2FAEnabled(false);
                  setShow2FAModal(false);
                }}
              >
                Disable 2FA
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default SecuritySection;
