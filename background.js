chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type === 'create') {
    createWorkspace(request.name);
  } else if (request.type === 'delete') {
    deleteWorkspace(request.name);
  } else if (request.type === 'launch') {
    launchWorkspace(request.name);
  } else if (request.type === 'list') {
    sendResponse(listWorkspaces());
  }
});

function createWorkspace(name) {
  let workspaces = JSON.parse(localStorage.getItem('workspaces') || '{}');
  if (!workspaces[name]) {
    workspaces[name] = { tabs: [] };
    localStorage.setItem('workspaces', JSON.stringify(workspaces));
  }
}

function deleteWorkspace(name) {
  let workspaces = JSON.parse(localStorage.getItem('workspaces') || '{}');
  delete workspaces[name];
  localStorage.setItem('workspaces', JSON.stringify(workspaces));
}

function launchWorkspace(name) {
  let workspaces = JSON.parse(localStorage.getItem('workspaces') || '{}');
  let workspace = workspaces[name];
  if (workspace) {
    chrome.windows.create({ url: workspace.tabs.map(tab => tab.url) }, function(window) {
      workspace.windowId = window.id; // Save the window ID for tab management
      localStorage.setItem('workspaces', JSON.stringify(workspaces));
    });
  }
}

function listWorkspaces() {
  let workspaces = JSON.parse(localStorage.getItem('workspaces') || '{}');
  return Object.keys(workspaces).map(name => ({ name: name, tabs: workspaces[name].tabs.length }));
}