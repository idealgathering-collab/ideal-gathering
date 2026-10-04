export type LegalSection = { id: string; title: string; paragraphs: string[] };
export type LegalDocument = { title: string; intro: string; sections: LegalSection[] };
type LegalCopy = {
  eyebrow: string;
  updated: string;
  contents: string;
  related: string;
  termsLabel: string;
  privacyLabel: string;
  contactTitle: string;
  operator: string;
  contactPending: string;
  contactLink: string;
  settings: string;
  terms: LegalDocument;
  privacy: LegalDocument;
};

export const legalCopy: Record<"fa" | "en", LegalCopy> = {
  en: {
    eyebrow: "Havato · Legal & trust",
    updated: "Last updated: 4 October 2026",
    contents: "On this page",
    related: "Related documents",
    termsLabel: "Terms of Service",
    privacyLabel: "Privacy Policy",
    contactTitle: "Operator & contact",
    operator:
      "Havato is operated by the Havato team. This name describes the service and its operator; it does not identify a registered Havato company.",
    contactPending:
      "Public legal and privacy contact details are not currently available. Account holders can request deletion in account settings where available. If you do not have an account, there is currently no public channel for privacy requests or removal from the Early Access list. Wider access remains subject to providing that channel.",
    contactLink: "Legal and privacy requests",
    settings: "Account settings",
    terms: {
      title: "Terms of Service",
      intro:
        "Your rights and responsibilities when using Havato, meeting people, and planning gatherings during Early Access.",
      sections: [
        {
          id: "service",
          title: "1. Havato and these terms",
          paragraphs: [
            "These terms apply to the Havato service operated by the Havato team (we, us). By using the service, you agree to these terms. If you do not agree, do not use it. Our Privacy Policy explains how personal information is handled.",
            "Havato facilitates introductions, discovery, and gathering coordination. Access is opening gradually, starting with Iran; availability in Canada or elsewhere may follow. An early-access request does not guarantee an invitation, a launch date, or access to every feature. Account, gathering, venue, and planning tools are available only where enabled for your access stage and region.",
          ],
        },
        {
          id: "eligibility",
          title: "2. Eligibility and account care",
          paragraphs: [
            "You must be at least 18 years old and legally able to use the service in your location. Havato is for adults and is not intended for anyone under 18. If local law imposes additional eligibility requirements, those also apply.",
            "Provide accurate information, use only accounts you are authorized to control, and keep credentials secure. Tell us through an available support channel if you suspect unauthorized use. Do not impersonate another person, a venue, or the Havato team. Email confirmation or an access approval is not proof of identity or a background check.",
          ],
        },
        {
          id: "conduct",
          title: "3. Respectful and lawful use",
          paragraphs: [
            "Do not harass, threaten, discriminate against, stalk, exploit, or intimidate others. Hate speech, sexual harassment, non-consensual content, disclosure of someone else's private information, fraud, spam, impersonation, and illegal activity are prohibited.",
            "Do not misuse gatherings to deceive participants, pressure people into payments or unwanted contact, facilitate unlawful activity, or create unsafe conditions. Do not evade blocks or suspensions, scrape private information, compromise accounts, or interfere with the service. Follow applicable law and reasonable host and venue rules. Honor your RSVP or cancel promptly when plans change.",
          ],
        },
        {
          id: "safety",
          title: "4. Meeting people and gathering safety",
          paragraphs: [
            "For a first meeting, choose a public, staffed venue, review the details, arrange your own transport, and let someone you trust know your plans. Respect boundaries and leave if you feel uncomfortable. Reporting and blocking tools help manage concerns; they do not guarantee personal safety or continuous monitoring. In an emergency, contact local emergency services rather than waiting for a platform response.",
            "Public and venue gatherings take place under the host's arrangements and the venue's rules. Check accessibility, costs, capacity, and conditions directly with the host or venue. Havato does not own or operate third-party venues.",
            "Private and home gatherings, when enabled, require additional care: consider meeting participants publicly first, share an exact home address only with intended guests, confirm expectations and guest permissions, and obtain the property holder's permission. A private invitation does not verify a host, guest, or home. Hosts should communicate relevant conditions and respect guests' privacy and consent.",
          ],
        },
        {
          id: "hosts",
          title: "5. Hosts and venues",
          paragraphs: [
            "Hosts are responsible for truthful gathering descriptions, permission to use the location, communicating changes, and managing their arrangements lawfully. Venue representatives must be authorized to act for the venue and keep venue information accurate. Venue approval or listing is not an endorsement or a guarantee of licensing, quality, conditions, or safety.",
            "Any purchase, reservation, or other arrangement directly with a venue or participant is subject to the terms you agree with them. Disclose expected costs before people commit. These responsibilities do not remove any responsibility Havato has under applicable law.",
          ],
        },
        {
          id: "expenses",
          title: "6. Shared expenses and payments",
          paragraphs: [
            "Shared-expense planning is a staged feature. If made available, its scope is recording costs, calculating shares, and helping participants plan or track their own arrangements. Havato does not hold or transfer funds through those features and is not acting as a bank, escrow service, money transmitter, or payment processor.",
            "Participants arrange any actual payment independently and remain responsible for agreeing amounts, checking calculations, and resolving shared-cost disputes. A recorded amount is not confirmation of payment. Any future money-moving service would require separate disclosures and applicable terms before use.",
          ],
        },
        {
          id: "content",
          title: "7. Your content and privacy",
          paragraphs: [
            "You keep your rights in content you submit. You give Havato a limited, non-exclusive permission to store, process, and display it as needed to provide and moderate the service according to your selected visibility and our Privacy Policy. This permission does not transfer ownership of your content.",
            "Upload only content you have permission to share, including photos of others. Avoid posting sensitive details in shared chats or public gathering descriptions. Other participants may retain copies of information you share; do not assume a private room or later deletion can recall their copies.",
          ],
        },
        {
          id: "moderation",
          title: "8. Reporting, blocking, and moderation",
          paragraphs: [
            "Where enabled, use reporting tools for people, messages, or gatherings and blocking tools to limit unwanted interactions. Give accurate information and do not misuse reports. Authorized moderators may review relevant content and safety records, restrict content or gatherings, and suspend or terminate access for violations, abuse, legal requirements, or security concerns.",
            "We may act promptly when needed to protect people or the service. Where appropriate and lawful, we will explain the action and allow a request for review through an available support channel. Blocking has limits and cannot prevent offline contact or every indirect interaction.",
          ],
        },
        {
          id: "deletion",
          title: "9. Ending access and deleting data",
          paragraphs: [
            "You may stop using Havato and request account deletion through account settings where available. Personal-information requests, including early-access list removal, are described in the Privacy Policy and the contact section below. Deleting an account does not itself cancel agreements you made directly with other people or venues.",
            "We retain information only where needed for legitimate purposes or required by law, as described in the Privacy Policy. Suspension does not remove applicable data rights. We may change or discontinue early-access features, subject to mandatory rights and any commitments we have made to you.",
          ],
        },
        {
          id: "disclaimer",
          title: "10. Platform role and limits",
          paragraphs: [
            "Havato provides tools and introductions, not a guarantee of identity, attendance, conduct, venue conditions, personal safety, or compatibility. Suggestions and matching information support your judgment; they are not assurances about another person. Features may be interrupted or change during early access.",
            "To the extent permitted by applicable law, the service is provided as available, without guarantees beyond those required by law. Any exclusion of warranties or liability, including for indirect loss, applies only where lawful. Nothing excludes liability that cannot lawfully be excluded, or limits mandatory consumer remedies or Havato's responsibility for its own legally actionable conduct.",
          ],
        },
        {
          id: "local-law",
          title: "11. Applicable law and mandatory rights",
          paragraphs: [
            "Applicable law is determined by the rules that legally apply to your circumstances, including relevant conflict-of-law rules. These terms do not select one country's law for all users or require exclusive proceedings in a single country. Mandatory consumer, privacy, and other protections in your location remain available, including in Iran and, where relevant, Canada and its provinces.",
            "You may use courts, regulators, or other remedies available under applicable law. Any future regional terms or choice of governing law will be disclosed before they apply and cannot override rights that cannot be waived. Nothing here claims a local license or regulatory approval.",
          ],
        },
        {
          id: "changes",
          title: "12. Changes to these terms",
          paragraphs: [
            "We will publish revised terms here with an updated date and provide notice of material changes through an appropriate available channel. Changes apply prospectively, subject to applicable law; where fresh consent is required, we will seek it. The Persian and English versions are intended to express the same terms; mandatory local language and interpretation rules remain applicable.",
          ],
        },
      ],
    },
    privacy: {
      title: "Privacy Policy",
      intro:
        "What Havato collects, how information is used and shared, and the choices available as access opens gradually.",
      sections: [
        {
          id: "scope",
          title: "1. Scope and early access",
          paragraphs: [
            "This policy covers personal information handled by the operator of Havato, described here as the Havato team (we, us). It covers the public website, early-access requests, and account and venue features where enabled. Havato begins with an Iran-first launch; access in Canada or other regions may follow.",
            "The public early-access form currently asks for your name, email, and agreement to the Terms and this policy. It does not currently ask for city or interests. Other forms or invited account features may request those details. Product features are released in stages: the categories below apply when you use an available feature, not merely because it is shown as planned on the homepage.",
          ],
        },
        {
          id: "account-data",
          title: "2. Account, profile, and contact information",
          paragraphs: [
            "When account access is available, we handle sign-in and account identifiers, email and authentication records, display name, and profile information you supply, such as an avatar, date of birth, city, biography, interests, social links, preferences, and onboarding or quiz responses. Credentials are handled through authentication infrastructure; never send your password in a privacy request.",
            "We use these details to provide account access, profiles, preferences, gathering recommendations, and necessary communications. The early-access list stores the details you submit so we can manage invitations and availability. Providing optional profile information is your choice.",
          ],
        },
        {
          id: "location-data",
          title: "3. Location information",
          paragraphs: [
            "Where location features are enabled, we may handle a selected city or area, saved places, venue or gathering addresses, approximate location, and coordinates you provide or permit your device to supply. Location may support nearby discovery, maps, matching, and attendance check-in where used. Device location requires your browser or device permission; you can deny or revoke it, although related features may be limited.",
            "Maps and address search may send search terms, coordinates, and technical connection information to mapping or geocoding providers. Share private-home addresses carefully and do not put them in public descriptions. We do not describe this as continuous background location tracking.",
          ],
        },
        {
          id: "gathering-data",
          title: "4. Gatherings, messages, and uploads",
          paragraphs: [
            "Enabled gathering features handle topics, descriptions, locations, invitations or participation requests, RSVPs, host and attendee records, check-in or attendance, and feedback. Gathering rooms may include messages and checklists. Personal moments may include notes, dates, selected visibility, and photos or uploads. These support coordination and memories when you choose to use them.",
            "Shared-expense planning is staged, not a current money-transfer service. If enabled, records may include amounts, shares, and participant-entered payment status. Those records do not mean Havato holds or transfers funds, and this policy does not claim that Havato collects banking or payment-card details for shared-expense planning.",
          ],
        },
        {
          id: "safety-data",
          title: "5. Safety and venue information",
          paragraphs: [
            "Reporting and blocking features handle reporter and target identifiers, relevant messages or gathering context, report reasons, block relationships, and moderation decisions. These records support abuse prevention, enforcement, and review of concerns.",
            "Venue features handle representative account and contact details, venue names, locations, descriptions, photos, tables, capacity, availability, approval status, and gathering or attendance information available to authorized venue representatives. Do not submit personal details for a representative without authority.",
          ],
        },
        {
          id: "technical-data",
          title: "6. Device data, storage, and notifications",
          paragraphs: [
            "The service and its infrastructure may handle IP addresses, browser and device information, request timestamps, error and security logs, and session or authentication identifiers needed to deliver and protect the service. Browser storage supports sessions, language preferences, and offline resources; clearing it may sign you out or reset preferences.",
            "If you enable supported push notifications, we handle subscription endpoints and associated keys, notification language and preferences, and delivery records as needed. You can change available preferences and revoke browser permission. We do not treat permission to install Havato as consent to push notifications. This policy does not claim advertising tracking or an analytics system that has not been enabled.",
          ],
        },
        {
          id: "purposes",
          title: "7. Why we use information",
          paragraphs: [
            "We use relevant information to manage early access; authenticate accounts; provide profiles, discovery, and coordination; communicate about your account and gatherings; support venues; deliver requested notifications; diagnose faults; prevent abuse; respond to requests; and meet legal obligations. Recommendations can use profile preferences, interests, age where provided, and gathering context; they do not guarantee compatibility.",
            "We rely on consent where required and on other lawful grounds permitted for the relevant activity and location. Optional permissions can be withdrawn, with possible effects on the related feature. We do not sell personal information. A materially different purpose or new sensitive feature requires an appropriate updated notice and consent where required.",
          ],
        },
        {
          id: "visibility",
          title: "8. Visibility to other people",
          paragraphs: [
            "Profile and gathering information may be visible to others according to the feature's access rules and selected visibility. Hosts, participants, and authorized venue representatives may receive information needed to manage their gathering. Room messages and shared checklists are available to authorized room members. Selected personal moments may be shared when you choose a non-private visibility.",
            "Private does not mean inaccessible to authorized administrators or service providers who need access to operate the service or review a safety issue. Messages are not represented as end-to-end encrypted. Recipients may retain screenshots or copies; deleting your account cannot reliably recall their copies.",
          ],
        },
        {
          id: "providers",
          title: "9. Service providers and disclosures",
          paragraphs: [
            "Havato uses third-party infrastructure, including Supabase for backend, authentication, database, and storage functions where used. Hosting, email, mapping, and push-delivery providers may process information needed for their role. Data is not stored exclusively on Havato-owned servers. Some provider services also apply their own terms or privacy notices.",
            "We limit disclosures to what is relevant for the service or a legitimate request. We may disclose information where legally required, to address fraud or safety concerns when lawful, or to protect legal rights. Provider selection, contractual safeguards, and access controls must be appropriate to the processing; this policy is not a certification of every provider or deployment.",
          ],
        },
        {
          id: "transfers",
          title: "10. Processing locations and safeguards",
          paragraphs: [
            "Providers may process or store information outside your country, including outside Iran or Canada. Laws and government-access rules can differ in those locations. Do not assume all information stays in your launch country. Applicable transfer requirements and safeguards depend on the region, provider, and processing involved.",
            "We use access restrictions, authentication, and other appropriate technical and organizational measures to reduce risk. No system is completely secure. We will address incidents and provide notifications where applicable law requires them.",
          ],
        },
        {
          id: "retention",
          title: "11. Retention and deletion",
          paragraphs: [
            "We keep information for as long as reasonably needed for its purpose, including providing the service, managing invitations, responding to safety reports, preventing fraud, resolving disputes, and fulfilling legal obligations. We do not promise a fixed deletion period that has not been established.",
            "You can request account deletion using account settings where available. Deletion may not immediately remove every record: information needed for lawful retention, active safety matters, or legitimate legal claims may be retained with appropriate limits. Backups may remain until their normal replacement cycle. Shared records and copies held by others may also remain. Where a request cannot be fully honored, we will explain applicable limitations through an available response channel.",
          ],
        },
        {
          id: "rights",
          title: "12. Your choices and privacy rights",
          paragraphs: [
            "Depending on applicable law, you may request access to or a copy of your personal information, correction, deletion, withdrawal of consent, or limits on certain processing, and raise a complaint with the relevant privacy authority. You can edit available profile fields, manage permissions and notification settings, and use account deletion where available. Requests may require proportionate identity verification to protect your information; do not supply unnecessary identity documents.",
            "A request to remove early-access details does not require creating an account. The public contact section below identifies the current request-channel limitation. Once a request channel is provided, we will handle requests within the deadlines required by applicable law, with lawful exceptions explained.",
          ],
        },
        {
          id: "regional-rights",
          title: "13. Iran and possible Canadian access",
          paragraphs: [
            "Applicable local privacy and consumer protections continue to apply. For users in Canada, relevant rights may arise under federal privacy law, including PIPEDA where applicable, and provincial privacy laws. Which rules apply depends on the activity and location. You may have rights to access and correct information, withdraw consent subject to lawful limits, and complain to the relevant regulator.",
            "For an Iran-first launch, information is handled subject to applicable requirements there. This policy does not assert local licensing, registration, or blanket compliance in Iran, Canada, or any other jurisdiction. Mandatory rights are not waived by using Havato.",
          ],
        },
        {
          id: "children",
          title: "14. Children and age",
          paragraphs: [
            "Havato is for adults aged 18 and over. We do not knowingly invite anyone under 18 to use account or gathering features. If information from an ineligible minor is identified, we will restrict access and address deletion subject to applicable legal obligations.",
          ],
        },
        {
          id: "policy-changes",
          title: "15. Policy changes",
          paragraphs: [
            "We will update this page and its date when practices change and provide notice of material changes through an appropriate available channel. Where required, we will obtain consent before a new use begins. Persian and English versions are intended to describe the same practices.",
          ],
        },
      ],
    },
  },
  fa: {
    eyebrow: "هواتو · قوانین و اعتماد",
    updated: "آخرین به‌روزرسانی: ۴ اکتبر ۲۰۲۶",
    contents: "در این صفحه",
    related: "اسناد مرتبط",
    termsLabel: "شرایط استفاده",
    privacyLabel: "سیاست حریم خصوصی",
    contactTitle: "گرداننده و راه ارتباطی",
    operator:
      "هواتو توسط تیم هواتو اداره می‌شود. این نام به سرویس و گردانندهٔ آن اشاره دارد و به معنای معرفی یک شرکت ثبت‌شده با نام هواتو نیست.",
    contactPending:
      "اطلاعات تماس عمومی برای امور حقوقی و حریم خصوصی در حال حاضر در دسترس نیست. دارندگان حساب می‌توانند، در صورت دسترسی به این گزینه، از تنظیمات حساب درخواست حذف کنند. اگر حساب ندارید، اکنون راه ارتباطی عمومی برای درخواست‌های حریم خصوصی یا حذف اطلاعات از فهرست دسترسی زودهنگام وجود ندارد. گسترش دسترسی منوط به فراهم شدن این راه ارتباطی است.",
    contactLink: "درخواست‌های حقوقی و حریم خصوصی",
    settings: "تنظیمات حساب",
    terms: {
      title: "شرایط استفاده",
      intro:
        "حقوق و مسئولیت‌های شما هنگام استفاده از هواتو، آشنایی با دیگران و برنامه‌ریزی دورهمی‌ها در دورهٔ دسترسی زودهنگام.",
      sections: [
        {
          id: "service",
          title: "۱. هواتو و این شرایط",
          paragraphs: [
            "این شرایط برای سرویس هواتو که تیم هواتو (ما) اداره می‌کند اعمال می‌شود. با استفاده از سرویس، این شرایط را می‌پذیرید؛ اگر موافق نیستید، از آن استفاده نکنید. سیاست حریم خصوصی ما نحوهٔ رسیدگی به اطلاعات شخصی را توضیح می‌دهد.",
            "هواتو ابزارهایی برای آشنایی، کشف و هماهنگی دورهمی‌ها فراهم می‌کند. دسترسی به‌تدریج و با شروع از ایران باز می‌شود؛ ممکن است دسترسی در کانادا یا مناطق دیگر بعداً فراهم شود. درخواست دسترسی زودهنگام، دعوت، تاریخ راه‌اندازی یا دسترسی به همهٔ قابلیت‌ها را تضمین نمی‌کند. ابزارهای حساب، دورهمی، مکان و برنامه‌ریزی فقط در صورت فعال بودن برای مرحلهٔ دسترسی و منطقهٔ شما قابل استفاده‌اند.",
          ],
        },
        {
          id: "eligibility",
          title: "۲. شرایط عضویت و مراقبت از حساب",
          paragraphs: [
            "باید حداقل ۱۸ سال داشته باشید و از نظر قانونی مجاز به استفاده از سرویس در محل زندگی خود باشید. هواتو ویژهٔ بزرگسالان است و برای افراد زیر ۱۸ سال ارائه نمی‌شود. الزامات تکمیلی قانون محل شما نیز باید رعایت شود.",
            "اطلاعات درست ارائه کنید، فقط از حساب‌هایی استفاده کنید که اجازهٔ کنترل آن‌ها را دارید و اطلاعات ورود را امن نگه دارید. در صورت احتمال استفادهٔ غیرمجاز، از راه پشتیبانی موجود اطلاع دهید. خود را به‌جای شخص دیگر، یک مکان یا تیم هواتو معرفی نکنید. تأیید ایمیل یا تأیید دسترسی، احراز هویت یا بررسی پیشینه محسوب نمی‌شود.",
          ],
        },
        {
          id: "conduct",
          title: "۳. استفادهٔ محترمانه و قانونی",
          paragraphs: [
            "آزار، تهدید، تبعیض، تعقیب، سوءاستفاده و ترساندن دیگران ممنوع است. نفرت‌پراکنی، آزار جنسی، محتوای بدون رضایت، افشای اطلاعات خصوصی دیگران، تقلب، هرزنامه، جعل هویت و فعالیت غیرقانونی مجاز نیست.",
            "از دورهمی‌ها برای فریب شرکت‌کنندگان، فشار برای پرداخت یا تماس ناخواسته، فعالیت غیرقانونی یا ایجاد شرایط ناامن سوءاستفاده نکنید. مسدودسازی یا تعلیق را دور نزنید؛ اطلاعات خصوصی را استخراج نکنید و امنیت حساب‌ها یا کار سرویس را مختل نکنید. قوانین مربوط و قواعد معقول میزبان و مکان را رعایت کنید. به اعلام حضور خود پایبند باشید یا در صورت تغییر برنامه به‌موقع انصراف دهید.",
          ],
        },
        {
          id: "safety",
          title: "۴. آشنایی و ایمنی دورهمی",
          paragraphs: [
            "برای دیدار نخست، یک مکان عمومی با کارکنان حاضر انتخاب کنید، جزئیات را بررسی کنید، رفت‌وآمد خود را برنامه‌ریزی کنید و فردی مورد اعتماد را از برنامه آگاه کنید. به مرزهای شخصی احترام بگذارید و اگر احساس راحتی ندارید، محل را ترک کنید. گزارش و مسدودسازی به مدیریت نگرانی‌ها کمک می‌کنند اما ایمنی شخصی یا نظارت دائمی را تضمین نمی‌کنند. در وضعیت اضطراری با خدمات اضطراری محل تماس بگیرید و منتظر پاسخ پلتفرم نمانید.",
            "دورهمی‌های عمومی و دورهمی در مکان‌های تجاری تابع هماهنگی میزبان و قواعد مکان هستند. دسترس‌پذیری، هزینه، ظرفیت و شرایط را مستقیم با میزبان یا مکان بررسی کنید. هواتو مالک یا اداره‌کنندهٔ مکان‌های مستقل نیست.",
            "دورهمی خصوصی و خانگی، در صورت فعال شدن، به دقت بیشتری نیاز دارد: بهتر است ابتدا شرکت‌کنندگان را در فضای عمومی ببینید، نشانی دقیق خانه را فقط با مهمانان موردنظر به اشتراک بگذارید، انتظارها و اجازهٔ حضور مهمانان را روشن کنید و اجازهٔ صاحب یا مسئول ملک را بگیرید. دعوت خصوصی به معنای تأیید میزبان، مهمان یا خانه نیست. میزبان باید شرایط مرتبط را توضیح دهد و حریم خصوصی و رضایت مهمانان را رعایت کند.",
          ],
        },
        {
          id: "hosts",
          title: "۵. میزبان‌ها و مکان‌ها",
          paragraphs: [
            "میزبان مسئول توضیح درست دورهمی، داشتن اجازهٔ استفاده از محل، اطلاع‌رسانی تغییرات و هماهنگی قانونی است. نمایندهٔ مکان باید اختیار اقدام از طرف آن مکان را داشته باشد و اطلاعات را به‌روز نگه دارد. ثبت یا تأیید مکان، توصیه یا تضمین مجوز، کیفیت، شرایط یا ایمنی آن نیست.",
            "خرید، رزرو یا توافق مستقیم با مکان یا شرکت‌کننده تابع شرایطی است که با او می‌پذیرید. هزینه‌های مورد انتظار را پیش از تعهد افراد روشن کنید. این مسئولیت‌ها، مسئولیت قانونی هواتو را از بین نمی‌برند.",
          ],
        },
        {
          id: "expenses",
          title: "۶. هزینه‌های مشترک و پرداخت",
          paragraphs: [
            "برنامه‌ریزی هزینه‌های مشترک قابلیتی مرحله‌ای است. در صورت ارائه، نقش آن ثبت هزینه‌ها، محاسبهٔ سهم‌ها و کمک به برنامه‌ریزی یا پیگیری توافق شرکت‌کنندگان است. هواتو از طریق این قابلیت‌ها پول نگهداری یا منتقل نمی‌کند و در نقش بانک، امین وجوه، انتقال‌دهندهٔ پول یا پردازشگر پرداخت عمل نمی‌کند.",
            "شرکت‌کنندگان پرداخت واقعی را مستقل انجام می‌دهند و مسئول توافق دربارهٔ مبلغ، بررسی محاسبات و حل اختلاف هزینه هستند. ثبت مبلغ به معنای تأیید پرداخت نیست. هر سرویس آینده برای جابه‌جایی پول، پیش از استفاده به اطلاع‌رسانی و شرایط جداگانه نیاز خواهد داشت.",
          ],
        },
        {
          id: "content",
          title: "۷. محتوا و حریم خصوصی شما",
          paragraphs: [
            "حقوق محتوای ارسالی متعلق به شما باقی می‌ماند. به هواتو اجازه‌ای محدود و غیرانحصاری برای ذخیره، پردازش و نمایش آن در حد لازم برای ارائه و مدیریت سرویس، مطابق سطح نمایش انتخابی شما و سیاست حریم خصوصی، می‌دهید. این اجازه مالکیت محتوا را منتقل نمی‌کند.",
            "فقط محتوایی را بارگذاری کنید که اجازهٔ اشتراک آن را دارید، از جمله عکس دیگران. اطلاعات حساس را در گفت‌وگوهای مشترک یا توضیح عمومی دورهمی ننویسید. دیگران ممکن است از اطلاعات اشتراکی نسخه نگه دارند؛ خصوصی بودن اتاق یا حذف بعدی لزوماً نسخه‌های آن‌ها را بازپس نمی‌گیرد.",
          ],
        },
        {
          id: "moderation",
          title: "۸. گزارش، مسدودسازی و مدیریت تخلف",
          paragraphs: [
            "در صورت فعال بودن، از ابزار گزارش برای افراد، پیام‌ها یا دورهمی‌ها و از مسدودسازی برای محدود کردن تعامل ناخواسته استفاده کنید. گزارش درست بدهید و از آن سوءاستفاده نکنید. مدیران مجاز می‌توانند محتوا و سوابق ایمنی مرتبط را بررسی کنند، محتوا یا دورهمی را محدود کنند و به دلیل تخلف، سوءاستفاده، الزام قانونی یا نگرانی امنیتی دسترسی را تعلیق یا خاتمه دهند.",
            "برای حفاظت از افراد یا سرویس ممکن است اقدام فوری لازم باشد. در صورت مناسب و قانونی بودن، دلیل اقدام را توضیح می‌دهیم و امکان درخواست بررسی از راه پشتیبانی موجود را فراهم می‌کنیم. مسدودسازی محدودیت دارد و مانع تماس خارج از سرویس یا همهٔ تعامل‌های غیرمستقیم نمی‌شود.",
          ],
        },
        {
          id: "deletion",
          title: "۹. پایان استفاده و حذف اطلاعات",
          paragraphs: [
            "می‌توانید استفاده از هواتو را متوقف و، در صورت در دسترس بودن، از تنظیمات حساب درخواست حذف حساب کنید. درخواست‌های اطلاعات شخصی، از جمله حذف از فهرست دسترسی زودهنگام، در سیاست حریم خصوصی و بخش ارتباط زیر توضیح داده شده‌اند. حذف حساب به‌خودی‌خود توافق مستقیم شما با دیگران یا مکان‌ها را لغو نمی‌کند.",
            "اطلاعات فقط برای اهداف مشروع لازم یا الزام قانونی، طبق سیاست حریم خصوصی، نگهداری می‌شود. تعلیق، حقوق مربوط به داده را از بین نمی‌برد. قابلیت‌های دسترسی زودهنگام ممکن است تغییر کنند یا متوقف شوند، با رعایت حقوق الزامی و تعهدهایی که به شما داده‌ایم.",
          ],
        },
        {
          id: "disclaimer",
          title: "۱۰. نقش پلتفرم و محدودیت‌ها",
          paragraphs: [
            "هواتو ابزار و امکان آشنایی فراهم می‌کند و هویت، حضور، رفتار، شرایط مکان، ایمنی شخصی یا سازگاری افراد را تضمین نمی‌کند. پیشنهادها و اطلاعات تطبیق به قضاوت شما کمک می‌کنند؛ اطمینان قطعی دربارهٔ دیگری نیستند. در دورهٔ دسترسی زودهنگام ممکن است قابلیت‌ها تغییر کنند یا وقفه داشته باشند.",
            "تا حدی که قانون مربوط اجازه می‌دهد، سرویس بر اساس دسترس‌پذیری و بدون تضمینی بیش از الزام قانونی ارائه می‌شود. هر محدودیت ضمانت یا مسئولیت، از جمله خسارت غیرمستقیم، فقط در حد مجاز قانون اعمال می‌شود. مسئولیتی که قانوناً قابل حذف نیست، حقوق جبران خسارت الزامی مصرف‌کننده و مسئولیت هواتو در قبال رفتار قابل پیگیری قانونی خود، محدود یا حذف نمی‌شود.",
          ],
        },
        {
          id: "local-law",
          title: "۱۱. قانون مربوط و حقوق الزامی",
          paragraphs: [
            "قانون مربوط بر اساس قواعد قانونی قابل اعمال به وضعیت شما، از جمله قواعد تعارض قوانین، تعیین می‌شود. این شرایط قانون یک کشور را برای همهٔ کاربران تعیین نمی‌کند و رسیدگی انحصاری در یک کشور را الزامی نمی‌سازد. حمایت‌های الزامی مصرف‌کننده، حریم خصوصی و سایر حقوق محل شما، از جمله در ایران و در صورت ارتباط در کانادا و استان‌های آن، باقی می‌مانند.",
            "می‌توانید از دادگاه‌ها، نهادهای ناظر و راه‌های جبران موجود در قانون مربوط استفاده کنید. شرایط منطقه‌ای یا انتخاب قانون در آینده پیش از اعمال اعلام می‌شود و حقوق غیرقابل اسقاط را کنار نمی‌زند. این متن ادعای مجوز محلی یا تأیید نهاد ناظر نیست.",
          ],
        },
        {
          id: "changes",
          title: "۱۲. تغییر شرایط",
          paragraphs: [
            "شرایط اصلاح‌شده و تاریخ آن را در این صفحه منتشر و تغییرهای مهم را از راه مناسب و موجود اطلاع‌رسانی می‌کنیم. تغییرها با رعایت قانون مربوط برای آینده اعمال می‌شوند؛ اگر رضایت تازه لازم باشد، آن را می‌گیریم. هدف نسخه‌های فارسی و انگلیسی بیان شرایط یکسان است؛ قواعد الزامی محلی دربارهٔ زبان و تفسیر همچنان اعمال می‌شوند.",
          ],
        },
      ],
    },
    privacy: {
      title: "سیاست حریم خصوصی",
      intro:
        "اطلاعاتی که هواتو دریافت می‌کند، شیوهٔ استفاده و اشتراک آن‌ها و انتخاب‌های شما در دورهٔ گسترش تدریجی دسترسی.",
      sections: [
        {
          id: "scope",
          title: "۱. دامنه و دسترسی زودهنگام",
          paragraphs: [
            "این سیاست دربارهٔ اطلاعات شخصی است که گردانندهٔ هواتو، با عنوان تیم هواتو (ما)، پردازش می‌کند. وب‌سایت عمومی، درخواست دسترسی زودهنگام و قابلیت‌های حساب و مکان در صورت فعال بودن را پوشش می‌دهد. راه‌اندازی هواتو از ایران شروع می‌شود؛ دسترسی در کانادا یا مناطق دیگر ممکن است بعداً فراهم شود.",
            "فرم عمومی دسترسی زودهنگام اکنون نام، ایمیل و پذیرش شرایط و این سیاست را می‌خواهد و در حال حاضر شهر یا علاقه‌مندی را نمی‌پرسد. فرم‌های دیگر یا قابلیت‌های حساب دعوت‌شده ممکن است این اطلاعات را بخواهند. قابلیت‌ها مرحله‌ای ارائه می‌شوند؛ دسته‌های زیر وقتی اعمال می‌شوند که از قابلیت موجود استفاده کنید، نه صرفاً چون در صفحهٔ اصلی به‌عنوان برنامهٔ آینده معرفی شده‌اند.",
          ],
        },
        {
          id: "account-data",
          title: "۲. اطلاعات حساب، پروفایل و ارتباط",
          paragraphs: [
            "در صورت دسترسی به حساب، شناسه‌های ورود و حساب، ایمیل و سوابق احراز دسترسی و اطلاعات پروفایل ارسالی شما مانند نام نمایشی، تصویر، تاریخ تولد، شهر، معرفی، علاقه‌ها، پیوندهای اجتماعی، ترجیحات و پاسخ‌های شروع کار یا پرسش‌نامه پردازش می‌شود. اطلاعات ورود از طریق زیرساخت احراز دسترسی مدیریت می‌شود؛ گذرواژه را در درخواست حریم خصوصی نفرستید.",
            "این اطلاعات برای دسترسی به حساب، پروفایل، ترجیحات، پیشنهاد دورهمی و ارتباط ضروری استفاده می‌شود. فهرست دسترسی زودهنگام اطلاعات ارسالی را برای مدیریت دعوت‌ها و دسترس‌پذیری ذخیره می‌کند. ارائهٔ اطلاعات اختیاری پروفایل انتخاب شماست.",
          ],
        },
        {
          id: "location-data",
          title: "۳. اطلاعات موقعیت",
          paragraphs: [
            "در صورت فعال بودن قابلیت‌های موقعیت، شهر یا محدودهٔ انتخابی، مکان‌های ذخیره‌شده، نشانی مکان یا دورهمی، موقعیت تقریبی و مختصات ارسالی شما یا دریافت‌شده با اجازهٔ دستگاه پردازش می‌شود. موقعیت می‌تواند برای کشف نزدیک، نقشه، تطبیق یا ثبت حضور استفاده شود. دریافت موقعیت دستگاه به اجازهٔ مرورگر یا دستگاه نیاز دارد؛ می‌توانید آن را ندهید یا لغو کنید، هرچند قابلیت مرتبط محدود می‌شود.",
            "نقشه و جست‌وجوی نشانی ممکن است عبارت جست‌وجو، مختصات و اطلاعات فنی اتصال را برای ارائه‌دهندگان نقشه یا تبدیل نشانی ارسال کنند. نشانی خانه را با احتیاط به اشتراک بگذارید و در توضیح عمومی ننویسید. این کار به‌عنوان ردیابی مداوم موقعیت در پس‌زمینه معرفی نمی‌شود.",
          ],
        },
        {
          id: "gathering-data",
          title: "۴. دورهمی، پیام و بارگذاری",
          paragraphs: [
            "قابلیت‌های فعال دورهمی موضوع، توضیح، محل، دعوت یا درخواست شرکت، اعلام حضور، سوابق میزبان و شرکت‌کننده، ثبت حضور و بازخورد را پردازش می‌کنند. اتاق دورهمی ممکن است پیام و چک‌لیست داشته باشد. لحظه‌های شخصی می‌توانند یادداشت، تاریخ، سطح نمایش انتخابی و عکس یا فایل داشته باشند. این‌ها هنگام استفادهٔ انتخابی شما به هماهنگی و ثبت خاطره کمک می‌کنند.",
            "برنامه‌ریزی هزینهٔ مشترک مرحله‌ای است و سرویس فعلی انتقال پول نیست. در صورت فعال شدن، سوابق می‌توانند مبلغ، سهم و وضعیت پرداخت واردشده توسط شرکت‌کننده را شامل شوند. این سوابق به معنای نگهداری یا انتقال پول توسط هواتو نیست و این سیاست ادعای دریافت اطلاعات بانکی یا کارت پرداخت برای برنامه‌ریزی هزینهٔ مشترک ندارد.",
          ],
        },
        {
          id: "safety-data",
          title: "۵. اطلاعات ایمنی و مکان‌ها",
          paragraphs: [
            "قابلیت‌های گزارش و مسدودسازی شناسهٔ گزارش‌دهنده و موضوع گزارش، پیام یا زمینهٔ دورهمی مرتبط، دلیل گزارش، رابطهٔ مسدودسازی و تصمیم مدیریت را پردازش می‌کنند. این سوابق برای پیشگیری از سوءاستفاده، اجرای قواعد و بررسی نگرانی‌ها هستند.",
            "قابلیت‌های مکان، اطلاعات حساب و ارتباط نماینده، نام، موقعیت، توضیح، عکس، میزها، ظرفیت، زمان دسترس‌پذیری، وضعیت تأیید و اطلاعات دورهمی یا حضور قابل دسترسی برای نمایندگان مجاز را پردازش می‌کنند. اطلاعات شخصی نماینده را بدون اختیار ارائه نکنید.",
          ],
        },
        {
          id: "technical-data",
          title: "۶. دادهٔ دستگاه، ذخیره‌سازی و اعلان",
          paragraphs: [
            "سرویس و زیرساخت آن ممکن است نشانی IP، اطلاعات مرورگر و دستگاه، زمان درخواست، گزارش خطا و امنیت و شناسه‌های نشست یا احراز دسترسی لازم برای ارائه و حفاظت سرویس را پردازش کنند. ذخیره‌سازی مرورگر به نشست، زبان و منابع آفلاین کمک می‌کند؛ پاک کردن آن ممکن است شما را خارج کند یا ترجیحات را بازنشانی کند.",
            "اگر اعلان پوش پشتیبانی‌شده را فعال کنید، نشانی اشتراک و کلیدهای مرتبط، زبان و ترجیحات اعلان و سوابق تحویل در حد نیاز پردازش می‌شوند. می‌توانید ترجیحات موجود را تغییر دهید یا اجازهٔ مرورگر را لغو کنید. اجازهٔ نصب هواتو، رضایت به اعلان پوش محسوب نمی‌شود. این سیاست ادعای وجود ردیابی تبلیغاتی یا سامانهٔ تحلیل فعال‌نشده ندارد.",
          ],
        },
        {
          id: "purposes",
          title: "۷. دلیل استفاده از اطلاعات",
          paragraphs: [
            "اطلاعات مرتبط برای مدیریت دسترسی زودهنگام، ورود حساب، پروفایل، کشف و هماهنگی، ارتباط دربارهٔ حساب و دورهمی، پشتیبانی مکان، اعلان درخواستی، تشخیص خطا، پیشگیری از سوءاستفاده، پاسخ به درخواست و تعهد قانونی استفاده می‌شود. پیشنهادها می‌توانند از ترجیحات، علاقه‌ها، سن در صورت ارائه و زمینهٔ دورهمی استفاده کنند؛ سازگاری را تضمین نمی‌کنند.",
            "در موارد لازم بر رضایت و برای فعالیت‌های دیگر بر مبناهای قانونی مجاز متناسب با محل تکیه می‌کنیم. اجازه‌های اختیاری قابل لغو هستند و ممکن است قابلیت مرتبط را محدود کنند. اطلاعات شخصی را نمی‌فروشیم. هدفی اساساً متفاوت یا قابلیت حساس تازه، به اطلاع‌رسانی مناسب و در صورت الزام، رضایت نیاز دارد.",
          ],
        },
        {
          id: "visibility",
          title: "۸. نمایش به دیگران",
          paragraphs: [
            "اطلاعات پروفایل و دورهمی ممکن است طبق قواعد دسترسی قابلیت و سطح نمایش انتخابی برای دیگران قابل مشاهده باشد. میزبان، شرکت‌کنندگان و نمایندگان مجاز مکان ممکن است اطلاعات لازم برای مدیریت دورهمی را دریافت کنند. پیام اتاق و چک‌لیست مشترک در اختیار اعضای مجاز اتاق هستند. برخی لحظه‌های شخصی با انتخاب سطح نمایش غیرخصوصی به اشتراک گذاشته می‌شوند.",
            "خصوصی بودن به معنای عدم دسترسی مدیران یا ارائه‌دهندگان مجازی که برای ادارهٔ سرویس یا بررسی مسئلهٔ ایمنی نیاز دارند نیست. پیام‌ها به‌عنوان رمزگذاری‌شدهٔ سرتاسری معرفی نمی‌شوند. گیرندگان ممکن است تصویر صفحه یا نسخه نگه دارند؛ حذف حساب نمی‌تواند بازپس‌گیری نسخه‌های آن‌ها را تضمین کند.",
          ],
        },
        {
          id: "providers",
          title: "۹. ارائه‌دهندگان و افشای اطلاعات",
          paragraphs: [
            "هواتو از زیرساخت اشخاص ثالث، از جمله Supabase برای خدمات پشت‌صحنه، احراز دسترسی، پایگاه داده و ذخیره‌سازی در موارد استفاده، بهره می‌گیرد. ارائه‌دهندگان میزبانی، ایمیل، نقشه و تحویل پوش ممکن است اطلاعات لازم برای نقش خود را پردازش کنند. داده فقط روی سرورهای متعلق به هواتو ذخیره نمی‌شود. بعضی خدمات ارائه‌دهنده شرایط یا سیاست حریم خصوصی خود را هم دارند.",
            "افشا به اطلاعات مرتبط با سرویس یا درخواست مشروع محدود می‌شود. اطلاعات ممکن است در صورت الزام قانونی، رسیدگی قانونی به تقلب یا نگرانی ایمنی یا حفاظت از حقوق قانونی افشا شود. انتخاب ارائه‌دهنده، ضمانت‌های قراردادی و کنترل دسترسی باید مناسب پردازش باشد؛ این سیاست تأییدیهٔ همهٔ ارائه‌دهندگان یا هر استقرار نیست.",
          ],
        },
        {
          id: "transfers",
          title: "۱۰. محل پردازش و حفاظت",
          paragraphs: [
            "ارائه‌دهندگان ممکن است اطلاعات را خارج از کشور شما، از جمله خارج از ایران یا کانادا، پردازش یا ذخیره کنند. قوانین و قواعد دسترسی دولت‌ها ممکن است متفاوت باشد. فرض نکنید همهٔ اطلاعات در کشور شروع فعالیت می‌ماند. الزامات انتقال و حفاظت مربوط به منطقه، ارائه‌دهنده و نوع پردازش بستگی دارد.",
            "برای کاهش خطر از محدودیت دسترسی، احراز دسترسی و تدابیر فنی و سازمانی مناسب استفاده می‌کنیم. هیچ سامانه‌ای کاملاً امن نیست. به رخدادها رسیدگی و در صورت الزام قانون مربوط، اطلاع‌رسانی می‌کنیم.",
          ],
        },
        {
          id: "retention",
          title: "۱۱. نگهداری و حذف",
          paragraphs: [
            "اطلاعات تا زمانی که معقولانه برای هدف لازم باشد نگهداری می‌شود؛ از جمله ارائهٔ سرویس، مدیریت دعوت‌ها، رسیدگی به گزارش ایمنی، پیشگیری از تقلب، حل اختلاف و تعهد قانونی. زمان ثابت حذفی که هنوز تعیین نشده را وعده نمی‌دهیم.",
            "در صورت در دسترس بودن می‌توانید از تنظیمات حساب درخواست حذف کنید. حذف ممکن است همهٔ سوابق را فوراً پاک نکند: اطلاعات لازم برای نگهداری قانونی، موضوع ایمنی در حال بررسی یا ادعای حقوقی مشروع ممکن است با محدودیت مناسب باقی بماند. نسخهٔ پشتیبان تا چرخهٔ معمول جایگزینی و سوابق مشترک یا نسخه‌های دیگران نیز ممکن است باقی بمانند. اگر درخواست کامل قابل انجام نباشد، محدودیت مربوط از راه پاسخ موجود توضیح داده می‌شود.",
          ],
        },
        {
          id: "rights",
          title: "۱۲. انتخاب‌ها و حقوق شما",
          paragraphs: [
            "بسته به قانون مربوط، می‌توانید دسترسی یا نسخهٔ اطلاعات شخصی، اصلاح، حذف، پس‌گرفتن رضایت یا محدودیت برخی پردازش‌ها را درخواست کنید و نزد نهاد حریم خصوصی مربوط شکایت کنید. می‌توانید فیلدهای موجود پروفایل را ویرایش، اجازه‌ها و تنظیمات اعلان را مدیریت و از حذف حساب در صورت دسترسی استفاده کنید. برای حفاظت اطلاعات ممکن است تأیید هویت متناسب لازم باشد؛ مدرک هویتی غیرضروری نفرستید.",
            "درخواست حذف اطلاعات دسترسی زودهنگام به ساخت حساب نیاز ندارد. بخش ارتباط عمومی زیر محدودیت فعلی راه درخواست را مشخص می‌کند. پس از فراهم شدن آن راه، درخواست‌ها در مهلت قانونی مربوط رسیدگی و استثناهای قانونی توضیح داده می‌شوند.",
          ],
        },
        {
          id: "regional-rights",
          title: "۱۳. ایران و دسترسی احتمالی در کانادا",
          paragraphs: [
            "حمایت‌های محلی مربوط به حریم خصوصی و مصرف‌کننده همچنان اعمال می‌شوند. کاربران کانادا ممکن است تحت قانون فدرال حریم خصوصی، از جمله PIPEDA در موارد قابل اعمال، و قوانین استانی حقوق داشته باشند. قواعد مربوط به فعالیت و محل بستگی دارد. دسترسی و اصلاح اطلاعات، پس‌گرفتن رضایت با محدودیت قانونی و شکایت نزد نهاد ناظر مربوط از حقوق احتمالی هستند.",
            "در شروع فعالیت از ایران، رسیدگی به اطلاعات تابع الزامات مربوط در آنجا است. این سیاست ادعای مجوز محلی، ثبت یا انطباق کامل در ایران، کانادا یا حوزهٔ دیگری نیست. استفاده از هواتو حقوق الزامی را ساقط نمی‌کند.",
          ],
        },
        {
          id: "children",
          title: "۱۴. کودکان و سن",
          paragraphs: [
            "هواتو ویژهٔ افراد ۱۸ سال به بالا است. افراد زیر ۱۸ سال را آگاهانه به استفاده از حساب یا دورهمی‌ها دعوت نمی‌کنیم. اگر اطلاعات فردی زیر سن مجاز شناسایی شود، دسترسی او را محدود می‌کنیم و با رعایت تعهدهای قانونی به حذف اطلاعات رسیدگی می‌کنیم.",
          ],
        },
        {
          id: "policy-changes",
          title: "۱۵. تغییر سیاست",
          paragraphs: [
            "با تغییر شیوه‌ها، این صفحه و تاریخ آن را به‌روز و تغییرهای مهم را از راه مناسب و موجود اطلاع‌رسانی می‌کنیم. در صورت الزام، پیش از استفادهٔ تازه رضایت می‌گیریم. هدف نسخه‌های فارسی و انگلیسی توضیح شیوه‌های یکسان است.",
          ],
        },
      ],
    },
  },
};
