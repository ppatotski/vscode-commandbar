# vscode-commandbar

[![Version](http://vsmarketplacebadge.apphb.com/version/gsppvo.vscode-commandbar.svg)](https://marketplace.visualstudio.com/items?itemName=gsppvo.vscode-commandbar)
[![Release](https://github.com/ppatotski/vscode-commandbar/releases)](https://img.shields.io/github/release/vscode-commandbar/vscode-commandbar.svg)

A Command bar within VSCode Status bar.

[![Demo](demo.gif)](demo.gif)


## Configuration

Example of config file (.vscode/commandbar.json)

```json
{
	"commands": [
		{
			"id": "serve",
			"text": "Serve",
			"tooltip": "Serve UI",
			"color": "yellow",
			"command": "npm run serve"
		}
	]
}
```

