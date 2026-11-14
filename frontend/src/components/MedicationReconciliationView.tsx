'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { MedStatusBadge } from '@/components/StatusBadges';
import { MedicationStatus, ReconciledMedication } from '@/types/rind';

interface MedicationReconciliationViewProps {
  reconciledMeds: ReconciledMedication[];
  onOpenSourceDoc: (docId: string) => void;
  onUpdateMedicationStatus: (
    orderId: string,
    newStatus: MedicationStatus,
    adminTime: string | null,
    note: string,
  ) => void;
}

export function MedicationReconciliationView({
  reconciledMeds,
  onOpenSourceDoc,
  onUpdateMedicationStatus,
}: MedicationReconciliationViewProps) {
  const [verifyingOrderId, setVerifyingOrderId] = useState<string | null>(null);
  const [marNote, setMarNote] = useState(
    'Confirmed by phone with Maple View Care Home Senior Carer L. Brooks — MAR checked.',
  );
  const [marTime, setMarTime] = useState('09:45');

  const acuteMeds = reconciledMeds.filter((m) => !m.order.isRegularHomeMed);
  const homeMeds = reconciledMeds.filter((m) => m.order.isRegularHomeMed);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Critical Safety Principle Banner */}
      <div className="nhs-inset amber">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
          <ShieldAlert size={18} color="#6E4700" />
          Medication Reconciliation Safety Guardrail
        </div>
        <div style={{ marginTop: '4px', fontSize: '14.5px' }}>
          RIND strictly separates <strong>Medication Orders (Prescribed)</strong> from{' '}
          <strong>Medication Administrations (Given)</strong>. It never infers administration simply
          because a drug was prescribed, and never interprets missing documentation as &ldquo;not
          given&rdquo;.
        </div>
      </div>

      {/* Acute Episode Medication Timeline */}
      <div className="nhs-care-card blue">
        <div className="care-card-header blue">
          <h3 className="care-card-title">
            <ClipboardCheck size={18} />
            Acute Episode Treatment &amp; Administration Reconciliation
          </h3>
          <span style={{ fontSize: '13px', fontWeight: 700 }}>
            Explicit Statuses: PRESCRIBED · ADMINISTERED · NOT ADMINISTERED · WITHHELD · UNKNOWN ·
            DISCONTINUED
          </span>
        </div>

        <div className="clinical-table-wrap">
          <table className="clinical-table">
            <thead>
              <tr>
                <th>Medication / Intervention</th>
                <th>Dose &amp; Route</th>
                <th>Prescriber &amp; Time</th>
                <th>Administration Status</th>
                <th>Response / Reason</th>
                <th>Source</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {acuteMeds.map(({ order, administration }) => {
                const isUnknownOrPrescribed =
                  administration.status === 'UNKNOWN' || administration.status === 'PRESCRIBED';
                return (
                  <tr
                    key={order.id}
                    className={isUnknownOrPrescribed ? 'row-warning' : undefined}
                  >
                    <td>
                      <div style={{ fontWeight: 700, color: '#212B32' }}>{order.medicationName}</div>
                      <div style={{ fontSize: '12.5px', color: '#4C6272' }}>{order.indication}</div>
                    </td>
                    <td>
                      <div>{order.dose}</div>
                      <div style={{ fontSize: '12.5px', color: '#4C6272' }}>{order.route}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.prescriber}</div>
                      <div style={{ fontSize: '12.5px', color: '#4C6272' }}>
                        {order.prescriptionTime}
                      </div>
                    </td>
                    <td>
                      <MedStatusBadge
                        status={administration.status}
                        detailNote={
                          administration.administrationTime &&
                          administration.status === 'ADMINISTERED'
                            ? administration.administrationTime
                            : undefined
                        }
                      />
                      <div style={{ fontSize: '12px', color: '#4C6272', marginTop: '4px' }}>
                        {administration.administeringService}
                      </div>
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      {administration.documentedResponse && (
                        <div style={{ fontSize: '13.5px', color: '#00662F', fontWeight: 600 }}>
                          Response: {administration.documentedResponse}
                        </div>
                      )}
                      {administration.reasonNotGivenOrUnknown && (
                        <div
                          style={{
                            fontSize: '13px',
                            color:
                              administration.status === 'UNKNOWN' ? '#6E4700' : '#4C6272',
                            fontWeight: administration.status === 'UNKNOWN' ? 700 : 400,
                          }}
                        >
                          {administration.reasonNotGivenOrUnknown}
                        </div>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-source-link"
                        onClick={() =>
                          onOpenSourceDoc(administration.sourceDocumentId ?? order.sourceDocumentId)
                        }
                      >
                        View
                        <ExternalLink size={12} />
                      </button>
                    </td>
                    <td>
                      {isUnknownOrPrescribed ? (
                        <button
                          type="button"
                          className="btn-nhs-blue"
                          style={{ padding: '5px 10px', fontSize: '12.5px' }}
                          onClick={() => setVerifyingOrderId(order.id)}
                        >
                          <HelpCircle size={13} />
                          Verify MAR
                        </button>
                      ) : (
                        <span className="status-pill-green" style={{ fontSize: '12px', padding: '2px 8px' }}>
                          <CheckCircle2 size={12} />
                          Reconciled
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inline Verification Drawer when clinician clicks Verify MAR */}
      {verifyingOrderId && (
        <div className="nhs-care-card amber">
          <div className="care-card-header amber">
            <h3 className="care-card-title">
              <AlertTriangle size={17} />
              Clinician Medication Administration Verification
            </h3>
            <button
              type="button"
              className="btn-nhs-secondary"
              onClick={() => setVerifyingOrderId(null)}
            >
              Cancel
            </button>
          </div>
          <div className="nhs-card-pad">
            <p style={{ margin: '0 0 12px', fontSize: '14.5px' }}>
              Record confirmed administration status from Maple View Care Home MAR sheet or family
              for{' '}
              <strong>
                {reconciledMeds.find((m) => m.order.id === verifyingOrderId)?.order.medicationName}
              </strong>
              . Every verification updates the audit trail.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(140px, 200px) 1fr',
                gap: '12px',
                marginBottom: '12px',
              }}
            >
              <div>
                <label
                  htmlFor="mar-time"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}
                >
                  Admin time (if given)
                </label>
                <input
                  id="mar-time"
                  type="text"
                  value={marTime}
                  onChange={(e) => setMarTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    border: '1.5px solid #4C6272',
                    borderRadius: '4px',
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="mar-note"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}
                >
                  Verification note / source
                </label>
                <input
                  id="mar-note"
                  type="text"
                  value={marNote}
                  onChange={(e) => setMarNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    border: '1.5px solid #4C6272',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-nhs-green"
                onClick={() => {
                  onUpdateMedicationStatus(verifyingOrderId, 'ADMINISTERED', marTime, marNote);
                  setVerifyingOrderId(null);
                }}
              >
                <CheckCircle2 size={16} />
                Confirm as ADMINISTERED ({marTime})
              </button>
              <button
                type="button"
                className="btn-nhs-secondary"
                style={{ borderColor: '#D5281B', color: '#9B1C12' }}
                onClick={() => {
                  onUpdateMedicationStatus(
                    verifyingOrderId,
                    'NOT_ADMINISTERED',
                    null,
                    `Confirmed NOT ADMINISTERED — ${marNote}`,
                  );
                  setVerifyingOrderId(null);
                }}
              >
                Confirm as NOT ADMINISTERED
              </button>
              <button
                type="button"
                className="btn-nhs-secondary"
                onClick={() => {
                  onUpdateMedicationStatus(
                    verifyingOrderId,
                    'UNKNOWN',
                    null,
                    'Administration status: UNKNOWN — verification still pending (awaiting care home callback).',
                  );
                  setVerifyingOrderId(null);
                }}
              >
                Keep as UNKNOWN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regular Home Medications */}
      <div className="nhs-card">
        <div className="care-card-header neutral">
          <h3 className="care-card-title" style={{ fontSize: '15.5px' }}>
            Regular Repeat Medications (GP Summary / Care Home MAR)
          </h3>
          <span style={{ fontSize: '13px', color: '#4C6272' }}>
            Last GP repeat sync · MAR confirmation pending on transfer
          </span>
        </div>
        <div className="clinical-table-wrap">
          <table className="clinical-table">
            <thead>
              <tr>
                <th>Regular Medication</th>
                <th>Dose &amp; Frequency</th>
                <th>Indication</th>
                <th>Today’s MAR Status</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {homeMeds.map(({ order, administration }) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 700 }}>{order.medicationName}</td>
                  <td>
                    {order.dose} · {order.frequency}
                  </td>
                  <td>{order.indication}</td>
                  <td>
                    <MedStatusBadge status={administration.status} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-source-link"
                      onClick={() => onOpenSourceDoc(order.sourceDocumentId)}
                    >
                      GP Record
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
