require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });

const http = require('http');
const app = require('../backend/dist/app').default;

const server = http.createServer(app);

function request(port, { method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const reqHeaders = Object.assign({}, headers);
    if (postData) {
      reqHeaders['content-type'] = 'application/json';
      reqHeaders['content-length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed = data;
          try {
            parsed = JSON.parse(data);
          } catch (e) {}
          resolve({ statusCode: res.statusCode, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  console.log(`\n🏥 Hospital Queue Management System - Automated Test Suite`);
  console.log(`Running on ephemeral port ${port}...\n`);

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
    }
  }

  try {
    // 1. Health
    const health = await request(port, { method: 'GET', path: '/health' });
    assert(health.statusCode === 200 && health.body.status === 'OK', 'GET /health returns 200 OK');

    // 2. Auth Login
    const login = await request(port, {
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'doctor@hospital.com', password: 'password123' },
    });
    assert(login.statusCode === 200 && login.body.success === true, 'POST /api/auth/login succeeds for seeded doctor');
    const doctorToken = login.body.data?.token;

    // 3. Auth Me
    const me = await request(port, {
      method: 'GET',
      path: '/api/auth/me',
      headers: { authorization: `Bearer ${doctorToken}` },
    });
    assert(me.statusCode === 200 && me.body.data?.role === 'DOCTOR', 'GET /api/auth/me returns DOCTOR role');

    // 4. Patients
    const patients = await request(port, {
      method: 'GET',
      path: '/api/patient/all',
      headers: { authorization: `Bearer ${doctorToken}` },
    });
    assert(patients.statusCode === 200 && Array.isArray(patients.body.data), 'GET /api/patient/all returns patients');

    // 5. Live Queue
    const liveQueue = await request(port, {
      method: 'GET',
      path: '/api/queue/live/1',
      headers: { authorization: `Bearer ${doctorToken}` },
    });
    assert(liveQueue.statusCode === 200 && liveQueue.body.data?.doctor_name, 'GET /api/queue/live/:id returns queue data');

    // 6. Generate Token
    const genToken = await request(port, {
      method: 'POST',
      path: '/api/queue/generate',
      headers: { authorization: `Bearer ${doctorToken}` },
      body: { patient_id: '1', doctor_id: '1', token_type: 'Walk-in' },
    });
    assert(genToken.statusCode === 201 && genToken.body.data?.token_code, 'POST /api/queue/generate issues valid token code');

    // 7. Call Next
    const callNext = await request(port, {
      method: 'POST',
      path: '/api/queue/call-next',
      headers: { authorization: `Bearer ${doctorToken}` },
      body: { doctor_id: '1' },
    });
    assert(callNext.statusCode === 200, 'POST /api/queue/call-next advances queue');

    // 8. Admin Command Center
    const adminLogin = await request(port, {
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'admin@hospital.com', password: 'password123' },
    });
    const adminToken = adminLogin.body.data?.token;

    const commandCenter = await request(port, {
      method: 'GET',
      path: '/api/admin/command-center',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert(commandCenter.statusCode === 200 && commandCenter.body.data?.total_patients_today !== undefined, 'GET /api/admin/command-center returns metrics');

    // 9. RBAC Protection
    const forbidden = await request(port, {
      method: 'GET',
      path: '/api/admin/command-center',
      headers: { authorization: `Bearer ${doctorToken}` },
    });
    assert(forbidden.statusCode === 403, 'RBAC prevents non-admin from accessing admin endpoints (403)');

    console.log(`\nResults: ${passed}/${total} tests passed.`);
  } catch (err) {
    console.error('Fatal error during test run:', err);
  } finally {
    server.close();
    process.exit(passed === total ? 0 : 1);
  }
});
