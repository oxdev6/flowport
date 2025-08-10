export default function DeploymentTable({ deployments }) {
  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  const formatHash = (hash) => {
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 6)}`
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return <span className="status-success">Success</span>
      case 'failed':
        return <span className="status-error">Failed</span>
      case 'pending':
        return <span className="status-warning">Pending</span>
      default:
        return <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded-full text-sm font-medium">{status}</span>
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contract
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Address
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Network
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Gas Used
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Transaction
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Timestamp
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {deployments.map((deployment) => (
            <tr key={deployment.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {deployment.contract}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 font-mono">
                  {formatAddress(deployment.address)}
                </div>
                <div className="text-xs text-gray-500">
                  {deployment.address}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 capitalize">
                  {deployment.network}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(deployment.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {parseInt(deployment.gasUsed).toLocaleString()}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 font-mono">
                  {formatHash(deployment.txHash)}
                </div>
                <a 
                  href={`https://sepolia.arbiscan.io/tx/${deployment.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  View on Arbiscan
                </a>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {formatTimestamp(deployment.timestamp)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {deployments.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg">No deployments found</div>
          <p className="text-gray-400 text-sm mt-2">
            Run a deployment to see results here
          </p>
        </div>
      )}
    </div>
  )
}
