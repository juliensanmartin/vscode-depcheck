const vscode = require('vscode');
const depcheck = require('depcheck');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let timeout = undefined;

  // create a decorator type that we use to decorate small numbers
  const unusedDependenciesDecorationType = vscode.window.createTextEditorDecorationType(
    {
      borderWidth: '1px',
      borderStyle: 'solid',
      overviewRulerColor: 'blue',
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      light: {
        // this color will be used in light color themes
        borderColor: 'darkblue'
      },
      dark: {
        // this color will be used in dark color themes
        borderColor: 'lightblue'
      }
    }
  );

  // create a decorator type that we use to decorate large numbers
  //   const unusedDependenciesDecorationType = vscode.window.createTextEditorDecorationType(
  //     {
  //       cursor: 'crosshair',
  //       // use a themable color. See package.json for the declaration and default values.
  //       backgroundColor: { id: 'myextension.largeNumberBackground' }
  //     }
  //   );

  let activeEditor = vscode.window.activeTextEditor;

  const text = activeEditor.document.getText();

  const depcheckResult = unused => {
    console.log(unused.dependencies); // an array containing the unused dependencies
    // console.log(unused.devDependencies); // an array containing the unused devDependencies
    // console.log(unused.missing); // a lookup containing the dependencies missing in `package.json` and where they are used
    // console.log(unused.using); // a lookup indicating each dependency is used by which files
    // console.log(unused.invalidFiles); // files that cannot access or parse
    // console.log(unused.invalidDirs); // directories that cannot access
    let unusedDependencies = [];

    unused.dependencies.map(dependency => {
      const regEx = new RegExp(`"${dependency}"`);
      let match = regEx.exec(text);

      const startPos = activeEditor.document.positionAt(match.index);
      const endPos = activeEditor.document.positionAt(
        match.index + match[0].length
      );
      const decoration = {
        range: new vscode.Range(startPos, endPos),
        hoverMessage: `Unused dependency ** ${dependency} **`
      };

      unusedDependencies.push(decoration);
    });

    activeEditor.setDecorations(
      unusedDependenciesDecorationType,
      unusedDependencies
    );
  };

  function updateDecorations() {
    if (!activeEditor) {
      return;
    }

    depcheck(vscode.workspace.workspaceFolders[0].uri.path, {}, depcheckResult);
  }

  function triggerUpdateDecorations() {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }
    timeout = setTimeout(updateDecorations, 500);
  }

  if (activeEditor) {
    triggerUpdateDecorations();
  }

  vscode.window.onDidChangeActiveTextEditor(
    editor => {
      activeEditor = editor;
      if (editor) {
        triggerUpdateDecorations();
      }
    },
    null,
    context.subscriptions
  );

  vscode.workspace.onDidChangeTextDocument(
    event => {
      if (activeEditor && event.document === activeEditor.document) {
        triggerUpdateDecorations();
      }
    },
    null,
    context.subscriptions
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
