document.addEventListener('DOMContentLoaded', function () {
  const createEmptyBtn = document.querySelector('.create-empty');
  const createFromCurrentBtn = document.querySelector('.create-from-current');

  createEmptyBtn.addEventListener('click', function() {
    createWorkspace(false);
  });

  createFromCurrentBtn.addEventListener('click', function() {
    createWorkspace(true);
  });

  // Example to add a couple of initial workspaces
  addWorkspace('Home Base');
  addWorkspace('Peaceful Organization');
  addWorkspace('Prescience');
  // Bind delete buttons for these initial workspaces
  bindDeleteButtons();
});

function addWorkspace(name) {
  const workspaceList = document.getElementById('workspace-list');
  const workspaceDiv = document.createElement('div');
  workspaceDiv.className = 'workspace';
  workspaceDiv.innerHTML = `
    <input type="text" value="${name}" class="workspace-name">
    <button class="launch"><i class="fa fa-rocket" aria-hidden="true"></i></button>
    <button class="settings"><i class="fa fa-cog" aria-hidden="true"></i></button>
    <button class="delete"><i class="fa fa-trash" aria-hidden="true"></i></button>
  `;
  workspaceList.appendChild(workspaceDiv);

  // Bind event to the newly created delete button
  workspaceDiv.querySelector('.delete').addEventListener('click', function() {
    deleteWorkspace(this);
  });
}

function createWorkspace(fromCurrent) {
  const workspaceNameInput = document.querySelector('.new-workspace-name');
  const name = workspaceNameInput.value.trim();
  workspaceNameInput.value = ''; // Clear the input field

  if (name) {
    addWorkspace(name);

    if (fromCurrent) {
      console.log('Creating from current workspace:', name);
    } else {
      console.log('Creating an empty workspace:', name);
    }
  }
}

function deleteWorkspace(button) {
  const workspaceDiv = button.closest('.workspace');
  workspaceDiv.remove();
}

function bindDeleteButtons() {
  // Bind delete buttons for each workspace
  const deleteButtons = document.querySelectorAll('.delete');
  deleteButtons.forEach(button => {
    button.addEventListener('click', function() {
      deleteWorkspace(this);
    });
  });
}
