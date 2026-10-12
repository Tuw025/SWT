'use strict';

const form = document.querySelector('#date-form');
const inputs = ['day', 'month', 'year'].map(name => document.getElementById(name));
const checkButton = document.querySelector('#check-button');
const clearButton = document.querySelector('#clear-button');
const closeButton = document.querySelector('.close-button');
const dialog = document.querySelector('#message-dialog');
const dialogTitle = document.querySelector('#dialog-title');
const dialogMessage = document.querySelector('#dialog-message');
const dialogIcon = document.querySelector('#dialog-icon');
const yesButton = document.querySelector('#dialog-yes');
const noButton = document.querySelector('#dialog-no');
const okButton = document.querySelector('#dialog-ok');
let confirmMode = false;
let pendingRequest = null;
let restoreFocus = null;
let focusAfterDialog = null;

function showMessage(title, message, { error = false, confirmation = false, field = null } = {}) {
  confirmMode = confirmation;
  restoreFocus = document.activeElement;
  focusAfterDialog = field ? document.getElementById(field.toLowerCase()) : null;
  dialogTitle.textContent = title;
  dialogMessage.textContent = message;
  dialogIcon.textContent = error ? '×' : 'i';
  dialogIcon.classList.toggle('error', error);
  yesButton.hidden = noButton.hidden = !confirmation;
  okButton.hidden = confirmation;
  dialog.returnValue = '';
  dialog.showModal();
  (confirmation ? noButton : okButton).focus();
}

function resetFields() {
  form.reset();
  inputs.forEach(input => input.removeAttribute('aria-invalid'));
  inputs[0].focus();
}

function setBusy(busy) {
  checkButton.disabled = clearButton.disabled = closeButton.disabled = busy;
  inputs.forEach(input => { input.disabled = busy; });
  checkButton.textContent = busy ? 'Checking…' : 'Check';
  form.setAttribute('aria-busy', String(busy));
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (pendingRequest || dialog.open) return;
  inputs.forEach(input => input.removeAttribute('aria-invalid'));
  pendingRequest = new AbortController();
  const timeout = setTimeout(() => pendingRequest?.abort(), 5000);
  const data = Object.fromEntries(inputs.map(input => [input.name, input.value]));
  let result;
  try {
    setBusy(true);
    const response = await fetch('/api/date/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: pendingRequest.signal,
    });
    result = await response.json();
    if (![200, 422].includes(response.status) || typeof result.message !== 'string') {
      throw new Error('Unexpected API response');
    }
  } catch {
    result = { outcome: 'connection_error', message: 'Cannot connect to the checker. Please try again.' };
  } finally {
    clearTimeout(timeout);
    pendingRequest = null;
    setBusy(false);
  }
  const error = ['validation_error', 'connection_error'].includes(result.outcome);
  if (result.field) document.getElementById(result.field.toLowerCase())?.setAttribute('aria-invalid', 'true');
  showMessage(error ? 'Error' : 'Message', result.message, { error, field: result.field });
});

inputs.forEach(input => input.addEventListener('input', () => input.removeAttribute('aria-invalid')));
clearButton.addEventListener('click', resetFields);
closeButton.addEventListener('click', () => {
  // Some browsers do not focus a button when it is clicked with a mouse.
  closeButton.focus();
  showMessage('Confirm', 'Are you sure to exit?', { confirmation: true });
});
okButton.addEventListener('click', () => dialog.close('ok'));
noButton.addEventListener('click', () => dialog.close('no'));
document.querySelector('#dialog-close').addEventListener('click', () => dialog.close('no'));
yesButton.addEventListener('click', () => {
  dialog.close('yes');
  document.querySelector('.window').hidden = true;
  document.querySelector('#closed-screen').hidden = false;
  document.querySelector('#reopen-button').focus();
});
dialog.addEventListener('close', () => {
  if (confirmMode && dialog.returnValue === 'yes') return;
  (focusAfterDialog || restoreFocus)?.focus();
});
document.querySelector('#reopen-button').addEventListener('click', () => {
  document.querySelector('#closed-screen').hidden = true;
  document.querySelector('.window').hidden = false;
  resetFields();
});
