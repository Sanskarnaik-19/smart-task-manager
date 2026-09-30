/**
 * End-to-End HTTP Dependency Suite
 */

async function runHttpDependencyTests() {
  const API = 'http://localhost:5000/api';
  console.log("==================================================");
  console.log("🧪 RUNNING END-TO-END HTTP DEPENDENCY TEST SUITE");
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

  // Reset to initial state
  await fetch(`${API}/reset`, { method: 'POST' });

  // TEST 1: Blocked task cannot be marked Done from In Progress
  // Move tsk_004 to In Progress first (respecting progression rule)
  await fetch(`${API}/tasks/tsk_004`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'In Progress' })
  });

  // tsk_004 depends on tsk_002 (In Progress) and tsk_003 (In Progress)
  let res = await fetch(`${API}/tasks/tsk_004`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Done' })
  });
  let data = await res.json();
  assert(res.status === 400 && data.message.includes("Uncompleted prerequisite dependencies"), 
    "Enforces Blocking Rule (Task 4 cannot be marked Done while Task 2 is In Progress)");

  // TEST 2: Complete prerequisite Task 2 and Task 3
  res = await fetch(`${API}/tasks/tsk_002`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Done' })
  });
  assert(res.status === 200, "Mark prerequisite Task 2 as Done");

  res = await fetch(`${API}/tasks/tsk_003`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Done' })
  });
  assert(res.status === 200, "Mark prerequisite Task 3 as Done");

  // Verify tsk_004 is now unblocked
  res = await fetch(`${API}/tasks/tsk_004`);
  data = await res.json();
  assert(data.data.isBlocked === false, "Task 4 is automatically unblocked after prerequisites are Done");

  // TEST 3: Now Task 4 (which is In Progress) can be completed
  res = await fetch(`${API}/tasks/tsk_004`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Done' })
  });
  data = await res.json();
  assert(res.status === 200 && data.data.status === 'Done', "Task 4 successfully marked as Done");

  // TEST 4: Cascade Reopen: Reopening Task 2 reopens downstream Task 4
  res = await fetch(`${API}/tasks/tsk_002`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'In Progress' })
  });
  data = await res.json();
  assert(res.status === 200, "Reopen prerequisite Task 2 back to In Progress");

  // Verify Task 4 is now reopened to 'In Progress' and is marked blocked
  res = await fetch(`${API}/tasks/tsk_004`);
  data = await res.json();
  assert(data.data.status === 'In Progress', "Task 4 was cascade-reopened to 'In Progress'");
  assert(data.data.isBlocked === true, "Task 4 is now correctly marked as blocked again");

  // TEST 5: Direct Circular Dependency Prevention (tsk_001 -> tsk_002 while tsk_002 -> tsk_001)
  res = await fetch(`${API}/tasks/tsk_001`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dependencies: ['tsk_002'] })
  });
  data = await res.json();
  assert(res.status === 400 && data.message.includes("Circular dependency"), 
    "Prevents direct 2-task circular dependency (Task 1 -> Task 2 -> Task 1)");

  // TEST 6: Indirect Circular Dependency Prevention (tsk_001 -> tsk_005 while tsk_005 -> tsk_004 -> tsk_002 -> tsk_001)
  res = await fetch(`${API}/tasks/tsk_001`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dependencies: ['tsk_005'] })
  });
  data = await res.json();
  assert(res.status === 400 && data.message.includes("Circular dependency"), 
    "Prevents multi-hop indirect circular dependency loop");

  // TEST 7: Cannot create task with incomplete prerequisites as 'Done'
  res = await fetch(`${API}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'New Dependent Task',
      status: 'Done',
      dependencies: ['tsk_002']
    })
  });
  data = await res.json();
  assert(res.status === 400, 
    "Cannot create a brand new task directly as 'Done'");

  // TEST 8: Cascade cleanup on delete
  res = await fetch(`${API}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Temporary Prerequisite', status: 'In Progress' })
  });
  const tmpTask = (await res.json()).data;

  res = await fetch(`${API}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Follower Task', status: 'To Do', dependencies: [tmpTask.id] })
  });
  const followerTask = (await res.json()).data;
  assert(followerTask.dependencies.includes(tmpTask.id), "Follower task depends on temporary task");

  // Delete temporary task
  await fetch(`${API}/tasks/${tmpTask.id}`, { method: 'DELETE' });

  // Verify follower task had its dependency cleaned up
  res = await fetch(`${API}/tasks/${followerTask.id}`);
  data = await res.json();
  assert(!data.data.dependencies.includes(tmpTask.id), 
    "Deleting prerequisite task automatically purges ID from downstream dependencies");

  // Clean up follower
  await fetch(`${API}/tasks/${followerTask.id}`, { method: 'DELETE' });

  // TEST 9: Graph API verification
  res = await fetch(`${API}/tasks/graph`);
  data = await res.json();
  assert(data.success && data.data.nodes.length > 0 && data.data.links.length > 0, "Graph API returns nodes and links");
  assert(data.data.links[0].sourceTitle !== undefined, "Graph API links contain readable source titles");

  // Reset to clean seed data
  await fetch(`${API}/reset`, { method: 'POST' });

  console.log("\n==================================================");
  console.log(`TOTAL: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");
}

runHttpDependencyTests().catch(err => console.error("HTTP test error:", err));
