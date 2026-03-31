const Task = require('../models/Task');
const Video = require('../models/Video');
const Progress = require('../models/Progress');
const CodeSubmission = require('../models/CodeSubmission');

const DEFAULT_FALLBACK_TASKS = [
  {
    title: 'Practice concepts from video',
    description: 'Write code based on video topic',
    difficulty: 'medium',
  },
  {
    title: 'Create small project',
    description: 'Build something related to topic',
    difficulty: 'medium',
  },
];

function normalizeAiTask(task, idx) {
  const title = typeof task?.title === 'string' && task.title.trim() ? task.title.trim() : `Task ${idx + 1}`;
  const description =
    typeof task?.description === 'string' && task.description.trim() ? task.description.trim() : '';
  const difficulty = ['easy', 'medium', 'hard'].includes(task?.difficulty) ? task.difficulty : 'medium';
  return { title, description, difficulty };
}

function fallbackWithVideoSafe(videoId) {
  return DEFAULT_FALLBACK_TASKS.map((t, i) => ({
    videoId,
    title: t.title,
    description: t.description,
    difficulty: t.difficulty,
    starterCode: '// Start here\n',
    expectedOutput: '',
    hints: [],
    order: i,
  }));
}

async function generateTasksWithOpenRouter(videoTitle) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return { ok: false, tasks: null, reason: 'Missing OPENROUTER_API_KEY' };

  const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3-8b-instruct';

  const aiPrompt = `Generate 2 coding tasks based on the following video topic.\n\nVideo Title:\n"${videoTitle}"\n\nReturn response in JSON format:\n{\n "tasks": [\n   {\n     "title": "Task name",\n     "description": "Task description"\n   }\n ]\n}\n`;

  const requestBody = {
    model,
    messages: [
      {
        role: 'user',
        content: aiPrompt,
      },
    ],
    temperature: 0,
    response_format: { type: 'json_object' },
    max_tokens: 500,
  };

  console.log('Video Title:', videoTitle);

  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`OpenRouter error ${resp.status}: ${text || 'Unknown error'}`);
  }

  const response = await resp.json();

  // Expected extraction:
  // response.data.choices[0].message.content
  const content =
    response?.data?.choices?.[0]?.message?.content ??
    response?.choices?.[0]?.message?.content ??
    null;

  const aiText = content;
  console.log('AI Raw Response:', aiText);

  if (!aiText || typeof aiText !== 'string') {
    return { ok: false, tasks: null, reason: 'Missing AI message content' };
  }

  try {
    const parsed = JSON.parse(aiText);
    const tasks = Array.isArray(parsed?.tasks) ? parsed.tasks : null;
    if (!tasks || tasks.length === 0) return { ok: false, tasks: null, reason: 'No tasks in AI response' };
    return { ok: true, tasks };
  } catch (e) {
    return { ok: false, tasks: null, reason: 'JSON parse failed' };
  }
}

async function ensureTasksForVideo(videoId, videoTitleOverride) {
  const existing = await Task.find({ videoId }).sort({ order: 1 });
  if (existing.length > 0) {
    // If users already completed tasks for this video, never overwrite them.
    const completedCount = await Progress.countDocuments({
      completed: true,
      taskId: { $in: existing.map((t) => t._id) },
    });
    if (completedCount > 0) return existing;

    // If tasks exist but were never completed, we can try regenerating once.
    // (Prevents old hardcoded tasks from sticking around forever.)
    try {
      const canRemove = await CodeSubmission.countDocuments({
        taskId: { $in: existing.map((t) => t._id) },
      });
      if (canRemove > 0) return existing; // don't disturb evaluated submissions

      await Task.deleteMany({ videoId });
    } catch {
      return existing;
    }
  }

  const video = await Video.findById(videoId).select('title').lean();
  const videoTitle = (videoTitleOverride && String(videoTitleOverride).trim()) || video?.title || 'video topic';

  let generated = null;
  try {
    const aiResult = await generateTasksWithOpenRouter(videoTitle);
    if (aiResult.ok) generated = aiResult.tasks;
  } catch (e) {
    // If OpenRouter fails, we fall back below.
  }

  const taskDocs = (generated && Array.isArray(generated) ? generated : DEFAULT_FALLBACK_TASKS).slice(0, 2).map((t, i) => {
    const norm = normalizeAiTask(t, i);
    return {
      videoId,
      title: norm.title,
      description: norm.description,
      difficulty: norm.difficulty,
      starterCode: '// Start here\n',
      expectedOutput: '',
      hints: [],
      order: i,
    };
  });

  const created = await Task.insertMany(taskDocs);
  return created;
}

module.exports = { ensureTasksForVideo };
