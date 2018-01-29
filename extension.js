const vscode = require('vscode');
const childProcess = require( 'child_process' );
const kill = require('tree-kill');
const fs = require('fs');
const path = require('path');
const strip = require('strip-json-comments');

const statusBarItems = {};
const exampleJson = `{
	"skipTerminateQuickPick": true,
	"skipSwitchToOutput": false,
	"skipErrorMessage": true,
	"commands": [
		{
			"text": "☯ Serve",
			"tooltip": "Serve UI",
			"color": "yellow",
			"command": "npm run serve",
			"alignment": "left",
			"skipTerminateQuickPick": false,
			"priority": 0
		}
	]
}`;

function activate(context) {
	try {
		let workspaceSettings = false;
		let settingsPath = path.join(process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE, 'commandbar.json');
		const vsSettingsCommand = vscode.commands.registerCommand('extension.commandbar.settings', () => {
			if(!settingsPath) {
				vscode.window.showErrorMessage('Commandbar can only be enabled if VS Code is opened on a workspace folder');
			} else {
				fs.stat(settingsPath, (err) => {
					if(!err && workspaceSettings) {
						vscode.workspace.openTextDocument(settingsPath).then(doc => {
							vscode.window.showTextDocument(doc);
						});
					} else {
						const options = [];
						if (vscode.workspace && vscode.workspace.rootPath) {
							options.push('Create Workspace Settings');
						}
						if (err) {
							options.push('Create Global Settings');
						} else {
							options.push('Open Global Settings');
						}
						options.push('Cancel');

						vscode.window.showQuickPick(options)
							.then((option) => {
								if (option === 'Create Workspace Settings') {
									settingsPath = path.join(vscode.workspace.rootPath, '.vscode', 'commandbar.json')
								}
								if(option === 'Create Workspace Settings' || option === 'Create Global Settings') {
									vscode.workspace.openTextDocument(vscode.Uri.parse(`untitled:${settingsPath}`)).then(doc => {
										vscode.window.showTextDocument(doc).then((editor) => {
											editor.edit(edit => {
												edit.insert(new vscode.Position(0, 0), exampleJson);
											});
										});
									});
								} else if (option === 'Open Global Settings') {
									vscode.workspace.openTextDocument(settingsPath).then(doc => {
										vscode.window.showTextDocument(doc);
									});
								}
							});
					}
				});
			}
		});
		context.subscriptions.push(vsSettingsCommand);
		const channel = vscode.window.createOutputChannel('Commandbar');
		let commandIndex = 0;
		let settings;
		const refreshCommands = function refreshCommands() {
			Object.keys(statusBarItems).forEach((key) => {
				statusBarItems[key].hide();
			});
			fs.stat(settingsPath, (err) => {
				if(!err) {
					fs.readFile(settingsPath, (err, buffer) => {

						if(err) {
							console.error(err);
						} else {
							settings = JSON.parse(strip(buffer.toString()));
							settings.commands.forEach( (command) => {
								commandIndex += 1;
								const alignment = command.alignment === 'right'? vscode.StatusBarAlignment.Right: vscode.StatusBarAlignment.Left;
								const statusBarItem = vscode.window.createStatusBarItem(alignment, command.priority);
								const commandId = `extension.commandbar.command_${commandIndex}`;
								const inProgress = `${command.text} (in progress)`;
								const skipSwitchToOutput = command.skipSwitchToOutput === undefined ? settings.skipSwitchToOutput : command.skipSwitchToOutput;
								const skipTerminateQuickPick = command.skipTerminateQuickPick === undefined ? settings.skipTerminateQuickPick : command.skipTerminateQuickPick;
								const skipErrorMessage = command.skipErrorMessage === undefined ? settings.skipErrorMessage : command.skipErrorMessage;

								statusBarItem.text = command.text;
								statusBarItem.tooltip = command.tooltip;
								statusBarItem.color = command.color;
								statusBarItem.command = commandId;
								statusBarItem.show();
								statusBarItems[commandId] = statusBarItem;
								context.subscriptions.push(statusBarItem);

								const showOutput = function showOutput() {
									if(!skipSwitchToOutput) {
										channel.show();
									}
								}
								const vsCommand = vscode.commands.registerCommand(commandId, () => {
									const executeCommand = function executeCommand() {
										const exec = function exec(commandContent) {
											const process = childProcess.exec(commandContent, { cwd: vscode.workspace.rootPath, maxBuffer: 1073741824 }, (err) => {
												statusBarItem.text = command.text;
												statusBarItem.process = undefined;
												if(!statusBarItem.aboutToBeKilled) {
													if (!skipErrorMessage && err) {
														vscode.window.showErrorMessage(`Execution of '${command.text}' command has failed: ${err.message} (see output for details)`);
													}
													showOutput();
												}
												statusBarItem.aboutToBeKilled = false;
											});
											process.stdout.on('data', data => channel.append(data));
											process.stderr.on('data', data => channel.append(data));
											statusBarItem.process = process;
										}

										if(command.commandType === 'script') {
											exec(`npm run ${command.command}`);
										} else if (command.commandType === 'palette') {
											const executeNext = function executeNext(palette, index) {
												const commargs = palettes[index].split(':');
												vscode.commands.executeCommand(commargs[0],...commargs.slice(1)).then(() => {
													index += 1;
													if(index < palettes.length) {
														executeNext(palettes, index);
													}
												}, (err) => {
													vscode.window.showErrorMessage(`Execution of '${command.text}' command has failed: ${err.message}`);
												});
											}
											const palettes = command.command.split(',');
											executeNext(palettes, 0);
										} else {
											exec(command.command);
										}
									}

									if(command.commandType === 'file') {
										const openFile = function openFile( rawPath ) {
											const uri = vscode.Uri.parse(rawPath);
											if( uri.scheme ) {
												vscode.commands.executeCommand('vscode.open', uri);
											} else {
												let file = rawPath;
												if( file[0] === '~' ) {
													file = file.replace('~', process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE);
												} else if( file[0] === '.' ) {
													file = file.replace('.', vscode.workspace.rootPath);
												}
												vscode.workspace.openTextDocument(file).then(doc => {
													vscode.window.showTextDocument(doc);
												});
											}
										}
										if( command.command ) {
											let files = command.command.split(',');
											if( files.length > 1 ) {
												if( !vscode.workspace.rootPath ) {
													files = files.filter( file => file[0] !== '.' );
												}
												vscode.window.showQuickPick(files)
													.then((file) => {
														openFile(file);
													});
											} else {
												openFile(files[0]);
											}
										}
									} else {
										if(statusBarItem.process) {
											if(!skipTerminateQuickPick) {
												const options = ['Terminate', 'Terminate and Execute', 'Execute without terminating already running command', 'Cancel'];

												vscode.window.showQuickPick(options)
													.then((option) => {
														if(option === options[0]) {
															statusBarItem.aboutToBeKilled = true;
															kill(statusBarItem.process.pid, 'SIGTERM', () => {
																channel.appendLine('Terminated!');
																statusBarItem.process = undefined;
																statusBarItem.text = command.text;
															});
														} else if(option === options[1]) {
															statusBarItem.aboutToBeKilled = true;
															kill(statusBarItem.process.pid, 'SIGTERM', () => {
																statusBarItem.text = inProgress;
																showOutput();
																channel.clear();
																channel.appendLine(`Execute '${command.text}' command...`);
																executeCommand();
															});
														} else if(option === options[2]) {
															channel.clear();
															channel.appendLine(`Execute '${command.text}' command...`);
															statusBarItem.process = undefined;
															executeCommand();
															statusBarItem.text = inProgress;
															showOutput();
														}
													});
											} else {
												statusBarItem.aboutToBeKilled = true;
												kill(statusBarItem.process.pid, 'SIGTERM', () => {
													channel.appendLine('Terminated!');
													statusBarItem.process = undefined;
													statusBarItem.text = command.text;
												});
											}
										} else {
											if(command.commandType !== 'palette') {
												channel.clear();
												channel.appendLine(`Execute '${command.text}' command...`);
												executeCommand();
												statusBarItem.text = inProgress;
												showOutput();
											} else {
												executeCommand();
											}
										}
									}
								});
								context.subscriptions.push(vsCommand);
							});
						}
					});
				}

			});
		}
		vscode.window.onDidChangeActiveTextEditor((event) => {
			if(settings) {
				settings.commands.forEach(command => {
					if(command.language) {
						let statusBarItem;
						Object.keys(statusBarItems).forEach((key) => {
							if(statusBarItems[key].text === command.text) {
								statusBarItem = statusBarItems[key];
							}
						});
						vscode.languages.match({ language: command.language }, event.document);
						if(vscode.languages.match({ language: command.language }, event.document)) {
							statusBarItem.show();
						} else {
							statusBarItem.hide();
						}
					}
				});
			}
		});
		vscode.workspace.onDidSaveTextDocument((doc) => {
			if(vscode.languages.match({ pattern: settingsPath }, doc)) {
				refreshCommands();
			}
		});
		if(vscode.workspace && vscode.workspace.rootPath) {
			const workspacePath = path.join(vscode.workspace.rootPath, '.vscode', 'commandbar.json');
			fs.stat(workspacePath, (err) => {
				if(!err) {
					settingsPath = workspacePath;
					workspaceSettings = true;
				}
				refreshCommands();
			});
		} else {
			refreshCommands();
		}

	} catch(err) {
		console.error(err);
	}
}

exports.activate = activate;

function deactivate() {
	Object.keys(statusBarItems).forEach((key) => {
		if(statusBarItems[key].process) {
			kill(statusBarItems[key].process.pid);
		}
	});
}

exports.deactivate = deactivate;
