# Clarifications: Attachment Upload

## Questions & Answers

**Q1: How should we capture the Escape keypress to close the dropdown menu?**
A: We will add a global `keydown` event listener in the same `useEffect` that listens for clicks outside. If the pressed key is `'Escape'`, we will set `attachMenuOpen` to `false`.

**Q2: How should validation errors (like size exceeded or file type not allowed) be shown to the user?**
A: We will reuse the `sendError` state. We will change its type to `string | boolean` so we can store custom error messages (e.g. `"El archivo supera el límite de 20MB"`, `"Tipo de archivo no permitido"`) and render them inside the existing error alert banner.

**Q3: How do we determine the label format for documents (e.g. XLSX, DOCX) dynamically?**
A: We will use a helper function `getFileLabel(mimeType)` that parses the MIME type string and returns `'PDF'`, `'DOCX'`, `'XLSX'`, `'MP4'`, or the uppercase subtype (like `'PNG'`) for images.

## Open Decisions
None. All requirements align with the mockups and architectural constraints.
