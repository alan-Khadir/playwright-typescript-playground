// Page object for the Cryptography & Codes topic (/html/dashboard.html?topic=Cryptography%20%26%20Codes):
// its widget is the "Contribute a Fact" form (text, email, textarea, date, file upload).
// Rules: docs/architecture.md, "Page objects". Walkthrough: docs/learning/walkthroughs.md#cryptographyandcodespage
import type { Locator, Page } from '@playwright/test';
import { TopicLayout } from '../../components/TopicLayout';

/** What contributeFact fills in. All four are required: every test fills them all. */
export type FactDetails = {
  name: string;
  email: string;
  fact: string;
  learnedOn: string;
};

export class CryptographyAndCodesPage {
  readonly layout: TopicLayout;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly factInput: Locator;
  /** Date input: fill() and toHaveValue() use YYYY-MM-DD, whatever the display format. */
  readonly learnedOnInput: Locator;
  readonly imageInput: Locator;
  readonly submitButton: Locator;
  /** Shown as soon as a file is chosen, before any submit. Its name is the alt text. */
  readonly imagePreview: Locator;
  /** The section that lists submitted facts. It has no role or label, so we take the
   *  <section> (CSS tag) that contains the "Community Facts" heading. */
  readonly communityFacts: Locator;

  constructor(private readonly page: Page) {
    this.layout = new TopicLayout(page);
    this.nameInput = this.layout.widget.getByLabel('Name');
    this.emailInput = this.layout.widget.getByLabel('Email');
    this.factInput = this.layout.widget.getByLabel('Your Amazing Fact');
    this.learnedOnInput = this.layout.widget.getByLabel(
      'When did you learn this?',
    );
    this.imageInput = this.layout.widget.getByLabel('Upload Supporting Image');
    this.submitButton = this.layout.widget.getByRole('button', {
      name: 'Submit',
    });
    this.imagePreview = this.layout.widget.getByRole('img', {
      name: 'Uploaded image preview',
    });
    this.communityFacts = this.layout.widget
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Community Facts' }) });
  }

  /** Opens the topic by URL. encodeURIComponent turns "&" into %26; a raw "&" would
   *  start a new URL parameter and the app would show "Topic Not Found". */
  async goto(): Promise<void> {
    await this.page.goto(
      `/html/dashboard.html?topic=${encodeURIComponent('Cryptography & Codes')}`,
    );
  }

  /** Fills the form and submits it. The app then adds the fact and resets the form. */
  async contributeFact(details: FactDetails): Promise<void> {
    await this.nameInput.fill(details.name);
    await this.emailInput.fill(details.email);
    await this.factInput.fill(details.fact);
    await this.learnedOnInput.fill(details.learnedOn);
    await this.submitButton.click();
  }

  /** Chooses a file without the OS file dialog. Doesn't submit: submit clears the preview. */
  async uploadImage(filePath: string): Promise<void> {
    await this.imageInput.setInputFiles(filePath);
  }
}
