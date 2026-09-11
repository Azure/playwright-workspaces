# Recovery from Mid-Run Failures

What to do when something goes wrong in the middle of a `/verify` run. Applies across all phases (1 / 2 / 3 / Final Sanity).

## Browser crash or disconnected session

- Close the session: `playwright-cli close` (or `-s=<name> close`).
- **Start one retry** with a fresh session. Repeat the last step from a clean page load.
- If it crashes again, **surface as an environment issue** and stop. Report browser version, OS, and any console / driver errors. Don't keep retrying.

## Auth blocked by CAPTCHA, unsupported MFA, or delayed OTP

- **Stop.** Mark the step BLOCKED in the verification report or in the heal summary, depending on the phase.
- **Ask the user** for an approved test account, pre-captured `storageState`, or manual intervention.
- **Do not attempt CAPTCHA bypass** — it's against most ToS and unreliable.
- For OTP delivered to a real device, ask the user to deliver the code. Don't simulate.

## Network failure during navigation

- Retry the navigation **once** after confirming the app / server is reachable.
- If repeated, **surface as an environment issue** unless app console / network evidence points to an app bug (5xx with detailed app stack trace).

## App not running

- **Auto-start whatever the app needs** as part of Step 0. Find the dev script in `package.json` (`dev`, `start`, etc.), the `webServer.command` in `playwright.config.ts`, or `docker-compose.yml` services. Run them in the background and poll the URL until it responds (use a reasonable timeout — a minute or so is typical for cold starts). Track PIDs / container IDs so the processes can be stopped at the end of `/verify`.
- **This includes backend services.** `docker-compose up`, API servers, databases, Redis, queues — start them. The user is in their own dev environment; cleanup happens at the end of `/verify`.
- **Only ask before destructive setup.** If a script's name or command looks like it would erase data, reset state, or otherwise destroy something the user might care about, get explicit confirmation before running it.
- **Non-destructive migrations are fine** to auto-run (`db:migrate`, `migrate:up`).
- **If start-up fails for any other reason** (port in use, missing binary, network error): surface it as an environment issue, halt the pipeline, surface the start-up output to the user.

## Cleanup at the end of `/verify`

The skill stops every process / container it started during Step 0. Existing processes the user already had running are left alone. If cleanup fails (process refuses to stop), surface the PID / container ID so the user can stop it manually.

## Healer can't decide after snapshot + console + network + trace

- **Ask the user** before changing assertions or deleting tests.
- Provide: the failure mode, what you tried, why you can't tell whether it's test drift or a real app/environment issue.
- Never silently delete a test — see the stop-when-not-progressing rule in [phase-3-test-healing.md](./phase-3-test-healing.md) (and the same rule in Phase 2's authoring loop).

## Mid-run user interrupt

- If the user sends a new instruction mid-run, treat it as the new highest priority (instruction precedence rules).
- Briefly summarize what was completed, ask whether to discard or persist any work-in-progress.

## Generic principle

When in doubt: **stop, summarize what happened, ask the user.** Don't improvise destructive recovery (deleting files, running migrations, force-killing processes).
