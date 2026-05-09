import { makeAutoObservable } from 'mobx';

const PROTECTED_STEPS = new Set(['dashboard', 'leaderboard', 'quests']);

export class UiStore {
  root;
  step = 'login';
  isLoading = false;
  errorMessage = '';
  flashMessage = '';
  loadingPhase = '';
  notificationsOpen = false;
  notifications = [];
  nextNotificationId = 1;
  selectedPlayer = null;
  confirmation = null;

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, { root: false }, { autoBind: true });
  }

  setStep(step) {
    if (PROTECTED_STEPS.has(step) && !this.root.repoKeyString) {
      this.flashMessage = 'Connect a repository before opening this page.';
      this.addNotification('Navigation blocked: connect a repository first', 'Repository required');
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

  setFlashMessage(message) {
    this.flashMessage = message || '';
  }

  clearFlashMessage() {
    this.flashMessage = '';
  }

  addNotification(text, title = 'Update', type = 'info') {
    const notification = {
      id: this.nextNotificationId,
      title,
      text,
      type,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    this.nextNotificationId += 1;
    this.notifications = [notification, ...this.notifications].slice(0, 8);
  }

  toggleNotifications() {
    this.notificationsOpen = !this.notificationsOpen;
  }

  openNotifications() {
    this.notificationsOpen = true;
  }

  closeNotifications() {
    this.notificationsOpen = false;
  }

  clearNotifications() {
    this.notifications = [];
    this.notificationsOpen = false;
  }

  selectPlayer(player) {
    this.selectedPlayer = player;
  }

  closePlayerDrawer() {
    this.selectedPlayer = null;
  }

  requestConfirmation({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'danger', onConfirm }) {
    this.confirmation = {
      title,
      message,
      confirmLabel,
      cancelLabel,
      tone,
      onConfirm,
    };
  }

  closeConfirmation() {
    this.confirmation = null;
  }

  async confirmCurrentAction() {
    const nextAction = this.confirmation?.onConfirm;
    this.confirmation = null;
    if (typeof nextAction === 'function') {
      await nextAction();
    }
  }

  reset() {
    this.step = 'login';
    this.isLoading = false;
    this.errorMessage = '';
    this.flashMessage = '';
    this.loadingPhase = '';
    this.notificationsOpen = false;
    this.notifications = [];
    this.nextNotificationId = 1;
    this.selectedPlayer = null;
    this.confirmation = null;
  }
}
