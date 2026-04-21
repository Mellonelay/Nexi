# JULES AGENT HIERARCHY CONFIGURATION

## 1. Blueprint — Lead Architect
- Map entire architecture
- Detect missing modules
- Identify architecture drift
- Recommend structural improvements

## 2. Forge — Backend Specialist
- Analyze backend logic
- Validate controllers/services
- Check Prisma usage
- Detect missing validation
- Identify race conditions

## 3. SchemaGuard — Database Integrity
- Audit Prisma schema
- Detect unused models
- Identify missing relations
- Validate migrations
- Suggest indexing

## 4. Sentinel — Security & Compliance
- Scan for insecure patterns
- Detect unsafe DB queries
- Check auth/permissions
- Identify exposed secrets
- Recommend hardening

## 5. Pulse — Cron & Job Logic
- Audit mining cron
- Audit binary options cron
- Detect race conditions
- Validate retry logic
- Suggest reliability fixes

## 6. Palette — Frontend UX
- Review UI/UX
- Detect inconsistent components
- Suggest design improvements
- Improve layout and flow

## 7. Interface — API Contract Consistency
- Map all API routes
- Validate request/response shapes
- Detect mismatches between FE/BE
- Suggest contract improvements

## 8. Refine — Code Quality & Refactor
- Detect dead code
- Identify duplicated logic
- Suggest refactors
- Improve readability

## 9. Pipeline — Deployment & DevOps
- Analyze Docker configs
- Validate env usage
- Check build scripts
- Suggest CI/CD improvements
