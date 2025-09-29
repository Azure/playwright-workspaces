#!/usr/bin/env python3
"""
Helper script to run Playwright tests with different configurations.
"""

import subprocess
import sys
import argparse
import os


def run_command(command, description):
    """Run a command and handle the output."""
    print(f"\n🚀 {description}")
    print(f"Running: {command}")
    print("-" * 50)
    
    try:
        result = subprocess.run(command, shell=True, check=True)
        print(f"✅ {description} completed successfully!")
        return result.returncode
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed with exit code: {e.returncode}")
        return e.returncode


def main():
    parser = argparse.ArgumentParser(description="Playwright pytest test runner")
    parser.add_argument("--service", action="store_true", help="Run tests using Playwright Service")
    parser.add_argument("--local", action="store_true", help="Run tests using local browsers")
    parser.add_argument("--headed", action="store_true", help="Run in headed mode (local only)")
    parser.add_argument("--parallel", action="store_true", help="Run tests in parallel")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    parser.add_argument("--install", action="store_true", help="Install dependencies and browsers")
    
    args = parser.parse_args()
    
    # Install dependencies if requested
    if args.install:
        print("📦 Installing dependencies...")
        run_command("pip install -r requirements.txt", "Installing Python packages")
        if not args.service:
            run_command("python -m playwright install", "Installing browsers")
        return

    # Set environment variables based on arguments
    env = os.environ.copy()
    
    if args.service:
        # Check if service URL is configured
        if not env.get("PLAYWRIGHT_SERVICE_URL"):
            print("❌ PLAYWRIGHT_SERVICE_URL not found in environment variables.")
            print("Please set up your .env file with Playwright Service configuration.")
            print("Copy .env.example to .env and update with your service details.")
            return 1
        print("🌐 Using Playwright Service for remote browsers")
    elif args.local:
        # Ensure service URL is not set for local testing
        env.pop("PLAYWRIGHT_SERVICE_URL", None)
        print("🖥️  Using local browsers")
        if args.headed:
            env["HEADLESS"] = "false"
            print("👁️  Running in headed mode")
    
    # Build pytest command
    cmd_parts = ["python", "-m", "pytest"]
    
    if args.verbose:
        cmd_parts.append("-v")
    
    if args.parallel:
        cmd_parts.extend(["-n", "auto"])
    
    command = " ".join(cmd_parts)
    
    # Run the command with environment variables
    result = subprocess.run(command, shell=True, env=env)
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())