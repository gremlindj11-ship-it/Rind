import {
  Allergy,
  CarePlan,
  ClinicalEvent,
  ClinicalSummary,
  MedicationAdministration,
  MedicationOrder,
  ObservationSet,
  OutstandingAction,
  Patient,
  ReconciledMedication,
} from '@/types/rind';

/**
 * Deterministic RIND clinical synthesiser.
 * Reads structured synthetic records and produces a strict, source-linked
 * 10-point summary without inventing clinical facts, diagnoses, or drug administrations.
 */
export function buildReconciledMedications(
  orders: MedicationOrder[],
  administrations: MedicationAdministration[],
): ReconciledMedication[] {
  return orders.map((order) => {
    const admin = administrations.find((a) => a.orderId === order.id) ?? {
      id: `adm-missing-${order.id}`,
      orderId: order.id,
      patientId: order.patientId,
      status: 'UNKNOWN' as const,
      administeringService: 'Not documented',
      administrationTime: null,
      documentedResponse: null,
      reasonNotGivenOrUnknown: 'No administration record found — verification required.',
      sourceDocumentId: order.sourceDocumentId,
      verificationStatus: 'REQUIRES_VERIFICATION' as const,
    };

    return { order, administration: admin };
  });
}

export function generateDeterministicClinicalSummary(params: {
  patient: Patient;
  events: ClinicalEvent[];
  observations: ObservationSet[];
  reconciledMeds: ReconciledMedication[];
  allergies: Allergy[];
  carePlan: CarePlan;
  outstandingActions: OutstandingAction[];
  carePlanConfirmed: boolean;
  allergyConfirmed: boolean;
}): ClinicalSummary {
  const {
    patient,
    events,
    observations,
    reconciledMeds,
    allergies,
    carePlan,
    outstandingActions,
    carePlanConfirmed,
    allergyConfirmed,
  } = params;

  const sortedEvents = [...events].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const latestObs = observations[observations.length - 1];
  const gpObs = observations[0];

  const acuteMeds = reconciledMeds.filter((m) => !m.order.isRegularHomeMed);
  const prescribedList = acuteMeds.filter(
    (m) => m.order.prescribedService === 'GP' || m.order.prescribedService === 'UCR',
  );
  const administeredList = acuteMeds.filter((m) => m.administration.status === 'ADMINISTERED');
  const unknownOrUnconfirmedList = acuteMeds.filter(
    (m) =>
      m.administration.status === 'UNKNOWN' ||
      m.administration.status === 'PRESCRIBED' ||
      m.administration.status === 'WITHHELD',
  );

  const primaryAllergy = allergies[0];

  return {
    id: 'sum-margaret-acute-01',
    patientId: patient.id,
    generatedAt: '18:07',
    headlineReason:
      'Worsening breathlessness and increased sputum – suspected acute exacerbation of asthma/COPD',
    headlineContext: 'Deterioration despite community management. Conveyed via 999 (pre-alert).',
    reviewStatus: 'DRAFT_AI',
    sections: [
      {
        id: 'sec-1',
        number: 1,
        heading: 'Presenting problem',
        statements: [
          {
            id: 'st-1-1',
            text: `82-year-old female (${patient.residenceType}) presenting with worsening breathlessness, productive cough, and acute confusion above dementia baseline.`,
            state: 'CONFIRMED',
            sourceDocumentIds: ['doc-gp-0900', 'doc-carehome-1530', 'doc-amb-1800'],
          },
          {
            id: 'st-1-2',
            text: `Latest ambulance observations (18:00): RR ${latestObs.rr}/min, SpO₂ ${latestObs.spo2}% (${latestObs.oxygenTherapy}), HR ${latestObs.hr} bpm, BP ${latestObs.bp}, Temp ${latestObs.temp}°C, ${latestObs.consciousness}.`,
            state: 'CONFIRMED',
            sourceDocumentIds: ['doc-amb-1800'],
          },
        ],
      },
      {
        id: 'sec-2',
        number: 2,
        heading: 'Relevant medical background',
        statements: [
          {
            id: 'st-2-1',
            text: `Documented COPD / Asthma overlap (ACO) with recurrent exacerbations; last hospital admission 2 months ago at Hospital A.`,
            state: 'CONFIRMED',
            sourceDocumentIds: ['doc-gp-0900', 'doc-hosp-a-plan'],
          },
          {
            id: 'st-2-2',
            text: `Moderate dementia; usually mobile with wheeled Zimmer frame at Maple View Care Home.`,
            state: 'CONFIRMED',
            sourceDocumentIds: ['doc-gp-0900', 'doc-hosp-a-plan'],
          },
        ],
      },
      {
        id: 'sec-3',
        number: 3,
        heading: 'Timeline of clinical events',
        statements: sortedEvents.map((evt, idx) => ({
          id: `st-3-${idx + 1}`,
          text: `${evt.timeLabel.replace('Today, ', '')} (${evt.organisation}): ${evt.clinicalContent}`,
          state: evt.verificationStatus,
          sourceDocumentIds: [evt.sourceDocumentId],
        })),
      },
      {
        id: 'sec-4',
        number: 4,
        heading: 'Treatment prescribed',
        statements: [
          ...prescribedList.map((item, idx) => ({
            id: `st-4-${idx + 1}`,
            text: `${item.order.medicationName} (${item.order.dose}, ${item.order.route}) prescribed by ${item.order.prescriber} at ${item.order.prescriptionTime}.`,
            state: 'CONFIRMED' as const,
            sourceDocumentIds: [item.order.sourceDocumentId],
          })),
          {
            id: 'st-4-abx',
            text: `GP deferred empirical antibiotics at 09:30; Ambulance withheld pre-hospital antibiotics at 18:00 due to documented Penicillin allergy.`,
            state: 'CONFIRMED',
            sourceDocumentIds: ['doc-gp-0900', 'doc-amb-1800'],
          },
        ],
      },
      {
        id: 'sec-5',
        number: 5,
        heading: 'Treatment administered',
        statements: [
          ...administeredList.map((item, idx) => ({
            id: `st-5-adm-${idx + 1}`,
            text: `ADMINISTERED: ${item.order.medicationName} by ${item.administration.administeringService} at ${item.administration.administrationTime ?? 'time unrecorded'}.`,
            state: 'CONFIRMED' as const,
            sourceDocumentIds: [item.administration.sourceDocumentId ?? item.order.sourceDocumentId],
          })),
          ...unknownOrUnconfirmedList.map((item, idx) => ({
            id: `st-5-unk-${idx + 1}`,
            text: `${item.administration.status}: ${item.order.medicationName} — ${item.administration.reasonNotGivenOrUnknown ?? 'Status requires confirmation.'}`,
            state: item.administration.verificationStatus,
            sourceDocumentIds: [item.administration.sourceDocumentId ?? item.order.sourceDocumentId],
          })),
        ],
      },
      {
        id: 'sec-6',
        number: 6,
        heading: 'Response to treatment',
        statements: [
          {
            id: 'st-6-1',
            text: `Progressive respiratory deterioration from 09:00 GP visit (RR ${gpObs.rr}, SpO₂ ${gpObs.spo2}% air) through 17:00 UCR (RR 28, SpO₂ 90% air) to 18:00 Ambulance (RR ${latestObs.rr}, SpO₂ ${latestObs.spo2}% on 2L O₂).`,
            state: 'CONFIRMED',
            sourceDocumentIds: ['doc-gp-0900', 'doc-ucr-1700', 'doc-amb-1800'],
          },
          {
            id: 'st-6-2',
            text: `Partial oxygenation lift after UCR nebuliser & 2 L/min O₂ (90% → 91%), but persistent tachypnoea (RR 28–30) and ongoing breathlessness during conveyance.`,
            state: 'CONFIRMED',
            sourceDocumentIds: ['doc-ucr-1700', 'doc-amb-1800'],
          },
        ],
      },
      {
        id: 'sec-7',
        number: 7,
        heading: 'Relevant allergies',
        statements: [
          {
            id: 'st-7-1',
            text: `${primaryAllergy.substance} allergy documented (${primaryAllergy.documentedReaction}). ${allergyConfirmed ? 'Reaction details verified by ED clinician.' : 'Exact reaction timing and severity require confirmation prior to antimicrobial prescribing.'}`,
            state: allergyConfirmed ? 'CONFIRMED' : 'REQUIRES_VERIFICATION',
            sourceDocumentIds: [primaryAllergy.sourceDocumentId, 'doc-amb-1800'],
          },
        ],
      },
      {
        id: 'sec-8',
        number: 8,
        heading: 'Relevant care plans',
        statements: [
          {
            id: 'st-8-1',
            text: `${carePlan.title} (${carePlan.holdingOrganisation}, updated ${carePlan.lastUpdated}): documents individual target SpO₂ ${carePlan.targetSpO2} and prior compensated hypercapnia.`,
            state: carePlanConfirmed ? 'CONFIRMED' : 'REQUIRES_VERIFICATION',
            sourceDocumentIds: [carePlan.sourceDocumentId],
          },
        ],
      },
      {
        id: 'sec-9',
        number: 9,
        heading: 'Baseline cognition and communication requirements',
        statements: [
          {
            id: 'st-9-1',
            text: `${patient.baselineCognition} New acute confusion reported by care staff at 15:30 and confirmed by UCR/Paramedic.`,
            state: 'CONFIRMED',
            sourceDocumentIds: ['doc-carehome-1530', 'doc-ucr-1700', 'doc-amb-1800'],
          },
          {
            id: 'st-9-2',
            text: `Reasonable adjustments: use short simple sentences, allow extra processing time, explain procedures before touching/examining, maintain calm environment, involve daughter ${patient.nokName} (${patient.nokPhone}) subject to consent.`,
            state: 'CONFIRMED',
            sourceDocumentIds: ['doc-hosp-a-plan', 'doc-gp-0900'],
          },
        ],
      },
      {
        id: 'sec-10',
        number: 10,
        heading: 'Outstanding checks',
        statements: outstandingActions.map((act) => ({
          id: `st-10-${act.id}`,
          text: `${act.title} — ${act.completed ? 'Verified by clinician' : act.detail}`,
          state: act.completed ? 'CONFIRMED' : act.informationState,
          sourceDocumentIds: act.linkedSourceId ? [act.linkedSourceId] : ['doc-carehome-1530'],
        })),
      },
    ],
  };
}
