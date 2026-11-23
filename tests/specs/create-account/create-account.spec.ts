import { expect, test } from '../../fixtures';

test.describe('Create account', { tag: '@regression' }, () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test(
    'valid details create the account and show a success message',
    { tag: '@smoke' },
    async ({ page, createAccountPage, homePage, signInPage }) => {
      await homePage.goto();
      await homePage.navBar.openCreateAccount();
      await createAccountPage.createAccount({
        fullName: 'fred fredy',
        email: 'fred@test.com',
        password: 'Password12345',
        confirmPassword: 'Password12345',
        acceptTerms: true,
      });

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

    await createAccountPage.createAccount({
      fullName: 'fred freddy',
      email: 'fred.test.com',
      password: 'Password12345',
      confirmPassword: 'Password12345',
      acceptTerms: true,
    });

    await expect(createAccountPage.emailError).toBeVisible();
  });

  test('a short password shows a password length error', async ({
    homePage,
    createAccountPage,
  }) => {
    await homePage.goto();
    await homePage.navBar.openCreateAccount();

    await createAccountPage.createAccount({
      fullName: 'fred freddy',
      email: 'fred@test.com',
      password: 'Pass12',
      confirmPassword: 'Pass12',
      acceptTerms: true,
    });

    await expect(createAccountPage.passwordError).toBeVisible();
  });

  test('terms not checked shows a terms error', async ({
    homePage,
    createAccountPage,
  }) => {
    await homePage.goto();
    await homePage.navBar.openCreateAccount();

    await createAccountPage.createAccount({
      fullName: 'fred freddy',
      email: 'fred@test.com',
      password: 'Password12345',
      confirmPassword: 'Password12345',
      acceptTerms: false,
    });

    await expect(createAccountPage.termsError).toBeVisible();
  });
});
