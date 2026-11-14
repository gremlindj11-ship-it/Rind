export type InformationState = 'CONFIRMED' | 'REQUIRES_VERIFICATION' | 'NOT_AVAILABLE';

export type MedicationStatus =
  | 'PRESCRIBED'
  | 'ADMINISTERED'
  | 'NOT_ADMINISTERED'
  | 'WITHHELD'
  | 'UNKNOWN'
  | 'DISCONTINUED';

export type ServiceOrigin = 'GP' | 'CareHome' | 'UCR' | 'Ambulance' | 'ED' | 'HospitalA';

export type EprMainSection =
  | 'search'
  | 'record'
  | 'prealerts'
  | 'documents'
  | 'analytics';

export type PatientRecordTab =
  | 'overview'
  | 'encounters'
  | 'notes'
  | 'medications'
  | 'allergies'
  | 'observations'
  | 'results'
  | 'documents'
  | 'rind';

export type RindSubTab =
  | 'dashboard'
  | 'structured-summary'
  | 'med-rec'
  | 'review-audit';

export interface ReasonableAdjustment {
  id: string;
  text: string;
  sourceDocumentId: string;
  confirmed: boolean;
}

export interface Patient {
  id: string;
  nhsNumber: string;
  hospitalNumber: string;
  fullName: string;
  dob: string;
  age: number;
  sex: 'F' | 'M' | 'Other';
  address: string;
  residenceType: string;
  gpPractice: string;
  hospitalRecordStatus: string;
  currentEncounterStatus: string;
  hasActivePreAlert: boolean;
  nokName: string;
  nokRelationship: string;
  nokPhone: string;
  baselineCognition: string;
  baselineMobility: string;
  diagnoses: string[];
  lastAdmission: string;
  reasonableAdjustments: ReasonableAdjustment[];
}

export interface Encounter {
  id: string;
  patientId: string;
  type: string;
  location: string;
  status: string;
  startedAt: string;
  leadClinician: string;
  summary: string;
}

export interface ObservationSet {
  id: string;
  patientId: string;
  timestamp: string;
  service: ServiceOrigin;
  clinicianRole: string;
  rr: number;
  spo2: number;
  oxygenTherapy: string;
  hr: number;
  bp: string;
  temp: number;
  consciousness: string;
  news2: number;
  note?: string;
  sourceDocumentId: string;
}

export interface ClinicalEvent {
  id: string;
  patientId: string;
  timestamp: string;
  timeLabel: string;
  service: ServiceOrigin;
  organisation: string;
  clinicianName: string;
  clinicianRole: string;
  eventTitle: string;
  eventCategory: string;
  clinicalContent: string;
  deteriorationNote?: string;
  treatmentNote?: string;
  observationSnippet?: string;
  sourceSystem: string;
  sourceButtonLabel: string;
  sourceDocumentId: string;
  documentStatus: 'Available' | 'Partial' | 'Pending';
  verificationStatus: InformationState;
}

export interface MedicationOrder {
  id: string;
  patientId: string;
  medicationName: string;
  dose: string;
  route: string;
  frequency: string;
  prescriber: string;
  prescribedService: ServiceOrigin;
  prescriptionTime: string;
  sourceDocumentId: string;
  indication: string;
  isRegularHomeMed?: boolean;
}

export interface MedicationAdministration {
  id: string;
  orderId: string;
  patientId: string;
  status: MedicationStatus;
  administeringService: string;
  administrationTime: string | null;
  documentedResponse: string | null;
  reasonNotGivenOrUnknown: string | null;
  sourceDocumentId: string | null;
  verificationStatus: InformationState;
}

export interface ReconciledMedication {
  order: MedicationOrder;
  administration: MedicationAdministration;
}

export interface Allergy {
  id: string;
  patientId: string;
  substance: string;
  documentedReaction: string;
  severity: 'High' | 'Moderate' | 'Unknown';
  verificationStatus: InformationState;
  verificationNote: string;
  sourceDocumentId: string;
}

export interface CarePlan {
  id: string;
  patientId: string;
  title: string;
  holdingOrganisation: string;
  sourceSystem: string;
  lastUpdated: string;
  targetSpO2: string;
  summaryPoints: string[];
  escalationPlan: string;
  verificationStatus: InformationState;
  sourceDocumentId: string;
}

export interface SourceDocument {
  id: string;
  patientId: string;
  title: string;
  shortLabel: string;
  organisation: string;
  sourceSystem: string;
  timestamp: string;
  author: string;
  clinicianRole: string;
  category: 'GP Record' | 'Care Home Log' | 'UCR Assessment' | 'Ambulance ePCR' | 'Specialist Care Plan' | 'Pre-Alert';
  retrievalStatus: 'RETRIEVED' | 'PARTIAL' | 'UNAVAILABLE';
  highlightedFacts: string[];
  sections: {
    heading: string;
    body: string;
  }[];
  reviewedByClinician?: boolean;
}

export interface AssemblyStep {
  id: string;
  label: string;
  sourceSystem: string;
  status: 'MATCHED' | 'RETRIEVED' | 'IDENTIFIED' | 'PARTIAL' | 'GENERATED';
  detail: string;
}

export interface PreAlert {
  id: string;
  patientId: string;
  ambulanceService: string;
  callsign: string;
  arrivalDestination: string;
  etaMinutes: number;
  receivedTimestamp: string;
  presentingComplaint: string;
  observationsSummary: string;
  crewNotes: string;
  assemblySteps: AssemblyStep[];
}

export interface SummarySection {
  id: string;
  number: number;
  heading: string;
  statements: {
    id: string;
    text: string;
    state: InformationState;
    sourceDocumentIds: string[];
    flaggedIncorrect?: boolean;
    clinicianNote?: string;
    verified?: boolean;
  }[];
}

export interface ClinicalSummary {
  id: string;
  patientId: string;
  generatedAt: string;
  headlineReason: string;
  headlineContext: string;
  reviewStatus: 'DRAFT_AI' | 'CLINICIAN_VERIFIED';
  reviewedBy?: string;
  reviewedAt?: string;
  sections: SummarySection[];
}

export interface OutstandingAction {
  id: string;
  patientId: string;
  title: string;
  detail: string;
  informationState: InformationState;
  category: 'Medication' | 'Allergy' | 'Care Plan' | 'Clinical Observations' | 'Care Home Record';
  linkedSourceId: string | null;
  actionButtonLabel?: string;
  completed: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  clinicianNote?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  actionType:
    | 'PATIENT_SEARCH'
    | 'IDENTITY_CONFIRMED'
    | 'PRE_ALERT_RECEIVED'
    | 'JOURNEY_ASSEMBLED'
    | 'SOURCE_VIEWED'
    | 'MED_STATUS_VERIFIED'
    | 'ITEM_VERIFIED'
    | 'ITEM_FLAGGED'
    | 'SUMMARY_SIGNED_OFF';
  detail: string;
  targetId?: string;
}
