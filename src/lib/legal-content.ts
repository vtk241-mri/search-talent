import type { Locale } from "@/lib/i18n/config";

export type LegalDocumentKey = "terms" | "privacy" | "cookies";

type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

type LegalDocument = {
  title: string;
  description: string;
  eyebrow: string;
  intro: string;
  lastUpdatedLabel: string;
  lastUpdatedValue: string;
  hubLabel: string;
  sections: LegalSection[];
};

type LegalIndexContent = {
  title: string;
  description: string;
  eyebrow: string;
  cards: Array<{
    href: `/${LegalDocumentKey}`;
    title: string;
    description: string;
  }>;
};

const legalDocuments: Record<Locale, Record<LegalDocumentKey, LegalDocument>> = {
  en: {
    terms: {
      title: "Terms of Service",
      description:
        "Core rules for using SearchTalent, publishing profiles and projects, and accessing the platform.",
      eyebrow: "Legal",
      intro:
        "These Terms describe the basic rules for using SearchTalent. They form a living document and may expand as the product grows.",
      lastUpdatedLabel: "Last updated",
      lastUpdatedValue: "March 28, 2026",
      hubLabel: "Legal hub",
      sections: [
        {
          title: "Using the platform",
          paragraphs: [
            "SearchTalent lets people create accounts, publish profiles, add projects, and explore public work from other users.",
            "By using the service, you agree to use it lawfully, respectfully, and in a way that does not harm the platform or other users.",
          ],
          bullets: [
            "Do not impersonate another person or organization.",
            "Do not upload content you do not have rights to use.",
            "Do not try to disrupt the service, bypass restrictions, or access data that is not yours.",
          ],
        },
        {
          title: "Accounts and content",
          paragraphs: [
            "You are responsible for the accuracy of the information you publish in your account, profile, and projects.",
            "You keep ownership of your content, but you allow SearchTalent to store, display, and process it so the service can work as intended.",
          ],
        },
        {
          title: "Moderation and access",
          paragraphs: [
            "We may remove content or restrict access to the platform if material is illegal, abusive, misleading, or clearly unsafe for the product and its users.",
            "We may also update or discontinue features as the project evolves.",
          ],
        },
        {
          title: "Future changes",
          paragraphs: [
            "Because SearchTalent may grow from an academic project into a production platform, these Terms may be updated to reflect new functionality, billing, moderation, or business requirements.",
            "If major changes happen, the updated version will be published on this page.",
          ],
        },
      ],
    },
    privacy: {
      title: "Privacy Policy",
      description:
        "How SearchTalent stores, uses, and displays account, profile, and project data.",
      eyebrow: "Legal",
      intro:
        "This Privacy Policy explains what data SearchTalent handles, why it is needed, and how it may evolve as the platform expands.",
      lastUpdatedLabel: "Last updated",
      lastUpdatedValue: "March 28, 2026",
      hubLabel: "Legal hub",
      sections: [
        {
          title: "What data we collect",
          paragraphs: [
            "SearchTalent may collect account data such as your email address, authentication identifiers, public profile information, project content, uploaded media, and platform activity related to your use of the service.",
          ],
          bullets: [
            "Account data such as email and login state.",
            "Profile data such as name, username, skills, links, location, and experience.",
            "Project data such as descriptions, technologies, media, and public metadata.",
          ],
        },
        {
          title: "Why we use it",
          paragraphs: [
            "Your data is used to authenticate access, display public pages, support search and discovery, and maintain the core functionality of the platform.",
            "Some technical data may also be used to improve security, reliability, and performance.",
          ],
        },
        {
          title: "Public and private data",
          paragraphs: [
            "Some information is intended to be public, especially profile and project data that you choose to publish.",
            "Other information, such as authentication and internal technical data, is used only to operate the service and should not be exposed publicly.",
          ],
        },
        {
          title: "How this policy may change",
          paragraphs: [
            "As new features are added, this Privacy Policy may expand to cover analytics, communication tools, collaboration features, payments, or external integrations.",
          ],
        },
      ],
    },
    cookies: {
      title: "Cookie Policy",
      description:
        "How SearchTalent uses cookies and similar storage for language, theme, authentication, and core platform behavior.",
      eyebrow: "Legal",
      intro:
        "This Cookie Policy explains the role of cookies and similar browser storage on SearchTalent.",
      lastUpdatedLabel: "Last updated",
      lastUpdatedValue: "March 28, 2026",
      hubLabel: "Legal hub",
      sections: [
        {
          title: "What cookies are used for",
          paragraphs: [
            "SearchTalent uses cookies to support sign-in, language settings, theme preferences when you allow them, and other core product behavior.",
            "Optional categories stay off until you make a clear choice through the consent banner or cookie settings.",
          ],
        },
        {
          title: "Essential cookies",
          paragraphs: [
            "Some cookies are required for authentication, routing, security, and basic site functionality. Without them, key parts of the platform may not work correctly.",
          ],
        },
        {
          title: "Preference cookies",
          paragraphs: [
            "Other cookies may remember choices such as interface theme after you explicitly allow preference cookies.",
            "You can withdraw or change that choice later through the cookie settings entry point in the site footer.",
          ],
        },
        {
          title: "Analytics and marketing categories",
          paragraphs: [
            "Analytics and marketing cookies are optional categories intended for future product growth. They remain disabled unless you actively allow them.",
          ],
        },
        {
          title: "Future updates",
          paragraphs: [
            "If analytics, marketing, personalization, or third-party tools are added later, this Cookie Policy will be expanded to reflect those categories clearly.",
          ],
        },
      ],
    },
  },
  uk: {
    terms: {
      title: "Умови користування",
      description:
        "Базові правила використання SearchTalent, публікації профілів і проєктів та доступу до платформи.",
      eyebrow: "Правова інформація",
      intro:
        "Ці Умови описують базові правила користування SearchTalent. Документ є робочим і може розширюватися разом із розвитком продукту.",
      lastUpdatedLabel: "Останнє оновлення",
      lastUpdatedValue: "28 березня 2026",
      hubLabel: "Правовий розділ",
      sections: [
        {
          title: "Користування платформою",
          paragraphs: [
            "SearchTalent дає змогу створювати акаунти, публікувати профілі, додавати проєкти та переглядати відкриті роботи інших користувачів.",
            "Користуючись сервісом, ви погоджуєтеся використовувати його законно, добросовісно та без шкоди для платформи й інших користувачів.",
          ],
          bullets: [
            "Не видавайте себе за іншу людину чи компанію.",
            "Не публікуйте контент, на який у вас немає прав.",
            "Не намагайтеся зламати сервіс, обходити обмеження або отримувати доступ до чужих даних.",
          ],
        },
        {
          title: "Акаунт і контент",
          paragraphs: [
            "Ви відповідаєте за достовірність інформації, яку публікуєте в акаунті, профілі та проєктах.",
            "Права на ваш контент залишаються за вами, але ви дозволяєте SearchTalent зберігати, показувати й обробляти його в межах роботи сервісу.",
          ],
        },
        {
          title: "Модерація та доступ",
          paragraphs: [
            "Ми можемо обмежити доступ або прибрати контент, якщо він є незаконним, оманливим, образливим або небезпечним для платформи та її користувачів.",
            "Ми також можемо змінювати або прибирати окремі функції в міру розвитку продукту.",
          ],
        },
        {
          title: "Подальші зміни",
          paragraphs: [
            "Оскільки SearchTalent може вирости з навчального проєкту в повноцінний продукт, ці Умови можуть доповнюватися новими положеннями про функціональність, модерацію, оплату чи бізнес-процеси.",
            "Якщо з'являться суттєві зміни, актуальна версія буде опублікована на цій сторінці.",
          ],
        },
      ],
    },
    privacy: {
      title: "Політика конфіденційності",
      description:
        "Як SearchTalent зберігає, використовує та показує дані акаунта, профілю й проєктів.",
      eyebrow: "Правова інформація",
      intro:
        "Ця Політика конфіденційності пояснює, які дані обробляє SearchTalent, навіщо вони потрібні та як документ може змінюватися разом із розвитком платформи.",
      lastUpdatedLabel: "Останнє оновлення",
      lastUpdatedValue: "28 березня 2026",
      hubLabel: "Правовий розділ",
      sections: [
        {
          title: "Які дані ми обробляємо",
          paragraphs: [
            "SearchTalent може обробляти дані акаунта, email, ідентифікатори авторизації, інформацію з публічного профілю, контент проєктів, завантажені медіафайли та активність користувача в межах сервісу.",
          ],
          bullets: [
            "Дані акаунта, зокрема email та стан входу.",
            "Дані профілю: ім'я, username, навички, посилання, локація, досвід.",
            "Дані проєктів: опис, технології, медіа та публічні метадані.",
          ],
        },
        {
          title: "Навіщо це потрібно",
          paragraphs: [
            "Ці дані потрібні для авторизації, показу публічних сторінок, роботи пошуку, навігації та основних функцій платформи.",
            "Частина технічних даних також може використовуватися для безпеки, стабільності й покращення роботи сервісу.",
          ],
        },
        {
          title: "Публічні та непублічні дані",
          paragraphs: [
            "Частина інформації за своєю природою є публічною, зокрема профілі й проєкти, які ви самі публікуєте.",
            "Інша інформація, наприклад дані авторизації та внутрішні технічні записи, використовується лише для роботи сервісу та не має ставати публічною.",
          ],
        },
        {
          title: "Як політика може змінюватися",
          paragraphs: [
            "Якщо надалі з'являться аналітика, комунікація між користувачами, оплата, командні функції чи інтеграції, ця політика буде доповнена окремими положеннями.",
          ],
        },
      ],
    },
    cookies: {
      title: "Політика cookies",
      description:
        "Як SearchTalent використовує cookies та подібне сховище для мови, теми, авторизації та базової роботи платформи.",
      eyebrow: "Правова інформація",
      intro:
        "Ця Політика cookies пояснює, як SearchTalent використовує cookies і подібне браузерне сховище.",
      lastUpdatedLabel: "Останнє оновлення",
      lastUpdatedValue: "28 березня 2026",
      hubLabel: "Правовий розділ",
      sections: [
        {
          title: "Для чого використовуються cookies",
          paragraphs: [
            "SearchTalent використовує cookies для підтримки сесії входу, збереження мови інтерфейсу, теми оформлення після вашого дозволу та іншої базової роботи продукту.",
            "Необов'язкові категорії залишаються вимкненими, доки ви не зробите явний вибір у банері згоди або в налаштуваннях cookies.",
          ],
        },
        {
          title: "Обов'язкові cookies",
          paragraphs: [
            "Деякі cookies потрібні для авторизації, маршрутизації, безпеки та базової роботи сайту. Без них ключові частини платформи можуть працювати некоректно.",
          ],
        },
        {
          title: "Cookies налаштувань",
          paragraphs: [
            "Окремі cookies можуть запам'ятовувати ваші вибори, наприклад тему інтерфейсу, лише після вашого явного дозволу на cookies налаштувань.",
            "Змінити або відкликати цей дозвіл можна пізніше через налаштування cookies у футері сайту.",
          ],
        },
        {
          title: "Аналітика та маркетинг",
          paragraphs: [
            "Аналітичні та маркетингові cookies зарезервовані для майбутнього розвитку продукту. Вони залишаються вимкненими, доки ви самі їх не дозволите.",
          ],
        },
        {
          title: "Подальші оновлення",
          paragraphs: [
            "Якщо в майбутньому на платформі з'являться аналітичні, маркетингові або сторонні інструменти, ця політика буде доповнена окремими категоріями й поясненнями.",
          ],
        },
      ],
    },
  },
};

const legalIndexContent: Record<Locale, LegalIndexContent> = {
  en: {
    eyebrow: "Legal",
    title: "Legal and policy pages",
    description:
      "Core platform documents that explain how SearchTalent works today and can expand as the product grows.",
    cards: [
      {
        href: "/terms",
        title: "Terms of Service",
        description: "Rules for using the platform, publishing content, and maintaining access.",
      },
      {
        href: "/privacy",
        title: "Privacy Policy",
        description: "How account, profile, and project data is handled on the platform.",
      },
      {
        href: "/cookies",
        title: "Cookie Policy",
        description: "How cookies and browser storage support authentication and preferences.",
      },
    ],
  },
  uk: {
    eyebrow: "Правова інформація",
    title: "Правові сторінки платформи",
    description:
      "Базові документи, які пояснюють, як SearchTalent працює зараз і як ці правила можуть розширюватися разом із продуктом.",
    cards: [
      {
        href: "/terms",
        title: "Умови користування",
        description: "Правила користування платформою, публікації контенту та доступу до сервісу.",
      },
      {
        href: "/privacy",
        title: "Політика конфіденційності",
        description: "Пояснення, як платформа працює з даними акаунта, профілю та проєктів.",
      },
      {
        href: "/cookies",
        title: "Політика cookies",
        description: "Як cookies і браузерне сховище підтримують авторизацію та налаштування.",
      },
    ],
  },
};

export function getLegalDocument(locale: Locale, key: LegalDocumentKey) {
  return legalDocuments[locale][key];
}

export function getLegalIndexContent(locale: Locale) {
  return legalIndexContent[locale];
}
