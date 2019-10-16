// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const depcheck = require('depcheck');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vscode-depcheck" is now active!');
  console.log('Congratulations,', vscode.workspace.workspaceFolders[0].uri.path);

  depcheck(vscode.workspace.workspaceFolders[0].uri.path, {}, (unused) => {
    console.log(unused.dependencies); // an array containing the unused dependencies
    console.log(unused.devDependencies); // an array containing the unused devDependencies
    console.log(unused.missing); // a lookup containing the dependencies missing in `package.json` and where they are used
    console.log(unused.using); // a lookup indicating each dependency is used by which files
    console.log(unused.invalidFiles); // files that cannot access or parse
    console.log(unused.invalidDirs); // directories that cannot access
  });

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.depcheck', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World!');
	});

	context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
