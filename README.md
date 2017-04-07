# vscode-commandbar

[![Version](http://vsmarketplacebadge.apphb.com/version/gsppvo.vscode-commandbar.svg)](https://marketplace.visualstudio.com/items?itemName=gsppvo.vscode-commandbar)

A Command bar within VSCode Status bar.

[![Demo](demo.gif)](demo.gif)


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