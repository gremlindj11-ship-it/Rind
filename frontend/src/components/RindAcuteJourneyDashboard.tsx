'use client';

import React, { useState } from 'react';
import {
  Accessibility,
  AlertTriangle,
  Ambulance,
  Building2,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  ExternalLink,
  FileText,
  Home,
  Info,
  Pill,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  Users,
} from 'lucide-react';
import { ClinicianReviewAndAuditView } from '@/components/ClinicianReviewAndAuditView';
import { MedicationReconciliationView } from '@/components/MedicationReconciliationView';
import {
  InformationStateBadge,
  MedStatusBadge,
  RindWordmark,
} from '@/components/StatusBadges';
import {
  Allergy,
  AuditEvent,
  CarePlan,
  ClinicalEvent,
  ClinicalSummary,
  MedicationStatus,
  OutstandingAction,
  Patient,
  PreAlert,
  ReconciledMedication,
  RindSubTab,
} from '@/types/rind';

interface RindAcuteJourneyDashboardProps {
  patient: Patient;
  preAlert: PreAlert;
  events: ClinicalEvent[];
  reconciledMeds: ReconciledMedication[];
  allergy: Allergy;
  carePlan: CarePlan;
  summary: ClinicalSummary;
  outstandingActions: OutstandingAction[];
  auditEvents: AuditEvent[];
  allergyConfirmed: boolean;
  carePlanConfirmed: boolean;
  activeSubTab: RindSubTab;
  onChangeSubTab: (tab: RindSubTab) => void;
  onOpenSourceDoc: (docId: string) => void;
  onToggleOutstandingAction: (actionId: string) => void;
  onUpdateMedicationStatus: (
    orderId: string,
    status: MedicationStatus,
    adminTime: string | null,
    note: string,
  ) => void;
  onConfirmCarePlan: () => void;
  onConfirmAllergy: () => void;
  statementOverrides: Record<
    string,
    { verified?: boolean; flaggedIncorrect?: boolean; clinicianNote?: string; editedText?: string }
  >;
  onVerifyStatement: (id: string) => void;
  onFlagStatement: (id: string, note: string) => void;
  onCorrectStatement: (id: string, text: string) => void;
  onSignOffSummary: () => void;
}

export function RindAcuteJourneyDashboard({
  patient,
  preAlert,
  events,
  reconciledMeds,
  allergy,
  carePlan,
  summary,
  outstandingActions,
  auditEvents,
  allergyConfirmed,
  carePlanConfirmed,
  activeSubTab,
  onChangeSubTab,
  onOpenSourceDoc,
  onToggleOutstandingAction,
  onUpdateMedicationStatus,
  onConfirmCarePlan,
  onConfirmAllergy,
  statementOverrides,
  onVerifyStatement,
  onFlagStatement,
  onCorrectStatement,
  onSignOffSummary,
}: RindAcuteJourneyDashboardProps) {
  const [showFullFiveEvents, setShowFullFiveEvents] = useState(true);
  const [expandedEventIds, setExpandedEventIds] = useState<Record<string, boolean>>({});

  const acuteMeds = reconciledMeds.filter((m) => !m.order.isRegularHomeMed);
  const unverifiedCount = outstandingActions.filter((a) => !a.completed).length;

  const displayedEvents = showFullFiveEvents
    ? events
    : events.filter((e) => e.service === 'GP' || e.service === 'UCR' || e.service === 'Ambulance');

  const toggleExpandEvent = (id: string) => {
    setExpandedEventIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderEventIcon = (service: ClinicalEvent['service']) => {
    switch (service) {
      case 'GP':
        return <Home size={18} />;
      case 'CareHome':
        return <AlertTriangle size={18} />;
      case 'UCR':
        return <Users size={18} />;
      case 'Ambulance':
        return <Ambulance size={18} />;
      case 'ED':
      case 'HospitalA':
        return <Building2 size={18} />;
    }
  };

  return (
    <div className="workspace-content">
      {/* RIND Hero Header Bar (Matching Mockup 1) */}
      <div className="rind-hero-bar">
        <div className="rind-brand-left">
          <RindWordmark />
          <div className="rind-title-group">
            <h2>Acute Pathway Summary</h2>
            <p>
              AI-generated summary of the current episode, bringing together primary care, care home,
              UCR and ambulance information.
            </p>
          </div>
        </div>

        <div className="rind-status-right">
          <span className="status-pill-green">
            <CheckCircle2 size={15} />
            Pre-alert received {preAlert.receivedTimestamp}
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '13.5px',
              color: '#4C6272',
              fontWeight: 600,
            }}
          >
            <RefreshCw size={14} />
            Summary updated {summary.generatedAt}
          </span>
          {summary.reviewStatus === 'CLINICIAN_VERIFIED' ? (
            <span className="status-pill-green">
              <ShieldCheck size={15} />
              Clinician Verified ({summary.reviewedBy})
            </span>
          ) : (
            <span className="status-pill-amber">
              <AlertTriangle size={15} />
              AI Draft · Awaiting Clinician Review
            </span>
          )}
        </div>
      </div>

      {/* Sub-Navigation across RIND Views */}
      <div className="rind-subnav">
        <div className="rind-subnav-tabs" role="tablist" aria-label="RIND views">
          <button
            type="button"
            className={`rind-subtab-btn ${activeSubTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onChangeSubTab('dashboard')}
          >
            Acute Pathway Dashboard
          </button>
          <button
            type="button"
            className={`rind-subtab-btn ${activeSubTab === 'structured-summary' ? 'active' : ''}`}
            onClick={() => onChangeSubTab('structured-summary')}
          >
            10-Point Structured Summary
          </button>
          <button
            type="button"
            className={`rind-subtab-btn ${activeSubTab === 'med-rec' ? 'active' : ''}`}
            onClick={() => onChangeSubTab('med-rec')}
          >
            Medication Reconciliation
            {acuteMeds.some((m) => m.administration.status === 'UNKNOWN') && (
              <span
                style={{
                  background: '#FFB81C',
                  color: '#212B32',
                  borderRadius: '999px',
                  fontSize: '11px',
                  padding: '0 6px',
                  fontWeight: 800,
                }}
              >
                !
              </span>
            )}
          </button>
          <button
            type="button"
            className={`rind-subtab-btn ${activeSubTab === 'review-audit' ? 'active' : ''}`}
            onClick={() => onChangeSubTab('review-audit')}
          >
            Clinician Review &amp; Audit ({auditEvents.length})
          </button>
        </div>

        <div style={{ fontSize: '13px', color: '#4C6272', fontWeight: 600 }}>
          &ldquo;One patient. One acute journey. Nothing lost.&rdquo;
        </div>
      </div>

      {activeSubTab === 'med-rec' && (
        <MedicationReconciliationView
          reconciledMeds={reconciledMeds}
          onOpenSourceDoc={onOpenSourceDoc}
          onUpdateMedicationStatus={onUpdateMedicationStatus}
        />
      )}

      {activeSubTab === 'review-audit' && (
        <ClinicianReviewAndAuditView
          summary={summary}
          auditEvents={auditEvents}
          statementOverrides={statementOverrides}
          onVerifyStatement={onVerifyStatement}
          onFlagStatement={onFlagStatement}
          onCorrectStatement={onCorrectStatement}
          onSignOffSummary={onSignOffSummary}
          onOpenSourceDoc={onOpenSourceDoc}
        />
      )}

      {activeSubTab === 'structured-summary' && (
        <div className="nhs-card">
          <div className="care-card-header blue">
            <h3 className="care-card-title">
              <ClipboardList size={18} />
              AI-Generated 10-Point Acute Clinical Summary (Source-Linked)
            </h3>
            <button
              type="button"
              className="btn-nhs-green"
              style={{ padding: '6px 12px', fontSize: '13.5px' }}
              onClick={() => onChangeSubTab('review-audit')}
            >
              Review / Verify Summary
            </button>
          </div>
          <div
            className="nhs-card-pad"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '14px',
            }}
          >
            {summary.sections.map((section) => (
              <div
                key={section.id}
                style={{
                  border: '1px solid #D8DDE0',
                  borderLeft: '4px solid #005EB8',
                  borderRadius: '4px',
                  padding: '12px 14px',
                  background: '#FFFFFF',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#003087', marginBottom: '8px' }}>
                  {section.number}. {section.heading}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {section.statements.map((st) => {
                    const ov = statementOverrides[st.id] ?? {};
                    return (
                      <div key={st.id} style={{ fontSize: '14px', lineHeight: 1.45 }}>
                        <div>{ov.editedText ?? st.text}</div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            flexWrap: 'wrap',
                            marginTop: '4px',
                          }}
                        >
                          <InformationStateBadge state={ov.verified ? 'CONFIRMED' : st.state} />
                          {st.sourceDocumentIds.map((docId) => (
                            <button
                              key={docId}
                              type="button"
                              className="btn-source-link"
                              style={{ padding: '1px 7px', fontSize: '11.5px' }}
                              onClick={() => onOpenSourceDoc(docId)}
                            >
                              {docId.replace('doc-', '').toUpperCase()}
                              <ExternalLink size={11} />
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'dashboard' && (
        <div className="rind-two-col">
          {/* LEFT COLUMN (60%) — Matching Mockup 1 */}
          <div className="rind-col-stack">
            {/* Reason for attendance */}
            <div className="nhs-care-card blue">
              <div className="nhs-card-pad" style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '10px',
                    background: '#EBF3FA',
                    color: '#005EB8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Stethoscope size={23} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#212B32' }}>
                      Reason for attendance
                    </h3>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn-source-link"
                        onClick={() => onOpenSourceDoc('doc-amb-1800')}
                      >
                        Ambulance ePCR
                        <ExternalLink size={12} />
                      </button>
                      <button
                        type="button"
                        className="btn-nhs-secondary"
                        style={{ padding: '4px 9px', fontSize: '12.5px' }}
                        onClick={() => onChangeSubTab('structured-summary')}
                      >
                        View 10-Point Summary
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '6px', color: '#212B32' }}>
                    {summary.headlineReason}
                  </div>
                  <div style={{ fontSize: '14.5px', color: '#4C6272', marginTop: '3px' }}>
                    {summary.headlineContext}
                  </div>
                </div>
              </div>
            </div>

            {/* Acute journey (chronological) */}
            <div className="nhs-card">
              <div className="care-card-header neutral">
                <h3 className="care-card-title">Acute journey (chronological)</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-nhs-secondary"
                    style={{ padding: '4px 10px', fontSize: '12.5px' }}
                    onClick={() => setShowFullFiveEvents((v) => !v)}
                  >
                    {showFullFiveEvents ? 'Showing All 5 Events' : 'Showing 3 Core Milestones'} (Switch)
                  </button>
                </div>
              </div>

              <div className="timeline-list">
                {displayedEvents.map((evt) => {
                  const isExpanded = !!expandedEventIds[evt.id];
                  return (
                    <div key={evt.id} className="timeline-item">
                      <div className={`timeline-node ${evt.service}`} aria-hidden="true">
                        {renderEventIcon(evt.service)}
                      </div>

                      <div className="timeline-service-col">
                        <div className="timeline-service-title">{evt.eventTitle}</div>
                        <div className="timeline-time">{evt.timeLabel}</div>
                        <div className="timeline-source-sys">
                          {evt.clinicianName} · {evt.sourceSystem}
                        </div>
                      </div>

                      <div className="timeline-body-col">
                        <div>{evt.clinicalContent}</div>

                        {evt.deteriorationNote && (
                          <div className="timeline-delta-note">{evt.deteriorationNote}</div>
                        )}

                        {evt.treatmentNote && (
                          <div className="timeline-treatment-pill">
                            <Pill size={15} color="#005EB8" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                              <strong>Treatment:</strong> {evt.treatmentNote}
                            </div>
                          </div>
                        )}

                        {isExpanded && evt.observationSnippet && (
                          <div
                            style={{
                              marginTop: '7px',
                              padding: '7px 10px',
                              background: '#EBF3FA',
                              borderRadius: '4px',
                              fontSize: '13px',
                              color: '#003087',
                              fontWeight: 600,
                            }}
                          >
                            Obs &amp; Metadata: {evt.observationSnippet} · Status:{' '}
                            {evt.documentStatus} ({evt.organisation})
                          </div>
                        )}
                      </div>

                      <div
                        className="timeline-actions-col"
                        style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}
                      >
                        <button
                          type="button"
                          className="btn-source-link"
                          onClick={() => onOpenSourceDoc(evt.sourceDocumentId)}
                        >
                          {evt.sourceButtonLabel}
                          <ExternalLink size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn-link-inline"
                          style={{ fontSize: '12.5px' }}
                          onClick={() => toggleExpandEvent(evt.id)}
                        >
                          {isExpanded ? 'Hide details' : 'Quick expand'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Treatment and administration (current episode) */}
            <div className="nhs-card">
              <div className="care-card-header neutral">
                <div>
                  <h3 className="care-card-title">Treatment and administration (current episode)</h3>
                  <div style={{ fontSize: '12.5px', color: '#4C6272', marginTop: '2px' }}>
                    Prescription and administration are tracked separately — RIND never infers
                    administration from a prescription.
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-nhs-secondary"
                  style={{ padding: '5px 10px', fontSize: '13px' }}
                  onClick={() => onChangeSubTab('med-rec')}
                >
                  Full Medication Reconciliation
                </button>
              </div>

              <div className="clinical-table-wrap">
                <table className="clinical-table">
                  <thead>
                    <tr>
                      <th>Medication / Intervention</th>
                      <th>Prescribed by</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acuteMeds.map(({ order, administration }) => {
                      const needsCheck =
                        administration.status === 'UNKNOWN' ||
                        administration.status === 'PRESCRIBED';
                      return (
                        <tr
                          key={order.id}
                          className={needsCheck ? 'row-warning' : undefined}
                        >
                          <td>
                            <div style={{ fontWeight: 700 }}>{order.medicationName}</div>
                            {administration.reasonNotGivenOrUnknown && (
                              <div
                                style={{
                                  fontSize: '12px',
                                  color: administration.status === 'UNKNOWN' ? '#6E4700' : '#4C6272',
                                  marginTop: '2px',
                                }}
                              >
                                {administration.reasonNotGivenOrUnknown}
                              </div>
                            )}
                          </td>
                          <td>{order.prescribedService}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {administration.administrationTime ?? order.prescriptionTime}
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                              <MedStatusBadge
                                status={administration.status}
                                detailNote={
                                  order.id === 'ord-ucr-o2' && administration.status === 'ADMINISTERED'
                                    ? '2 L/min'
                                    : undefined
                                }
                              />
                              {administration.status === 'UNKNOWN' && (
                                <button
                                  type="button"
                                  className="btn-link-inline"
                                  style={{ fontSize: '12px' }}
                                  onClick={() => onChangeSubTab('med-rec')}
                                >
                                  Verify Care Home MAR ▸
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn-link-inline"
                              onClick={() =>
                                onOpenSourceDoc(
                                  administration.sourceDocumentId ?? order.sourceDocumentId,
                                )
                              }
                            >
                              View ▸
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (40%) — Matching Mockup 1 */}
          <div className="rind-col-stack">
            {/* Key clinical information Care Card */}
            <div className="nhs-care-card blue">
              <div className="care-card-header blue">
                <h3 className="care-card-title">
                  <Info size={18} />
                  Key clinical information
                </h3>
                {carePlanConfirmed && allergyConfirmed ? (
                  <span className="status-pill-green" style={{ padding: '2px 8px', fontSize: '11.5px' }}>
                    Verified
                  </span>
                ) : (
                  <span className="status-pill-amber" style={{ padding: '2px 8px', fontSize: '11.5px' }}>
                    2 checks pending
                  </span>
                )}
              </div>

              <div className="nhs-summary-list">
                <div className="nhs-summary-row">
                  <div className="nhs-summary-key">Diagnoses (relevant)</div>
                  <div className="nhs-summary-value">
                    COPD / Asthma (ACO), recurrent exacerbations
                  </div>
                </div>

                <div className="nhs-summary-row">
                  <div className="nhs-summary-key">Allergies</div>
                  <div className="nhs-summary-value">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-start' }}>
                      <span className="status-pill-red">
                        {allergy.substance} – {allergy.documentedReaction}
                      </span>
                      <span style={{ fontSize: '12.5px', color: allergyConfirmed ? '#00662F' : '#6E4700', fontWeight: 600 }}>
                        {allergyConfirmed
                          ? 'Reaction details verified by ED clinician.'
                          : 'Reaction details & timing require verification.'}
                      </span>
                      {!allergyConfirmed && (
                        <button
                          type="button"
                          className="btn-link-inline"
                          style={{ fontSize: '12.5px' }}
                          onClick={onConfirmAllergy}
                        >
                          Mark allergy details verified ▸
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="nhs-summary-row">
                  <div className="nhs-summary-key">Care plan</div>
                  <div className="nhs-summary-value">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <FileText size={15} color="#005EB8" />
                      <button
                        type="button"
                        className="btn-link-inline"
                        onClick={() => onOpenSourceDoc(carePlan.sourceDocumentId)}
                      >
                        {carePlan.title} View ▸
                      </button>
                    </div>
                    <div style={{ fontSize: '12px', color: '#4C6272', marginTop: '3px' }}>
                      Held by {carePlan.holdingOrganisation}
                    </div>
                  </div>
                </div>

                <div className="nhs-summary-row">
                  <div className="nhs-summary-key">Baseline</div>
                  <div className="nhs-summary-value">{patient.baselineCognition}</div>
                </div>

                <div className="nhs-summary-row">
                  <div className="nhs-summary-key">Oxygen target</div>
                  <div className="nhs-summary-value">
                    <strong>{carePlan.targetSpO2}</strong>{' '}
                    <span style={{ fontSize: '13px', color: carePlanConfirmed ? '#00662F' : '#6E4700' }}>
                      {carePlanConfirmed
                        ? '(confirmed against Hospital A plan)'
                        : '(referenced by UCR — confirm against Hospital A plan)'}
                    </span>
                    {!carePlanConfirmed && (
                      <div style={{ marginTop: '4px' }}>
                        <button
                          type="button"
                          className="btn-link-inline"
                          style={{ fontSize: '12.5px' }}
                          onClick={() => {
                            onOpenSourceDoc(carePlan.sourceDocumentId);
                          }}
                        >
                          Inspect plan &amp; confirm target ▸
                        </button>
                        {' · '}
                        <button
                          type="button"
                          className="btn-link-inline"
                          style={{ fontSize: '12.5px', color: '#007F3B' }}
                          onClick={onConfirmCarePlan}
                        >
                          Quick confirm
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="nhs-summary-row">
                  <div className="nhs-summary-key">Last admission</div>
                  <div className="nhs-summary-value">{patient.lastAdmission}</div>
                </div>
              </div>
            </div>

            {/* Reasonable adjustments Care Card */}
            <div className="nhs-care-card purple">
              <div className="care-card-header purple">
                <h3 className="care-card-title">
                  <Accessibility size={18} />
                  Reasonable adjustments
                </h3>
                <span style={{ fontSize: '12px', fontWeight: 700 }}>Documented</span>
              </div>

              <div className="nhs-card-pad" style={{ padding: '12px 16px' }}>
                <ul
                  style={{
                    margin: 0,
                    padding: 0,
                    listStyle: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '9px',
                    fontSize: '14.5px',
                  }}
                >
                  {patient.reasonableAdjustments.map((adj) => (
                    <li
                      key={adj.id}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}
                    >
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '4px',
                          background: '#F2EDF9',
                          color: '#5A3A9E',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        <Check size={14} strokeWidth={3} />
                      </span>
                      <span>{adj.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Outstanding / Information requiring verification Care Card */}
            <div className="nhs-care-card amber">
              <div className="care-card-header amber">
                <h3 className="care-card-title">
                  <AlertTriangle size={18} />
                  Outstanding / to confirm
                </h3>
                <span style={{ fontSize: '12.5px', fontWeight: 700 }}>
                  {unverifiedCount} pending
                </span>
              </div>

              <div className="nhs-card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {outstandingActions.map((act) => (
                  <div
                    key={act.id}
                    style={{
                      borderBottom: '1px solid #E8EDEE',
                      paddingBottom: '10px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                    }}
                  >
                    <input
                      type="checkbox"
                      aria-label={act.title}
                      checked={act.completed}
                      onChange={() => onToggleOutstandingAction(act.id)}
                      style={{ width: '18px', height: '18px', marginTop: '3px', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: '14.5px',
                          fontWeight: 700,
                          color: act.completed ? '#4C6272' : '#212B32',
                          textDecoration: act.completed ? 'line-through' : 'none',
                        }}
                      >
                        {act.title}
                      </div>
                      <div style={{ fontSize: '13px', color: '#4C6272', marginTop: '2px' }}>
                        {act.detail}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap',
                          marginTop: '6px',
                        }}
                      >
                        <InformationStateBadge
                          state={act.completed ? 'CONFIRMED' : act.informationState}
                        />
                        {act.linkedSourceId && (
                          <button
                            type="button"
                            className="btn-link-inline"
                            style={{ fontSize: '12.5px' }}
                            onClick={() => onOpenSourceDoc(act.linkedSourceId!)}
                          >
                            {act.actionButtonLabel ?? 'Inspect source'} ▸
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    flexWrap: 'wrap',
                    paddingTop: '4px',
                  }}
                >
                  <button
                    type="button"
                    className="btn-nhs-green"
                    onClick={() => {
                      if (summary.reviewStatus !== 'CLINICIAN_VERIFIED') {
                        onSignOffSummary();
                      } else {
                        onChangeSubTab('review-audit');
                      }
                    }}
                  >
                    <Clock size={16} />
                    {summary.reviewStatus === 'CLINICIAN_VERIFIED'
                      ? 'Summary Verified — View Audit Log'
                      : 'Mark Summary Reviewed & Verified'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
