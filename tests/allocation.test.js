const request = require('supertest');
const app = require('../src/app');
const sequelize = require('../src/models/index');

describe('Student API', () => {
  beforeAll(async () => {
    // Define models before syncing
    require('../src/models/Student');
    require('../src/models/Room');
    require('../src/models/Allocation');
    
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should register a student', async () => {
    const res = await request(app).post('/student').send({
      name: 'John Doe',
      email: 'john@example.com'
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('id');
  });

  it('should get all rooms', async () => {
    const res = await request(app).get('/admin/rooms');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should create a room', async () => {
    const res = await request(app).post('/admin/rooms').send({
      roomNumber: '101',
      capacity: 2
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('id');
  });

  it('should allocate room to student', async () => {
    const studentRes = await request(app).post('/student').send({
      name: 'Jane Doe',
      email: 'jane@example.com'
    });
    const studentId = studentRes.body.id;

    const roomRes = await request(app).post('/admin/rooms').send({
      roomNumber: '102',
      capacity: 2
    });
    const roomId = roomRes.body.id;

    const allocationRes = await request(app).post('/student/allocate').send({
      studentId: studentId,
      roomId: roomId
    });
    expect(allocationRes.statusCode).toEqual(200);
    expect(allocationRes.body).toHaveProperty('message');
  });
});
