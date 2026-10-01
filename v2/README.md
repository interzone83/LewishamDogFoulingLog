# Lewisham Dog Fouling Evidence Log — Version 2

Version 2 sits alongside the original root site. The V1 files are not used by V2.

## URLs

- Public/council view: `/v2/`
- Admin view: `/v2/?admin=1`

The public URL deliberately hides all review/edit controls. The admin URL exposes the review and edit modes, but GitHub write access still requires the repository's fine-grained token. The token is held in browser session storage only and is not committed into the site.

## Modes

### Public view
Shows completed incidents only. Incomplete converted batches remain hidden until date/time, location, type and observation have all been supplied.

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
- editing date/time, type, location and observation
- adding an existing repository photo
- uploading a new 1080 × 1440 JPEG
- removing a photo, with optional repository-file deletion
- deleting a post (and, where applicable, its dedicated DOGLOG folder)
- reordering entries by move buttons or drag/drop

## Identity and ordering

Every incident has a permanent `uid`.

- migrated records: `LEGACY-001`, `LEGACY-002`, etc.
- shortcut uploads: their original `DOGLOG-YYYYMMDD-HHmmss` batch ID

The visible entry number is derived from the current saved ordering. Reordering therefore changes display entry numbers without changing permanent record IDs.

## Data and caching

V2 stores records in `v2/incidents.js`. The page fetches that file with a cache-busting query and `cache: no-store`, so a refresh after a save should read the latest GitHub Pages data rather than a stale browser copy.

## Save workflow

1. Open the admin URL.
2. Choose **Incident review** or **Edit log**.
3. If prompted, connect with the fine-grained GitHub token.
4. Make changes.
5. Press **Save changes to GitHub**.
6. Wait for **✓ Saved to GitHub**.

The page warns before leaving if there are unsaved data changes.

## Image standard

Images uploaded through the V2 browser editor are written as 1080 × 1440 JPEGs. Phone shortcut uploads remain in their DOGLOG folders and are attached by relative repository path.
