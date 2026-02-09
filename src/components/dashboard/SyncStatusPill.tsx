import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  RefreshCw,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { getNextSyncDate } from '@/lib/sync';
import { GH } from '@/config/golden-hour';

interface SyncStatusPillProps {
  status: 'synced' | 'stale' | 'never';
  lastSyncAt: string | null;
  totalClients?: number;
  newThisMonth?: number;
  termedThisMonth?: number;
  netChange?: number;
  carrierCount?: number;
}

export function SyncStatusPill({
  status,
  lastSyncAt,
  totalClients = 0,
  newThisMonth = 0,
  termedThisMonth = 0,
  netChange = 0,
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
          label: lastSyncAt
            ? `Synced ${new Date(lastSyncAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
            : 'Synced',
          pillStyle: {
            background: GH.glass,
            borderColor: GH.glassBorder,
            color: GH.textSecondary,
          } as React.CSSProperties,
        };
      case 'stale':
        return {
          dotColor: 'bg-amber-400',
          label: 'Sync needed',
          pillStyle: {
            background: undefined,
            borderColor: undefined,
            color: undefined,
          } as React.CSSProperties,
          pillClassName: 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700',
        };
      default:
        return {
          dotColor: 'animate-pulse',
          label: 'Sync to start',
          pillStyle: {
            background: 'rgba(139,105,20,0.08)',
            borderColor: 'rgba(139,105,20,0.2)',
            color: GH.gold,
          } as React.CSSProperties,
          dotStyle: { background: GH.gold } as React.CSSProperties,
        };
    }
  };

  const config = getStatusConfig();

  // Dropdown icon box background per status
  const iconBoxBg = status === 'synced'
    ? 'rgba(16,185,129,0.1)'
    : status === 'stale'
      ? undefined
      : `rgba(139,105,20,0.1)`;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 backdrop-blur rounded-full border transition-all cursor-pointer shadow-sm hover:shadow-md ${config.pillClassName || ''}`}
        style={config.pillStyle}
      >
        <div
          className={`w-2 h-2 ${config.dotColor} rounded-full`}
          style={config.dotStyle}
        />
        <span className="text-xs font-medium">
          {config.label}
        </span>
        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-72 rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(60,48,28,0.15)',
            boxShadow: '0 12px 48px rgba(60,48,28,0.18), 0 4px 16px rgba(60,48,28,0.10)',
          }}
        >
          {/* Status Header */}
          <div className="p-4" style={{ borderBottom: `1px solid ${GH.borderLight}` }}>
            <div className="flex items-center gap-3">
              {status === 'stale' ? (
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-100">
                  <RefreshCw className="w-5 h-5 text-amber-500" />
                </div>
              ) : (
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: iconBoxBg }}
                >
                  {status === 'synced' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <RefreshCw className="w-5 h-5" style={{ color: GH.gold }} />
                  )}
                </div>
              )}
              <div>
                <p className="font-medium" style={{ color: GH.textPrimary }}>
                  {status === 'synced' ? 'Book is current' :
                   status === 'stale' ? 'Sync recommended' : 'No data yet'}
                </p>
                <p className="text-sm" style={{ color: GH.textSecondary }}>
                  {lastSyncAt
                    ? `Last synced ${new Date(lastSyncAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                    : 'Never synced'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats - Only if has data */}
          {status !== 'never' && totalClients > 0 && (
            <div className="p-4" style={{ background: GH.tileBg, borderBottom: `1px solid ${GH.borderLight}` }}>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold" style={{ fontFamily: GH.serif, color: GH.textPrimary }}>{totalClients}</p>
                  <p className="text-xs" style={{ color: GH.textMuted }}>Clients</p>
                </div>
                <div>
                  <p className="text-lg font-bold" style={{
                    fontFamily: GH.serif,
                    color: netChange > 0 ? '#059669' : netChange < 0 ? '#d97706' : GH.textMuted
                  }}>
                    {netChange !== 0 ? `${netChange > 0 ? '+' : ''}${netChange}` : '—'}
                  </p>
                  <p className="text-xs" style={{ color: GH.textMuted }}>Net Change</p>
                  {(newThisMonth > 0 || termedThisMonth > 0) && (
                    <p className="text-[10px] mt-0.5" style={{ color: GH.textFaint }}>
                      +{newThisMonth} / -{termedThisMonth}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ fontFamily: GH.serif, color: GH.textPrimary }}>{carrierCount || '—'}</p>
                  <p className="text-xs" style={{ color: GH.textMuted }}>Carriers</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-2">
            <Link
              to="/sync"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left"
              onMouseEnter={e => { e.currentTarget.style.background = GH.tileHover; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <RefreshCw className="w-5 h-5" style={{ color: GH.textMuted }} />
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: GH.textPrimary }}>
                  {status === 'never' ? 'Start Sync' : 'Sync Now'}
                </p>
                <p className="text-xs" style={{ color: GH.textSecondary }}>Upload new carrier reports</p>
              </div>
            </Link>
          </div>

          {/* Next reminder */}
          <div className="px-4 py-3" style={{ background: 'rgba(139,105,20,0.06)', borderTop: `1px solid rgba(139,105,20,0.1)` }}>
            <p className="text-xs flex items-center gap-1" style={{ color: GH.gold }}>
              <Calendar className="w-3 h-3" />
              Next recommended sync: {getNextSyncDate()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
