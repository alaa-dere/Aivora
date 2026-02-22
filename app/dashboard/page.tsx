// app/admin/dashboard/page.tsx
'use client';

import {
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// الإحصائيات الرئيسية
const stats = [
  {
    name: 'Total Students',
    value: '1,240',
    change: '+6.2%',
    changeType: 'increase',
    icon: UserGroupIcon,
  },
  {
    name: 'Total Teachers',
    value: '38',
    change: '+1.4%',
    changeType: 'increase',
    icon: AcademicCapIcon,
  },
  {
    name: 'Active Courses',
    value: '112',
    change: '+3.1%',
    changeType: 'increase',
    icon: BookOpenIcon,
  },
  {
    name: 'Monthly Revenue',
    value: '$12,450',
    change: '+9.8%',
    changeType: 'increase',
    icon: CurrencyDollarIcon,
  },
];

// بيانات الرسم البياني للإيرادات (آخر 12 أسبوعًا)
const revenueData = [
  { week: 'W1', revenue: 3000 },
  { week: 'W2', revenue: 4500 },
  { week: 'W3', revenue: 3200 },
  { week: 'W4', revenue: 5000 },
  { week: 'W5', revenue: 4800 },
  { week: 'W6', revenue: 6000 },
  { week: 'W7', revenue: 5500 },
  { week: 'W8', revenue: 6200 },
  { week: 'W9', revenue: 7000 },
  { week: 'W10', revenue: 6800 },
  { week: 'W11', revenue: 7500 },
  { week: 'W12', revenue: 8200 },
];

// بيانات المعاملات الأخيرة
const recentTransactions = [
  { id: 'TRX-1001', name: 'Ahmad', amount: '$25.00' },
  { id: 'TRX-1002', name: 'Sara', amount: '$49.90' },
  { id: 'TRX-1003', name: 'Lina', amount: '$15.30' },
];

// بيانات النشاط الأخير
const recentActivities = [
  {
    type: 'ENROLL',
    description: 'Batoo enrolled in React Basics',
    time: '2 min ago',
  },
  {
    type: 'PAYMENT',
    description: 'Payment received ($25) - TRX-10021',
    time: '15 min ago',
  },
  {
    type: 'CERT',
    description: 'Sara completed HTML & CSS and got certificate',
    time: '1 hour ago',
  },
  {
    type: 'QUIZ',
    description: 'New quiz submitted in JavaScript course',
    time: '3 hours ago',
  },
];

// رؤى الذكاء الاصطناعي (بألوان زرقاء)
const aiInsights = [
  {
    title: 'Forecast',
    description: 'Next month React Basics +18%',
    icon: ArrowTrendingUpIcon,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    title: 'Risk',
    description: 'At-risk Web Dev student based on quiz performance',
    icon: ArrowTrendingDownIcon,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    title: 'Recommendation',
    description: 'JavaScript Async (68% wrong) needs review',
    icon: AcademicCapIcon,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      {/* رأس الصفحة */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Dashboard
        </h1>
      </div>

      {/* بطاقات الإحصائيات مع تأثير hover */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <stat.icon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  stat.changeType === 'increase'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                }`}
              >
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* الرسم البياني ورؤى الذكاء الاصطناعي مع تأثير hover */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* الرسم البياني للإيرادات - موجة زرقاء */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              Revenue Trend
            </h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">Last 12 weeks</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#bfdbfe" />
                <XAxis 
                  dataKey="week" 
                  tick={{ fill: '#1e3a8a' }} 
                  stroke="#1e3a8a"
                />
                <YAxis 
                  tick={{ fill: '#1e3a8a' }} 
                  stroke="#1e3a8a"
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}
                  labelStyle={{ color: '#1e293b' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* رؤى الذكاء الاصطناعي مع تأثير hover */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            AI Insights
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Smart analytics & suggestions
          </p>
          <div className="space-y-4">
            {aiInsights.map((insight) => (
              <div key={insight.title} className="flex gap-3">
                <div className={`${insight.bg} p-2 rounded-lg h-fit`}>
                  <insight.icon className={`w-5 h-5 ${insight.color}`} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                    {insight.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {insight.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* المعاملات الأخيرة وآخر الأنشطة مع تأثير hover */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Recent Transactions
          </h2>
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-2 border-b border-blue-100 dark:border-blue-800 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{tx.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{tx.id}</p>
                </div>
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                  {tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Recent Activity
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Live platform events</p>
          <div className="space-y-4">
            {recentActivities.map((activity, idx) => (
              <div key={idx} className="flex gap-3">
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    activity.type === 'ENROLL'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                      : activity.type === 'PAYMENT'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                      : activity.type === 'CERT'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                  }`}
                >
                  {activity.type}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-gray-800 dark:text-gray-200">{activity.description}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}