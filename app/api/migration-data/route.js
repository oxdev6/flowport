import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const deploymentsDir = path.join(process.cwd(), 'migration', 'deployments')
    const deployments = []
    
    // Read deployment records
    if (fs.existsSync(deploymentsDir)) {
      const files = fs.readdirSync(deploymentsDir).filter(f => f.endsWith('.json'))
      
      for (const file of files) {
        const filePath = path.join(deploymentsDir, file)
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        
        deployments.push({
          id: deployments.length + 1,
          contract: data.contract || file.replace(/^.*?-/, '').replace('.json', ''),
          address: data.address,
          network: data.network || file.split('-')[0],
          status: 'success', // Assume success if file exists
          gasUsed: data.gasUsed || '0',
          timestamp: data.timestamp || new Date().toISOString(),
          txHash: data.txHash || '0x0000000000000000000000000000000000000000000000000000000000000000'
        })
      }
    }

    // Create sample replay data (in production, this would come from actual replay logs)
    const replays = [
      {
        id: 1,
        originalHash: '0xa2e77ff65e5091806e76ccb5f1788dd1e96ba14b2b3e325ec3c5c58f82a4e7ab',
        status: 'simulated',
        gasEstimate: '27687',
        blockNumber: 182670837,
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        originalHash: '0x561e3327a91cbd4fec099cf417bac5db26bef05fd7befe0159a096ff5c23cc6a',
        status: 'simulated',
        gasEstimate: '27687',
        blockNumber: 182670838,
        timestamp: new Date().toISOString()
      }
    ]

    // Calculate stats
    const totalDeployments = deployments.length
    const successfulDeployments = deployments.filter(d => d.status === 'success').length
    const failedDeployments = totalDeployments - successfulDeployments
    const totalReplays = replays.length
    const successfulReplays = replays.filter(r => r.status === 'success' || r.status === 'simulated').length
    const failedReplays = totalReplays - successfulReplays
    const totalGasUsed = deployments.reduce((sum, d) => sum + parseInt(d.gasUsed || 0), 0)
    const averageGasPerTx = totalDeployments > 0 ? totalGasUsed / totalDeployments : 0

    const stats = {
      totalDeployments,
      successfulDeployments,
      failedDeployments,
      totalReplays,
      successfulReplays,
      failedReplays,
      totalGasUsed,
      averageGasPerTx
    }

    return NextResponse.json({
      success: true,
      data: {
        deployments,
        replays,
        stats
      }
    })
  } catch (error) {
    console.error('Error loading migration data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load migration data' },
      { status: 500 }
    )
  }
}
