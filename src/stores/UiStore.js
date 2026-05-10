import { makeAutoObservable } from 'mobx';

const PROTECTED_STEPS = new Set(['leaderboard', 'quests']);

export class UiStore {
  root;
  step = 'login';
  isLoading = false;
  errorMessage = '';
  flashMessage = '';
  flashType = 'info';
  loadingPhase = '';
  selectedPlayer = null;
  confirmation = null;

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, { root: false }, { autoBind: true });
  }

  setStep(step) {
    if (PROTECTED_STEPS.has(step) && !this.root.repoKeyString) {
      this.flashMessage = 'Connect a repository before opening this page.';
      this.step = 'connect';
      return;
    }
    this.step = step;
  }

  setLoading({ isLoading, phase = '' }) {
    this.isLoading = Boolean(isLoading);
    this.loadingPhase = phase;
  }

  setSyncError(message) {
    this.errorMessage = message || '';
    if (message) this.root.workspace.setSyncStatus('error');
  }

  clearSyncError() {
    this.errorMessage = '';
  }

  setFlashMessage(message, type = 'info') {
    this.flashMessage = message || '';
    this.flashType = type || 'info';
  }

  clearFlashMessage() {
    this.flashMessage = '';
    this.flashType = 'info';
  }

  addNotification(text, title = 'Update', type = 'info') {
    const cleanTitle = String(title || '').trim();
    const cleanText = String(text || '').trim();
    if (type === 'error' || type === 'success') {
      this.flashMessage = cleanText || cleanTitle;
      this.flashType = type;
    }
  }

  selectPlayer(player) {
    this.selectedPlayer = player;
  }

  closePlayerDrawer() {
    this.selectedPlayer = null;
  }

  requestConfirmation(payload = {}) {
    if (typeof payload.onConfirm !== 'function') return;
    this.confirmation = {
      title: payload.title || 'Confirm action',
      message: payload.message || '',
      confirmLabel: payload.confirmLabel || 'Confirm',
      cancelLabel: payload.cancelLabel || 'Cancel',
      tone: payload.tone || 'default',
      onConfirm: payload.onConfirm,
    };
  }

  closeConfirmation() {
    this.confirmation = null;
  }

  confirmCurrentAction() {
    const action = this.confirmation?.onConfirm;
    this.confirmation = null;
    if (typeof action === 'function') action();
  }

  reset() {
    this.step = 'login';
    this.isLoading = false;
    this.errorMessage = '';
    this.flashMessage = '';
    this.flashType = 'info';
    this.loadingPhase = '';
    this.selectedPlayer = null;
    this.confirmation = null;
  }
}
