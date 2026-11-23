// Page object for /html/create-account.html: the form, its messages and the toast.
// Rules: docs/architecture.md, "Page objects". Walkthrough: docs/learning/walkthroughs.md#createaccountpage
import type { Locator, Page } from '@playwright/test';
import { Toast } from '../components/Toast';

/** The form's data. createAccount takes Partial<AccountDetails>: only the fields given are filled. */
export type AccountDetails = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

export class CreateAccountPage {
  /** The pop-up message outside <main> (shared component, tests/components/Toast.ts). */
  readonly toast: Toast;
  readonly heading: Locator;
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly termsCheckbox: Locator;
  readonly createAccountButton: Locator;
  readonly successMessage: Locator;
  readonly fullNameError: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly termsError: Locator;

  /** `page` is a plain input, not stored: no method uses this.page. */
  constructor(page: Page) {
    this.toast = new Toast(page);
    this.heading = page.getByRole('heading', { name: 'Create Account' });
    this.fullNameInput = page.getByLabel('Full Name');
    this.emailInput = page.getByLabel('Email');
    // exact: without it, 'Password' also matches "Confirm Password" (strict mode).
    this.passwordInput = page.getByLabel('Password', { exact: true });
    this.confirmPasswordInput = page.getByLabel('Confirm Password');
    this.termsCheckbox = page.getByRole('checkbox', {
      name: 'I agree to the Terms & Conditions',
    });
    this.createAccountButton = page.getByRole('button', {
      name: 'Create Account',
    });
    // A plain div (no role). Scoped to main: the toast shows the same text.
    this.successMessage = page
      .getByRole('main')
      .getByText('Account created successfully!');
    // The app's own errors (the form has novalidate): each a <span role="alert"> with no
    // accessible name, so found by its text.
    this.fullNameError = page
      .getByRole('main')
      .getByText('Name must be at least 2 characters');
    this.emailError = page
      .getByRole('main')
      .getByText('Please enter a valid email address');
    this.passwordError = page
      .getByRole('main')
      .getByText('Password must be at least 8 characters');
    this.termsError = page
      .getByRole('main')
      .getByText('You must agree to the Terms & Conditions');
  }

  /** Fills only the fields given, sets the terms box to acceptTerms, then submits. */
  async createAccount(details: Partial<AccountDetails>): Promise<void> {
    if (details.fullName !== undefined) {
      await this.fullNameInput.fill(details.fullName);
    }
    if (details.email !== undefined) {
      await this.emailInput.fill(details.email);
    }
    if (details.password !== undefined) {
      await this.passwordInput.fill(details.password);
    }
    if (details.confirmPassword !== undefined) {
      await this.confirmPasswordInput.fill(details.confirmPassword);
    }
    if (details.acceptTerms !== undefined) {
      await this.termsCheckbox.setChecked(details.acceptTerms);
    }
    await this.createAccountButton.click();
  }
}
