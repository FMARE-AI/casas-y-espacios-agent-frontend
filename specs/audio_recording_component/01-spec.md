# Spec: Audio Recording Component (AudioRecorder)

## Problem
In the Casas y Espacios Agent workspace, advisors need to send audio messages (voice notes) directly from the web panel to respond to property owners and prospect clients. Currently, there is only support for text and generic file uploads.

## Goals
- Provide a recording button (microphone icon) styled consistently with the mockup within the text input area.
- Record audio inputs from the advisor's microphone.
- Allow real-time preview (native playback) of the recorded audio before sending.
- Handle state transitions cleanly (idle, requesting permission, recording, preview, sending, and error states).
- Limit voice notes to a maximum of 5 minutes (300 seconds), auto-stopping the recording.
- Warn the advisor when the recording time is close to the limit (remaining 30 seconds or less).
- Allow sending or canceling/clearing the audio.
- Seamlessly integrate into [ChatInput.tsx](file:///C:/Users/Antho/Downloads/casas-y-espacios-agent-frontend/src/components/chat/ChatInput.tsx) without altering other files.

## Non-Goals
- Editing or trimming the audio within the application.
- Real-time audio visualization (waveforms) beyond simple timing indicators.
- Modifying components outside of `AudioRecorder.tsx` and `ChatInput.tsx`.

## Expected Behavior
1. **Idle State**: A microphone button matches the exact style of the "attach" button. Disabled if the advisor is not assigned to the chat.
2. **Permission State**: Spinner displays while requesting microphone permission.
3. **Recording State**: Red pulsing dot and active timer `MM:SS` display. A warning "Límite próximo" is shown if elapsed time is $\ge 4:30$. Square stop button is visible.
4. **Preview State**: Native audio player is shown, allowing the user to review the recording, along with Send (send arrow) and Cancel (close "X") buttons.
5. **Sending State**: Spinner and text "Enviando audio..." indicate upload in progress.
6. **Error State**: Displays error message and a "Reintentar" button that goes back to the Idle state.

## Constraints
- Must use standard `MediaRecorder` API compatible with modern browsers.
- Audio formats (mime types) must prioritize configurations supported by Meta WhatsApp Cloud API (`audio/webm;codecs=opus`, etc.).
- Audio file uploading must use `conversationsService.replyAudio` from [conversations.ts](file:///C:/Users/Antho/Downloads/casas-y-espacios-agent-frontend/src/services/conversations.ts).
- Strictly adhere to `CLAUDE.md` and `AGENTS.md` guidelines (e.g., code elements/variables in English, user-facing text in Spanish).

## Priority
High — This completes a key communications requirement for Phase 1.
