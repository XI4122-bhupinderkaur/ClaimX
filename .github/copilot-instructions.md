# ClaimX Copilot Instructions

## Project

ClaimX is a React Native TypeScript insurance claims management application.

The application is designed to provide:

- Faster claim resolution
- Lower operating costs
- Better claims accuracy
- Fraud detection and control
- Better customer experience
- Modern digital claims workflows

## Technology

Use:

- React Native
- TypeScript
- React Navigation
- TanStack Query when server-state management is required
- React Hook Form when complex forms are required
- Zod for validation when appropriate
- Jest
- React Native Testing Library

Reuse existing dependencies and project patterns before adding new packages.

## Architecture

Application source code belongs under:

src/
├── api/
├── components/
├── config/
├── constants/
├── features/
├── hooks/
├── navigation/
├── screens/
├── services/
├── store/
├── types/
├── utils/
└── validation/

MCP-related code belongs under:

mcp/
├── tools/
├── schemas/
└── servers/

Tests belong under:

tests/

## Coding Rules

- Use TypeScript.
- Avoid `any`.
- Use functional React Native components.
- Keep business logic out of screens.
- Keep API calls out of screens.
- Use reusable custom hooks.
- Keep domain types strongly typed.
- Do not duplicate existing functionality.
- Do not create unnecessary dependencies.
- Do not hardcode API keys, passwords or tokens.
- Do not expose sensitive customer information.
- Do not modify unrelated files.
- Inspect existing code before implementing changes.

## ClaimX Features

The application will eventually contain:

- Authentication
- Dashboard
- Claims
- Policies
- Documents
- Fraud detection
- Payments
- Notifications
- Customer Profile

## Claims

Claims are the primary business domain.

Claim statuses include:

- SUBMITTED
- UNDER_REVIEW
- INVESTIGATION
- APPROVED
- REJECTED
- PAYMENT_PENDING
- PAID
- CLOSED

## Security

Never trust client-side authorization.

Backend authorization is authoritative.

Never expose:

- Authentication tokens
- Passwords
- API secrets
- Unauthorized customer data

AI must not independently make final claim approval or rejection decisions.

## MCP

MCP tools must:

- Have strict input schemas.
- Have strict output schemas.
- Validate inputs.
- Respect authorization.
- Handle errors safely.
- Avoid exposing sensitive information.
- Prefer read-only operations initially.

## Development Workflow

Before implementing:

1. Inspect the existing repository.
2. Understand existing architecture.
3. Reuse existing patterns.
4. Identify files that need to change.
5. Make small focused changes.
6. Run relevant tests or type checks.
7. Report what changed.

Do not implement an entire feature when only a small part was requested.

When creating a new feature, explain:

- Files created
- Files modified
- Data flow
- Dependencies
- Testing approach

Follow the existing architecture unless there is a clear technical reason to change it.

## Token Efficiency Rules

This project is being developed incrementally and the Copilot context window must be preserved.

Follow these rules for every task:

1. Keep responses concise.
2. Do not repeat the project architecture unless specifically requested.
3. Do not explain obvious code.
4. Do not include large code blocks in the chat response when files have already been modified.
5. After modifying files, provide only:

   * Files created
   * Files modified
   * Short implementation summary
   * Tests/checks performed
   * Any blocker
6. Do not read the entire repository unless the task requires it.
7. Inspect only files relevant to the current task.
8. Do not repeatedly inspect files already analyzed during the current task.
9. Do not regenerate existing code.
10. Do not create duplicate implementations.
11. Work on ONE clearly defined task at a time.
12. Do not implement future tasks proactively.
13. Do not generate unnecessary documentation.
14. Do not explain what another agent already explained.
15. Prefer editing existing files over creating unnecessary new files.
16. Before making changes, identify the minimum files required.
17. Stop immediately when the requested task is complete.
18. Do not continue to the next feature without explicit instruction.

## Agent Handoff Rules

When one agent completes its task, it should leave a concise handoff containing:

* What was completed
* Files changed
* Interfaces/contracts created
* Dependencies required
* Anything the next agent needs to know

Do not include unnecessary implementation details.

## Context Preservation

Treat the context window as a limited resource.

For large repositories:

* Search targeted files instead of scanning everything.
* Read only relevant sections.
* Avoid loading generated files.
* Avoid loading `node_modules`.
* Avoid loading Android/iOS build artifacts unless specifically required.
* Avoid loading media/assets unless specifically required.
* Do not inspect lockfiles unless dependency information is required.

Never spend context analyzing unrelated files.

## Implementation Rule

Complete the smallest correct implementation that satisfies the current request.

Do not implement speculative features.

Do not "improve" unrelated code.

Do not refactor unrelated files.

Do not create code for future requirements until requested.
