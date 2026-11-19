import type { Lang } from '../lang';

/**
 * Visible copy on the signup page, taken from the running pages rather than retyped.
 * Both languages in one object: `lang` is a union, so reading a key missing from either
 * does not compile. A forgotten translation fails the build, not a test.
 */
const copy = {
  en: {
    heading: 'Create a nesto account',
    firstName: 'First name',
    lastName: 'Last name',
    phone: 'Phone number',
    province: 'Province of purchase',
    email: 'Email',
    password: 'Password',
    passwordHint: 'Password must be between 12 and 32 characters and contain one uppercase letter, one lowercase letter and one number.',
    passwordConfirmation: 'Confirm password',
    consent: 'By checking this box, you agree to be contacted by nesto’s partners for the purposes of offering you financial products. You agree to nesto sharing your mortgage information with its partners. You can opt-out at any time.',
    submit: 'Create your account',
    alreadyHaveAccount: 'Already have an account?',
    logIn: 'Log in',
    headerLogin: 'Login',
    languageSwitch: 'FR',
    termsIntro: 'By clicking on "Create your account", I agree and consent to the',
    termsLink: 'Terms of Service',
    privacyIntro: 'Read our',
    privacyLink: 'Privacy Policy',
    privacyOutro: 'to learn more',
  },
  fr: {
    heading: 'Créez un compte nesto',
    firstName: 'Prénom',
    lastName: 'Nom',
    phone: 'Téléphone',
    province: 'Province de l\'achat',
    email: 'Courriel',
    password: 'Mot de passe',
    // "doit contenir au entre" is not grammatical; the English reads correctly.
    // Asserted as-is so the suite describes the page that exists. Reported separately.
    passwordHint: 'Le mot de passe doit contenir au entre 12 et 32 caractères et contenir au moins une lettre majuscule, une lettre minuscule et un chiffre.',
    passwordConfirmation: 'Confirmation du mot de passe',
    consent: 'En cochant cette case, vous acceptez d’être contacté par les partenaires de nesto dans le but de vous proposer des produits financiers. Vous acceptez que nesto partage vos informations de demande hypothécaire avec ses partenaires, si nous ne sommes pas en mesure de vous fournir nos services. Vous pouvez vous désinscrire à tout moment.',
    submit: 'Créez votre compte',
    alreadyHaveAccount: 'Vous avez déjà un compte?',
    logIn: 'Connectez-vous',
    headerLogin: 'Connexion',
    languageSwitch: 'EN',
    termsIntro: 'En cliquant sur "Créez votre compte", j\'accepte et consens aux',
    termsLink: 'Conditions d\'utilisation',
    privacyIntro: 'Lisez notre',
    privacyLink: 'politique de confidentialité',
    privacyOutro: 'pour en savoir plus',
  },
} as const;

/**
 * Every option in the province dropdown, in order, including the leading placeholder.
 * Taken from the running pages: the codes are shared, only the labels are translated.
 */
const provinces = {
  en: [
    { value: '', text: 'Province of purchase' },
    { value: 'ON', text: 'Ontario' },
    { value: 'QC', text: 'Quebec' },
    { value: 'AB', text: 'Alberta' },
    // Hyphenated, unlike every other English province name. Looks like the French
    // form (Colombie-Britannique) leaking across. Asserted as-is and reported.
    { value: 'BC', text: 'British-Columbia' },
    { value: 'MB', text: 'Manitoba' },
    { value: 'NB', text: 'New Brunswick' },
    { value: 'NS', text: 'Nova Scotia' },
    { value: 'NL', text: 'Newfoundland and Labrador' },
    { value: 'PE', text: 'Prince Edward Island' },
    { value: 'SK', text: 'Saskatchewan' },
    { value: 'NT', text: 'Northwest Territories' },
    { value: 'YT', text: 'Yukon' },
    { value: 'NU', text: 'Nunavut' },
  ],
  fr: [
    { value: '', text: 'Province de l\'achat' },
    { value: 'ON', text: 'Ontario' },
    { value: 'QC', text: 'Québec' },
    { value: 'AB', text: 'Alberta' },
    { value: 'BC', text: 'Colombie-Britannique' },
    { value: 'MB', text: 'Manitoba' },
    { value: 'NB', text: 'Nouveau-Brunswick' },
    { value: 'NS', text: 'Nouvelle-Écosse' },
    { value: 'NL', text: 'Terre-Neuve-et-Labrador' },
    { value: 'PE', text: 'Île-du-Prince-Édouard' },
    { value: 'SK', text: 'Saskatchewan' },
    { value: 'NT', text: 'Territoires du Nord-Ouest' },
    { value: 'YT', text: 'Yukon' },
    { value: 'NU', text: 'Nunavut' },
  ],
} as const;

/**
 * Validation messages, taken from the running pages. Which message a field gives is not
 * consistent: an empty name says it is required, an empty email says the address is
 * invalid, and an empty password complains about its length. See BUG-10.
 */
const errors = {
  en: {
    fieldRequired: 'The field is required',
    invalidEmail: 'Invalid email',
    invalidName: 'Invalid name',
    // "letters" is wrong - a password has to contain a digit, so it cannot be 12
    // letters. The hint above the field says "characters". See BUG-09.
    passwordTooShort: 'Minimum of 12 letters required',
    passwordTooLong: 'Maximum of 32 letters required',
    passwordWeak:
      'Password must contain at least one uppercase letter, one lowercase letter and one number',
    passwordsDiffer: 'Passwords do not match',
  },
  fr: {
    fieldRequired: 'Ce champ est obligatoire.',
    invalidEmail: 'Courriel invalide',
    invalidName: 'Nom invalide',
    passwordTooShort: 'Minimum de 12 lettres requises',
    passwordTooLong: 'Maximum de 32 lettres requises',
    passwordWeak:
      'Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule et un chiffre',
    passwordsDiffer: 'Les mots de passe ne correspondent pas',
  },
} as const;

/** Copy on the quote page, which is where a successful signup lands. */
const quoteCopy = {
  en: { heading: 'How can we help you with your mortgage?' },
  fr: { heading: 'Comment peut-on vous aider avec votre hypothèque?' },
} as const;

export function copyFor(lang: Lang): (typeof copy)[Lang] {
  return copy[lang];
}

export function provincesFor(lang: Lang): readonly { value: string; text: string }[] {
  return provinces[lang];
}

export function quoteCopyFor(lang: Lang): (typeof quoteCopy)[Lang] {
  return quoteCopy[lang];
}

export function errorsFor(lang: Lang): (typeof errors)[Lang] {
  return errors[lang];
}
