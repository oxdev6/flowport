export default function MigrationStats({ stats }) {
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num)
  }

  const formatGas = (gas) => {
    if (gas >= 1000000) {
      return `${(gas / 1000000).toFixed(1)}M`
    } else if (gas >= 1000) {
      return `${(gas / 1000).toFixed(1)}K`
    }
    return gas.toString()
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Deployments */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Deployments</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalDeployments)}</p>
          </div>
          <div className="p-3 bg-primary-50 rounded-full">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center text-sm">
            <span className="text-success-600 font-medium">{stats.successfulDeployments} successful</span>
            {stats.failedDeployments > 0 && (
              <span className="text-error-600 font-medium ml-2">{stats.failedDeployments} failed</span>
            )}
          </div>
        </div>
      </div>

      {/* Total Replays */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Replays</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalReplays)}</p>
          </div>
          <div className="p-3 bg-warning-50 rounded-full">
            <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center text-sm">
            <span className="text-success-600 font-medium">{stats.successfulReplays} successful</span>
            {stats.failedReplays > 0 && (
              <span className="text-error-600 font-medium ml-2">{stats.failedReplays} failed</span>
            )}
          </div>
        </div>
      </div>

      {/* Total Gas Used */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Gas Used</p>
            <p className="text-2xl font-bold text-gray-900">{formatGas(stats.totalGasUsed)}</p>
          </div>
          <div className="p-3 bg-success-50 rounded-full">
            <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500">
            Avg: {formatGas(stats.averageGasPerTx)} per tx
          </p>
        </div>
      </div>

      {/* Success Rate */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Success Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalDeployments + stats.totalReplays > 0 
                ? Math.round(((stats.successfulDeployments + stats.successfulReplays) / (stats.totalDeployments + stats.totalReplays)) * 100)
                : 0}%
            </p>
          </div>
          <div className="p-3 bg-primary-50 rounded-full">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-success-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${stats.totalDeployments + stats.totalReplays > 0 
                  ? ((stats.successfulDeployments + stats.successfulReplays) / (stats.totalDeployments + stats.totalReplays)) * 100
                  : 0}%` 
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}
