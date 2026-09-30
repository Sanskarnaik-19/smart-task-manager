/**
 * Comprehensive Dependency Test Suite
 * Tests all dependency scenarios, edge cases, cycle detections, and blocking rules.
 */

const { tasks, seedInitialData } = require('./backend/store/inMemoryDb');
const { checkDependenciesComplete, detectCycle, isTaskBlocked, enrichTask } = require('./backend/utils/dependencyUtils');

console.log("==================================================");
console.log("🧪 RUNNING COMPREHENSIVE DEPENDENCY UNIT TESTS");
console.log("==================================================");

// Reset store
seedInitialData();

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

// TEST 1: Initial state check
// Task 1: Done
// Task 2: In Progress (depends on Task 1 which is Done -> should NOT be blocked)
// Task 3: In Progress (depends on Task 1 which is Done)
// Task 4: To Do (depends on Task 2 [In Progress] and Task 3 [In Progress] -> SHOULD BE BLOCKED)
const t1 = tasks.get("tsk_001");
const t2 = tasks.get("tsk_002");
const t3 = tasks.get("tsk_003");
const t4 = tasks.get("tsk_004");
const t5 = tasks.get("tsk_005");

assert(t1.status === "Done", "Task 1 is Done");
const t2Blocked = !checkDependenciesComplete(t2.dependencies, tasks).canComplete;
assert(!t2Blocked, "Task 2 is NOT blocked (depends on Task 1 which is Done)");

const t4Check = checkDependenciesComplete(t4.dependencies, tasks);
assert(!t4Check.canComplete, "Task 4 IS BLOCKED because Task 2 and Task 3 are In Progress");
assert(t4Check.blockingTasks.length === 2 && t4Check.blockingTasks.some(b => b.id === "tsk_002"), "Task 4 blocking tasks include Task 2 and Task 3");

// TEST 2: Self dependency cycle check
const selfCycle = detectCycle("tsk_001", ["tsk_001"], tasks);
assert(selfCycle.hasCycle, "Detects self-dependency cycle (Task 1 -> Task 1)");

// TEST 3: Direct 2-node cycle check (Task 1 -> Task 2, while Task 2 -> Task 1)
const directCycle = detectCycle("tsk_001", ["tsk_002"], tasks);
assert(directCycle.hasCycle, "Detects direct cycle (Task 1 depends on Task 2, but Task 2 already depends on Task 1)");

// TEST 4: Multi-node indirect cycle check (Task 1 -> Task 5, where Task 5 -> Task 4 -> Task 2 -> Task 1)
const indirectCycle = detectCycle("tsk_001", ["tsk_005"], tasks);
assert(indirectCycle.hasCycle, "Detects indirect transitive cycle (Task 1 -> Task 5 -> Task 4 -> Task 2 -> Task 1)");

// TEST 5: Valid dependency (No cycle)
// Task 6 depends on Task 5. Task 5 depends on Task 4. Can Task 6 also depend on Task 1?
const validDep = detectCycle("tsk_006", ["tsk_005", "tsk_001"], tasks);
assert(!validDep.hasCycle, "Allows valid non-circular dependency (Task 6 -> Task 5 & Task 1)");

// TEST 6: Unblocking cascade
// When both prerequisites (Task 2 and Task 3) are marked Done, Task 4 should become unblocked
t2.status = "Done";
tasks.set("tsk_002", t2);
t3.status = "Done";
tasks.set("tsk_003", t3);
const t4CheckAfterPrereqsDone = checkDependenciesComplete(t4.dependencies, tasks);
assert(t4CheckAfterPrereqsDone.canComplete, "Task 4 becomes UNBLOCKED when prerequisites (Task 2 and Task 3) are marked Done");

// TEST 7: Multi-dependency resolution
// Task 4 is now ready to be marked Done. When Task 4 is marked Done, Task 5 should become unblocked.
const t5CheckBefore = checkDependenciesComplete(t5.dependencies, tasks);
assert(!t5CheckBefore.canComplete, "Task 5 is blocked before Task 4 is Done");

t4.status = "Done";
tasks.set("tsk_004", t4);
const t5CheckAfter = checkDependenciesComplete(t5.dependencies, tasks);
assert(t5CheckAfter.canComplete, "Task 5 becomes UNBLOCKED when Task 4 is marked Done");

console.log("\n==================================================");
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log("==================================================");
if (failed > 0) process.exit(1);
