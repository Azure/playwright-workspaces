# Playwright Workspaces

Playwright Workspaces is a fully managed service for end-to-end testing built on top of Playwright. With Playwright, you can automate end-to-end tests to ensure your web applications work the way you expect, across different web browsers and operating systems.

Get started with [Quickstart: run your Playwright tests at scale with Playwright Workspaces](./quickstart-run-end-to-end-tests.md).

> [!IMPORTANT]
> Playwright Workspaces is currently in preview. For legal terms that apply to Azure features that are in beta, in preview, or otherwise not yet released into general availability, see the [Supplemental Terms of Use for Microsoft Azure Previews](https://azure.microsoft.com/support/legal/preview-supplemental-terms/).

## Documentation

### Overview
- [What is Playwright Workspaces?](overview-what-is-microsoft-playwright-workspaces.md)
- [Try Playwright Workspaces for free](how-to-try-playwright-workspaces-free.md)
- [Pricing](pricing.md)

## Get started

### Quickstart
- [Run end-to-end web tests at scale](quickstart-run-end-to-end-tests.md)
- [Set up continuous end-to-end testing](quickstart-automate-end-to-end-testing.md)

### Concept
- [Determine optimal test suite configuration](concept-determine-optimal-configuration.md)

## Manage workspaces

### How-to guide
- [Optimize regional latency](how-to-optimize-regional-latency.md)
- [Manage workspaces](how-to-manage-playwright-workspace.md)

## Security

### How-to guide
- [Manage access tokens](how-to-manage-access-tokens.md)
- [Manage workspace access](how-to-manage-workspace-access.md)
- [Manage authentication](how-to-manage-authentication.md)

---

## What is Playwright Workspaces?



---

## Accelerate tests with parallel remote browsers

As your application becomes more complex, your test suite increases in size. The time to complete your test suite also grows accordingly. Use parallel remote browsers to shorten the overall test suite completion time.

- Distribute your tests across many parallel browsers, hosted on cloud infrastructure.
- Scale your tests beyond the processing power of your developer workstation, local infrastructure, or CI agent machines.
- Ensure consistent regional performance by running your tests on browsers in an Azure region that's closest to your client machine.

Learn more about how you can [configure for optimal performance](./concept-determine-optimal-configuration.md).

---

## Test consistently across multiple operating systems and browsers

Modern web apps need to work flawlessly across numerous browsers, operating systems, and devices.

- Run tests simultaneously across all modern browsers on Windows, Linux, and mobile emulation of Google Chrome for Android and Mobile Safari.
- Using service-managed browsers ensures consistent and reliable results for both functional and visual regression testing, whether tests are run from your team's developer workstations or CI pipeline.
- Playwright Workspaces supports all [browsers supported by Playwright](https://playwright.dev/docs/release-notes).

---

## Endpoint testing

Use cloud-hosted remote browsers to test web applications regardless of where they're hosted, without having to allow inbound connections on your firewall.

- Test publicly and privately hosted applications.
- During development, [run tests against a localhost development server](./how-to-test-local-applications.md).

---

## Playwright support

Playwright Workspaces is built on top of the Playwright framework.

- Support for multiple versions of Playwright with each new Playwright release.
- Integrate your existing Playwright test suite without changing your test code.
- Use the [Playwright Test Visual Studio Code extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) for a rich editor experience.
- Continuous end-to-end testing by using the Playwright CLI to [integrate with continuous integration (CI) tools](./quickstart-automate-end-to-end-testing.md).

---

## How it works

Playwright Workspaces instantiates cloud-hosted browsers across different operating systems. Playwright runs on the client machine and interacts with Playwright Workspaces to run your Playwright tests on the hosted browsers. The client machine can be your developer workstation or a CI agent machine if you run your tests as part of your CI workflow. The Playwright test code remains on the client machine during the test run.

![Diagram that shows an architecture overview of Playwright Workspaces.](./media/overview-what-is-microsoft-playwright-workspaces/playwright-workspaces-architecture-overview.png)

After a test run completes, the test results, trace files, and other test run files are available on the client machine. These are then published to the service from the client machine and can be viewed in the service portal.

To run existing tests with Playwright Workspaces requires no changes to your test code; install the Playwright Workspaces package and specify the endpoint for your workspace.

Learn more about how to [determine the optimal configuration for optimizing test suite completion](./concept-determine-optimal-configuration.md).

---

## In-region data residency & data at rest

Playwright Workspaces doesn't store or process customer data outside the region you deploy the workspace in. When you use the regional affinity feature, the metadata is transferred from the cloud-hosted browser region to the workspace region in a secure and compliant manner.

Playwright Workspaces automatically encrypts all data stored in your workspace with keys managed by Microsoft (service-managed keys). For example, this data includes workspace details, Playwright test run metadata like test start and end time, test minutes, who ran the test, and test results which are published to the service.

---

## Next step

> **Next step**
> [Quickstart: Run Playwright tests at scale](quickstart-run-end-to-end-tests.md)
