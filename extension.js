const vscode = require('vscode');
const childProcess = require( 'child_process' );
const kill = require('tree-kill');
const fs = require('fs');
const path = require('path');

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
		let settingsPath = '';
		const vsSettingsCommand = vscode.commands.registerCommand('extension.commandbar.settings', () => {
			if(!settingsPath) {
				vscode.window.showErrorMessage('Commandbar can only be enabled if VS Code is opened on a workspace folder');
			} else {
				fs.stat(settingsPath, (err) => {
					if(!err) {
						vscode.workspace.openTextDocument(settingsPath).then(doc => {
							vscode.window.showTextDocument(doc);
						});
					} else {
						const options = ['Create New', 'Cancel'];

						vscode.window.showQuickPick(options)
							.then((option) => {
								if(option === options[0]) {
									vscode.workspace.openTextDocument(vscode.Uri.parse(`untitled:${settingsPath}`)).then(doc => {
										vscode.window.showTextDocument(doc).then((editor) => {
											editor.edit(edit => {
												edit.insert(new vscode.Position(0, 0), exampleJson);
											});
										});
									});
								}
							});
					}
				});
			}
		});
		context.subscriptions.push(vsSettingsCommand);
		if(vscode.workspace && vscode.workspace.rootPath) {
			settingsPath = path.join(vscode.workspace.rootPath, '.vscode', 'commandbar.json');
			const channel = vscode.window.createOutputChannel('Commandbar');
			let commandIndex = 0;
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
								const settings = JSON.parse(buffer);
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

									if(command.commandType === 'palette') {
										statusBarItem.command = command.command;
									} else {
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
															if (!skipErrorMessage) {
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
												} else {
													exec(command.command);
												}
											}

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
												channel.clear();
												channel.appendLine(`Execute '${command.text}' command...`);
												executeCommand();
												statusBarItem.text = inProgress;
												showOutput();
											}
										});
										context.subscriptions.push(vsCommand);
									}
								});

							}
						});
					}

				});
			}
			vscode.workspace.onDidSaveTextDocument((doc) => {
				if(vscode.languages.match({ pattern: settingsPath }, doc)) {
					refreshCommands();
				}
			});
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
