/**
 * Supabase API Logging & Telemetry Service
 * Records network calls, latencies, status codes, and payloads for real-time observability in Settings.
 */

const MAX_LOGS = 150;
let apiLogs = [];
const logListeners = new Set();

/**
 * Format timestamp into HH:mm:ss.SSS
 */
function formatTime(date = new Date()) {
  const pad = (n, s = 2) => String(n).padStart(s, '0');
  const h = pad(date.getHours());
  const m = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  const ms = pad(date.getMilliseconds(), 3);
  return `${h}:${m}:${s}.${ms}`;
}

/**
 * Notify all subscribed UI components
 */
function notifyListeners() {
  const snapshot = [...apiLogs];
  logListeners.forEach((fn) => {
    try {
      fn(snapshot);
    } catch (e) {
      console.error('[apiLogger] Listener error:', e);
    }
  });
}

/**
 * Add a new API call entry to the log
 * @param {Object} entry
 * @param {string} entry.operation - 'SELECT' | 'UPSERT' | 'DELETE' | 'PING' | 'MIGRATE'
 * @param {string} entry.table - 'collections' | 'notes' | 'system'
 * @param {string} entry.endpoint - e.g. '/rest/v1/notes'
 * @param {string} entry.status - 'success' | 'error' | 'pending'
 * @param {number} [entry.statusCode] - 200, 201, 204, 400, etc.
 * @param {number} [entry.latencyMs] - Duration in ms
 * @param {number} [entry.recordsCount] - Number of affected/returned records
 * @param {string} entry.summary - Human-readable summary
 * @param {any} [entry.details] - Detailed metadata or error message
 */
export function addApiLog(entry) {
  const now = new Date();
  const logItem = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: now.toISOString(),
    formattedTime: formatTime(now),
    operation: entry.operation || 'CALL',
    table: entry.table || 'database',
    endpoint: entry.endpoint || '',
    status: entry.status || 'success',
    statusCode: entry.statusCode || (entry.status === 'success' ? 200 : 500),
    latencyMs: Math.max(0, Math.round(entry.latencyMs || 0)),
    recordsCount: entry.recordsCount ?? null,
    summary: entry.summary || '',
    details: entry.details || null,
  };

  // Prepend new logs so newest is first
  apiLogs = [logItem, ...apiLogs].slice(0, MAX_LOGS);
  notifyListeners();
  return logItem;
}

/**
 * Retrieve current logs snapshot
 */
export function getApiLogs() {
  return [...apiLogs];
}

/**
 * Clear all accumulated logs
 */
export function clearApiLogs() {
  apiLogs = [];
  notifyListeners();
}

/**
 * Subscribe to live log updates
 */
export function subscribeApiLogs(listener) {
  logListeners.add(listener);
  listener([...apiLogs]);
  return () => logListeners.delete(listener);
}

/**
 * Test live connection to Supabase and log roundtrip latency
 */
export async function pingSupabase(supabaseClient) {
  if (!supabaseClient) {
    const errorLog = addApiLog({
      operation: 'PING',
      table: 'system',
      endpoint: '/rest/v1/',
      status: 'error',
      statusCode: 400,
      latencyMs: 0,
      summary: 'Supabase client is not initialized or missing credentials',
      details: { error: 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY' },
    });
    return { ok: false, error: 'Supabase unconfigured', log: errorLog };
  }

  const startTime = performance.now();
  try {
    const { error, status } = await supabaseClient
      .from('collections')
      .select('id', { count: 'exact', head: true });

    const latencyMs = performance.now() - startTime;

    if (error) {
      const errorLog = addApiLog({
        operation: 'PING',
        table: 'collections',
        endpoint: '/rest/v1/collections?select=id',
        status: 'error',
        statusCode: status || 500,
        latencyMs,
        summary: `Health check failed: ${error.message}`,
        details: error,
      });
      return { ok: false, error: error.message, latencyMs, log: errorLog };
    }

    const successLog = addApiLog({
      operation: 'PING',
      table: 'collections',
      endpoint: '/rest/v1/collections?select=id',
      status: 'success',
      statusCode: status || 200,
      latencyMs,
      summary: `Ping response OK in ${Math.round(latencyMs)}ms`,
      details: {
        host: supabaseClient.supabaseUrl || 'Connected',
        latency: `${Math.round(latencyMs)}ms`,
        authenticatedRole: 'anon',
      },
    });

    return { ok: true, latencyMs, log: successLog };
  } catch (err) {
    const latencyMs = performance.now() - startTime;
    const errorLog = addApiLog({
      operation: 'PING',
      table: 'system',
      endpoint: '/rest/v1/',
      status: 'error',
      statusCode: 500,
      latencyMs,
      summary: `Network error during ping: ${err.message}`,
      details: { message: err.message, stack: err.stack },
    });
    return { ok: false, error: err.message, latencyMs, log: errorLog };
  }
}
