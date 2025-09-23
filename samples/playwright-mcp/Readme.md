# Using Azure playwright cloud browsers with playwright mcp tool
Playwright mcp server allow to use remote browser via config


## Steps
- Add playwright mcp server as given in mcp.json
- Add config file in C:\Users\{user} or find out the location as per mcp
- in config.json, update playwright workspace params as below
    - __Region__ : workspace region
    - __workspaceId__ : workspaceId can be find in azure portal in browser endpoint
    - __access_token__ : generate token from portal workspace resource
- start/restart playwright mcp and check no error

## Validate
Navigate to any url and request will go to cloud browser.