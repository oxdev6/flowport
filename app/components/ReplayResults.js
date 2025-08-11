'use client';

export default function ReplayResults({ replays }) {
  const formatHash = (hash) => {
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 6)}`;
  };

  const formatGas = (gas) => {
    if (gas >= 1000000) {
      return `${(gas / 1000000).toFixed(1)}M`;
    } else if (gas >= 1000) {
      return `${(gas / 1000).toFixed(1)}K`;
    }
    return gas.toString();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      simulated: {
        className: 'status-success',
        icon: '🔄',
        text: 'Simulated'
      },
      success: {
        className: 'status-success',
        icon: '✅',
        text: 'Success'
      },
      failed: {
        className: 'status-failed',
        icon: '❌',
        text: 'Failed'
      },
      pending: {
        className: 'status-pending',
        icon: '⏳',
        text: 'Pending'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`${config.className} px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1`}>
        <span>{config.icon}</span>
        <span>{config.text}</span>
      </span>
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <section id="replays" className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Transaction Replays</h2>
          <p className="text-white/70">Monitor transaction replay operations from L1 to L2</p>
        </div>

        <div className="table-container overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Original Transaction
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Block Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gas Estimate
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Replayed At
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {replays?.map((replay, index) => (
                  <tr 
                    key={replay.id || index}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 font-mono">
                            {formatHash(replay.originalHash)}
                          </div>
                          <div className="text-xs text-gray-500">Replay #{replay.id}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {replay.blockNumber?.toLocaleString() || 'N/A'}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(replay.status)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="text-sm text-gray-900 font-medium">
                          {formatGas(parseInt(replay.gasEstimate || 0))}
                        </div>
                        <div className="text-xs text-gray-500">wei</div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(replay.timestamp).toLocaleString()}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyToClipboard(replay.originalHash)}
                          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
                          title="Copy transaction hash"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        
                        {replay.status === 'success' && (
                          <button
                            className="text-blue-400 hover:text-blue-600 transition-colors p-1 rounded"
                            title="View on explorer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </button>
                        )}
                        
                        {replay.status === 'failed' && (
                          <button
                            className="text-red-400 hover:text-red-600 transition-colors p-1 rounded"
                            title="View error details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {(!replays || replays.length === 0) && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No replays yet</h3>
              <p className="text-gray-500">Replay your first transaction to see it here</p>
            </div>
          )}
        </div>

        {/* Replay Summary */}
        {replays && replays.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {replays.filter(r => r.status === 'success' || r.status === 'simulated').length}
              </div>
              <div className="text-white/70 text-sm">Successful Replays</div>
            </div>
            
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {replays.filter(r => r.status === 'failed').length}
              </div>
              <div className="text-white/70 text-sm">Failed Replays</div>
            </div>
            
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {formatGas(replays.reduce((sum, r) => sum + parseInt(r.gasEstimate || 0), 0))}
              </div>
              <div className="text-white/70 text-sm">Total Gas Estimated</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
