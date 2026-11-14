'use client';

import React, { useState } from 'react';
import {
  Activity,
  Ambulance,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  FlaskConical,
  Loader2,
  Play,
  ShieldAlert,
} from 'lucide-react';
import { InformationStateBadge, MedStatusBadge, ServiceOriginTag } from '@/components/StatusBadges';
import {
  Allergy,
  CarePlan,
  Encounter,
  ObservationSet,
  OutstandingAction,
  Patient,
  PatientRecordTab,
  PreAlert,
  ReconciledMedication,
  SourceDocument,
} from '@/types/rind';

interface EprStandardTabsViewProps {
  patient: Patient;
  activeTab: Exclude<PatientRecordTab, 'rind'>;
  encounters: Encounter[];
  observations: ObservationSet[];
  reconciledMeds: ReconciledMedication[];
  allergies: Allergy[];
  carePlan: CarePlan;
  preAlert: PreAlert;
  sourceDocs: SourceDocument[];
  outstandingActions: OutstandingAction[];
  assemblyCompleted: boolean;
  assemblyRunning: boolean;
  assemblyStepIndex: number;
  onTriggerAssembly: () => void;
  onOpenRindTab: () => void;
  onOpenSourceDoc: (docId: string) => void;
  onToggleAction: (id: string) => void;
}

export function EprStandardTabsView({
  patient,
  activeTab,
  encounters,
  observations,
  reconciledMeds,
  allergies,
  carePlan,
  preAlert,
  sourceDocs,
  outstandingActions,
  assemblyCompleted,
  assemblyRunning,
  assemblyStepIndex,
  onTriggerAssembly,
  onOpenRindTab,
  onOpenSourceDoc,
  onToggleAction,
}: EprStandardTabsViewProps) {
  const [selectedDocFilter, setSelectedDocFilter] = useState<string>('ALL');

  if (activeTab === 'overview') {
    return (
      <div className="workspace-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Current Status Card (Matching Mockup 2 Step 2) */}
        <div className="nhs-card">
          <div className="care-card-header neutral">
            <h2 className="care-card-title">Current status</h2>
            <span className="status-pill-green">
              <CheckCircle2 size={15} />
              Pre-alert received
            </span>
          </div>
          <div
            className="nhs-card-pad"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '8px',
                  background: '#EBF3FA',
                  color: '#005EB8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ambulance size={24} />
              </div>
              <div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: '#212B32' }}>
                  Incoming from community
                </div>
                <div style={{ fontSize: '14.5px', color: '#4C6272' }}>
                  {preAlert.ambulanceService} · Ambulance pre-alert –{' '}
                  <strong>ETA {preAlert.etaMinutes} minutes</strong> (received{' '}
                  {preAlert.receivedTimestamp})
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {!assemblyCompleted && (
                <button
                  type="button"
                  className="btn-nhs-blue"
                  disabled={assemblyRunning}
                  onClick={onTriggerAssembly}
                >
                  {assemblyRunning ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Assembling Journey...
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      Assemble patient journey
                    </>
                  )}
                </button>
              )}
              <button type="button" className="btn-nhs-green" onClick={onOpenRindTab}>
                Open RIND – Acute Journey
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Ambulance Pre-Alert & Assembly Panel (Matching Mockup 2 Step 3 & Screen 3) */}
        <div className="nhs-care-card blue">
          <div className="care-card-header blue">
            <h2 className="care-card-title">
              <Ambulance size={19} />
              Ambulance pre-alert ({preAlert.callsign})
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="status-pill-amber">
                <Clock size={14} />
                ETA: {preAlert.etaMinutes} minutes
              </span>
              <span className="status-pill-green">
                <CheckCircle2 size={14} />
                Pre-alert received ({preAlert.receivedTimestamp})
              </span>
            </div>
          </div>

          <div className="nhs-card-pad">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '16px',
              }}
            >
              <div>
                <div className="nhs-summary-list" style={{ border: '1px solid #D8DDE0', borderRadius: '6px' }}>
                  <div className="nhs-summary-row">
                    <div className="nhs-summary-key">Destination</div>
                    <div className="nhs-summary-value">{preAlert.arrivalDestination}</div>
                  </div>
                  <div className="nhs-summary-row">
                    <div className="nhs-summary-key">Presenting complaint</div>
                    <div className="nhs-summary-value">{preAlert.presentingComplaint}</div>
                  </div>
                  <div className="nhs-summary-row">
                    <div className="nhs-summary-key">Pre-alert obs</div>
                    <div className="nhs-summary-value" style={{ fontWeight: 700 }}>
                      {preAlert.observationsSummary}
                    </div>
                  </div>
                  <div className="nhs-summary-row">
                    <div className="nhs-summary-key">Crew notes</div>
                    <div className="nhs-summary-value">{preAlert.crewNotes}</div>
                  </div>
                </div>
              </div>

              {/* Simulated RIND Assembly Progress */}
              <div
                style={{
                  background: '#F7FAFC',
                  border: '1px solid #C9D7E3',
                  borderRadius: '6px',
                  padding: '14px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                    gap: '8px',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#003087' }}>
                    RIND Information Assembly Status
                  </div>
                  <button
                    type="button"
                    className="btn-nhs-secondary"
                    style={{ padding: '4px 10px', fontSize: '12.5px' }}
                    disabled={assemblyRunning}
                    onClick={onTriggerAssembly}
                  >
                    {assemblyRunning ? 'Running...' : assemblyCompleted ? 'Re-run Assembly' : 'Assemble patient journey'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {preAlert.assemblySteps.map((step, idx) => {
                    const reached = assemblyCompleted || (assemblyRunning && idx <= assemblyStepIndex);
                    const isPartial = step.status === 'PARTIAL';
                    return (
                      <div
                        key={step.id}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #D8DDE0',
                          borderLeft: `4px solid ${
                            !reached ? '#AEB7BD' : isPartial ? '#FFB81C' : '#007F3B'
                          }`,
                          borderRadius: '4px',
                          padding: '7px 10px',
                          opacity: reached ? 1 : 0.65,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            fontSize: '13.5px',
                            fontWeight: 700,
                          }}
                        >
                          <span>{step.label}</span>
                          <span
                            style={{
                              fontSize: '11.5px',
                              color: !reached
                                ? '#4C6272'
                                : isPartial
                                  ? '#6E4700'
                                  : '#007F3B',
                            }}
                          >
                            {!reached ? 'PENDING' : step.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#4C6272', marginTop: '2px' }}>
                          {step.sourceSystem} · {step.detail}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom 2-column: Key information + Next actions */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          <div className="nhs-card">
            <div className="care-card-header neutral">
              <h2 className="care-card-title">Key information</h2>
            </div>
            <div className="nhs-summary-list">
              <div className="nhs-summary-row">
                <div className="nhs-summary-key">Diagnoses</div>
                <div className="nhs-summary-value">{patient.diagnoses.join(' · ')}</div>
              </div>
              <div className="nhs-summary-row">
                <div className="nhs-summary-key">Allergies</div>
                <div className="nhs-summary-value">
                  <span className="status-pill-red">Penicillin – rash, urticaria</span>
                </div>
              </div>
              <div className="nhs-summary-row">
                <div className="nhs-summary-key">Residence</div>
                <div className="nhs-summary-value">{patient.residenceType}</div>
              </div>
              <div className="nhs-summary-row">
                <div className="nhs-summary-key">Next of kin</div>
                <div className="nhs-summary-value">
                  {patient.nokName} ({patient.nokRelationship}) · {patient.nokPhone}
                </div>
              </div>
            </div>
          </div>

          <div className="nhs-card">
            <div className="care-card-header neutral">
              <h2 className="care-card-title">Next actions before arrival</h2>
            </div>
            <div className="nhs-card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {outstandingActions.slice(0, 3).map((act) => (
                <label
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '15px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={act.completed}
                    onChange={() => onToggleAction(act.id)}
                    style={{ width: '18px', height: '18px', marginTop: '2px' }}
                  />
                  <span>{act.title}</span>
                </label>
              ))}
              <div style={{ marginTop: '8px' }}>
                <button type="button" className="btn-nhs-green" onClick={onOpenRindTab}>
                  Review Full RIND Acute Journey Summary
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'encounters') {
    return (
      <div className="workspace-content">
        <div className="nhs-card">
          <div className="care-card-header blue">
            <h2 className="care-card-title">Patient Encounters &amp; Episodes</h2>
          </div>
          <div className="clinical-table-wrap">
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Started</th>
                  <th>Encounter Type</th>
                  <th>Organisation / Location</th>
                  <th>Lead Clinician</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {encounters.map((enc) => (
                  <tr key={enc.id}>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{enc.startedAt}</td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{enc.type}</div>
                      <div style={{ fontSize: '13px', color: '#4C6272' }}>{enc.summary}</div>
                    </td>
                    <td>{enc.location}</td>
                    <td>{enc.leadClinician}</td>
                    <td>
                      <span className="status-pill-blue">{enc.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'observations') {
    return (
      <div className="workspace-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="nhs-inset amber">
          <strong>Clinical Trajectory Highlight:</strong> Serial community and ambulance
          observations show progressive respiratory deterioration between 09:00 (RR 22, SpO₂ 92%
          air, NEWS2 2) and 18:00 (RR 30, SpO₂ 91% on 2L O₂, NEWS2 9).
        </div>

        <div className="nhs-card">
          <div className="care-card-header blue">
            <h2 className="care-card-title">
              <Activity size={18} />
              Serial Physiological Observations (Community to ED Pre-Alert)
            </h2>
          </div>
          <div className="clinical-table-wrap">
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Service</th>
                  <th>RR (/min)</th>
                  <th>SpO₂ (%) &amp; O₂</th>
                  <th>HR (bpm)</th>
                  <th>BP (mmHg)</th>
                  <th>Temp (°C)</th>
                  <th>Cognition / GCS</th>
                  <th>NEWS2</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {observations.map((obs) => (
                  <tr key={obs.id} className={obs.news2 >= 7 ? 'row-warning' : undefined}>
                    <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{obs.timestamp}</td>
                    <td>
                      <ServiceOriginTag service={obs.service} />
                    </td>
                    <td style={{ fontWeight: 700, color: obs.rr >= 25 ? '#9B1C12' : '#212B32' }}>
                      {obs.rr}
                    </td>
                    <td>
                      <strong>{obs.spo2}%</strong> ({obs.oxygenTherapy})
                    </td>
                    <td>{obs.hr}</td>
                    <td>{obs.bp}</td>
                    <td>{obs.temp}</td>
                    <td>{obs.consciousness}</td>
                    <td>
                      <span
                        className={
                          obs.news2 >= 7
                            ? 'status-pill-red'
                            : obs.news2 >= 5
                              ? 'status-pill-amber'
                              : 'status-pill-green'
                        }
                      >
                        NEWS2: {obs.news2}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-source-link"
                        onClick={() => onOpenSourceDoc(obs.sourceDocumentId)}
                      >
                        View
                        <ExternalLink size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'medications') {
    return (
      <div className="workspace-content">
        <div className="nhs-card">
          <div className="care-card-header blue">
            <h2 className="care-card-title">EPR Medications &amp; Acute Pre-Hospital Treatments</h2>
            <button type="button" className="btn-nhs-green" onClick={onOpenRindTab}>
              Open RIND Medication Reconciliation
              <ArrowRight size={15} />
            </button>
          </div>
          <div className="clinical-table-wrap">
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Medication</th>
                  <th>Dose &amp; Route</th>
                  <th>Prescribed By</th>
                  <th>Administration Status</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {reconciledMeds.map(({ order, administration }) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 700 }}>{order.medicationName}</td>
                    <td>
                      {order.dose} · {order.route}
                    </td>
                    <td>
                      {order.prescriber} ({order.prescriptionTime})
                    </td>
                    <td>
                      <MedStatusBadge status={administration.status} />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-source-link"
                        onClick={() => onOpenSourceDoc(order.sourceDocumentId)}
                      >
                        Source
                        <ExternalLink size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'allergies') {
    return (
      <div className="workspace-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="nhs-care-card red">
          <div className="care-card-header red">
            <h2 className="care-card-title">
              <ShieldAlert size={18} />
              Documented Allergies &amp; Adverse Reactions
            </h2>
          </div>
          <div className="nhs-card-pad">
            {allergies.map((alg) => (
              <div key={alg.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '18px', color: '#9B1C12' }}>{alg.substance}</strong>
                  <span className="status-pill-red">Reaction: {alg.documentedReaction}</span>
                  <InformationStateBadge state={alg.verificationStatus} />
                </div>
                <div className="nhs-inset amber">{alg.verificationNote}</div>
                <div>
                  <button
                    type="button"
                    className="btn-source-link"
                    onClick={() => onOpenSourceDoc(alg.sourceDocumentId)}
                  >
                    Inspect GP Allergy Entry
                    <ExternalLink size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'results') {
    return (
      <div className="workspace-content">
        <div className="nhs-card">
          <div className="care-card-header neutral">
            <h2 className="care-card-title">
              <FlaskConical size={18} />
              Recent Pathology &amp; Respiratory Results (External Reference – Hospital A)
            </h2>
          </div>
          <div className="clinical-table-wrap">
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Investigation</th>
                  <th>Organisation</th>
                  <th>Summary Result</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>16 Sep 2026</td>
                  <td style={{ fontWeight: 700 }}>Discharge ABG (on room air)</td>
                  <td>St Jude’s Hospital (Hospital A)</td>
                  <td>pH 7.39, pCO₂ 6.3 kPa, pO₂ 8.4 kPa, HCO₃⁻ 29 mmol/L (compensated hypercapnia)</td>
                </tr>
                <tr>
                  <td>14 Sep 2026</td>
                  <td style={{ fontWeight: 700 }}>Spirometry (Historical Clinic)</td>
                  <td>St Jude’s Respiratory Clinic</td>
                  <td>FEV1 42% predicted, FEV1/FVC 0.54 (Asthma–COPD overlap)</td>
                </tr>
                <tr>
                  <td>Today, 18:15</td>
                  <td style={{ fontWeight: 700 }}>ED Arrival Bloods / VBG / CXR</td>
                  <td>Riverside NHS Trust (Hospital B)</td>
                  <td>
                    <span className="status-pill-grey">Pending patient arrival (ETA 15 mins)</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // 'notes' or 'documents'
  const filteredDocs =
    selectedDocFilter === 'ALL'
      ? sourceDocs
      : sourceDocs.filter((d) => d.category === selectedDocFilter);

  return (
    <div className="workspace-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="nhs-card">
        <div className="care-card-header blue">
          <h2 className="care-card-title">
            <FileText size={18} />
            {activeTab === 'notes'
              ? 'Cross-Service Clinical Notes'
              : 'External & Internal Source Documents'}
          </h2>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['ALL', 'GP Record', 'Care Home Log', 'UCR Assessment', 'Ambulance ePCR', 'Specialist Care Plan'].map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`rind-subtab-btn ${selectedDocFilter === cat ? 'active' : ''}`}
                  style={{ padding: '4px 10px', fontSize: '12.5px' }}
                  onClick={() => setSelectedDocFilter(cat)}
                >
                  {cat}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="clinical-table-wrap">
          <table className="clinical-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Document Title</th>
                <th>Organisation &amp; System</th>
                <th>Author</th>
                <th>Retrieval Status</th>
                <th>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc) => (
                <tr key={doc.id}>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{doc.timestamp}</td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{doc.title}</div>
                    <div style={{ fontSize: '12.5px', color: '#4C6272' }}>{doc.category}</div>
                  </td>
                  <td>
                    <div>{doc.organisation}</div>
                    <div style={{ fontSize: '12.5px', color: '#4C6272' }}>{doc.sourceSystem}</div>
                  </td>
                  <td>
                    {doc.author} ({doc.clinicianRole})
                  </td>
                  <td>
                    <span
                      className={
                        doc.retrievalStatus === 'RETRIEVED'
                          ? 'status-pill-green'
                          : doc.retrievalStatus === 'PARTIAL'
                            ? 'status-pill-amber'
                            : 'status-pill-grey'
                      }
                    >
                      {doc.retrievalStatus}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-source-link"
                      onClick={() => onOpenSourceDoc(doc.id)}
                    >
                      Open Record
                      <ExternalLink size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Care Plan Quick Link */}
      <div className="nhs-inset blue" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <strong>Hospital A Respiratory Care Plan Available:</strong> {carePlan.title} (
          {carePlan.holdingOrganisation})
        </div>
        <button
          type="button"
          className="btn-nhs-blue"
          onClick={() => onOpenSourceDoc(carePlan.sourceDocumentId)}
        >
          View Original Care Plan
        </button>
      </div>
    </div>
  );
}
