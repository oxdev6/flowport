export default function Header({ onRefresh }) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold text-primary-600">
              🚀 FlowPort
            </div>
            <div className="text-gray-600">
              Migration & Visualization Dashboard
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={onRefresh}
              className="btn-secondary flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
            
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-success-500 rounded-full"></div>
              <span>Connected</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
