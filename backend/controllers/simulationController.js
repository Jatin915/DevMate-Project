const mongoose = require('mongoose');
const SimulationIssue    = require('../models/SimulationIssue');
const SimulationProgress = require('../models/SimulationProgress');
const { HttpError }      = require('../middleware/errorHandler');
const { evaluateCode }   = require('../utils/aiService');

// ── Seed data ─────────────────────────────────────────────────────────────
const SEED_ISSUES = [
  {
    order: 1, priority: 'high', difficulty: 'easy', language: 'JavaScript',
    tags: ['bug', 'mobile'],
    title: 'Login button not working on mobile',
    description: 'Users on iOS Safari report the login button does nothing when tapped. The click event fires but the form submit handler is never called. Affects ~15% of users on touch devices.',
    codeSnippet: `// Current broken code\ndocument.getElementById('loginBtn').addEventListener('click', handleLogin);\n\nfunction handleLogin(e) {\n  // This never fires on iOS Safari\n  e.preventDefault();\n  submitForm();\n}`,
  },
  {
    order: 2, priority: 'medium', difficulty: 'easy', language: 'CSS',
    tags: ['UI', 'responsive'],
    title: 'Fix responsive navbar on tablet',
    description: 'The navigation bar breaks on screens between 768px and 1024px. Menu items overflow and the hamburger icon overlaps the logo. Needs a proper breakpoint fix.',
    codeSnippet: `.navbar {\n  display: flex;\n  justify-content: space-between;\n}\n/* Missing tablet breakpoint */`,
  },
  {
    order: 3, priority: 'high', difficulty: 'medium', language: 'JavaScript',
    tags: ['performance', 'optimization'],
    title: 'Optimize dashboard API loading time',
    description: 'The dashboard makes 6 separate API calls on load, causing a 3.2s render time. Consolidate into a single batched request or implement parallel fetching with Promise.all.',
    codeSnippet: `// Current: sequential calls\nconst user    = await fetchUser();\nconst stats   = await fetchStats();\nconst roadmap = await fetchRoadmap();\nconst tasks   = await fetchTasks();\n// Fix: use Promise.all`,
  },
  {
    order: 4, priority: 'low', difficulty: 'easy', language: 'React',
    tags: ['UI', 'enhancement'],
    title: 'Add dark mode toggle to settings page',
    description: 'Users have requested a persistent dark/light mode toggle in the settings page. The toggle should save the preference to localStorage and apply the correct CSS class on the root element.',
    codeSnippet: `function SettingsPage() {\n  // TODO: add theme toggle\n  return <div>Settings</div>;\n}`,
  },
  {
    order: 5, priority: 'high', difficulty: 'hard', language: 'React',
    tags: ['bug', 'memory'],
    title: 'Fix memory leak in video player component',
    description: 'The VideoPlayer component sets up an interval to track watch time but never clears it when the component unmounts. This causes a memory leak and stale state updates after navigation.',
    codeSnippet: `useEffect(() => {\n  const interval = setInterval(() => {\n    setWatchTime(t => t + 1);\n  }, 1000);\n  // Missing cleanup!\n}, []);`,
  },
  {
    order: 6, priority: 'medium', difficulty: 'medium', language: 'Node',
    tags: ['backend', 'security'],
    title: 'Add rate limiting to authentication endpoints',
    description: 'The /auth/login and /auth/signup endpoints have no rate limiting. A brute-force attack can make unlimited requests. Implement a simple in-memory rate limiter that blocks IPs after 10 failed attempts in 15 minutes.',
    codeSnippet: `// POST /auth/login — currently unprotected\nrouter.post('/login', asyncHandler(login));\n// Add rate limiter middleware before the handler`,
  },
  {
    order: 7, priority: 'low', difficulty: 'easy', language: 'JavaScript',
    tags: ['bug', 'UI'],
    title: 'Form validation not showing error messages',
    description: 'The signup form validates fields on submit but error messages never appear in the UI. The validation logic runs correctly but the error state is not being set in the component.',
    codeSnippet: `function handleSubmit(e) {\n  e.preventDefault();\n  const errors = validate(formData);\n  // errors object is populated but never shown\n  console.log(errors);\n}`,
  },
  {
    order: 8, priority: 'medium', difficulty: 'medium', language: 'React',
    tags: ['performance', 'optimization'],
    title: 'Prevent unnecessary re-renders in task list',
    description: 'The TaskList component re-renders every time the parent state changes, even when the tasks array has not changed. Use React.memo and useCallback to prevent this.',
    codeSnippet: `// Re-renders on every parent update\nfunction TaskList({ tasks, onComplete }) {\n  return tasks.map(t => (\n    <TaskItem key={t.id} task={t} onComplete={onComplete} />\n  ));\n}`,
  },
  {
    order: 9, priority: 'high', difficulty: 'hard', language: 'MongoDB',
    tags: ['backend', 'performance'],
    title: 'Add database indexes for slow queries',
    description: 'The VideoProgress collection has no compound index on (userId, language). Queries that filter by both fields do a full collection scan. Add the correct index and explain why it improves performance.',
    codeSnippet: `// Current schema — missing indexes\nconst schema = new mongoose.Schema({\n  userId:   { type: ObjectId },\n  language: { type: String },\n  completed: { type: Boolean },\n});`,
  },
  {
    order: 10, priority: 'medium', difficulty: 'easy', language: 'CSS',
    tags: ['UI', 'accessibility'],
    title: 'Fix button contrast ratio for accessibility',
    description: 'Several buttons use light grey text on white backgrounds, failing WCAG AA contrast requirements. Update the button styles to meet a minimum 4.5:1 contrast ratio.',
    codeSnippet: `.btn-secondary {\n  color: #aaa;        /* contrast ratio: 2.3:1 — fails WCAG */\n  background: #fff;\n  border: 1px solid #ddd;\n}`,
  },
  {
    order: 11, priority: 'low', difficulty: 'medium', language: 'Node',
    tags: ['backend', 'enhancement'],
    title: 'Implement request logging middleware',
    description: 'There is no structured request logging in the Express app. Add middleware that logs method, URL, status code, and response time for every request in a consistent format.',
    codeSnippet: `// Add before routes in server.js\napp.use((req, res, next) => {\n  // TODO: log request details\n  next();\n});`,
  },
  {
    order: 12, priority: 'high', difficulty: 'medium', language: 'React',
    tags: ['bug', 'state'],
    title: 'Fix stale closure in event handler',
    description: 'The countdown timer component captures the initial value of `count` in a closure inside useEffect. After the first render, the handler always sees count as 0 regardless of state updates.',
    codeSnippet: `const [count, setCount] = useState(10);\n\nuseEffect(() => {\n  const id = setInterval(() => {\n    if (count === 0) clearInterval(id); // always 0!\n    setCount(count - 1);\n  }, 1000);\n  return () => clearInterval(id);\n}, []);`,
  },
];

// Seed issues into DB if collection is empty
async function seedIssuesIfEmpty() {
  const count = await SimulationIssue.countDocuments();
  if (count > 0) return;
  await SimulationIssue.insertMany(SEED_ISSUES);
  console.log('[Simulation] Seeded', SEED_ISSUES.length, 'issues');
}

// ── GET /api/simulation/issues ────────────────────────────────────────────
async function getIssues(req, res, next) {
  try {
    await seedIssuesIfEmpty();

    const issues = await SimulationIssue.find().sort({ order: 1 }).lean();

    // Attach user's submission status to each issue
    const issueIds = issues.map((i) => i._id);
    const userProgress = await SimulationProgress.find({
      userId: req.userId,
      issueId: { $in: issueIds },
    }).lean();
    const progressMap = new Map(userProgress.map((p) => [String(p.issueId), p]));

    const enriched = issues.map((issue) => {
      const prog = progressMap.get(String(issue._id));
      return {
        ...issue,
        userStatus:  prog?.status      || 'pending',
        aiScore:     prog?.aiScore     ?? null,
        submittedAt: prog?.submittedAt ?? null,
      };
    });

    const openCount      = enriched.filter((i) => i.userStatus === 'pending').length;
    const completedCount = enriched.filter((i) => i.userStatus === 'completed').length;

    res.json({ success: true, issues: enriched, openCount, completedCount });
  } catch (e) {
    next(e);
  }
}

// ── GET /api/simulation/issues/:id ────────────────────────────────────────
async function getIssueById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      next(new HttpError(400, 'Invalid issue id'));
      return;
    }
    const issue = await SimulationIssue.findById(id).lean();
    if (!issue) {
      next(new HttpError(404, 'Issue not found'));
      return;
    }
    const prog = await SimulationProgress.findOne({ userId: req.userId, issueId: id }).lean();
    res.json({
      success: true,
      issue: {
        ...issue,
        userStatus:   prog?.status       || 'pending',
        solutionCode: prog?.solutionCode || '',
        aiScore:      prog?.aiScore      ?? null,
        feedback:     prog?.feedback     || '',
        submittedAt:  prog?.submittedAt  ?? null,
      },
    });
  } catch (e) {
    next(e);
  }
}

// ── POST /api/simulation/submit ───────────────────────────────────────────
async function submitSolution(req, res, next) {
  try {
    const { issueId, solutionCode } = req.body;

    if (!issueId || !mongoose.Types.ObjectId.isValid(issueId)) {
      next(new HttpError(400, 'Valid issueId is required'));
      return;
    }
    if (!solutionCode || !solutionCode.trim()) {
      next(new HttpError(400, 'solutionCode is required'));
      return;
    }

    const issue = await SimulationIssue.findById(issueId).lean();
    if (!issue) {
      next(new HttpError(404, 'Issue not found'));
      return;
    }

    // ── Optional AI evaluation ────────────────────────────────────────────
    let aiScore = null;
    let feedback = '';
    let status = 'submitted';

    try {
      const aiResult = await evaluateCode(solutionCode, issue.description, {
        taskTitle:       issue.title,
        taskDescription: issue.description,
      });
      aiScore  = aiResult.score;
      feedback = aiResult.feedback;
      status   = aiScore >= 70 ? 'completed' : 'submitted';
    } catch {
      // AI is optional — save submission regardless
      status = 'submitted';
    }

    const prog = await SimulationProgress.findOneAndUpdate(
      { userId: req.userId, issueId },
      {
        $set: {
          userId: req.userId,
          issueId,
          solutionCode: solutionCode.trim(),
          status,
          aiScore,
          feedback,
          submittedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.json({
      success: true,
      status,
      aiScore,
      feedback,
      passed: status === 'completed',
      progress: prog,
    });
  } catch (e) {
    next(e);
  }
}

// ── GET /api/simulation/user-progress ────────────────────────────────────
async function getUserProgress(req, res, next) {
  try {
    const records = await SimulationProgress.find({ userId: req.userId })
      .populate('issueId', 'title priority tags difficulty language')
      .sort({ submittedAt: -1 })
      .lean();

    const completed = records.filter((r) => r.status === 'completed').length;
    const submitted = records.filter((r) => r.status === 'submitted').length;

    res.json({ success: true, records, completed, submitted });
  } catch (e) {
    next(e);
  }
}

module.exports = { getIssues, getIssueById, submitSolution, getUserProgress };
