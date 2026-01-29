import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  RefreshCw,
  Clock,
  Calendar,
  ChevronDown
} from 'lucide-react';

interface SyncStatusPillProps {
  status: 'synced' | 'stale' | 'never';
  lastSyncAt: string | null;
  totalClients?: number;
  newThisMonth?: number;
  carrierCount?: number;
}

export function SyncStatusPill({
  status,
  lastSyncAt,
  totalClients = 0,
  newThisMonth = 0,
  carrierCount = 0
}: SyncStatusPillProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'synced':
        return {
          dotColor: 'bg-emerald-400',
          bgColor: 'bg-white/80 hover:bg-white',
          borderColor: 'border-slate-200/80',
          textColor: 'text-slate-500',
          label: lastSyncAt
            ? `Synced ${new Date(lastSyncAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
            : 'Synced'
        };
      case 'stale':
        return {
          dotColor: 'bg-amber-400',
          bgColor: 'bg-amber-50 hover:bg-amber-100',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-700',
          label: 'Sync needed'
        };
      default:
        return {
          dotColor: 'bg-blue-400 animate-pulse',
          bgColor: 'bg-blue-50 hover:bg-blue-100',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-600',
          label: 'Sync to start'
        };
    }
  };

  const { dotColor, bgColor, borderColor, textColor, label } = getStatusConfig();

  // Get next recommended sync date (7th of next month or this month if before 7th)
  const getNextSyncDate = () => {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();

    if (currentDay <= 7) {
      return new Date(now.getFullYear(), currentMonth, 7).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    } else {
      return new Date(now.getFullYear(), currentMonth + 1, 7).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 ${bgColor} backdrop-blur rounded-full border ${borderColor} transition-all cursor-pointer shadow-sm hover:shadow-md`}
      >
        <div className={`w-2 h-2 ${dotColor} rounded-full`} />
        <span className={`text-xs font-medium ${textColor}`}>
          {label}
        </span>
        <ChevronDown className={`w-3 h-3 ${textColor} opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Status Header */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                status === 'synced' ? 'bg-emerald-100' :
                status === 'stale' ? 'bg-amber-100' : 'bg-blue-100'
              }`}>
                {status === 'synced' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <RefreshCw className={`w-5 h-5 ${status === 'stale' ? 'text-amber-500' : 'text-blue-500'}`} />
                )}
              </div>
              <div>
                <p className="font-medium text-slate-800">
                  {status === 'synced' ? 'Book is current' :
                   status === 'stale' ? 'Sync recommended' : 'No data yet'}
                </p>
                <p className="text-sm text-slate-500">
                  {lastSyncAt
                    ? `Last synced ${new Date(lastSyncAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                    : 'Never synced'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats - Only if has data */}
          {status !== 'never' && totalClients > 0 && (
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-slate-800">{totalClients}</p>
                  <p className="text-xs text-slate-500">Clients</p>
                </div>
                <div>
                  <p className={`text-lg font-bold ${newThisMonth > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {newThisMonth > 0 ? `+${newThisMonth}` : '—'}
                  </p>
                  <p className="text-xs text-slate-500">This Month</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-800">{carrierCount || '—'}</p>
                  <p className="text-xs text-slate-500">Carriers</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-2">
            <Link
              to="/sync"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left"
            >
              <RefreshCw className="w-5 h-5 text-slate-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">
                  {status === 'never' ? 'Start Sync' : 'Sync Now'}
                </p>
                <p className="text-xs text-slate-500">Upload new carrier reports</p>
              </div>
            </Link>
            {status !== 'never' && (
              <Link
                to="/book-of-business"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left"
              >
                <Clock className="w-5 h-5 text-slate-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">View Book</p>
                  <p className="text-xs text-slate-500">See all clients & details</p>
                </div>
              </Link>
            )}
          </div>

          {/* Next reminder */}
          <div className="px-4 py-3 bg-blue-50 border-t border-blue-100">
            <p className="text-xs text-blue-600 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Next recommended sync: {getNextSyncDate()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
