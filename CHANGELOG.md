# Change Log

## 0.2.20 (January 28, 2018)
- Improvement: Added support for url openning

## 0.2.19 (November 13, 2017)
- Bug: Fixed script command type extra execution issue

## 0.2.18 (November 10, 2017)
- Improvement: Added support for language filter for command

## 0.2.17 (November 2, 2017)
- Improvement: Added multi-command support for `palette` command type

## 0.2.16 (September 23, 2017)
- Improvement: Added `file` command type

## 0.2.15 (September 10, 2017)
- Improvement: Added global settings support

## 0.2.14 (July 21, 2017)
- Improvement: Updated documentation with link to [icons](https://octicons.github.com/)
- Improvement: Support comments in json configuration file

## 0.2.13 (July 7, 2017)
- Improvement: Documentation
- Issue: Adjusted extension to the latest VSCode extension requirements

## 0.2.12 (June 5, 2017)
- Improvement: Documentation
- Improvement: Extended configuration options (`skipTerminateQuickPick`, `skipSwitchToOutput` and `skipErrorMessage`)

## 0.2.11 (May 11, 2017)
- Improvement: Display message in case of failed executed command

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
