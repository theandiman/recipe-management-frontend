import React from 'react';

interface InstructionDiffViewProps {
  original: string;
  refined: string;
  onAccept: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

function diffWords(orig: string, ref: string): React.ReactNode[] {
  // Simple word diff: strikethrough for removed, highlight for added
  const origWords = orig.split(/(\s+)/);
  const refWords = ref.split(/(\s+)/);
  let i = 0, j = 0;
  const nodes: React.ReactNode[] = [];
  while (i < origWords.length || j < refWords.length) {
    if (origWords[i] === refWords[j]) {
      nodes.push(<span key={i + '-' + j}>{origWords[i]}</span>);
      i++; j++;
    } else if (refWords[j] && !origWords.includes(refWords[j])) {
      nodes.push(<mark key={'add-' + j} className="bg-green-100 text-green-800 rounded px-1">{refWords[j]}</mark>);
      j++;
    } else if (origWords[i] && !refWords.includes(origWords[i])) {
      nodes.push(<span key={'del-' + i} className="line-through text-red-500">{origWords[i]}</span>);
      i++;
    } else {
      // fallback: show both
      if (origWords[i]) nodes.push(<span key={'o-' + i}>{origWords[i]}</span>);
      if (refWords[j]) nodes.push(<mark key={'r-' + j}>{refWords[j]}</mark>);
      i++; j++;
    }
  }
  return nodes;
}

export const InstructionDiffView: React.FC<InstructionDiffViewProps> = ({
  original,
  refined,
  onAccept,
  onReject,
  isLoading,
}) => (
  <div className="border rounded p-3 bg-gray-50 flex flex-col gap-2">
    <div className="text-sm">
      {diffWords(original, refined)}
    </div>
    <div className="flex gap-2 mt-2">
      <button type="button" onClick={onAccept} className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700" disabled={isLoading}>
        ✓ Accept
      </button>
      <button type="button" onClick={onReject} className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300" disabled={isLoading}>
        ✗ Reject
      </button>
      {isLoading && <span className="ml-2 animate-spin">⏳</span>}
    </div>
  </div>
);
