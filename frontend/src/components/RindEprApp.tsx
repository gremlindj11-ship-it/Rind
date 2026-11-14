'use client';

import React, { useMemo, useState } from 'react';
import {
  Ambulance,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Play,
  ShieldAlert,
} from 'lucide-react';
import { EprSidebar } from '@/components/EprSidebar';
import { EprStandardTabsView } from '@/components/EprStandardTabsView';
import { EprTopHeader } from '@/components/EprTopHeader';
import { PatientBanner } from '@/components/PatientBanner';
import { PatientSearchView } from '@/components/PatientSearchView';
import { PilotAnalyticsView } from '@/components/PilotAnalyticsView';
import { RindAcuteJourneyDashboard } from '@/components/RindAcuteJourneyDashboard';
import { SourceDocumentModal } from '@/components/SourceDocumentModal';
import {
  INITIAL_AUDIT_EVENTS,
  INITIAL_OUTSTANDING_ACTIONS,
  MARGARET_ALLERGIES,
  MARGARET_CARE_PLAN,
  MARGARET_ENCOUNTERS,
  MARGARET_MEDICATION_ADMINISTRATIONS,
  MARGARET_MEDICATION_ORDERS,
  MARGARET_OBSERVATIONS,
  MARGARET_PRE_ALERT,
  MARGARET_SOURCE_DOCUMENTS,
  MARGARET_TIMELINE_EVENTS,
  SEARCHABLE_PATIENTS,
} from '@/data/margaretWalkthroughData';
import {
  buildReconciledMedications,
  generateDeterministicClinicalSummary,
} from '@/services/rindAiService';
import {
  AuditEvent,
  EprMainSection,
  MedicationAdministration,
  MedicationStatus,
  OutstandingAction,
  Patient,
  PatientRecordTab,
  RindSubTab,
  SourceDocument,
} from '@/types/rind';

function getCurrentTimeLabel() {
  const now = new Date();
  return now.toTimeString().slice(0, 8);
}

export function RindEprApp() {
  const [mainSection, setMainSection] = useState<EprMainSection>('search');
  const [activeTab, setActiveTab] = useState<PatientRecordTab>('overview');
  const [rindSubTab, setRindSubTab] = useState<RindSubTab>('dashboard');

  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [pendingConfirmPatient, setPendingConfirmPatient] = useState<Patient | null>(null);
  const [topSearchQuery, setTopSearchQuery] = useState('');
  const [searchSeedText, setSearchSeedText] = useState('');

  const [showDemoBar, setShowDemoBar] = useState(true);
  const [demoStep, setDemoStep] = useState(1);

  // Assembly simulation state
  const [assemblyCompleted, setAssemblyCompleted] = useState(true);
  const [assemblyRunning, setAssemblyRunning] = useState(false);
  const [assemblyStepIndex, setAssemblyStepIndex] = useState(
    MARGARET_PRE_ALERT.assemblySteps.length - 1,
  );

  // Mutable clinical prototype state (synthetic, client-only)
  const [medAdministrations, setMedAdministrations] = useState<MedicationAdministration[]>(
    MARGARET_MEDICATION_ADMINISTRATIONS,
  );
  const [outstandingActions, setOutstandingActions] = useState<OutstandingAction[]>(
    INITIAL_OUTSTANDING_ACTIONS,
  );
  const [sourceDocs, setSourceDocs] = useState<SourceDocument[]>(MARGARET_SOURCE_DOCUMENTS);
  const [openSourceDocId, setOpenSourceDocId] = useState<string | null>(null);

  const [allergyConfirmed, setAllergyConfirmed] = useState(false);
  const [carePlanConfirmed, setCarePlanConfirmed] = useState(false);

  const [summarySignedOff, setSummarySignedOff] = useState<{
    signed: boolean;
    by?: string;
    at?: string;
  }>({ signed: false });

  const [statementOverrides, setStatementOverrides] = useState<
    Record<
      string,
      { verified?: boolean; flaggedIncorrect?: boolean; clinicianNote?: string; editedText?: string }
    >
  >({});

  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(INITIAL_AUDIT_EVENTS);

  const margaret = SEARCHABLE_PATIENTS[0];

  const appendAudit = (
    actionType: AuditEvent['actionType'],
    detail: string,
    targetId?: string,
  ) => {
    setAuditEvents((prev) => [
      {
        id: `aud-${Date.now()}-${prev.length + 1}`,
        timestamp: getCurrentTimeLabel(),
        actorName: 'Dr Patel',
        actorRole: 'ED Consultant',
        actionType,
        detail,
        targetId,
      },
      ...prev,
    ]);
  };

  const reconciledMeds = useMemo(
    () => buildReconciledMedications(MARGARET_MEDICATION_ORDERS, medAdministrations),
    [medAdministrations],
  );

  const clinicalSummary = useMemo(() => {
    const base = generateDeterministicClinicalSummary({
      patient: margaret,
      events: MARGARET_TIMELINE_EVENTS,
      observations: MARGARET_OBSERVATIONS,
      reconciledMeds,
      allergies: MARGARET_ALLERGIES,
      carePlan: MARGARET_CARE_PLAN,
      outstandingActions,
      carePlanConfirmed,
      allergyConfirmed,
    });
    return {
      ...base,
      reviewStatus: summarySignedOff.signed ? ('CLINICIAN_VERIFIED' as const) : ('DRAFT_AI' as const),
      reviewedBy: summarySignedOff.by,
      reviewedAt: summarySignedOff.at,
    };
  }, [
    margaret,
    reconciledMeds,
    outstandingActions,
    carePlanConfirmed,
    allergyConfirmed,
    summarySignedOff,
  ]);

  const handleConfirmOpenPatient = (patient: Patient) => {
    setActivePatient(patient);
    setPendingConfirmPatient(null);
    setMainSection('record');
    setActiveTab('overview');
    setDemoStep(2);
    appendAudit(
      'IDENTITY_CONFIRMED',
      `3-point identity confirmed for ${patient.fullName} (NHS ${patient.nhsNumber}). EPR opened.`,
      patient.id,
    );
  };

  const handleTriggerAssembly = () => {
    if (assemblyRunning) return;
    setAssemblyCompleted(false);
    setAssemblyRunning(true);
    setAssemblyStepIndex(0);
    setDemoStep(3);

    const total = MARGARET_PRE_ALERT.assemblySteps.length;
    for (let i = 0; i < total; i++) {
      setTimeout(() => {
        setAssemblyStepIndex(i);
        if (i === total - 1) {
          setAssemblyRunning(false);
          setAssemblyCompleted(true);
          appendAudit(
            'JOURNEY_ASSEMBLED',
            'Clinician triggered RIND assembly from ambulance pre-alert SCAS-418.',
            MARGARET_PRE_ALERT.id,
          );
        }
      }, i * 240);
    }
  };

  const handleOpenSourceDoc = (docId: string) => {
    setOpenSourceDocId(docId);
    const doc = sourceDocs.find((d) => d.id === docId);
    if (doc) {
      appendAudit('SOURCE_VIEWED', `Inspected source record: ${doc.title} (${doc.sourceSystem}).`, docId);
    }
  };

  const handleMarkDocReviewed = (docId: string) => {
    setSourceDocs((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, reviewedByClinician: true } : d)),
    );
    if (docId === 'doc-hosp-a-plan') {
      setCarePlanConfirmed(true);
      setOutstandingActions((prev) =>
        prev.map((a) => (a.id === 'out-careplan' ? { ...a, completed: true } : a)),
      );
    }
    const doc = sourceDocs.find((d) => d.id === docId);
    appendAudit(
      'ITEM_VERIFIED',
      `Marked source document reviewed: ${doc?.title ?? docId}.`,
      docId,
    );
    setOpenSourceDocId(null);
  };

  const handleUpdateMedicationStatus = (
    orderId: string,
    status: MedicationStatus,
    adminTime: string | null,
    note: string,
  ) => {
    setMedAdministrations((prev) =>
      prev.map((adm) =>
        adm.orderId === orderId
          ? {
              ...adm,
              status,
              administrationTime: adminTime,
              administeringService:
                status === 'UNKNOWN' ? 'Maple View Care Home (unconfirmed)' : 'Maple View Care Home (MAR Verified)',
              reasonNotGivenOrUnknown: note,
              verificationStatus: status === 'UNKNOWN' ? 'REQUIRES_VERIFICATION' : 'CONFIRMED',
            }
          : adm,
      ),
    );
    if (orderId === 'ord-pred' && status !== 'UNKNOWN') {
      setOutstandingActions((prev) =>
        prev.map((a) => (a.id === 'out-mar' ? { ...a, completed: true } : a)),
      );
    }
    const order = MARGARET_MEDICATION_ORDERS.find((o) => o.id === orderId);
    appendAudit(
      'MED_STATUS_VERIFIED',
      `${order?.medicationName ?? orderId} updated to ${status}${adminTime ? ` (${adminTime})` : ''}: ${note}`,
      orderId,
    );
  };

  const handleToggleOutstandingAction = (actionId: string) => {
    setOutstandingActions((prev) =>
      prev.map((act) => {
        if (act.id !== actionId) return act;
        const nextDone = !act.completed;
        appendAudit(
          'ITEM_VERIFIED',
          `${nextDone ? 'Marked verified' : 'Reopened verification'}: ${act.title}`,
          act.id,
        );
        return { ...act, completed: nextDone };
      }),
    );
  };

  const handleConfirmCarePlan = () => {
    setCarePlanConfirmed(true);
    setOutstandingActions((prev) =>
      prev.map((a) => (a.id === 'out-careplan' ? { ...a, completed: true } : a)),
    );
    appendAudit(
      'ITEM_VERIFIED',
      'Confirmed individual SpO₂ target 88–92% against Hospital A Respiratory Care Plan.',
      MARGARET_CARE_PLAN.id,
    );
  };

  const handleConfirmAllergy = () => {
    setAllergyConfirmed(true);
    setOutstandingActions((prev) =>
      prev.map((a) => (a.id === 'out-allergy' ? { ...a, completed: true } : a)),
    );
    appendAudit(
      'ITEM_VERIFIED',
      'Verified Penicillin allergy (rash, urticaria) details with patient/carer.',
      'alg-penicillin',
    );
  };

  const handleSignOffSummary = () => {
    const time = getCurrentTimeLabel().slice(0, 5);
    setSummarySignedOff({ signed: true, by: 'Dr Patel (ED Cons)', at: `Today, ${time}` });
    setDemoStep(5);
    appendAudit(
      'SUMMARY_SIGNED_OFF',
      'Signed off RIND Acute Pathway Summary as clinician-reviewed.',
      clinicalSummary.id,
    );
  };

  const handleSelectSidebarSection = (section: EprMainSection, tab?: PatientRecordTab) => {
    if (section === 'record' && !activePatient) {
      // Prompt explicit identity confirmation on Margaret before opening her clinical record
      setMainSection('search');
      setPendingConfirmPatient(margaret);
      return;
    }
    setMainSection(section);
    if (tab) {
      setActiveTab(tab);
      if (tab === 'rind') {
        setDemoStep(4);
      }
    }
  };

  const handleJumpDemoStep = (step: number) => {
    setDemoStep(step);
    if (step === 1) {
      setMainSection('search');
      setSearchSeedText('Margaret');
      setTopSearchQuery('Margaret Thompson');
      return;
    }
    if (!activePatient) {
      setActivePatient(margaret);
      appendAudit(
        'IDENTITY_CONFIRMED',
        `Demo step ${step}: Opened verified record for ${margaret.fullName}.`,
        margaret.id,
      );
    }
    setMainSection('record');
    if (step === 2) {
      setActiveTab('overview');
    } else if (step === 3) {
      setActiveTab('overview');
      handleTriggerAssembly();
    } else if (step === 4) {
      setActiveTab('rind');
      setRindSubTab('dashboard');
    } else if (step === 5) {
      setActiveTab('rind');
      setRindSubTab('review-audit');
    }
  };

  const openSourceDocument = sourceDocs.find((d) => d.id === openSourceDocId) ?? null;

  return (
    <div className="epr-shell">
      <EprTopHeader
        patients={SEARCHABLE_PATIENTS}
        activePatient={activePatient}
        searchQuery={topSearchQuery}
        onSearchQueryChange={setTopSearchQuery}
        onSelectSearchPatient={(patient) => {
          setMainSection('search');
          setPendingConfirmPatient(patient);
        }}
        onOpenFullSearch={(q) => {
          setSearchSeedText(q ?? '');
          setMainSection('search');
          setDemoStep(1);
        }}
        onOpenPreAlertPanel={() => setMainSection('prealerts')}
        demoStep={demoStep}
        onJumpDemoStep={handleJumpDemoStep}
        showDemoBar={showDemoBar}
        onToggleDemoBar={() => setShowDemoBar((v) => !v)}
        assemblyCompleted={assemblyCompleted}
      />

      <div className="epr-body">
        <EprSidebar
          mainSection={mainSection}
          activeTab={activeTab}
          hasActivePatient={!!activePatient}
          onSelectSection={handleSelectSidebarSection}
        />

        <main className="epr-workspace">
          {/* SCREEN 1: Patient Search */}
          {mainSection === 'search' && (
            <>
              {/* Incoming Pre-Alert Banner on Home Search */}
              <div className="workspace-content" style={{ paddingBottom: 0 }}>
                <div
                  className="nhs-care-card red"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    gap: '14px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Ambulance size={24} color="#D5281B" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15.5px', color: '#9B1C12' }}>
                        Incoming ED Ambulance Pre-Alert (SCAS-418) · Received 18:15 · ETA 15 mins
                      </div>
                      <div style={{ fontSize: '14px', color: '#212B32' }}>
                        <strong>Margaret Thompson</strong> (82F, DOB 14 Mar 1943, NHS 987 654 3210)
                        — Acute asthma/COPD exacerbation, RR 30, SpO₂ 91% (2L).
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-nhs-green"
                      onClick={() => setPendingConfirmPatient(margaret)}
                    >
                      Verify Identity &amp; Open Margaret’s EPR
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <PatientSearchView
                key={searchSeedText}
                patients={SEARCHABLE_PATIENTS}
                initialSearchText={searchSeedText}
                onConfirmOpenPatient={handleConfirmOpenPatient}
                pendingConfirmPatient={pendingConfirmPatient}
                onSetPendingConfirmPatient={setPendingConfirmPatient}
              />
            </>
          )}

          {/* SCREEN 3 (Standalone Queue): Incoming Pre-Alerts */}
          {mainSection === 'prealerts' && (
            <div className="workspace-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '23px', fontWeight: 700 }}>
                  Emergency Department — Incoming Ambulance Pre-Alerts
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: '15px', color: '#4C6272' }}>
                  Pre-alerts received from South Central Ambulance Service trigger RIND pathway
                  assembly automatically within Riverside NHS Trust EPR.
                </p>
              </div>

              <div className="nhs-care-card red">
                <div className="care-card-header red">
                  <h2 className="care-card-title">
                    <Ambulance size={19} />
                    Active Pre-Alert · {MARGARET_PRE_ALERT.callsign} · Margaret Thompson (82F)
                  </h2>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span className="status-pill-amber">
                      <Clock size={14} />
                      ETA {MARGARET_PRE_ALERT.etaMinutes} minutes
                    </span>
                    <span className="status-pill-green">
                      <CheckCircle2 size={14} />
                      Received {MARGARET_PRE_ALERT.receivedTimestamp}
                    </span>
                  </div>
                </div>

                <div className="nhs-card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="nhs-summary-list" style={{ border: '1px solid #D8DDE0', borderRadius: '6px' }}>
                    <div className="nhs-summary-row">
                      <div className="nhs-summary-key">Patient Identity</div>
                      <div className="nhs-summary-value">
                        <strong>Margaret Thompson</strong> · DOB 14 Mar 1943 (82) · NHS No{' '}
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          987 654 3210
                        </span>
                      </div>
                    </div>
                    <div className="nhs-summary-row">
                      <div className="nhs-summary-key">Ambulance Service</div>
                      <div className="nhs-summary-value">{MARGARET_PRE_ALERT.ambulanceService}</div>
                    </div>
                    <div className="nhs-summary-row">
                      <div className="nhs-summary-key">Destination</div>
                      <div className="nhs-summary-value">{MARGARET_PRE_ALERT.arrivalDestination}</div>
                    </div>
                    <div className="nhs-summary-row">
                      <div className="nhs-summary-key">Presenting Complaint</div>
                      <div className="nhs-summary-value">{MARGARET_PRE_ALERT.presentingComplaint}</div>
                    </div>
                    <div className="nhs-summary-row">
                      <div className="nhs-summary-key">Observations</div>
                      <div className="nhs-summary-value" style={{ fontWeight: 700 }}>
                        {MARGARET_PRE_ALERT.observationsSummary}
                      </div>
                    </div>
                    <div className="nhs-summary-row">
                      <div className="nhs-summary-key">Crew Pre-Alert Notes</div>
                      <div className="nhs-summary-value">{MARGARET_PRE_ALERT.crewNotes}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-nhs-blue"
                      onClick={() => {
                        setActivePatient(margaret);
                        setMainSection('record');
                        setActiveTab('overview');
                        handleTriggerAssembly();
                      }}
                    >
                      <Play size={16} />
                      Open EPR &amp; Simulate RIND Assembly
                    </button>
                    <button
                      type="button"
                      className="btn-nhs-green"
                      onClick={() => {
                        setActivePatient(margaret);
                        setMainSection('record');
                        setActiveTab('rind');
                        setRindSubTab('dashboard');
                      }}
                    >
                      Open RIND – Acute Journey Directly
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Standalone Source Documents Shortcut */}
          {mainSection === 'documents' && (
            <div className="workspace-content">
              <div className="nhs-card nhs-card-pad">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <FileText size={20} color="#005EB8" />
                  <h2 style={{ margin: 0 }}>Confirm Patient Identity to View Source Documents</h2>
                </div>
                <p style={{ margin: '0 0 14px', color: '#4C6272' }}>
                  Clinical source documents are scoped to an active verified patient record.
                </p>
                <button
                  type="button"
                  className="btn-nhs-green"
                  onClick={() => setPendingConfirmPatient(margaret)}
                >
                  Confirm Margaret Thompson Identity
                </button>
              </div>
            </div>
          )}

          {/* Pilot Metrics & IG Screen */}
          {mainSection === 'analytics' && <PilotAnalyticsView />}

          {/* ACTIVE PATIENT EPR RECORD (Screens 2, 3, 4, 6, 7) */}
          {mainSection === 'record' && activePatient && (
            <>
              <PatientBanner
                patient={activePatient}
                activeTab={activeTab}
                onSelectTab={(tab) => {
                  setActiveTab(tab);
                  if (tab === 'rind') setDemoStep(4);
                }}
                allergyVerified={allergyConfirmed}
                onOpenAllergySource={() => handleOpenSourceDoc('doc-gp-0900')}
                onOpenReasonableAdjustments={() => {
                  setActiveTab('rind');
                  setRindSubTab('dashboard');
                }}
              />

              {activePatient.id !== margaret.id ? (
                <div className="workspace-content">
                  <div className="nhs-care-card blue">
                    <div className="care-card-header blue">
                      <h2 className="care-card-title">
                        <ShieldAlert size={18} />
                        {activePatient.fullName} — Standard EPR Record (No Active 999 Pre-Alert)
                      </h2>
                      <button
                        type="button"
                        className="btn-nhs-green"
                        onClick={() => setPendingConfirmPatient(margaret)}
                      >
                        Switch to Margaret Thompson (Demo Patient)
                      </button>
                    </div>
                    <div className="nhs-card-pad">
                      <p style={{ margin: '0 0 10px' }}>
                        <strong>Residence:</strong> {activePatient.residenceType} ·{' '}
                        <strong>GP Practice:</strong> {activePatient.gpPractice}
                      </p>
                      <p style={{ margin: 0, color: '#4C6272' }}>
                        No community-to-hospital RIND acute handover pathway is active for this
                        comparator patient. Use the button above to open{' '}
                        <strong>Margaret Thompson</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'rind' ? (
                <RindAcuteJourneyDashboard
                  patient={activePatient}
                  preAlert={MARGARET_PRE_ALERT}
                  events={MARGARET_TIMELINE_EVENTS}
                  reconciledMeds={reconciledMeds}
                  allergy={MARGARET_ALLERGIES[0]}
                  carePlan={MARGARET_CARE_PLAN}
                  summary={clinicalSummary}
                  outstandingActions={outstandingActions}
                  auditEvents={auditEvents}
                  allergyConfirmed={allergyConfirmed}
                  carePlanConfirmed={carePlanConfirmed}
                  activeSubTab={rindSubTab}
                  onChangeSubTab={setRindSubTab}
                  onOpenSourceDoc={handleOpenSourceDoc}
                  onToggleOutstandingAction={handleToggleOutstandingAction}
                  onUpdateMedicationStatus={handleUpdateMedicationStatus}
                  onConfirmCarePlan={handleConfirmCarePlan}
                  onConfirmAllergy={handleConfirmAllergy}
                  statementOverrides={statementOverrides}
                  onVerifyStatement={(id) => {
                    setStatementOverrides((prev) => ({
                      ...prev,
                      [id]: { ...prev[id], verified: !prev[id]?.verified, flaggedIncorrect: false },
                    }));
                    appendAudit('ITEM_VERIFIED', `Verified summary statement ${id}.`, id);
                  }}
                  onFlagStatement={(id, note) => {
                    setStatementOverrides((prev) => ({
                      ...prev,
                      [id]: {
                        ...prev[id],
                        flaggedIncorrect: true,
                        verified: false,
                        clinicianNote: note,
                      },
                    }));
                    appendAudit('ITEM_FLAGGED', `Flagged summary statement ${id}: ${note}`, id);
                  }}
                  onCorrectStatement={(id, text) => {
                    setStatementOverrides((prev) => ({
                      ...prev,
                      [id]: {
                        ...prev[id],
                        editedText: text,
                        verified: true,
                        flaggedIncorrect: false,
                        clinicianNote: 'Corrected by Dr Patel',
                      },
                    }));
                    appendAudit('ITEM_VERIFIED', `Corrected structured summary statement ${id}.`, id);
                  }}
                  onSignOffSummary={handleSignOffSummary}
                />
              ) : (
                <EprStandardTabsView
                  patient={activePatient}
                  activeTab={activeTab}
                  encounters={MARGARET_ENCOUNTERS}
                  observations={MARGARET_OBSERVATIONS}
                  reconciledMeds={reconciledMeds}
                  allergies={MARGARET_ALLERGIES}
                  carePlan={MARGARET_CARE_PLAN}
                  preAlert={MARGARET_PRE_ALERT}
                  sourceDocs={sourceDocs}
                  outstandingActions={outstandingActions}
                  assemblyCompleted={assemblyCompleted}
                  assemblyRunning={assemblyRunning}
                  assemblyStepIndex={assemblyStepIndex}
                  onTriggerAssembly={handleTriggerAssembly}
                  onOpenRindTab={() => {
                    setActiveTab('rind');
                    setRindSubTab('dashboard');
                    setDemoStep(4);
                  }}
                  onOpenSourceDoc={handleOpenSourceDoc}
                  onToggleAction={handleToggleOutstandingAction}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* SCREEN 5: Expanded Source Document Modal */}
      <SourceDocumentModal
        document={openSourceDocument}
        onClose={() => setOpenSourceDocId(null)}
        onMarkReviewed={handleMarkDocReviewed}
      />
    </div>
  );
}
