'use client';

import React, { useState } from 'react';
import {
  Activity,
  Ambulance,
  BarChart3,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  FlaskConical,
  FolderOpen,
  GitBranch,
  Home,
  LogOut,
  Pill,
  Search,
} from 'lucide-react';
import { EprMainSection, PatientRecordTab } from '@/types/rind';

interface EprSidebarProps {
  mainSection: EprMainSection;
  activeTab: PatientRecordTab;
  hasActivePatient: boolean;
  onSelectSection: (section: EprMainSection, tab?: PatientRecordTab) => void;
}

export function EprSidebar({
  mainSection,
  activeTab,
  hasActivePatient,
  onSelectSection,
}: EprSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const isRecordItemActive = (tab: PatientRecordTab) =>
    mainSection === 'record' && activeTab === tab;

  return (
    <aside className={`epr-sidebar ${collapsed ? 'collapsed' : ''}`} aria-label="EPR Navigation">
      <button
        type="button"
        className="sidebar-collapse-btn"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      <nav className="sidebar-nav">
        <button
          type="button"
          className={`sidebar-nav-item ${mainSection === 'search' ? 'active' : ''}`}
          onClick={() => onSelectSection('search')}
          title="Patient Search"
        >
          <Search size={18} className="sidebar-icon-only" />
          {!collapsed && <span>Patient Search</span>}
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${mainSection === 'prealerts' ? 'active' : ''}`}
          onClick={() => onSelectSection('prealerts')}
          title="Incoming Pre-alerts"
        >
          <Ambulance size={18} className="sidebar-icon-only" />
          {!collapsed && <span>Incoming Pre-alerts</span>}
          {!collapsed && <span className="sidebar-badge-alert">1</span>}
        </button>

        <div className="sidebar-divider" />

        <button
          type="button"
          className={`sidebar-nav-item ${isRecordItemActive('overview') ? 'active' : ''}`}
          onClick={() => onSelectSection('record', 'overview')}
          title="Patient Summary"
        >
          <Home size={18} className="sidebar-icon-only" />
          {!collapsed && <span>Patient Summary</span>}
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${isRecordItemActive('notes') ? 'active' : ''}`}
          onClick={() => onSelectSection('record', 'notes')}
          title="Clinical Notes"
        >
          <FileText size={18} className="sidebar-icon-only" />
          {!collapsed && <span>Clinical Notes</span>}
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${isRecordItemActive('observations') ? 'active' : ''}`}
          onClick={() => onSelectSection('record', 'observations')}
          title="Observations"
        >
          <Activity size={18} className="sidebar-icon-only" />
          {!collapsed && <span>Observations</span>}
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${isRecordItemActive('results') ? 'active' : ''}`}
          onClick={() => onSelectSection('record', 'results')}
          title="Results"
        >
          <FlaskConical size={18} className="sidebar-icon-only" />
          {!collapsed && <span>Results</span>}
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${isRecordItemActive('medications') ? 'active' : ''}`}
          onClick={() => onSelectSection('record', 'medications')}
          title="Medications"
        >
          <Pill size={18} className="sidebar-icon-only" />
          {!collapsed && <span>Medications</span>}
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${isRecordItemActive('encounters') ? 'active' : ''}`}
          onClick={() => onSelectSection('record', 'encounters')}
          title="Encounters & Orders"
        >
          <ClipboardList size={18} className="sidebar-icon-only" />
          {!collapsed && <span>Orders &amp; Encounters</span>}
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${
            mainSection === 'documents' || isRecordItemActive('documents') ? 'active' : ''
          }`}
          onClick={() => onSelectSection(hasActivePatient ? 'record' : 'documents', 'documents')}
          title="Source Documents"
        >
          <FolderOpen size={18} className="sidebar-icon-only" />
          {!collapsed && <span>Documents</span>}
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${isRecordItemActive('rind') ? 'active' : ''}`}
          onClick={() => onSelectSection('record', 'rind')}
          title="RIND – Acute Journey"
          style={{
            marginTop: '4px',
            background: isRecordItemActive('rind') ? undefined : 'rgba(0, 94, 184, 0.25)',
          }}
        >
          <GitBranch size={18} className="sidebar-icon-only" />
          {!collapsed && <span>RIND – Acute Journey</span>}
        </button>

        <div className="sidebar-divider" />

        <button
          type="button"
          className={`sidebar-nav-item ${isRecordItemActive('allergies') ? 'active' : ''}`}
          onClick={() => onSelectSection('record', 'allergies')}
          title="Allergies & Alerts"
        >
          <LogOut size={18} className="sidebar-icon-only" />
          {!collapsed && <span>Discharge / Alerts</span>}
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${mainSection === 'analytics' ? 'active' : ''}`}
          onClick={() => onSelectSection('analytics')}
          title="Pilot Metrics & Architecture"
        >
          <BarChart3 size={18} className="sidebar-icon-only" />
          {!collapsed && <span>Pilot Metrics &amp; IG</span>}
        </button>

        <button
          type="button"
          className="sidebar-nav-item"
          onClick={() => onSelectSection('record', 'rind')}
          title="Verification Tasks"
        >
          <CheckSquare size={18} className="sidebar-icon-only" />
          {!collapsed && <span>Tasks</span>}
        </button>
      </nav>

      {!collapsed && (
        <div className="sidebar-footer-note">
          Synthetic prototype · No live NHS Spine connectivity · Decision support only
        </div>
      )}
    </aside>
  );
}
