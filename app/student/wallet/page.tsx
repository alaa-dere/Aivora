'use client';

import { useEffect, useState } from 'react';
import {
  CreditCardIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [status, setStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const coursePrice = 20; // Placeholder
  const courseTitle = 'Course Enrollment';

  useEffect(() => {
    const loadWallet = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/student/wallet', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to load wallet');
        }
        setBalance(Number(data.balance || 0));
        setTotalSpent(Number(data.totalSpent || 0));
      } catch (err: any) {
        setError(err.message || 'Failed to load wallet');
      } finally {
        setLoading(false);
      }
    };

    loadWallet();
  }, []);

  const payWithBalance = () => {
    if (balance >= coursePrice) {
      setBalance((b) => +(b - coursePrice).toFixed(2));
      setStatus('success');
    } else {
      setStatus('failed');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Wallet & Payments
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review your balance and manage course payments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance */}
        <div className="portal-surface bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
          <div className="flex items-center gap-2">
            <CreditCardIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Balance</h2>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading...</p>
          ) : error ? (
            <p className="mt-4 text-sm text-red-500">{error}</p>
          ) : (
            <>
              <p className="mt-4 text-3xl font-bold text-gray-800 dark:text-white">${balance.toFixed(2)}</p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Total spent: ${totalSpent.toFixed(2)}
              </p>
            </>
          )}

          <button
            onClick={() => setBalance((b) => +(b + 10).toFixed(2))}
            className="mt-4 w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
          >
            Top up $10 (demo)
          </button>
        </div>

        {/* Enrollment */}
        <div className="portal-surface lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Enrollment Payment</h2>

          <div className="mt-4 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Course</p>
            <p className="font-medium text-gray-800 dark:text-white mt-1">{courseTitle}</p>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Price</p>
            <p className="font-semibold text-gray-800 dark:text-white">${coursePrice}</p>

            <button
              onClick={payWithBalance}
              className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
            >
              Pay with Balance (demo)
            </button>

            {status === 'success' && (
              <div className="mt-4 flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                <CheckCircleIcon className="w-5 h-5" />
                Payment successful. Enrollment completed.
              </div>
            )}

            {status === 'failed' && (
              <div className="mt-4 flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                <ExclamationTriangleIcon className="w-5 h-5" />
                Payment failed. Not enough balance.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
