import { redirect } from 'next/navigation';

export default function AdminFinanceIndexPage() {
  redirect('/dashboard/finance/transactions');
}
