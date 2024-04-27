document.addEventListener('DOMContentLoaded', function () {
    const createEmptyBtn = document.querySelector('.create-empty');
    const createFromCurrentBtn = document.querySelector('.create-from-current');
    const workspaceList = document.getElementById('workspace-list');

    createEmptyBtn.addEventListener('click', function () {
        createWorkspace(false);
    });

    createFromCurrentBtn.addEventListener('click', function () {
        createWorkspace(true);
    });

    // Fetch and list all workspaces
    chrome.runtime.sendMessage({type: 'list'}, function (workspaces) {
        workspaces.forEach(workspace => addWorkspace(workspace.name, workspaceList));
    });
});

function addWorkspace(name, workspaceList) {
    const workspaceDiv = document.createElement('div');
    workspaceDiv.className = 'workspace';
    workspaceDiv.innerHTML = `
    <input type="text" value="${name}" class="workspace-name" data-old-name="${name}">
    <button class="launch"><i class="fa fa-rocket" aria-hidden="true"></i></button>
    <button class="settings"><i class="fa fa-cog" aria-hidden="true"></i></button>
    <button class="delete"><i class="fa fa-trash" aria-hidden="true"></i></button>
  `;
    workspaceList.appendChild(workspaceDiv);

    // Save changes when the workspace name is edited
    workspaceDiv.querySelector('.workspace-name').addEventListener('change', function () {
        updateWorkspaceName(this);
    });

    // Launch the workspace
    workspaceDiv.querySelector('.launch').addEventListener('click', function () {
        launchWorkspace(name);
    });

    // Delete the workspace
    workspaceDiv.querySelector('.delete').addEventListener('click', function () {
        deleteWorkspace(name);
    });
}

function launchWorkspace(name) {
    chrome.runtime.sendMessage({type: 'launch', name: name}, function (response) {
        if (response.success) {
            document.querySelector(`input[value="${name}"]`).closest('.workspace').remove();
        } else {
            alert('Error launching workspace.');
        }
    });
}

function updateWorkspaceName(inputElement) {
    const newName = inputElement.value;
    const oldName = inputElement.getAttribute('data-old-name');
    chrome.runtime.sendMessage({
        type: 'rename',
        oldName: oldName,
        newName: newName
    }, function (response) {
        if (response.success) {
            inputElement.setAttribute('data-old-name', newName);
        } else {
            inputElement.value = oldName; // Reset to old name on failure
            alert('Error renaming workspace. Try a different name.');
        }
    });
}

function deleteWorkspace(name) {
    chrome.runtime.sendMessage({type: 'delete', name: name}, function (response) {
        if (response.success) {
            document.querySelector(`input[value="${name}"]`).closest('.workspace').remove();
        } else {
            alert('Error deleting workspace.');
        }
    });
}

function createWorkspace(fromCurrent) {
    const workspaceNameInput = document.querySelector('.new-workspace-name');
    const name = workspaceNameInput.value.trim();
    workspaceNameInput.value = ''; // Clear the input field

    if (name) {
        chrome.runtime.sendMessage({
            type: 'create',
            name: name,
            fromCurrent: fromCurrent
        }, function (response) {
            if (response.success) {
                addWorkspace(name, document.getElementById('workspace-list'));
            } else {
                alert('Error creating workspace. A workspace with this name may already exist.');
            }
        });
    }
}
