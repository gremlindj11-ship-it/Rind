'use client';

import React from 'react';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ClipboardList,
  HelpCircle,
  MinusCircle,
  ShieldAlert,
} from 'lucide-react';
import { InformationState, MedicationStatus, ServiceOrigin } from '@/types/rind';

export function RindWordmark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const isSm = size === 'sm';
  return (
    <span
      className="rind-wordmark"
      style={{ fontSize: isSm ? '18px' : '26px', gap: isSm ? '2px' : '3px' }}
      aria-label="RIND"
    >
      <span>RIND</span>
      <svg
        width={isSm ? 18 : 24}
        height={isSm ? 18 : 24}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M5 6.5C8.5 9.2 8.5 14.8 5 17.5"
          stroke="#005EB8"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M11 4C16 8.2 16 15.8 11 20"
          stroke="#5A3A9E"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function InformationStateBadge({ state }: { state: InformationState }) {
  if (state === 'CONFIRMED') {
    return (
      <span className="status-pill-green" style={{ padding: '2px 8px', fontSize: '12px' }}>
        <CheckCircle2 size={13} aria-hidden="true" />
        CONFIRMED
      </span>
    );
  }
  if (state === 'REQUIRES_VERIFICATION') {
    return (
      <span className="status-pill-amber" style={{ padding: '2px 8px', fontSize: '12px' }}>
        <AlertTriangle size={13} aria-hidden="true" />
        REQUIRES VERIFICATION
      </span>
    );
  }
  return (
    <span className="status-pill-grey" style={{ padding: '2px 8px', fontSize: '12px' }}>
      <MinusCircle size={13} aria-hidden="true" />
      NOT AVAILABLE
    </span>
  );
}

export function MedStatusBadge({
  status,
  detailNote,
}: {
  status: MedicationStatus;
  detailNote?: string;
}) {
  switch (status) {
    case 'ADMINISTERED':
      return (
        <span className="status-pill-green" style={{ padding: '3px 9px', fontSize: '12.5px' }}>
          <CheckCircle2 size={14} aria-hidden="true" />
          ADMINISTERED{detailNote ? ` (${detailNote})` : ''}
        </span>
      );
    case 'PRESCRIBED':
      return (
        <span className="status-pill-blue" style={{ padding: '3px 9px', fontSize: '12.5px' }}>
          <ClipboardList size={14} aria-hidden="true" />
          PRESCRIBED (admin unconfirmed)
        </span>
      );
    case 'UNKNOWN':
      return (
        <span className="status-pill-amber" style={{ padding: '3px 9px', fontSize: '12.5px' }}>
          <HelpCircle size={14} aria-hidden="true" />
          UNKNOWN — verification required
        </span>
      );
    case 'WITHHELD':
      return (
        <span className="status-pill-red" style={{ padding: '3px 9px', fontSize: '12.5px' }}>
          <ShieldAlert size={14} aria-hidden="true" />
          WITHHELD{detailNote ? ` (${detailNote})` : ''}
        </span>
      );
    case 'NOT_ADMINISTERED':
      return (
        <span className="status-pill-grey" style={{ padding: '3px 9px', fontSize: '12.5px' }}>
          <Ban size={14} aria-hidden="true" />
          NOT ADMINISTERED
        </span>
      );
    case 'DISCONTINUED':
      return (
        <span className="status-pill-grey" style={{ padding: '3px 9px', fontSize: '12.5px' }}>
          <MinusCircle size={14} aria-hidden="true" />
          DISCONTINUED
        </span>
      );
  }
}

export function ServiceOriginTag({ service }: { service: ServiceOrigin }) {
  const styles: Record<ServiceOrigin, { bg: string; color: string; label: string }> = {
    GP: { bg: '#E6F4EC', color: '#00662F', label: 'Primary Care (GP)' },
    CareHome: { bg: '#FFF7E0', color: '#6E4700', label: 'Care Home' },
    UCR: { bg: '#F2EDF9', color: '#5A3A9E', label: 'Community UCR' },
    Ambulance: { bg: '#EBF3FA', color: '#005EB8', label: 'Ambulance (999)' },
    ED: { bg: '#E5ECF4', color: '#003087', label: 'Hospital B (ED)' },
    HospitalA: { bg: '#EDF1F4', color: '#212B32', label: 'Hospital A Specialist' },
  };
  const cfg = styles[service];
  return (
    <span
      style={{
        display: 'inline-block',
        background: cfg.bg,
        color: cfg.color,
        fontSize: '12px',
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: '4px',
        border: `1px solid ${cfg.color}25`,
      }}
    >
      {cfg.label}
    </span>
  );
}
