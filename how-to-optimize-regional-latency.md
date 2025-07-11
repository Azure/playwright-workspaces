---
title: Optimize regional latency
description: Learn how to optimize regional latency for a Playwright Workspaces Preview workspace. Choose to run tests on remote browsers in an Azure region nearest to you, or in a fixed region.
ms.topic: how-to
ms.date: 07/01/2025
ms.custom: playwright-workspaces-preview
---

# Optimize regional latency for a workspace in Playwright Workspaces Preview

Learn how to minimize the network latency between the client machine and the remote browsers for a Playwright Workspaces Preview workspace.

Playwright Workspaces lets you run your Playwright tests on hosted browsers in the Azure region that's nearest to your client machine. The service collects the test results in the Azure region of the remote browsers, and then transfers the results to the workspace region.

By default, when you create a new workspace, the service runs tests in an Azure region closest to the client machine. When you disable this setting on the workspace, the service uses remote browsers in the Azure region of the workspace.

> [!IMPORTANT]
> Playwright Workspaces is currently in preview. For legal terms that apply to Azure features that are in beta, in preview, or otherwise not yet released into general availability, see the [Supplemental Terms of Use for Microsoft Azure Previews](https://azure.microsoft.com/support/legal/preview-supplemental-terms/).

## Configure regional settings for a workspace

You can configure the regional settings for your workspace in the Azure portal.

1. Sign in to the [Azure portal](https://portal.azure.com) with your Azure account and navigate to your workspace.

1. In the **Settings** section, select **Region Management**.

1. In the **Region Management** page, choose the corresponding region selection option.

    By default, the service uses remote browsers in the Azure region that's closest to the client machine to minimize latency.

![Screenshot of the Region Management settings page](./media/how-to-optimize-regional-latency/configure-workspace-region-management.png )

## Related content

- Learn more about how to [determine the optimal configuration for optimizing test suite completion](./concept-determine-optimal-configuration.md).

- [Manage a Playwright workspace](./how-to-manage-playwright-workspace.md)

- [Understand how Playwright Workspaces works](./overview-what-is-microsoft-playwright-workspaces.md#how-it-works)
