const request = require('supertest');
const app = require('../../src/app');
const { connect, closeDatabase, clearDatabase } = require('./helpers/testDb');

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe('Auth Routes', () => {
    const user = { username: 'testuser', email: 'test@example.com', password: 'Password123!' };

    it('POST /api/auth/register should create a new user', async () => {
        const res = await request(app).post('/api/auth/register').send(user);
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('token');
    });

    it('POST /api/auth/login should authenticate user', async () => {
        await request(app).post('/api/auth/register').send(user);
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: user.email, password: user.password });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    it('wrong password should return 401', async () => {
        await request(app).post('/api/auth/register').send(user);
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: user.email, password: 'wrongpassword' });
        expect(res.statusCode).toBe(401);
    });
});
