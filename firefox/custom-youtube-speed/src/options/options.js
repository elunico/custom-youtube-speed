function toLetter(code) {
  return code;
}

function killEvent(event) {
  event.stopImmediatePropagation();
  event.preventDefault();
}

function generateTableContent() {
  let body = document.querySelector('tbody');
  for (let key of Object.keys(defaults)) {
    console.log(key);
    let action = key;
    let value = defaults[key];
    let row = document.createElement('tr');
    row['data-action-name'] = action;
    row['data-listening'] = false;
    row.tabIndex = '-1';

    let set = document.createElement('td');
    let button = document.createElement('input');
    button.type = 'button';
    button.value = 'Set Key';
    button.id = `btn-${action}`;
    set.className = 'short';

    button.onclick = function (event) {
      button.value = 'Listening...';
      row['data-listening'] = true;
      button.blur();
      row.focus();
    };
    row.onkeydown = function (event) {
      console.log(event);
      if (row['data-listening']) {
        console.log(event.key);
        let codein = document.getElementById(`code-${row['data-action-name']}`);
        codein.value = (event.key);
        button.value = 'Set Key';
        row['data-listening'] = false;
        row.blur();
        killEvent(event);
      }
    };
    set.appendChild(button);

    let explanation = document.createElement('td');
    explanation.innerHTML = descriptions[action];

    let code = document.createElement('td');
    let codein = document.createElement('input');
    codein.id = `code-${action}`;
    codein.type = 'text';
    codein.value = value;
    code.appendChild(codein);

    row.appendChild(explanation);
    row.appendChild(set);
    row.appendChild(code);
    body.appendChild(row);
  }
}

generateTableContent();

// Saves options to chrome.storage
function save_options() {
  let options = {};
  for (let key of Object.keys(defaults)) {
    let codein = document.getElementById(`code-${key}`);
    options[key] = (codein.value);
  }
  options.allowintext = document.getElementById('allowintext').checked;
  options.stopprop = document.getElementById('stopprop').checked;
  options.prevdef = document.getElementById('prevdef').checked;
  options.musiccheck = document.getElementById('musiccheck').checked;
  console.log(options);
  chrome.storage.sync.set(options, function () {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function () {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    ...defaults,
    prevdef: false,
    stopprop: false,
    allowintext: false,
    musiccheck: false,
  }, function (items) {
    document.getElementById('prevdef').checked = items.prevdef;
    document.getElementById('stopprop').checked = items.stopprop;
    document.getElementById('allowintext').checked = items.allowintext;
    document.getElementById('musiccheck').checked = items.musiccheck;
    // global in inject.js needed for there
    prevdef = items.prevdef;
    stopprop = items.stopprop;
    allowintext = items.allowintext;
    musiccheck = items.musiccheck;
    console.log(items);
    for (let key of Object.keys(items)) {
      console.log(`code-${key}`);
      let codein = document.getElementById(`code-${key}`);
      if (codein) codein.value = (items[key]);

    }
  });
}


document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
  save_options);
