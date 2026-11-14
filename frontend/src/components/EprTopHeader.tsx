'use client';

import React, { useMemo, useState } from 'react';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Compass,
  HelpCircle,
  Search,
  User,
  X,
} from 'lucide-react';
import { Patient } from '@/types/rind';

interface EprTopHeaderProps {
  patients: Patient[];
  activePatient: Patient | null;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onSelectSearchPatient: (patient: Patient) => void;
  onOpenFullSearch: (initialQuery?: string) => void;
  onOpenPreAlertPanel: () => void;
  demoStep: number;
  onJumpDemoStep: (step: number) => void;
  showDemoBar: boolean;
  onToggleDemoBar: () => void;
  assemblyCompleted: boolean;
}

export function EprTopHeader({
  patients,
  activePatient,
  searchQuery,
  onSearchQueryChange,
  onSelectSearchPatient,
  onOpenFullSearch,
  onOpenPreAlertPanel,
  demoStep,
  onJumpDemoStep,
  showDemoBar,
  onToggleDemoBar,
  assemblyCompleted,
}: EprTopHeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [showHelpPopover, setShowHelpPopover] = useState(false);

  const matchingPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const normalizedNhs = q.replace(/\s+/g, '');
    return patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.nhsNumber.replace(/\s+/g, '').includes(normalizedNhs) ||
        p.dob.toLowerCase().includes(q),
    );
  }, [patients, searchQuery]);

  const showDropdown = searchFocused && searchQuery.trim().length > 0;

  return (
    <>
      <header className="epr-topbar">
        <button
          type="button"
          className="nhs-brand-wrap"
          onClick={() => onOpenFullSearch('')}
          title="Riverside NHS Trust – EPR Home"
        >
          <span className="nhs-logo-box">NHS</span>
          <span className="trust-title">Riverside NHS Trust – EPR</span>
        </button>

        <div className="topbar-search-wrap">
          <div className="topbar-search-box">
            <Search size={16} color="#4C6272" aria-hidden="true" />
            <input
              type="text"
              className="topbar-search-input"
              aria-label="Search patients, encounters, documents"
              placeholder="Search patients, encounters, documents..."
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onOpenFullSearch(searchQuery);
                  setSearchFocused(false);
                }
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="topbar-search-clear"
                aria-label="Clear search"
                onClick={() => onSearchQueryChange('')}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {showDropdown && (
            <div className="search-dropdown-popover" role="listbox" aria-label="Patient search suggestions">
              <div className="search-dropdown-header">
                Patients ({matchingPatients.length})
              </div>
              {matchingPatients.length > 0 ? (
                matchingPatients.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    className={`search-dropdown-item ${
                      patient.id === 'pat-margaret-thompson' ? 'highlighted' : ''
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelectSearchPatient(patient);
                      setSearchFocused(false);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#D5E2EE',
                          color: '#2B4C6F',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <User size={17} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: '#212B32' }}>
                          {patient.fullName}
                          {patient.hasActivePreAlert && (
                            <span
                              style={{
                                marginLeft: '8px',
                                background: '#FDECEC',
                                color: '#9B1C12',
                                border: '1px solid #F2B5B0',
                                fontSize: '11px',
                                padding: '1px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              999 Pre-alert
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '13px', color: '#4C6272' }}>
                          NHS No: {patient.nhsNumber} &nbsp;&nbsp; DOB: {patient.dob} ({patient.age})
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={18} color="#4C6272" />
                  </button>
                ))
              ) : (
                <div style={{ padding: '12px 14px', fontSize: '14px', color: '#4C6272' }}>
                  No matching patients found in local EPR index.
                </div>
              )}

              <button
                type="button"
                className="search-dropdown-footer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onOpenFullSearch(searchQuery);
                  setSearchFocused(false);
                }}
              >
                <Search size={15} />
                Search for &ldquo;{searchQuery.trim()}&rdquo; in more options...
              </button>
            </div>
          )}
        </div>

        <div className="topbar-actions">
          <button
            type="button"
            className="topbar-demo-pill"
            onClick={onToggleDemoBar}
            title="Toggle 2.5-minute walkthrough bar"
          >
            <Compass size={14} />
            <span>Demo Guide</span>
          </button>

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="topbar-icon-btn"
              aria-label="Incoming pre-alert notifications"
              onClick={() => {
                setShowNotifPopover((prev) => !prev);
                setShowHelpPopover(false);
              }}
            >
              <Bell size={18} />
              <span className="notif-badge-dot" />
            </button>

            {showNotifPopover && (
              <div
                className="search-dropdown-popover"
                style={{ width: '340px', right: 0, left: 'auto', padding: '12px 14px' }}
              >
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: '#003087' }}>
                  Incoming ED Pre-Alerts (1 Active)
                </div>
                <div
                  style={{
                    background: '#FDECEC',
                    borderLeft: '4px solid #D5281B',
                    padding: '9px 11px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#9B1C12' }}>
                    18:15 · Margaret Thompson (82F) — ETA 15 mins
                  </div>
                  <div style={{ color: '#212B32', marginTop: '3px' }}>
                    Suspected acute asthma/COPD exacerbation. RR 30, SpO₂ 91% (2L).
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-nhs-blue"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    setShowNotifPopover(false);
                    onOpenPreAlertPanel();
                  }}
                >
                  Open Pre-Alert &amp; Assembly Panel
                </button>
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="topbar-icon-btn"
              aria-label="Prototype information and safety notice"
              onClick={() => {
                setShowHelpPopover((prev) => !prev);
                setShowNotifPopover(false);
              }}
            >
              <HelpCircle size={18} />
            </button>

            {showHelpPopover && (
              <div
                className="search-dropdown-popover"
                style={{ width: '360px', right: 0, left: 'auto', padding: '14px' }}
              >
                <div style={{ fontWeight: 700, fontSize: '14.5px', color: '#003087', marginBottom: '6px' }}>
                  RIND Embedded EPR Prototype
                </div>
                <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#212B32' }}>
                  Synthetic clinical demonstration only. No real NHS numbers or live Trust feeds are
                  connected in this frontend prototype.
                </p>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#4C6272' }}>
                  Clinical safety rule: RIND never infers medication administration from prescriptions
                  and marks unconfirmed care-home records explicitly.
                </p>
              </div>
            )}
          </div>

          <div className="topbar-user-pill" title="Logged in ED clinician">
            <User size={15} />
            <span>Dr Patel (ED Cons)</span>
            <ChevronDown size={14} />
          </div>
        </div>
      </header>

      {showDemoBar && (
        <div className="demo-stepper-bar" aria-label="2.5 minute live demonstration flow">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
            <span style={{ color: '#FFB81C' }}>2.5-Min Live Demo Flow:</span>
            <span style={{ color: '#AFC6DF', fontWeight: 400 }}>
              {activePatient ? `Active: ${activePatient.fullName}` : 'No patient opened yet'}
            </span>
          </div>
          <div className="demo-step-list">
            {[
              { step: 1, label: '1. Search Patient' },
              { step: 2, label: '2. Open Record & Pre-Alert' },
              { step: 3, label: `3. Assemble Journey${assemblyCompleted ? ' ✓' : ''}` },
              { step: 4, label: '4. RIND Summary & Med Rec' },
              { step: 5, label: '5. Verify & Audit' },
            ].map((item) => (
              <button
                key={item.step}
                type="button"
                className={`demo-step-btn ${demoStep === item.step ? 'active' : ''}`}
                onClick={() => onJumpDemoStep(item.step)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
