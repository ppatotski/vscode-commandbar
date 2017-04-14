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
		* `palette`: executes vscode registered command (vscode extension commands)
* Configurable Status bar item properties (including text, tooltip, alignment, color, priority)
* Create default settings file (`Ctrl+Shift+P` type `CommandBar: Settings`)

[![Demo](demo.gif)](demo.gif)


## Configuration

### Config file example (`./.vscode/commandbar.json`)
```json
{
	"commands": [
		{
			"id": "serve",
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
			"id": "test",
			"text": "Test Polymer UI",
			"color": "lightgreen",
			"commandType": "script",
			"command": "test",
			"priority": 0
		},
		{
			"id": "fixall",
			"text": "❊",
			"tooltip": "ESLint: Fix All",
			"color": "orange",
			"commandType": "palette",
			"command": "eslint.executeAutofix",
			"alignment": "right",
			"priority": 0
		}
	]
}
```

### Configuration file schema (documentation)
```json
{
	"id": {
		"type": "string",
		"description": "Command unique identifier."
	},
	"text": {
		"type": "string",
		"description": "Displayed text of status bar item."
	},
	"command": {
		"type": "string",
		"description": "Command content according to commandType:\n1. 'exec': executes command e.g 'npm run serve' (default).\n2. 'script': executes package.json script.\n3. 'palette': executes vscode registered command."
	},
	"alignment": {
		"type": "string",
		"description": "Alignment of status bar item.",
		"enum": [ "left", "right" ],
		"default": "left"
	},
	"tooltip": {
		"type": "string",
		"description": "Tooltip of status bar item."
	},
	"color": {
		"type": "string",
		"description": "Text color of status bar item."
	},
	"priority": {
		"type": "number",
		"description": "Priority (placement) of status bar item."
	},
	"skipTerminateQuickPick": {
		"type": "boolean",
		"description": "Do not show Terminate QuickPick.",
		"default": false
	},
	"commandType": {
		"type": "string",
		"description": "Type of command.\n1. 'exec': executes command e.g 'npm run serve' (default).\n2. 'script': executes package.json script.\n3. 'palette': executes vscode registered command.",
		"enum": [
			"exec",
			"script",
			"palette"
		],
		"default": "exec"
	}
}
```
## Change Log

[Change Log](CHANGELOG.md)

## License

[MIT](LICENSE.md)
