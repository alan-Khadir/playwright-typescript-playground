import { expect, test } from '../../fixtures';
import { faker } from '@faker-js/faker';
import type { AccountDetails } from '../../pages/CreateAccountPage';

function validAccount(overrides: Partial<AccountDetails> = {}): AccountDetails {
  const password = faker.internet.password({ length: 12 });
  return {
    fullName: faker.person.fullName(),
    email: faker.internet.email(),
    password,
    confirmPassword: password,
    acceptTerms: true,
    ...overrides,
  };
}

test.describe('Create account', { tag: '@regression' }, () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test(
    'valid details create the account and show a success message',
    { tag: '@smoke' },
    async ({ page, createAccountPage, homePage, signInPage }) => {
      await homePage.goto();
      await homePage.navBar.openCreateAccount();

      await createAccountPage.createAccount(validAccount());

      await expect(createAccountPage.toast.message).toContainText(
        'Account created successfully!',
      );

      await expect(createAccountPage.successMessage).toBeVisible();

      await expect(page).toHaveURL('/html/signin.html');
      await expect(signInPage.heading).toBeVisible();
    },
  );

  test('an empty form shows an error for each required field', async ({
    homePage,
    createAccountPage,
  }) => {
    await homePage.goto();
    await homePage.navBar.openCreateAccount();

    await createAccountPage.createAccount({});

    await expect(createAccountPage.fullNameError).toBeVisible();
    await expect(createAccountPage.emailError).toBeVisible();
    await expect(createAccountPage.passwordError).toBeVisible();
    await expect(createAccountPage.termsError).toBeVisible();
  });

  test('an invalid email format shows an email error', async ({
    homePage,
    createAccountPage,
  }) => {
    await homePage.goto();
    await homePage.navBar.openCreateAccount();

    await createAccountPage.createAccount(
      validAccount({ email: 'fred.test.com' }),
    );

    await expect(createAccountPage.emailError).toBeVisible();
  });

  test('a short password shows a password length error', async ({
    homePage,
    createAccountPage,
  }) => {
    await homePage.goto();
    await homePage.navBar.openCreateAccount();

    await createAccountPage.createAccount(
      validAccount({ password: 'Pass12', confirmPassword: 'Pass12' }),
    );

    await expect(createAccountPage.passwordError).toBeVisible();
  });

  test('terms not checked shows a terms error', async ({
    homePage,
    createAccountPage,
  }) => {
    await homePage.goto();
    await homePage.navBar.openCreateAccount();

    await createAccountPage.createAccount(validAccount({ acceptTerms: false }));

    await expect(createAccountPage.termsError).toBeVisible();
  });
});
