'use client';

import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import { EyeIcon } from '@heroicons/react/24/outline';

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const jobsCount = jobs.length;

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

  const openDeleteModal = (job: Job) => {
    setJobToDelete(job);
    setIsDeleteModalOpen(true);
  };

  const removeJob = async () => {
    if (!jobToDelete) return;
    await fetch('/api/admin/job-postings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: jobToDelete.id }),
    });
    setIsDeleteModalOpen(false);
    setJobToDelete(null);
    await load();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900/60 p-3 sm:p-4 md:p-6 transition-colors duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Job Postings</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Create and manage open instructor roles.</p>
        </div>
        <Link
          href="/dashboard/instructor-applications"
          className="
            group inline-flex items-center justify-center gap-2
            w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl
            bg-emerald-100 hover:bg-emerald-200
            text-emerald-700 font-semibold text-xs sm:text-sm
            shadow-sm border border-emerald-200
            dark:bg-emerald-900/30 dark:hover:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-800
            transition-all duration-200 active:scale-95
            whitespace-nowrap
          "
        >
          <EyeIcon className="w-5 h-5" />
          View Instructor CV
        </Link>
      </div>

      <div className="admin-surface mt-4 sm:mt-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/75 p-3 sm:p-4 space-y-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Job title" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 text-sm" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Job description" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 text-sm" />
        <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={2} placeholder="Requirements (required)" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 text-sm" />
        <textarea value={responsibilities} onChange={(e) => setResponsibilities(e.target.value)} rows={2} placeholder="Responsibilities (required)" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 text-sm" />
        <textarea value={otherNotes} onChange={(e) => setOtherNotes(e.target.value)} rows={2} placeholder="Other notes (optional)" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 text-sm" />
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button onClick={createOrUpdateJob} className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-sm transition-colors">
            {isEditing ? 'Save Changes' : 'Publish Job'}
          </button>
          {isEditing && (
            <button onClick={resetForm} className="w-full sm:w-auto px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-sm transition-colors">
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      <div className="admin-surface relative overflow-hidden mt-4 sm:mt-5 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/75 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400" />
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
            Job Postings <span className="text-gray-400 font-normal">({jobsCount})</span>
          </p>
        </div>
        {loading ? (
          <div className="p-6 text-slate-500">Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="p-6 text-slate-500">No job postings yet.</div>
        ) : (
          <>
            <div className="md:hidden p-3 space-y-3">
              {jobs.map((job) => (
                <div key={`mobile-${job.id}`} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-900/50">
                  <button
                    onClick={() => setExpandedJobId((prev) => (prev === job.id ? '' : job.id))}
                    className="font-semibold text-base text-blue-700 dark:text-blue-300 text-left"
                  >
                    {job.title}
                  </button>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                        job.status === 'open'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {job.status}
                    </span>
                    <span className="text-[11px] text-slate-500">{new Date(job.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    <button onClick={() => startEdit(job)} className="px-2 py-1.5 rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 text-xs transition-colors">
                      Edit
                    </button>
                    <button onClick={() => toggleStatus(job)} className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs transition-colors">
                      {job.status === 'open' ? 'Close' : 'Reopen'}
                    </button>
                    <button onClick={() => openDeleteModal(job)} className="px-2 py-1.5 rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 text-xs transition-colors">
                      Delete
                    </button>
                  </div>
                  {expandedJobId === job.id && (
                    <div className="mt-3 border-t border-slate-200 dark:border-slate-700 pt-3">
                      <p className="text-xs text-slate-500 whitespace-pre-line"><strong>Description:</strong>{'\n'}{job.description}</p>
                      <p className="text-xs text-slate-500 mt-2 whitespace-pre-line"><strong>Requirements:</strong>{'\n'}{job.requirements}</p>
                      <p className="text-xs text-slate-500 mt-2 whitespace-pre-line"><strong>Responsibilities:</strong>{'\n'}{job.responsibilities}</p>
                      {job.otherNotes ? <p className="text-xs text-slate-500 mt-2 whitespace-pre-line"><strong>Other notes:</strong>{'\n'}{job.otherNotes}</p> : null}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full table-auto text-sm">
              <thead className="bg-white dark:bg-slate-900/60">
                <tr className="text-left text-slate-600 dark:text-slate-300">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {jobs.map((job) => (
                  <Fragment key={job.id}>
                    <tr className="hover:bg-white dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-4 align-top">
                        <button
                          onClick={() => setExpandedJobId((prev) => (prev === job.id ? '' : job.id))}
                          className="font-semibold text-blue-700 dark:text-blue-300 hover:underline text-left"
                        >
                          {job.title}
                        </button>
                      </td>
                      <td className="px-4 py-4 align-top">
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
                      <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap align-top">{new Date(job.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <button onClick={() => startEdit(job)} className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors">
                            Edit
                          </button>
                          <button onClick={() => toggleStatus(job)} className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors">
                            {job.status === 'open' ? 'Close' : 'Reopen'}
                          </button>
                          <button onClick={() => openDeleteModal(job)} className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors">
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
            </div>
          </>
        )}
      </div>

      {isDeleteModalOpen && jobToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="admin-surface w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-red-200 dark:border-red-800 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r bg-blue-950 dark:bg-gray-950 text-white">
              <h2 className="text-xl font-bold">Confirm Delete</h2>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-gray-700 dark:text-gray-300 text-center">
                Are you sure you want to delete <strong>{jobToDelete.title}</strong>?
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setJobToDelete(null);
                  }}
                  className="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={removeJob}
                  className="px-6 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800 dark:hover:bg-blue-900/40 transition"
                >
                  Delete Job
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
