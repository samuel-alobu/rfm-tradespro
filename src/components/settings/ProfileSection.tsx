'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Check, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/utils';

// ============================================
// Profile Section Component
// ============================================

interface ProfileSectionProps {
  user?: {
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    country?: string;
    timezone?: string;
  };
  onSave?: (data: ProfileFormData) => void;
}

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  user = {
    name: 'Tracy Rivera',
    email: 'tracy.rivera@example.com',
    phone: '+1 (555) 123-4567',
    country: 'United States',
    timezone: 'America/New_York',
  },
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const nameParts = user.name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName,
      lastName,
      email: user.email,
      phone: user.phone || '',
      country: user.country || '',
      timezone: user.timezone || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onSave?.(data);
    setIsSaving(false);
    setSaved(true);
    setIsEditing(false);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Profile Information</CardTitle>
        {!isEditing && (
          <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar
                src={user.avatar}
                fallback={user.name.slice(0, 2)}
                size="xl"
                className="h-20 w-20"
              />
              {isEditing && (
                <button
                  type="button"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white hover:bg-[var(--color-primary-dark)] transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </button>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {user.name}
              </h3>
              <p className="text-sm text-[var(--color-text-muted)]">{user.email}</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="Enter first name"
              disabled={!isEditing}
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Last Name"
              placeholder="Enter last name"
              disabled={!isEditing}
              error={errors.lastName?.message}
              {...register('lastName')}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter email"
              disabled={!isEditing}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Phone Number"
              type="tel"
              placeholder="Enter phone number"
              disabled={!isEditing}
              error={errors.phone?.message}
              {...register('phone')}
            />
            <Input
              label="Country"
              placeholder="Select country"
              disabled={!isEditing}
              error={errors.country?.message}
              {...register('country')}
            />
            <Input
              label="Timezone"
              placeholder="Select timezone"
              disabled={!isEditing}
              error={errors.timezone?.message}
              {...register('timezone')}
            />
          </div>

          {/* Actions */}
          {isEditing && (
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isSaving}>
                Save Changes
              </Button>
            </div>
          )}

          {saved && (
            <div className="flex items-center gap-2 text-[var(--color-success)]">
              <Check className="h-4 w-4" />
              <span className="text-sm">Profile updated successfully</span>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileSection;
