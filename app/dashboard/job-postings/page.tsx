'use client';

import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';

type Job = {
  id: string;
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  otherNotes: string | null;
  status: 'open' | 'closed';
  createdAt: string;
};

export default function AdminJobPostingsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [otherNotes, setOtherNotes] = useState('');
  const [expandedJobId, setExpandedJobId] = useState('');
  const [editingJobId, setEditingJobId] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/job-postings', { cache: 'no-store' });
    const data = await res.json();
    setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
    setLoading(false);
  };

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  const isEditing = Boolean(editingJobId);

  const resetForm = () => {
    setEditingJobId('');
    setTitle('');
    setDescription('');
    setRequirements('');
    setResponsibilities('');
    setOtherNotes('');
  };

  const createOrUpdateJob = async () => {
    if (!title.trim() || !description.trim() || !requirements.trim() || !responsibilities.trim()) return;
    await fetch('/api/admin/job-postings', {
      method: isEditing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        isEditing
          ? { id: editingJobId, title, description, requirements, responsibilities, otherNotes }
          : { title, description, requirements, responsibilities, otherNotes }
      ),
    });
    resetForm();
    await load();
  };

  const startEdit = (job: Job) => {
    setEditingJobId(job.id);
    setTitle(job.title);
    setDescription(job.description);
    setRequirements(job.requirements);
    setResponsibilities(job.responsibilities);
    setOtherNotes(job.otherNotes || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleStatus = async (job: Job) => {
    await fetch('/api/admin/job-postings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: job.id, status: job.status === 'open' ? 'closed' : 'open' }),
    });
    await load();
  };

  const removeJob = async (id: string) => {
    if (!window.confirm('Delete this job posting?')) return;
    await fetch('/api/admin/job-postings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await load();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900/60 p-4 md:p-6">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Job Postings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create and manage open instructor roles.</p>
        </div>
        <Link
          href="/dashboard/instructor-applications"
          className="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-sm font-medium"
        >
          View Instructor CV Applications
        </Link>
      </div>

      <div className="admin-surface mt-5 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Job title" className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-700" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Job description" className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-700" />
        <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={2} placeholder="Requirements (required)" className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-700" />
        <textarea value={responsibilities} onChange={(e) => setResponsibilities(e.target.value)} rows={2} placeholder="Responsibilities (required)" className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-700" />
        <textarea value={otherNotes} onChange={(e) => setOtherNotes(e.target.value)} rows={2} placeholder="Other notes (optional)" className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-700" />
        <div className="flex items-center gap-2">
          <button onClick={createOrUpdateJob} className="px-4 py-2 rounded bg-blue-50 text-blue-700 border border-blue-200">
            {isEditing ? 'Save Changes' : 'Publish Job'}
          </button>
          {isEditing && (
            <button onClick={resetForm} className="px-4 py-2 rounded border border-slate-300 dark:border-slate-700">
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      <div className="admin-surface mt-5 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-6 text-slate-500">Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="p-6 text-slate-500">No job postings yet.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <Fragment key={job.id}>
                  <tr className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-4">
                      <button
                        onClick={() => setExpandedJobId((prev) => (prev === job.id ? '' : job.id))}
                        className="font-semibold text-blue-700 dark:text-blue-300 hover:underline text-left"
                      >
                        {job.title}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          job.status === 'open'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap">{new Date(job.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEdit(job)} className="px-3 py-1.5 rounded border border-blue-200 text-blue-700 bg-blue-50">
                          Edit
                        </button>
                        <button onClick={() => toggleStatus(job)} className="px-3 py-1.5 rounded border border-slate-300">
                          {job.status === 'open' ? 'Close' : 'Reopen'}
                        </button>
                        <button onClick={() => removeJob(job.id)} className="px-3 py-1.5 rounded border border-red-200 text-red-700 bg-red-50">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedJobId === job.id && (
                    <tr className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
                      <td colSpan={4} className="px-4 py-4">
                        <p className="text-xs text-slate-500 whitespace-pre-line"><strong>Description:</strong>{'\n'}{job.description}</p>
                        <p className="text-xs text-slate-500 mt-2 whitespace-pre-line"><strong>Requirements:</strong>{'\n'}{job.requirements}</p>
                        <p className="text-xs text-slate-500 mt-2 whitespace-pre-line"><strong>Responsibilities:</strong>{'\n'}{job.responsibilities}</p>
                        {job.otherNotes ? <p className="text-xs text-slate-500 mt-2 whitespace-pre-line"><strong>Other notes:</strong>{'\n'}{job.otherNotes}</p> : null}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
