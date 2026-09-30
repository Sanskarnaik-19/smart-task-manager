/**
 * Test Suite: Role-Based Task Access and Completion Permissions
 * 
 * Tests:
 * 1. Admin creates task assigned to Rahul -> Rahul can see it
 * 2. Admin creates task assigned to Rahul -> Priya cannot see it
 * 3. Priya tries to access Rahul's task directly using its task ID -> Rejected (403)
 * 4. Priya tries to complete Rahul's task -> Rejected by backend (403)
 * 5. Rahul tries to complete Rahul's task -> Allowed when prerequisites are met
 * 6. Admin views task list -> All tasks are visible
 * 7. Member views task list -> Only their assigned tasks are visible
 * 8. Member tries to change assignee of their task -> Rejected (403)
 * 9. Member tries to assign task to another user on creation -> Rejected (403)
 * 10. Dependency and priority rules continue to work normally
 */

const API = 'http://localhost:5000/api';

async function runTests() {
  console.log("==================================================");
  console.log("🛡️ TESTING ROLE-BASED ACCESS & PERMISSION SUITE");
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

  // Reset database
  await fetch(`${API}/reset`, { method: 'POST' });

  // TEST 1: Admin views the task list -> all tasks are visible (6 tasks)
  let res = await fetch(`${API}/tasks`, {
    headers: { 'x-user-id': 'usr_admin' }
  });
  let data = await res.json();
  assert(res.status === 200 && data.count === 6, "Admin views the task list -> all tasks are visible", `Got count: ${data.count}`);

  // TEST 2: Member Rahul views task list -> only tasks assigned to Rahul are visible (tsk_002, tsk_004)
  res = await fetch(`${API}/tasks`, {
    headers: { 'x-user-id': 'usr_rahul' }
  });
  data = await res.json();
  const allRahul = data.data.every(t => t.assignedTo === 'usr_rahul');
  assert(res.status === 200 && data.count === 2 && allRahul, 
    "Member Rahul views task list -> only Rahul's tasks are visible", 
    `Count: ${data.count}, titles: ${data.data.map(t => t.title).join(', ')}`);

  // TEST 3: Member Priya views task list -> only tasks assigned to Priya are visible (tsk_003, tsk_005)
  res = await fetch(`${API}/tasks`, {
    headers: { 'x-user-id': 'usr_priya' }
  });
  data = await res.json();
  const allPriya = data.data.every(t => t.assignedTo === 'usr_priya');
  assert(res.status === 200 && data.count === 2 && allPriya, 
    "Member Priya views task list -> only Priya's tasks are visible",
    `Count: ${data.count}, titles: ${data.data.map(t => t.title).join(', ')}`);

  // TEST 4: Admin creates a task and assigns it to Rahul
  res = await fetch(`${API}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_admin' },
    body: JSON.stringify({
      title: "Task Assigned by Admin to Rahul",
      priority: "High",
      status: "In Progress",
      assignedTo: "usr_rahul"
    })
  });
  data = await res.json();
  const newTaskId = data.data?.id;
  assert(res.status === 201 && data.data?.assignedTo === 'usr_rahul', 
    "Admin creates a task and assigns it to Rahul");

  // TEST 5: Rahul can see the newly assigned task
  res = await fetch(`${API}/tasks`, {
    headers: { 'x-user-id': 'usr_rahul' }
  });
  data = await res.json();
  const rahulSeesIt = data.data.some(t => t.id === newTaskId);
  assert(rahulSeesIt, "Admin creates a task and assigns it to Rahul -> Rahul can see it");

  // TEST 6: Priya CANNOT see the newly assigned task in her task list
  res = await fetch(`${API}/tasks`, {
    headers: { 'x-user-id': 'usr_priya' }
  });
  data = await res.json();
  const priyaSeesIt = data.data.some(t => t.id === newTaskId);
  assert(!priyaSeesIt, "Admin creates a task and assigns it to Rahul -> Priya cannot see it");

  // TEST 7: Priya tries to access Rahul's task directly using its task ID -> Rejected (403)
  res = await fetch(`${API}/tasks/${newTaskId}`, {
    headers: { 'x-user-id': 'usr_priya' }
  });
  data = await res.json();
  assert(res.status === 403 && data.message.includes("Access denied"), 
    "Priya tries to access Rahul's task directly using its task ID -> rejected by backend (403)");

  // TEST 8: Priya tries to complete Rahul's task -> Rejected by backend (403)
  res = await fetch(`${API}/tasks/${newTaskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_priya' },
    body: JSON.stringify({ status: 'Done' })
  });
  data = await res.json();
  assert(res.status === 403 && data.message.includes("Access denied"), 
    "Priya tries to complete Rahul's task -> rejected by backend (403)", data.message);

  // TEST 9: Rahul can mark Rahul's task as Done (since it's assigned to Rahul, In Progress, no blockers)
  res = await fetch(`${API}/tasks/${newTaskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_rahul' },
    body: JSON.stringify({ status: 'Done' })
  });
  data = await res.json();
  assert(res.status === 200 && data.data?.status === 'Done', 
    "Rahul tries to complete Rahul's task -> allowed when dependencies are satisfied");

  // TEST 10: Member Rahul cannot change the assignee of his task
  res = await fetch(`${API}/tasks/tsk_002`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_rahul' },
    body: JSON.stringify({ assignedTo: 'usr_priya' })
  });
  data = await res.json();
  assert(res.status === 403 && data.message.includes("cannot change the assignee"), 
    "A member cannot change the assignee of their task -> rejected by backend (403)");

  // TEST 11: Member Priya cannot create a task assigned to someone else
  res = await fetch(`${API}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_priya' },
    body: JSON.stringify({
      title: "Priya Sneaky Task",
      priority: "Medium",
      status: "To Do",
      assignedTo: "usr_rahul"
    })
  });
  data = await res.json();
  assert(res.status === 403 && data.message.includes("cannot assign tasks to other users"), 
    "A member cannot assign tasks to other users upon creation -> rejected (403)");

  // TEST 12: Dependency and priority rules continue to work normally:
  // tsk_002 is assigned to Rahul (High, In Progress). tsk_003 is assigned to Priya (Medium, In Progress).
  // When Priya tries to mark tsk_003 Done, High priority tsk_002 is still pending!
  // Backend must enforce priority rule!
  res = await fetch(`${API}/tasks/tsk_003`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_priya' },
    body: JSON.stringify({ status: 'Done' })
  });
  data = await res.json();
  assert(res.status === 400 && data.message.includes("High priority"), 
    "Priority rules continue to work normally (Medium task blocked by pending High task)");

  // Clean reset at end
  await fetch(`${API}/reset`, { method: 'POST' });

  console.log("\n==================================================");
  console.log(`TOTAL: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
