
const LOCAL_DIAGNOSIS_DB = [
  { code: 'I10', description: 'Essential (primary) hypertension', context: 'High blood pressure with no identifiable cause.' },
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', context: 'Chronic condition affecting how the body processes blood sugar.' },
  { code: 'J45.909', description: 'Unspecified asthma, uncomplicated', context: 'Condition where airways narrow and swell, producing extra mucus.' },
  { code: 'M54.5', description: 'Low back pain', context: 'Common musculoskeletal condition affecting the lumbar region.' },
  { code: 'F41.1', description: 'Generalized anxiety disorder', context: 'Persistent and excessive worry about various things.' },
  { code: 'K21.9', description: 'Gastro-esophageal reflux disease without esophagitis', context: 'Digestive disorder where stomach acid flows back into the esophagus.' },
  { code: 'N39.0', description: 'Urinary tract infection, site not specified', context: 'Infection in any part of the urinary system.' },
  { code: 'B34.9', description: 'Viral infection, unspecified', context: 'General viral illness with non-specific symptoms.' },
  { code: 'R05', description: 'Cough', context: 'Common symptom of respiratory tract infections or allergies.' },
  { code: 'R50.9', description: 'Fever, unspecified', context: 'Elevated body temperature, often indicating infection.' },
  { code: 'E66.9', description: 'Obesity, unspecified', context: 'Excessive body fat that increases the risk of health problems.' },
  { code: 'M17.9', description: 'Osteoarthritis of knee, unspecified', context: 'Degenerative joint disease affecting the knee.' },
  { code: 'I25.10', description: 'Atherosclerotic heart disease of native coronary artery', context: 'Hardening and narrowing of the arteries that provide blood to the heart.' },
  { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified', context: 'Common cold or similar viral infection of the upper respiratory tract.' },
  { code: 'F32.9', description: 'Major depressive disorder, single episode, unspecified', context: 'Mental health disorder characterized by persistently depressed mood.' },
  { code: 'K29.70', description: 'Gastritis, unspecified, without bleeding', context: 'Inflammation of the protective lining of the stomach.' },
  { code: 'L20.9', description: 'Atopic dermatitis, unspecified', context: 'Chronic, itchy inflammation of the skin (eczema).' },
  { code: 'G43.909', description: 'Migraine, unspecified, not intractable, without status migrainosus', context: 'Recurrent throbbing headache that typically affects one side of the head.' },
  { code: 'H10.9', description: 'Unspecified conjunctivitis', context: 'Inflammation or infection of the outer membrane of the eyeball (pink eye).' },
  { code: 'E03.9', description: 'Hypothyroidism, unspecified', context: 'Condition in which the thyroid gland doesn\'t produce enough thyroid hormone.' }
];

const LOCAL_MEDICATION_DB = [
  { brandName: 'Lipitor', genericName: 'Atorvastatin', dosage: '10mg, 20mg, 40mg, 80mg', stock: 150, defaultValidityDays: 90 },
  { brandName: 'Amoxil', genericName: 'Amoxicillin', dosage: '250mg, 500mg', stock: 85, defaultValidityDays: 7 },
  { brandName: 'Glucophage', genericName: 'Metformin', dosage: '500mg, 850mg, 1000mg', stock: 200, defaultValidityDays: 90 },
  { brandName: 'Zestril', genericName: 'Lisinopril', dosage: '5mg, 10mg, 20mg, 40mg', stock: 120, defaultValidityDays: 90 },
  { brandName: 'Norvasc', genericName: 'Amlodipine', dosage: '2.5mg, 5mg, 10mg', stock: 95, defaultValidityDays: 90 },
  { brandName: 'Synthroid', genericName: 'Levothyroxine', dosage: '25mcg, 50mcg, 75mcg, 100mcg', stock: 110, defaultValidityDays: 180 },
  { brandName: 'Vicodin', genericName: 'Hydrocodone/Acetaminophen', dosage: '5mg/325mg', stock: 45, defaultValidityDays: 5 },
  { brandName: 'Ventolin', genericName: 'Albuterol', dosage: '90mcg Inhaler', stock: 30, defaultValidityDays: 30 },
  { brandName: 'Nexium', genericName: 'Esomeprazole', dosage: '20mg, 40mg', stock: 75, defaultValidityDays: 30 },
  { brandName: 'Advil', genericName: 'Ibuprofen', dosage: '200mg, 400mg, 600mg, 800mg', stock: 300, defaultValidityDays: 14 },
  { brandName: 'Tylenol', genericName: 'Acetaminophen', dosage: '325mg, 500mg, 650mg', stock: 500, defaultValidityDays: 30 },
  { brandName: 'Zoloft', genericName: 'Sertraline', dosage: '25mg, 50mg, 100mg', stock: 140, defaultValidityDays: 90 },
  { brandName: 'Lasix', genericName: 'Furosemide', dosage: '20mg, 40mg, 80mg', stock: 160, defaultValidityDays: 30 },
  { brandName: 'Plavix', genericName: 'Clopidogrel', dosage: '75mg', stock: 130, defaultValidityDays: 90 },
  { brandName: 'Singulair', genericName: 'Montelukast', dosage: '4mg, 5mg, 10mg', stock: 115, defaultValidityDays: 90 },
  { brandName: 'Crestor', genericName: 'Rosuvastatin', dosage: '5mg, 10mg, 20mg, 40mg', stock: 125, defaultValidityDays: 90 },
  { brandName: 'Prozac', genericName: 'Fluoxetine', dosage: '10mg, 20mg, 40mg', stock: 105, defaultValidityDays: 90 },
  { brandName: 'Lexapro', genericName: 'Escitalopram', dosage: '5mg, 10mg, 20mg', stock: 135, defaultValidityDays: 90 },
  { brandName: 'Xanax', genericName: 'Alprazolam', dosage: '0.25mg, 0.5mg, 1mg, 2mg', stock: 80, defaultValidityDays: 30 },
  { brandName: 'Coumadin', genericName: 'Warfarin', dosage: '1mg, 2mg, 2.5mg, 3mg, 4mg, 5mg, 6mg, 7.5mg, 10mg', stock: 90, defaultValidityDays: 30 }
];

const filterByQuery = <T>(items: T[], query: string, matchers: ((item: T, lowerQuery: string) => boolean)[]) => {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return items;
  return items.filter(item => matchers.some(match => match(item, lowerQuery)));
};

export const getSmartDiagnosis = async (query: string) => {
  return filterByQuery(LOCAL_DIAGNOSIS_DB, query, [
    (d, q) => d.code.toLowerCase().includes(q),
    (d, q) => d.description.toLowerCase().includes(q),
    (d, q) => d.context.toLowerCase().includes(q),
  ]);
};

export const getSmartMedication = async (query: string) => {
  return filterByQuery(LOCAL_MEDICATION_DB, query, [
    (m, q) => m.brandName.toLowerCase().includes(q),
    (m, q) => m.genericName.toLowerCase().includes(q),
  ]);
};

export const refineProgressNotes = async (rawText: string) => {
  return rawText.trim();
};

export interface SuggestedIcdCode {
  code: string;
  description: string;
  context: string;
  confidence: 'High' | 'Medium' | 'Low';
  matchedTerms: string[];
}

/** Suggest ICD-10 codes from SOAP free-text fields (purpose, assessment, complaints, etc.). */
export const suggestIcdFromSoapText = async (input: {
  purposeOfVisit?: string;
  complaints?: string[];
  subjective?: string;
  assessment?: string;
  plan?: string;
}): Promise<SuggestedIcdCode[]> => {
  await new Promise((r) => setTimeout(r, 350));

  const corpus = [
    input.purposeOfVisit,
    ...(input.complaints || []),
    input.subjective,
    input.assessment,
    input.plan,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (corpus.trim().length < 8) return [];

  const keywordMap: { terms: string[]; code: string }[] = [
    { terms: ['hypertension', 'high blood pressure', 'htn', 'elevated bp'], code: 'I10' },
    { terms: ['diabetes', 't2dm', 'blood sugar', 'hyperglycemia', 'glucose'], code: 'E11.9' },
    { terms: ['asthma', 'wheez', 'inhaler'], code: 'J45.909' },
    { terms: ['back pain', 'lumbar', 'lumbago'], code: 'M54.5' },
    { terms: ['anxiety', 'worried', 'panic'], code: 'F41.1' },
    { terms: ['reflux', 'gerd', 'heartburn', 'acid'], code: 'K21.9' },
    { terms: ['uti', 'urinary tract', 'dysuria', 'urinary infection'], code: 'N39.0' },
    { terms: ['viral', 'flu-like', 'viral illness'], code: 'B34.9' },
    { terms: ['cough', 'coughing'], code: 'R05' },
    { terms: ['fever', 'febrile', 'pyrexia'], code: 'R50.9' },
    { terms: ['obesity', 'overweight', 'bmi'], code: 'E66.9' },
    { terms: ['knee', 'osteoarthritis', 'oa knee'], code: 'M17.9' },
    { terms: ['coronary', 'cad', 'atheroscler', 'ischemic heart', 'angina', 'chest pain'], code: 'I25.10' },
    { terms: ['uri', 'upper respiratory', 'cold', 'sore throat'], code: 'J06.9' },
    { terms: ['depress', 'low mood'], code: 'F32.9' },
    { terms: ['gastritis', 'epigastric', 'stomach pain'], code: 'K29.70' },
    { terms: ['eczema', 'atopic', 'dermatitis', 'itchy skin'], code: 'L20.9' },
    { terms: ['migraine', 'headache'], code: 'G43.909' },
    { terms: ['conjunctivitis', 'pink eye', 'red eye'], code: 'H10.9' },
    { terms: ['thyroid', 'hypothyroid'], code: 'E03.9' },
    { terms: ['copd', 'emphysema', 'chronic obstructive'], code: 'J44.9' },
    { terms: ['pneumonia'], code: 'J18.9' },
  ];

  // Include COPD / pneumonia in local lookup if missing
  const extendedDb = [
    ...LOCAL_DIAGNOSIS_DB,
    { code: 'J44.9', description: 'Chronic obstructive pulmonary disease, unspecified', context: 'Long-term lung disease with airflow limitation.' },
    { code: 'J18.9', description: 'Pneumonia, unspecified organism', context: 'Infection that inflames air sacs in one or both lungs.' },
  ];

  const scored: SuggestedIcdCode[] = [];

  for (const mapping of keywordMap) {
    const matchedTerms = mapping.terms.filter((t) => corpus.includes(t));
    if (matchedTerms.length === 0) continue;
    const entry = extendedDb.find((d) => d.code === mapping.code);
    if (!entry) continue;
    scored.push({
      code: entry.code,
      description: entry.description,
      context: entry.context,
      confidence: matchedTerms.length >= 2 ? 'High' : matchedTerms[0].length > 8 ? 'High' : 'Medium',
      matchedTerms,
    });
  }

  // Fallback: match description words from the local DB directly
  if (scored.length === 0) {
    for (const entry of LOCAL_DIAGNOSIS_DB) {
      const words = entry.description.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
      const matchedTerms = words.filter((w) => corpus.includes(w));
      if (matchedTerms.length >= 2) {
        scored.push({
          code: entry.code,
          description: entry.description,
          context: entry.context,
          confidence: 'Low',
          matchedTerms,
        });
      }
    }
  }

  const unique = new Map<string, SuggestedIcdCode>();
  scored.forEach((s) => {
    const existing = unique.get(s.code);
    if (!existing || (s.confidence === 'High' && existing.confidence !== 'High')) {
      unique.set(s.code, s);
    }
  });

  return Array.from(unique.values()).slice(0, 5);
};

export interface PatientHistoryEpisodeInput {
  caseNumber: string;
  caseType: 'Inpatient' | 'Outpatient';
  department: string;
  admissionDate: string;
  status: 'Active' | 'Closed';
  diagnosis: string;
  physician: string;
  wardBed: string;
  diagnoses: { code: string; description: string; status: string }[];
  medications: { name: string; dosage: string; status: string }[];
  documents: { description: string; status: string; date: string }[];
}

/** Build a narrative patient history from prior+current case episodes. */
export const generatePatientHistorySummary = async (
  patientName: string,
  episodes: PatientHistoryEpisodeInput[],
): Promise<string> => {
  await new Promise((r) => setTimeout(r, 500));

  if (episodes.length === 0) {
    return `No prior clinical episodes were found for ${patientName}. A detailed longitudinal history cannot be generated until encounter or case records are available.`;
  }

  const sorted = [...episodes].sort((a, b) => a.admissionDate.localeCompare(b.admissionDate));
  const closed = sorted.filter((e) => e.status === 'Closed');
  const active = sorted.filter((e) => e.status === 'Active');

  const formatDate = (d: string) => {
    if (d.includes('.')) return d;
    const [y, m, day] = d.split('-');
    return y && m && day ? `${day}.${m}.${y}` : d;
  };

  const allDx = new Map<string, string>();
  sorted.forEach((ep) => {
    ep.diagnoses.forEach((d) => allDx.set(d.code, d.description));
    if (ep.diagnosis) allDx.set(ep.diagnosis, ep.diagnosis);
  });

  const chronicMeds = new Set<string>();
  sorted.forEach((ep) => {
    ep.medications.forEach((m) => {
      if (m.status === 'Signed' || m.status === 'Active') chronicMeds.add(`${m.name} ${m.dosage}`.trim());
    });
  });

  const lines: string[] = [];
  lines.push(`Patient history summary — ${patientName}`);
  lines.push('');
  lines.push(
    `This patient has ${sorted.length} documented clinical episode${sorted.length === 1 ? '' : 's'} ` +
      `(${active.length} active, ${closed.length} closed), spanning from ${formatDate(sorted[0].admissionDate)} ` +
      `to ${formatDate(sorted[sorted.length - 1].admissionDate)}.`,
  );
  lines.push('');
  lines.push('Episode timeline');
  sorted.forEach((ep, index) => {
    const dxList =
      ep.diagnoses.length > 0
        ? ep.diagnoses.map((d) => `${d.code} ${d.description}`).join('; ')
        : ep.diagnosis || 'No coded diagnosis recorded';
    const meds =
      ep.medications.length > 0
        ? ep.medications.map((m) => m.name).slice(0, 4).join(', ')
        : 'No medications recorded';
    const docs =
      ep.documents.length > 0
        ? ep.documents.map((d) => d.description).slice(0, 3).join(', ')
        : 'No documents listed';

    lines.push(
      `${index + 1}. ${formatDate(ep.admissionDate)} — ${ep.caseType} case ${ep.caseNumber} (${ep.status}) ` +
        `in ${ep.department}${ep.wardBed ? `, ${ep.wardBed}` : ''}. ` +
        `Attending: ${ep.physician}. Primary findings: ${dxList}. ` +
        `Therapies noted: ${meds}. Documents: ${docs}.`,
    );
  });

  lines.push('');
  lines.push('Longitudinal clinical picture');
  if (allDx.size > 0) {
    lines.push(
      `Across episodes, key diagnostic themes include: ${Array.from(allDx.entries())
        .slice(0, 8)
        .map(([code, desc]) => (code === desc ? desc : `${code} (${desc})`))
        .join('; ')}.`,
    );
  }
  if (chronicMeds.size > 0) {
    lines.push(
      `Medications recurring or active across the record: ${Array.from(chronicMeds).slice(0, 8).join('; ')}.`,
    );
  }

  if (active.length > 0) {
    lines.push('');
    lines.push('Current open care');
    active.forEach((ep) => {
      lines.push(
        `• Active ${ep.caseType.toLowerCase()} episode ${ep.caseNumber} (${ep.department}) since ${formatDate(ep.admissionDate)} — ${ep.diagnosis || 'see diagnoses list'}.`,
      );
    });
  }

  lines.push('');
  lines.push(
    'Clinical note: This narrative is an AI-assisted synthesis of chart episodes for physician review. ' +
      'It does not replace full chart review or clinical judgment.',
  );

  return lines.join('\n');
};

