# Change Log

## 0.2.10 (May 4, 2017)
- Issue: Display `Commandbar can only be enabled if VS Code is opened on a workspace folder` command message

## 0.2.9 (May 1, 2017)
- Improvement: Apply changes in `commandbar.json` immediately

## 0.2.6 (April 20, 2017)
- Improvement: Deprecated command `id`

## 0.2.5 (April 14, 2017)
- Improvement: Different types of commands:
	* `exec`: executes command e.g `npm run serve` (default)
	* `script`: executes package.json script
	* `palette`: executes vscode registered command (vscode extension commands)

## 0.2.4 (April 12, 2017)
- Bug: Prompt for terminating of completed command execution
- Improvement: Async termination logic flow

## 0.2.2 (April 10, 2017)
- Feature: Create default settings file functionality

## 0.2.1 (April 08, 2017)
- Improvement: Extended command options (skipTerminateQuickPick, alignment, priority)

## 0.2.0 (April 07, 2017)
- Feature: Long-running command termination
- Feature: Configurable Status bar item options (including text, tooltip, color)
