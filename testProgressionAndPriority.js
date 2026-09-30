/**
 * Integration Test for Progression (To Do -> In Progress -> Done)
 * and Priority (High must complete before Medium/Low) Rules
 */

async function runTests() {
  const API = 'http://localhost:5000/api';
  console.log("==================================================");
  console.log("🧪 TESTING PROGRESSION & PRIORITY ENFORCEMENT");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}: ${details}`);
      failed++;
    }
  }

  // 1. Reset database
  await fetch(`${API}/reset`, { method: 'POST' });

  // Verify initial seed state: No medium/low task is Done while high tasks are incomplete
  let res = await fetch(`${API}/tasks`);
  let tasks = (await res.json()).data;
  const doneMediumOrLow = tasks.filter(t => (t.priority === 'Medium' || t.priority === 'Low') && t.status === 'Done');
  assert(doneMediumOrLow.length === 0, "Initial seed data: No Medium/Low tasks are marked Done prematurely");

  // 2. Test Progression Rule: Cannot jump directly from 'To Do' to 'Done'
  // tsk_004 is currently 'To Do'
  res = await fetch(`${API}/tasks/tsk_004`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Done' })
  });
  let data = await res.json();
  assert(res.status === 400 && data.message.includes("directly from 'To Do'"), 
    "Enforces Progression: Cannot mark task Done directly from 'To Do'");

  // 3. Test Priority Rule: Cannot mark Medium task Done while High task is incomplete
  // tsk_003 is Medium, In Progress, and has no pending prerequisites, but High task tsk_002 is incomplete
  res = await fetch(`${API}/tasks/tsk_003`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Done' })
  });
  data = await res.json();
  assert(res.status === 400 && data.message.includes("High priority tasks must be completed first"), 
    "Enforces Priority Precedence: Medium task cannot be marked Done before independent High tasks are Done");

  // 4. Test New Task Creation: Cannot create new task directly as Done
  res = await fetch(`${API}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Premature Done Task',
      priority: 'High',
      status: 'Done'
    })
  });
  data = await res.json();
  assert(res.status === 400 && data.message.includes("directly as 'Done'"), 
    "Enforces New Task Rule: Cannot create brand new task directly as 'Done'");

  // 5. Complete workflow in correct priority and progression order:
  // Step A: Mark tsk_002 (High, In Progress) -> Done
  res = await fetch(`${API}/tasks/tsk_002`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Done' })
  });
  assert(res.status === 200, "High task tsk_002 completed successfully");

  // Step B: Mark tsk_003 (Medium, In Progress, prerequisite for tsk_004) -> Done
  res = await fetch(`${API}/tasks/tsk_003`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Done' })
  });
  assert(res.status === 200, "Prerequisite task tsk_003 completed to unblock tsk_004");

  // Step C: Move tsk_004 (High) from 'To Do' to 'In Progress'
  res = await fetch(`${API}/tasks/tsk_004`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'In Progress' })
  });
  assert(res.status === 200, "High task tsk_004 moved to In Progress");

  // Step D: Mark tsk_004 (High) -> Done
  res = await fetch(`${API}/tasks/tsk_004`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Done' })
  });
  data = await res.json();
  assert(res.status === 200 && data.data.status === 'Done', "High task tsk_004 marked as Done");

  // Step E: Now all High tasks are Done. Move Medium task tsk_005 to In Progress, then mark Done
  await fetch(`${API}/tasks/tsk_005`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'In Progress' })
  });
  res = await fetch(`${API}/tasks/tsk_005`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Done' })
  });
  data = await res.json();
  assert(res.status === 200 && data.data && data.data.status === 'Done', 
    "Medium task tsk_005 completed after all High tasks are Done");

  // Clean reset
  await fetch(`${API}/reset`, { method: 'POST' });

  console.log("\n==================================================");
  console.log(`TOTAL: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");
}

runTests().catch(err => console.error("Test error:", err));
