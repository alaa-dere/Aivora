'use client';

import { useEffect, useState } from 'react';
import {
  UserCircleIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

type StudentProfile = {
  id: string;
  fullName: string;
  email: string;
  status: 'active' | 'inactive';
  role: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US');
};

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const res = await fetch('/api/student/profile', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || 'Failed to load profile');
        }
        if (mounted) {
          setProfile(data.student);
          setFullName(data.student.fullName || '');
          setEmail(data.student.email || '');
        }
      } catch (err: any) {
        if (mounted) {
          setError(err?.message || 'Failed to load profile');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    if (!fullName.trim() || !email.trim()) {
      setError('Full name and email are required.');
      return;
    }

    if (newPassword || currentPassword || confirmPassword) {
      const errors: typeof fieldErrors = {};
      if (!currentPassword) {
        errors.currentPassword = 'Current password is required.';
      }
      if (!newPassword || newPassword.length < 6) {
        errors.newPassword = 'New password must be at least 6 characters.';
      }
      if (newPassword !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
      }
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setError('Please fix the password fields below.');
        return;
      }
    }

    try {
      setSaving(true);
      const payload: any = {
        fullName: fullName.trim(),
        email: email.trim(),
      };

      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Failed to update profile');
      }

      setProfile(data.student);
      setSuccess('Profile updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err?.message || 'Failed to update profile';
      if (msg.toLowerCase().includes('current password')) {
        setFieldErrors((prev) => ({
          ...prev,
          currentPassword: msg,
        }));
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSelect = (file: File | null) => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    if (!file) {
      setPhotoFile(null);
      setPhotoPreview('');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      setFieldErrors({});
      setPhotoFile(null);
      setPhotoPreview('');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be 5MB or smaller.');
      setFieldErrors({});
      setPhotoFile(null);
      setPhotoPreview('');
      return;
    }

    setError('');
    setFieldErrors({});
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return;

    try {
      setPhotoUploading(true);
      setError('');
      setSuccess('');
      setFieldErrors({});
      const payload = new FormData();
      payload.append('image', photoFile);

      const res = await fetch('/api/student/profile/photo', {
        method: 'POST',
        body: payload,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Failed to upload photo');
      }

      setProfile(data.student);
      setPhotoFile(null);
      setPhotoPreview('');
      setSuccess('Profile photo updated.');
    } catch (err: any) {
      setError(err?.message || 'Failed to upload photo');
    } finally {
      setPhotoUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-4 md:p-6 transition-colors duration-300">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
          Profile
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal details and security settings.
        </p>
      </div>

      {loading && (
        <div className="portal-surface bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-10 text-center text-gray-500 dark:text-gray-300">
          Loading your profile...
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 dark:bg-red-900/30 rounded-xl border border-red-200 dark:border-red-800 p-4 text-center text-red-700 dark:text-red-200 flex items-center justify-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5" />
          {error}
        </div>
      )}

      {!loading && profile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="portal-surface bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center overflow-hidden">
                  {profile.imageUrl ? (
                    <img
                      src={profile.imageUrl}
                      alt="Profile photo"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="w-8 h-8 text-sky-600 dark:text-sky-400" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-800 dark:text-white">
                    {profile.fullName}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{profile.email}</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Profile Photo
                </label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Selected preview"
                        className="h-full w-full object-cover"
                      />
                    ) : profile.imageUrl ? (
                      <img
                        src={profile.imageUrl}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={(e) => handlePhotoSelect(e.target.files?.[0] || null)}
                      className="text-sm text-gray-600 dark:text-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handlePhotoUpload}
                      disabled={!photoFile || photoUploading}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800 transition disabled:opacity-60"
                    >
                      {photoUploading ? 'Uploading...' : 'Upload Photo'}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  JPG, PNG, or WebP up to 5MB.
                </p>
              </div>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Status</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      profile.status === 'inactive'
                        ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                        : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                    }`}
                  >
                    {profile.status === 'inactive' ? 'Inactive' : 'Active'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Role</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-200 dark:border-sky-800">
                    {profile.role || 'Student'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Joined</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {formatDate(profile.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Last Updated</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {formatDate(profile.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="portal-surface bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-6 space-y-6"
            >
              <div className="flex items-center gap-2">
                <UserCircleIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Personal Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    type="text"
                    className="portal-surface w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700 outline-none"
                    placeholder="Your name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    className="portal-surface w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700 outline-none"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <KeyIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                    Change Password
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Current Password
                    </label>
                    <input
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        if (fieldErrors.currentPassword) {
                          setFieldErrors((prev) => ({ ...prev, currentPassword: undefined }));
                        }
                      }}
                      type="password"
                      className={`w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-900 outline-none ${
                        fieldErrors.currentPassword
                          ? 'border-red-400 focus:ring-2 focus:ring-red-300'
                          : 'border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700'
                      }`}
                      placeholder="••••••••"
                    />
                    {fieldErrors.currentPassword && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.currentPassword}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      New Password
                    </label>
                    <input
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (fieldErrors.newPassword) {
                          setFieldErrors((prev) => ({ ...prev, newPassword: undefined }));
                        }
                      }}
                      type="password"
                      className={`w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-900 outline-none ${
                        fieldErrors.newPassword
                          ? 'border-red-400 focus:ring-2 focus:ring-red-300'
                          : 'border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700'
                      }`}
                      placeholder="At least 6 characters"
                    />
                    {fieldErrors.newPassword && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.newPassword}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Confirm Password
                    </label>
                    <input
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (fieldErrors.confirmPassword) {
                          setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                        }
                      }}
                      type="password"
                      className={`w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-900 outline-none ${
                        fieldErrors.confirmPassword
                          ? 'border-red-400 focus:ring-2 focus:ring-red-300'
                          : 'border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700'
                      }`}
                      placeholder="Re-enter new password"
                    />
                    {fieldErrors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>

              {success && (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-200 px-4 py-3 text-sm">
                  <CheckCircleIcon className="w-5 h-5" />
                  {success}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800 transition disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
