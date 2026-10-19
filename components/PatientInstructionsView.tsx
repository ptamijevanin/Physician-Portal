import React from 'react';
import { parsePatientInstructionsXml } from '../utils/patientInstructionsXml';

interface PatientInstructionsViewProps {
  content: string;
}

const PatientInstructionsView: React.FC<PatientInstructionsViewProps> = ({ content }) => {
  const { blocks } = parsePatientInstructionsXml(content);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {blocks.map((block, index) => (
        <div key={`${block.id}-${index}`} className="space-y-3">
          <h3 className="text-lg font-bold text-teal-700 border-b border-slate-100 pb-2">
            {block.title || `Section ${index + 1}`}
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{block.content || '—'}</p>
        </div>
      ))}
    </div>
  );
};

export default PatientInstructionsView;
