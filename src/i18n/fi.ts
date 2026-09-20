/**
 * Finnish UI copy (00-deviations R8: the only source of UI strings). Started by MV-041 with
 * the auth layout and the shared form components, extended by MV-042 (registration, verify
 * page, verification email); inline strings elsewhere move here when their page is touched. Keys are grouped by component or page, values are the exact copy
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
    register: {
      title: 'Luo tili',
      email: 'Sähköposti',
      password: 'Salasana',
      confirmPassword: 'Salasana uudelleen',
      termsPrefix: 'Olen lukenut',
      privacyLink: 'tietosuojaselosteen',
      termsMiddle: 'ja hyväksyn',
      termsLink: 'käyttöehdot',
      marketing: 'Saa lähettää palveluun liittyviä uutisia.',
      submit: 'Luo tili',
      hasAccount: 'Onko sinulla jo tili?',
      login: 'Kirjaudu',
      errors: {
        emailInvalid: 'Anna kelvollinen sähköpostiosoite',
        passwordTooShort: 'Salasanan on oltava vähintään 10 merkkiä',
        passwordTooWeak: 'Salasana on liian heikko. Käytä pidempää tai vaihtelevampaa salasanaa.',
        passwordMismatch: 'Salasanat eivät täsmää.',
        termsRequired: 'Hyväksy käyttöehdot ja tietosuojaseloste jatkaaksesi',
      },
    },
    verifyEmail: {
      title: 'Vahvista sähköposti',
      sentTo: 'Lähetimme vahvistuslinkin osoitteeseen',
      sentToUnknown: 'Lähetimme vahvistuslinkin sähköpostiisi.',
      validFor: 'Linkki on voimassa 24 tuntia.',
      changeEmail: 'Vaihda sähköpostiosoite',
      resend: 'Lähetä uudelleen',
      resent: 'Vahvistuslinkki lähetetty uudelleen.',
      required: {
        code: 'VAHVISTUS',
        title: 'Vahvista sähköpostiosoitteesi ensin',
        body: 'Lähetimme vahvistuslinkin sähköpostiisi. Vahtialueet avautuvat, kun osoite on vahvistettu.',
        home: 'Etusivulle',
      },
    },
    verify: {
      verified: {
        title: 'Sähköposti vahvistettu',
        body: 'Tilisi on valmis. Seuraavaksi merkitään ensimmäinen paikka kartalle.',
        cta: 'Luo ensimmäinen vahtialue',
      },
      expired: {
        title: 'Vahvistuslinkki on vanhentunut',
        body: 'Linkki oli voimassa 24 tuntia. Lähetämme uuden linkin osoitteeseen',
      },
      used: {
        title: 'Linkki on jo käytetty',
        body: 'Vahvistuslinkki on jo käytetty tai se ei ole kelvollinen. Jos olet jo vahvistanut osoitteesi, voit kirjautua sisään.',
        login: 'Kirjaudu',
        register: 'Luo tili',
      },
    },
  },
  emails: {
    verify: {
      subject: 'Vahvista sähköpostiosoitteesi',
      preview: 'Vahvista sähköpostiosoitteesi, niin vahtialueet aukeavat',
      badge: 'Tervetuloa',
      heading: 'Vahvista sähköpostiosoitteesi',
      lead: 'Kiitos, että loit tilin. Paina alla olevaa painiketta vahvistaaksesi, että osoite on sinun. Linkki on voimassa 24 tuntia.',
      cta: 'Vahvista sähköposti',
      note: 'Jos et luonut tiliä Metsävahtiin, voit jättää tämän viestin huomiotta. Tili poistetaan automaattisesti 7 päivän kuluessa, jos osoitetta ei vahvisteta.',
      footerWhy: 'Saat tämän viestin, koska tällä osoitteella luotiin tili Metsävahtiin.',
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
