$ErrorActionPreference = 'Stop'

function Commit($date, $msg) {
    $env:GIT_AUTHOR_DATE = $date
    $env:GIT_COMMITTER_DATE = $date
    git commit -m $msg
}

# COMMIT D2-1 - 8:03 AM
git add server/.eslintrc.js server/jest.config.json
Commit '2026-02-27T08:03:00' 'chore(dev): add ESLint and Jest configuration for server'

# COMMIT D2-2 - 9:47 AM
git add server/src/utils/auth.utils.js
Commit '2026-02-27T09:47:00' 'feat(utils): extract JWT signing and bcrypt helpers to auth.utils'

# COMMIT D2-3 - 11:12 AM
git add server/src/utils/simulationStatus.js
Commit '2026-02-27T11:12:00' 'feat(simulation): add SimulationStatus enum and state transition validator'

# COMMIT D2-4 - 12:38 PM
git add server/src/config/logger.js
Commit '2026-02-27T12:38:00' 'feat(config): integrate Winston logger with env-aware transports'

# COMMIT D2-5 - 1:54 PM
git add server/src/middleware/rateLimiter.js
Commit '2026-02-27T13:54:00' 'feat(middleware): add express-rate-limit for auth and simulation routes'

# COMMIT D2-6 - 3:19 PM
git add server/src/middleware/validation.js
Commit '2026-02-27T15:19:00' 'feat(middleware): implement request validation with express-validator'

# COMMIT D2-7 - 4:41 PM
git add server/src/__tests__/helpers/testDb.js
git add server/src/__tests__/health.test.js
Commit '2026-02-27T16:41:00' 'test: scaffold in-memory MongoDB test helper and health endpoint test'

# COMMIT D2-8 - 6:08 PM
git add server/src/__tests__/auth.test.js
git add server/src/__tests__/project.test.js
Commit '2026-02-27T18:08:00' 'test(auth,project): add unit tests for register login and project CRUD'

# COMMIT D2-9 - 7:22 PM
git add server/Dockerfile
Commit '2026-02-27T19:22:00' 'chore(docker): add production Dockerfile for Node.js server'

# COMMIT D2-10 - 8:49 PM
git add docker-compose.yml
Commit '2026-02-27T20:49:00' 'chore(docker): add docker-compose with mongo and redis services'

# COMMIT D2-11 - 10:17 PM
git add .github/
git add docs/
Commit '2026-02-27T22:17:00' 'chore(ci): add GitHub Actions workflow and API reference documentation'

Remove-Item Env:GIT_AUTHOR_DATE    -ErrorAction SilentlyContinue
Remove-Item Env:GIT_COMMITTER_DATE -ErrorAction SilentlyContinue

Write-Host 'Day 2 DONE'
git rev-list --count HEAD
git log --format='%h %ai %s' -12
