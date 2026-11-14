'use client';

import React from 'react';
import {
  AlertTriangle,
  Brain,
  Home,
  Stethoscope,
  User,
} from 'lucide-react';
import { Patient, PatientRecordTab } from '@/types/rind';

interface PatientBannerProps {
  patient: Patient;
  activeTab: PatientRecordTab;
  onSelectTab: (tab: PatientRecordTab) => void;
  allergyVerified: boolean;
  onOpenAllergySource: () => void;
  onOpenReasonableAdjustments: () => void;
}

const EPR_TABS: { id: PatientRecordTab; label: string; isRind?: boolean }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'encounters', label: 'Encounters' },
  { id: 'notes', label: 'Clinical Notes' },
  { id: 'medications', label: 'Medications' },
  { id: 'allergies', label: 'Allergies' },
  { id: 'observations', label: 'Observations' },
  { id: 'results', label: 'Results' },
  { id: 'documents', label: 'Documents' },
  { id: 'rind', label: 'RIND – Acute Journey', isRind: true },
];

export function PatientBanner({
  patient,
  activeTab,
  onSelectTab,
  allergyVerified,
  onOpenAllergySource,
  onOpenReasonableAdjustments,
}: PatientBannerProps) {
  return (
    <section className="patient-banner" aria-label="Active patient demographics and clinical alerts">
      <div className="patient-banner-top">
        <div className="patient-identity-block">
          <div className="patient-avatar" aria-hidden="true">
            <User size={24} />
          </div>
          <div>
            <div className="patient-name-row">
              <h1 className="patient-name">{patient.fullName}</h1>
              {patient.hasActivePreAlert && (
                <span className="status-pill-red" style={{ padding: '2px 8px', fontSize: '11.5px' }}>
                  ED Pre-Alert Active
                </span>
              )}
            </div>
            <div className="patient-demographics">
              <span>
                NHS No: <strong>{patient.nhsNumber}</strong>
              </span>
              <span>
                DOB: <strong>{patient.dob} ({patient.age})</strong>
              </span>
              <span>
                Sex: <strong>{patient.sex}</strong>
              </span>
              <span>
                Hosp No: <strong>{patient.hospitalNumber}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="patient-alert-pills">
          <button
            type="button"
            className="clinical-pill allergy"
            onClick={onOpenAllergySource}
            title="Click to inspect Penicillin allergy documentation"
          >
            <AlertTriangle size={15} aria-hidden="true" />
            <span>
              Allergy: Penicillin (rash, urticaria)
              {!allergyVerified ? ' · Unverified' : ''}
            </span>
          </button>

          <button
            type="button"
            className="clinical-pill dementia"
            onClick={onOpenReasonableAdjustments}
            title="View cognitive baseline and reasonable adjustments"
          >
            <Brain size={15} aria-hidden="true" />
            <span>Dementia (moderate)</span>
          </button>

          <span className="clinical-pill respiratory">
            <Stethoscope size={15} aria-hidden="true" />
            <span>COPD / Asthma (ACO)</span>
          </span>

          <span className="clinical-pill residence">
            <Home size={15} aria-hidden="true" />
            <span>Resident: {patient.residenceType}</span>
          </span>
        </div>
      </div>

      <div className="epr-tabs-row" role="tablist" aria-label="Patient record sections">
        {EPR_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`epr-tab-btn ${tab.isRind ? 'rind-tab' : ''} ${
              activeTab === tab.id ? 'active' : ''
            }`}
            onClick={() => onSelectTab(tab.id)}
          >
            {tab.isRind && <span className="tab-rind-badge">RIND</span>}
            <span>{tab.label}</span>
            {tab.isRind && patient.hasActivePreAlert && (
              <span className="tab-alert-dot" title="Active pre-alert summary available" />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
