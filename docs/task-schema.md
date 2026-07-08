# AI Task Tracking Specification

## Purpose

This file defines the structure used by AI agents to track implementation work.

Each task represents one independent unit of work that an AI agent can implement, verify, and mark as completed.

The agent must:
1. Read available tasks.
2. Select tasks with status "Not Started" and satisfied dependencies.
3. Implement the task.
4. Validate against passing requirements.
5. Update task status and notes.

---

# Task Object Schema

Each task must follow this structure:

```json
{
  "id": "unique-task-id",
  "type": "feature|bug|refactor|setup|research",
  "feature": "feature-group-name",
  "task": "short task name",
  "priority": "Critical|High|Medium|Low",
  "depends_on": [
    "task-id"
  ],
  "detail": "Detailed implementation description",
  "passing_requirement": [
    "Requirement 1",
    "Requirement 2"
  ],
  "status": "Not Started|In Progress|Blocked|Review|Done|Deferred",
  "notes": ""
}