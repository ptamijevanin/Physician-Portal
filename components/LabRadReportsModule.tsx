
import React, { useState, useMemo } from 'react';
import { Microscope, FileSearch, FileText, Download, Search, Calendar, User, Building2, X, LineChart } from 'lucide-react';
import ModulePageHeader from './ModulePageHeader';
import LabRadReportPDFViewer from './LabRadReportPDFViewer';
import { Patient } from '../types';
import { CaseDetails } from '../utils/pdfDocumentLayout';
import {
  generateLabRadReportPdfBlob,
  getLabRadReportPdfFilename,
  LabRadReport,
} from '../utils/generateLabRadReportPdf';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LabRadReportsModuleProps {
  patient: Patient;
  caseDetails: CaseDetails;
}

const MOCK_REPORTS: LabRadReport[] = [
  {
    id: 'R1',
    type: 'Laboratory',
    service: 'Comprehensive Metabolic Panel',
    date: '2024-03-12 08:30',
    status: 'Critical',
    performingOu: 'Main Lab',
    physician: 'Dr. Sarah Connor',
    summary: 'Potassium level 6.2 mmol/L (Critical High). Glucose 145 mg/dL.',
    isCritical: true,
    details: [
      { code: 'GLU', parameter: 'Glucose', result: '145', unit: 'mg/dL', referenceRange: '70-99', flag: 'High' },
      { code: 'BUN', parameter: 'BUN', result: '18', unit: 'mg/dL', referenceRange: '7-20', flag: 'Normal' },
      { code: 'CREA', parameter: 'Creatinine', result: '1.1', unit: 'mg/dL', referenceRange: '0.7-1.3', flag: 'Normal' },
      { code: 'NA', parameter: 'Sodium', result: '138', unit: 'mmol/L', referenceRange: '136-145', flag: 'Normal' },
      { code: 'K', parameter: 'Potassium', result: '6.2', unit: 'mmol/L', referenceRange: '3.5-5.1', flag: 'Critical' },
      { code: 'CL', parameter: 'Chloride', result: '102', unit: 'mmol/L', referenceRange: '98-107', flag: 'Normal' },
      { code: 'CO2', parameter: 'CO2', result: '24', unit: 'mmol/L', referenceRange: '23-29', flag: 'Normal' },
    ],
  },
  {
    id: 'R2',
    type: 'Radiology',
    service: 'CT Chest without contrast',
    date: '2024-03-11 14:20',
    status: 'Final',
    performingOu: 'Radiology Dept B',
    physician: 'Dr. James Wilson',
    summary: 'No acute pulmonary findings. Mild cardiomegaly noted.',
    findings:
      'The lungs are clear. No pleural effusion or pneumothorax. The heart size is at the upper limit of normal. No suspicious pulmonary nodules identified. The mediastinal and hilar contours are normal. Visualized upper abdominal organs are unremarkable.',
    impression: '1. No acute cardiopulmonary process.\n2. Mild cardiomegaly.',
  },
  {
    id: 'R3',
    type: 'Laboratory',
    service: 'CBC with differential',
    date: '2024-03-12 09:15',
    status: 'Final',
    performingOu: 'Main Lab',
    physician: 'Dr. Sarah Connor',
    summary: 'WBC 12.5 (High), Hgb 11.2 (Low). Platelets normal.',
    details: [
      { code: 'WBC', parameter: 'WBC', result: '12.5', unit: 'x10E3/uL', referenceRange: '4.5-11.0', flag: 'High' },
      { code: 'RBC', parameter: 'RBC', result: '3.8', unit: 'x10E6/uL', referenceRange: '4.2-5.4', flag: 'Low' },
      { code: 'HGB', parameter: 'Hemoglobin', result: '11.2', unit: 'g/dL', referenceRange: '12.0-16.0', flag: 'Low' },
      { code: 'HCT', parameter: 'Hematocrit', result: '34.1', unit: '%', referenceRange: '37.0-47.0', flag: 'Low' },
      { code: 'PLT', parameter: 'Platelets', result: '245', unit: 'x10E3/uL', referenceRange: '150-450', flag: 'Normal' },
    ],
  },
  {
    id: 'R4',
    type: 'Radiology',
    service: 'X-Ray Chest 1 View',
    date: '2024-03-10 10:00',
    status: 'Final',
    performingOu: 'Radiology Dept A',
    physician: 'Dr. Robert Miller',
    summary: 'Clear lungs. Normal heart size. No pleural effusion.',
    findings:
      'Single frontal view of the chest. Lungs are clear. No focal consolidation, effusion, or pneumothorax. Heart size is normal. Bony structures are intact.',
    impression: 'Normal chest X-ray.',
  },
];

type FilterValue = 'ALL' | 'Laboratory' | 'Radiology';

interface LabResultRow {
  code?: string;
  parameter: string;
  result: string;
  unit: string;
  referenceRange: string;
  flag?: 'Normal' | 'High' | 'Low' | 'Critical';
  reportId: string;
  date: string;
  service: string;
}

const filterChipBase =
  'px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-widest transition-all border';

const getFilterChipClass = (key: FilterValue | 'results', active: boolean) => {
  if (!active) {
    if (key === 'results') {
      return `${filterChipBase} bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50`;
    }
    return `${filterChipBase} bg-white text-slate-500 border-slate-200 hover:bg-slate-50`;
  }
  switch (key) {
    case 'ALL':
      return `${filterChipBase} bg-slate-800 text-white border-slate-800 shadow-sm`;
    case 'Laboratory':
      return `${filterChipBase} bg-blue-600 text-white border-blue-600 shadow-sm`;
    case 'Radiology':
      return `${filterChipBase} bg-indigo-600 text-white border-indigo-600 shadow-sm`;
    case 'results':
      return `${filterChipBase} bg-emerald-600 text-white border-emerald-600 shadow-sm`;
  }
};

const getTypeBadgeClass = (type: LabRadReport['type']) =>
  type === 'Laboratory'
    ? 'bg-blue-50 text-blue-700 border-blue-100'
    : 'bg-indigo-50 text-indigo-700 border-indigo-100';

const getTypeIconClass = (type: LabRadReport['type']) =>
  type === 'Laboratory' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600';

const getSectionHeaderClass = (viewMode: 'reports' | 'results', filter: FilterValue) => {
  if (viewMode === 'results') return 'bg-emerald-50 text-emerald-600';
  if (filter === 'Radiology') return 'bg-indigo-50 text-indigo-600';
  if (filter === 'Laboratory') return 'bg-blue-50 text-blue-600';
  return 'bg-cyan-50 text-cyan-600';
};

const getStatusBadgeClass = (status: LabRadReport['status']) => {
  switch (status) {
    case 'Critical':
      return 'bg-rose-50 text-rose-700 border-rose-100';
    case 'Preliminary':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    default:
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  }
};

const getFlagBadgeClass = (flag: LabResultRow['flag']) => {
  switch (flag) {
    case 'Critical':
      return 'bg-rose-50 text-rose-700 border-rose-100';
    case 'High':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'Low':
      return 'bg-blue-50 text-blue-700 border-blue-100';
    default:
      return 'bg-slate-50 text-slate-500 border-slate-100';
  }
};

const LabRadReportsModule: React.FC<LabRadReportsModuleProps> = ({ patient, caseDetails }) => {
  const [filter, setFilter] = useState<FilterValue>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingReport, setViewingReport] = useState<LabRadReport | null>(null);
  const [viewMode, setViewMode] = useState<'reports' | 'results'>('reports');
  const [graphCode, setGraphCode] = useState<string | null>(null);

  const filteredReports = MOCK_REPORTS.filter((r) => {
    const matchesFilter = filter === 'ALL' || r.type === filter;
    const matchesSearch =
      r.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleDownloadPDF = (report: LabRadReport) => {
    const blob = generateLabRadReportPdfBlob(report, patient, caseDetails);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getLabRadReportPdfFilename(report, patient.id);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const allResults = useMemo<LabResultRow[]>(() => {
    const results: LabResultRow[] = [];
    MOCK_REPORTS.forEach((report) => {
      if (report.type === 'Laboratory' && report.details) {
        report.details.forEach((detail) => {
          results.push({
            ...detail,
            reportId: report.id,
            date: report.date,
            service: report.service,
          });
        });
      }
    });
    return results;
  }, []);

  const graphData = useMemo(() => {
    if (!graphCode) return [];
    const baseResult = allResults.find((r) => r.code === graphCode);
    if (!baseResult) return [];

    const baseVal = parseFloat(baseResult.result);
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 30);
      const variation = (Math.random() - 0.5) * (baseVal * 0.2);
      data.push({
        date: d.toISOString().split('T')[0],
        value: i === 0 ? baseVal : Number((baseVal + variation).toFixed(1)),
        range: baseResult.referenceRange,
      });
    }
    return data;
  }, [graphCode, allResults]);

  const graphParameter = allResults.find((r) => r.code === graphCode);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <ModulePageHeader
        title="Lab/Rad Reports"
        subtitle="Laboratory results and radiology imaging reports"
      />

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getSectionHeaderClass(viewMode, filter)}`}>
              {viewMode === 'results' ? (
                <LineChart size={18} />
              ) : filter === 'Radiology' ? (
                <FileSearch size={18} />
              ) : (
                <Microscope size={18} />
              )}
            </div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              {viewMode === 'reports' ? 'Reports' : 'Lab Results'}
            </h4>
          </div>
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest px-2.5 py-1 bg-slate-50 rounded-md border border-slate-100">
            {viewMode === 'reports' ? `${filteredReports.length} Reports` : `${allResults.length} Results`}
          </span>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setFilter('ALL');
                setViewMode('reports');
              }}
              className={getFilterChipClass('ALL', filter === 'ALL' && viewMode === 'reports')}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                setFilter('Laboratory');
                setViewMode('reports');
              }}
              className={getFilterChipClass('Laboratory', filter === 'Laboratory' && viewMode === 'reports')}
            >
              Laboratory
            </button>
            <button
              type="button"
              onClick={() => {
                setFilter('Radiology');
                setViewMode('reports');
              }}
              className={getFilterChipClass('Radiology', filter === 'Radiology' && viewMode === 'reports')}
            >
              Radiology
            </button>
            <span className="hidden sm:block h-4 w-px bg-slate-200 mx-0.5" />
            <button
              type="button"
              onClick={() => {
                setFilter('Laboratory');
                setViewMode('results');
              }}
              className={`inline-flex items-center gap-1.5 ${getFilterChipClass('results', viewMode === 'results')}`}
            >
              <LineChart size={12} />
              Graph Results
            </button>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-400 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2 max-h-[520px] overflow-y-auto custom-scrollbar">
          {viewMode === 'reports' ? (
            filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <div
                  key={report.id}
                  className={`group text-xs font-medium p-2.5 bg-slate-50 rounded-lg border border-slate-100 border-l-4 ${
                    report.type === 'Laboratory' ? 'border-l-blue-500' : 'border-l-indigo-500'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`p-1.5 rounded-lg shrink-0 ${getTypeIconClass(report.type)}`}>
                      {report.type === 'Laboratory' ? <Microscope size={14} /> : <FileSearch size={14} />}
                    </div>
                    <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center justify-between gap-2 min-w-0 flex-1">
                      <span className="text-slate-700 truncate">{report.service}</span>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-medium uppercase tracking-wider ${getStatusBadgeClass(report.status)}`}
                      >
                        {report.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setViewingReport(report)}
                        className="inline-flex h-7 items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 text-[9px] font-semibold uppercase tracking-widest text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        <FileText size={11} />
                        <span className="hidden sm:inline">PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadPDF(report)}
                        className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-800 bg-slate-800 px-2 text-[9px] font-semibold uppercase tracking-widest text-white hover:bg-slate-900 transition-colors"
                        aria-label={`Download ${report.service}`}
                      >
                        <Download size={11} />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-600 mt-1 line-clamp-2 leading-relaxed">{report.summary}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-md border text-[10px] font-medium uppercase tracking-wider flex items-center gap-1 ${getTypeBadgeClass(report.type)}`}
                    >
                      {report.type === 'Laboratory' ? <Microscope size={10} /> : <FileSearch size={10} />}
                      {report.type}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar size={10} />
                      {report.date}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Building2 size={10} />
                      {report.performingOu}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1 truncate max-w-[160px]">
                      <User size={10} />
                      {report.physician}
                    </span>
                  </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs font-medium text-slate-400 italic">No reports found matching your criteria</p>
            )
          ) : allResults.length > 0 ? (
            allResults.map((res, idx) => (
              <div
                key={`${res.reportId}-${res.code}-${idx}`}
                className="text-xs font-medium p-2.5 bg-slate-50 rounded-lg border border-slate-100 border-l-4 border-l-blue-400"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-slate-700">{res.parameter}</span>
                    {res.code && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-md border border-blue-100 bg-blue-50 text-[10px] font-medium uppercase tracking-wider text-blue-700">
                        {res.code}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setGraphCode(res.code ?? null)}
                    className="p-1 text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 rounded-md transition-colors shrink-0"
                    title="View historical trend"
                    aria-label={`View trend for ${res.parameter}`}
                  >
                    <LineChart size={14} />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span
                    className={`font-medium ${
                      res.flag === 'Critical'
                        ? 'text-rose-700'
                        : res.flag === 'High'
                          ? 'text-amber-700'
                          : res.flag === 'Low'
                            ? 'text-blue-700'
                            : 'text-slate-700'
                    }`}
                  >
                    {res.result}{' '}
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{res.unit}</span>
                  </span>
                  {res.flag && res.flag !== 'Normal' && (
                    <span
                      className={`px-2 py-0.5 rounded-md border text-[10px] font-medium uppercase tracking-wider ${getFlagBadgeClass(res.flag)}`}
                    >
                      {res.flag}
                    </span>
                  )}
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    Range: {res.referenceRange}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    {res.date.split(' ')[0]}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs font-medium text-slate-400 italic">No lab results available</p>
          )}
        </div>
      </div>

      <LabRadReportPDFViewer
        isOpen={!!viewingReport}
        onClose={() => setViewingReport(null)}
        report={viewingReport}
        patient={patient}
        caseDetails={caseDetails}
      />

      {graphCode && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                  <LineChart size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Historical Trend</h3>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                    {graphParameter?.parameter} ({graphCode})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGraphCode(null)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors shrink-0"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 h-[320px] sm:h-[400px]">
              {graphData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <RechartsLineChart data={graphData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickMargin={10} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      labelStyle={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 5, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs font-medium text-slate-400 italic">
                  No historical data available
                </div>
              )}
            </div>

            <div className="px-4 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Result Value</span>
              </div>
              <button
                type="button"
                onClick={() => setGraphCode(null)}
                className="inline-flex h-9 items-center justify-center px-4 rounded-xl bg-slate-800 text-[9px] font-semibold uppercase tracking-widest text-white hover:bg-slate-900 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabRadReportsModule;
