---
name: help
description: Lists the devflow commands or explains one of them. Use when unsure which devflow command fits a task, or for onboarding to the workflow.
argument-hint: "[command]"
---

# /devflow:help

Argument: $ARGUMENTS

Answer only from the README below.

- No argument: list the five commands with one line each, then the "situation → command" table.
- A command name, with or without the `/devflow:` prefix: show that command's whole section.
- A name that is not a command: say so and list the five.

!`cat "${CLAUDE_PLUGIN_ROOT}/README.md"`
