# Playwright with pytest Sample Test Suite

This is a sample test suite demonstrating how to use Playwright with pytest for end-to-end testing. It supports both local browser execution and remote browser execution via Playwright Service.

# Using Playwright Test Runner with Playwright Workspaces

This sample demonstrates how to run Playwright tests using cloud-hosted browsers provided by [Playwright Workspace](https://aka.ms/pww/docs).

## How to Use this Sample

### Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

### Steps to Run

1. **Clone this repository and navigate to the sample**

    ```bash
    git clone https://github.com/Azure/playwright-workspaces.git
    cd playwright-workspaces/samples/playwright-pytest
    ```

2. **Install dependencies**

    ```bash
    pip install -r requirements.txt
    ```
> 💡 Browsers are not required when using service

3. **Create a Playwright Workspace**  
   Follow the [Getting Started guide](https://aka.ms/pww/docs/quickstart) to create your workspace.

4. **Set the Playwright Service endpoint**

    - **macOS / Linux**:

        ```bash
        export PLAYWRIGHT_SERVICE_URL="wss://<your-service-endpoint>"
        ```

    - **Windows PowerShell**:

        ```powershell
        $env:PLAYWRIGHT_SERVICE_URL = "wss://<your-service-endpoint>"
        ```
    > 💡 Or use .env file to declare required env variables.
    
5. **Set the Authentication with Playwright Service endpoint**
    - **macOS / Linux**:

        ```bash
        export PLAYWRIGHT_SERVICE_ACCESS_TOKEN="token"
        ```

    - **Windows PowerShell**:

        ```powershell
        $env:PLAYWRIGHT_SERVICE_ACCESS_TOKEN = "token"
        ```
    > 💡 Generate Token from playwright workspace
    
6. **Run the full test suite using the Playwright Workspaces configuration**

    ```bash
    python -m pytest -v -s --numprocesses 10
    ```

    > 💡 Adjust the `--numprocesses` value based on your system resources and workspace quota. Use `--numprocesses=1` when debugging or running locally.


## Need Help?

If you run into issues, open an issue in this repository or refer to the [Playwright Workspaces documentation](https://aka.ms/pww/docs).






