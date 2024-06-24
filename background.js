chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.type) {
        case 'create':
            createWorkspace(request.name, request.fromCurrent, sendResponse);
            break;
        case 'delete':
            deleteWorkspace(request.name, sendResponse);
            break;
        case 'launch':
            launchWorkspace(request.name, sendResponse);
            break;
        case 'rename':
            renameWorkspace(request.oldName, request.newName, sendResponse);
            break;
        case 'list':
            listWorkspaces(sendResponse);
            break;
    }
    return true;  // Indicates that we will respond asynchronously
});

function createWorkspace(name, fromCurrent, sendResponse) {
    getStoredWorkspaces(function(workspaces) {
        if (workspaces[name]) {
            sendResponse({ success: false, message: 'Workspace already exists.' });
            return;
        }
        workspaces[name] = { tabs: [] };
        if (fromCurrent) {
            chrome.tabs.query({ currentWindow: true }, function(tabs) {
                workspaces[name].tabs = tabs.map(tab => ({ id: tab.id, url: tab.url, pinned: tab.pinned }));
                setStoredWorkspaces(workspaces, function() {
                    sendResponse({ success: true });
                });
            });
        } else {
            setStoredWorkspaces(workspaces, function() {
                sendResponse({ success: true });
            });
        }
    });
}

function deleteWorkspace(name, sendResponse) {
    getStoredWorkspaces(function(workspaces) {
        if (!workspaces[name]) {
            sendResponse({ success: false, message: 'Workspace does not exist.' });
            return;
        }
        delete workspaces[name];
        setStoredWorkspaces(workspaces, function() {
            sendResponse({ success: true });
        });
    });
}

function launchWorkspace(name, sendResponse) {
    getStoredWorkspaces(function(workspaces) {
        let workspace = workspaces[name];
        if (!workspace) {
            sendResponse({ success: false, message: 'Workspace does not exist.' });
            return;
        }
        chrome.windows.create({ url: workspace.tabs.map(tab => tab.url) }, function(window) {
            workspace.windowId = window.id;
            chrome.tabs.query({ windowId: window.id }, function(tabs) {
                workspace.tabs = tabs.map(tab => ({ id: tab.id, url: tab.url, pinned: tab.pinned }));
                setStoredWorkspaces(workspaces, function() {
                    sendResponse({ success: true });
                });
            });
        });
    });
}

function renameWorkspace(oldName, newName, sendResponse) {
    getStoredWorkspaces(function(workspaces) {
        if (workspaces[newName]) {
            sendResponse({ success: false, message: 'New workspace name already exists.' });
            return;
        }
        if (workspaces[oldName]) {
            workspaces[newName] = workspaces[oldName];
            delete workspaces[oldName];
            setStoredWorkspaces(workspaces, function() {
                sendResponse({ success: true });
            });
        } else {
            sendResponse({ success: false, message: 'Old workspace name does not exist.' });
        }
    });
}

function listWorkspaces(sendResponse) {
    getStoredWorkspaces(function(workspaces) {
        let workspaceList = Object.keys(workspaces).map(name => ({
            name: name,
            tabs: workspaces[name].tabs.length
        }));
        sendResponse(workspaceList);
    });
}

function getStoredWorkspaces(callback) {
    chrome.storage.local.get('workspaces', function(data) {
        callback(data.workspaces || {});
    });
}

function setStoredWorkspaces(workspaces, callback) {
    chrome.storage.local.set({ 'workspaces': workspaces }, callback);
}

// Tab event listeners
chrome.tabs.onCreated.addListener(function(tab) {
    console.log("Tab created: ", tab);
    getStoredWorkspaces(function(workspaces) {
        updateWorkspaceTabs(tab.windowId, workspaces, function(tabs) {
            tabs.push({ id: tab.id, url: tab.url, pinned: tab.pinned });
            return tabs;
        });
    });
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    console.log("Tab removed: ", tabId);
    getStoredWorkspaces(function(workspaces) {
        updateWorkspaceTabs(removeInfo.windowId, workspaces, function(tabs) {
            return tabs.filter(tab => tab.id !== tabId);
        });
    });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    console.log("Tab updated: ", tab);
    if (!changeInfo.url) return;
    getStoredWorkspaces(function(workspaces) {
        updateWorkspaceTabs(tab.windowId, workspaces, function(tabs) {
            let foundTab = tabs.find(t => t.id === tabId);
            if (foundTab) {
                foundTab.url = changeInfo.url;
            }
            return tabs;
        });
    });
});

function updateWorkspaceTabs(windowId, workspaces, updateCallback) {
    let workspaceUpdated = false;
    for (let name in workspaces) {
        let workspace = workspaces[name];
        if (workspace.windowId === windowId) {
            workspace.tabs = updateCallback(workspace.tabs);
            workspaceUpdated = true;
            break;
        }
    }
    if (workspaceUpdated) {
        setStoredWorkspaces(workspaces, function() {});
    }
}

// Window event listeners
chrome.windows.onRemoved.addListener(function(windowId) {
    console.log("Window removed: ", windowId);
    getStoredWorkspaces(function(workspaces) {
        for (let name in workspaces) {
            let workspace = workspaces[name];
            if (workspace.windowId === windowId) {
                delete workspace.windowId;
                setStoredWorkspaces(workspaces, function() {});
                break;
            }
        }
    });
});
