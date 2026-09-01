# Inventory Policy

The canonical registry is the user's complete skill inventory plus skills explicitly confirmed as installed in ChatGPT Work.

The inventory snapshot supplied for this design reported 668 registry entries, 660 unique names, and no orchestrator-owned skill. The new router fills that orchestration gap without replacing domain skills.

## Admission states

- INSTALLED_INVENTORY: exact inventory match.
- INSTALLED_CONFIRMED: exact skill/package confirmed by user/runtime, e.g. Addy Osmani pack.
- CANDIDATE: discovered externally but not available for routing.
- CAPABILITY_GAP: required job has no admitted skill.

Never promote CANDIDATE to INSTALLED without current evidence.

## Duplicate handling

Same-name skills from different authorities are not interchangeable. Resolve by exact authority/package and prefer the explicitly intended authority for the current environment.
