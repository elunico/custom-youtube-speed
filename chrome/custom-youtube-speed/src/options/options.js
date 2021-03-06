function toLetter(code) {
  // let v = String.fromCharCode(code).toLowerCase();
  // if ('abcdefghjiklmnopqrstuvwxyz1234567890!@#$%^&*()_+-=[]{};\':"<>,.?/\\|`~"'.includes(v)) {
  //   return v;
  // } else {
  //   let result = {
  //     32: 'space',
  //     16: 'shift',
  //     13: 'enter',
  //     27: 'escape',
  //     17: 'control',
  //     8: 'backspace',
  //     91: 'command/win',
  //     18: 'option/alt',
  //     37: 'left',
  //     38: 'up',
  //     39: 'right',
  //     40: 'down',
  //     36: 'home',
  //     35: 'end',
  //     34: 'page up',
  //     35: 'page down'
  //   } [code]

  //   if (result) return `<${result}>`;
  //   else return '<???>';
  return code;

}

function killEvent(event) {
  event.stopImmediatePropagation();
  event.preventDefault()
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
    row.tabIndex = '-1'
    // let enabled = document.createElement('td');
    // enabled.className = 'enable'
    // let checkbox = document.createElement('input');
    // checkbox.id = `check-${action}`;
    // checkbox.checked = true // todo: fill this in
    // checkbox.type = 'checkbox';

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
    }
    row.onkeypress = function (event) {
      console.log(event);
      if (row['data-listening']) {
        console.log(event.key);
        let codein = document.getElementById(`code-${row['data-action-name']}`)
        codein.value = (event.key);
        button.value = 'Set Key';
        row['data-listening'] = false;
        row.blur();
        killEvent(event);
      }
    }
    set.appendChild(button);

    let explanation = document.createElement('td');
    explanation.innerHTML = descriptions[action];

    let code = document.createElement('td');
    let codein = document.createElement('input');
    codein.id = `code-${action}`;
    codein.type = 'text'
    codein.value = value;
    code.appendChild(codein);



    // enabled.appendChild(checkbox);

    // row.appendChild(enabled);
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
    let codein = document.getElementById(`code-${key}`)
    options[key] = (codein.value);
  }
  console.log(options);
  options.stopprop = document.getElementById('stopprop').checked;
  options.prevdef = document.getElementById('prevdef').checked;
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
    stopprop: false
  }, function (items) {
    prevdef = items.prevdef;
    stopprop = items.stopprop;
    console.log(items);
    for (let key of Object.keys(items)) {
      console.log(key);
      let codein = document.getElementById(`code-${key}`)
      codein.value = (items[key]);

    }
  });
}


document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
  save_options);
