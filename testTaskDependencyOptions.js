/**
 * Dedicated Task Dependency Options Test Suite
 * Tests end-to-end functionality of task dependency options, linking, unlinking,
 * cycle validation, and blocking/unblocking states.
 */

const API = 'http://localhost:5000/api';

async function runTests() {
  console.log("==================================================");
  console.log("🔗 TESTING TASK DEPENDENCY OPTIONS & LINKING SUITE");
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

  // TEST 1: Create a new task with dependencies option
  let res = await fetch(`${API}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_admin' },
    body: JSON.stringify({
      title: "New Integration Test Task",
      priority: "Medium",
      status: "To Do",
      dependencies: ["tsk_001"] // tsk_001 is already Done
    })
  });
  let data = await res.json();
  const newTask = data.data;
  assert(res.status === 201 && newTask.dependencies.includes("tsk_001"), 
    "Task created with dependency option set to 'tsk_001'");
  assert(newTask.isBlocked === false, 
    "Task is not blocked because prerequisite 'tsk_001' is Done");

  // TEST 2: Create a task with an uncompleted dependency (tsk_002 is In Progress)
  res = await fetch(`${API}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_admin' },
    body: JSON.stringify({
      title: "Blocked Dependent Task",
      priority: "Low",
      status: "To Do",
      dependencies: ["tsk_002"]
    })
  });
  data = await res.json();
  const blockedTask = data.data;
  assert(res.status === 201 && blockedTask.isBlocked === true, 
    "Task with incomplete dependency option is marked isBlocked = true");
  assert(blockedTask.blockingTasks.some(b => b.id === "tsk_002"), 
    "Blocking tasks correctly list 'tsk_002'");

  // TEST 3: Attempt to mark blocked task as Done (moving to In Progress first)
  await fetch(`${API}/tasks/${blockedTask.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_admin' },
    body: JSON.stringify({ status: "In Progress" })
  });
  res = await fetch(`${API}/tasks/${blockedTask.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_admin' },
    body: JSON.stringify({ status: "Done" })
  });
  data = await res.json();
  assert(res.status === 400 && data.message.includes("Uncompleted prerequisite dependencies"), 
    "Blocked task cannot be marked Done when dependency option points to incomplete task");

  // TEST 4: Update task dependency option (add multi-dependencies)
  res = await fetch(`${API}/tasks/${blockedTask.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_admin' },
    body: JSON.stringify({ dependencies: ["tsk_001", "tsk_002", "tsk_003"] })
  });
  data = await res.json();
  assert(res.status === 200 && data.data.dependencies.length === 3, 
    "Task dependency option updated to 3 prerequisite dependencies");

  // TEST 5: Cycle detection prevents circular dependencies
  // tsk_002 depends on tsk_001. Trying to make tsk_001 depend on tsk_002 should fail.
  res = await fetch(`${API}/tasks/tsk_001`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_admin' },
    body: JSON.stringify({ dependencies: ["tsk_002"] })
  });
  data = await res.json();
  assert(res.status === 400 && data.message.includes("Circular dependency error"), 
    "Setting cyclical dependency option is rejected with cycle detection error");

  // TEST 6: Remove dependency option (disconnect link)
  res = await fetch(`${API}/tasks/${blockedTask.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_admin' },
    body: JSON.stringify({ dependencies: ["tsk_001"] }) // Only keep tsk_001 (which is Done)
  });
  data = await res.json();
  assert(res.status === 200 && data.data.isBlocked === false, 
    "Removing incomplete dependencies unblocks the task");

  // TEST 7: Graph API includes dependencies on nodes and accurate links
  res = await fetch(`${API}/tasks/graph`);
  data = await res.json();
  const graph = data.data;
  assert(Array.isArray(graph.nodes) && graph.nodes.length >= 6, "Dependency graph returns nodes");
  assert(Array.isArray(graph.links) && graph.links.length > 0, "Dependency graph returns link connections");
  const sampleNode = graph.nodes.find(n => n.id === "tsk_004");
  assert(sampleNode && Array.isArray(sampleNode.dependencies) && sampleNode.dependencies.includes("tsk_002"),
    "Dependency graph nodes include dependency arrays for frontend linking");

  // Clean up test tasks
  await fetch(`${API}/tasks/${newTask.id}`, { method: 'DELETE', headers: { 'x-user-id': 'usr_admin' } });
  await fetch(`${API}/tasks/${blockedTask.id}`, { method: 'DELETE', headers: { 'x-user-id': 'usr_admin' } });

  console.log("==================================================");
  console.log(`TOTAL: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
