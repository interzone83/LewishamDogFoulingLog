# Dog Fouling Log Version 2

This folder contains the Version 2 interface. The original root website remains unchanged.

## Modes
- Public view: council-facing evidence log.
- Incident review: add dated follow-up status, notes and optional follow-up photos.
- Edit log: edit metadata, add/remove photos, delete posts, reorder entries, and attach pending DOGLOG batches.

## Identity
Each post has a permanent ID. Legacy entries use LEGACY-001 etc. New shortcut batches retain their DOGLOG timestamp ID. Entry numbers are derived from current ordering and can therefore change when entries are reordered.

## GitHub editing
No GitHub token is committed in this site. Review/edit writes require a fine-grained token entered at runtime and held in sessionStorage for that browser tab/session.
