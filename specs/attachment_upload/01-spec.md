# Spec: Attachment Upload (File Attachments)

## Problem
Advisors on the Casas y Espacios Real Estate panel need the ability to send attachments (images, documents, and videos) to clients over WhatsApp. Currently, the attach menu is a simplified skeleton and there is no file size validation, conditional UI disabling, or robust backend error handling for media files.

## Goals
- Make the attach menu fully functional, matching the mockup styles and options (Image, Document, Video).
- Select files programmatically by clicking on dropdown choices.
- Validate chosen files against specific MIME types and size limits:
  - **Image:** 5MB (JPG, PNG, WEBP)
  - **Document:** 20MB (PDF, DOCX, XLSX)
  - **Video:** 16MB (MP4, 3GPP)
- Display a descriptive error message if a file is too large or not permitted *before* trying to upload.
- Show an inline preview bar containing the file's icon (color-coded dynamically), name, and formatted size.
- Ensure appropriate visual states:
  - Disable textarea and attachment button when a file is selected.
  - Make the "Send" button handle the selected file instead of the message text.
  - Support canceling/removing the selection.
- Call the `conversationsService.replyMedia` backend endpoint to send files, handling specific backend errors (`FILE_TOO_LARGE`, `FILE_TYPE_NOT_ALLOWED`).
- Multi-file attachments 
## Non-Goals
- In-browser image editing or PDF viewing (rendered previews are limited to metadata in the input bar).
- Modifying other components besides `ChatInput.tsx`.

## Expected Behavior
1. Advisor clicks the attachment button -> dropdown menu appears.
2. If clicked outside, dropdown closes. If Escape pressed, dropdown closes.
3. Advisor clicks "Imagen" -> system opens native file picker accepting images up to 5MB.
4. Advisor selects a 2.1MB image -> dropdown closes, preview bar appears showing image name, size, type (PNG/JPG), and blue icon. The textarea and attachment buttons are disabled.
5. Advisor clicks "Enviar" -> the file uploads and is sent to the client. Upon success, the preview bar disappears, textarea re-enables, and the message is displayed in the feed.

## Constraints
- Strictly use Tailwind colors matching the mockup (`#01A4E3` for image, `#FFB84D` for document, `#00D4AA` for video).
- Only modify `src/components/chat/ChatInput.tsx`.
- All code elements (functions, variables, comments) must be in English. User-facing strings must be in Spanish.

## Priority
High — Essential communication feature for Phase 1.
