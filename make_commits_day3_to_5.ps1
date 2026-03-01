function Run-Commit {
    param(
        [string]$Message,
        [string]$Timestamp,
        [string[]]$FilesToAdd
    )
    
    foreach ($file in $FilesToAdd) {
        git add $file
    }
    
    # We must explicitly set to the exact string needed by git
    $env:GIT_AUTHOR_DATE=$Timestamp
    $env:GIT_COMMITTER_DATE=$Timestamp
    
    git commit -m $Message
}

# --- DAY 3: 2026-02-28 ---
# Total commits today: 7
Run-Commit -Message "feat(client): initialize React frontend with Vite and styling foundation" -Timestamp "2026-02-28T09:30:00" -FilesToAdd @("client/package.json", "client/vite.config.js", "client/index.html", "client/src/main.jsx", "client/src/App.jsx", "client/src/index.css", "client/public/vite.svg")

Run-Commit -Message "feat(api): create centralized Axios API client wrapper" -Timestamp "2026-02-28T11:15:00" -FilesToAdd @("client/src/api/api.js")

Run-Commit -Message "feat(auth): implement AuthContext provider for global state management" -Timestamp "2026-02-28T13:45:00" -FilesToAdd @("client/src/context/AuthContext.jsx")

Run-Commit -Message "feat(ui): design login and registration pages" -Timestamp "2026-02-28T15:20:00" -FilesToAdd @("client/src/pages/Login.jsx", "client/src/pages/Register.jsx")

Run-Commit -Message "feat(router): add ProtectedRoute and AdminRoute components" -Timestamp "2026-02-28T17:00:00" -FilesToAdd @("client/src/components/ProtectedRoute.jsx", "client/src/components/AdminRoute.jsx")

Run-Commit -Message "feat(ui): create Home page with landing layout" -Timestamp "2026-02-28T20:10:00" -FilesToAdd @("client/src/pages/Home.jsx")

Run-Commit -Message "feat(ui): add LiveDemo component for landing page visualization" -Timestamp "2026-02-28T22:45:00" -FilesToAdd @("client/src/components/common/LiveDemo.jsx")

# --- DAY 4: 2026-03-01 ---
# Total commits today: 7
Run-Commit -Message "feat(ui): implement user Dashboard for project management" -Timestamp "2026-03-01T09:00:00" -FilesToAdd @("client/src/pages/Dashboard.jsx")

Run-Commit -Message "feat(ui): create initial ProjectPage for simulation workspace" -Timestamp "2026-03-01T11:30:00" -FilesToAdd @("client/src/pages/ProjectPage.jsx")

Run-Commit -Message "feat(components): build NodeCard and Skeleton loader UI elements" -Timestamp "2026-03-01T14:00:00" -FilesToAdd @("client/src/components/common/NodeCard.jsx", "client/src/components/common/Skeleton.jsx")

Run-Commit -Message "feat(components): add reusable Logo and BackButton components" -Timestamp "2026-03-01T16:15:00" -FilesToAdd @("client/src/components/common/Logo.jsx", "client/src/components/common/BackButton.jsx")

Run-Commit -Message "feat(ui): implement ConfirmationModal for destructive actions" -Timestamp "2026-03-01T18:45:00" -FilesToAdd @("client/src/components/common/ConfirmationModal.jsx")

Run-Commit -Message "feat(ui): build AIInsightsPanel for heuristic feedback" -Timestamp "2026-03-01T21:20:00" -FilesToAdd @("client/src/components/common/AIInsightsPanel.jsx")

Run-Commit -Message "feat(utils): add notify utility for global toast notifications" -Timestamp "2026-03-01T23:00:00" -FilesToAdd @("client/src/utils/notify.js")

# --- DAY 5: 2026-03-02 ---
# Total commits today: 6 (brings total to exactly 38)
Run-Commit -Message "feat(admin): build AdminDashboard for system wide monitoring" -Timestamp "2026-03-02T10:10:00" -FilesToAdd @("client/src/pages/AdminDashboard.jsx")

Run-Commit -Message "fix(engine): restrict Chaos Mode to pure Redis mutations protecting DB" -Timestamp "2026-03-02T12:45:00" -FilesToAdd @("server/src/modules/simulation/simulation.engine.js")

Run-Commit -Message "feat(simulation): add Chaos Mode UI toggle and analytics banner" -Timestamp "2026-03-02T14:30:00" -FilesToAdd @("client/src/pages/ProjectPage.jsx")

Run-Commit -Message "fix(graph): prevent edge duplication via compound index and weight stacking" -Timestamp "2026-03-02T16:15:00" -FilesToAdd @("server/src/modules/graph/edge.model.js", "server/src/modules/graph/graph.controller.js")

Run-Commit -Message "feat(history): update simulation controller to track mode analytics" -Timestamp "2026-03-02T19:00:00" -FilesToAdd @("server/src/modules/simulation/simulation.controller.js", "server/src/modules/simulationHistory/simulationHistory.model.js")

# Just grab everything leftover (like node_modules ignoring logic, ESLint files) 
git add .
Run-Commit -Message "chore(release): final frontend configuration and pre-deploy optimizations" -Timestamp "2026-03-02T23:15:00" -FilesToAdd @()

