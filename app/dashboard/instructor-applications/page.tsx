'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type ApplicationStatus = 'pending' | 'reviewed' | 'accepted' | 'rejected';

type ApplicationRow = {
  id: string;
  fullName: string;
  email: string;
  jobPostingId: string | null;
  jobTitle: string | null;
  phone: string | null;
  bio: string | null;
  cvFileUrl: string;
  status: ApplicationStatus;
  reviewerName: string | null;
  reviewedAt: string | null;
  adminNotes: string | null;
  createdAt: string;
};

export default function AdminInstructorApplicationsPage() {
  const [items, setItems] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationStatus>('all');
  const [query, setQuery] = useState('');
  const [savingId, setSavingId] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      params.set('status', statusFilter);
      if (query.trim()) params.set('q', query.trim());
      const res = await fetch(`/api/admin/instructor-applications?${params.toString()}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load applications');
      const normalized: ApplicationRow[] = Array.isArray(data?.applications)
        ? data.applications.map((item: ApplicationRow) => ({
            ...item,
            status:
              item.status === 'pending' && item.reviewedAt
                ? 'reviewed'
                : item.status,
          }))
        : [];
      setItems(normalized);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, query]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (x) => x.fullName.toLowerCase().includes(q) || x.email.toLowerCase().includes(q)
    );
  }, [items, query]);
  const filteredCount = filtered.length;

  async function updateStatus(id: string, status: ApplicationStatus, adminNotes: string) {
    try {
      setSavingId(id);
      const res = await fetch('/api/admin/instructor-applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, adminNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to update application');
      if (data?.emailMessage) {
        alert(data.emailMessage);
      }
      await load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update application';
      alert(message);
    } finally {
      setSavingId('');
    }
  }

  async function updateStatusWithEmail(
    id: string,
    status: ApplicationStatus,
    adminNotes: string,
    emailSubject: string,
    emailBody: string
  ) {
    try {
      setSavingId(id);
      const res = await fetch('/api/admin/instructor-applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, adminNotes, emailSubject, emailBody }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to update application');
      if (data?.emailSent === false && data?.emailMessage) {
        alert(data.emailMessage);
      }
      await load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update application';
      alert(message);
    } finally {
      setSavingId('');
    }
  }

  async function deleteApplication(id: string) {
    const ok = window.confirm('Are you sure you want to delete this application?');
    if (!ok) return;

    try {
      setSavingId(id);
      const res = await fetch('/api/admin/instructor-applications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to delete application');
      await load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete application';
      alert(message);
    } finally {
      setSavingId('');
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900/60 p-3 sm:p-4 md:p-6 transition-colors duration-300">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Instructor CV Applications</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review CV submissions and set their status.
        </p>
      </div>

      <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | ApplicationStatus)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={load}
            className="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400" />
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
            Applications List <span className="text-gray-400 font-normal">({filteredCount})</span>
          </p>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No applications yet.</div>
        ) : (
          <>
            <div className="md:hidden p-3 space-y-3">
              {filtered.map((item) => (
                <ApplicationCardItem
                  key={`mobile-${item.id}`}
                  item={item}
                  saving={savingId === item.id}
                  onSave={updateStatus}
                  onSaveWithEmail={updateStatusWithEmail}
                  onDelete={deleteApplication}
                />
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full table-auto text-sm">
              <thead className="bg-white dark:bg-slate-900/60">
                <tr className="text-left text-slate-600 dark:text-slate-300">
                  <th className="px-4 py-3 font-medium">Applicant</th>
                  <th className="px-4 py-3 font-medium">Job</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">CV</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((item) => (
                  <ApplicationRowItem
                    key={item.id}
                    item={item}
                    saving={savingId === item.id}
                    onSave={updateStatus}
                    onSaveWithEmail={updateStatusWithEmail}
                    onDelete={deleteApplication}
                  />
                ))}
              </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ApplicationCardItem({
  item,
  saving,
  onSave,
  onSaveWithEmail,
  onDelete,
}: {
  item: ApplicationRow;
  saving: boolean;
  onSave: (id: string, status: ApplicationStatus, adminNotes: string) => Promise<void>;
  onSaveWithEmail: (
    id: string,
    status: ApplicationStatus,
    adminNotes: string,
    emailSubject: string,
    emailBody: string
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [status, setStatus] = useState<ApplicationStatus>(item.status);
  const [adminNotes, setAdminNotes] = useState(item.adminNotes || '');
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const openEmailComposer = () => {
    const isAccepted = status === 'accepted';
    const subject = isAccepted
      ? 'Aivora Instructor Application - Interview Invitation'
      : 'Aivora Instructor Application - Update';
    const body = isAccepted
      ? `Hello ${item.fullName},

Thank you for applying to join Aivora as an instructor.
Your application has been accepted for the interview stage.

Meeting details:
${adminNotes || '[Add meeting details here]'}

Best regards,
Aivora Team`
      : `Hello ${item.fullName},

Thank you for your interest in joining Aivora as an instructor.
After review, we are unable to move forward with your application at this time.

${adminNotes ? `Additional note:\n${adminNotes}\n\n` : ''}Best regards,
Aivora Team`;
    setEmailSubject(subject);
    setEmailBody(body);
    setShowEmailComposer(true);
  };

  const handleSaveClick = () => {
    if (status === 'accepted' || status === 'rejected') {
      openEmailComposer();
      return;
    }
    onSave(item.id, status, adminNotes);
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-3">
      <p className="font-semibold text-slate-900 dark:text-slate-100">{item.fullName}</p>
      <p className="text-xs text-slate-500 mt-0.5">{item.bio || 'No bio provided'}</p>
      <p className="text-sm mt-2">{item.jobTitle || 'General Application'}</p>
      <p className="text-sm mt-2">{item.email}</p>
      <p className="text-xs text-slate-500">{item.phone || 'No phone'}</p>
      <a href={item.cvFileUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
        Open CV
      </a>
      <div className="mt-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
          className="w-full px-2 py-1.5 text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/70"
        >
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <textarea
        value={adminNotes}
        onChange={(e) => setAdminNotes(e.target.value)}
        rows={2}
        className="mt-2 w-full px-2 py-1.5 text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/70"
        placeholder={
          status === 'accepted'
            ? 'Meeting details to send by email'
            : status === 'rejected'
              ? 'Optional rejection note to send by email'
              : 'Internal notes'
        }
      />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          onClick={handleSaveClick}
          disabled={saving}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 text-xs transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={() => onDelete(item.id)}
          disabled={saving}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 text-xs transition-colors disabled:opacity-60"
        >
          Delete
        </button>
      </div>
      <div className="mt-2 text-[11px] text-slate-500">
        <p>{new Date(item.createdAt).toLocaleString()}</p>
        {item.reviewedAt && <p>Reviewed: {new Date(item.reviewedAt).toLocaleString()}</p>}
        {item.reviewerName && <p>By: {item.reviewerName}</p>}
      </div>

      {showEmailComposer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Email Preview Before Sending
            </h3>
            <input
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="mt-3 w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/70"
              placeholder="Email subject"
            />
            <textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={12}
              className="mt-2 w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/70"
              placeholder="Email body"
            />
            <div className="mt-3 flex items-center gap-2 justify-end">
              <button
                onClick={() => setShowEmailComposer(false)}
                className="px-3 py-2 rounded border border-slate-300 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onSaveWithEmail(item.id, status, adminNotes, emailSubject, emailBody);
                  setShowEmailComposer(false);
                }}
                className="px-3 py-2 rounded bg-blue-50 text-blue-700 border border-blue-200"
              >
                Confirm & Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ApplicationRowItem({
  item,
  saving,
  onSave,
  onSaveWithEmail,
  onDelete,
}: {
  item: ApplicationRow;
  saving: boolean;
  onSave: (id: string, status: ApplicationStatus, adminNotes: string) => Promise<void>;
  onSaveWithEmail: (
    id: string,
    status: ApplicationStatus,
    adminNotes: string,
    emailSubject: string,
    emailBody: string
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [status, setStatus] = useState<ApplicationStatus>(item.status);
  const [adminNotes, setAdminNotes] = useState(item.adminNotes || '');
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const openEmailComposer = () => {
    const isAccepted = status === 'accepted';
    const subject = isAccepted
      ? 'Aivora Instructor Application - Interview Invitation'
      : 'Aivora Instructor Application - Update';
    const body = isAccepted
      ? `Hello ${item.fullName},

Thank you for applying to join Aivora as an instructor.
Your application has been accepted for the interview stage.

Meeting details:
${adminNotes || '[Add meeting details here]'}

Best regards,
Aivora Team`
      : `Hello ${item.fullName},

Thank you for your interest in joining Aivora as an instructor.
After review, we are unable to move forward with your application at this time.

${adminNotes ? `Additional note:\n${adminNotes}\n\n` : ''}Best regards,
Aivora Team`;
    setEmailSubject(subject);
    setEmailBody(body);
    setShowEmailComposer(true);
  };

  const handleSaveClick = () => {
    if (status === 'accepted' || status === 'rejected') {
      openEmailComposer();
      return;
    }
    onSave(item.id, status, adminNotes);
  };

  return (
    <>
    <tr className="hover:bg-white dark:hover:bg-slate-800/40 transition-colors">
      <td className="px-4 py-4">
        <p className="font-semibold text-slate-900 dark:text-slate-100">{item.fullName}</p>
        <p className="text-xs text-slate-500">{item.bio || 'No bio provided'}</p>
      </td>
      <td className="px-4 py-4">
        <p>{item.jobTitle || 'General Application'}</p>
      </td>
      <td className="px-4 py-4">
        <p>{item.email}</p>
        <p className="text-xs text-slate-500">{item.phone || 'No phone'}</p>
      </td>
      <td className="px-4 py-4">
        <a
          href={item.cvFileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Open CV
        </a>
      </td>
      <td className="px-4 py-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
          className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/70"
        >
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-start gap-2">
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={2}
            className="w-56 max-w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/70"
            placeholder={
              status === 'accepted'
                ? 'Meeting details to send by email'
                : status === 'rejected'
                  ? 'Optional rejection note to send by email'
                  : 'Internal notes'
            }
          />
          <button
            onClick={handleSaveClick}
            disabled={saving}
            className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => onDelete(item.id)}
            disabled={saving}
            className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      </td>
      <td className="px-4 py-4 text-xs text-slate-500">
        <p>{new Date(item.createdAt).toLocaleString()}</p>
        {item.reviewedAt && <p>Reviewed: {new Date(item.reviewedAt).toLocaleString()}</p>}
        {item.reviewerName && <p>By: {item.reviewerName}</p>}
      </td>

    </tr>
    {showEmailComposer && (
      <tr>
        <td colSpan={7} className="p-0">
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Email Preview Before Sending
              </h3>
              <input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="mt-3 w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/70"
                placeholder="Email subject"
              />
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={12}
                className="mt-2 w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/70"
                placeholder="Email body"
              />
              <div className="mt-3 flex items-center gap-2 justify-end">
                <button
                  onClick={() => setShowEmailComposer(false)}
                  className="px-3 py-2 rounded border border-slate-300 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await onSaveWithEmail(item.id, status, adminNotes, emailSubject, emailBody);
                    setShowEmailComposer(false);
                  }}
                  className="px-3 py-2 rounded bg-blue-50 text-blue-700 border border-blue-200"
                >
                  Confirm & Send
                </button>
              </div>
            </div>
          </div>
        </td>
      </tr>
    )}
    </>
  );
}
