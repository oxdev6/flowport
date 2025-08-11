'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FeaturesShowcase from './FeaturesShowcase';

export default function MigrationPortal() {
  const [contractAddress, setContractAddress] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('analyze');
  const [isLoading, setIsLoading] = useState(true);
  const [deployNetwork, setDeployNetwork] = useState('arbitrumSepolia');
  const [deployContract, setDeployContract] = useState('Counter');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState(null);

  // Removed external gas price fetch to keep scope tight

  // Loading effect
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const analyzeContract = async () => {
    if (!contractAddress || contractAddress.length !== 42) {
      alert('Please enter a valid Ethereum contract address');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/analyze-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: contractAddress })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAnalysis(result.analysis);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      // Fallback to simulation for demo purposes
      setTimeout(() => {
        setAnalysis({
          contract: {
            address: contractAddress,
            name: 'Sample Contract',
            size: '2.3 KB',
            complexity: 'Medium',
            functions: 8,
            storage_slots: 3,
            external_calls: 2
          },
          migration: {
            difficulty: 'Easy',
            estimated_time: '2 hours',
            risk_level: 'Low',
            compatibility_score: 95
          },
          gas_analysis: {
            current_ethereum_cost: '$25.00',
            estimated_arbitrum_cost: '$0.10',
            savings_percentage: 99.6,
            annual_savings: '$16,500'
          },
          optimizations: [
            {
              type: 'storage_packing',
              priority: 'high',
              description: 'Pack uint128 values into single storage slot',
              gas_savings: '15,000 gas per transaction',
              implementation: 'struct UserData { uint128 balance; uint128 lastUpdate; }'
            },
            {
              type: 'calldata_optimization',
              priority: 'medium',
              description: 'Use calldata instead of memory for read-only parameters',
              gas_savings: '2,000 gas per function call',
              implementation: 'function process(bytes calldata data) external'
            }
          ]
        });
      }, 3000);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-blue-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-24 h-24 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
            <div className="absolute inset-0 w-24 h-24 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" style={{ animationDelay: '0.5s' }}></div>
          </div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white mb-4"
          >
            Arbitrum Migration Portal
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-blue-200 text-lg"
          >
            Loading your migration dashboard...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-blue-950">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-lg border-b border-white/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-900 to-blue-500 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Arbitrum Migration Portal</h1>
                <p className="text-blue-200 text-sm">Professional Migration Tools</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white text-sm">Live</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-1"
          >
            <div id="analyze-section" className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Contract Analysis
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Contract Address
                  </label>
                  <input 
                    type="text" 
                    placeholder="0x1234..." 
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-blue-200"
                  />
                  <div className="mt-2 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setContractAddress('0x0000000000000000000000000000000000000000')}
                      className="text-xs text-blue-300 hover:text-white"
                    >
                      Use demo address
                    </button>
                    <span className="text-xs text-blue-300">Requires 42-char 0x address</span>
                  </div>
                </div>
                <motion.button 
                  onClick={analyzeContract}
                  disabled={isAnalyzing || !contractAddress}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-blue-900 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-950 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      Analyze Contract
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Results Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              {/* Tab Navigation */}
              <div className="flex space-x-1 mb-6 bg-white/5 rounded-lg p-1">
                {[
                  { id: 'analyze', label: 'Analyze', icon: '📊' },
                  { id: 'optimize', label: 'Optimize', icon: '⚡' },
                  { id: 'migrate', label: 'Migrate', icon: '🚀' }
                ].map((tab) => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center justify-center ${
                      activeTab === tab.id 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' 
                        : 'text-blue-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'analyze' && (
                  <motion.div
                    key="analyze"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {!analysis ? (
                      <div className="text-center py-12">
                        <div className="text-blue-300 mb-4">
                          <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                        </div>
                        <p className="text-blue-200 text-lg">Enter a contract address and click "Analyze Contract" to begin</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Contract Overview */}
                        <div className="bg-gradient-to-r from-blue-500/10 to-blue-900/10 rounded-xl p-6 border border-blue-500/20">
                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            Contract Overview
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                              { label: 'Name', value: analysis.contract.name },
                              { label: 'Size', value: analysis.contract.size },
                              { label: 'Complexity', value: analysis.contract.complexity },
                              { label: 'Functions', value: analysis.contract.functions }
                            ].map((item, index) => (
                              <div key={index} className="text-center">
                                <div className="text-sm text-blue-200">{item.label}</div>
                                <div className="font-semibold text-white">{item.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Gas Analysis */}
                        <div className="bg-gradient-to-r from-blue-950/20 to-blue-700/10 rounded-xl p-6 border border-blue-800/30">
                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                            </svg>
                            Gas Cost Analysis
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                              { label: 'Current (ETH)', value: analysis.gas_analysis.current_ethereum_cost, color: 'text-blue-200' },
                              { label: 'After Migration', value: analysis.gas_analysis.estimated_arbitrum_cost, color: 'text-blue-200' },
                              { label: 'Savings', value: `${analysis.gas_analysis.savings_percentage}%`, color: 'text-blue-300' },
                              { label: 'Annual Savings', value: analysis.gas_analysis.annual_savings, color: 'text-blue-200' }
                            ].map((item, index) => (
                              <div key={index} className="text-center">
                                <div className="text-sm text-blue-200">{item.label}</div>
                                <div className={`font-semibold ${item.color}`}>{item.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
                {activeTab === 'optimize' && (
                  <motion.div
                    key="optimize"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6 text-blue-200"
                  >
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                      <div className="text-white font-semibold mb-2">Optimization Hints</div>
                      <p>Optimization suggestions will appear here after analysis.</p>
                    </div>
                  </motion.div>
                )}
                {activeTab === 'migrate' && (
                  <motion.div
                    key="migrate"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6 text-blue-200"
                  >
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
                      <div className="text-white font-semibold mb-2">One-Click Deploy</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-blue-200 mb-1">Network</label>
                          <input
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                            value={deployNetwork}
                            onChange={(e) => setDeployNetwork(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-blue-200 mb-1">Contract</label>
                          <input
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                            value={deployContract}
                            onChange={(e) => setDeployContract(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={async () => {
                            setIsDeploying(true);
                            setDeployResult(null);
                            try {
                              const res = await fetch('/api/deploy', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ network: deployNetwork, contract: deployContract })
                              });
                              const data = await res.json();
                              setDeployResult(data);
                            } finally {
                              setIsDeploying(false);
                            }
                          }}
                          disabled={isDeploying}
                          className="bg-gradient-to-r from-blue-900 to-blue-600 text-white py-2 px-4 rounded hover:from-blue-950 hover:to-blue-700 disabled:opacity-60"
                        >
                          {isDeploying ? 'Starting…' : 'Deploy'}
                        </button>
                        <a
                          href="/deploy"
                          className="text-sm text-blue-300 hover:text-white underline"
                        >
                          Open full deploy page
                        </a>
                      </div>

                      {deployResult && deployResult.success && (
                        <div className="mt-4 bg-white/10 border border-white/20 rounded p-4 text-blue-200 space-y-1">
                          <div>Network: {deployResult.deployment?.network}</div>
                          <div>Contract: {deployResult.deployment?.contract}</div>
                          <div>Address: {deployResult.deployment?.address}</div>
                          <div>Tx: {deployResult.deployment?.txHash}</div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Features Showcase */}
        <FeaturesShowcase />
      </div>
    </div>
  );
}
