# Visual Studio Code Command bar

[![Version](http://vsmarketplacebadge.apphb.com/version/gsppvo.vscode-commandbar.svg)](https://marketplace.visualstudio.com/items?itemName=gsppvo.vscode-commandbar)

[![GitHub release](https://img.shields.io/github/release/ppatotski/vscode-commandbar.svg)](https://github.com/ppatotski/vscode-commandbar/releases)

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

## License

MIT
