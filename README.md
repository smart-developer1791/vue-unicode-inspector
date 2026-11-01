<div align="center">

# 🔎 Unicode Inspector

**Look closely at the text you see.**

![Vue](https://img.shields.io/badge/Vue-3-42b883?style=for-the-badge&logo=vuedotjs&logoColor=ffffff)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=for-the-badge&logo=typescript&logoColor=ffffff)
![Vite](https://img.shields.io/badge/Vite-8-646cff?style=for-the-badge&logo=vite&logoColor=ffffff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=ffffff)
![License](https://img.shields.io/badge/License-MIT-777777?style=for-the-badge)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

_Vue Unicode text desk with lifecycle-owned customRef search, native grapheme segmentation and normalization, precise offsets, and complete byte reports._

</div>

---

## ✨ Highlights

- **Four different counts:** Compare UTF-16 code units, Unicode code points, native grapheme clusters, and UTF-8 bytes.
- **Keep the source:** Apply none/NFC/NFD/NFKC/NFKD normalization to a separate output while preserving original text in JSON.
- **Find a code point:** Search the complete grapheme list before limiting visible rows.
- **Vue owns delayed work:** customRef publishes debounced search values, with explicit flush and effect-scope timer/watch cleanup.
- **Precise boundaries:** Inspect zero-based UTF-16 and UTF-8 offsets, code points, JSON-escaped segments, and byte HEX.
- **Bounded views, complete downloads:** Browse 160 matching clusters or the first 256 bytes; exports include every result.
- **Portable evidence:** Download grapheme CSV, full UTF-8 HEX, exact normalized TXT, or editable UN JSON.

## 🧱 Project Structure

```text
public/
├── favicon.svg                         # Original project emblem
├── og.svg                              # Original social artwork
├── font-licenses.txt                   # Font copyright and OFL licenses
└── sample-workspace.json               # Complete importable workspace
src/
├── components/
│   ├── GraphemeTable.vue
│   ├── ByteView.vue
│   ├── DataTools.vue                   # Workspace actions and restoration
│   ├── AppDialog.vue                   # Native Teleport modal and focus lifecycle
│   ├── AppIcon.vue                     # Original inline SVG icons
│   ├── DataExchange.vue                # Validated workspace import dialog
│   └── StudioHeader.vue                # Workspace branding and actions
├── domain/
│   ├── unicode.ts                     # Pure validation, calculations, and exports
│   ├── shared.ts                       # Text and provenance helpers
│   └── validation.ts                   # Strict unknown-input guards
├── composables/
│   └── useDebouncedSearch.ts
├── services/
│   ├── draft.ts                        # Validated device-local persistence
│   └── files.ts                        # Downloads and deterministic identities
├── App.vue                             # Workspace and editor state
├── base.css                            # Tailwind, local fonts, and control defaults
├── style.css                           # Project theme tokens
└── main.ts                             # Vue application entry
tests/
├── *.test.ts                           # Native domain/composable/export tests
└── e2e/                                # Production browser workflows
```

Root files include Vite, TypeScript, Playwright, and Prettier configuration, an npm lockfile, the MIT license, and explicit `vercel.json`. The official scaffold’s default artwork and empty `src/assets` directory are removed. The shared generic development container stays unchanged.

## 🛠 Tech Stack

| Tool                          | Role                                                                        |
| ----------------------------- | --------------------------------------------------------------------------- |
| Vue 3.5                       | Typed SFCs, component contracts, reactive state, and lifecycle management   |
| TypeScript 6                  | Checked domain structures and component/composable inputs                   |
| Vite 8                        | Development server and static production bundles                            |
| Tailwind CSS 4                | Vite plugin, theme tokens, template utilities, and responsive/state styling |
| DM Sans + Bricolage Grotesque | Locally bundled Latin variable fonts                                        |
| Node.js 24+                   | Local CLI tools and native TypeScript tests                                 |
| Playwright                    | Chromium workflows against the production build                             |

The app requires no account, backend, remote data source, or extra UI library. All dependencies and CLI tools are installed locally inside this independent project.

## 🎨 Tailwind Styling

The Vite config enables `@tailwindcss/vite`. `base.css` imports Tailwind, defines font tokens, and uses `@apply` for small native control defaults. `style.css` defines project colors through `@theme`. Actual application templates use Tailwind utilities for grid/flex layouts, spacing, typography, borders, colors, responsive behavior, focus, and visible states.

`data-ui`, `data-project`, and domain identity attributes are explicit browser hooks. There are no orphan semantic styling classes. Reserved preview/list containers and internal overflow keep neighboring panels stable when modes, selected details, or results change. All application layout and visible-state classes use Tailwind utilities. SVG attributes describe pixel artwork geometry; standalone vector artifacts carry their own presentation. Reduced-motion preferences shorten transitions.

Two Fontsource variable font files are bundled as hashed local assets. Their copyright and OFL text are in [font-licenses.txt](./public/font-licenses.txt). Favicon/social artwork and SVG interface icons are original project assets.

## 📦 Included Demo Data

The original **The small details in a greeting** uses Cafe followed by a combining acute accent, a smiling emoji, a joined woman-technologist emoji, a UK flag, spaces, and a final newline. With normalization disabled it has 20 UTF-16 units, 15 code points, 11 native grapheme clusters, and 33 UTF-8 bytes. NFC composes the accent, reducing those counts to 19/14/11/32.

The complete [sample-workspace.json](./public/sample-workspace.json) includes valid provenance and is served as a public static file. The application imports this same JSON sample for first use and confirmed restoration.

## 🚀 Local Development

Use Node.js **24 or later**:

```bash
npm ci
npm run dev
```

Vite prints the local URL and binds to `0.0.0.0` for the shared container. Inspect a production bundle with:

```bash
npm run build
npm run preview
```

## 🧩 Vue Implementation

useDebouncedSearch creates a real customRef. Its getter tracks a committed string; source changes schedule publication after 180 ms instead of exposing an immediate value. A synchronous source watcher coalesces updates, and Filter now cancels the delay and publishes the current source immediately. onScopeDispose stops the captured watcher, clears its timer, and closes its callback. The Graphemes view uses v-if, so switching to Bytes destroys that component and its scope. Returning creates fresh DOM with an empty filter.

The native Intl.Segmenter API uses grapheme granularity. JavaScript iteration counts code points, string length counts UTF-16 units, and TextEncoder creates UTF-8 bytes. Each grapheme stores its starting UTF-16 index, cumulative UTF-8 byte offset, constituent U+ hexadecimal code points, unit span, and byte sequence. All offsets and metrics refer to the normalized output. Native Unicode/grapheme versions can vary between runtimes; this project does not ship an independent Unicode database.

The parser accepts well-formed source strings including control characters and rejects lone UTF-16 surrogates. Raw source is bounded at 1000 UTF-16 units; compatibility normalization can expand it, so normalized output has a separate 4096-unit bound. The original source remains in the editable model. Applying normalization is explicit and does not silently replace that source.

Search normalizes a code-point query to uppercase and removes an optional leading U+. It matches substrings of any constituent code-point label across the entire result, then limits the table to 160 matching graphemes. It is a hexadecimal-code search rather than a character-name database or source-text search. Filter state belongs to the mounted table and is excluded from JSON; an import updates its data without forcing a remount. The byte preview shows at most 256 bytes in 16-byte rows.

CSV represents each grapheme with a JSON-string cell, then applies CSV quoting. Newlines, NUL, tabs, quotes, and other JSON controls therefore do not inject literal CSV rows or NUL bytes. TXT is deliberately the exact normalized text, with no header or marker added to its bytes. HEX includes a full byte dump and report metadata. Separate source/settings forms preserve unrelated pending fields, while malformed candidates retain the last valid report.

The shared modal uses `Teleport`, a unique `useId` heading, and a post-flush watcher to synchronize Vue state with native `showModal`/`close`. Escape and focus return remain native. A queued close event cannot reset a modal that has already reopened.

## 💾 Local Drafts & Data Exchange

Validated workspace data is stored under `vue-unicode-inspector:v1`. First-use and restored data are validated before use. Invalid saved JSON/schema falls back to the sample without immediately overwriting the damaged entry. A later valid change writes a new draft. Blocked storage leaves editing and downloads usable and shows a status message.

Import parses a detached candidate and replaces the workspace only after complete validation. Failure keeps current work and the saved draft intact. Workspace JSON is limited to **120,000 characters**. Known fields are rebuilt in canonical order; unknown fields and supplied provenance are not trusted or carried into the editable domain. Project markers are recomputed from validated data. Name, original well-formed Unicode source, and selected normalization are persisted. Normalized output, grapheme/byte arrays, metrics, active tab, mounted search/timer, pending fields, dialogs, and validation messages are derived or transient.

| Field            | Accepted values                                                         |
| ---------------- | ----------------------------------------------------------------------- |
| version, name    | 1; nonblank single-line title up to 80 UTF-16 units                     |
| text             | Well-formed Unicode string, zero to 1000 UTF-16 units; controls allowed |
| normalization    | none, NFC, NFD, NFKC, or NFKD                                           |
| Normalized bound | At most 4096 UTF-16 units after the selected form                       |

Lone surrogates, wrong primitives, unsupported forms/versions, excessive source, and excessive normalized expansion reject candidates. Derived clusters, bytes, offsets, counts, tab state, and filters are rebuilt rather than persisted.

Grapheme CSV includes every cluster in normalized order with one-based number, zero-based UTF-16/UTF-8 offsets, UTF-16 span, all code points, complete byte sequence, a JSON-escaped segment cell, and UN marker. HEX TXT includes counts, normalization, UTF-8/no-BOM rules, zero-based hexadecimal byte offsets, and every byte. Normalized TXT contains exactly the normalized text encoded as UTF-8, without BOM, header, or attribution bytes; its filename retains the marker. JSON preserves original source and selected normalization with recomputed provenance.

Download Blob URLs are revoked after download. Sample restoration uses a native confirmation dialog.

## ◈ Project Markers

- `UN` appears in the wordmark, project metadata, and workspace identity; original favicon/social artwork use a matching emblem.
- `UN-XXXXXXXX` is a deterministic 32-bit content stamp calculated with FNV-1a over UTF-8 canonical workspace JSON, excluding supplied provenance.
- JSON provenance includes the project slug, `CodeSculptor`, and the marker. Downloaded artifacts carry the appropriate identity in filenames and/or metadata/content.
- Markers help identify configurations and artifacts; they are not cryptographic signatures or tamper-proof authorship claims.
- Author metadata and the MIT license retain CodeSculptor attribution.

## 🧭 Extension Notes & Nuances

- Requires modern Intl.Segmenter, String.normalize, and TextEncoder APIs.
- Native grapheme boundaries depend on the runtime’s Unicode implementation; counts can change with its Unicode version.
- Grapheme clusters are text boundaries, not a guarantee of identical visual glyphs across fonts/platforms.
- No Unicode name/category database, confusable detection, language recognition, or font-coverage claims.
- Code-point search is a case-insensitive hexadecimal substring search, with optional U+ prefix.
- Offsets refer to normalized output and use zero-based UTF-16 or byte units explicitly.
- Compatibility forms can change presentation characters and expand source significantly.
- Raw text controls are accepted; CSV escapes them through JSON cells. The exact text export preserves them.
- The visible table and byte preview are limited; complete CSV/HEX/TXT are never truncated to those view limits.
- Switching tabs destroys the search scope. Imports preserve a still-mounted filter; reload returns to Graphemes.
- Extend Unicode validation, normalization bounds, offset calculations, scope cleanup, and byte exports together.

The application and documentation are English. At 320 px panels stack, while larger screens use the shared grid. Scrollable data regions, named native controls, visible focus styles, and a single main landmark remain available across layouts.

## ✅ Build & Checks

```bash
npm run build
npm run format:check
npm test
npx playwright install chromium
npm run test:e2e
```

`build` runs `vue-tsc` before Vite. Native tests use Node’s built-in runner. Playwright starts the current production bundle with the local preview command and does not reuse another server. Build before browser tests so they inspect current output. `npm run format` formats maintained source; dependencies, generated output, lockfiles, and browser artifacts are excluded.

Six native tests verify independent sample counts/offsets, canonical versus compatibility normalization, CRLF clustering, actual customRef coalescing/flush/scope disposal, exact control/byte exports, lone-surrogate and expansion guards, maximum complete reports, and UTF-8 stamps. Four browser workflows inspect real normalized rows and metrics, source preservation, complete-data search beyond row 160, fresh tab DOM and stable frames, rejected imports, independent pending forms, empty output, safe CSV controls, reconstructed HEX bytes, and byte-identical TXT.

Shared browser workflows check valid/failed imports, persistence after reload, provenance downloads, blocked/corrupt storage, confirmed sample restoration, native modal reopening/Escape/focus, real Tailwind grid behavior, named visible controls, and overflow at 320–1440 px. A separate maximum-content case downloads and re-imports the complete escaped JSON workspace at 320 px. These are local production checks, not a deployed Vercel smoke test.

## ▲ Vercel Deployment

1. Import the repository and select this project folder as the Root Directory when deploying from the shared workspace.
2. Use the committed config: `npm ci`, `npm run build`, and output folder `dist`.
3. Check the root page, public sample/artwork, and main editor after deployment.

The explicit `vercel.json` rewrites only `/` to `/index.html` and permanently redirects `/index.html` to `/`. There are no client routes requiring a catch-all rewrite. Declared routes preserve missing-resource behavior. HTML and unhashed public files revalidate; Vite’s hashed JS/CSS/font assets receive one-year immutable caching. All responses include `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin`. The dev command accepts Vercel’s `$PORT` with `--strictPort`.

Used fields, route compilation, and generated asset/cache behavior are checked locally against the [official Vercel configuration schema](https://openapi.vercel.sh/vercel.json). Vite preview does not emulate deployment headers. SVG social artwork is included as an editable source; platforms requiring raster cards need a rendered image and an absolute deployed image URL.

## 📄 License

[MIT](./LICENSE) · Copyright (c) 2026 **CodeSculptor**. Bundled fonts retain separate OFL licenses.
