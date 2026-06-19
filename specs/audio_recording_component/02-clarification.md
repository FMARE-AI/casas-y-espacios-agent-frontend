# Clarifications: Audio Recording Component

## Questions & Answers

**Q1: How do we determine `disabled` state when we are not allowed to touch files other than `AudioRecorder.tsx` and `ChatInput.tsx`?**
A: Since `ChatInput` is instantiated in `ChatPage.tsx` without a `variant` prop, we will add an optional `variant` prop to `ChatInputProps` that defaults to `'assigned'`. This ensures that we do not break compilation or runtime execution elsewhere, while allowing the recording button to behave correctly (disabled when not assigned).

**Q2: Which mime type should be used for Meta WhatsApp compatibility?**
A: We will query the browser for support in this priority:
1. `audio/webm;codecs=opus`
2. `audio/webm`
3. `audio/ogg;codecs=opus`
4. `audio/mp4`
If none are supported, we fallback to `audio/webm`. This is handled by `getSupportedMimeType()`.

**Q3: How are permissions handled when the user blocks mic access?**
A: If `navigator.mediaDevices.getUserMedia` rejects with a `NotAllowedError`, we set the state to `'error'` and display the specific message: `"Debes permitir el acceso al micrófono para enviar audios"`. For other errors, we display `"No se pudo acceder al micrófono"`.

## Open Decisions
None. All requirements, styles, and state diagrams are well-defined.
