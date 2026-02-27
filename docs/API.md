# API Reference

## Base URL
`http://localhost:5000/api`

## Auth
All protected routes require: `Authorization: Bearer <token>`

---

## Auth Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login and get token |
| GET | `/auth/me` | Protected | Get current user |

## Project Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/projects` | Protected | List all projects |
| POST | `/projects` | Protected | Create project |
| GET | `/projects/:id` | Protected | Get project |
| PUT | `/projects/:id` | Protected | Update project |
| DELETE | `/projects/:id` | Protected | Delete project |

## Graph Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/projects/:id/graph` | Protected | Get nodes + edges |
| POST | `/projects/:id/nodes` | Protected | Add node |
| PUT | `/projects/:id/nodes/:nodeId` | Protected | Update node |
| DELETE | `/projects/:id/nodes/:nodeId` | Protected | Remove node |
| POST | `/projects/:id/edges` | Protected | Add edge |
| DELETE | `/projects/:id/edges/:edgeId` | Protected | Remove edge |

## Simulation Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/projects/:id/simulate/start` | Protected | Start simulation |
| POST | `/projects/:id/simulate/stop` | Protected | Stop simulation |
| GET | `/projects/:id/simulate/status` | Protected | Get state |

## AI Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/projects/:id/ai/analyze` | Protected | Run AI analysis |

## Admin Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/admin/users` | Admin | List all users |
| DELETE | `/admin/users/:id` | Admin | Delete user |
| GET | `/admin/stats` | Admin | System stats |
