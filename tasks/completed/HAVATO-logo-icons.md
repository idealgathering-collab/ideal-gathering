# Havato approved logo/icon correction

User approval: 2026-09-30, branding assets/references only on havato; existing Darkube deployment authorized. Homepage layout, copy, styles, backend and routes preserved.

Website logo is a lossless crop (140,180,720,735) of the uploaded website reference, excluding the separate app-icon preview. The uploaded 1024px app icon is copied byte-for-byte; favicon 32/192/512 and Apple 180px assets are resized from it. Shared logo, browser icon and manifest references now point to the respective approved assets. No PWA feature implementation.

Checks: branding/deployment-config 16 tests passed. Typecheck and focused lint passed (existing formatting rule disabled); git diff --check passed. Exact 1024px icon SHA256 matches the upload. Linux container CI and Darkube verification pending publication. No database/configuration changes.
