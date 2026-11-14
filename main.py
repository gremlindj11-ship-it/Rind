"""
RIND — Acute Pathway Intelligence & Clinical Guardrail Backend
FastAPI backend enforcing a 3-Layer Anti-Hallucination & Clinical Safety Gate
around Anthropic Claude (model="claude-sonnet-5-5").
"""

from __future__ import annotations

import logging
import os
import re
from pathlib import Path
from typing import Dict, List, Literal, Optional, Tuple

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

load_dotenv()

logger = logging.getLogger("rind.guardrail")
logging.basicConfig(level=logging.INFO)

BASE_DIR = Path(__file__).resolve().parent
INDEX_HTML_PATH = BASE_DIR / "index.html"
CLAUDE_MODEL = "claude-sonnet-5-5"

ConfidenceLevel = Literal["HIGH", "MEDIUM", "LOW"]
AdminStatus = Literal[
    "ADMINISTERED",
    "PRESCRIBED_ONLY",
    "WITHHELD_OR_NOT_GIVEN",
    "INSUFFICIENT_DATA",
]


# ---------------------------------------------------------------------------
# Request & Source Document Models
# ---------------------------------------------------------------------------


class SourceDocumentInput(BaseModel):
    doc_id: str
    timestamp: str
    service: str
    role: str = ""
    raw_text: str


class SummariseRequest(BaseModel):
    patient_id: str
    patient_name: Optional[str] = None
    raw_notes_text: Optional[str] = None
    documents: Optional[List[SourceDocumentInput]] = None
    simulate_hallucination: bool = False


# ---------------------------------------------------------------------------
# Layer 2: Structured Output Models sent to Claude (strict JSON Schema)
# Kept separate from verification flags so only Python Layer 3 sets them.
# ---------------------------------------------------------------------------


class LLMVerifiedClaim(BaseModel):
    claim_text: str = Field(
        description=(
            "Concise factual clinical statement strictly grounded in the note, "
            "or 'INSUFFICIENT_DATA' if missing or ambiguous."
        )
    )
    exact_source_quote: str = Field(
        description=(
            "Verbatim, character-for-character substring copied directly from "
            "the source document's raw_text (or 'INSUFFICIENT_DATA' if claim_text is INSUFFICIENT_DATA)."
        )
    )
    source_doc_id: str = Field(
        description="Exact doc_id of the source document containing exact_source_quote."
    )
    confidence: ConfidenceLevel
    confidence_reason: str = Field(
        description="Brief explanation of why confidence is HIGH, MEDIUM, or LOW."
    )


class LLMJourneyEventClaim(BaseModel):
    timestamp: str
    service: str
    claim_text: str
    treatment_note: str
    exact_source_quote: str
    source_doc_id: str
    confidence: ConfidenceLevel
    confidence_reason: str


class LLMMedicationClaim(BaseModel):
    medication_name: str
    prescribed_by: str
    time: str
    administration_status: AdminStatus
    claim_text: str
    exact_source_quote: str
    source_doc_id: str
    confidence: ConfidenceLevel
    confidence_reason: str


class ClaudeExtractionPayload(BaseModel):
    reason_for_attendance: LLMVerifiedClaim
    allergies: List[LLMVerifiedClaim]
    journey_events: List[LLMJourneyEventClaim]
    medications: List[LLMMedicationClaim]
    key_clinical_info: List[LLMVerifiedClaim]
    reasonable_adjustments: List[LLMVerifiedClaim]
    open_loops: List[LLMVerifiedClaim]


# ---------------------------------------------------------------------------
# API Response Models (after Deterministic Python Verification Gate)
# ---------------------------------------------------------------------------


class VerifiedClaim(BaseModel):
    claim_text: str
    exact_source_quote: str
    source_doc_id: str
    confidence: ConfidenceLevel
    confidence_reason: str
    verification_passed: bool


class JourneyEventClaim(BaseModel):
    timestamp: str
    service: str
    claim_text: str
    treatment_note: str
    exact_source_quote: str
    source_doc_id: str
    confidence: ConfidenceLevel
    confidence_reason: str
    verification_passed: bool


class MedicationClaim(BaseModel):
    medication_name: str
    prescribed_by: str
    time: str
    administration_status: AdminStatus
    claim_text: str
    exact_source_quote: str
    source_doc_id: str
    confidence: ConfidenceLevel
    confidence_reason: str
    verification_passed: bool


class SummariseResponse(BaseModel):
    patient_id: str
    patient_name: str
    model_used: str
    generation_mode: Literal[
        "CLAUDE_API",
        "CLAUDE_API_SIMULATED_HALLUCINATION",
        "DETERMINISTIC_FALLBACK",
        "DETERMINISTIC_SIMULATED_HALLUCINATION",
    ]
    reason_for_attendance: VerifiedClaim
    allergies: List[VerifiedClaim]
    journey_events: List[JourneyEventClaim]
    medications: List[MedicationClaim]
    key_clinical_info: List[VerifiedClaim]
    reasonable_adjustments: List[VerifiedClaim]
    open_loops: List[VerifiedClaim]
    clinical_safety_halt: bool
    safety_halt_reasons: List[str]
    requires_clinician_review: bool
    low_confidence_reasons: List[str]
    quarantined_claims: List[dict]
    verification_stats: dict
    source_documents: List[SourceDocumentInput]
    notice: Optional[str] = None


# ---------------------------------------------------------------------------
# Layer 1: Strict Grounding System Prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are an NHS Clinical Data Extractor for RIND (Acute Pathway Intelligence).
Your outputs are read by emergency department clinicians at the point of care. Zero hallucinations and 100% factual fidelity to the source documents are mandatory.

STRICT GROUNDING RULES:
1. Extract ONLY facts explicitly written in the provided source documents.
2. NEVER infer, guess, extrapolate, or assume drug administration from a prescription or care plan.
   - Only set administration_status="ADMINISTERED" when the source text explicitly records the drug/oxygen as given/administered (e.g., "Given ...", "administered", "started").
   - If a medication was "Prescribed" and later notes state it was not confirmed / unclear / unconfirmed, set administration_status="INSUFFICIENT_DATA" (or "PRESCRIBED_ONLY" if explicitly awaiting administration) and set confidence="LOW" (or "MEDIUM" if dose prescribed is certain but administration is explicitly unconfirmed), explaining the gap in confidence_reason.
   - If a medication was deferred, held, or withheld ("not given", "avoid", "held", "deferred"), set administration_status="WITHHELD_OR_NOT_GIVEN".
3. VERBATIM SUBSTRING PROVENANCE (CRITICAL):
   - Every single item MUST include `exact_source_quote`: a verbatim, character-for-character substring copied directly from the `raw_text` of ONE document, without ellipses (...), paraphrasing, spelling corrections, or joining separate sentences.
   - Set `source_doc_id` to the exact `doc_id` of that source document.
   - Deterministic software will run `normalize(exact_source_quote) in normalize(raw_text)`. ANY altered character or hallucinated quote will HALT output with a Clinical Safety Stop alert.
4. MISSING OR AMBIGUOUS DATA:
   - If critical information (Allergies, Reason for Attendance, Medications, Escalation Status, Oxygen Target) is missing or ambiguous, set `claim_text="INSUFFICIENT_DATA"`, `exact_source_quote="INSUFFICIENT_DATA"`, `source_doc_id="NONE"`, and `confidence="LOW"` with a clear `confidence_reason`.
5. Include all critical domains:
   - `reason_for_attendance`: Latest/presenting emergency reason.
   - `allergies`: Every recorded allergy statement (including NKDA or deferred/incomplete allergy details). If details need verification or are conflicting, set confidence accordingly.
   - `journey_events`: Chronological summary across services (GP, Care home, UCR, Ambulance, ED/ICU/Ward/Hospital A).
   - `medications`: Every current/recent medication or intervention mentioned (distinguishing prescribed vs administered vs unconfirmed vs held/not given).
   - `key_clinical_info`: Relevant diagnoses, oxygen target, baseline function/cognition, recent admissions, escalation ceiling.
   - `reasonable_adjustments`: Dementia/communication/environmental adjustments and main NOK contact.
   - `open_loops`: Unconfirmed doses, deferred decisions (e.g., antibiotic choice), missing documents/charts, pending results/referrals, unverified allergy reactions, unconfirmed escalation wishes.
"""


# ---------------------------------------------------------------------------
# Parsing Raw Rind Notes Format (`D1 09:00 | Role | text`)
# ---------------------------------------------------------------------------

LINE_RE = re.compile(r"^\s*D(\d+)\s+(\d{1,2}):(\d{2})\s*\|\s*([^|]+?)\s*\|\s*(.+)$")


def infer_service_name(who: str, prev_svc: str = "Clinical Note") -> str:
    w = who.strip()
    if re.search(r"paramedic|ambulance", w, re.I):
        return "Ambulance (ePCR)"
    if re.match(r"^ED\b", w, re.I):
        return "ED"
    if re.match(r"^ICU\b", w, re.I):
        return "ICU"
    if re.match(r"^care home", w, re.I):
        return "Care Home"
    if re.match(r"^UCR", w, re.I):
        return "UCR"
    if re.match(r"^hospital a", w, re.I):
        return "Hospital A"
    if re.match(r"^(theatre|anaes)", w, re.I):
        return "Theatre"
    if re.match(r"^rehab", w, re.I):
        return "Rehab"
    if re.match(r"^Ward\b", w, re.I):
        return "Ward"
    if re.search(r"community|district|home care", w, re.I):
        return "Community Nursing"
    if re.match(r"^GP\b", w, re.I):
        return "GP"
    if re.match(r"^Nurse\b|^Physio\b|^Pharmacist\b|^Dietitian\b|^OT\b", w, re.I):
        return prev_svc
    return w or prev_svc


def doc_prefix_for_service(svc: str) -> str:
    mapping = {
        "GP": "GP_Note",
        "Care Home": "CareHome_Log",
        "UCR": "UCR_Note",
        "Ambulance (ePCR)": "Ambulance_ePCR",
        "Hospital A": "HospitalA_Plan",
        "ED": "ED_Note",
        "ICU": "ICU_Note",
        "Ward": "Ward_Note",
        "Theatre": "Theatre_Note",
        "Rehab": "Rehab_Note",
        "Community Nursing": "Community_Note",
    }
    return mapping.get(svc, re.sub(r"[^A-Za-z0-9]+", "_", svc).strip("_") or "Note")


def parse_raw_notes_to_documents(raw_notes_text: str) -> List[SourceDocumentInput]:
    docs: List[SourceDocumentInput] = []
    seen_ids: Dict[str, int] = {}
    prev_svc = "Clinical Note"

    for line in (raw_notes_text or "").splitlines():
        line_s = line.strip()
        if not line_s:
            continue
        match = LINE_RE.match(line_s)
        if match:
            day = match.group(1)
            hh = match.group(2).zfill(2)
            mm = match.group(3)
            role = match.group(4).strip()
            body = match.group(5).strip()
            svc = infer_service_name(role, prev_svc)
            prev_svc = svc
            base_id = f"{doc_prefix_for_service(svc)}_D{day}_{hh}{mm}"
            count = seen_ids.get(base_id, 0) + 1
            seen_ids[base_id] = count
            doc_id = base_id if count == 1 else f"{base_id}_{count}"
            docs.append(
                SourceDocumentInput(
                    doc_id=doc_id,
                    timestamp=f"Day {day} {hh}:{mm}",
                    service=svc,
                    role=role,
                    raw_text=body,
                )
            )
        else:
            count = seen_ids.get("Unformatted_Note", 0) + 1
            seen_ids["Unformatted_Note"] = count
            docs.append(
                SourceDocumentInput(
                    doc_id=f"Unformatted_Note_{count}",
                    timestamp="Unspecified",
                    service=prev_svc,
                    role="Unformatted entry",
                    raw_text=line_s,
                )
            )
    return docs


# ---------------------------------------------------------------------------
# Deterministic Fallback Extractor (only used when ANTHROPIC_API_KEY is absent
# or API fails; always selects real verbatim quotes and still goes through
# Layer 3 verification + confidence gate)
# ---------------------------------------------------------------------------


def _first_matching_sentence(
    docs: List[SourceDocumentInput], pattern: re.Pattern
) -> Optional[Tuple[SourceDocumentInput, str]]:
    for doc in docs:
        for clause in re.split(r"(?<=[.;])\s+", doc.raw_text):
            c = clause.strip()
            if c and pattern.search(c):
                return doc, c
    return None


def _all_matching_sentences(
    docs: List[SourceDocumentInput], pattern: re.Pattern
) -> List[Tuple[SourceDocumentInput, str]]:
    hits: List[Tuple[SourceDocumentInput, str]] = []
    for doc in docs:
        for clause in re.split(r"(?<=[.;])\s+", doc.raw_text):
            c = clause.strip()
            if c and pattern.search(c):
                hits.append((doc, c))
    return hits


def build_deterministic_extraction(
    docs: List[SourceDocumentInput],
) -> ClaudeExtractionPayload:
    if not docs:
        insufficient = LLMVerifiedClaim(
            claim_text="INSUFFICIENT_DATA",
            exact_source_quote="INSUFFICIENT_DATA",
            source_doc_id="NONE",
            confidence="LOW",
            confidence_reason="No clinical source documents were provided.",
        )
        return ClaudeExtractionPayload(
            reason_for_attendance=insufficient,
            allergies=[insufficient],
            journey_events=[],
            medications=[],
            key_clinical_info=[insufficient],
            reasonable_adjustments=[],
            open_loops=[],
        )

    # Reason for attendance: pre-alert, ED assessment, or latest symptomatic note
    reason_hit = (
        _first_matching_sentence(
            list(reversed(docs)),
            re.compile(r"Pre-alert|suspected exacerbation|BIBA|fall|admission|Dx:", re.I),
        )
        or _first_matching_sentence(
            docs, re.compile(r"breathlessness|pneumonia|fracture|chest|confused", re.I)
        )
    )
    if reason_hit:
        rdoc, rquote = reason_hit
        reason = LLMVerifiedClaim(
            claim_text=rquote.rstrip("."),
            exact_source_quote=rquote,
            source_doc_id=rdoc.doc_id,
            confidence="HIGH",
            confidence_reason="Explicitly documented presenting problem / pre-alert in clinical record.",
        )
    else:
        reason = LLMVerifiedClaim(
            claim_text="INSUFFICIENT_DATA",
            exact_source_quote="INSUFFICIENT_DATA",
            source_doc_id="NONE",
            confidence="LOW",
            confidence_reason="No explicit presenting complaint or pre-alert reason found.",
        )

    # Allergies
    allergy_hits = _all_matching_sentences(
        docs, re.compile(r"\b(allerg\w*|NKDA|avoid penicillins?)\b", re.I)
    )
    allergies: List[LLMVerifiedClaim] = []
    if allergy_hits:
        has_nkda = any(re.search(r"\bNKDA\b|no known", q, re.I) for _, q in allergy_hits)
        has_pos = any(
            re.search(r"allerg|avoid", q, re.I)
            and not re.search(r"\bNKDA\b|no known", q, re.I)
            for _, q in allergy_hits
        )
        seen_quotes = set()
        for adoc, aquote in allergy_hits[:4]:
            if aquote in seen_quotes:
                continue
            seen_quotes.add(aquote)
            needs_check = bool(
                re.search(r"check exact timing|no detail recorded", aquote, re.I)
                or (has_nkda and has_pos)
            )
            allergies.append(
                LLMVerifiedClaim(
                    claim_text=aquote.rstrip("."),
                    exact_source_quote=aquote,
                    source_doc_id=adoc.doc_id,
                    confidence="MEDIUM" if needs_check else "HIGH",
                    confidence_reason=(
                        "Allergy documented, but reaction timing/details require verification."
                        if needs_check
                        else "Allergy status explicitly documented in source note."
                    ),
                )
            )
    else:
        allergies.append(
            LLMVerifiedClaim(
                claim_text="INSUFFICIENT_DATA",
                exact_source_quote="INSUFFICIENT_DATA",
                source_doc_id="NONE",
                confidence="LOW",
                confidence_reason="No allergy or NKDA entry found in provided records.",
            )
        )

    # Journey events (up to 10 key entries across services)
    journey_events: List[LLMJourneyEventClaim] = []
    selected_docs = docs if len(docs) <= 10 else [docs[0], *docs[1:-1: max(1, (len(docs) - 2) // 7)], docs[-1]]
    for doc in selected_docs[:10]:
        sents = [s.strip() for s in re.split(r"(?<=[.])\s+", doc.raw_text) if s.strip()]
        quote = sents[0] if sents else doc.raw_text
        if len(quote) > 220:
            quote = doc.raw_text[:220]
        # Ensure quote stays strictly verbatim in doc.raw_text
        if quote not in doc.raw_text:
            quote = doc.raw_text
        tx_hits = [
            s
            for s in sents
            if re.search(
                r"\b(given|prescribed|nebulis|oxygen|prednisolone|salbutamol|ipratropium|morphine|bisoprolol|ramipril|apixaban|metformin|enoxaparin|tazocin|co-amox|abx)\b",
                s,
                re.I,
            )
        ]
        journey_events.append(
            LLMJourneyEventClaim(
                timestamp=doc.timestamp,
                service=f"{doc.service} ({doc.role})" if doc.role and doc.role != doc.service else doc.service,
                claim_text=quote.rstrip("."),
                treatment_note="; ".join(tx_hits)[:180] if tx_hits else "Assessment / clinical update documented",
                exact_source_quote=quote,
                source_doc_id=doc.doc_id,
                confidence="HIGH",
                confidence_reason="Verbatim clinical entry from chronological source log.",
            )
        )

    # Medications & treatments
    med_specs = [
        ("Prednisolone 40 mg PO", re.compile(r"\bprednisolone\b", re.I)),
        ("Salbutamol nebuliser / PRN", re.compile(r"\bsalbutamol\b", re.I)),
        ("Ipratropium 500 mcg nebuliser", re.compile(r"\bipratropium\b", re.I)),
        ("Controlled Oxygen", re.compile(r"\boxygen\b|\bnasal O2\b", re.I)),
        ("Antibiotics", re.compile(r"\bantibiotics?\b|\babx\b|\bco-amox\w*\b|\btazocin\b|\bcefuroxime\b|\bdoxycycline\b", re.I)),
        ("Apixaban", re.compile(r"\bapixaban\b", re.I)),
        ("Bisoprolol", re.compile(r"\bbisoprolol\b", re.I)),
        ("Ramipril", re.compile(r"\bramipril\b", re.I)),
        ("Metformin", re.compile(r"\bmetformin\b", re.I)),
        ("Enoxaparin", re.compile(r"\benoxaparin\b", re.I)),
        ("Morphine", re.compile(r"\bmorphine\b", re.I)),
    ]
    medications: List[LLMMedicationClaim] = []
    for med_label, pat in med_specs:
        hits = _all_matching_sentences(docs, pat)
        if not hits:
            continue
        last_doc, last_quote = hits[-1]
        # Walk hits chronologically to see whether administration is confirmed, withheld, or explicitly unconfirmed
        latest_unconfirmed: Optional[Tuple[SourceDocumentInput, str]] = None
        latest_confirmed: Optional[Tuple[SourceDocumentInput, str]] = None
        for hdoc, hq in hits:
            if re.search(r"\b(not been confirmed|unable to confirm|unconfirmed)\b", hq, re.I):
                latest_unconfirmed = (hdoc, hq)
            elif re.search(r"\b(given|administered|restarted|signed on the paper chart)\b", hq, re.I) and not re.search(
                r"\b(not given|whether)\b", hq, re.I
            ):
                latest_confirmed = (hdoc, hq)
                latest_unconfirmed = None

        if latest_unconfirmed is not None:
            status: AdminStatus = "INSUFFICIENT_DATA"
            conf: ConfidenceLevel = "LOW"
            last_doc, last_quote = latest_unconfirmed
            reason_txt = (
                f"{med_label} was prescribed, but notes explicitly state administration could not be confirmed."
            )
        elif re.search(r"\b(deferred|not given|held|avoid|stopped)\b", last_quote, re.I):
            status = "WITHHELD_OR_NOT_GIVEN"
            conf = "HIGH"
            reason_txt = "Explicitly documented as deferred, held, or not given in source notes."
        elif latest_confirmed is not None or re.search(
            r"\b(given|administered|started|restarted|continues?|continued)\b", last_quote, re.I
        ):
            status = "ADMINISTERED"
            conf = "HIGH"
            if latest_confirmed is not None:
                last_doc, last_quote = latest_confirmed
            reason_txt = "Explicitly documented as administered / given / active in source note."
        elif any(re.search(r"\bprescribed\b", q, re.I) for _, q in hits):
            status = "PRESCRIBED_ONLY"
            conf = "MEDIUM"
            reason_txt = "Prescription documented without separate MAR administration timestamp."
        else:
            status = "INSUFFICIENT_DATA"
            conf = "LOW"
            reason_txt = "Mentioned in notes without clear administration confirmation."

        medications.append(
            LLMMedicationClaim(
                medication_name=med_label,
                prescribed_by=last_doc.role or last_doc.service,
                time=last_doc.timestamp,
                administration_status=status,
                claim_text=last_quote.rstrip("."),
                exact_source_quote=last_quote,
                source_doc_id=last_doc.doc_id,
                confidence=conf,
                confidence_reason=reason_txt,
            )
        )

    # Key clinical info
    key_patterns = [
        re.compile(r"Target oxygen saturation|Asthma–COPD overlap|severe CAP|intracapsular NOF", re.I),
        re.compile(r"Escalation ceiling|suitable for NIV|DNACPR|TTO:", re.I),
        re.compile(r"Moderate dementia|Baseline|PMH:|Lives alone|own home", re.I),
    ]
    key_clinical_info: List[LLMVerifiedClaim] = []
    seen_key = set()
    for kp in key_patterns:
        hit = _first_matching_sentence(docs, kp)
        if hit and hit[1] not in seen_key:
            seen_key.add(hit[1])
            key_clinical_info.append(
                LLMVerifiedClaim(
                    claim_text=hit[1].rstrip("."),
                    exact_source_quote=hit[1],
                    source_doc_id=hit[0].doc_id,
                    confidence="HIGH",
                    confidence_reason="Directly stated baseline / care plan detail in source document.",
                )
            )
    if not key_clinical_info:
        key_clinical_info.append(
            LLMVerifiedClaim(
                claim_text="INSUFFICIENT_DATA",
                exact_source_quote="INSUFFICIENT_DATA",
                source_doc_id="NONE",
                confidence="LOW",
                confidence_reason="Key clinical baseline or escalation details were not located in notes.",
            )
        )

    # Reasonable adjustments
    adj_hits = _all_matching_sentences(
        docs,
        re.compile(r"Moderate dementia|short simple sentences|explain before|low-stimulation|Daughter|quiet", re.I),
    )
    reasonable_adjustments: List[LLMVerifiedClaim] = []
    seen_adj = set()
    for adoc, aq in adj_hits[:4]:
        if aq in seen_adj:
            continue
        seen_adj.add(aq)
        reasonable_adjustments.append(
            LLMVerifiedClaim(
                claim_text=aq.rstrip("."),
                exact_source_quote=aq,
                source_doc_id=adoc.doc_id,
                confidence="HIGH",
                confidence_reason="Directly extracted communication/environmental adjustment or NOK detail.",
            )
        )

    # Open loops / outstanding items to confirm
    loop_hits = _all_matching_sentences(
        docs,
        re.compile(
            r"not been confirmed|unable to confirm|unconfirmed|deferred|not attached|not located|"
            r"not directly viewable|not transmitted|check exact timing|confirm current|not on TTO|"
            r"await opinion|not yet|unsure why|no call back|f/u CT|will review",
            re.I,
        ),
    )
    open_loops: List[LLMVerifiedClaim] = []
    seen_loops = set()
    for ldoc, lq in loop_hits[:8]:
        if lq in seen_loops:
            continue
        seen_loops.add(lq)
        open_loops.append(
            LLMVerifiedClaim(
                claim_text=lq.rstrip("."),
                exact_source_quote=lq,
                source_doc_id=ldoc.doc_id,
                confidence="HIGH",
                confidence_reason="Unresolved action, missing document, or unconfirmed treatment explicitly noted in record.",
            )
        )

    return ClaudeExtractionPayload(
        reason_for_attendance=reason,
        allergies=allergies,
        journey_events=journey_events,
        medications=medications,
        key_clinical_info=key_clinical_info,
        reasonable_adjustments=reasonable_adjustments,
        open_loops=open_loops,
    )


# ---------------------------------------------------------------------------
# Layer 3: Deterministic Python Verification & Clinical Safety Stop-Gate
# ---------------------------------------------------------------------------


def normalize_ws(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "")).strip()


def _verify_quote_against_docs(
    quote: str,
    claimed_doc_id: str,
    claim_text: str,
    confidence: ConfidenceLevel,
    norm_docs: Dict[str, str],
) -> Tuple[bool, str, str]:
    """
    Returns (passed, resolved_doc_id, failure_reason).
    Allows explicit 'INSUFFICIENT_DATA' sentinel when confidence == 'LOW'.
    Otherwise requires exact verbatim normalized substring presence inside raw_text.
    """
    norm_q = normalize_ws(quote)
    norm_claim = normalize_ws(claim_text)

    if norm_claim.upper() == "INSUFFICIENT_DATA" and confidence == "LOW":
        if norm_q.upper() in ("INSUFFICIENT_DATA", "NONE", "N/A", ""):
            return True, claimed_doc_id, ""

    if len(norm_q) < 4:
        return False, claimed_doc_id, "Quote is empty or too short (< 4 chars) to prove clinical claim."

    if norm_q.upper() == "INSUFFICIENT_DATA":
        return False, claimed_doc_id, "Non-empty clinical claim lacks an actual verbatim quote."

    target_text = norm_docs.get(claimed_doc_id, "")
    if target_text and norm_q in target_text:
        return True, claimed_doc_id, ""

    # Check whether the exact quote exists verbatim in another source document
    for doc_id, text in norm_docs.items():
        if norm_q in text:
            return True, doc_id, ""

    return (
        False,
        claimed_doc_id,
        f"Exact source quote not found verbatim in any raw source document: {quote!r}",
    )


def verify_and_gate_summary(
    patient_id: str,
    patient_name: str,
    payload: ClaudeExtractionPayload,
    docs: List[SourceDocumentInput],
    model_used: str,
    generation_mode: str,
    notice: Optional[str] = None,
) -> SummariseResponse:
    norm_docs: Dict[str, str] = {d.doc_id: normalize_ws(d.raw_text) for d in docs}

    quarantined_claims: List[dict] = []
    safety_halt_reasons: List[str] = []
    low_confidence_reasons: List[str] = []
    total_claims = 0
    verified_claims_count = 0

    def gate_claim(section: str, item: LLMVerifiedClaim, critical: bool = False) -> Tuple[VerifiedClaim, bool]:
        nonlocal total_claims, verified_claims_count
        total_claims += 1
        passed, resolved_id, fail_reason = _verify_quote_against_docs(
            item.exact_source_quote,
            item.source_doc_id,
            item.claim_text,
            item.confidence,
            norm_docs,
        )
        if not passed:
            quarantined_claims.append(
                {
                    "section": section,
                    "blocked_claim_text": item.claim_text,
                    "failed_quote": item.exact_source_quote,
                    "source_doc_id": item.source_doc_id,
                    "reason": fail_reason,
                }
            )
            safety_halt_reasons.append(
                f"[{section}] Blocked unverified claim '{item.claim_text[:90]}': {fail_reason}"
            )
            return (
                VerifiedClaim(
                    claim_text="[BLOCKED BY CLINICAL SAFETY GATE — Unverified source quote quarantined]",
                    exact_source_quote="",
                    source_doc_id=item.source_doc_id,
                    confidence="LOW",
                    confidence_reason=fail_reason,
                    verification_passed=False,
                ),
                False,
            )

        verified_claims_count += 1
        out = VerifiedClaim(
            claim_text=item.claim_text,
            exact_source_quote=item.exact_source_quote,
            source_doc_id=resolved_id,
            confidence=item.confidence,
            confidence_reason=item.confidence_reason,
            verification_passed=True,
        )
        if critical and (out.confidence != "HIGH" or "INSUFFICIENT_DATA" in out.claim_text.upper()):
            low_confidence_reasons.append(
                f"[{section}] Confidence={out.confidence}: {out.confidence_reason}"
            )
        return out, True

    # 1. Reason for attendance (critical)
    gated_reason, _ = gate_claim("Reason for Attendance", payload.reason_for_attendance, critical=True)

    # 2. Allergies (critical)
    gated_allergies: List[VerifiedClaim] = []
    for a in payload.allergies:
        vc, ok = gate_claim("Allergies", a, critical=True)
        if ok:
            gated_allergies.append(vc)
    if not gated_allergies:
        low_confidence_reasons.append("[Allergies] No verified allergy claim remained after safety filtering.")

    # 3. Journey events
    gated_journey: List[JourneyEventClaim] = []
    for j in payload.journey_events:
        total_claims += 1
        passed, resolved_id, fail_reason = _verify_quote_against_docs(
            j.exact_source_quote,
            j.source_doc_id,
            j.claim_text,
            j.confidence,
            norm_docs,
        )
        if not passed:
            quarantined_claims.append(
                {
                    "section": "Journey Events",
                    "blocked_claim_text": j.claim_text,
                    "failed_quote": j.exact_source_quote,
                    "source_doc_id": j.source_doc_id,
                    "reason": fail_reason,
                }
            )
            safety_halt_reasons.append(
                f"[Journey Events] Blocked unverified event '{j.claim_text[:90]}': {fail_reason}"
            )
            continue
        verified_claims_count += 1
        gated_journey.append(
            JourneyEventClaim(
                timestamp=j.timestamp,
                service=j.service,
                claim_text=j.claim_text,
                treatment_note=j.treatment_note,
                exact_source_quote=j.exact_source_quote,
                source_doc_id=resolved_id,
                confidence=j.confidence,
                confidence_reason=j.confidence_reason,
                verification_passed=True,
            )
        )

    # 4. Medications (critical)
    gated_meds: List[MedicationClaim] = []
    for m in payload.medications:
        total_claims += 1
        passed, resolved_id, fail_reason = _verify_quote_against_docs(
            m.exact_source_quote,
            m.source_doc_id,
            m.claim_text,
            m.confidence,
            norm_docs,
        )
        if not passed:
            quarantined_claims.append(
                {
                    "section": "Medications",
                    "blocked_claim_text": f"{m.medication_name}: {m.claim_text}",
                    "failed_quote": m.exact_source_quote,
                    "source_doc_id": m.source_doc_id,
                    "reason": fail_reason,
                }
            )
            safety_halt_reasons.append(
                f"[Medications] Blocked unverified medication '{m.medication_name}': {fail_reason}"
            )
            continue
        verified_claims_count += 1
        mc = MedicationClaim(
            medication_name=m.medication_name,
            prescribed_by=m.prescribed_by,
            time=m.time,
            administration_status=m.administration_status,
            claim_text=m.claim_text,
            exact_source_quote=m.exact_source_quote,
            source_doc_id=resolved_id,
            confidence=m.confidence,
            confidence_reason=m.confidence_reason,
            verification_passed=True,
        )
        gated_meds.append(mc)
        if mc.confidence != "HIGH" or mc.administration_status == "INSUFFICIENT_DATA":
            low_confidence_reasons.append(
                f"[Medications · {mc.medication_name}] Confidence={mc.confidence} ({mc.administration_status}): {mc.confidence_reason}"
            )

    # 5. Key Clinical Info
    gated_key_info: List[VerifiedClaim] = []
    for k in payload.key_clinical_info:
        vc, ok = gate_claim("Key Clinical Info", k, critical=False)
        if ok:
            gated_key_info.append(vc)

    # 6. Reasonable Adjustments
    gated_adjustments: List[VerifiedClaim] = []
    for adj in payload.reasonable_adjustments:
        vc, ok = gate_claim("Reasonable Adjustments", adj, critical=False)
        if ok:
            gated_adjustments.append(vc)

    # 7. Open Loops
    gated_loops: List[VerifiedClaim] = []
    for lp in payload.open_loops:
        vc, ok = gate_claim("Open Loops", lp, critical=False)
        if ok:
            gated_loops.append(vc)

    clinical_safety_halt = len(quarantined_claims) > 0
    requires_clinician_review = clinical_safety_halt or len(low_confidence_reasons) > 0

    return SummariseResponse(
        patient_id=patient_id,
        patient_name=patient_name,
        model_used=model_used,
        generation_mode=generation_mode,  # type: ignore[arg-type]
        reason_for_attendance=gated_reason,
        allergies=gated_allergies,
        journey_events=gated_journey,
        medications=gated_meds,
        key_clinical_info=gated_key_info,
        reasonable_adjustments=gated_adjustments,
        open_loops=gated_loops,
        clinical_safety_halt=clinical_safety_halt,
        safety_halt_reasons=safety_halt_reasons,
        requires_clinician_review=requires_clinician_review,
        low_confidence_reasons=low_confidence_reasons,
        quarantined_claims=quarantined_claims,
        verification_stats={
            "total_claims_checked": total_claims,
            "verified_claims": verified_claims_count,
            "blocked_claims": len(quarantined_claims),
        },
        source_documents=docs,
        notice=notice,
    )


# ---------------------------------------------------------------------------
# FastAPI App & Routes
# ---------------------------------------------------------------------------

app = FastAPI(
    title="RIND Clinical Guardrail API",
    description="Safety-critical NHS clinical handover synthesis backed by Claude and deterministic quote verification.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def serve_index():
    return FileResponse(INDEX_HTML_PATH, media_type="text/html")


@app.get("/api/health")
async def health():
    load_dotenv(override=True)
    key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    key_configured = bool(key and key != "your_anthropic_api_key_here")
    return {
        "status": "ok",
        "model": CLAUDE_MODEL,
        "anthropic_api_key_configured": key_configured,
    }


def _call_claude_extractor(
    patient_id: str,
    patient_name: str,
    docs: List[SourceDocumentInput],
    api_key: str,
) -> ClaudeExtractionPayload:
    client = anthropic.Anthropic(api_key=api_key)
    doc_blocks = "\n\n".join(
        f"[doc_id={d.doc_id} | timestamp={d.timestamp} | service={d.service} | role={d.role}]\n"
        f"raw_text: {d.raw_text}"
        for d in docs
    )
    user_message = (
        f"Patient: {patient_name} (ID: {patient_id})\n"
        f"Total Source Documents: {len(docs)}\n\n"
        f"Extract the structured acute pathway summary below. Remember: EVERY exact_source_quote "
        f"MUST be copied verbatim character-for-character from one document's raw_text above, "
        f"and never infer drug administration from a prescription.\n\n"
        f"SOURCE DOCUMENTS:\n{doc_blocks}"
    )

    # IMPORTANT: Do NOT pass temperature, top_p, or top_k parameters.
    parsed_msg = client.messages.parse(
        model=CLAUDE_MODEL,
        max_tokens=12000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
        output_format=ClaudeExtractionPayload,
    )
    if parsed_msg.parsed_output is None:
        raise ValueError("Anthropic returned empty parsed_output.")
    return parsed_msg.parsed_output


def _inject_simulated_hallucination(
    payload: ClaudeExtractionPayload, docs: List[SourceDocumentInput]
) -> None:
    target_doc_id = docs[-1].doc_id if docs else "Ambulance_ePCR_D1_1815"
    payload.medications.insert(
        0,
        LLMMedicationClaim(
            medication_name="IV Co-amoxiclav 1.2g [SIMULATED HALLUCINATION]",
            prescribed_by="Paramedic",
            time="18:10",
            administration_status="ADMINISTERED",
            claim_text="IV Co-amoxiclav 1.2g slow bolus administered by paramedic at 18:10 en route to ED.",
            exact_source_quote="Given IV Co-amoxiclav 1.2g slow bolus at 18:10 en route to ED despite penicillin rash history.",
            source_doc_id=target_doc_id,
            confidence="HIGH",
            confidence_reason="Simulated hallucinated antibiotic administration not present in source notes.",
        ),
    )


@app.post("/api/summarise", response_model=SummariseResponse)
async def summarise(request: SummariseRequest):
    load_dotenv(override=True)
    docs = (
        list(request.documents)
        if request.documents
        else parse_raw_notes_to_documents(request.raw_notes_text or "")
    )
    patient_name = request.patient_name or f"Patient {request.patient_id}"

    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    key_ready = bool(api_key and api_key != "your_anthropic_api_key_here")

    payload: Optional[ClaudeExtractionPayload] = None
    generation_mode = "DETERMINISTIC_FALLBACK"
    notice: Optional[str] = None

    if key_ready:
        try:
            payload = _call_claude_extractor(
                request.patient_id, patient_name, docs, api_key
            )
            generation_mode = "CLAUDE_API"
        except Exception as exc:
            logger.warning("Claude API synthesis failed; falling back safely: %s", exc)
            notice = (
                f"Claude API call ({CLAUDE_MODEL}) unavailable ({type(exc).__name__}); "
                "using deterministic verbatim extraction fallback under Layer 3 safety gate."
            )
    else:
        notice = (
            "ANTHROPIC_API_KEY is not set in environment/.env; running deterministic "
            "verbatim extractor while enforcing the full 3-layer safety gate."
        )

    if payload is None:
        payload = build_deterministic_extraction(docs)

    if request.simulate_hallucination:
        _inject_simulated_hallucination(payload, docs)
        generation_mode = (
            "CLAUDE_API_SIMULATED_HALLUCINATION"
            if generation_mode == "CLAUDE_API"
            else "DETERMINISTIC_SIMULATED_HALLUCINATION"
        )

    return verify_and_gate_summary(
        patient_id=request.patient_id,
        patient_name=patient_name,
        payload=payload,
        docs=docs,
        model_used=CLAUDE_MODEL,
        generation_mode=generation_mode,
        notice=notice,
    )
