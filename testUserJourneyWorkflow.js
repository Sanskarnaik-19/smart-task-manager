/**
 * Complete User Journey Workflow Test
 * Verifies To Do -> In Progress -> Done transitions, priority queue,
 * unblocking of dependencies, and immediate persistence.
 */

const API = 'http://localhost:5000/api';

async function runJourney() {
  console.log("==================================================");
  console.log("🚀 SIMULATING COMPLETE USER WORKFLOW JOURNEY");
  console.log("==================================================");

  // 1. Reset database to initial state
  await fetch(`${API}/reset`, { method: 'POST' });
  console.log("1. Database reset to clean seed data.");

  // 2. Query next eligible task
  let res = await fetch(`${API}/tasks/next-eligible`);
  let data = await res.json();
  console.log(`2. Next eligible task: '${data.data.title}' [Priority: ${data.data.priority}, Status: ${data.data.status}]`);
  if (data.data.id !== 'tsk_002') throw new Error("Expected tsk_002 to be next eligible task!");

  // 3. Attempt to jump Task 4 directly from To Do to Done
  res = await fetch(`${API}/tasks/tsk_004`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Done' })
  });
  data = await res.json();
  console.log(`3. Direct jump 'To Do' -> 'Done' rejected as expected: HTTP ${res.status} ("${data.message}")`);
  if (res.status !== 400) throw new Error("Should reject direct jump from To Do to Done");

  // 4. Complete Task 2 (High, In Progress)
  res = await fetch(`${API}/tasks/tsk_002`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Done' })
  });
  data = await res.json();
  console.log(`4. Task 2 completed: status is now '${data.data.status}'`);
  if (data.data.status !== 'Done') throw new Error("Task 2 should be Done");

  // 5. Query next eligible task
  // Task 4 is High, BUT it is blocked by Task 3 (Medium).
  // Therefore, system MUST select Task 3 (Medium, In Progress) as next eligible!
  res = await fetch(`${API}/tasks/next-eligible`);
  data = await res.json();
  console.log(`5. Next eligible task: '${data.data.title}' [Priority: ${data.data.priority}, Status: ${data.data.status}]`);
  if (data.data.id !== 'tsk_003') throw new Error("Expected tsk_003 to be next eligible task because tsk_004 is blocked!");

  // 6. Complete Task 3 (Medium, In Progress)
  res = await fetch(`${API}/tasks/tsk_003`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Done' })
  });
  data = await res.json();
  console.log(`6. Task 3 completed: status is now '${data.data.status}'`);
  if (data.data.status !== 'Done') throw new Error("Task 3 should be Done");

  // 7. Query next eligible task
  // Now Task 4's prerequisites (Task 2 & Task 3) are both Done!
  // Task 4 (High, To Do) is unblocked and is now the next eligible task!
  res = await fetch(`${API}/tasks/next-eligible`);
  data = await res.json();
  console.log(`7. Next eligible task: '${data.data.title}' [Priority: ${data.data.priority}, Status: ${data.data.status}]`);
  if (data.data.id !== 'tsk_004') throw new Error("Expected tsk_004 to be next eligible task!");

  // 8. Progress Task 4: To Do -> In Progress
  res = await fetch(`${API}/tasks/tsk_004`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'In Progress' })
  });
  data = await res.json();
  console.log(`8. Task 4 moved to In Progress: status is now '${data.data.status}'`);
  if (data.data.status !== 'In Progress') throw new Error("Task 4 should be In Progress");

  // 9. Complete Task 4: In Progress -> Done
  res = await fetch(`${API}/tasks/tsk_004`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Done' })
  });
  data = await res.json();
  console.log(`9. Task 4 completed: status is now '${data.data.status}'`);
  if (data.data.status !== 'Done') throw new Error("Task 4 should be Done");

  // 10. Check Done section tasks count
  res = await fetch(`${API}/tasks?status=Done`);
  data = await res.json();
  const doneTitles = data.data.map(t => `'${t.title}' (${t.priority})`);
  console.log(`10. Tasks currently in Done section (${data.count}):\n   - ${doneTitles.join('\n   - ')}`);
  if (data.count !== 4) throw new Error("Expected 4 tasks in Done section!");

  // 11. Reset at end
  await fetch(`${API}/reset`, { method: 'POST' });
  console.log("\n==================================================");
  console.log("🎉 ALL USER JOURNEY TESTS COMPLETED SUCCESSFULLY!");
  console.log("==================================================");
}

runJourney().catch(err => {
  console.error("❌ Journey failed:", err);
  process.exit(1);
});
