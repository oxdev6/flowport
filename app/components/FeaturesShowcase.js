'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { MdRocketLaunch, MdAssessment, MdReplay, MdBuild, MdTrendingUp, MdPeople } from 'react-icons/md';

export default function FeaturesShowcase() {
  const router = useRouter();
  const features = [
    {
      icon: <MdRocketLaunch size={32} />, // One-Click Deploy
      title: 'One-Click Deploy',
      description: 'Simple web interface for non-technical users with advanced CLI for developers',
      gradient: 'from-blue-900/20 to-blue-500/20',
      border: 'border-blue-800/30',
      delay: 0.1,
      onClick: () => router.push('/deploy')
    },
    {
      icon: <MdAssessment size={32} />, // Pre-Migration Reports
      title: 'Pre-Migration Reports',
      description: 'Professional analysis with gas savings, compatibility scores, and risk assessment',
      gradient: 'from-blue-900/20 to-blue-500/20',
      border: 'border-blue-800/30',
      delay: 0.2,
      onClick: () => router.push('/reports')
    },
    {
      icon: <MdReplay size={32} />, // Real-Time Replay
      title: 'Real-Time Replay',
      description: 'Watch transactions replay from Ethereum to Arbitrum in real-time',
      gradient: 'from-blue-900/20 to-blue-500/20',
      border: 'border-blue-800/30',
      delay: 0.3,
      onClick: () => router.push('/visualizer/421614/0xabc')
    },
    {
      icon: <MdBuild size={32} />, // Optimization Scanner
      title: 'Optimization Scanner',
      description: 'Auto-detect Arbitrum-specific optimizations and security improvements',
      gradient: 'from-blue-900/20 to-blue-500/20',
      border: 'border-blue-800/30',
      delay: 0.4,
      onClick: () => router.push('/optimize')
    },
    {
      icon: <MdTrendingUp size={32} />, // DAO Metrics
      title: 'DAO Metrics',
      description: 'Live dashboard tracking migration success and ecosystem impact',
      gradient: 'from-blue-900/20 to-blue-500/20',
      border: 'border-blue-800/30',
      delay: 0.5,
      onClick: () => router.push('/analytics')
    },
    {
      icon: <MdPeople size={32} />, // Partner Demos
      title: 'Partner Demos',
      description: 'Real-world case studies with before/after results and gas savings',
      gradient: 'from-blue-900/20 to-blue-500/20',
      border: 'border-blue-800/30',
      delay: 0.6,
      onClick: () => router.push('/gallery')
    }
  ];

  const stats = [
    { label: 'Gas Savings', value: '95%+', color: 'text-blue-200' },
    { label: 'Speed Improvement', value: '91%', color: 'text-blue-300' },
    { label: 'Cost Reduction', value: '99%', color: 'text-blue-200' },
    { label: 'Success Rate', value: '100%', color: 'text-blue-200' }
  ];

  return (
    <div className="py-16">
      {/* Stats Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-16"
      >
        <h2 className="text-3xl font-bold text-white text-center mb-12">Migration Success Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className={`text-4xl font-bold mb-2 ${stat.color}`}>{stat.value}</div>
              <div className="text-blue-200 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Features Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl font-bold text-white text-center mb-12">Onboard & Explore Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: feature.delay }}
              whileHover={{ scale: 1.05, y: -5 }}
              className={`bg-gradient-to-r ${feature.gradient} backdrop-blur-lg rounded-2xl p-6 border ${feature.border} hover:border-white/40 transition-all duration-300 group ${feature.onClick ? 'cursor-pointer' : 'opacity-80'}`}
              onClick={feature.onClick || undefined}
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 text-blue-400 flex items-center justify-center">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-blue-200">{feature.description}</p>
              {!feature.onClick && (
                <div className="mt-3 inline-block text-xs text-blue-300">Coming soon</div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Call to Action */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.7 }}
        className="mt-16 text-center"
      >
        <div className="bg-gradient-to-r from-blue-900/10 to-blue-500/10 rounded-2xl p-8 border border-blue-800/30">
          <h3 className="text-2xl font-bold text-white mb-4">Ready to Start Your Migration?</h3>
            <p className="text-blue-200 mb-6 max-w-2xl mx-auto">
            Join thousands of developers who have already migrated their contracts to Arbitrum 
            and are enjoying massive gas savings and improved performance.
          </p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-blue-900 to-blue-600 text-white py-4 px-8 rounded-xl font-medium hover:from-blue-950 hover:to-blue-700 transition-all duration-200 text-lg"
            onClick={() => {
              const el = document.getElementById('analyze-section');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            Get Started Now
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
