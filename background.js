chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.type) {
        case 'create':
            sendResponse(createWorkspace(request.name, request.fromCurrent));
            break;
        case 'delete':
            sendResponse(deleteWorkspace(request.name));
            break;
        case 'launch':
            sendResponse(launchWorkspace(request.name));
            break;
        case 'rename':
            sendResponse(renameWorkspace(request.oldName, request.newName));
            break;
        case 'list':
            sendResponse(listWorkspaces());
            break;
    }
});

function createWorkspace(name, fromCurrent) {
    let workspaces = getStoredWorkspaces();
    if (workspaces[name]) {
        return { success: false, message: 'Workspace already exists.' };
    }
    workspaces[name] = { tabs: [] };
    if (fromCurrent) {
        let tabs = chrome.tabs.query({ currentWindow: true }, function(tabs) {
            workspaces[name].tabs = tabs.map(tab => ({ url: tab.url, pinned: tab.pinned }));
            setStoredWorkspaces(workspaces);
        });
    } else {
        setStoredWorkspaces(workspaces);
    }
    return { success: true };
}

function deleteWorkspace(name) {
    let workspaces = getStoredWorkspaces();
    if (!workspaces[name]) {
        return { success: false, message: 'Workspace does not exist.' };
    }
    delete workspaces[name];
    setStoredWorkspaces(workspaces);
    return { success: true };
}

function launchWorkspace(name) {
    let workspaces = getStoredWorkspaces();
    let workspace = workspaces[name];
    if (workspace) {
        chrome.windows.create({ url: workspace.tabs.map(tab => tab.url) }, function(window) {
            workspace.windowId = window.id;
            setStoredWorkspaces(workspaces);
        });
        return { success: true };
    } else {
        return { success: false, message: 'Workspace does not exist.' };
    }
}

function renameWorkspace(oldName, newName) {
    let workspaces = getStoredWorkspaces();
    if (workspaces[newName]) {
        return { success: false, message: 'New workspace name already exists.' };
    }
    if (workspaces[oldName]) {
        workspaces[newName] = workspaces[oldName];
        delete workspaces[oldName];
        setStoredWorkspaces(workspaces);
        return { success: true };
    } else {
        return { success: false, message: 'Old workspace name does not exist.' };
    }
}

function listWorkspaces() {
    let workspaces = getStoredWorkspaces();
    return Object.keys(workspaces).map(name => ({
        name: name,
        tabs: workspaces[name].tabs.length
    }));
}

function getStoredWorkspaces() {
    return JSON.parse(localStorage.getItem('workspaces') || '{}');
}

function setStoredWorkspaces(workspaces) {
    localStorage.setItem('workspaces', JSON.stringify(workspaces));
}

// Tab event listeners
chrome.tabs.onCreated.addListener(tab => {
    updateWorkspaceTabsOnCreate(tab);
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    updateWorkspaceTabsOnRemove(tabId, removeInfo);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    updateWorkspaceTabsOnUpdate(tabId, changeInfo, tab);
});

function updateWorkspaceTabsOnCreate(tab) {
    let workspaces = getStoredWorkspaces();
    Object.keys(workspaces).forEach(name => {
        if (workspaces[name].windowId === tab.windowId) {
            workspaces[name].tabs.push({ id: tab.id, url: tab.url, pinned: tab.pinned });
            setStoredWorkspaces(workspaces);
        }
    });
}

function updateWorkspaceTabsOnRemove(tabId, removeInfo) {
    let workspaces = getStoredWorkspaces();
    Object.keys(workspaces).forEach(name => {
        let tabs = workspaces[name].tabs;
        let index = tabs.findIndex(t => t.id === tabId);
        if (index !== -1) {
            tabs.splice(index, 1);
            setStoredWorkspaces(workspaces);
        }
    });
}

function updateWorkspaceTabsOnUpdate(tabId, changeInfo, tab) {
    if (changeInfo.url) {
        let workspaces = getStoredWorkspaces();
        Object.keys(workspaces).forEach(name => {
            let tabs = workspaces[name].tabs;
            let foundTab = tabs.find(t => t.id === tabId);
            if (foundTab) {
                foundTab.url = changeInfo.url;
                setStoredWorkspaces(workspaces);
            }
        });
    }
}
