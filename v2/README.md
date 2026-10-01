# Dog Fouling Log Version 2

Version 2 lives alongside the original root website. V1 remains untouched.

## URLs
- Public council-facing view: `/v2/`
- Admin view: `/v2/?admin=1`

The public URL hides editing/review controls. The admin URL exposes Incident Review and Edit Log, but GitHub write access still requires the repository-scoped fine-grained token at runtime. No token or password is embedded in the page source.

## Modes
- **Public view** — shows completed incident records only.
- **Incident review** — adds dated follow-up status, notes, and optional follow-up photos.
- **Edit log** — edits metadata, adds/removes photos, deletes posts, reorders entries, and converts pending DOGLOG batches into entries.

## Identity and ordering
Each post has a permanent record ID:
- legacy records: `LEGACY-001`, etc.
- shortcut uploads: their `DOGLOG-YYYYMMDD-HHmmss` batch ID.

Visible entry numbers are derived from the saved array order and can change when records are reordered. The permanent record ID does not change.

## Pending batches
A shortcut upload remains pending until converted in Edit Log. Converted but incomplete records remain hidden from Public view and Incident Review until date/time, location, type, and observation are populated.

## Saving
Connect GitHub first, make edits, then use **Save changes to GitHub** and wait for **✓ Saved to GitHub**. The generated incident data file is written with a valid final newline so it reloads correctly after refresh.

## Images
New browser-uploaded images are written as 1080 × 1440 JPEGs. Existing legacy images remain in place so V1 is not disturbed.
