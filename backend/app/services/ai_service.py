"""
AI Health Assistant service.

Gemini-powered implementation for the Hospital Management System.

Design goals:
- Available to patients only (RBAC is enforced by the router).
- Never diagnoses diseases.
- Uses deterministic emergency keyword detection as a safety net.
- Uses Gemini for natural-language health guidance.
- Keeps provider configuration in Settings.
- Supports conversation history.
"""

import logging

from google import genai
from google.genai import types

from app.core.config import settings

logger = logging.getLogger("hms.ai_assistant")


DISCLAIMER = (
    "This AI assistant is for informational purposes only and is not a "
    "substitute for professional medical advice."
)

EMERGENCY_MESSAGE = (
    "These symptoms may indicate a medical emergency. "
    "Please seek immediate medical attention."
)


# ---------------------------------------------------------
# EMERGENCY DETECTION
# ---------------------------------------------------------

EMERGENCY_KEYWORDS = [
    "chest pain",
    "crushing chest",
    "can't breathe",
    "cannot breathe",
    "difficulty breathing",
    "shortness of breath",
    "gasping",
    "face drooping",
    "slurred speech",
    "sudden numbness",
    "sudden weakness",
    "stroke",
    "severe bleeding",
    "won't stop bleeding",
    "uncontrolled bleeding",
    "loss of consciousness",
    "unconscious",
    "passed out",
    "unresponsive",
    "suicidal",
    "want to die",
    "overdose",
    "seizure",
]


def detect_emergency(text: str) -> bool:
    """
    Deterministically checks whether the user's message contains
    potentially emergency-related symptoms.
    """

    lowered = text.lower()

    return any(
        keyword in lowered
        for keyword in EMERGENCY_KEYWORDS
    )


# ---------------------------------------------------------
# AI SYSTEM PROMPT
# ---------------------------------------------------------

SYSTEM_PROMPT = """
You are an AI Health Assistant embedded inside a Hospital Management System.

You provide information for patients.

IMPORTANT MEDICAL SAFETY RULES:

1. NEVER diagnose a disease or medical condition.

Never say:
- "You have X."
- "You are suffering from X."
- "This is definitely X."

Instead use educational language such as:
- "This symptom can have several possible causes."
- "Some common reasons for this symptom include..."
- "A healthcare professional can evaluate this properly."

2. You may provide:
- General health information
- Educational explanations
- General wellness suggestions
- General self-care information
- Information about common symptoms
- General information about when someone should consider seeing a doctor

3. Do NOT prescribe medication.

Do not tell patients to:
- Start prescription medication
- Stop prescription medication
- Change medication dosage
- Change medication frequency

4. If the patient asks about a prescription:
Explain the prescription information in simple language.
Do not modify the doctor's instructions.

5. If the patient describes potentially serious or emergency symptoms:
Strongly recommend seeking immediate professional/emergency medical care.

6. If symptoms are persistent, worsening, severe, or concerning:
Recommend contacting a qualified healthcare professional or booking
an appointment with a doctor.

7. Use simple language that a normal patient can understand.

8. Never pretend to be a doctor.

9. Never claim certainty about a diagnosis.

10. Keep answers concise, warm, and useful.

11. Use markdown lists and headings when useful.

12. For emergency situations, prioritize immediate medical-care guidance.

13. For normal health questions, provide educational information and
general guidance.

Do not provide a medical diagnosis.
"""


# ---------------------------------------------------------
# GEMINI CLIENT
# ---------------------------------------------------------

def _get_client() -> genai.Client:
    """
    Creates the Gemini client using the API key stored
    in the backend environment.
    """

    return genai.Client(
        api_key=settings.GEMINI_API_KEY
    )


# ---------------------------------------------------------
# CONVERSATION CONVERSION
# ---------------------------------------------------------

def _build_contents(
    conversation_history: list[dict],
    user_message: str,
) -> list[types.Content]:
    """
    Converts the hospital application's conversation format
    into Gemini's conversation format.
    """

    contents: list[types.Content] = []

    for message in conversation_history:

        role = message.get("role")
        content = message.get("content", "")

        if not content:
            continue

        # Our database uses "assistant".
        # Gemini expects "model".
        gemini_role = (
            "model"
            if role == "assistant"
            else "user"
        )

        contents.append(
            types.Content(
                role=gemini_role,
                parts=[
                    types.Part(
                        text=content
                    )
                ],
            )
        )

    # Add current user message
    contents.append(
        types.Content(
            role="user",
            parts=[
                types.Part(
                    text=user_message
                )
            ],
        )
    )

    return contents


# ---------------------------------------------------------
# MAIN CHAT FUNCTION
# ---------------------------------------------------------

def get_ai_reply(
    conversation_history: list[dict],
    user_message: str,
) -> tuple[str, bool]:
    """
    Generates an AI response.

    Returns:

        reply_text
        is_emergency
    """

    # First run deterministic emergency detection.
    is_emergency = detect_emergency(user_message)

    # -----------------------------------------------------
    # CHECK GEMINI CONFIGURATION
    # -----------------------------------------------------

    if (
        settings.AI_PROVIDER != "gemini"
        or not settings.GEMINI_API_KEY
    ):

        logger.warning(
            "Gemini AI provider is not configured."
        )

        if is_emergency:
            return (
                EMERGENCY_MESSAGE
                + "\n\n"
                + DISCLAIMER,
                True,
            )

        return (
            "The AI assistant is currently unavailable. "
            "Please try again later. If your symptoms are "
            "concerning or worsening, please contact a "
            "healthcare professional.\n\n"
            + DISCLAIMER
        ), False

    # -----------------------------------------------------
    # CALL GEMINI
    # -----------------------------------------------------

    try:

        client = _get_client()

        contents = _build_contents(
            conversation_history,
            user_message,
        )

        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.4,
                max_output_tokens=600,
            ),
        )

        reply = (response.text or "").strip()

        if not reply:
            raise RuntimeError(
                "Gemini returned an empty response."
            )

    except Exception:

        logger.exception(
            "Gemini provider call failed."
        )

        if is_emergency:
            return (
                EMERGENCY_MESSAGE
                + "\n\n"
                + DISCLAIMER,
                True,
            )

        return (
            "I'm having trouble responding right now. "
            "Please try again in a moment. If your symptoms "
            "are urgent or worsening, please contact a "
            "healthcare professional.\n\n"
            + DISCLAIMER
        ), False

    # -----------------------------------------------------
    # EMERGENCY SAFETY NET
    # -----------------------------------------------------

    if (
        is_emergency
        and EMERGENCY_MESSAGE not in reply
    ):

        reply = (
            EMERGENCY_MESSAGE
            + "\n\n"
            + reply
        )

    # -----------------------------------------------------
    # DISCLAIMER
    # -----------------------------------------------------

    if DISCLAIMER not in reply:

        reply = (
            reply.rstrip()
            + "\n\n"
            + DISCLAIMER
        )

    return reply, is_emergency


# ---------------------------------------------------------
# PRESCRIPTION EXPLANATION
# ---------------------------------------------------------

def explain_prescription(
    items: list[dict],
    notes: str | None,
) -> str:
    """
    Explains an existing prescription in simple language.

    This does NOT change the doctor's prescription.
    """

    prescription_lines = []

    for item in items:

        line = (
            f"Medicine: {item['medicine_name']}\n"
            f"Dosage: {item['dosage']}\n"
            f"Frequency: {item['frequency']}\n"
            f"Duration: {item['duration_days']} day(s)"
        )

        if item.get("instructions"):

            line += (
                f"\nInstructions: "
                f"{item['instructions']}"
            )

        prescription_lines.append(line)

    prescription_text = "\n\n".join(
        prescription_lines
    )

    if notes:

        prescription_text += (
            f"\n\nDoctor's notes:\n{notes}"
        )

    # -----------------------------------------------------
    # CHECK GEMINI CONFIGURATION
    # -----------------------------------------------------

    if (
        settings.AI_PROVIDER != "gemini"
        or not settings.GEMINI_API_KEY
    ):

        lines = [
            "Here is your prescription in plain language:\n"
        ]

        for item in items:

            line = (
                f"- **{item['medicine_name']}** "
                f"({item['dosage']}): take "
                f"{item['frequency']} for "
                f"{item['duration_days']} day(s)."
            )

            if item.get("instructions"):

                line += (
                    f" {item['instructions']}."
                )

            lines.append(line)

        if notes:

            lines.append(
                f"\nDoctor's notes: {notes}"
            )

        lines.append(
            "\nAlways follow the prescription "
            "exactly as provided by your doctor."
        )

        lines.append(
            "\n\n" + DISCLAIMER
        )

        return "\n".join(lines)

    # -----------------------------------------------------
    # ASK GEMINI TO EXPLAIN
    # -----------------------------------------------------

    try:

        client = _get_client()

        prescription_system_prompt = """
You are helping a patient understand a prescription
in simple language.

Rules:

1. ONLY explain the information provided.
2. Do not change the dosage.
3. Do not change the frequency.
4. Do not recommend starting medication.
5. Do not recommend stopping medication.
6. Do not diagnose diseases.
7. Do not invent information about a medicine.
8. If something is unclear, tell the patient to ask
   their doctor or pharmacist.
9. Use simple language.
10. Keep the explanation concise.
"""

        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prescription_text,
            config=types.GenerateContentConfig(
                system_instruction=prescription_system_prompt,
                temperature=0.2,
                max_output_tokens=500,
            ),
        )

        explanation = (
            response.text or ""
        ).strip()

        if not explanation:

            raise RuntimeError(
                "Gemini returned an empty prescription explanation."
            )

        if DISCLAIMER not in explanation:

            explanation += (
                "\n\n"
                + DISCLAIMER
            )

        return explanation

    except Exception:

        logger.exception(
            "Gemini prescription explanation failed."
        )

        return (
            "I couldn't generate an AI explanation right now. "
            "Please follow the prescription exactly as provided "
            "by your doctor and contact your doctor or pharmacist "
            "if you have questions.\n\n"
            + DISCLAIMER
        )