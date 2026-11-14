'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Flag,
  History,
  ShieldCheck,
} from 'lucide-react';
import { InformationStateBadge } from '@/components/StatusBadges';
import { AuditEvent, ClinicalSummary } from '@/types/rind';

interface ClinicianReviewAndAuditViewProps {
  summary: ClinicalSummary;
  auditEvents: AuditEvent[];
  statementOverrides: Record<
    string,
    { verified?: boolean; flaggedIncorrect?: boolean; clinicianNote?: string; editedText?: string }
  >;
  onVerifyStatement: (statementId: string) => void;
  onFlagStatement: (statementId: string, note: string) => void;
  onCorrectStatement: (statementId: string, correctedText: string) => void;
  onSignOffSummary: () => void;
  onOpenSourceDoc: (docId: string) => void;
}

export function ClinicianReviewAndAuditView({
  summary,
  auditEvents,
  statementOverrides,
  onVerifyStatement,
  onFlagStatement,
  onCorrectStatement,
  onSignOffSummary,
  onOpenSourceDoc,
}: ClinicianReviewAndAuditViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [flaggingId, setFlaggingId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Sign-Off Header Card */}
      <div className={`nhs-care-card ${summary.reviewStatus === 'CLINICIAN_VERIFIED' ? 'green' : 'amber'}`}>
        <div className="care-card-header neutral">
          <div>
            <h3 className="care-card-title">
              <ShieldCheck size={19} color={summary.reviewStatus === 'CLINICIAN_VERIFIED' ? '#007F3B' : '#6E4700'} />
              Clinician Review, Correction &amp; Sign-Off
            </h3>
            <div style={{ fontSize: '13.5px', color: '#4C6272', marginTop: '3px' }}>
              AI-generated summaries remain in <strong>DRAFT</strong> until explicitly reviewed by
              an authorised clinician. Original source documents are never overwritten.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {summary.reviewStatus === 'CLINICIAN_VERIFIED' ? (
              <span className="status-pill-green" style={{ padding: '7px 12px' }}>
                <CheckCircle2 size={16} />
                CLINICIAN VERIFIED · {summary.reviewedBy} ({summary.reviewedAt})
              </span>
            ) : (
              <button type="button" className="btn-nhs-green" onClick={onSignOffSummary}>
                <CheckCircle2 size={17} />
                Mark RIND Summary as Reviewed &amp; Verified
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Structured 10-Section Verification List */}
      <div className="nhs-card">
        <div className="care-card-header blue">
          <h3 className="care-card-title" style={{ fontSize: '16px' }}>
            Structured Clinical Summary Statements (10-Point Handover Review)
          </h3>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>
            Inspect source · Verify · Flag · Correct structured statement
          </span>
        </div>

        <div className="nhs-card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {summary.sections.map((section) => (
            <div
              key={section.id}
              style={{
                border: '1px solid #D8DDE0',
                borderRadius: '6px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  background: '#F4F7F9',
                  padding: '8px 14px',
                  fontWeight: 700,
                  fontSize: '14.5px',
                  color: '#003087',
                  borderBottom: '1px solid #D8DDE0',
                }}
              >
                {section.number}. {section.heading}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {section.statements.map((st, idx) => {
                  const ov = statementOverrides[st.id] ?? {};
                  const effectiveText = ov.editedText ?? st.text;
                  const effectiveState = ov.verified ? 'CONFIRMED' : st.state;

                  return (
                    <div
                      key={st.id}
                      style={{
                        padding: '10px 14px',
                        borderBottom:
                          idx === section.statements.length - 1 ? 'none' : '1px solid #E8EDEE',
                        background: ov.flaggedIncorrect
                          ? '#FDECEC'
                          : ov.verified
                            ? '#F5FBF7'
                            : '#FFFFFF',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '12px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: '280px' }}>
                          <div style={{ fontSize: '14.5px', color: '#212B32', lineHeight: 1.45 }}>
                            {effectiveText}
                          </div>
                          {ov.clinicianNote && (
                            <div
                              style={{
                                marginTop: '6px',
                                fontSize: '13px',
                                color: ov.flaggedIncorrect ? '#9B1C12' : '#00662F',
                                fontWeight: 700,
                              }}
                            >
                              Clinician Note: {ov.clinicianNote}
                            </div>
                          )}

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              flexWrap: 'wrap',
                              marginTop: '7px',
                            }}
                          >
                            <InformationStateBadge state={effectiveState} />
                            {ov.flaggedIncorrect && (
                              <span className="status-pill-red" style={{ fontSize: '11.5px', padding: '2px 7px' }}>
                                <AlertTriangle size={12} />
                                FLAGGED FOR REVIEW
                              </span>
                            )}
                            {st.sourceDocumentIds.map((docId) => (
                              <button
                                key={docId}
                                type="button"
                                className="btn-source-link"
                                style={{ padding: '2px 8px', fontSize: '12px' }}
                                onClick={() => onOpenSourceDoc(docId)}
                              >
                                Source: {docId.replace('doc-', '').toUpperCase()}
                                <ExternalLink size={11} />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn-nhs-secondary"
                            style={{ padding: '4px 9px', fontSize: '12.5px' }}
                            onClick={() => onVerifyStatement(st.id)}
                          >
                            <CheckCircle2 size={13} />
                            {ov.verified ? 'Verified' : 'Verify'}
                          </button>

                          <button
                            type="button"
                            className="btn-nhs-secondary"
                            style={{ padding: '4px 9px', fontSize: '12.5px' }}
                            onClick={() => {
                              setEditingId(st.id);
                              setEditDraft(effectiveText);
                              setFlaggingId(null);
                            }}
                          >
                            <Edit3 size={13} />
                            Correct
                          </button>

                          <button
                            type="button"
                            className="btn-nhs-secondary"
                            style={{
                              padding: '4px 9px',
                              fontSize: '12.5px',
                              borderColor: '#D5281B',
                              color: '#9B1C12',
                            }}
                            onClick={() => {
                              setFlaggingId(st.id);
                              setFlagReason('');
                              setEditingId(null);
                            }}
                          >
                            <Flag size={13} />
                            Flag
                          </button>
                        </div>
                      </div>

                      {editingId === st.id && (
                        <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                            style={{
                              flex: 1,
                              minWidth: '240px',
                              padding: '7px 10px',
                              border: '1.5px solid #005EB8',
                              borderRadius: '4px',
                            }}
                          />
                          <button
                            type="button"
                            className="btn-nhs-green"
                            style={{ padding: '6px 12px', fontSize: '13px' }}
                            onClick={() => {
                              onCorrectStatement(st.id, editDraft);
                              setEditingId(null);
                            }}
                          >
                            Save Correction
                          </button>
                          <button
                            type="button"
                            className="btn-nhs-secondary"
                            style={{ padding: '6px 10px', fontSize: '13px' }}
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {flaggingId === st.id && (
                        <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            value={flagReason}
                            onChange={(e) => setFlagReason(e.target.value)}
                            placeholder="Reason for flag / further investigation..."
                            style={{
                              flex: 1,
                              minWidth: '240px',
                              padding: '7px 10px',
                              border: '1.5px solid #D5281B',
                              borderRadius: '4px',
                            }}
                          />
                          <button
                            type="button"
                            className="btn-nhs-blue"
                            style={{ background: '#D5281B', padding: '6px 12px', fontSize: '13px' }}
                            onClick={() => {
                              onFlagStatement(
                                st.id,
                                flagReason.trim() || 'Flagged by Dr Patel for further verification.',
                              );
                              setFlaggingId(null);
                            }}
                          >
                            Record Flag
                          </button>
                          <button
                            type="button"
                            className="btn-nhs-secondary"
                            style={{ padding: '6px 10px', fontSize: '13px' }}
                            onClick={() => setFlaggingId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Trail */}
      <div className="nhs-card">
        <div className="care-card-header neutral">
          <h3 className="care-card-title" style={{ fontSize: '16px' }}>
            <History size={17} />
            Prototype Audit Trail ({auditEvents.length} events)
          </h3>
          <span style={{ fontSize: '13px', color: '#4C6272' }}>
            Session audit log · Local simulation (non-persistent)
          </span>
        </div>

        <div className="clinical-table-wrap">
          <table className="clinical-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Actor / Role</th>
                <th>Event Type</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {auditEvents.map((ev) => (
                <tr key={ev.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                    {ev.timestamp}
                  </td>
                  <td>
                    <strong>{ev.actorName}</strong>{' '}
                    <span style={{ color: '#4C6272', fontSize: '12.5px' }}>({ev.actorRole})</span>
                  </td>
                  <td>
                    <span className="status-pill-blue" style={{ fontSize: '11.5px', padding: '2px 7px' }}>
                      {ev.actionType}
                    </span>
                  </td>
                  <td>{ev.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
