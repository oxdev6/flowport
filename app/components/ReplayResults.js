export default function ReplayResults({ replays }) {
  const formatHash = (hash) => {
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 6)}`
  }

  const formatGas = (gas) => {
    return parseInt(gas).toLocaleString()
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'simulated':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'success':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
      case 'failed':
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'simulated':
        return <span className="text-blue-600 font-medium">Simulated</span>
      case 'success':
        return <span className="text-green-600 font-medium">Success</span>
      case 'failed':
        return <span className="text-red-600 font-medium">Failed</span>
      default:
        return <span className="text-gray-600 font-medium capitalize">{status}</span>
    }
  }

  return (
    <div className="space-y-4">
      {replays.map((replay) => (
        <div key={replay.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
          {getStatusIcon(replay.status)}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">
                  {getStatusText(replay.status)}
                </span>
                <span className="text-xs text-gray-500">
                  Block #{replay.blockNumber}
                </span>
              </div>
              
              <div className="text-sm text-gray-600">
                Gas: {formatGas(replay.gasEstimate)}
              </div>
            </div>
            
            <div className="mt-2">
              <div className="text-sm text-gray-600 font-mono">
                {formatHash(replay.originalHash)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(replay.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {replays.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg">No replay results</div>
          <p className="text-gray-400 text-sm mt-2">
            Run a transaction replay to see results here
          </p>
        </div>
      )}
      
      {replays.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-blue-800">
              {replays.filter(r => r.status === 'success' || r.status === 'simulated').length} of {replays.length} transactions successfully processed
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
