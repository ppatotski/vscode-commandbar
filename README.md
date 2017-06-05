# Visual Studio Code Command bar

A Command bar within VSCode Status bar.

## Get Started

[![Get Started](getstarted.gif)](getstarted.gif)

## Features

* Execute command:
	- Long-running command termination
	- 3 types of commands:
		* `exec`: executes command e.g `npm run serve` (default)
		* `script`: executes package.json script
		* `palette`: executes any vscode registered command (vscode extension commands)
* Configurable Status bar item properties (including text, tooltip, alignment, color, priority)
* Create default settings file (`Ctrl+Shift+P` or `Cmd+Shift+P` type `Commandbar: Settings`)
	- Apply settings immediately after saving changes in `./.vscode/commandbar.json` file

[![Demo](demo.gif)](demo.gif)

## Settings Reference

General options
* **skipTerminateQuickPick** Do not show Terminate QuickPick.
	> Terminates running command by default
* **skipSwitchToOutput** Do not switch to Output.
* **skipErrorMessage** Do not popup Error message.
* **commands** List of commands.

Command options
* **text** Displayed text of status bar item.
	> Supports unicode "icon" that can be found [here](https://unicode-table.com/) ).
* **command** Command content according to commandType:
	- 'exec': executes command e.g 'npm run serve' (default).
	- 'script': executes package.json script.
	- 'palette': executes any vscode registered command.
* **alignment** Alignment of status bar item.
* **tooltip** Tooltip of status bar item.
* **color** Text color of status bar item.
* **priority** Priority (placement) of status bar item.
* **commandType** Type of command.
	- 'exec': executes command e.g 'npm run serve' (default).
	- 'script': executes package.json script.
	- 'palette': executes any vscode registered command.
* **skipTerminateQuickPick** overwrite general `skipTerminateQuickPick` option.
* **skipSwitchToOutput** overwrite general `skipSwitchToOutput` option.
* **skipErrorMessage** overwrite general `skipErrorMessage` option.

## Config file example (`./.vscode/commandbar.json`)

```json
{
	"skipTerminateQuickPick": true,
	"skipSwitchToOutput": false,
	"skipErrorMessage": true,
	"commands": [
		{
			"text": "Serve Polymer UI",
			"tooltip": "Serve Polymer UI",
			"color": "yellow",
			"commandType": "exec",
			"command": "polymer serve",
			"alignment": "left",
			"skipTerminateQuickPick": false,
			"priority": 1
		},
		{
			"text": "Test Polymer UI",
			"color": "lightgreen",
			"commandType": "script",
			"command": "test",
			"priority": 2
		},
		{
			"text": "☯",
			"tooltip": "ESLint: Fix All",
			"color": "orange",
			"commandType": "palette",
			"command": "eslint.executeAutofix",
			"alignment": "right",
			"priority": 3
		}
	]
}
```

## Change Log

[Change Log](CHANGELOG.md)

## License

[MIT](LICENSE.md)
