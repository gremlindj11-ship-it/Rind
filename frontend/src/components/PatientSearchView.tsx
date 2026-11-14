'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Search,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import { Patient } from '@/types/rind';

interface PatientSearchViewProps {
  patients: Patient[];
  initialSearchText?: string;
  onConfirmOpenPatient: (patient: Patient) => void;
  pendingConfirmPatient: Patient | null;
  onSetPendingConfirmPatient: (patient: Patient | null) => void;
}

export function PatientSearchView({
  patients,
  initialSearchText = '',
  onConfirmOpenPatient,
  pendingConfirmPatient,
  onSetPendingConfirmPatient,
}: PatientSearchViewProps) {
  const [nameQuery, setNameQuery] = useState(initialSearchText);
  const [dobQuery, setDobQuery] = useState('');
  const [nhsQuery, setNhsQuery] = useState('');
  const [confirmCheckNameDob, setConfirmCheckNameDob] = useState(false);
  const [confirmCheckNhs, setConfirmCheckNhs] = useState(false);

  const filteredPatients = useMemo(() => {
    const nQ = nameQuery.trim().toLowerCase();
    const dQ = dobQuery.trim().toLowerCase();
    const hQ = nhsQuery.replace(/\s+/g, '').trim();

    return patients.filter((p) => {
      const matchName = !nQ || p.fullName.toLowerCase().includes(nQ);
      const matchDob = !dQ || p.dob.toLowerCase().includes(dQ);
      const matchNhs = !hQ || p.nhsNumber.replace(/\s+/g, '').includes(hQ);
      return matchName && matchDob && matchNhs;
    });
  }, [patients, nameQuery, dobQuery, nhsQuery]);

  const openConfirmationModal = (patient: Patient) => {
    setConfirmCheckNameDob(false);
    setConfirmCheckNhs(false);
    onSetPendingConfirmPatient(patient);
  };

  return (
    <div className="workspace-content">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '16px',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#212B32' }}>
            EPR Patient Search &amp; Identity Verification
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '15px', color: '#4C6272' }}>
            Search Riverside NHS Trust Master Patient Index (synthetic data). Explicit identity
            verification is required before opening any clinical record.
          </p>
        </div>
        <button
          type="button"
          className="btn-nhs-secondary"
          onClick={() => {
            setNameQuery('Margaret');
            setDobQuery('');
            setNhsQuery('');
          }}
        >
          <Search size={15} />
          Quick Fill: &ldquo;Margaret&rdquo;
        </button>
      </div>

      <div className="nhs-care-card blue" style={{ marginBottom: '18px' }}>
        <div className="care-card-header blue">
          <h2 className="care-card-title">
            <Search size={18} />
            Patient Lookup Criteria
          </h2>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>
            Exact / Deterministic Match Required (No Silent Fuzzy Auto-Select)
          </span>
        </div>

        <div className="nhs-card-pad">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
            }}
          >
            <div>
              <label
                htmlFor="search-name"
                style={{ display: 'block', fontWeight: 700, fontSize: '14px', marginBottom: '5px' }}
              >
                Patient full or partial name
              </label>
              <input
                id="search-name"
                type="text"
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
                placeholder="e.g. Margaret Thompson"
                style={{
                  width: '100%',
                  padding: '9px 11px',
                  border: '2px solid #4C6272',
                  borderRadius: '4px',
                  fontSize: '15px',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="search-nhs"
                style={{ display: 'block', fontWeight: 700, fontSize: '14px', marginBottom: '5px' }}
              >
                Synthetic NHS Number
              </label>
              <input
                id="search-nhs"
                type="text"
                value={nhsQuery}
                onChange={(e) => setNhsQuery(e.target.value)}
                placeholder="e.g. 987 654 3210"
                style={{
                  width: '100%',
                  padding: '9px 11px',
                  border: '2px solid #4C6272',
                  borderRadius: '4px',
                  fontSize: '15px',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="search-dob"
                style={{ display: 'block', fontWeight: 700, fontSize: '14px', marginBottom: '5px' }}
              >
                Date of Birth
              </label>
              <input
                id="search-dob"
                type="text"
                value={dobQuery}
                onChange={(e) => setDobQuery(e.target.value)}
                placeholder="e.g. 14 Mar 1943"
                style={{
                  width: '100%',
                  padding: '9px 11px',
                  border: '2px solid #4C6272',
                  borderRadius: '4px',
                  fontSize: '15px',
                }}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div className="nhs-inset amber" style={{ flex: 1, minWidth: '280px', padding: '8px 12px' }}>
              <strong>Patient Safety Check:</strong> Notice that searching &ldquo;Margaret&rdquo;
              returns two distinct patients (<strong>Margaret Thompson</strong> and{' '}
              <strong>Margaret Thorne</strong>). RIND requires explicit 3-point identity confirmation.
            </div>
            <button
              type="button"
              className="btn-nhs-secondary"
              onClick={() => {
                setNameQuery('');
                setDobQuery('');
                setNhsQuery('');
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      <div className="nhs-card">
        <div className="care-card-header neutral">
          <h2 className="care-card-title">Matching Patient Records ({filteredPatients.length})</h2>
          <span style={{ fontSize: '13px', color: '#4C6272' }}>
            Select a patient to confirm identity before accessing clinical data
          </span>
        </div>

        <div className="clinical-table-wrap">
          <table className="clinical-table">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Date of Birth (Age)</th>
                <th>Synthetic NHS Number</th>
                <th>Sex</th>
                <th>Existing Hospital Record</th>
                <th>Current Encounter Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    className={patient.hasActivePreAlert ? 'row-warning' : undefined}
                  >
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#003087' }}>
                        {patient.fullName}
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#4C6272' }}>
                        {patient.residenceType}
                      </div>
                    </td>
                    <td>
                      {patient.dob} <strong>({patient.age})</strong>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {patient.nhsNumber}
                    </td>
                    <td>{patient.sex}</td>
                    <td>{patient.hospitalRecordStatus}</td>
                    <td>
                      {patient.hasActivePreAlert ? (
                        <span className="status-pill-red">
                          <AlertTriangle size={13} />
                          {patient.currentEncounterStatus}
                        </span>
                      ) : (
                        <span className="status-pill-grey">{patient.currentEncounterStatus}</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={patient.hasActivePreAlert ? 'btn-nhs-green' : 'btn-nhs-secondary'}
                        onClick={() => openConfirmationModal(patient)}
                      >
                        <UserCheck size={15} />
                        Open Record
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#4C6272' }}>
                    No synthetic patients match your current search filters. Try searching{' '}
                    <strong>Margaret Thompson</strong> or <strong>987 654 3210</strong>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pendingConfirmPatient && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="id-confirm-title"
        >
          <div className="modal-panel" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <ShieldCheck size={20} />
                <h2 id="id-confirm-title" style={{ margin: 0, fontSize: '18px' }}>
                  Confirm Patient Identity Before Opening Record
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onSetPendingConfirmPatient(null)}
                aria-label="Close identity confirmation dialog"
                style={{
                  background: 'transparent',
                  border: 0,
                  color: '#ffffff',
                  display: 'inline-flex',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="nhs-inset amber" style={{ marginBottom: '14px' }}>
                Verify full name, date of birth, and NHS number against the ambulance pre-alert or
                referral notice. In production, authoritative NHS PDS matching is enforced.
              </div>

              <div className="nhs-card" style={{ marginBottom: '16px' }}>
                <div className="nhs-summary-list">
                  <div className="nhs-summary-row">
                    <div className="nhs-summary-key">Full Name</div>
                    <div className="nhs-summary-value">
                      <strong>{pendingConfirmPatient.fullName}</strong>
                    </div>
                  </div>
                  <div className="nhs-summary-row">
                    <div className="nhs-summary-key">Date of Birth</div>
                    <div className="nhs-summary-value">
                      {pendingConfirmPatient.dob} (Age {pendingConfirmPatient.age}) · Sex:{' '}
                      {pendingConfirmPatient.sex}
                    </div>
                  </div>
                  <div className="nhs-summary-row">
                    <div className="nhs-summary-key">Synthetic NHS No</div>
                    <div
                      className="nhs-summary-value"
                      style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                    >
                      {pendingConfirmPatient.nhsNumber}
                    </div>
                  </div>
                  <div className="nhs-summary-row">
                    <div className="nhs-summary-key">Address</div>
                    <div className="nhs-summary-value">{pendingConfirmPatient.address}</div>
                  </div>
                  <div className="nhs-summary-row">
                    <div className="nhs-summary-key">Encounter Status</div>
                    <div className="nhs-summary-value">
                      {pendingConfirmPatient.currentEncounterStatus}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '14.5px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={confirmCheckNameDob}
                    onChange={(e) => setConfirmCheckNameDob(e.target.checked)}
                    style={{ width: '18px', height: '18px', marginTop: '2px' }}
                  />
                  <span>
                    I confirm <strong>{pendingConfirmPatient.fullName}</strong> and DOB{' '}
                    <strong>{pendingConfirmPatient.dob}</strong> match the presenting patient.
                  </span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '14.5px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={confirmCheckNhs}
                    onChange={(e) => setConfirmCheckNhs(e.target.checked)}
                    style={{ width: '18px', height: '18px', marginTop: '2px' }}
                  />
                  <span>
                    I confirm NHS Number{' '}
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>
                      {pendingConfirmPatient.nhsNumber}
                    </strong>{' '}
                    and clinical access purpose (direct acute care).
                  </span>
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-nhs-secondary"
                onClick={() => onSetPendingConfirmPatient(null)}
              >
                Cancel
              </button>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {!(confirmCheckNameDob && confirmCheckNhs) && (
                  <button
                    type="button"
                    className="btn-nhs-blue"
                    onClick={() => {
                      setConfirmCheckNameDob(true);
                      setConfirmCheckNhs(true);
                    }}
                  >
                    Quick-Check Identity Boxes
                  </button>
                )}
                <button
                  type="button"
                  className="btn-nhs-green"
                  disabled={!(confirmCheckNameDob && confirmCheckNhs)}
                  onClick={() => onConfirmOpenPatient(pendingConfirmPatient)}
                >
                  <CheckCircle2 size={16} />
                  Confirm Identity &amp; Open EPR Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
