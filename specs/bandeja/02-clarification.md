# 02 - Clarifications

**Q: Should the frontend handle role-based filtering (e.g., showing only 'Administrativa' conversations to an 'Administrativa' advisor)?**
A: No. The backend (`conversationsService.list`) already handles area filtering based on the authenticated user's role. The frontend simply displays the list returned.

**Q: Are WebSocket updates implemented in this task?**
A: No. We are preparing placeholder functions (`handleEscalationNew`, `handleEscalationAssigned`) that currently just reload the full list. Actual WebSocket integration is part of FE-10.

**Q: Where do the CSS animations go?**
A: They should be appended exactly as provided into `src/index.css`.
