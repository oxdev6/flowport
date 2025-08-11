export function logInfo(scope, message, meta = {}) {
  console.log(`[INFO] ${scope}: ${message}`, meta);
}

export function logError(scope, message, error, meta = {}) {
  console.error(`[ERROR] ${scope}: ${message}`, { error: error?.message || error, ...meta });
}


