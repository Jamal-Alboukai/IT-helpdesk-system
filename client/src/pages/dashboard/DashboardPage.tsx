import { useAuth } from '../../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-400 mt-1">
          Here's what's happening in your help desk today.
        </p>
      </div>

      {/* Stat cards placeholder */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Open Tickets', value: '—', color: 'blue' },
          { label: 'In Progress', value: '—', color: 'purple' },
          { label: 'Resolved Today', value: '—', color: 'green' },
          { label: 'Critical', value: '—', color: 'red' },
        ].map(card => (
          <div key={card.label}
            className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <p className="text-gray-400 text-sm">{card.label}</p>
            <p className="text-3xl font-bold text-white mt-2">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <p className="text-gray-400 text-sm">
          Dashboard analytics will be built in Week 5.
        </p>
      </div>
    </div>
  );
}