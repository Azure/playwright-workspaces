---
title: Playwright Workspaces free trial
description: Learn how to get started for free with Playwright Workspaces free trial.
ms.topic: how-to
ms.date: 07/01/2025
ms.custom: playwright-workspaces-preview
---

# Try Playwright Workspaces for free

Playwright Workspaces is a fully managed service for end-to-end testing built on top of Playwright. With the free trial, you can try Playwright Workspaces for free for 30 days and 100 test minutes. In this article, you learn about the limits of the free trial, how to get started, and how to track your free trial usage.

> [!IMPORTANT]
> Playwright Workspaces is currently in preview. For legal terms that apply to Azure features that are in beta, in preview, or otherwise not yet released into general availability, see the [Supplemental Terms of Use for Microsoft Azure Previews](https://azure.microsoft.com/support/legal/preview-supplemental-terms/).

## Prerequisites

* An Azure account with an active subscription. If you don't have an Azure subscription, create a [free account](https://azure.microsoft.com/free/?WT.mc_id=A261C142F) before you begin.
* Your Azure account needs the [Owner](https://learn.microsoft.com/azure/role-based-access-control/built-in-roles#owner), [Contributor](https://learn.microsoft.com/azure/role-based-access-control/built-in-roles#contributor), or one of the [classic administrator roles](https://learn.microsoft.com/azure/role-based-access-control/rbac-and-directory-admin-roles#classic-subscription-administrator-roles).

## Limits to free trial

The following table lists the limits for the Playwright Workspaces free trial.

| Resource | Limit |
|-|-|
| Duration of trial | 30 days |
| Total test minutes¹ | 100 minutes |
| Number of workspaces²³ | 1 |

¹ If your usage exceeds the free test minute limit, only the overage counts toward the pay-as-you-go billing model. See [Playwright Workspaces preview pricing](https://aka.ms/pww/pricing)

² These limits only apply to the *first* workspace you create in your Azure subscription. Any subsequent workspaces you create in the subscription automatically uses the pay-as-you-go billing model.

³ If you delete the free trial workspace, you can't create a new free trial workspace anymore.

> [!CAUTION]
> If you exceed any of these limits, the workspace is automatically converted to the pay-as-you-go billing model. Learn more about the [Playwright Workspaces pricing](https://aka.ms/pww/pricing).

## Create a workspace

To get started with running your Playwright tests on cloud browsers, you first need to create a Playwright workspace.

1. Sign in to the [Azure portal](https://portal.azure.com/).
1. Select the menu button in the upper-left corner of the portal, and then select **Create a resource** a resource.

    ![Screenshot that shows the Azure portal menu to create a new resource.](./media/how-to-manage-playwright-workspace/azure-portal-create-resource.png)

1. Enter *Playwright Workspaces* in the search box.
1. Select the **Playwright Workspaces** card, and then select **Create**.

    ![Screenshot that shows the Azure Marketplace search page with the Playwright Workspaces search result.](./media/how-to-manage-playwright-workspace/azure-portal-search-playwright-resource.png)

1. Provide the following information to configure a new Playwright workspace:

    |Field  |Description  |
    |---------|---------|
    |**Subscription**     | Select the Azure subscription that you want to use for this Playwright workspace. |
    |**Resource group**     | Select an existing resource group. Or select **Create new**, and then enter a unique name for the new resource group.        |
    |**Name**     | Enter a unique name to identify your workspace.<BR>The name can only consist of alphanumerical characters, and have a length between 3 and 64 characters. |
    |**Location**     | Select a geographic location to host your workspace. |

    > [!NOTE]
    > Optionally, you can configure more details on the **Tags** tab. Tags are name/value pairs that enable you to categorize resources and view consolidated billing by applying the same tag to multiple resources and resource groups.

1. After you're finished configuring the resource, select **Review + Create**.

1. Review all the configuration settings and select **Create** to start the deployment of the Playwright workspace.

    When the process has finished, a deployment success message appears.

1. To view the new workspace, select **Go to resource**.

    ![Screenshot that shows the deployment completion information in the Azure portal](./media/how-to-manage-playwright-workspace/create-resource-deployment-complete.png)

## Upgrade your workspace

When you exceed any of the limits of the free trial, your workspace is automatically converted to the pay-as-you-go billing model. 

All test runs linked to your workspace remain available.

## Next step

> [!div class="nextstepaction"]
> [Quickstart: Run Playwright tests at scale](quickstart-run-end-to-end-tests.md)
