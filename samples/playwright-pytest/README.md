# Playwright with pytest Sample Test Suite

This is a sample test suite demonstrating how to use Playwright with pytest for end-to-end testing. It supports both local browser execution and remote browser execution via Playwright Service.

## 📁 Project Structure

```
playwright-pytest/
├── conftest.py              # Global pytest configuration and fixtures
├── pytest.ini              # pytest configuration file
├── requirements.txt         # Python dependencies
├── README.md               # This file
├── .env.example            # Environment variables template
├── test-results/           # Test artifacts (screenshots, etc.)
└── tests/                  # Test files
    └── test_example.py     # Sample Playwright tests
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

### Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Install Playwright browsers (for local testing only):**
   ```bash
   python -m playwright install
   ```

3. **Configure Playwright Service (optional):**
   ```bash
   # Copy the environment template
   copy .env.example .env
   
   # Edit .env file with your Playwright Service details
   # PLAYWRIGHT_SERVICE_URL=wss://your-service-name.playwright.io
   # PLAYWRIGHT_SERVICE_ACCESS_TOKEN=your-access-token
   ```

## 🧪 Running Tests

### Basic Commands

```bash
# Run all tests in parallel
python -m pytest tests/test_example.py -v -s --numprocesses 10

```

### Environment Variables

You can customize test execution using environment variables:

```bash
# Run tests in headed mode (visible browser) - Local only
set HEADLESS=false
python -m pytest -v -s --numprocesses 10

```

## 🌐 Playwright Service Integration

This test suite supports running tests on remote browsers via Playwright Service. This allows you to run tests in the cloud without managing local browser installations.

### Setting up Playwright Service

1. **Create a .env file:**
   ```bash
   copy .env.example .env
   ```

2. **Configure your service connection in .env:**
   ```bash
   PLAYWRIGHT_SERVICE_URL=wss://your-service-name.playwright.io
   PLAYWRIGHT_SERVICE_ACCESS_TOKEN=your-access-token
   ```

3. **Run tests with Playwright Service:**
   ```bash
   # Tests will automatically use the service if PLAYWRIGHT_SERVICE_URL is set
   python -m pytest -v
   ```

### Local vs Service Testing

| Mode | Browser Location | Configuration |
|------|------------------|---------------|
| **Local** | Your machine | Requires `python -m playwright install` |
| **Service** | Remote cloud | Requires `PLAYWRIGHT_SERVICE_URL` in .env |

**Automatic Detection:** The test suite automatically detects if you're using Playwright Service based on the `PLAYWRIGHT_SERVICE_URL` environment variable.

### Benefits of Playwright Service

- ✅ No local browser installation required
- ✅ Consistent browser versions across environments
- ✅ Scalable parallel execution
- ✅ Reduced infrastructure maintenance

## 📊 Test Reports and Artifacts

Test failures automatically generate screenshots in the `test-results/screenshots/` directory.

## 🔧 Configuration

### pytest.ini

Contains pytest configuration including:
- Test discovery patterns
- Default command-line options
- Test markers

### conftest.py

Global configuration and fixtures:
- Browser context configuration
- Test data fixtures
- Screenshot directory setup

## 📝 Writing New Tests

Follow the existing pattern in `test_example.py`:

```python
import pytest
from playwright.sync_api import Page, expect

def test_example(page: Page):
    page.goto("https://example.com")
    expect(page).to_have_title("Example Domain")
```

## 📖 Additional Resources

- [Playwright Documentation](https://playwright.dev/python/)
- [pytest Documentation](https://docs.pytest.org/)
- [pytest-playwright Plugin](https://pytest-playwright.readthedocs.io/)