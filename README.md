# Visual Studio Code Command bar

A Command bar within VSCode Status bar.

## Features

* Support long-running command termination
* Support all Status bar item options (including tooltip, alignment, color, priority)

[![Demo](demo.gif)](demo.gif)


## Configuration

### Config file example (`./.vscode/commandbar.json`)
```json
{
	"commands": [
		{
			"id": "serve",
			"text": "Serve",
			"tooltip": "Serve UI",
			"color": "yellow",
			"command": "npm run serve",
			"alignment": "left",
			"skipTerminateQuickPick": false,
			"priority": 0
		}
	]
}
```

### Configuration file Schema
```json
{
  "type": "object",
  "properties": {
    "commands": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [ "id", "text", "command" ],
        "properties": {
          "id": {
            "type": "string",
            "description": "Command identifier."
          },
          "text": {
            "type": "string",
            "description": "Displayed text of status bar item."
          },
          "command": {
            "type": "string",
            "description": "Command e.g npm run serve."
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
          }
        }
      }
    }
  }
}
```

## License

MIT
