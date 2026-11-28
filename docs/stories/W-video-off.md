# W-video-off: the demo video comes off the site

risk: low (removes a video and its caption from two pages; no new public text)
Status: **Approved** by the owner's own words (2026-11-28): "we need to change the video" ... "on the website", then
"Remove it" (over a new file or a re-recording).
Verification: the repo's verification command (README.md).

## Story
As the owner, I want the 82-second "feature to ship" demo video (recorded in CI on Nov 24) off the site, because it
no longer shows the product as it is.

## Design
Remove the `<figure class="demo-video">` block from `site/index.html` (hero, `id="watch"`) and `site/get-started.md`,
the `.demo-video` rules from `site/assets/css/site.css`, and `site/assets/video/ade-demo.mp4` and `ade-demo.png` (git
history keeps them). `tests/siteVideo.test.ts` becomes the guard that no built page carries a `<video>`, a link to
`/assets/video/`, or a `#watch` link, and that `_site/assets/video/` is absent.

## Acceptance criteria
1. **no video on the pages** (tests/siteVideo.test.ts): the built Home and Get started pages have no `<video>` and no
   `demo-video` figure; no built page links to `/assets/video/` or `#watch`.
2. **no video files** (tests/siteVideo.test.ts): `site/assets/video/` and `_site/assets/video/` do not exist.
3. The verification command passes.

## Out of scope
A new video or a re-recording (a later story when the owner wants one); ade-drill's drill D4 that recorded it.
