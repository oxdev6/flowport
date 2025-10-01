import { ethers } from 'ethers';

const ZERO_KEY_32 = '0x' + '00'.repeat(32);

async function getBlockForDump(provider, blockTag = 'latest') {
  if (typeof blockTag === 'number' || (typeof blockTag === 'string' && /^\d+$/.test(blockTag))) {
    const num = typeof blockTag === 'number' ? blockTag : parseInt(blockTag, 10);
    const b = await provider.getBlock(num);
    return b;
  }
  // Find a recent block with at least one tx (debug_storageRangeAt requires a tx index)
  const latestNum = await provider.getBlockNumber();
  for (let n = latestNum; n >= Math.max(0, latestNum - 1000); n--) {
    const b = await provider.getBlock(n);
    if (b && Array.isArray(b.transactions) && b.transactions.length > 0) return b;
  }
  // As a last resort, return latest even if empty; some nodes may ignore txIndex
  return await provider.getBlock('latest');
}

async function tryStorageRangeAt(provider, { blockHash, address, startKey, maxResults }) {
  try {
    const res = await provider.send('debug_storageRangeAt', [blockHash, 0, address, startKey, maxResults]);
    return res;
  } catch (e) {
    return null;
  }
}

export async function dumpContractStorage({ provider, address, blockTag = 'latest', pageSize = 1024 }) {
  const block = await getBlockForDump(provider, blockTag);
  if (!block || !block.hash) throw new Error('Failed to resolve a block for storage dump');

  const storage = {};
  let startKey = ZERO_KEY_32;
  let pages = 0;

  while (true) {
    const res = await tryStorageRangeAt(provider, { blockHash: block.hash, address, startKey, maxResults: pageSize });
    if (!res) break; // debug API not available
    const entries = res.storage || {};
    for (const [k, v] of Object.entries(entries)) {
      storage[ethers.hexlify(k)] = v.value; // keep hex values
    }
    pages++;
    if (!res.nextKey || res.nextKey === '0x' || res.nextKey === ZERO_KEY_32) break;
    startKey = res.nextKey;
    if (pages > 1024) break; // safety guard
  }

  return { blockNumber: block.number, blockHash: block.hash, storage };
}

function toBytes32Key(value, type) {
  if (type === 'address') {
    const addr = ethers.getAddress(value);
    return ethers.zeroPadValue(addr, 32);
  }
  if (type === 'bytes32') {
    return ethers.zeroPadValue(value, 32);
  }
  // default: uint256 or numeric
  const big = typeof value === 'bigint' ? value : BigInt(value);
  return ethers.zeroPadValue(ethers.toBeHex(big), 32);
}

function toBytes32Slot(slotIndex) {
  const big = typeof slotIndex === 'bigint' ? slotIndex : BigInt(slotIndex);
  return ethers.zeroPadValue(ethers.toBeHex(big), 32);
}

function computeMappingLeafSlot(baseSlot, keyBytes32) {
  const slotBytes = toBytes32Slot(baseSlot);
  return ethers.keccak256(ethers.concat([keyBytes32, slotBytes]));
}

function computeNestedMappingLeafSlot(baseSlot, outerKeyBytes32, innerKeyBytes32) {
  const innerBase = ethers.keccak256(ethers.concat([outerKeyBytes32, toBytes32Slot(baseSlot)]));
  return ethers.keccak256(ethers.concat([innerKeyBytes32, ethers.getBytes(innerBase)]));
}

export async function exportMappings({ provider, address, blockTag = 'latest', spec }) {
  // spec: { mappings: [ { name, slot, keyType | keyTypes, keys } ] }
  if (!spec || !Array.isArray(spec.mappings)) return { mappings: {} };
  const result = {};
  for (const m of spec.mappings) {
    const name = m.name || `mapping@${m.slot}`;
    if (Array.isArray(m.keyTypes) && m.keyTypes.length === 2) {
      // nested mapping: keyTypes[0], keyTypes[1]; keys: [ [outerKey, innerKeys[]], ... ]
      const [outerType, innerType] = m.keyTypes;
      const obj = {};
      for (const entry of m.keys || []) {
        const outerKey = entry[0];
        const innerKeys = entry[1] || [];
        const outerB32 = toBytes32Key(outerKey, outerType);
        const innerBase = ethers.keccak256(ethers.concat([outerB32, toBytes32Slot(m.slot)]));
        const innerBaseBytes = ethers.getBytes(innerBase);
        const innerObj = {};
        for (const ik of innerKeys) {
          const innerB32 = toBytes32Key(ik, innerType);
          const leaf = ethers.keccak256(ethers.concat([innerB32, innerBaseBytes]));
          const val = await provider.getStorage(address, leaf, blockTag);
          // ethers v6: getStorageAt(address, position, blockTag)
        }
        result[name] = result[name] || {};
        result[name][String(outerKey)] = innerObj;
      }
    } else {
      // simple mapping
      const keyType = m.keyType || (Array.isArray(m.keyTypes) ? m.keyTypes[0] : 'uint256');
      const obj = {};
      for (const k of m.keys || []) {
        const kb32 = toBytes32Key(k, keyType);
        const leaf = computeMappingLeafSlot(m.slot, kb32);
        const val = await provider.getStorageAt(address, leaf, blockTag);
        obj[String(k)] = val;
      }
      result[name] = obj;
    }
  }
  return { mappings: result };
}

export async function dumpState({ provider, address, blockTag = 'latest', pageSize = 1024, mappingSpec }) {
  const network = await provider.getNetwork();
  const storageDump = await dumpContractStorage({ provider, address, blockTag, pageSize });
  let mappings = {};
  if (mappingSpec) {
    try {
      const res = await exportMappings({ provider, address, blockTag, spec: mappingSpec });
      mappings = res.mappings || {};
    } catch {}
  }
  return {
    address,
    chainId: Number(network.chainId || 0),
    blockNumber: storageDump.blockNumber,
    blockHash: storageDump.blockHash,
    storage: storageDump.storage,
    mappings
  };
}


