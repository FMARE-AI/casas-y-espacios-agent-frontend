# Design: Attachment Upload

## Overview
This feature replaces the placeholder attachment interface in [ChatInput.tsx](file:///C:/Users/Antho/Downloads/casas-y-espacios-agent-frontend/src/components/chat/ChatInput.tsx) with a fully functional file picker and preview system matching the mockup specifications.

## Components

### Modified Files
| File | Role | Change type |
|------|------|-------------|
| [ChatInput.tsx](file:///C:/Users/Antho/Downloads/casas-y-espacios-agent-frontend/src/components/chat/ChatInput.tsx) | Implements validation limits, dropdown interactions, Escape listener, preview bar rendering, and conditional disabling. | Modify |

### Key Abstractions
- **FILE_TYPES**: Object defining MIME groups (`image`, `document`, `video`), their `accept` lists, `maxMB` size thresholds, and color themes.
- **handleTypeSelected(type)**: Opens the native file picker pre-configured with the corresponding `accept` headers.
- **handleFileSelected(event)**: Triggered when a file is selected. Performs:
  - MIME classification (`getFileType`).
  - Size validation (compared to `maxBytes` calculated from `FILE_TYPES[type].maxMB`).
  - Stores the validated `File` in `selectedFile`.
- **previewBar**: Renders when `selectedFile` is active. Displays:
  - File icon with background matching type colors (`bg-bg-brand-blue/15`, etc.).
  - File name and formatted human-readable size (`formatFileSize`).
  - Close button to trigger `removeSelectedFile()`.
- **handleSend()**: Dispatches `conversationsService.replyMedia` when `selectedFile` is present, or `conversationsService.replyText` when text is typed. Handles backend-specific errors (`FILE_TOO_LARGE`, `FILE_TYPE_NOT_ALLOWED`).

### UI & Disabling Rules
- The **textarea** is disabled when `selectedFile !== null` or `sending === true`.
- The **attach button** is disabled when:
  - `variant !== 'assigned'`
  - `sending === true`
  - `selectedFile !== null`
- Clicking outside or pressing **Escape** closes the attach menu.

### Code Alignment
All code (variables, comments, functions) will be written in English. UI text labels and error messages will be written in Spanish.
