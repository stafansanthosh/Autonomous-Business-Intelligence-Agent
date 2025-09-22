---
description: 'This system helps break down complex development work into manageable, trackable tasks with dependency management and historical context. Its designed for iOS development with SwiftUI and follows privacy-first principles.'
tools: ['extensions', 'codebase', 'usages', 'vscodeAPI', 'problems', 'changes', 'testFailure', 'terminalSelection', 'terminalLastCommand', 'openSimpleBrowser', 'fetch', 'findTestFiles', 'searchResults', 'githubRepo', 'runCommands', 'runTasks', 'editFiles', 'runNotebooks', 'search', 'new']
---

# AI Task System

## Overview

This system helps break down complex development work into manageable, trackable tasks with dependency management and historical context.

## Quick Commands

- **"Create tasks for [feature/PRD/DesignDocument]"** - Generate task breakdown from requirements or design document.
- **"Work on tasks"** - Start executing pending tasks
- **"Check task status"** - Show current task progress
- **"Archive completed"** - Move finished tasks to memory

## System Structure

```
.ai/
├── TASKS.md          # Master task list (your main view)
├── tasks/            # Active task files
└── memory/
    ├── tasks/        # Completed/failed tasks
    └── TASKS_LOG.md  # History log
```

## How It Works

### 1. Task Planning
When you request task creation, the system:
- Analyzes your requirements (PRD, feature request, etc.)
- Breaks down complex work into logical tasks
- Sets priorities (critical → high → medium → low) 
- Identifies dependencies between tasks
- Creates a master checklist in `TASKS.md`

### 2. Task Execution
Tasks move through these states:
- `[ ]` **Pending** - Ready to start (dependencies met)
- `[-]` **In Progress** - Currently being worked on
- `[x]` **Completed** - Finished successfully
- `[!]` **Failed** - Encountered errors (with error log)

### 3. Task Structure
Each task file contains:

```yaml
---
id: 1                          # Unique identifier
title: 'Implement PDF OCR'     # Clear, actionable title
status: pending                # Current state
priority: high                 # critical/high/medium/low
feature: 'Document Processing' # Feature area
dependencies: []               # Tasks that must complete first
created_at: "2025-08-23T10:30:00Z"
started_at: "2025-08-23T14:30:00Z"    # When work began
completed_at: "2025-08-23T18:45:00Z"  # When work finished
---

## Description
Brief summary of what needs to be done.

## Details
- Specific requirements
- Technical considerations
- Implementation notes

## Progress Updates
### [Timestamp] - Status Change
- Progress notes
- Implementation details
- Issues encountered
- Next steps

## Test Strategy
How to verify completion:
- Unit tests to write
- Manual verification steps
- Acceptance criteria

## Completion Summary (when status: completed)
### Successfully Implemented [Date]
- Files created/modified
- Key achievements
- Test results
- Integration points
- Future improvements
```

### 3. Task Completion
Once a task is complete, follow these steps:

**Task File Update Rules:**
1. **All progress updates go in the task file**
2. **Update task YAML metadata** (status, started_at, completed_at)
3. **Add timestamped progress entries** for significant work
4. **Include completion summary** with concrete achievements
5. **Update the task status in TASKS.md** with brief one-line notes

## Advanced Features

### Complex Task Expansion
Large tasks automatically get broken into sub-tasks:
- **Parent Task ID**: `task5_user_authentication.md`
- **Sub-tasks**: `task5.1_login_ui.md`, `task5.2_auth_api.md`

### Memory System
Completed work gets archived with:
- Full task history preserved
- Searchable completion log
- Context for future similar work

### Dependency Intelligence
The system ensures:
- Tasks only start when dependencies are met
- Logical work ordering
- Parallel execution opportunities

## Task Priority Guidelines

**Critical**: Core functionality, blocks many other tasks
**High**: Key features, important bug fixes
**Medium**: Standard development work (default)
**Low**: Nice-to-have improvements, cosmetic fixes

## Documentation and Reference System

When working on tasks that involve technologies, programming languages, or libraries, always refer to official documentation for accuracy and best practices:

### Documentation Access Methods

1. **Context7 MCP Server** (Preferred for technical docs)

2. **Fetch Tool** (For web-based documentation)
   - Use for third-party libraries, frameworks, or online guides
   - Fetch specific documentation pages when context7 doesn't have coverage

### Documentation Priority Order

1. **Dotnet Documentation** - Primary source for .NET features
2. **Context7 MCP Server** - Structured technical references
3. **Official Library/Framework Docs** - Via fetch tool from official websites
4. **Community Resources** - Only after official sources are consulted

## Example Usage

```bash
# Start working
"Create tasks for OCR document parsing feature"

# Check progress  
"Show current task status"

# Begin work
"Work on the next pending task"

# Clean up
"Archive all completed tasks"
```

### ✅ CORRECT Task Workflow Example:

**User Request**: "Work on Task 15: Category Management"

**Agent Response**: 
1. Updates `.ai/tasks/task15_category_management.md` with progress
2. Updates TASKS.md checkbox: `[ ]` → `[-]`
3. Chat response: "I'm working on Task 15. I've started implementing the category management system and updated the task file with progress details."

**Agent Completion**:
1. Updates task file with completion summary, files created, test results
2. Updates TASKS.md checkbox: `[-]` → `[x]`
3. Chat response: "Task 15 completed successfully! The category management system is now implemented with full test coverage. See the task file for detailed implementation notes."

### ❌ INCORRECT Task Workflow:

**DON'T DO THIS**: Putting implementation details directly in TASKS.md or chat responses instead of the task file.

## Best Practices

1. **Start Small**: Complex features get auto-expanded into manageable pieces
2. **Clear Dependencies**: Each task knows what it needs to wait for
3. **Test-Driven**: Every task includes verification strategy
4. **Documentation-First**: Always consult official docs via context7 MCP or fetch tool before implementation
5. **Privacy-Aware**: All tasks consider on-device processing requirements
6. **HIG-Compliant**: UI tasks follow Apple design guidelines

## File Update Workflow

### When Starting a Task:
1. **Update task file**: Change status to "in-progress", add started_at timestamp
2. **Update TASKS.md**: Change checkbox from `[ ]` to `[-]`
3. **Work in the task file**: Add progress updates, implementation notes, issues

### During Task Execution:
1. **Log progress in task file**: Add timestamped entries under "Progress Updates"
2. **Document decisions**: Technical choices, API patterns, integration details
3. **Track issues**: Problems encountered and solutions applied
4. **NEVER update TASKS.md** except for status checkbox changes

### When Completing a Task:
1. **Update task file**: 
   - Change status to "completed"
   - Add completed_at timestamp
   - Add comprehensive "Completion Summary" section
   - Document files created/modified
   - List key achievements and test results
2. **Update TASKS.md**: Change checkbox from `[-]` to `[x]`
3. **Brief summary in TASKS.md**: Add one-line implementation note if needed

### Communication Protocol:
- **Chat responses**: Acknowledge task progress, mention key achievements
- **Detailed documentation**: Always goes in the individual task file
- **TASKS.md updates**: Status changes and brief notes only

## 🔒 MANDATORY COMPLIANCE CHECKLIST

Before completing any task work, verify:

- [ ] **Progress details are in the task file** (`.ai/tasks/taskN_name.md`)
- [ ] **Task file metadata is updated** (status, timestamps)
- [ ] **Completion summary is in task file** (not TASKS.md or chat)
- [ ] **TASKS.md only has checkbox status change** and brief note
- [ ] **Chat response acknowledges work** without duplicating task file details

**Remember**: TASKS.md is a dashboard, individual task files are the detailed documentation.