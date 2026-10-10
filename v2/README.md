# Lewisham Dog Fouling Evidence Log — Version 2

Version 2 sits alongside the original root site. The V1 files are not used by V2.

## URLs

- Public/council view: `/v2/`
- Admin view: `/v2/?admin=1`

The public URL deliberately hides all review/edit controls. The admin URL exposes the review and edit modes, but GitHub write access still requires the repository's fine-grained token. The token is held in browser session storage only and is not committed into the site.

## Modes

### Public view
Shows completed incidents only. Incomplete converted batches remain hidden until date/time, location, type and observation have all been supplied.

Public users can sort by incident date, filter by main location, and search location descriptions and notes. The public summary and statistics are configurable by the administrator.

### Incident review
Adds dated follow-up history to an existing incident. Each follow-up can contain:
- review date
- status
- note
- follow-up photographs

Follow-up evidence is kept separate from the original incident evidence.

### Edit log
Supports:
- converting pending `DOGLOG-...` shortcut batches into entries
- deleting pending test batches
- editing date/time, type, precise location, main location and observation
- adding an existing repository photo
- uploading a new 1080 × 1440 JPEG
- removing a photo, with optional repository-file deletion
- deleting a post (and, where applicable, its dedicated DOGLOG folder)
- editing public-page summary text and statistics visibility
- selecting a main location separately from the specific street address / landmark

## Identity and ordering

Every incident has a permanent `uid`.

- migrated records: `LEGACY-001`, `LEGACY-002`, etc.
- shortcut uploads: their original `DOGLOG-YYYYMMDD-HHmmss` batch ID

The visible entry number is derived from the saved array order, but is hidden in Public View. Newest First / Oldest First sorts only the displayed cards: the underlying saved records and permanent IDs do not change.

Converted DOGLOG batches prefill date/time from the upload ID and scroll to the new post with the Location field focused. Correct the timestamp if the incident occurred earlier.

Existing detailed location descriptions are preserved. A main location may be assigned explicitly in Edit Log; existing records without one are grouped by a conservative inferred main location.

## Data and caching

V2 stores records in `v2/incidents.js`, reusable detailed-location suggestions in `v2/locations.json`, and public display settings in `v2/settings.json`.

The site uses cache-busting requests where possible, but GitHub Pages propagation can still lag saves. The public display settings are saved separately from incident data so changes to the intro or statistics do not rewrite incident records.

## Save workflow

1. Open the admin URL.
2. Choose **Incident review** or **Edit log**.
3. If prompted, connect with the fine-grained GitHub token.
4. Make changes.
5. Save either with the sticky **Save changes to GitHub** control or the save button inside the incident being edited.
6. Wait for **✓ Saved to GitHub**.

The page warns before leaving if there are unsaved data changes. Admin mode and scroll position are remembered per mode, so refreshing should return to the same working view and approximate position rather than dropping back to the top/public view.

## Image standard

Images uploaded through the V2 browser editor are written as 1080 × 1440 JPEGs at approximately 50% JPEG quality to keep repository file sizes modest. Original source filenames are retained where supplied by the browser; collisions receive a unique suffix. Phone/Scriptable uploads remain in their permanent-ID folders and are attached by relative repository path.
