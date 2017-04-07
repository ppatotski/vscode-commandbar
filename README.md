# vscode-commandbar

A Command bar within VSCode Status bar.

## Configuration

Example of config file (.vscode/commandbar.json)

```javascript
{
	"commands": [
		{
			"id": "serve",
			"text": "Serve",
			"tooltip": "Serve My UI",
			"color": "yellow",
			"command": "npm run serve"
		}
	]
}
```