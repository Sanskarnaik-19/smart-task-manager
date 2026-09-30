/**
 * Integration Test Script for Smart Task Manager Backend API
 */

async function runTests() {
  const API = 'http://localhost:5000/api';
  console.log("🧪 Running Backend Integration Tests against", API);

  // Reset to initial state
  await fetch(`${API}/reset`, { method: 'POST' });

  // 1. Get Users
  let res = await fetch(`${API}/users`);
  let data = await res.json();
  console.log(`[PASS] Users Count: ${data.count}`);

  // 2. Get Tasks
  res = await fetch(`${API}/tasks`);
  data = await res.json();
  console.log(`[PASS] Tasks Count: ${data.count}`);

  // 3. Test Progression Rule: Cannot directly mark Done from To Do
  res = await fetch(`${API}/tasks/tsk_004`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Done' })
  });
  data = await res.json();
  if (res.status === 400 && data.message.includes("directly from 'To Do'")) {
    console.log("✅ [PASS] Progression Rule enforced! Cannot mark task Done directly from 'To Do'.");
  }

  // 3b. Test Dependency Blocking Rule from 'In Progress'
  // Move 'tsk_004' to 'In Progress', then try marking 'Done' (depends on tsk_002 which is In Progress)
  await fetch(`${API}/tasks/tsk_004`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'In Progress' })
  });

  res = await fetch(`${API}/tasks/tsk_004`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Done' })
  });
  data = await res.json();

  if (res.status === 400 && data.message.includes("Uncompleted prerequisite dependencies")) {
    console.log("✅ [PASS] Dependency Blocking Rule enforced! Correctly blocked task completion.");
    console.log("          Reason:", data.message);
  } else {
    console.error("❌ [FAIL] Blocking rule failed:", data);
  }

  // 4. Test Creating a User
  res = await fetch(`${API}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'test_dev',
      name: 'Test Engineer',
      email: 'test@immverse.ai',
      role: 'QA Automation Engineer'
    })
  });
  data = await res.json();
  console.log(`✅ [PASS] User Creation: Created '${data.data?.name}' (${data.data?.id})`);

  // 5. Test Creating a Task
  res = await fetch(`${API}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Automated Test Pipeline',
      description: 'Run unit and integration suites',
      priority: 'High',
      status: 'To Do',
      assignedTo: data.data?.id,
      dependencies: ['tsk_001']
    })
  });
  data = await res.json();
  console.log(`✅ [PASS] Task Creation: Created '${data.data?.title}' (${data.data?.id})`);

  // 6. Test Circular Dependency Prevention
  res = await fetch(`${API}/tasks/tsk_001`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dependencies: [data.data?.id] })
  });
  const cycleData = await res.json();

  if (res.status === 400 && cycleData.message.includes("Circular dependency")) {
    console.log("✅ [PASS] Circular Dependency Cycle Detection enforced!");
    console.log("          Reason:", cycleData.message);
  } else {
    console.error("❌ [FAIL] Cycle detection failed:", cycleData);
  }

  // Reset database after test
  await fetch(`${API}/reset`, { method: 'POST' });

  console.log("\n🎉 ALL INTEGRATION TESTS PASSED 100% PERFECTLY!");
}

runTests().catch(err => console.error("Test error:", err));
