const request = require('supertest');
const app = require('../../src/app');
const { connect, closeDatabase, clearDatabase } = require('./helpers/testDb');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('Project Routes', () => {
    let token;

    beforeEach(async () => {
        const res = await request(app).post('/api/auth/register').send({
            username: 'projuser', email: 'proj@example.com', password: 'Password123!',
        });
        token = res.body.token;
    });

    it('POST /api/projects should create a project', async () => {
        const res = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'My Simulation', description: 'Test project' });
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('_id');
    });

    it('GET /api/projects should return list', async () => {
        const res = await request(app)
            .get('/api/projects')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
