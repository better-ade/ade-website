# W-main-drift: the site matches the repos again

Status: **Approved** (coordinator default, 2026-11-28: a truth fix the site's own rules require; the owner approves the
push). Risk: **low** (copy on the public site; no secret, sign-in, data or money).
Verification: the repo's verification command (README.md).

## Why
On a clean `main`, the verification command fails 4 tests because the repos the site describes moved on:
- siteTruth (2) and sitePaper (1): ade-cli's VERSION on `main` is 0.2.15; the site says 0.2.10.
- siteNarrative (1): ade-skills `main` has a new ready recipe, google-drive, that Get started does not name.
- (found while fixing) ade-skills is at 0.10.0; the site says 0.9.0.

## Acceptance criteria (the existing tests are the checks)
1. **drift_version**: `site/_data/releases.yml` and the paper name ade-cli's and ade-skills' current releases; siteTruth and sitePaper pass.
2. **drift_services**: Get started and messaging name every ready ade-skills recipe, so Google Drive is added as
   available today; siteNarrative passes.
3. The verification command passes in full.

## Out of scope
Any other copy change.
