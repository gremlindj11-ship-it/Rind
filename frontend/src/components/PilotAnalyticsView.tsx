'use client';

import React from 'react';
import {
  BarChart3,
  CheckCircle2,
  Database,
  Lock,
  Network,
  Shield,
} from 'lucide-react';

export function PilotAnalyticsView() {
  const proposedMetrics = [
    {
      metric: 'Time to assemble acute clinical picture',
      baseline: '12–25 min (manual multi-system lookup)',
      pilotTarget: 'Evaluate < 2 min via pre-alert trigger',
    },
    {
      metric: 'Time spent searching separate records (GP / UCR / Care Plan)',
      baseline: 'Logged per ED clerking episode',
      pilotTarget: 'Measure reduction during 8-week ED pilot',
    },
    {
      metric: 'Ambulance clinical handover duration',
      baseline: 'Trust & SCAS baseline audit',
      pilotTarget: 'Evaluate information-readiness contribution',
    },
    {
      metric: 'Total ambulance turnaround time',
      baseline: 'Observed alongside hospital flow metrics',
      pilotTarget: 'Monitor (RIND does not claim to eliminate all delays)',
    },
    {
      metric: 'Completeness of information at handover',
      baseline: 'Audit of allergies, care plan & meds recorded',
      pilotTarget: 'Track % of handovers with care plan & MAR flags',
    },
    {
      metric: 'Medication reconciliation time & discrepancy capture',
      baseline: 'Time to distinguish prescribed vs given',
      pilotTarget: 'Measure UNKNOWN vs CONFIRMED reconciliation accuracy',
    },
    {
      metric: 'Specialist care-plan retrieval time (cross-Trust)',
      baseline: 'Manual phone/fax/portal request from Hospital A',
      pilotTarget: 'Track automated FHIR DocumentReference retrieval rate',
    },
    {
      metric: 'Staff usability & confidence (ED, UCR, Ambulance)',
      baseline: 'Pre-pilot clinician survey',
      pilotTarget: 'Post-shift SUS score & safety incident/near-miss review',
    },
  ];

  const integrationBoundaries = [
    {
      source: 'GP Clinical Systems (EMIS / SystmOne)',
      standard: 'GP Connect (HTML / FHIR STU3 & R4 Access Record)',
      notes: 'Requires Trust-level data sharing agreement & PDS match.',
    },
    {
      source: 'Care-Home eMAR & Escalation Logs',
      standard: 'Regional Care Home API / PRSB Transfer of Care',
      notes: 'Variable vendor maturity — RIND degrades safely to UNKNOWN.',
    },
    {
      source: 'Urgent Community Response (UCR)',
      standard: 'SystmOne / Shared Care Record FHIR Encounter & Observation',
      notes: 'Read-only pull triggered on 999 conveyance or pre-alert.',
    },
    {
      source: 'Ambulance ePCR & Pre-Alert',
      standard: 'HL7 FHIR Bundle / Ambulance CAD Pre-Alert Webhook',
      notes: 'Zero extra paramedic forms; uses existing pre-alert workflow.',
    },
    {
      source: 'Specialist Care Plans (Hospital A → B)',
      standard: 'NRL (National Record Locator) + FHIR DocumentReference',
      notes: 'Surfaces cross-organisation respiratory plans inside Hospital B EPR.',
    },
  ];

  return (
    <div className="workspace-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '23px', fontWeight: 700, color: '#212B32' }}>
          Pilot Evaluation Metrics, NHS Interoperability &amp; Clinical Safety
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '15px', color: '#4C6272' }}>
          Prototype governance and Phase 2–4 integration blueprint. Figures below represent{' '}
          <strong>proposed pilot evaluation measures</strong>, not claimed clinical outcomes.
        </p>
      </div>

      {/* Pilot Metrics Table */}
      <div className="nhs-care-card blue">
        <div className="care-card-header blue">
          <h2 className="care-card-title">
            <BarChart3 size={18} />
            Proposed Acute Trust Pilot Evaluation Measures
          </h2>
          <span className="status-pill-amber">Evaluation Framework (No Synthetic Savings Claimed)</span>
        </div>

        <div className="clinical-table-wrap">
          <table className="clinical-table">
            <thead>
              <tr>
                <th>Pilot Measure</th>
                <th>Pre-Deployment Baseline Method</th>
                <th>Controlled Pilot Objective</th>
              </tr>
            </thead>
            <tbody>
              {proposedMetrics.map((row) => (
                <tr key={row.metric}>
                  <td style={{ fontWeight: 700 }}>{row.metric}</td>
                  <td>{row.baseline}</td>
                  <td>{row.pilotTarget}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Integration & Governance 2-col */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '16px',
        }}
      >
        <div className="nhs-card">
          <div className="care-card-header neutral">
            <h2 className="care-card-title">
              <Network size={18} color="#005EB8" />
              Future NHS Integration Architecture
            </h2>
          </div>
          <div className="nhs-card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {integrationBoundaries.map((item) => (
              <div
                key={item.source}
                style={{
                  border: '1px solid #D8DDE0',
                  borderLeft: '4px solid #005EB8',
                  borderRadius: '4px',
                  padding: '9px 12px',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '14.5px' }}>{item.source}</div>
                <div style={{ fontSize: '13px', color: '#003087', fontWeight: 600, marginTop: '2px' }}>
                  <Database size={12} style={{ verticalAlign: '-1px', marginRight: '5px' }} />
                  {item.standard}
                </div>
                <div style={{ fontSize: '13px', color: '#4C6272', marginTop: '2px' }}>
                  {item.notes}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="nhs-care-card red">
          <div className="care-card-header red">
            <h2 className="care-card-title">
              <Shield size={18} />
              Clinical Safety, IG &amp; Regulatory Controls
            </h2>
          </div>
          <div className="nhs-card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14.5px' }}>
            <div className="nhs-inset amber">
              <strong>Prototype Scope Boundary:</strong> This frontend prototype uses synthetic data
              only and does not claim live NHS Spine connectivity or regulatory certification.
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <Lock size={17} color="#005EB8" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Information Governance:</strong> UK GDPR, Data Protection Act 2018, NHS DSP
                Toolkit, RBAC least-privilege access, data minimisation, and immutable audit trails.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={17} color="#007F3B" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Clinical Safety Assurance:</strong> DCB0129 (manufacturer safety case &amp;
                hazard log) and DCB0160 (deploying NHS Trust clinical risk management) prior to
                pilot go-live.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={17} color="#007F3B" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>SaMD Assessment &amp; Non-Autonomy:</strong> Assess UK MDR / MHRA Software as
                a Medical Device classification before deployment. RIND never overwrites source
                records, never diagnoses, and never recommends treatment.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
