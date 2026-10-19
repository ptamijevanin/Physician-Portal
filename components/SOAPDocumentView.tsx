import React from 'react';
import { parseSoapDocumentXml } from '../utils/soapDocumentXml';

const FieldBlock: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="space-y-2">
    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</h4>
    <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 border border-slate-100 rounded-xl p-4">
      {value || 'N/A'}
    </p>
  </div>
);

const SOAPDocumentView: React.FC<{ content: string }> = ({ content }) => {
  const data = parseSoapDocumentXml(content);

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-slate-800">
      <FieldBlock label="Purpose of Visit" value={data.purposeOfVisit} />

      {data.complaints.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Complaints</h4>
          <ul className="space-y-2">
            {data.complaints.map((complaint, index) => (
              <li
                key={index}
                className="text-sm font-medium text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3"
              >
                {complaint}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 p-5 space-y-5">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Diagnosis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldBlock label="Subjective" value={data.subjective} />
          <FieldBlock label="Objective" value={data.objective} />
        </div>
        <FieldBlock label="Assessment" value={data.assessment} />
        <FieldBlock label="Plan" value={data.plan} />
      </div>

      {(data.icdDiagnoses.length > 0) && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ICD-10</h4>
          <div className="space-y-2">
            {data.icdDiagnoses.map((item) => (
              <div key={item.code} className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                <p className="text-sm font-bold text-indigo-900 font-mono">{item.code}</p>
                <p className="text-sm font-medium text-indigo-700 mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default SOAPDocumentView;
