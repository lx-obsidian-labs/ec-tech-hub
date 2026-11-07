# EC Tech Hub

**Engineering verification:** [Documentation verification](DOCUMENTATION_VERIFICATION.md). This guide separates documented functionality from independently verified test and deployment evidence.

**Technology community and resources web application for the Eastern Cape | LX Obsidian Labs**

**Stage:** To confirm. **Verification:** Repository structure and package scripts inspected; feature behavior, tests and deployment have not been independently verified.

## Overview

This is a Next.js application with a Supabase integration dependency. The repository includes application source under `src/`, public assets and a checked-in npm lockfile. The presence of a dependency does not establish that a corresponding integration or feature is operational.

## Development

Use a Node.js version compatible with the checked-in Next.js release:

```bash
npm ci
npm run dev
```

Open http://localhost:3000.

## Verification

The current manifest declares:

```bash
npm run lint
npm run build
```

No automated `test` script is declared in the inspected root manifest. Do not describe this repository as fully tested or production-ready without corresponding evidence.

## Architecture and security review

- Inspect `src/` to document implemented routes, user roles and server/client boundaries.
- Review `supabase/` and related source code for migrations, row-level security and authorization.
- Record required environment variable **names**, never secret values.
- Verify validation, error handling, authentication and data privacy for any public API routes.
- Check keyboard accessibility, mobile layouts, performance and deployment status.
- Add reproducible tests and CI results for the implemented scope.
- Confirm license, content ownership and third-party attribution before redistribution.

## Project evidence

A configured deployment URL or package dependency is not proof of successful production operation. Record exact reviewed commit SHA, test commands and outcomes, and the date of any live smoke test.

## Maintainer

**LX Obsidian Labs** · [Engineering portfolio](https://github.com/lx-obsidian-labs/lx-obsidian-labs) · [Contact](mailto:vilanenathan@gmail.com)
