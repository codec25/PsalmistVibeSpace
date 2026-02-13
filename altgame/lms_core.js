/* Psalmist LMS Core v1
 * Canonical LMS data store shared by auth, IT manager, and sensei dashboard.
 */
(function () {
  var DB_KEY = "lms_db_v1";

  function nowISO() {
    return new Date().toISOString();
  }

  function safeParse(raw, fallback) {
    try {
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch (_err) {
      return fallback;
    }
  }

  function getDB() {
    var db = safeParse(localStorage.getItem(DB_KEY), null);
    if (!db || typeof db !== "object") {
      db = {
        version: 1,
        users: {},
        courses: {},
        enrollments: {},
        assignments: {},
        submissions: {}
      };
    }
    if (!db.users || typeof db.users !== "object") db.users = {};
    if (!db.courses || typeof db.courses !== "object") db.courses = {};
    if (!db.enrollments || typeof db.enrollments !== "object") db.enrollments = {};
    if (!db.assignments || typeof db.assignments !== "object") db.assignments = {};
    if (!db.submissions || typeof db.submissions !== "object") db.submissions = {};
    if (!db.version) db.version = 1;
    return db;
  }

  function setDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  function normalizeRole(role) {
    var r = String(role || "").toUpperCase();
    if (r === "ADMIN" || r === "IT_SENSEI" || r === "SENSEI" || r === "STUDENT" || r === "GUEST") return r;
    return "STUDENT";
  }

  function upsertUser(id, role, userType) {
    var key = String(id || "").trim().toUpperCase();
    if (!key) return null;
    var db = getDB();
    var existing = db.users[key] || {};
    db.users[key] = {
      id: key,
      role: normalizeRole(role || existing.role),
      userType: String(userType || existing.userType || "MEMBER").toUpperCase(),
      createdAt: existing.createdAt || nowISO(),
      updatedAt: nowISO(),
      active: true
    };
    setDB(db);
    return db.users[key];
  }

  function deleteUser(id) {
    var key = String(id || "").trim().toUpperCase();
    if (!key) return { ok: false, error: "USER_ID_REQUIRED" };
    var db = getDB();
    if (db.users[key]) delete db.users[key];

    Object.keys(db.enrollments).forEach(function (cid) {
      var list = db.enrollments[cid];
      if (!Array.isArray(list)) return;
      db.enrollments[cid] = list.filter(function (sid) {
        return String(sid || "").toUpperCase() !== key;
      });
    });

    Object.keys(db.submissions).forEach(function (aid) {
      var subMap = db.submissions[aid];
      if (!subMap || typeof subMap !== "object") return;
      Object.keys(subMap).forEach(function (sid) {
        if (String(sid || "").toUpperCase() === key) {
          delete subMap[sid];
        }
      });
    });

    setDB(db);
    return { ok: true };
  }

  function initFromLegacy() {
    var db = getDB();
    var vault = safeParse(localStorage.getItem("vault_users"), { teachers: {} });
    var roster = safeParse(localStorage.getItem("ninja_roster_full"), {});

    if (!vault.teachers || typeof vault.teachers !== "object") vault.teachers = {};
    Object.keys(vault.teachers).forEach(function (id) {
      var teacher = vault.teachers[id];
      var role = "SENSEI";
      if (teacher && typeof teacher === "object" && String(teacher.role || "").toUpperCase() === "IT_SENSEI") {
        role = "IT_SENSEI";
      }
      var key = String(id).toUpperCase();
      var existing = db.users[key] || {};
      db.users[key] = {
        id: key,
        role: role,
        userType: "SENSEI",
        createdAt: existing.createdAt || nowISO(),
        updatedAt: nowISO(),
        active: true
      };
    });

    Object.keys(roster || {}).forEach(function (id) {
      var key = String(id).toUpperCase();
      var existing = db.users[key] || {};
      db.users[key] = {
        id: key,
        role: existing.role || "STUDENT",
        userType: existing.userType || "MEMBER",
        createdAt: existing.createdAt || nowISO(),
        updatedAt: nowISO(),
        active: true
      };
    });

    var adminName = String(localStorage.getItem("ninjaUser") || "").toUpperCase();
    var sessionRole = String(localStorage.getItem("userRole") || "").toUpperCase();
    var sessionType = String(localStorage.getItem("userType") || "").toUpperCase();
    if (adminName && (sessionRole === "ADMIN" || sessionType === "ADMIN")) {
      var existingAdmin = db.users[adminName] || {};
      db.users[adminName] = {
        id: adminName,
        role: "ADMIN",
        userType: "ADMIN",
        createdAt: existingAdmin.createdAt || nowISO(),
        updatedAt: nowISO(),
        active: true
      };
    }

    setDB(db);
    return db;
  }

  function createCourse(courseId, title, createdBy) {
    var id = String(courseId || "").trim().toUpperCase();
    if (!id) return { ok: false, error: "COURSE_ID_REQUIRED" };
    var db = getDB();
    if (db.courses[id]) return { ok: false, error: "COURSE_EXISTS" };
    db.courses[id] = {
      id: id,
      title: String(title || id).trim(),
      createdBy: String(createdBy || "SYSTEM").toUpperCase(),
      createdAt: nowISO(),
      active: true
    };
    if (!Array.isArray(db.enrollments[id])) db.enrollments[id] = [];
    setDB(db);
    return { ok: true, course: db.courses[id] };
  }

  function listCourses() {
    var db = getDB();
    return Object.keys(db.courses).map(function (id) { return db.courses[id]; });
  }

  function enrollStudent(courseId, studentId) {
    var cid = String(courseId || "").trim().toUpperCase();
    var sid = String(studentId || "").trim().toUpperCase();
    if (!cid || !sid) return { ok: false, error: "COURSE_AND_STUDENT_REQUIRED" };
    var db = getDB();
    if (!db.courses[cid]) return { ok: false, error: "COURSE_NOT_FOUND" };
    if (!db.users[sid]) {
      db.users[sid] = { id: sid, role: "STUDENT", userType: "MEMBER", createdAt: nowISO(), updatedAt: nowISO(), active: true };
    }
    if (!Array.isArray(db.enrollments[cid])) db.enrollments[cid] = [];
    if (!db.enrollments[cid].includes(sid)) db.enrollments[cid].push(sid);
    db.users[sid].updatedAt = nowISO();
    setDB(db);
    return { ok: true };
  }

  function createAssignment(courseId, assignmentId, title, maxPoints, createdBy) {
    var cid = String(courseId || "").trim().toUpperCase();
    var aid = String(assignmentId || "").trim().toUpperCase();
    var points = Math.max(1, parseInt(maxPoints, 10) || 100);
    if (!cid || !aid) return { ok: false, error: "COURSE_AND_ASSIGNMENT_REQUIRED" };
    var db = getDB();
    if (!db.courses[cid]) return { ok: false, error: "COURSE_NOT_FOUND" };
    if (db.assignments[aid]) return { ok: false, error: "ASSIGNMENT_EXISTS" };
    db.assignments[aid] = {
      id: aid,
      courseId: cid,
      title: String(title || aid).trim(),
      maxPoints: points,
      createdBy: String(createdBy || "SYSTEM").toUpperCase(),
      createdAt: nowISO()
    };
    if (!db.submissions[aid] || typeof db.submissions[aid] !== "object") db.submissions[aid] = {};
    setDB(db);
    return { ok: true, assignment: db.assignments[aid] };
  }

  function gradeAssignment(assignmentId, studentId, score, feedback) {
    var aid = String(assignmentId || "").trim().toUpperCase();
    var sid = String(studentId || "").trim().toUpperCase();
    var value = parseInt(score, 10);
    if (!aid || !sid || !Number.isFinite(value)) return { ok: false, error: "ASSIGNMENT_STUDENT_SCORE_REQUIRED" };
    var db = getDB();
    var assignment = db.assignments[aid];
    if (!assignment) return { ok: false, error: "ASSIGNMENT_NOT_FOUND" };
    if (!db.users[sid]) return { ok: false, error: "STUDENT_NOT_FOUND" };
    if (!db.submissions[aid] || typeof db.submissions[aid] !== "object") db.submissions[aid] = {};
    var maxPoints = Math.max(1, parseInt(assignment.maxPoints, 10) || 100);
    var bounded = Math.max(0, Math.min(maxPoints, value));
    db.submissions[aid][sid] = {
      studentId: sid,
      assignmentId: aid,
      score: bounded,
      maxPoints: maxPoints,
      feedback: String(feedback || ""),
      status: "GRADED",
      submittedAt: db.submissions[aid][sid] && db.submissions[aid][sid].submittedAt ? db.submissions[aid][sid].submittedAt : nowISO(),
      gradedAt: nowISO()
    };
    setDB(db);
    return { ok: true, submission: db.submissions[aid][sid] };
  }

  function getStudentProgress(studentId) {
    var sid = String(studentId || "").trim().toUpperCase();
    var db = getDB();
    var enrolledCourses = [];
    Object.keys(db.enrollments).forEach(function (cid) {
      if (Array.isArray(db.enrollments[cid]) && db.enrollments[cid].includes(sid)) enrolledCourses.push(cid);
    });

    var graded = [];
    Object.keys(db.submissions).forEach(function (aid) {
      var subMap = db.submissions[aid] || {};
      if (subMap[sid] && subMap[sid].status === "GRADED") {
        graded.push(subMap[sid]);
      }
    });
    var totalScore = graded.reduce(function (sum, item) { return sum + (parseInt(item.score, 10) || 0); }, 0);
    var totalMax = graded.reduce(function (sum, item) { return sum + (parseInt(item.maxPoints, 10) || 0); }, 0);
    var average = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
    return {
      studentId: sid,
      courses: enrolledCourses,
      gradedCount: graded.length,
      averagePercent: average
    };
  }

  function listAssignments(courseId) {
    var cid = String(courseId || "").trim().toUpperCase();
    var db = getDB();
    return Object.keys(db.assignments)
      .map(function (id) { return db.assignments[id]; })
      .filter(function (a) { return !cid || a.courseId === cid; });
  }

  window.LMSCore = {
    init: initFromLegacy,
    getDB: getDB,
    setDB: setDB,
    upsertUser: upsertUser,
    deleteUser: deleteUser,
    createCourse: createCourse,
    listCourses: listCourses,
    enrollStudent: enrollStudent,
    createAssignment: createAssignment,
    listAssignments: listAssignments,
    gradeAssignment: gradeAssignment,
    getStudentProgress: getStudentProgress
  };
})();
