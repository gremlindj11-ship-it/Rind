'use client';

import React from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  Shield,
  User,
  X,
} from 'lucide-react';
import { SourceDocument } from '@/types/rind';

interface SourceDocumentModalProps {
  document: SourceDocument | null;
  onClose: () => void;
  onMarkReviewed: (docId: string) => void;
}

export function SourceDocumentModal({
  document,
  onClose,
  onMarkReviewed,
}: SourceDocumentModalProps) {
  if (!document) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="source-doc-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-panel">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <FileText size={20} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '12px', color: '#C8D9EB', fontWeight: 600 }}>
                ORIGINAL SYNTHETIC SOURCE RECORD · {document.category.toUpperCase()}
              </div>
              <h2
                id="source-doc-title"
                style={{ margin: 0, fontSize: '17.5px', fontWeight: 700, color: '#ffffff' }}
              >
                {document.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close source record viewer"
            style={{
              background: 'rgba(255,255,255,0.14)',
              border: '1px solid rgba(255,255,255,0.35)',
              color: '#ffffff',
              borderRadius: '4px',
              padding: '5px 8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            <X size={16} />
            Close
          </button>
        </div>

        <div className="modal-body">
          {/* Provenance Metadata Grid */}
          <div
            className="nhs-card"
            style={{ marginBottom: '16px', background: '#F7FAFC', borderColor: '#C9D7E3' }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '10px',
                padding: '12px 14px',
                fontSize: '13.5px',
              }}
            >
              <div>
                <div style={{ color: '#4C6272', fontSize: '12px', fontWeight: 700 }}>
                  <Building2 size={12} style={{ verticalAlign: '-1px', marginRight: '4px' }} />
                  SOURCE ORGANISATION
                </div>
                <div style={{ fontWeight: 700, marginTop: '2px' }}>{document.organisation}</div>
              </div>
              <div>
                <div style={{ color: '#4C6272', fontSize: '12px', fontWeight: 700 }}>
                  <Shield size={12} style={{ verticalAlign: '-1px', marginRight: '4px' }} />
                  SOURCE SYSTEM
                </div>
                <div style={{ fontWeight: 700, marginTop: '2px' }}>{document.sourceSystem}</div>
              </div>
              <div>
                <div style={{ color: '#4C6272', fontSize: '12px', fontWeight: 700 }}>
                  <Clock size={12} style={{ verticalAlign: '-1px', marginRight: '4px' }} />
                  DATE &amp; TIME
                </div>
                <div style={{ fontWeight: 700, marginTop: '2px' }}>{document.timestamp}</div>
              </div>
              <div>
                <div style={{ color: '#4C6272', fontSize: '12px', fontWeight: 700 }}>
                  <User size={12} style={{ verticalAlign: '-1px', marginRight: '4px' }} />
                  AUTHOR / ROLE
                </div>
                <div style={{ fontWeight: 700, marginTop: '2px' }}>
                  {document.author} ({document.clinicianRole})
                </div>
              </div>
            </div>
          </div>

          {document.retrievalStatus === 'PARTIAL' && (
            <div className="nhs-inset amber" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                <AlertTriangle size={16} />
                Partial Electronic Record — Care Home MAR Feed Pending
              </div>
              <div style={{ marginTop: '4px', fontSize: '14px' }}>
                This escalation log was transmitted, but the care home Medication Administration Record
                (MAR) requires direct confirmation. RIND does not treat missing records as confirmed.
              </div>
            </div>
          )}

          {/* Key Facts Extracted by RIND */}
          <div className="nhs-care-card blue" style={{ marginBottom: '16px' }}>
            <div className="care-card-header blue">
              <h3 className="care-card-title" style={{ fontSize: '15px' }}>
                RIND Extracted Provenance Statements
              </h3>
              <span style={{ fontSize: '12px', fontWeight: 700 }}>
                Linked to {document.id}
              </span>
            </div>
            <div className="nhs-card-pad" style={{ padding: '12px 16px' }}>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '14px' }}>
                {document.highlightedFacts.map((fact, idx) => (
                  <li key={idx} style={{ marginBottom: '5px' }}>
                    {fact}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Full Original Clinical Documentation */}
          <div className="nhs-card">
            <div className="care-card-header neutral">
              <h3 className="care-card-title" style={{ fontSize: '15px' }}>
                Original Clinical Documentation Preview
              </h3>
              <span className="status-pill-grey" style={{ fontSize: '11.5px', padding: '2px 8px' }}>
                Read-Only Source (Never Overwritten by RIND)
              </span>
            </div>
            <div className="nhs-card-pad">
              {document.sections.map((sec, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: idx === document.sections.length - 1 ? 0 : '14px',
                    paddingBottom: idx === document.sections.length - 1 ? 0 : '12px',
                    borderBottom:
                      idx === document.sections.length - 1 ? 'none' : '1px solid #D8DDE0',
                  }}
                >
                  <div
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 700,
                      color: '#003087',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                    }}
                  >
                    {sec.heading}
                  </div>
                  <p style={{ margin: 0, fontSize: '14.5px', lineHeight: 1.55, color: '#212B32' }}>
                    {sec.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div style={{ fontSize: '13px', color: '#4C6272' }}>
            {document.reviewedByClinician ? (
              <span className="status-pill-green">
                <CheckCircle2 size={14} />
                Source inspected &amp; reviewed by Dr Patel
              </span>
            ) : (
              'AI summaries must not replace inspection of primary clinical notes.'
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {!document.reviewedByClinician && (
              <button
                type="button"
                className="btn-nhs-green"
                onClick={() => onMarkReviewed(document.id)}
              >
                <FileCheck2 size={16} />
                Mark Source Reviewed &amp; Return
              </button>
            )}
            <button type="button" className="btn-nhs-secondary" onClick={onClose}>
              Return to RIND Summary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
