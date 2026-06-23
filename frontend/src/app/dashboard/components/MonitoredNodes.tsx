import React from 'react';
import { Cpu } from 'lucide-react';
import { HISTORY_PATH, navigateToAppPath } from '../../../lib/navigation';
import type { Asset } from '../types';

interface MonitoredNodesProps {
  assets: Asset[];
  toggleAssetStatus: (id: string, name: string) => void;
}

export default function MonitoredNodes({ assets, toggleAssetStatus }: MonitoredNodesProps) {
  return (
    <div className="sci-fi-panel p-6 relative overflow-hidden">
      <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-gray-300">
        <Cpu className="w-4 h-4 text-[#10B981]" />
        Monitored Sentinel Nodes
      </h2>
      <div className="space-y-4">
        {assets.map((asset) => (
          <div key={asset.id} className="border border-gray-800/50 bg-black/50 rounded-lg p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="text-xs font-bold text-white">{asset.name}</h4>
                <span className="text-[10px] text-gray-500 font-mono">{asset.address}</span>
              </div>

              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${asset.status === 'ACTIVE' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-red-500/10 text-red-500'}`}>
                {asset.status}
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-800/50 flex justify-between items-center text-[9px] text-gray-500">
              <div>
                <span>LATENCY: </span>
                <span className="text-white">{asset.latency}</span>
              </div>
              <div>
                <span>SCANS: </span>
                <span className="text-white">{asset.events}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateToAppPath(window.location, `${HISTORY_PATH}?protocol=${encodeURIComponent(asset.address)}`)}
                  className="text-[#10B981] hover:underline"
                >
                  View Activity
                </button>
                {asset.id.startsWith('d') ? (
                  <span className="text-[8px] text-gray-600 uppercase">System</span>
                ) : (
                  <button
                    onClick={() => toggleAssetStatus(asset.id, asset.name)}
                    className="text-[#10B981] hover:underline"
                  >
                    {asset.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
