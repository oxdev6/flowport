'use client'

import { useState, useEffect } from 'react'
import MigrationStats from './components/MigrationStats'
import TransactionChart from './components/TransactionChart'
import DeploymentTable from './components/DeploymentTable'
import ReplayResults from './components/ReplayResults'
import Header from './components/Header'

export default function Dashboard() {
  const [migrationData, setMigrationData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Load migration data from local storage or API
    loadMigrationData()
  }, [])

  const loadMigrationData = async () => {
    try {
      setLoading(true)
      
      // Fetch data from API
      const response = await fetch('/api/migration-data')
      const result = await response.json()
      
      if (result.success) {
        setMigrationData(result.data)
      } else {
        throw new Error(result.error || 'Failed to load data')
      }
    } catch (err) {
      setError('Failed to load migration data')
      console.error('Error loading migration data:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    loadMigrationData()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading migration data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-error-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={refreshData} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onRefresh={refreshData} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Migration Stats */}
        <MigrationStats stats={migrationData.stats} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Transaction Chart */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Transaction Activity</h2>
            <TransactionChart data={migrationData.replays} />
          </div>
          
          {/* Replay Results */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Replay Results</h2>
            <ReplayResults replays={migrationData.replays} />
          </div>
        </div>
        
        {/* Deployment Table */}
        <div className="card mt-8">
          <h2 className="text-xl font-semibold mb-4">Deployment History</h2>
          <DeploymentTable deployments={migrationData.deployments} />
        </div>
      </main>
    </div>
  )
}
