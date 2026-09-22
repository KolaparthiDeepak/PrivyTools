# PrivyTools — Encryption Tools, Tool Pruning & Accordion Sidebar

**Status:** Implemented
**Date:** 2026-09-22
**Builds on:** `2026-09-09-dev-tools-design.md`, `2026-09-15-home-sidebar-polish-design.md`

## 1. Summary

| Change | What |
|---|---|
| New `Encryption` dev group | `dev-jasypt` (`/dev/jasypt`) and `dev-cipher` (`/dev/cipher`) |
| Removed tools | Case Converter, Slugify, Sort / Dedupe Lines, JSON → TypeScript, HTML Entities, Query String ⇄ JSON (pages, services, tests, routes) |
| Sidebar | Section headings only; one collapsible section open at a time; Developer sub-groups promoted to top-level sections |
| Editor | CodeMirror colours follow app tokens; no active-line band; aligned Input/Output headers; optional soft wrap |

Dev tool count: 15 → 11. Groups: Converters (3), Encoders / Decoders (3),
Encryption (2), Text Utilities (1), Date & Schedule (2).

## 2. Encryption tools

**Library:** `node-forge`. It is synchronous, so it fits the existing
`useDevTransform` (sync `fn(input)`) hook, and it covers DES, 3DES, every AES
mode, MD5, SHA-1/256/384/512 and PBKDF2. WebCrypto was ruled out: it is async
and has no DES or MD5. The library is only loaded by the two encryption routes
(~76KB gzipped chunk). node-forge has no SHA-224, so the Jasypt
`PBEWITHHMACSHA224…` algorithms are left out.

### 2.1 Jasypt (`src/services/dev/jasypt.ts`)

Matches `StandardPBEStringEncryptor`: `encode(salt || iv? || ciphertext)`, with
salt and IV one cipher block long (8 bytes for DES, 16 for AES).

- **PBES2 (AES):** key = PBKDF2-HMAC-SHAx(UTF-8 password, salt, iterations);
  AES-CBC with the prepended random IV. An IV is always needed here: with
  `NoIvGenerator`, Java picks a random IV and throws it away, so the value could
  never be decrypted. The UI forces the IV option on for AES.
- **PBEWithMD5AndDES:** PBKDF1-MD5, key = bytes 0–7, IV = bytes 8–15.
- **PBEWithMD5AndTripleDES:** mirrors JDK 21 `PBES1Core.deriveCipherKey` for
  DESede. The two 4-byte salt halves are hashed separately with the password, and
  the first half is reversed when both halves are equal.
- With `RandomIvGenerator`, Jasypt still prepends 8 IV bytes for MD5 algorithms,
  and Java ignores them; both layouts are supported.
- MD5 algorithms reject non-ASCII passwords, as Java's `PBEKey` does.
- Iterations are limited to 1–1,000,000 so the UI thread can't freeze.

### 2.2 AES / DES Cipher (`src/services/dev/cipher.ts`)

- **Passphrase mode** = `openssl enc`: `Salted__` + 8-byte salt + ciphertext.
  Key derivation: PBKDF2-SHA256 (`-pbkdf2`), PBKDF2-SHA512
  (`-pbkdf2 -md sha512`) or EVP_BytesToKey-MD5 (legacy OpenSSL / CryptoJS).
  GCM is not offered here because `openssl enc` rejects AEAD ciphers.
- **Raw mode:** hex key + IV, with checked lengths. GCM uses a nonce of any
  length (12 bytes typical), and its output is `ciphertext || 16-byte tag`.
- DES / 3DES only offer CBC and ECB (node-forge's limit).

### 2.3 Verification

Tests contain ciphertexts produced by real Jasypt 1.9.3 on JDK 21 (8 algorithm /
IV / encoding combinations) and by `openssl enc` 3.6 / `node:crypto` (GCM). In
the other direction, output from this code was decrypted by real Jasypt (all 12
algorithm × IV combinations) and by `openssl enc -d` while the tools were built.

### 2.4 UI

Both routes put an options grid (`src/components/dev/OptionFields.tsx`:
`SelectField`, `TextField` with show/hide for secrets, `CheckField`) above the
existing `SplitTool`. The `Direction[]` is memoised on the options, so any
option change re-runs the transform. Jasypt opens on Decrypt, the Cipher tool
on Encrypt. Secrets stay in component state only.

## 3. Sidebar accordion (`src/app/Sidebar.tsx`)

- Sections: PDF, Image, Converters, Encoders / Decoders, Encryption, Text
  Utilities, Date & Schedule, Privacy, then Favorites (only if any tool is
  starred). Headings are bold `button`s with `aria-expanded` / `aria-controls`.
- Only one section is open at a time; clicking the open heading closes it.
- The section containing the current route opens on load and on every route
  change (palette, dashboard cards).
- Collapsed (icon-rail) sidebar has no headings, so it lists every tool icon.
- The command palette and dashboard still nest the groups under "Developer";
  only the sidebar changed.

## 4. Editor fixes

- `cmSetup.ts`: the active-line highlight is removed. Selection, cursor and
  matching-bracket colours use `--border-hi` / `--text`, and the focus outline
  is gone. CodeMirror's light-blue defaults showed in both themes.
- `SplitTool`: Input and Output header rows are both `h-8` and the output
  buttons are `size="sm"`, so the two editors start at the same height.
- `CodeEditor` / `SplitTool` accept `wrap` (CodeMirror `lineWrapping`); only the
  encryption tools turn it on, for long Base64 values.

- Syntax colours come from `--syn-key` / `--syn-string` / `--syn-number` /
  `--syn-atom` tokens in `tokens.css` (light and dark values, all >= 4.5:1 on
  `--sunken`) through a custom `HighlightStyle`. This replaces
  `defaultHighlightStyle`, which was designed for light backgrounds and hard to
  read in dark mode.

## 5. Known gaps

- YAML plain values (`privy`, `42`, `true`) are not coloured: the YAML grammar
  does not tell these apart, so they stay in the normal text colour.
