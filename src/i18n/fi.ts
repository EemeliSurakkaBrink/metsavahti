/**
 * Finnish UI copy (00-deviations R8: the only source of UI strings). Started by MV-041 with
 * the auth layout and the shared form components; inline strings elsewhere move here when
 * their page is touched. Keys are grouped by component or page, values are the exact copy
 * from the artboards in docs/design.
 */
export const fi = {
  brand: {
    name: 'Metsävahti',
    homeLink: 'Metsävahti – etusivulle',
  },
  auth: {
    login: {
      title: 'Kirjaudu',
      email: 'Sähköposti',
      password: 'Salasana',
      submit: 'Kirjaudu',
      noAccount: 'Ei vielä tiliä?',
      register: 'Luo tili',
      errors: {
        emailInvalid: 'Anna kelvollinen sähköpostiosoite',
        passwordMissing: 'Salasana puuttuu',
        failed: 'Kirjautuminen epäonnistui. Tarkista tunnus ja salasana.',
      },
    },
  },
  forms: {
    password: {
      show: 'Näytä',
      hide: 'Piilota',
      showLabel: 'Näytä salasana',
      hideLabel: 'Piilota salasana',
      strengthHint: 'Vähintään 10 merkkiä',
      strengthMeter: 'Salasanan vahvuus',
      strength: {
        tooShort: 'Liian lyhyt',
        0: 'Heikko',
        1: 'Heikko',
        2: 'Kohtalainen',
        3: 'Hyvä',
        4: 'Vahva',
      },
    },
  },
} as const
