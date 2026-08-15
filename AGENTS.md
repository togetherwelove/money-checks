# Code-first development

- Treat the executable code, tests, database migrations, and runtime configuration as the primary sources of truth.
- Inspect the relevant implementation and nearby usage before making changes. Trace call sites, types, state flow, persistence, and platform-specific behavior as needed.
- Do not require, create, or update planning documents, specifications, policy documents, implementation plans, or progress logs unless the user explicitly asks for one.
- Do not block ordinary implementation on documentation approval. Make small, reversible engineering decisions autonomously when they are consistent with the existing codebase.
- Ask the user only when missing information would materially change product behavior, requires an external prerequisite, exposes secrets, or authorizes a destructive or irreversible action.
- When requirements are incomplete but the intended behavior can be inferred safely from code and tests, implement the smallest consistent solution and report the assumption.

# Implementation standards

- Check the encoding before editing files that contain Korean text, and preserve UTF-8 without corrupting existing content.
- Keep changes focused and preserve unrelated work already present in the working tree.
- Prefer existing project patterns and maintained libraries over custom implementations.
- Split code into focused modules when a file or responsibility becomes too large. Avoid unnecessary abstractions and object allocation.
- Use meaningful names and centralize reusable colors, spacing, messages, and configuration values instead of scattering unexplained literals.
- Release database connections, streams, controllers, subscriptions, and other disposable resources promptly.
- Never commit credentials or other sensitive values.
- After implementation, run the narrowest relevant checks first, then the project type-check or broader verification when practical. Fix failures caused by the change.
