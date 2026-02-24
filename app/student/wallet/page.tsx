'use client';

import { useState } from 'react';
import {
  CreditCardIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function WalletPage() {
  const [balance, setBalance] = useState(18.5);
  const [status, setStatus] = useState<'idle' | 'success' | 'failed'>('idle');

  const coursePrice = 20; // Demo
  const courseTitle = 'JavaScript Essentials';

  const payWithBalance = () => {
    if (balance >= coursePrice) {
      setBalance((b) => +(b - coursePrice).toFixed(2));
      setStatus('success');
    } else {
      setStatus('failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Wallet & Payments
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Enrollment: pay using wallet balance (demo).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
          <div className="flex items-center gap-2">
            <CreditCardIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Balance</h2>
          </div>

          <p className="mt-4 text-3xl font-bold text-gray-800 dark:text-white">${balance.toFixed(2)}</p>

          <button
            onClick={() => setBalance((b) => +(b + 10).toFixed(2))}
            className="mt-4 w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
          >
            Top up $10 (demo)
          </button>
        </div>

        {/* Enrollment */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
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
              Pay with Balance
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