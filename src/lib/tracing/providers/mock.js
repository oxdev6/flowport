export async function getMockTrace({ chainId, txHash }) {
  // Return a richer mock so partner demos always render a meaningful story
  const frames = [
    { id: '0', parentId: null, type: 'CALL', from: '0xF00dF00dF00dF00dF00dF00dF00dF00dF00dF00d', to: '0xDeAdDeAdDeAdDeAdDeAdDeAdDeAdDeAdDeAd0001', functionSig: '0x', functionName: 'migrate(address)', gasUsed: 42000, depth: 0, status: 'success', children: ['1','2'] },
    { id: '1', parentId: '0', type: 'CALL', from: '0xDeAdDeAdDeAdDeAdDeAdDeAdDeAdDeAdDeAd0001', to: '0xToken000000000000000000000000000000000000', functionSig: '0xa9059cbb', functionName: 'transfer(address,uint256)', gasUsed: 18000, depth: 1, status: 'success', children: [] },
    { id: '2', parentId: '0', type: 'CALL', from: '0xDeAdDeAdDeAdDeAdDeAdDeAdDeAdDeAdDeAd0001', to: '0xC011ee0000000000000000000000000000000002', functionSig: '0x095ea7b3', functionName: 'approve(address,uint256)', gasUsed: 9000, depth: 1, status: 'success', children: ['3'] },
    { id: '3', parentId: '2', type: 'CALL', from: '0xC011ee0000000000000000000000000000000002', to: '0xMigrator00000000000000000000000000000003', functionSig: '0x23b872dd', functionName: 'transferFrom(address,address,uint256)', gasUsed: 11000, depth: 2, status: 'success', children: [] }
  ];
  return { chainId, txHash, frames };
}


