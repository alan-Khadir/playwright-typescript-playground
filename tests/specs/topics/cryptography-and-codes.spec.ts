// Tests for the Cryptography & Codes topic: contributing a fact (textarea, date) and
// the image upload preview. Validation is covered on create account, not repeated here.
import { test, expect } from '../../fixtures';
import { faker } from '@faker-js/faker';
import path from 'path';
import type { FactDetails } from '../../pages/topics/CryptographyAndCodesPage';

test.describe('Cryptography & Codes', { tag: '@regression' }, () => {
  test('contributing a fact adds it to Community Facts and clears the form', async ({
    cryptographyAndCodesPage,
  }) => {
    const details: FactDetails = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      fact: faker.lorem.sentence(),
      learnedOn: '2026-11-25',
    };

    await cryptographyAndCodesPage.goto();

    await cryptographyAndCodesPage.contributeFact(details);

    await expect(cryptographyAndCodesPage.communityFacts).toContainText(
      details.fact,
    );
    await expect(cryptographyAndCodesPage.factInput).toHaveValue('');
    await expect(cryptographyAndCodesPage.learnedOnInput).toHaveValue('');
  });

  test('uploading an image shows a preview', async ({
    cryptographyAndCodesPage,
  }) => {
    await cryptographyAndCodesPage.goto();

    // __dirname = this spec's folder, so the path works from any working directory.
    await cryptographyAndCodesPage.uploadImage(
      path.join(__dirname, '../../test-data/sample-image.png'),
    );

    await expect(cryptographyAndCodesPage.imagePreview).toBeVisible();
  });
});
