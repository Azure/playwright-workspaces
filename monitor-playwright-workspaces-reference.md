---
title: Monitor Playwright Workspaces data reference
description: Important reference material needed when you monitor Playwright Workspaces.
ms.topic: reference
ms.date: 10/04/2023
ms.custom: playwright-workspaces-preview
---
# Monitor Playwright Workspaces data reference

Learn about the data and resources collected by Azure Monitor from your workspace in Playwright Workspaces. See [Monitor Playwright Workspaces](monitor-playwright-workspaces.md) for details on collecting and analyzing monitoring data.

> [!IMPORTANT]
> Playwright Workspaces is currently in preview. For legal terms that apply to Azure features that are in beta, in preview, or otherwise not yet released into general availability, see the [Supplemental Terms of Use for Microsoft Azure Previews](https://azure.microsoft.com/support/legal/preview-supplemental-terms/).

## Resource logs

This section lists the types of resource logs you can collect for Playwright Workspaces.

### Operational logs

Operational log entries include elements listed in the following table:

|Name  |Description  |
|---------|---------|
|Time     | Date and time when the record was created |
|ResourceId | Azure Resource Manager resource ID |
|Location	| Azure Resource Manager resource location |
|OperationName	| Name of the operation attempted on the resource | 
|Category	| Category of the emitted log |
|ResultType	| Indicates if the request was successful or failed |
|ResultSignature	| HTTP status code of the API response |
|ResultDescription	| Additional details about the result |
|DurationMs	| The duration of the operation in milliseconds |
|CorrelationId	| Unique identifier to be used to correlate logs |
|Level	| Security Level of the log |

## Related content

- See [Monitor Playwright Workspaces](./monitor-playwright-workspaces.md) for a description of monitoring Playwright Workspaces.
- See [Monitor Azure resources with Azure Monitor](/azure/azure-monitor/essentials/monitor-azure-resource) for details on monitoring Azure resources.