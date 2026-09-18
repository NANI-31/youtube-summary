import { useState, useEffect, useMemo } from 'react';
import {
  FiActivity,
  FiTerminal,
  FiTrash2,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertTriangle,
  FiDownload,
  FiSearch,
  FiChevronDown,
  FiChevronRight,
  FiRadio,
  FiDatabase,
  FiSettings,
} from 'react-icons/fi';
import { supabase, isSupabaseConfigured } from '../../utils/supabase.js';
import {
  subscribeApiLogs,
  clearApiLogs,
  pingSupabase,
} from '../../services/apiLogger.js';
import { pullFromSupabase, pushToSupabase, pushSettingsToSupabase, pullSettingsFromSupabase } from '../../services/syncService.js';

export default function SupabaseApiLogger({ collections = [], files = {}, themeSettings = null, thumbnailSettings = null }) {
  const [logs, setLogs] = useState([]);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'success' | 'error' | 'select' | 'mutation' | 'settings'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [isPinging, setIsPinging] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSettingsSyncing, setIsSettingsSyncing] = useState(false);
  const [pingResult, setPingResult] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeApiLogs((newLogs) => {
      setLogs(newLogs);
    });
    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const total = logs.length;
    const errors = logs.filter((l) => l.status === 'error').length;
    const successes = logs.filter((l) => l.status === 'success').length;
    const latencies = logs.filter((l) => l.latencyMs > 0).map((l) => l.latencyMs);
    const avgLatency =
      latencies.length > 0
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : 0;

    return { total, errors, successes, avgLatency };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Type filtering
      if (filterType === 'success' && log.status !== 'success') return false;
      if (filterType === 'error' && log.status !== 'error') return false;
      if (filterType === 'select' && log.operation !== 'SELECT') return false;
      if (filterType === 'settings' && log.table !== 'settings') return false;
      if (
        filterType === 'mutation' &&
        !['UPSERT', 'DELETE', 'MIGRATE'].includes(log.operation)
      )
        return false;

      // Search query filtering
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSummary = log.summary.toLowerCase().includes(q);
        const matchesTable = log.table.toLowerCase().includes(q);
        const matchesOp = log.operation.toLowerCase().includes(q);
        const matchesEndpoint = log.endpoint.toLowerCase().includes(q);
        if (!matchesSummary && !matchesTable && !matchesOp && !matchesEndpoint) {
          return false;
        }
      }

      return true;
    });
  }, [logs, filterType, searchQuery]);

  async function handlePing() {
    setIsPinging(true);
    setPingResult(null);
    try {
      const res = await pingSupabase(supabase);
      setPingResult(res);
    } finally {
      setIsPinging(false);
    }
  }

  async function handleTestSync() {
    setIsSyncing(true);
    try {
      if (collections.length > 0 || Object.keys(files).length > 0) {
        await pushToSupabase({ collections, files });
      }
      await pullFromSupabase();
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleTestSettingsSync() {
    setIsSettingsSyncing(true);
    try {
      if (themeSettings || thumbnailSettings) {
        await pushSettingsToSupabase({ theme: themeSettings, thumbnail: thumbnailSettings });
      }
      await pullSettingsFromSupabase();
    } finally {
      setIsSettingsSyncing(false);
    }
  }

  function handleExportLogs() {
    const dataStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supabase-api-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function toggleExpand(id) {
    setExpandedLogId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Telemetry Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <FiActivity className="w-3.5 h-3.5 text-blue-400" />
            Total Requests
          </span>
          <span className="text-xl font-bold font-mono text-zinc-100">
            {stats.total}
          </span>
          <span className="text-[10px] text-zinc-500">In-memory telemetry buffer</span>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <FiCheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            Successful
          </span>
          <span className="text-xl font-bold font-mono text-emerald-400">
            {stats.successes}
          </span>
          <span className="text-[10px] text-zinc-500">HTTP 2xx responses</span>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <FiAlertTriangle className="w-3.5 h-3.5 text-red-400" />
            Failed Calls
          </span>
          <span
            className={`text-xl font-bold font-mono ${
              stats.errors > 0 ? 'text-red-400' : 'text-zinc-400'
            }`}
          >
            {stats.errors}
          </span>
          <span className="text-[10px] text-zinc-500">HTTP error codes / network</span>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <FiRadio className="w-3.5 h-3.5 text-cyan-400" />
            Avg Latency
          </span>
          <span className="text-xl font-bold font-mono text-cyan-400">
            {stats.avgLatency}ms
          </span>
          <span className="text-[10px] text-zinc-500">Roundtrip API response time</span>
        </div>
      </div>

      {/* Main Logs Console Container */}
      <section className="bg-zinc-900/50 border border-zinc-800/90 rounded-2xl flex flex-col overflow-hidden shadow-xl">
        {/* Console Header & Action Toolbar */}
        <div className="p-4 bg-zinc-900/90 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FiTerminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                <span>Supabase API Call Logs</span>
                <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-mono font-normal">
                  Live
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Detailed request telemetry, latency benchmarks, and payload logs
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePing}
              disabled={isPinging || !isSupabaseConfigured()}
              title="Ping Supabase REST API endpoint to measure roundtrip latency"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-medium border border-zinc-700/80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              <FiRadio className={`w-3.5 h-3.5 ${isPinging ? 'animate-pulse text-cyan-400' : 'text-zinc-400'}`} />
              <span>{isPinging ? 'Pinging…' : 'Ping Endpoint'}</span>
            </button>

            {pingResult && (
              <span
                className={`text-[10px] font-mono px-2 py-1 rounded-lg border ${
                  pingResult.ok
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}
              >
                {pingResult.ok ? `✓ ${Math.round(pingResult.latencyMs)}ms` : '✗ Failed'}
              </span>
            )}

            <button
              onClick={handleTestSync}
              disabled={isSyncing || !isSupabaseConfigured()}
              title="Trigger a live sync cycle for notes/collections"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-medium border border-zinc-700/80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : 'text-zinc-400'}`} />
              <span>{isSyncing ? 'Syncing…' : 'Trigger Sync'}</span>
            </button>

            <button
              onClick={handleTestSettingsSync}
              disabled={isSettingsSyncing || !isSupabaseConfigured()}
              title="Push custom settings to Supabase settings table and observe query"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-purple-300 hover:text-white rounded-xl text-xs font-medium border border-purple-800/40 hover:border-purple-600/60 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              <FiSettings className={`w-3.5 h-3.5 ${isSettingsSyncing ? 'animate-spin text-purple-400' : 'text-purple-400'}`} />
              <span>{isSettingsSyncing ? 'Syncing Settings…' : 'Sync Settings'}</span>
            </button>

            {logs.length > 0 && (
              <>
                <button
                  onClick={handleExportLogs}
                  title="Download all logs as JSON file"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-medium border border-zinc-700/80 transition-colors cursor-pointer"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </button>

                <button
                  onClick={clearApiLogs}
                  title="Clear all stored logs"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800/80 hover:bg-red-950/40 hover:text-red-300 text-zinc-400 rounded-xl text-xs font-medium border border-zinc-700/80 hover:border-red-800/50 transition-colors cursor-pointer"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="px-4 py-2.5 bg-zinc-950/60 border-b border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: `All (${logs.length})` },
              { id: 'settings', label: `Settings (${logs.filter((l) => l.table === 'settings').length})` },
              { id: 'success', label: `Success (${stats.successes})` },
              { id: 'error', label: `Errors (${stats.errors})` },
              { id: 'select', label: 'SELECT / Read' },
              { id: 'mutation', label: 'UPSERT / Mutate' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  filterType === f.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex items-center min-w-48">
            <FiSearch className="absolute left-2.5 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search table, operation…"
              className="w-full pl-8 pr-3 py-1 bg-zinc-900 text-xs rounded-lg border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Live Logs Stream Body */}
        <div className="max-h-125 overflow-y-auto divide-y divide-zinc-800/60 bg-zinc-950/90 font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-2 text-zinc-500">
              <FiTerminal className="w-8 h-8 text-zinc-600 stroke-[1.5]" />
              <p className="text-xs font-sans text-zinc-400">
                {logs.length === 0
                  ? 'No API calls recorded yet.'
                  : 'No logs match the selected filter.'}
              </p>
              {logs.length === 0 && (
                <button
                  onClick={handlePing}
                  className="mt-2 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-xs font-sans font-medium border border-blue-500/30 transition-colors cursor-pointer"
                >
                  Send a Test Ping
                </button>
              )}
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const isSuccess = log.status === 'success';

              // Operation color styling
              let opBadgeClass = 'bg-zinc-800 text-zinc-300 border-zinc-700';
              if (log.operation === 'SELECT') {
                opBadgeClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
              } else if (log.operation === 'UPSERT') {
                opBadgeClass = 'bg-blue-500/15 text-blue-300 border-blue-500/30';
              } else if (log.operation === 'DELETE') {
                opBadgeClass = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
              } else if (log.operation === 'PING') {
                opBadgeClass = 'bg-purple-500/15 text-purple-300 border-purple-500/30';
              } else if (log.operation === 'MIGRATE') {
                opBadgeClass = 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
              }

              return (
                <div
                  key={log.id}
                  className="transition-colors hover:bg-zinc-900/60 flex flex-col"
                >
                  {/* Log summary row */}
                  <div
                    onClick={() => toggleExpand(log.id)}
                    className="flex items-center justify-between px-4 py-2.5 cursor-pointer select-none gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        className="text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {isExpanded ? (
                          <FiChevronDown className="w-3.5 h-3.5 text-blue-400" />
                        ) : (
                          <FiChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Timestamp */}
                      <span className="text-[11px] text-zinc-500 shrink-0">
                        {log.formattedTime}
                      </span>

                      {/* Method Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider shrink-0 ${opBadgeClass}`}
                      >
                        {log.operation}
                      </span>

                      {/* Target Table */}
                      <span
                        className={`text-[11px] font-medium px-1.5 py-0.5 rounded border shrink-0 flex items-center gap-1 ${
                          log.table === 'settings'
                            ? 'bg-purple-950/60 text-purple-300 border-purple-800/80 font-semibold'
                            : 'text-zinc-400 bg-zinc-900 border-zinc-800'
                        }`}
                      >
                        <FiDatabase className={`w-3 h-3 ${log.table === 'settings' ? 'text-purple-400' : 'text-zinc-500'}`} />
                        {log.table}
                      </span>

                      {/* Summary text */}
                      <span
                        className={`truncate text-xs ${
                          isSuccess ? 'text-zinc-200' : 'text-red-300 font-semibold'
                        }`}
                      >
                        {log.summary}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {/* Latency badge */}
                      {log.latencyMs !== null && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded ${
                            log.latencyMs > 400
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {log.latencyMs}ms
                        </span>
                      )}

                      {/* Status badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          isSuccess
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}
                      >
                        {log.statusCode || (isSuccess ? '200' : 'ERR')}
                      </span>
                    </div>
                  </div>

                  {/* Expanded JSON Inspector */}
                  {isExpanded && (
                    <div className="px-5 py-3 bg-zinc-950 border-t border-zinc-800/80 flex flex-col gap-2 font-mono text-[11px]">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-zinc-400 pb-1 border-b border-zinc-900">
                        <div>
                          <span className="text-zinc-500">Endpoint: </span>
                          <span className="text-zinc-300">{log.endpoint || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Status: </span>
                          <span className={isSuccess ? 'text-emerald-400' : 'text-red-400'}>
                            {log.status.toUpperCase()} ({log.statusCode})
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Latency: </span>
                          <span className="text-zinc-300">{log.latencyMs} ms</span>
                        </div>
                      </div>

                      {log.details && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-sans font-semibold">
                            Payload & Metadata
                          </span>
                          <pre className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 text-zinc-300 overflow-x-auto max-h-48 text-[11px] leading-relaxed select-all">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 bg-zinc-900/80 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Buffer capacity: max 150 events in memory</span>
          <span>Auto-clears on page reload</span>
        </div>
      </section>
    </div>
  );
}
