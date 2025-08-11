import React, { useState } from 'react';

export default function HelpButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-500 text-white rounded-full w-12 h-12 shadow-lg focus:outline-none"
        onClick={() => setOpen(!open)}
      >
        ?
      </button>
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-72 p-4 bg-black/80 backdrop-blur rounded-xl text-blue-100 text-sm space-y-2 shadow-lg">
          <div className="text-white font-medium mb-1">Visualizer Help</div>
          <p>• Scroll or pinch to zoom.
          <br/>• Drag background to pan.
          <br/>• Click a node to view details.
          <br/>• Use Play/Pause to animate timeline.</p>
          <button className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-white text-xs" onClick={() => setOpen(false)}>Close</button>
        </div>
      )}
    </>
  );
}
