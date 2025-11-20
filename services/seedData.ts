import { Service, ServiceCategory } from '../types';

export const litigationSeedServices: Service[] = [
  // 1) Civil & Commercial Litigation
  {
    id: "civil-claim-filing",
    title: { en: "Civil Claim Filing", ar: "رفع الدعاوى المدنية" },
    description: { en: "Drafting and filing civil lawsuits according to legal procedures.", ar: "صياغة ورفع الدعاوى المدنية وفقاً للإجراءات القانونية." },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: "Civil & Commercial Litigation", ar: "الدعاوى المدنية والتجارية" },
    icon: "FileText",
    geminiModel: "gemini-2.5-flash",
    formInputs: [{ name: "case_details", label: { en: "Case Details", ar: "تفاصيل القضية" }, type: "textarea" }],
    usageCount: 0
  },
  {
    id: "drafting-responsive-memos",
    title: { en: "Drafting Responsive Memos", ar: "صياغة المذكرات الجوابية" },
    description: { en: "Preparing and drafting legal responses and memorandums in response to claims.", ar: "إعداد وصياغة الردود والمذكرات القانونية رداً على الدعاوى." },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: "Civil & Commercial Litigation", ar: "الدعاوى المدنية والتجارية" },
    icon: "FileText",
    geminiModel: "gemini-2.5-flash",
    formInputs: [{ name: "opponent_memo", label: { en: "Opponent's Memo", ar: "مذكرة الخصم" }, type: "file" }],
    usageCount: 0
  },
  {
    id: 'submitting-formal-and-substantive-defenses',
    title: { en: 'Submitting Formal and Substantive Defenses', ar: 'تقديم الدفوع الشكلية والموضوعية' },
    description: { en: 'Prepare and submit formal and substantive legal defenses in court.', ar: 'إعداد وتقديم الدفوع القانونية الشكلية والموضوعية أمام المحكمة.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Civil & Commercial Litigation', ar: 'الدعاوى المدنية والتجارية' },
    icon: 'Shield',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'case_facts', label: { en: 'Case Facts', ar: 'وقائع الدعوى' }, type: 'textarea' }],
    usageCount: 0
  },
  {
    id: 'compensation-claims-and-proof-of-damage',
    title: { en: 'Compensation Claims and Proof of Damage', ar: 'دعاوى التعويض وإثبات الضرر' },
    description: { en: 'File claims for compensation and provide legal proof of damages incurred.', ar: 'رفع دعاوى للمطالبة بالتعويضات وتقديم الإثباتات القانونية للأضرار المتكبدة.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Civil & Commercial Litigation', ar: 'الدعاوى المدنية والتجارية' },
    icon: 'Banknote',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'damage_details', label: { en: 'Details of Damage and Evidence', ar: 'تفاصيل الضرر والأدلة' }, type: 'textarea' }],
    usageCount: 0
  },
  {
    id: 'commercial-disputes-between-companies',
    title: { en: 'Commercial Disputes Between Companies', ar: 'المنازعات التجارية بين الشركات' },
    description: { en: 'Representing companies in commercial disputes and litigation.', ar: 'تمثيل الشركات في المنازعات والدعاوى التجارية.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Civil & Commercial Litigation', ar: 'الدعاوى المدنية والتجارية' },
    icon: 'Building2',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'dispute_summary', label: { en: 'Dispute Summary', ar: 'ملخص النزاع' }, type: 'textarea' }],
    usageCount: 0
  },
  {
    id: 'construction-cases-and-financial-claims',
    title: { en: 'Construction Cases and Financial Claims', ar: 'قضايا المقاولات والمطالبات المالية' },
    description: { en: 'Handle legal cases related to construction contracts and financial claims.', ar: 'معالجة القضايا القانونية المتعلقة بعقود المقاولات والمطالبات المالية.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Civil & Commercial Litigation', ar: 'الدعاوى المدنية والتجارية' },
    icon: 'Gavel',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'contract_and_claims', label: { en: 'Contract and Claim Details', ar: 'تفاصيل العقد والمطالبات' }, type: 'textarea' }],
    usageCount: 0
  },
  {
    id: 'banking-and-finance-cases',
    title: { en: 'Banking and Finance Cases', ar: 'القضايا المصرفية والتمويلية' },
    description: { en: 'Litigation services for banking disputes, loans, and financial agreements.', ar: 'خدمات التقاضي في النزاعات المصرفية والقروض والاتفاقيات المالية.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Civil & Commercial Litigation', ar: 'الدعاوى المدنية والتجارية' },
    icon: 'Landmark',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'case_documents', label: { en: 'Case Documents', ar: 'مستندات القضية' }, type: 'file' }],
    usageCount: 0
  },
  {
    id: 'appeals-against-administrative-decisions',
    title: { en: 'Appeals Against Administrative Decisions', ar: 'الطعون على القرارات الإدارية' },
    description: { en: 'Challenging and appealing administrative decisions issued by government bodies.', ar: 'الطعن والاعتراض على القرارات الإدارية الصادرة عن الجهات الحكومية.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Civil & Commercial Litigation', ar: 'الدعاوى المدنية والتجارية' },
    icon: 'Archive',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'decision_document', label: { en: 'Administrative Decision Document', ar: 'مستند القرار الإداري' }, type: 'file' }],
    usageCount: 0
  },
  {
    id: 'checks-and-commercial-papers-cases',
    title: { en: 'Checks and Commercial Papers Cases', ar: 'قضايا الشيكات والأوراق التجارية' },
    description: { en: 'Legal handling of disputes related to checks, promissory notes, and other commercial papers.', ar: 'المعالجة القانونية للنزاعات المتعلقة بالشيكات والسندات لأمر والأوراق التجارية الأخرى.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Civil & Commercial Litigation', ar: 'الدعاوى المدنية والتجارية' },
    icon: 'DollarSign',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'paper_copy', label: { en: 'Copy of Check/Commercial Paper', ar: 'صورة الشيك/الورقة التجارية' }, type: 'file' }],
    usageCount: 0
  },
  {
    id: 'contract-termination-and-contractual-disputes',
    title: { en: 'Contract Termination and Contractual Disputes', ar: 'فسخ العقود والنزاعات التعاقدية' },
    description: { en: 'Managing legal procedures for contract termination and resolving contractual disputes.', ar: 'إدارة الإجراءات القانونية لفسخ العقود وحل النزاعات التعاقدية.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Civil & Commercial Litigation', ar: 'الدعاوى المدنية والتجارية' },
    icon: 'HeartCrack',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'contract_document', label: { en: 'Contract Document', ar: 'وثيقة العقد' }, type: 'file' }],
    usageCount: 0
  },
  // 2) Criminal Litigation
  {
    id: 'representing-defendants-before-investigation',
    title: { en: 'Representing Defendants Before Investigation Authorities', ar: 'تمثيل المتهمين أمام جهات التحقيق' },
    description: { en: 'Provide legal representation for accused individuals during the investigation phase.', ar: 'توفير التمثيل القانوني للمتهمين خلال مرحلة التحقيق.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Criminal Litigation', ar: 'الدعاوى الجنائية' },
    icon: 'UserCheck',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'case_summary', label: { en: 'Case Summary', ar: 'ملخص القضية' }, type: 'textarea' }],
    usageCount: 0
  },
  {
    id: 'preparing-defense-memoranda-criminal',
    title: { en: 'Preparing Defense Memoranda in Criminal Cases', ar: 'إعداد مذكرات الدفاع في القضايا الجنائية' },
    description: { en: 'Drafting comprehensive defense memos for criminal cases.', ar: 'صياغة مذكرات دفاع شاملة للقضايا الجنائية.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Criminal Litigation', ar: 'الدعاوى الجنائية' },
    icon: 'FileText',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'prosecution_file', label: { en: 'Prosecution File', ar: 'ملف الادعاء' }, type: 'file' }],
    usageCount: 0
  },
  {
    id: 'bail-and-release-requests',
    title: { en: 'Bail and Release Requests', ar: 'طلبات الإفراج والكفالة' },
    description: { en: 'Filing and following up on requests for bail and release from custody.', ar: 'تقديم ومتابعة طلبات الإفراج بكفالة والخروج من الحجز.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Criminal Litigation', ar: 'الدعاوى الجنائية' },
    icon: 'KeyRound',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'detention_details', label: { en: 'Detention Details', ar: 'تفاصيل الاحتجاز' }, type: 'textarea' }],
    usageCount: 0
  },
  {
    id: 'appealing-criminal-judgments',
    title: { en: 'Appealing Criminal Judgments', ar: 'اعتراض على الأحكام الجنائية' },
    description: { en: 'Preparing and submitting appeals against criminal court judgments.', ar: 'إعداد وتقديم الطعون ضد الأحكام الصادرة في القضايا الجنائية.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Criminal Litigation', ar: 'الدعاوى الجنائية' },
    icon: 'Gavel',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'judgment_document', label: { en: 'Judgment Document', ar: 'صورة الحكم' }, type: 'file' }],
    usageCount: 0
  },
  {
    id: 'assault-and-threat-crimes',
    title: { en: 'Assault and Threat Crimes', ar: 'جرائم الاعتداء والتهديد' },
    description: { en: 'Legal defense for cases involving assault, battery, and threats.', ar: 'الدفاع القانوني في القضايا المتعلقة بالاعتداء والضرب والتهديد.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Criminal Litigation', ar: 'الدعاوى الجنائية' },
    icon: 'Swords',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'incident_report', label: { en: 'Incident Report', ar: 'تقرير الحادث' }, type: 'textarea' }],
    usageCount: 0
  },
  {
    id: 'financial-crimes-fraud-embezzlement',
    title: { en: 'Financial Crimes (Fraud, Embezzlement, Money Laundering)', ar: 'جرائم الأموال (احتيال – اختلاس – غسل أموال)' },
    description: { en: 'Defense in cases of financial crimes including fraud, embezzlement, and money laundering.', ar: 'الدفاع في قضايا الجرائم المالية بما في ذلك الاحتيال والاختلاس وغسيل الأموال.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Criminal Litigation', ar: 'الدعاوى الجنائية' },
    icon: 'Banknote',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'case_files', label: { en: 'Case Files', ar: 'ملفات القضية' }, type: 'file' }],
    usageCount: 0
  },
  {
    id: 'cybercrime-and-information-crimes',
    title: { en: 'Cybercrime and Information Crimes', ar: 'جرائم الإنترنت والجرائم المعلوماتية' },
    description: { en: 'Legal services for cases related to cybercrime, hacking, and data theft.', ar: 'خدمات قانونية للقضايا المتعلقة بالجرائم الإلكترونية والقرصنة وسرقة البيانات.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Criminal Litigation', ar: 'الدعاوى الجنائية' },
    icon: 'ScanEye',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'digital_evidence', label: { en: 'Digital Evidence Details', ar: 'تفاصيل الأدلة الرقمية' }, type: 'textarea' }],
    usageCount: 0
  },
  {
    id: 'drug-crimes',
    title: { en: 'Drug and Psychotropic Substance Crimes', ar: 'جرائم المخدرات والمؤثرات العقلية' },
    description: { en: 'Defense for individuals accused of crimes related to drugs and psychotropic substances.', ar: 'الدفاع عن الأفراد المتهمين بجرائم تتعلق بالمخدرات والمؤثرات العقلية.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Criminal Litigation', ar: 'الدعاوى الجنائية' },
    icon: 'FlaskConical',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'police_report', label: { en: 'Police Report', ar: 'محضر الشرطة' }, type: 'file' }],
    usageCount: 0
  },
  {
    id: 'family-crimes-domestic-violence',
    title: { en: 'Family Crimes and Domestic Violence', ar: 'الجرائم الأسرية والاعتداءات المنزلية' },
    description: { en: 'Legal representation in cases of domestic violence and other family-related crimes.', ar: 'التمثيل القانوني في قضايا العنف الأسري والجرائم الأخرى المتعلقة بالأسرة.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Criminal Litigation', ar: 'الدعاوى الجنائية' },
    icon: 'UserX',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'case_history', label: { en: 'Case History', ar: 'تاريخ الحالة' }, type: 'textarea' }],
    usageCount: 0
  },
  {
    id: 'monitoring-legal-procedures-compliance',
    title: { en: 'Monitoring Legal Procedures and Compliance', ar: 'مراقبة الإجراءات القانونية ومطابقة الإجراءات' },
    description: { en: 'Ensuring that all legal procedures during investigation and trial are correctly followed.', ar: 'التأكد من اتباع جميع الإجراءات القانونية بشكل صحيح أثناء التحقيق والمحاكمة.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Criminal Litigation', ar: 'الدعاوى الجنائية' },
    icon: 'ClipboardCheck',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'procedure_documents', label: { en: 'Procedure Documents', ar: 'مستندات الإجراءات' }, type: 'file' }],
    usageCount: 0
  },
  // 3) Personal Status Litigation
  {
    id: 'divorce-and-annulment-lawsuits',
    title: { en: 'Divorce and Annulment Lawsuits', ar: 'دعاوى الطلاق والفسخ' },
    description: { en: 'Handling all legal aspects of divorce and marriage annulment cases.', ar: 'معالجة جميع الجوانب القانونية لقضايا الطلاق وفسخ الزواج.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Personal Status Litigation', ar: 'الأحوال الشخصية' },
    icon: 'HeartCrack',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'marriage_details', label: { en: 'Marriage Details', ar: 'تفاصيل الزواج' }, type: 'textarea' }],
    usageCount: 0
  },
  {
    id: 'custody-and-visitation-lawsuits',
    title: { en: 'Custody and Visitation Lawsuits', ar: 'دعاوى الحضانة والرؤية' },
    description: { en: 'Legal representation in child custody and visitation rights disputes.', ar: 'التمثيل القانوني في نزاعات حضانة الأطفال وحقوق الزيارة.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Personal Status Litigation', ar: 'الأحوال الشخصية' },
    icon: 'Users',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'children_information', label: { en: "Children's Information", ar: 'معلومات الأطفال' }, type: 'textarea' }],
    usageCount: 0
  },
  {
    id: 'alimony-and-expense-cases',
    title: { en: 'Alimony and Expense Cases', ar: 'قضايا النفقة والمصاريف' },
    description: { en: 'Filing and defending cases related to spousal and child support (alimony).', ar: 'رفع الدعاوى والدفاع في القضايا المتعلقة بنفقة الزوجة والأطفال.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Personal Status Litigation', ar: 'الأحوال الشخصية' },
    icon: 'DollarSign',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'financial_statement', label: { en: 'Financial Statement', ar: 'بيان مالي' }, type: 'file' }],
    usageCount: 0
  },
  {
    id: 'proof-of-marriage-and-inheritance',
    title: { en: 'Proof of Marriage and Inheritance Cases', ar: 'قضايا إثبات الزواج والورثة' },
    description: { en: 'Legal procedures to formally prove a marriage or determine legal heirs.', ar: 'الإجراءات القانونية لإثبات الزواج رسمياً أو تحديد الورثة الشرعيين.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Personal Status Litigation', ar: 'الأحوال الشخصية' },
    icon: 'FileText',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'supporting_documents', label: { en: 'Supporting Documents', ar: 'المستندات الداعمة' }, type: 'file' }],
    usageCount: 0
  },
  {
    id: 'adhl-lawsuits-and-proof-of-harm',
    title: { en: 'Adhl Lawsuits and Proof of Harm', ar: 'دعاوى العضل وإثبات الضرر' },
    description: { en: 'Cases related to a guardian preventing a woman from marrying (Adhl) and proving resulting harm.', ar: 'القضايا المتعلقة بمنع الولي للمرأة من الزواج (العضل) وإثبات الضرر الناتج.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Personal Status Litigation', ar: 'الأحوال الشخصية' },
    icon: 'Shield',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'case_description', label: { en: 'Case Description', ar: 'وصف الحالة' }, type: 'textarea' }],
    usageCount: 0
  },
  {
    id: 'litigation-in-khul-cases',
    title: { en: "Litigation in Khul' Cases", ar: 'الترافع في قضايا الخلع' },
    description: { en: "Representing clients in Khul' (divorce initiated by the wife) proceedings.", ar: 'تمثيل العملاء في إجراءات الخلع.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Personal Status Litigation', ar: 'الأحوال الشخصية' },
    icon: 'Gavel',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'case_details', label: { en: 'Case Details', ar: 'تفاصيل القضية' }, type: 'textarea' }],
    usageCount: 0
  },
  {
    id: 'enforcement-of-visitation-rulings',
    title: { en: 'Enforcement of Visitation Rulings', ar: 'تنفيذ أحكام الزيارة والرؤية' },
    description: { en: 'Ensuring the enforcement of court orders regarding child visitation rights.', ar: 'ضمان تنفيذ أوامر المحكمة المتعلقة بحقوق زيارة الأطفال.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Personal Status Litigation', ar: 'الأحوال الشخصية' },
    icon: 'Play',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'court_order', label: { en: 'Court Order', ar: 'أمر المحكمة' }, type: 'file' }],
    usageCount: 0
  },
  {
    id: 'disputes-regarding-dowry',
    title: { en: 'Disputes Regarding Dowry and Consolation Payments', ar: 'النزاعات المتعلقة بالمؤخر والمتعة' },
    description: { en: 'Resolving legal disputes concerning deferred dowry and consolation payments after divorce.', ar: 'حل النزاعات القانونية المتعلقة بالمؤخر والمتعة بعد الطلاق.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Personal Status Litigation', ar: 'الأحوال الشخصية' },
    icon: 'Gem',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'marriage_contract', label: { en: 'Marriage Contract', ar: 'عقد الزواج' }, type: 'file' }],
    usageCount: 0
  },
  // 4) Labor Litigation
  {
    id: 'litigation-in-employee-disputes',
    title: { en: 'Litigation in Employee Disputes', ar: 'الترافع في منازعات الموظفين' },
    description: { en: 'Representing either employees or employers in various labor disputes.', ar: 'تمثيل الموظفين أو أصحاب العمل في مختلف المنازعات العمالية.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Labor Litigation', ar: 'قضايا العمل والعمال' },
    icon: 'Briefcase',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'dispute_details', label: { en: 'Dispute Details', ar: 'تفاصيل النزاع' }, type: 'textarea' }],
    usageCount: 0
  },
  {
    id: 'unfair-contract-termination',
    title: { en: 'Unfair Contract Termination', ar: 'إنهاء العقود التعسفي' },
    description: { en: 'Handling cases of wrongful or unfair termination of employment contracts.', ar: 'معالجة قضايا إنهاء عقود العمل بشكل غير قانوني أو تعسفي.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Labor Litigation', ar: 'قضايا العمل والعمال' },
    icon: 'UserX',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'employment_contract', label: { en: 'Employment Contract', ar: 'عقد العمل' }, type: 'file' }],
    usageCount: 0
  },
  {
    id: 'financial-dues-and-salary-cases',
    title: { en: 'Financial Dues and Salary Cases', ar: 'قضايا المستحقات المالية والرواتب' },
    description: { en: 'Claims for unpaid salaries, bonuses, end-of-service benefits, and other financial dues.', ar: 'المطالبة بالرواتب غير المدفوعة، والمكافآت، ومكافآت نهاية الخدمة، وغيرها من المستحقات المالية.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Labor Litigation', ar: 'قضايا العمل والعمال' },
    icon: 'Banknote',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'claim_details', label: { en: 'Claim Details', ar: 'تفاصيل المطالبة' }, type: 'textarea' }],
    usageCount: 0
  },
  {
    id: 'workplace-injuries-and-compensation',
    title: { en: 'Workplace Injuries and Compensation', ar: 'إصابات العمل والتعويضات' },
    description: { en: "Seeking compensation for employees who have suffered injuries at the workplace.", ar: 'المطالبة بالتعويض للموظفين الذين تعرضوا لإصابات في مكان العمل.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Labor Litigation', ar: 'قضايا العمل والعمال' },
    icon: 'PersonStanding',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'medical_reports', label: { en: 'Medical Reports', ar: 'تقارير طبية' }, type: 'file' }],
    usageCount: 0
  },
  {
    id: 'disputes-between-employee-and-employer',
    title: { en: 'Disputes Between Employee and Employer', ar: 'المنازعات بين الموظف وصاحب العمل' },
    description: { en: 'General dispute resolution services covering all aspects of the employer-employee relationship.', ar: 'خدمات حل النزاعات العامة التي تغطي جميع جوانب العلاقة بين الموظف وصاحب العمل.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Labor Litigation', ar: 'قضايا العمل والعمال' },
    icon: 'Swords',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'dispute_description', label: { en: 'Dispute Description', ar: 'وصف النزاع' }, type: 'textarea' }],
    usageCount: 0
  },
  {
    id: 'grievances-against-administrative-decisions-companies',
    title: { en: 'Grievances Against Administrative Decisions in Companies', ar: 'التظلمات ضد القرارات الإدارية في الشركات' },
    description: { en: 'Challenging internal administrative decisions made by a company against an employee.', ar: 'الطعن في القرارات الإدارية الداخلية التي تتخذها الشركة ضد الموظف.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Labor Litigation', ar: 'قضايا العمل والعمال' },
    icon: 'Archive',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'decision_document', label: { en: 'Decision Document', ar: 'مستند القرار' }, type: 'file' }],
    usageCount: 0
  },
  // 5) Real Estate Litigation
  {
    id: 'lease-and-termination-lawsuits',
    title: { en: 'Lease and Termination Lawsuits', ar: 'دعاوى الإيجار والفسخ' },
    description: { en: 'Handling disputes related to lease agreements, including eviction and termination.', ar: 'معالجة النزاعات المتعلقة بعقود الإيجار، بما في ذلك الإخلاء والفسخ.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Real Estate Litigation', ar: 'القضايا العقارية' },
    icon: 'Home',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'lease_agreement', label: { en: 'Lease Agreement', ar: 'عقد الإيجار' }, type: 'file' }],
    usageCount: 0
  },
  {
    id: 'ownership-disputes',
    title: { en: 'Ownership Disputes', ar: 'النزاعات على الملكية' },
    description: { en: 'Resolving disputes over the ownership of real estate property.', ar: 'حل النزاعات حول ملكية العقارات.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Real Estate Litigation', ar: 'القضايا العقارية' },
    icon: 'KeyRound',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'property_documents', label: { en: 'Property Documents', ar: 'مستندات الملكية' }, type: 'file' }],
    usageCount: 0
  },
  {
    id: 'eviction-and-title-deed-cases',
    title: { en: 'Eviction and Title Deed Cases', ar: 'قضايا الإفراغ والصكوك' },
    description: { en: 'Legal actions for eviction and resolving issues with property title deeds.', ar: 'الإجراءات القانونية للإخلاء وحل المشكلات المتعلقة بصكوك الملكية.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Real Estate Litigation', ar: 'القضايا العقارية' },
    icon: 'FileText',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'case_details', label: { en: 'Case Details', ar: 'تفاصيل القضية' }, type: 'textarea' }],
    usageCount: 0
  },
  {
    id: 'removal-of-encroachments',
    title: { en: 'Removal of Encroachments', ar: 'إزالة التعديات' },
    description: { en: 'Legal proceedings to remove unauthorized encroachments on property.', ar: 'الإجراءات القانونية لإزالة التعديات غير المصرح بها على الممتلكات.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Real Estate Litigation', ar: 'القضايا العقارية' },
    icon: 'Trash2',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'property_deed', label: { en: 'Property Deed', ar: 'صك الملكية' }, type: 'file' }],
    usageCount: 0
  },
  {
    id: 'construction-contracting-cases',
    title: { en: 'Construction Contracting Cases', ar: 'قضايا المقاولات الإنشائية' },
    description: { en: 'Disputes arising from construction contracts between owners, contractors, and subcontractors.', ar: 'النزاعات الناشئة عن عقود البناء بين المالكين والمقاولين والمقاولين من الباطن.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Real Estate Litigation', ar: 'القضايا العقارية' },
    icon: 'Gavel',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'construction_contract', label: { en: 'Construction Contract', ar: 'عقد المقاولة' }, type: 'file' }],
    usageCount: 0
  },
  {
    id: 'engineering-disputes-owner-contractor',
    title: { en: 'Engineering Disputes Between Owner and Contractor', ar: 'النزاعات الهندسية بين المالك والمقاول' },
    description: { en: 'Resolving technical and engineering disputes in construction projects.', ar: 'حل النزاعات الفنية والهندسية في مشاريع البناء.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Real Estate Litigation', ar: 'القضايا العقارية' },
    icon: 'Workflow',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'dispute_report', label: { en: 'Engineering Dispute Report', ar: 'تقرير النزاع الهندسي' }, type: 'file' }],
    usageCount: 0
  },
  // 6) Enforcement Litigation
  {
    id: 'enforcement-requests',
    title: { en: 'Enforcement Requests', ar: 'طلبات التنفيذ' },
    description: { en: 'Filing requests to enforce court judgments and other legal instruments.', ar: 'تقديم طلبات لتنفيذ أحكام المحاكم والسندات القانونية الأخرى.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Enforcement Litigation', ar: 'قضايا التنفيذ' },
    icon: 'Play',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'judgment_to_enforce', label: { en: 'Judgment to be Enforced', ar: 'الحكم المراد تنفيذه' }, type: 'file' }],
    usageCount: 0
  },
  {
    id: 'objecting-to-enforcement-decisions',
    title: { en: 'Objecting to Enforcement Decisions', ar: 'الاعتراض على قرارات التنفيذ' },
    description: { en: 'Filing legal objections against enforcement orders and decisions.', ar: 'تقديم اعتراضات قانونية ضد أوامر وقرارات التنفيذ.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Enforcement Litigation', ar: 'قضايا التنفيذ' },
    icon: 'Shield',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'enforcement_order', label: { en: 'Enforcement Order', ar: 'أمر التنفيذ' }, type: 'file' }],
    usageCount: 0
  },
  {
    id: 'debt-and-judgment-collection',
    title: { en: 'Debt and Judgment Collection', ar: 'تحصيل الديون والأحكام' },
    description: { en: 'Legal services for the collection of debts and monetary judgments.', ar: 'خدمات قانونية لتحصيل الديون والأحكام المالية.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Enforcement Litigation', ar: 'قضايا التنفيذ' },
    icon: 'DollarSign',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'debt_information', label: { en: 'Debt Information', ar: 'معلومات الدين' }, type: 'textarea' }],
    usageCount: 0
  },
  {
    id: 'seizure-and-travel-bans',
    title: { en: 'Seizure and Travel Bans', ar: 'الحجز ومنع السفر' },
    description: { en: 'Requesting asset seizures and travel bans against debtors.', ar: 'طلب حجز الأصول وإصدار منع سفر ضد المدينين.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Enforcement Litigation', ar: 'قضايا التنفيذ' },
    icon: 'Plane',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'debtor_details', label: { en: 'Debtor Details', ar: 'بيانات المدين' }, type: 'textarea' }],
    usageCount: 0
  },
  {
    id: 'sale-of-assets-by-public-auction',
    title: { en: 'Sale of Assets by Public Auction', ar: 'بيع الأصول بالمزاد العلني' },
    description: { en: 'Managing the legal process for selling seized assets through public auction.', ar: 'إدارة الإجراءات القانونية لبيع الأصول المحجوزة عن طريق المزاد العلني.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Enforcement Litigation', ar: 'قضايا التنفيذ' },
    icon: 'Gavel',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'asset_list', label: { en: 'List of Assets to be Sold', ar: 'قائمة الأصول المراد بيعها' }, type: 'textarea' }],
    usageCount: 0
  },
  {
    id: 'enforcement-of-foreign-judgments',
    title: { en: 'Enforcement of Foreign Judgments and Rogatory Letters', ar: 'تنفيذ الأحكام الأجنبية والانابات' },
    description: { en: 'Handling the recognition and enforcement of foreign court judgments and rogatory letters.', ar: 'معالجة الاعتراف وتنفيذ أحكام المحاكم الأجنبية والإنابات القضائية.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Enforcement Litigation', ar: 'قضايا التنفيذ' },
    icon: 'Server',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'foreign_judgment', label: { en: 'Foreign Judgment Document', ar: 'وثيقة الحكم الأجنبي' }, type: 'file' }],
    usageCount: 0
  },
  // 7) Arbitration & Dispute Resolution
  {
    id: 'pleading-before-arbitration-panels',
    title: { en: 'Pleading Before Arbitration Panels', ar: 'الترافع أمام هيئات التحكيم' },
    description: { en: 'Representing clients and presenting arguments before arbitration panels.', ar: 'تمثيل العملاء وتقديم الحجج أمام هيئات التحكيم.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Arbitration & Dispute Resolution', ar: 'التحكيم وحل النزاعات' },
    icon: 'Users',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'case_summary', label: { en: 'Case Summary', ar: 'ملخص القضية' }, type: 'textarea' }],
    usageCount: 0
  },
  {
    id: 'drafting-arbitration-memoranda',
    title: { en: 'Drafting Arbitration Memoranda', ar: 'صياغة مذكرات التحكيم' },
    description: { en: 'Preparing and drafting detailed memoranda for arbitration proceedings.', ar: 'إعداد وصياغة مذكرات مفصلة لإجراءات التحكيم.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Arbitration & Dispute Resolution', ar: 'التحكيم وحل النزاعات' },
    icon: 'FileText',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'case_documents', label: { en: 'Case Documents', ar: 'مستندات القضية' }, type: 'file' }],
    usageCount: 0
  },
  {
    id: 'dispute-settlement-by-mediation',
    title: { en: 'Dispute Settlement by Mediation and Conciliation', ar: 'تسوية النزاعات بالوساطة والصلح' },
    description: { en: 'Facilitating dispute resolution through mediation and conciliation processes.', ar: 'تسهيل حل النزاعات من خلال عمليات الوساطة والصلح.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Arbitration & Dispute Resolution', ar: 'التحكيم وحل النزاعات' },
    icon: 'Handshake',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [{ name: 'dispute_details', label: { en: 'Dispute Details', ar: 'تفاصيل النزاع' }, type: 'textarea' }],
    usageCount: 0
  },
  {
    id: 'arbitration-award-enforcement',
    title: { en: 'Enforcement of Arbitration Awards and Annulment Requests', ar: 'تنفيذ أحكام التحكيم وطلبات البطلان' },
    description: { en: 'Executing arbitration awards and handling requests for their annulment.', ar: 'تنفيذ أحكام المحكمين والتعامل مع طلبات إبطالها.' },
    category: ServiceCategory.LitigationAndPleadings,
    subCategory: { en: 'Arbitration & Dispute Resolution', ar: 'التحكيم وحل النزاعات' },
    icon: 'Gavel',
    geminiModel: 'gemini-2.5-flash',
    formInputs: [
      { name: 'arbitration_award', label: { en: 'Arbitration Award Document', ar: 'وثيقة حكم التحكيم' }, type: 'file' },
      { name: 'request_type', label: { en: 'Request Type (Enforcement/Annulment)', ar: 'نوع الطلب (تنفيذ/بطلان)' }, type: 'text' },
    ],
    usageCount: 0
  },
];


export const specializedConsultationsSeedServices: Service[] = [
    // 1) Business & Corporate Advisory
    {
        id: "corporate-formation-consulting",
        title: { en: "Company Formation Consulting", ar: "استشارات تأسيس الشركات" },
        description: { en: "Guidance on establishing companies, selecting legal structures, and completing all required procedures.", ar: "إرشادات حول تأسيس الشركات، واختيار الهياكل القانونية، واستكمال كافة الإجراءات المطلوبة." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Business & Corporate Advisory", ar: "استشارات الأعمال والشركات" },
        icon: "Building2",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "business_idea", label: { en: "Business Idea", ar: "فكرة المشروع" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "business-transformation-licensing",
        title: { en: "Business Transformation and Commercial Licensing", ar: "التحول والترخيص التجاري" },
        description: { en: "Advisory services for business restructuring and obtaining necessary commercial licenses.", ar: "خدمات استشارية لإعادة هيكلة الأعمال والحصول على التراخيص التجارية اللازمة." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Business & Corporate Advisory", ar: "استشارات الأعمال والشركات" },
        icon: "Workflow",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "transformation_goals", label: { en: "Transformation Goals", ar: "أهداف التحول" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "drafting-corporate-legal-structures",
        title: { en: "Drafting Corporate Legal Structures", ar: "صياغة الهياكل القانونية للشركات" },
        description: { en: "Designing and drafting the legal framework and organizational structure for corporations.", ar: "تصميم وصياغة الإطار القانوني والهيكل التنظيمي للشركات." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Business & Corporate Advisory", ar: "استشارات الأعمال والشركات" },
        icon: "Archive",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "company_details", label: { en: "Company Details", ar: "تفاصيل الشركة" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "corporate-governance-compliance",
        title: { en: "Corporate Governance and Compliance", ar: "الحوكمة والامتثال المؤسسي" },
        description: { en: "Ensuring adherence to corporate governance standards and regulatory compliance.", ar: "ضمان الالتزام بمعايير حوكمة الشركات والامتثال التنظيمي." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Business & Corporate Advisory", ar: "استشارات الأعمال والشركات" },
        icon: "ShieldCheck",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "current_policies", label: { en: "Current Policies Document", ar: "مستند السياسات الحالية" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "mergers-acquisitions-consulting",
        title: { en: "Mergers and Acquisitions (M&A) Consulting", ar: "استشارات الاندماج والاستحواذ" },
        description: { en: "Legal guidance through the process of mergers, acquisitions, and corporate takeovers.", ar: "إرشادات قانونية خلال عمليات الاندماج والاستحواذ والسيطرة على الشركات." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Business & Corporate Advisory", ar: "استشارات الأعمال والشركات" },
        icon: "Handshake",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "deal_summary", label: { en: "Deal Summary", ar: "ملخص الصفقة" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "corporate-legal-risk-assessment",
        title: { en: "Corporate Legal Risk Assessment", ar: "تقييم المخاطر القانونية للشركات" },
        description: { en: "Identifying and evaluating potential legal risks and liabilities for businesses.", ar: "تحديد وتقييم المخاطر والمسؤوليات القانونية المحتملة للشركات." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Business & Corporate Advisory", ar: "استشارات الأعمال والشركات" },
        icon: "ScanEye",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "area_of_concern", label: { en: "Area of Concern", ar: "مجال الاهتمام" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "designing-work-policies-regulations",
        title: { en: "Designing Work Policies and Regulations", ar: "تصميم سياسات العمل واللوائح" },
        description: { en: "Creating and implementing internal work policies, procedures, and employee handbooks.", ar: "إنشاء وتنفيذ سياسات وإجراءات العمل الداخلية وكتيبات الموظفين." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Business & Corporate Advisory", ar: "استشارات الأعمال والشركات" },
        icon: "BookOpen",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "company_needs", label: { en: "Company Needs", ar: "احتياجات الشركة" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "anti-corruption-compliance-review",
        title: { en: "Anti-Corruption Compliance Review", ar: "مراجعة الامتثال لمكافحة الفساد" },
        description: { en: "Auditing and reviewing company policies to ensure compliance with anti-corruption laws.", ar: "تدقيق ومراجعة سياسات الشركة لضمان الامتثال لقوانين مكافحة الفساد." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Business & Corporate Advisory", ar: "استشارات الأعمال والشركات" },
        icon: "ShieldCheck",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "compliance_program", label: { en: "Current Compliance Program", ar: "برنامج الامتثال الحالي" }, type: "file" }],
        usageCount: 0
    },
    // 2) Contracts & Agreements Advisory
    {
        id: "contract-review-drafting",
        title: { en: "Contract Review and Drafting", ar: "مراجعة وصياغة العقود" },
        description: { en: "Professional review and drafting of all types of legal contracts to protect your interests.", ar: "مراجعة وصياغة احترافية لجميع أنواع العقود القانونية لحماية مصالحك." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Contracts & Agreements Advisory", ar: "استشارات العقود والاتفاقيات" },
        icon: "FileText",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "contract_file", label: { en: "Contract Document", ar: "مستند العقد" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "contract-risk-analysis",
        title: { en: "Contract Risk Analysis", ar: "تحليل مخاطر العقود" },
        description: { en: "Identifying potential risks, liabilities, and unfavorable clauses in legal agreements.", ar: "تحديد المخاطر والمسؤوليات المحتملة والبنود غير المواتية في الاتفاقيات القانونية." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Contracts & Agreements Advisory", ar: "استشارات العقود والاتفاقيات" },
        icon: "Gem",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "contract_to_analyze", label: { en: "Contract to Analyze", ar: "العقد المراد تحليله" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "preparing-amendment-renewal-addenda",
        title: { en: "Preparing Amendment and Renewal Addenda", ar: "إعداد ملاحق التعديل والتجديد" },
        description: { en: "Drafting addenda to amend, renew, or extend existing contracts.", ar: "صياغة ملاحق لتعديل أو تجديد أو تمديد العقود القائمة." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Contracts & Agreements Advisory", ar: "استشارات العقود والاتفاقيات" },
        icon: "PlusSquare",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "original_contract", label: { en: "Original Contract", ar: "العقد الأصلي" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "drafting-partnership-agreements",
        title: { en: "Drafting Partnership Agreements", ar: "صياغة اتفاقيات الشراكة" },
        description: { en: "Creating comprehensive partnership agreements that outline roles, responsibilities, and profit distribution.", ar: "إنشاء اتفاقيات شراكة شاملة تحدد الأدوار والمسؤوليات وتوزيع الأرباح." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Contracts & Agreements Advisory", ar: "استشارات العقود والاتفاقيات" },
        icon: "Users",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "partnership_terms", label: { en: "Partnership Terms", ar: "شروط الشراكة" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "supply-operation-contracts-consulting",
        title: { en: "Consulting on Supply and Operation Contracts", ar: "الاستشارات حول عقود التوريد والتشغيل" },
        description: { en: "Legal advice on drafting and negotiating supply chain and operational management contracts.", ar: "مشورة قانونية بشأن صياغة والتفاوض على عقود سلسلة التوريد وإدارة العمليات." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Contracts & Agreements Advisory", ar: "استشارات العقود والاتفاقيات" },
        icon: "Factory",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "contract_requirements", label: { en: "Contract Requirements", ar: "متطلبات العقد" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "franchise-agreements",
        title: { en: "Franchise Agreements", ar: "عقود الامتياز التجاري (Franchise)" },
        description: { en: "Advising franchisors and franchisees on the legal aspects of franchise agreements.", ar: "تقديم المشورة لمانحي الامتياز والممنوح لهم بشأن الجوانب القانونية لاتفاقيات الامتياز." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Contracts & Agreements Advisory", ar: "استشارات العقود والاتفاقيات" },
        icon: "Briefcase",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "franchise_details", label: { en: "Franchise Details", ar: "تفاصيل الامتياز" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "professional-services-agreements",
        title: { en: "Professional Services Agreements", ar: "عقود الخدمات المهنية" },
        description: { en: "Drafting and reviewing contracts for consultants, freelancers, and professional service providers.", ar: "صياغة ومراجعة عقود المستشارين والمستقلين ومقدمي الخدمات المهنية." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Contracts & Agreements Advisory", ar: "استشارات العقود والاتفاقيات" },
        icon: "Briefcase",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "service_description", label: { en: "Service Description", ar: "وصف الخدمة" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "construction-engineering-agreements",
        title: { en: "Construction Contracts and Engineering Agreements", ar: "عقود المقاولات والارتباطات الهندسية" },
        description: { en: "Specialized legal services for construction contracts, engineering agreements, and related documents.", ar: "خدمات قانونية متخصصة لعقود البناء والاتفاقيات الهندسية والوثائق ذات الصلة." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Contracts & Agreements Advisory", ar: "استشارات العقود والاتفاقيات" },
        icon: "Gavel",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "project_documents", label: { en: "Project Documents", ar: "مستندات المشروع" }, type: "file" }],
        usageCount: 0
    },
    // 3) Labor & HR Advisory
    {
        id: "interpretation-of-saudi-labor-law",
        title: { en: "Interpretation of Saudi Labor Law", ar: "تفسير نظام العمل السعودي" },
        description: { en: "Providing clear interpretations and guidance on the provisions of the Saudi Labor Law.", ar: "تقديم تفسيرات وإرشادات واضحة حول أحكام نظام العمل السعودي." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Labor & HR Advisory", ar: "الاستشارات العمالية والموارد البشرية" },
        icon: "BookOpen",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "specific_query", label: { en: "Specific Query", ar: "استعلام محدد" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "preparing-work-organization-regulations",
        title: { en: "Preparing Work Organization Regulations", ar: "إعداد لوائح تنظيم العمل" },
        description: { en: "Drafting internal company bylaws and work regulations in compliance with labor laws.", ar: "صياغة اللوائح الداخلية للشركة وأنظمة العمل بما يتوافق مع قوانين العمل." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Labor & HR Advisory", ar: "الاستشارات العمالية والموارد البشرية" },
        icon: "ClipboardCheck",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "company_details", label: { en: "Company Details", ar: "تفاصيل الشركة" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "consulting-on-contract-termination-dismissal",
        title: { en: "Consulting on Contract Termination and Employee Dismissal", ar: "استشارات إنهاء العقود وفصل الموظفين" },
        description: { en: "Legal advice on the correct procedures for terminating employment contracts and dismissing employees.", ar: "مشورة قانونية بشأن الإجراءات الصحيحة لإنهاء عقود العمل وفصل الموظفين." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Labor & HR Advisory", ar: "الاستشارات العمالية والموارد البشرية" },
        icon: "UserX",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "employee_case_details", label: { en: "Employee Case Details", ar: "تفاصيل حالة الموظف" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "calculating-labor-dues-rights",
        title: { en: "Calculating Labor Dues and Rights", ar: "حساب المستحقات والحقوق العمالية" },
        description: { en: "Assistance in calculating end-of-service benefits, leave entitlements, and other employee dues.", ar: "المساعدة في حساب مستحقات نهاية الخدمة واستحقاقات الإجازات وغيرها من مستحقات الموظفين." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Labor & HR Advisory", ar: "الاستشارات العمالية والموارد البشرية" },
        icon: "DollarSign",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "employment_details", label: { en: "Employment Details (Salary, Duration)", ar: "تفاصيل التوظيف (الراتب، المدة)" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "occupational-safety-policies",
        title: { en: "Occupational Safety Policies", ar: "سياسات السلامة المهنية" },
        description: { en: "Developing and reviewing occupational health and safety policies to ensure a safe workplace.", ar: "تطوير ومراجعة سياسات الصحة والسلامة المهنية لضمان بيئة عمل آمنة." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Labor & HR Advisory", ar: "الاستشارات العمالية والموارد البشرية" },
        icon: "Shield",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "workplace_environment_details", label: { en: "Workplace Environment Details", ar: "تفاصيل بيئة العمل" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "combating-workplace-harassment",
        title: { en: "Combating Harassment in the Workplace", ar: "مكافحة التحرش في بيئة العمل" },
        description: { en: "Advising on the creation and implementation of anti-harassment policies and investigation procedures.", ar: "تقديم المشورة بشأن إنشاء وتنفيذ سياسات مكافحة التحرش وإجراءات التحقيق." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Labor & HR Advisory", ar: "الاستشارات العمالية والموارد البشرية" },
        icon: "ShieldCheck",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "policy_requirements", label: { en: "Policy Requirements", ar: "متطلبات السياسة" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "operational-risk-assessment-hr",
        title: { en: "Operational Risk Assessment", ar: "تقييم المخاطر التشغيلية" },
        description: { en: "Identifying and mitigating operational risks related to human resources and labor practices.", ar: "تحديد وتخفيف المخاطر التشغيلية المتعلقة بالموارد البشرية والممارسات العمالية." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Labor & HR Advisory", ar: "الاستشارات العمالية والموارد البشرية" },
        icon: "ScanEye",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "operational_area", label: { en: "Operational Area to Assess", ar: "المجال التشغيلي للتقييم" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "handling-employee-employer-disputes",
        title: { en: "Handling Disputes Between Employees and Employers", ar: "معالجة النزاعات بين الموظفين وأصحاب العمل" },
        description: { en: "Mediation and legal advice to resolve conflicts between employees and management.", ar: "الوساطة والمشورة القانونية لحل النزاعات بين الموظفين والإدارة." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Labor & HR Advisory", ar: "الاستشارات العمالية والموارد البشرية" },
        icon: "Swords",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "dispute_details", label: { en: "Dispute Details", ar: "تفاصيل النزاع" }, type: "textarea" }],
        usageCount: 0
    },
    // 4) Real Estate Advisory
    {
        id: "interpretation-of-real-estate-regulations",
        title: { en: "Interpretation of Real Estate Regulations", ar: "تفسير الأنظمة العقارية" },
        description: { en: "Providing clarity on real estate laws, zoning regulations, and property rights.", ar: "توفير الوضوح بشأن قوانين العقارات وأنظمة تقسيم المناطق وحقوق الملكية." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Real Estate Advisory", ar: "الاستشارات العقارية" },
        icon: "BookOpen",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "regulatory_question", label: { en: "Regulatory Question", ar: "سؤال تنظيمي" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "consulting-on-sale-and-title-transfer",
        title: { en: "Consulting on Sale and Title Transfer", ar: "استشارات البيع والإفراغ" },
        description: { en: "Guidance through the legal process of property sales, purchases, and title deed transfers.", ar: "إرشادات خلال العملية القانونية لمبيعات وشراء العقارات ونقل صكوك الملكية." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Real Estate Advisory", ar: "الاستشارات العقارية" },
        icon: "Home",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "property_documents", label: { en: "Property Documents", ar: "مستندات العقار" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "analysis-of-rental-disputes",
        title: { en: "Analysis of Rental Disputes", ar: "تحليل نزاعات الإيجارات" },
        description: { en: "Legal analysis of landlord-tenant disputes and advice on resolution strategies.", ar: "تحليل قانوني لنزاعات المالك والمستأجر وتقديم المشورة بشأن استراتيجيات الحل." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Real Estate Advisory", ar: "الاستشارات العقارية" },
        icon: "FileText",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "lease_agreement", label: { en: "Lease Agreement", ar: "عقد الإيجار" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "real-estate-development-joint-ownership",
        title: { en: "Real Estate Development and Joint Ownership", ar: "تطوير العقارات والملكية المشتركة" },
        description: { en: "Advising on legal structures for real estate development projects and joint property ownership.", ar: "تقديم المشورة بشأن الهياكل القانونية لمشاريع التطوير العقاري والملكية المشتركة للعقارات." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Real Estate Advisory", ar: "الاستشارات العقارية" },
        icon: "Building2",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "project_details", label: { en: "Project Details", ar: "تفاصيل المشروع" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "real-estate-development-contracts",
        title: { en: "Real Estate Development Contracts", ar: "عقود التطوير العقاري" },
        description: { en: "Drafting and reviewing contracts for real estate development, construction, and financing.", ar: "صياغة ومراجعة عقود التطوير العقاري والبناء والتمويل." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Real Estate Advisory", ar: "الاستشارات العقارية" },
        icon: "FileText",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "project_scope", label: { en: "Project Scope", ar: "نطاق المشروع" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "legal-engineering-consultations",
        title: { en: "Legal Engineering Consultations", ar: "الاستشارات الهندسية القانونية" },
        description: { en: "Providing legal insights on engineering aspects of construction projects and disputes.", ar: "تقديم رؤى قانونية حول الجوانب الهندسية لمشاريع البناء والنزاعات." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Real Estate Advisory", ar: "الاستشارات العقارية" },
        icon: "Workflow",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "engineering_reports", label: { en: "Engineering Reports", ar: "تقارير هندسية" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "risk-assessment-in-construction-projects",
        title: { en: "Risk Assessment in Construction Projects", ar: "تقييم المخاطر في مشاريع البناء" },
        description: { en: "Identifying and advising on legal and regulatory risks in construction projects.", ar: "تحديد وتقديم المشورة بشأن المخاطر القانونية والتنظيمية في مشاريع البناء." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Real Estate Advisory", ar: "الاستشارات العقارية" },
        icon: "Gem",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "project_plan", label: { en: "Project Plan", ar: "خطة المشروع" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "managing-construction-disputes",
        title: { en: "Managing Construction Disputes", ar: "إدارة نزاعات المقاولات" },
        description: { en: "Strategic advice and representation in disputes arising from construction projects.", ar: "مشورة استراتيجية وتمثيل في النزاعات الناشئة عن مشاريع البناء." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Real Estate Advisory", ar: "الاستشارات العقارية" },
        icon: "Gavel",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "dispute_summary", label: { en: "Dispute Summary", ar: "ملخص النزاع" }, type: "textarea" }],
        usageCount: 0
    },
    // 5) Criminal Legal Advisory
    {
        id: "analysis-of-criminal-case-files",
        title: { en: "Analysis of Criminal Case Files", ar: "تحليل ملفات القضايا الجنائية" },
        description: { en: "In-depth review and analysis of criminal case files to develop defense strategies.", ar: "مراجعة وتحليل متعمق لملفات القضايا الجنائية لوضع استراتيجيات الدفاع." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Criminal Legal Advisory", ar: "الاستشارات الجنائية التحليلية" },
        icon: "FileText",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "case_file", label: { en: "Case File", ar: "ملف القضية" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "cybercrime-consulting",
        title: { en: "Cybercrime Consulting", ar: "استشارات الجرائم المعلوماتية" },
        description: { en: "Expert advice on cases involving hacking, data breaches, and other cybercrimes.", ar: "مشورة الخبراء في القضايا المتعلقة بالقرصنة واختراق البيانات والجرائم الإلكترونية الأخرى." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Criminal Legal Advisory", ar: "الاستشارات الجنائية التحليلية" },
        icon: "ScanEye",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "incident_details", label: { en: "Incident Details", ar: "تفاصيل الحادث" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "aml-ctf-consulting",
        title: { en: "Anti-Money Laundering (AML) and Counter-Terrorist Financing (CTF) Consulting", ar: "استشارات غسل الأموال وتمويل الإرهاب" },
        description: { en: "Guidance on compliance with AML/CTF regulations and defense in related cases.", ar: "إرشادات حول الامتثال للوائح مكافحة غسل الأموال وتمويل الإرهاب والدفاع في القضايا ذات الصلة." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Criminal Legal Advisory", ar: "الاستشارات الجنائية التحليلية" },
        icon: "Banknote",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "transaction_details", label: { en: "Transaction Details", ar: "تفاصيل المعاملات" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "evaluation-of-forensic-evidence",
        title: { en: "Evaluation of Forensic Evidence", ar: "تقييم الأدلة الجنائية" },
        description: { en: "Analyzing and challenging the validity and interpretation of forensic evidence.", ar: "تحليل والطعن في صحة وتفسير الأدلة الجنائية." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Criminal Legal Advisory", ar: "الاستشارات الجنائية التحليلية" },
        icon: "Fingerprint",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "evidence_report", label: { en: "Evidence Report", ar: "تقرير الأدلة" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "application-of-legal-procedures-during-investigation",
        title: { en: "Application of Legal Procedures During Investigation", ar: "تطبيق الإجراءات النظامية أثناء التحقيق" },
        description: { en: "Ensuring that the rights of the accused are protected and legal procedures are followed during investigations.", ar: "ضمان حماية حقوق المتهم واتباع الإجراءات القانونية أثناء التحقيقات." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Criminal Legal Advisory", ar: "الاستشارات الجنائية التحليلية" },
        icon: "ClipboardCheck",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "investigation_stage", label: { en: "Investigation Stage & Details", ar: "مرحلة وتفاصيل التحقيق" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "criminal-risk-analysis-for-companies",
        title: { en: "Criminal Risk Analysis for Companies", ar: "تحليل المخاطر الجنائية للشركات" },
        description: { en: "Advising businesses on potential criminal liabilities and developing compliance programs.", ar: "تقديم المشورة للشركات بشأن المسؤوليات الجنائية المحتملة وتطوير برامج الامتثال." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Criminal Legal Advisory", ar: "الاستشارات الجنائية التحليلية" },
        icon: "ShieldCheck",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "business_operations", label: { en: "Business Operations Description", ar: "وصف عمليات الشركة" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "family-criminal-disputes",
        title: { en: "Family Criminal Disputes", ar: "النزاعات الجنائية الأسرية" },
        description: { en: "Legal advice on criminal matters arising within a family context, such as domestic violence.", ar: "مشورة قانونية بشأن المسائل الجنائية التي تنشأ في سياق أسري، مثل العنف المنزلي." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Criminal Legal Advisory", ar: "الاستشارات الجنائية التحليلية" },
        icon: "UserX",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "case_details", label: { en: "Case Details", ar: "تفاصيل القضية" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "consulting-on-money-theft-assault-cases",
        title: { en: "Consulting on Cases of Money, Theft, and Assault", ar: "استشارات قضايا الأموال والسرقة والاعتداء" },
        description: { en: "Expert guidance on defense strategies for cases involving financial crimes, theft, and assault.", ar: "إرشادات الخبراء حول استراتيجيات الدفاع في القضايا المتعلقة بالجرائم المالية والسرقة والاعتداء." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Criminal Legal Advisory", ar: "الاستشارات الجنائية التحليلية" },
        icon: "Swords",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "incident_report", label: { en: "Incident Report", ar: "تقرير الحادث" }, type: "textarea" }],
        usageCount: 0
    },
    // 6) Regulatory & Compliance Advisory
    {
        id: "interpretation-of-government-regulations",
        title: { en: "Interpretation of Government Regulations", ar: "تفسير اللوائح الحكومية" },
        description: { en: "Providing clear explanations of complex government regulations and their impact on individuals and businesses.", ar: "تقديم تفسيرات واضحة للوائح الحكومية المعقدة وتأثيرها على الأفراد والشركات." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Regulatory & Compliance Advisory", ar: "استشارات أنظمة وتقنين ولوائح" },
        icon: "BookOpen",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "regulation_text", label: { en: "Regulation Text/File", ar: "نص/ملف اللائحة" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "consulting-on-modern-saudi-regulations",
        title: { en: "Consulting on Modern Saudi Regulations", ar: "استشارات الأنظمة السعودية الحديثة" },
        description: { en: "Advising on the latest laws and regulations enacted in Saudi Arabia and their implications.", ar: "تقديم المشورة بشأن أحدث القوانين واللوائح الصادرة في المملكة العربية السعودية وتداعياتها." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Regulatory & Compliance Advisory", ar: "استشارات أنظمة وتقنين ولوائح" },
        icon: "Landmark",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "area_of_interest", label: { en: "Area of Interest", ar: "مجال الاهتمام" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "preparing-internal-policies",
        title: { en: "Preparing Internal Policies", ar: "إعداد السياسات الداخلية" },
        description: { en: "Drafting internal corporate policies that align with legal and regulatory requirements.", ar: "صياغة السياسات الداخلية للشركات التي تتماشى مع المتطلبات القانونية والتنظيمية." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Regulatory & Compliance Advisory", ar: "استشارات أنظمة وتقنين ولوائح" },
        icon: "ClipboardCheck",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "policy_requirements", label: { en: "Policy Requirements", ar: "متطلبات السياسة" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "reviewing-compliance-with-new-regulations",
        title: { en: "Reviewing Compliance with New Regulations", ar: "مراجعة الالتزام بالأنظمة الجديدة" },
        description: { en: "Assessing and ensuring that business practices are compliant with newly introduced regulations.", ar: "تقييم وضمان امتثال ممارسات الأعمال للوائح الجديدة." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Regulatory & Compliance Advisory", ar: "استشارات أنظمة وتقنين ولوائح" },
        icon: "ShieldCheck",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "current_policies", label: { en: "Current Policies", ar: "السياسات الحالية" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "consulting-on-government-agency-requirements",
        title: { en: "Consulting on Government Agency Requirements", ar: "الاستشارات المتعلقة بمتطلبات الجهات الحكومية" },
        description: { en: "Guidance on meeting the specific requirements and standards set by various government agencies.", ar: "إرشادات حول تلبية المتطلبات والمعايير المحددة من قبل مختلف الجهات الحكومية." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Regulatory & Compliance Advisory", ar: "استشارات أنظمة وتقنين ولوائح" },
        icon: "Building2",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "agency_and_requirement", label: { en: "Specific Agency and Requirement", ar: "الجهة والمتطلب المحدد" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "auditing-corporate-legal-compliance",
        title: { en: "Auditing Corporate Legal Compliance", ar: "التدقيق في الامتثال القانوني للشركات" },
        description: { en: "Conducting comprehensive audits to verify a company's adherence to all applicable laws.", ar: "إجراء عمليات تدقيق شاملة للتحقق من التزام الشركة بجميع القوانين المعمول بها." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Regulatory & Compliance Advisory", ar: "استشارات أنظمة وتقنين ولوائح" },
        icon: "Server",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "audit_scope", label: { en: "Scope of Audit", ar: "نطاق التدقيق" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "designing-governance-procedures",
        title: { en: "Designing Governance Procedures", ar: "تصميم إجراءات الحوكمة" },
        description: { en: "Establishing clear procedures and frameworks for effective corporate governance.", ar: "وضع إجراءات وأطر واضحة لحوكمة الشركات الفعالة." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Regulatory & Compliance Advisory", ar: "استشارات أنظمة وتقنين ولوائح" },
        icon: "Workflow",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "company_structure", label: { en: "Company Structure", ar: "هيكل الشركة" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "licenses-and-permits-consulting",
        title: { en: "Licenses and Permits Consulting", ar: "استشارات التراخيص والتصاريح" },
        description: { en: "Assistance with the application and renewal processes for all necessary business licenses and permits.", ar: "المساعدة في عمليات التقديم والتجديد لجميع التراخيص والتصاريح التجارية اللازمة." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Regulatory & Compliance Advisory", ar: "استشارات أنظمة وتقنين ولوائح" },
        icon: "FileText",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "required_license", label: { en: "Required License/Permit", ar: "الترخيص/التصريح المطلوب" }, type: "textarea" }],
        usageCount: 0
    },
    // 7) Family Law Advisory
    {
        id: "understanding-new-family-law-systems",
        title: { en: "Understanding New Family Law Systems", ar: "فهم الأنظمة الأسرية الجديدة" },
        description: { en: "Explaining the latest updates and changes in family law and personal status regulations.", ar: "شرح آخر التحديثات والتغييرات في قانون الأسرة وأنظمة الأحوال الشخصية." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Family Law Advisory", ar: "استشارات الأسرة والأحوال الشخصية" },
        icon: "BookOpen",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "specific_question", label: { en: "Specific Question", ar: "سؤال محدد" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "analysis-of-family-disputes-resolution",
        title: { en: "Analysis of Family Disputes and Resolution Methods", ar: "تحليل النزاعات الأسرية وطرق الحل" },
        description: { en: "Assessing family conflicts and advising on the most effective legal and amicable solutions.", ar: "تقييم النزاعات الأسرية وتقديم المشورة بشأن الحلول القانونية والودية الأكثر فعالية." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Family Law Advisory", ar: "استشارات الأسرة والأحوال الشخصية" },
        icon: "HeartCrack",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "dispute_summary", label: { en: "Dispute Summary", ar: "ملخص النزاع" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "estimating-rights-and-expenses",
        title: { en: "Estimating Rights and Expenses", ar: "تقدير الحقوق والنفقات" },
        description: { en: "Calculating and advising on financial rights and obligations, such as alimony and child support.", ar: "حساب وتقديم المشورة بشأن الحقوق والالتزامات المالية، مثل النفقة ودعم الأطفال." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Family Law Advisory", ar: "استشارات الأسرة والأحوال الشخصية" },
        icon: "DollarSign",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "financial_details", label: { en: "Financial Details", ar: "التفاصيل المالية" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "legal-procedures-for-marriage-and-divorce",
        title: { en: "Legal Procedures for Marriage and Divorce", ar: "إجراءات الزواج والطلاق النظامي" },
        description: { en: "Guidance on the legal steps and documentation required for marriage and divorce.", ar: "إرشادات حول الخطوات القانونية والوثائق المطلوبة للزواج والطلاق." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Family Law Advisory", ar: "استشارات الأسرة والأحوال الشخصية" },
        icon: "Gavel",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "situation_description", label: { en: "Situation Description", ar: "وصف الحالة" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "wills-and-inheritance",
        title: { en: "Wills and Inheritance", ar: "الوصايا والمواريث" },
        description: { en: "Advising on the drafting of wills and the legal distribution of inheritance according to Sharia and law.", ar: "تقديم المشورة بشأن صياغة الوصايا والتوزيع القانوني للميراث وفقًا للشريعة والقانون." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Family Law Advisory", ar: "استشارات الأسرة والأحوال الشخصية" },
        icon: "Archive",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "family_structure", label: { en: "Family Structure and Assets", ar: "هيكل الأسرة والأصول" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "disputes-related-to-custody-and-visitation",
        title: { en: "Disputes Related to Custody and Visitation", ar: "النزاعات المرتبطة بالحضانة والرؤية" },
        description: { en: "Legal advice and mediation for disputes concerning child custody and visitation rights.", ar: "مشورة قانونية ووساطة للنزاعات المتعلقة بحضانة الأطفال وحقوق الزيارة." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Family Law Advisory", ar: "استشارات الأسرة والأحوال الشخصية" },
        icon: "Users",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "case_details", label: { en: "Case Details", ar: "تفاصيل القضية" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "family-financial-planning",
        title: { en: "Family Financial Planning", ar: "التخطيط المالي الأسري" },
        description: { en: "Legal advice on financial planning, prenuptial agreements, and asset protection within the family.", ar: "مشورة قانونية بشأن التخطيط المالي واتفاقيات ما قبل الزواج وحماية الأصول داخل الأسرة." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Family Law Advisory", ar: "استشارات الأسرة والأحوال الشخصية" },
        icon: "Banknote",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "financial_goals", label: { en: "Financial Goals", ar: "الأهداف المالية" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "sharia-and-legal-consultations",
        title: { en: "Sharia and Legal Consultations", ar: "الاستشارات الشرعية القانونية" },
        description: { en: "Providing integrated consultations that combine both Sharia principles and legal regulations.", ar: "تقديم استشارات متكاملة تجمع بين المبادئ الشرعية والأنظمة القانونية." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "Family Law Advisory", ar: "استشارات الأسرة والأحوال الشخصية" },
        icon: "Scale",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "query_details", label: { en: "Query Details", ar: "تفاصيل الاستفسار" }, type: "textarea" }],
        usageCount: 0
    },
    // 8) General Legal Analysis
    {
        id: "legal-risk-analysis-for-individuals",
        title: { en: "Legal Risk Analysis for Individuals", ar: "تحليل المخاطر القانونية للأفراد" },
        description: { en: "Assessing potential legal risks in personal matters, such as contracts or financial decisions.", ar: "تقييم المخاطر القانونية المحتملة في الأمور الشخصية، مثل العقود أو القرارات المالية." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "General Legal Analysis", ar: "الاستشارات العامة والتحليل القانوني" },
        icon: "ScanEye",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "personal_situation", label: { en: "Personal Situation", ar: "الوضع الشخصي" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "review-of-official-documents",
        title: { en: "Review of Official Documents", ar: "مراجعة المستندات الرسمية" },
        description: { en: "Legal review of official documents, deeds, and certificates to ensure their validity and accuracy.", ar: "مراجعة قانونية للوثائق والصكوك والشهادات الرسمية لضمان صحتها ودقتها." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "General Legal Analysis", ar: "الاستشارات العامة والتحليل القانوني" },
        icon: "FileText",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "document_to_review", label: { en: "Document to Review", ar: "المستند للمراجعة" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "pre-litigation-legal-assessment",
        title: { en: "Pre-Litigation Legal Assessment", ar: "تقييم الموقف القانوني قبل التقاضي" },
        description: { en: "Analyzing the strengths and weaknesses of a potential legal case before filing a lawsuit.", ar: "تحليل نقاط القوة والضعف في قضية قانونية محتملة قبل رفع دعوى قضائية." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "General Legal Analysis", ar: "الاستشارات العامة والتحليل القانوني" },
        icon: "Gavel",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "case_summary", label: { en: "Case Summary", ar: "ملخص القضية" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "guidance-on-choosing-legal-path",
        title: { en: "Guidance on Choosing the Most Suitable Legal Path", ar: "توجيه لاختيار المسار القانوني الأنسب" },
        description: { en: "Advising clients on the best legal course of action, whether litigation, mediation, or another path.", ar: "تقديم المشورة للعملاء بشأن أفضل مسار قانوني، سواء كان التقاضي أو الوساطة أو مسار آخر." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "General Legal Analysis", ar: "الاستشارات العامة والتحليل القانوني" },
        icon: "Workflow",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "legal_issue", label: { en: "Legal Issue", ar: "المسألة القانونية" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "individual-compliance-consulting",
        title: { en: "Individual Compliance Consulting", ar: "استشارات الامتثال الفردي للأنظمة" },
        description: { en: "Helping individuals understand and comply with relevant laws and regulations.", ar: "مساعدة الأفراد على فهم والامتثال للقوانين واللوائح ذات الصلة." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "General Legal Analysis", ar: "الاستشارات العامة والتحليل القانوني" },
        icon: "UserCheck",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "compliance_question", label: { en: "Compliance Question", ar: "سؤال الامتثال" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "legal-analysis-of-personal-projects",
        title: { en: "Legal Analysis of Personal Projects", ar: "التحليل القانوني للمشاريع الشخصية" },
        description: { en: "Providing legal analysis and risk assessment for personal ventures and projects.", ar: "تقديم تحليل قانوني وتقييم للمخاطر للمشاريع والمشروعات الشخصية." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "General Legal Analysis", ar: "الاستشارات العامة والتحليل القانوني" },
        icon: "FlaskConical",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "project_description", label: { en: "Project Description", ar: "وصف المشروع" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "assessing-success-chances-in-court",
        title: { en: "Assessing Success Chances in Court", ar: "تقييم فرص النجاح في المحاكم" },
        description: { en: "Providing a realistic assessment of the likelihood of success in a potential or ongoing court case.", ar: "تقديم تقييم واقعي لاحتمالية النجاح في قضية محتملة أو قائمة." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "General Legal Analysis", ar: "الاستشارات العامة والتحليل القانوني" },
        icon: "Percent",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "case_details", label: { en: "Case Details", ar: "تفاصيل القضية" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "alternative-dispute-resolution",
        title: { en: "Alternative Dispute Resolution Solutions", ar: "حلول بديلة للنزاعات" },
        description: { en: "Exploring and advising on alternative dispute resolution methods like mediation and arbitration.", ar: "استكشاف وتقديم المشورة بشأن طرق حل النزاعات البديلة مثل الوساطة والتحكيم." },
        category: ServiceCategory.SpecializedConsultations,
        subCategory: { en: "General Legal Analysis", ar: "الاستشارات العامة والتحليل القانوني" },
        icon: "Handshake",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "dispute_details", label: { en: "Details of the Dispute", ar: "تفاصيل النزاع" }, type: "textarea" }],
        usageCount: 0
    },
];

export const investigationsAndCriminalSeedServices: Service[] = [
    // 1) General Criminal Investigations
    {
        id: "police-report-review",
        title: { en: "Review of Police Reports and Initial Reports", ar: "مراجعة محاضر الشرطة والتقارير الأولية" },
        description: { en: "Analyzing official police records and preliminary investigation reports.", ar: "تحليل محاضر الشرطة الرسمية وتقارير التحقيق الأولية." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "General Criminal Investigations", ar: "التحقيقات الجنائية العامة" },
        icon: "FileText",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "police_report_file", label: { en: "Upload Police Report", ar: "رفع محضر الشرطة" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "narrative-data-analysis",
        title: { en: "Analysis of Parties' Narratives and Data", ar: "تحليل روايات الأطراف والمعطيات" },
        description: { en: "Critically analyzing the statements and data provided by all parties involved in a criminal case.", ar: "تحليل نقدي لأقوال وبيانات جميع الأطراف المعنية في قضية جنائية." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "General Criminal Investigations", ar: "التحقيقات الجنائية العامة" },
        icon: "Users",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "case_narratives", label: { en: "Case Narratives and Statements", ar: "روايات وأقوال القضية" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "investigation-procedure-study",
        title: { en: "Study of Legal Investigation Procedures", ar: "دراسة الإجراءات النظامية للتحقيق" },
        description: { en: "Reviewing the investigation process to ensure all legal procedures were correctly followed.", ar: "مراجعة عملية التحقيق للتأكد من اتباع جميع الإجراءات القانونية بشكل صحيح." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "General Criminal Investigations", ar: "التحقيقات الجنائية العامة" },
        icon: "ClipboardCheck",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "investigation_file", label: { en: "Investigation File", ar: "ملف التحقيق" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "criminal-assessment-report-prep",
        title: { en: "Preparing Criminal Situation Assessment Reports", ar: "إعداد تقارير تقييم الموقف الجنائي" },
        description: { en: "Drafting comprehensive reports that assess the overall criminal situation and legal standing.", ar: "صياغة تقارير شاملة تقيم الوضع الجنائي العام والموقف القانوني." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "General Criminal Investigations", ar: "التحقيقات الجنائية العامة" },
        icon: "FileText",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "case_summary", label: { en: "Case Summary", ar: "ملخص القضية" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "pre-referral-defense-strategy",
        title: { en: "Guiding Pre-Referral Defense Strategies", ar: "توجيه استراتيجيات الدفاع قبل الإحالة" },
        description: { en: "Providing strategic guidance for defense before the case is referred to court.", ar: "تقديم توجيه استراتيجي للدفاع قبل إحالة القضية إلى المحكمة." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "General Criminal Investigations", ar: "التحقيقات الجنائية العامة" },
        icon: "Shield",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "investigation_details", label: { en: "Investigation Details", ar: "تفاصيل التحقيق" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "evidence-records-review",
        title: { en: "Review of Evidence and Procedure Records", ar: "مراجعة سجلات الأدلة والإجراءات" },
        description: { en: "Thoroughly reviewing all evidence logs and procedural records for accuracy and compliance.", ar: "مراجعة دقيقة لجميع سجلات الأدلة والسجلات الإجرائية للتأكد من دقتها وامتثالها." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "General Criminal Investigations", ar: "التحقيقات الجنائية العامة" },
        icon: "Archive",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "evidence_log", label: { en: "Evidence Log/Records", ar: "سجل/محاضر الأدلة" }, type: "file" }],
        usageCount: 0
    },
    // 2) Cybercrime & Digital Forensics
    {
        id: "hacking-breach-analysis",
        title: { en: "Analysis of Hacking and Breaching Crimes", ar: "تحليل جرائم الاختراق والهاكرز" },
        description: { en: "Investigating and analyzing cases of unauthorized system access and data breaches.", ar: "التحقيق وتحليل حالات الوصول غير المصرح به للأنظمة واختراق البيانات." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Cybercrime & Digital Forensics", ar: "الجرائم المعلوماتية والرقمية" },
        icon: "ScanEye",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "incident_report", label: { en: "Incident Report", ar: "تقرير الحادثة" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "cybercrime-tracking-fraud-extortion",
        title: { en: "Tracking Cybercrimes (Fraud, Extortion, Threats)", ar: "تتبع الجرائم الإلكترونية (احتيال – ابتزاز – تهديد)" },
        description: { en: "Services to trace and investigate various forms of cybercrime including online fraud, extortion, and threats.", ar: "خدمات لتتبع والتحقيق في أشكال مختلفة من الجرائم الإلكترونية بما في ذلك الاحتيال عبر الإنترنت والابتزاز والتهديدات." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Cybercrime & Digital Forensics", ar: "الجرائم المعلوماتية والرقمية" },
        icon: "Server",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "crime_details", label: { en: "Cybercrime Details and Evidence", ar: "تفاصيل الجريمة الإلكترونية والأدلة" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "social-media-crime-investigation",
        title: { en: "Investigation of Social Media Crimes", ar: "التحقيق في جرائم شبكات التواصل" },
        description: { en: "Investigating criminal activities conducted through social media platforms.", ar: "التحقيق في الأنشطة الإجرامية التي تتم عبر منصات التواصل الاجتماعي." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Cybercrime & Digital Forensics", ar: "الجرائم المعلوماتية والرقمية" },
        icon: "Users",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "social_media_evidence", label: { en: "Social Media Evidence (links, screenshots)", ar: "أدلة من وسائل التواصل الاجتماعي (روابط، لقطات شاشة)" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "digital-evidence-review",
        title: { en: "Review of Digital Evidence (Photos, Recordings, Messages)", ar: "مراجعة الأدلة الرقمية (صور – تسجيلات – رسائل)" },
        description: { en: "Examining and verifying the authenticity and relevance of digital evidence.", ar: "فحص والتحقق من صحة وأهمية الأدلة الرقمية." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Cybercrime & Digital Forensics", ar: "الجرائم المعلوماتية والرقمية" },
        icon: "FileText",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "digital_evidence_files", label: { en: "Upload Digital Evidence Files", ar: "رفع ملفات الأدلة الرقمية" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "digital-forgery-detection",
        title: { en: "Detecting Digital Manipulation and Electronic Forgery", ar: "كشف التلاعب الرقمي والتزوير الإلكتروني" },
        description: { en: "Using technical methods to detect manipulation in digital documents, images, and other media.", ar: "استخدام أساليب تقنية للكشف عن التلاعب في المستندات الرقمية والصور والوسائط الأخرى." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Cybercrime & Digital Forensics", ar: "الجرائم المعلوماتية والرقمية" },
        icon: "Fingerprint",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "file_to_analyze", label: { en: "File to Analyze for Forgery", ar: "الملف المراد تحليله للكشف عن التزوير" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "server-log-analysis",
        title: { en: "Analysis of Server and Device Logs", ar: "تحليل سجلات الخوادم والأجهزة" },
        description: { en: "Forensic analysis of server, network, and device logs to trace digital footprints.", ar: "تحليل جنائي لسجلات الخوادم والشبكات والأجهزة لتتبع الآثار الرقمية." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Cybercrime & Digital Forensics", ar: "الجرائم المعلوماتية والرقمية" },
        icon: "Server",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "log_files", label: { en: "Upload Log Files", ar: "رفع ملفات السجلات" }, type: "file" }],
        usageCount: 0
    },
    // 3) Financial & Economic Crimes
    {
        id: "financial-fraud-investigation",
        title: { en: "Investigation of Financial Fraud Crimes", ar: "التحقيق في جرائم الاحتيال المالي" },
        description: { en: "Investigating cases of financial fraud, scams, and deceptive financial practices.", ar: "التحقيق في قضايا الاحتيال المالي والخداع والممارسات المالية المضللة." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Financial & Economic Crimes", ar: "التحقيقات المالية وجرائم الأموال" },
        icon: "Banknote",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "fraud_details", label: { en: "Details of the Financial Fraud", ar: "تفاصيل الاحتيال المالي" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "embezzlement-tracking",
        title: { en: "Tracking Embezzlement and Breach of Trust", ar: "تتبع عمليات الاختلاس وسوء الأمانة" },
        description: { en: "Investigating and tracing funds in cases of embezzlement and breach of fiduciary duty.", ar: "التحقيق وتتبع الأموال في قضايا الاختلاس وخيانة الأمانة." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Financial & Economic Crimes", ar: "التحقيقات المالية وجرائم الأموال" },
        icon: "DollarSign",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "case_documents", label: { en: "Case Documents", ar: "مستندات القضية" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "money-laundering-analysis",
        title: { en: "Analysis of Money Laundering Cases", ar: "تحليل قضايا غسل الأموال" },
        description: { en: "Analyzing complex financial transactions to identify and prove money laundering activities.", ar: "تحليل المعاملات المالية المعقدة لتحديد وإثبات أنشطة غسيل الأموال." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Financial & Economic Crimes", ar: "التحقيقات المالية وجرائم الأموال" },
        icon: "Recycle",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "transaction_records", label: { en: "Transaction Records", ar: "سجلات المعاملات" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "bank-record-review",
        title: { en: "Review of Bank Records and Transactions", ar: "مراجعة السجلات البنكية والمعاملات" },
        description: { en: "Forensic review of bank statements and financial records to uncover illicit activities.", ar: "مراجعة جنائية لكشوف الحسابات المصرفية والسجلات المالية للكشف عن الأنشطة غير المشروعة." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Financial & Economic Crimes", ar: "التحقيقات المالية وجرائم الأموال" },
        icon: "Landmark",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "bank_statements", label: { en: "Upload Bank Statements", ar: "رفع كشوف الحسابات البنكية" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "corporate-economic-crime-risk",
        title: { en: "Assessing Economic Crime Risks for Companies", ar: "تقييم مخاطر الجرائم الاقتصادية للشركات" },
        description: { en: "Evaluating a company's vulnerability to economic crimes and recommending preventive measures.", ar: "تقييم مدى تعرض الشركة للجرائم الاقتصادية والتوصية بالتدابير الوقائية." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Financial & Economic Crimes", ar: "التحقيقات المالية وجرائم الأموال" },
        icon: "ShieldCheck",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "company_policies", label: { en: "Company Financial Policies", ar: "السياسات المالية للشركة" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "bribery-corruption-investigation",
        title: { en: "Investigation of Bribery and Corruption Cases", ar: "التحقيق في قضايا الرشوة والفساد" },
        description: { en: "Conducting investigations into allegations of bribery, corruption, and illicit payments.", ar: "إجراء تحقيقات في ادعاءات الرشوة والفساد والمدفوعات غير المشروعة." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Financial & Economic Crimes", ar: "التحقيقات المالية وجرائم الأموال" },
        icon: "Handshake",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "case_allegations", label: { en: "Case Allegations and Evidence", ar: "ادعاءات القضية وأدلتها" }, type: "textarea" }],
        usageCount: 0
    },
    // 4) Family & Domestic Crimes
    {
        id: "domestic-violence-investigation",
        title: { en: "Investigation of Domestic Violence Cases", ar: "التحقيق في قضايا العنف الأسري" },
        description: { en: "Handling investigations related to domestic violence with sensitivity and thoroughness.", ar: "التعامل مع التحقيقات المتعلقة بالعنف الأسري بحساسية ودقة." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Family & Domestic Crimes", ar: "الجرائم الأسرية والاعتداءات" },
        icon: "Home",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "incident_details", label: { en: "Incident Details", ar: "تفاصيل الحادثة" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "assault-evidence-analysis",
        title: { en: "Analysis of Verbal and Physical Assault Evidence", ar: "تحليل أدلة الاعتداء اللفظي والجسدي" },
        description: { en: "Analyzing evidence such as medical reports, photos, and witness statements in assault cases.", ar: "تحليل الأدلة مثل التقارير الطبية والصور وأقوال الشهود في قضايا الاعتداء." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Family & Domestic Crimes", ar: "الجرائم الأسرية والاعتداءات" },
        icon: "FileText",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "evidence_files", label: { en: "Upload Evidence Files", ar: "رفع ملفات الأدلة" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "family-harassment-consulting",
        title: { en: "Consulting on Family Harassment and Extortion Cases", ar: "استشارات قضايا التحرش والابتزاز الأسري" },
        description: { en: "Providing legal advice and investigation services for harassment and extortion within families.", ar: "تقديم المشورة القانونية وخدمات التحقيق في حالات التحرش والابتزاز داخل الأسر." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Family & Domestic Crimes", ar: "الجرائم الأسرية والاعتداءات" },
        icon: "Shield",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "case_description", label: { en: "Case Description", ar: "وصف القضية" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "child-abuse-claim-assessment",
        title: { en: "Assessing Allegations of Child Abuse", ar: "تقييم ادعاءات التعنيف ضد الأطفال" },
        description: { en: "Careful assessment of evidence and claims in cases of alleged child abuse.", ar: "تقييم دقيق للأدلة والادعاءات في قضايا الاعتداء المزعوم على الأطفال." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Family & Domestic Crimes", ar: "الجرائم الأسرية والاعتداءات" },
        icon: "HeartCrack",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "case_reports", label: { en: "Case Reports and Documents", ar: "تقارير ووثائق الحالة" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "spousal-criminal-assessment",
        title: { en: "Assessing the Criminal Situation Between Spouses", ar: "تقدير الموقف الجنائي بين الأزواج" },
        description: { en: "Analyzing the legal and criminal aspects of disputes between spouses.", ar: "تحليل الجوانب القانونية والجنائية للنزاعات بين الأزواج." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Family & Domestic Crimes", ar: "الجرائم الأسرية والاعتداءات" },
        icon: "Users",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "dispute_details", label: { en: "Dispute Details", ar: "تفاصيل النزاع" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "intra-family-threat-investigation",
        title: { en: "Investigating Intra-Family Threats and Extortion", ar: "التحقيق في قضايا التهديد والابتزاز داخل الأسرة" },
        description: { en: "Investigating threats and extortion occurring between family members.", ar: "التحقيق في التهديدات والابتزاز التي تحدث بين أفراد الأسرة." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Family & Domestic Crimes", ar: "الجرائم الأسرية والاعتداءات" },
        icon: "UserX",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "threat_evidence", label: { en: "Evidence of Threats/Extortion", ar: "أدلة التهديد/الابتزاز" }, type: "textarea" }],
        usageCount: 0
    },
    // 5) Crimes Against Persons
    {
        id: "assault-battery-case-analysis",
        title: { en: "Analysis of Assault and Battery Cases", ar: "تحليل قضايا الضرب والإيذاء" },
        description: { en: "In-depth analysis of evidence in assault and battery cases to build a strong defense or prosecution.", ar: "تحليل متعمق للأدلة في قضايا الضرب والإيذاء لبناء دفاع أو ادعاء قوي." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Crimes Against Persons", ar: "جرائم النفس والاعتداءات الجسدية" },
        icon: "Swords",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "case_files", label: { en: "Case Files and Reports", ar: "ملفات وتقارير القضية" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "forensic-medical-report-review",
        title: { en: "Review of Forensic Medical Reports", ar: "مراجعة التقارير الطبية الشرعية" },
        description: { en: "Expert review of forensic medical reports to interpret findings and assess their legal implications.", ar: "مراجعة خبير للتقارير الطبية الشرعية لتفسير النتائج وتقييم آثارها القانونية." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Crimes Against Persons", ar: "جرائم النفس والاعتداءات الجسدية" },
        icon: "HeartHandshake",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "medical_report", label: { en: "Upload Forensic Medical Report", ar: "رفع التقرير الطبي الشرعي" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "homicide-evidence-assessment",
        title: { en: "Evidence Assessment in Homicide and Attempted Homicide Cases", ar: "تقييم الأدلة في قضايا القتل والشروع" },
        description: { en: "Comprehensive evaluation of all evidence in homicide and attempted homicide investigations.", ar: "تقييم شامل لجميع الأدلة في تحقيقات القتل والشروع في القتل." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Crimes Against Persons", ar: "جرائم النفس والاعتداءات الجسدية" },
        icon: "Gavel",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "case_evidence_summary", label: { en: "Case Evidence Summary", ar: "ملخص أدلة القضية" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "self-defense-case-investigation",
        title: { en: "Investigation of Self-Defense Cases", ar: "التحقيق في حالات الدفاع الشرعي" },
        description: { en: "Investigating the circumstances and evidence to validate or challenge claims of self-defense.", ar: "التحقيق في الظروف والأدلة لإثبات أو الطعن في ادعاءات الدفاع عن النفس." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Crimes Against Persons", ar: "جرائم النفس والاعتداءات الجسدية" },
        icon: "Shield",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "incident_description", label: { en: "Incident Description", ar: "وصف الحادثة" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "threat-assault-consulting",
        title: { en: "Consulting on Threat and Assault Cases", ar: "استشارات في قضايا التهديد والاعتداء" },
        description: { en: "Providing legal advice and strategic consulting for cases involving threats and physical assault.", ar: "تقديم المشورة القانونية والاستشارات الاستراتيجية للقضايا التي تنطوي على تهديدات واعتداء جسدي." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Crimes Against Persons", ar: "جرائم النفس والاعتداءات الجسدية" },
        icon: "UserCheck",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "case_details", label: { en: "Case Details", ar: "تفاصيل القضية" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "fingerprint-dna-analysis",
        title: { en: "Analysis of Fingerprints and DNA", ar: "تحليل البصمات والحمض النووي" },
        description: { en: "Specialized analysis of fingerprint and DNA evidence for identification and case linkage.", ar: "تحليل متخصص لأدلة البصمات والحمض النووي لتحديد الهوية وربط القضايا." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Crimes Against Persons", ar: "جرائم النفس والاعتداءات الجسدية" },
        icon: "Fingerprint",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "lab_report", label: { en: "Lab Report on Fingerprints/DNA", ar: "تقرير المختبر عن البصمات/الحمض النووي" }, type: "file" }],
        usageCount: 0
    },
    // 6) Property & Theft Crimes
    {
        id: "theft-crime-investigation",
        title: { en: "Investigation of Theft Crimes", ar: "التحقيق في جرائم السرقة" },
        description: { en: "Conducting investigations into theft, burglary, and robbery cases.", ar: "إجراء تحقيقات في قضايا السرقة والسطو والنهب." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Property & Theft Crimes", ar: "جرائم الممتلكات والسرقات" },
        icon: "KeyRound",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "police_report", label: { en: "Police Report", ar: "محضر الشرطة" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "unlawful-entry-evidence-review",
        title: { en: "Review of Evidence of Unlawful Entry", ar: "مراجعة أدلة دخول الأماكن الخاصة" },
        description: { en: "Analyzing evidence related to trespassing and unlawful entry into private properties.", ar: "تحليل الأدلة المتعلقة بالتعدي على ممتلكات الغير والدخول غير المشروع إلى الممتلكات الخاصة." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Property & Theft Crimes", ar: "جرائم الممتلكات والسرقات" },
        icon: "Home",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "evidence_photos", label: { en: "Photos/Videos of Entry Point", ar: "صور/فيديوهات لنقطة الدخول" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "vandalism-crime-analysis",
        title: { en: "Analysis of Vandalism and Destruction Crimes", ar: "تحليل جرائم التخريب والإتلاف" },
        description: { en: "Investigating and analyzing cases of property damage, vandalism, and destruction.", ar: "التحقيق وتحليل قضايا إتلاف الممتلكات والتخريب." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Property & Theft Crimes", ar: "جرائم الممتلكات والسرقات" },
        icon: "Trash2",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "damage_report", label: { en: "Damage Report and Photos", ar: "تقرير الأضرار والصور" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "stolen-property-valuation",
        title: { en: "Stolen Property Valuation Reports", ar: "تقارير تقييم الممتلكات المسروقة" },
        description: { en: "Preparing reports to accurately value stolen property for legal and insurance purposes.", ar: "إعداد تقارير لتقييم الممتلكات المسروقة بدقة للأغراض القانونية والتأمينية." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Property & Theft Crimes", ar: "جرائم الممتلكات والسرقات" },
        icon: "DollarSign",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "list_of_stolen_items", label: { en: "List of Stolen Items with Proof of Value", ar: "قائمة بالممتلكات المسروقة مع إثبات القيمة" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "criminal-pattern-research",
        title: { en: "Researching Criminal Patterns", ar: "البحث عن الأنماط الإجرامية" },
        description: { en: "Analyzing data to identify patterns and trends in property crimes to aid in investigations.", ar: "تحليل البيانات لتحديد الأنماط والاتجاهات في جرائم الممتلكات للمساعدة في التحقيقات." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Property & Theft Crimes", ar: "جرائم الممتلكات والسرقات" },
        icon: "Search",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "case_data", label: { en: "Multiple Case Data Points", ar: "نقاط بيانات قضايا متعددة" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "vandalism-looting-follow-up",
        title: { en: "Following up on Vandalism and Looting Cases", ar: "متابعة القضايا المرتبطة بالتخريب والنهب" },
        description: { en: "Providing ongoing investigation and legal support for cases of large-scale vandalism and looting.", ar: "توفير تحقيق مستمر ودعم قانوني لقضايا التخريب والنهب واسعة النطاق." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Property & Theft Crimes", ar: "جرائم الممتلكات والسرقات" },
        icon: "ClipboardCheck",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "initial_report", label: { en: "Initial Incident Report", ar: "تقرير الحادث الأولي" }, type: "file" }],
        usageCount: 0
    },
    // 7) Corporate & Institutional Investigations
    {
        id: "corporate-risk-investigation",
        title: { en: "Corporate Risk Investigations", ar: "تحقيقات مخاطر الشركات" },
        description: { en: "Investigating potential legal and operational risks within a corporate environment.", ar: "التحقيق في المخاطر القانونية والتشغيلية المحتملة داخل بيئة الشركة." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Corporate & Institutional Investigations", ar: "التحقيقات المهنية والمؤسسية" },
        icon: "Building2",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "area_of_concern", label: { en: "Area of Concern", ar: "مجال الاهتمام" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "institutional-fraud-detection",
        title: { en: "Detecting Fraud in Institutions", ar: "كشف عمليات الغش في المؤسسات" },
        description: { en: "Specialized services to uncover fraudulent activities within organizations.", ar: "خدمات متخصصة للكشف عن الأنشطة الاحتيالية داخل المؤسسات." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Corporate & Institutional Investigations", ar: "التحقيقات المهنية والمؤسسية" },
        icon: "Banknote",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "suspicious_activity_report", label: { en: "Suspicious Activity Report", ar: "تقرير النشاط المشبوه" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "employee-dispute-analysis-corp",
        title: { en: "Analysis of Employee Disputes", ar: "تحليل النزاعات بين الموظفين" },
        description: { en: "Investigating and analyzing internal disputes between employees to prevent escalation.", ar: "التحقيق وتحليل النزاعات الداخلية بين الموظفين لمنع تفاقمها." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Corporate & Institutional Investigations", ar: "التحقيقات المهنية والمؤسسية" },
        icon: "Users",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "dispute_summary", label: { en: "Summary of the Dispute", ar: "ملخص النزاع" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "public-office-misconduct-review",
        title: { en: "Review of Public Office Misconduct", ar: "مراجعة تجاوزات الوظيفة العامة" },
        description: { en: "Investigating allegations of misconduct, abuse of power, or ethics violations by public officials.", ar: "التحقيق في ادعاءات سوء السلوك أو إساءة استخدام السلطة أو انتهاكات الأخلاق من قبل الموظفين العموميين." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Corporate & Institutional Investigations", ar: "التحقيقات المهنية والمؤسسية" },
        icon: "Landmark",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "allegation_details", label: { en: "Details of the Allegation", ar: "تفاصيل الادعاء" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "abuse-of-power-investigation",
        title: { en: "Investigation of Abuse of Power", ar: "التحقيق في إساءة استخدام السلطة" },
        description: { en: "Conducting formal investigations into claims of abuse of authority in the workplace.", ar: "إجراء تحقيقات رسمية في ادعاءات إساءة استخدام السلطة في مكان العمل." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Corporate & Institutional Investigations", ar: "التحقيقات المهنية والمؤسسية" },
        icon: "ShieldCheck",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "incident_report", label: { en: "Incident Report", ar: "تقرير الحادثة" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "legal-reputation-risk-assessment",
        title: { en: "Assessing Legal Reputational Risks for an Institution", ar: "تقييم مخاطر السمعة القانونية للمؤسسة" },
        description: { en: "Evaluating potential legal issues that could harm an institution's public reputation.", ar: "تقييم القضايا القانونية المحتملة التي يمكن أن تضر بسمعة المؤسسة العامة." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Corporate & Institutional Investigations", ar: "التحقيقات المهنية والمؤسسية" },
        icon: "ScanEye",
        geminiModel: "gemini-2.5-flash",
        // FIX: Added missing formInputs and usageCount properties to complete the Service object.
        formInputs: [{ name: "institutional_details", label: { en: "Institution Details and Area of Concern", ar: "تفاصيل المؤسسة ومجال الاهتمام" }, type: "textarea" }],
        usageCount: 0
    },
    // 8) Forensic Analysis & Evidence Services
    {
        id: "biological-forensic-evidence-analysis",
        title: { en: "Analysis of Biological and Forensic Evidence", ar: "تحليل الأدلة الحيوية والجنائية" },
        description: { en: "Examining biological samples and other forensic evidence collected from a crime scene.", ar: "فحص العينات البيولوجية والأدلة الجنائية الأخرى التي تم جمعها من مسرح الجريمة." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Forensic Analysis & Evidence Services", ar: "الطب الشرعي والأدلة الفنية" },
        icon: "FlaskConical",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "evidence_description", label: { en: "Description of Evidence", ar: "وصف الدليل" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "forensic-medicine-report-study",
        title: { en: "Study of Forensic Medicine Reports", ar: "دراسة تقارير الطب الشرعي" },
        description: { en: "In-depth study and legal interpretation of reports from forensic medical examiners.", ar: "دراسة متعمقة وتفسير قانوني لتقارير الأطباء الشرعيين." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Forensic Analysis & Evidence Services", ar: "الطب الشرعي والأدلة الفنية" },
        icon: "FileText",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "forensic_report", label: { en: "Upload Forensic Medicine Report", ar: "رفع تقرير الطب الشرعي" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "audio-video-examination",
        title: { en: "Examination of Audio and Video Recordings", ar: "فحص التسجيلات الصوتية والمرئية" },
        description: { en: "Forensic examination of audio and video evidence to verify authenticity and content.", ar: "فحص جنائي للأدلة الصوتية والمرئية للتحقق من الأصالة والمحتوى." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Forensic Analysis & Evidence Services", ar: "الطب الشرعي والأدلة الفنية" },
        icon: "Play",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "media_file", label: { en: "Upload Audio/Video File", ar: "رفع ملف الصوت/الفيديو" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "fingerprint-dna-analysis",
        title: { en: "Analysis of Fingerprints and DNA", ar: "تحليل البصمات والحمض النووي" },
        description: { en: "Specialized analysis of fingerprint and DNA evidence for identification and case linkage.", ar: "تحليل متخصص لأدلة البصمات والحمض النووي لتحديد الهوية وربط القضايا." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Forensic Analysis & Evidence Services", ar: "الطب الشرعي والأدلة الفنية" },
        icon: "Fingerprint",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "lab_report", label: { en: "Lab Report on Fingerprints/DNA", ar: "تقرير المختبر عن البصمات/الحمض النووي" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "crime-lab-report-review",
        title: { en: "Review of Crime Lab Reports", ar: "مراجعة تقارير المختبر الجنائي" },
        description: { en: "Legal and technical review of reports issued by criminal laboratories.", ar: "مراجعة قانونية وتقنية للتقارير الصادرة عن المختبرات الجنائية." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Forensic Analysis & Evidence Services", ar: "الطب الشرعي والأدلة الفنية" },
        icon: "FlaskConical",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "lab_report_file", label: { en: "Upload Crime Lab Report", ar: "رفع تقرير المختبر الجنائي" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "sample-evidence-comparison",
        title: { en: "Comparison of Samples and Evidence", ar: "مقارنة العينات والأدلة" },
        description: { en: "Comparing forensic samples with evidence to establish connections or discrepancies.", ar: "مقارنة العينات الجنائية بالأدلة لإثبات الروابط أو التناقضات." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Forensic Analysis & Evidence Services", ar: "الطب الشرعي والأدلة الفنية" },
        icon: "Scale",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "comparison_request", label: { en: "Describe the Samples to be Compared", ar: "وصف العينات المراد مقارنتها" }, type: "textarea" }],
        usageCount: 0
    },
    {
        id: "chain-of-custody-audit",
        title: { en: "Auditing the Chain of Custody", ar: "تدقيق مسار الأدلة Chain of Custody" },
        description: { en: "Verifying and auditing the chain of custody for all evidence to ensure its integrity.", ar: "التحقق وتدقيق سلسلة عهدة جميع الأدلة لضمان سلامتها." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Forensic Analysis & Evidence Services", ar: "الطب الشرعي والأدلة الفنية" },
        icon: "ClipboardCheck",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "custody_documents", label: { en: "Upload Chain of Custody Documents", ar: "رفع مستندات سلسلة العهدة" }, type: "file" }],
        usageCount: 0
    },
    {
        id: "expert-witness-report-preparation",
        title: { en: "Expert Witness Report Preparation for Court", ar: "إعداد تقرير خبير جنائي للمحكمة" },
        description: { en: "Preparing and drafting expert witness reports based on forensic findings for submission to the court.", ar: "إعداد وصياغة تقارير الخبراء بناءً على النتائج الجنائية لتقديمها إلى المحكمة." },
        category: ServiceCategory.InvestigationsAndCriminal,
        subCategory: { en: "Forensic Analysis & Evidence Services", ar: "الطب الشرعي والأدلة الفنية" },
        icon: "Gavel",
        geminiModel: "gemini-2.5-flash",
        formInputs: [{ name: "forensic_findings", label: { en: "Forensic Findings/Summary", ar: "النتائج/ملخص التحليل الجنائي" }, type: "textarea" }],
        usageCount: 0
    },
];

export const corporateAndComplianceSeedServices: Service[] = [
    // 1) Company Establishment & Structuring
    {
      id: 'company-incorporation-saudi-arabia',
      title: { en: 'Company Incorporation in Saudi Arabia', ar: 'تأسيس الشركات في المملكة العربية السعودية' },
      description: { en: 'Comprehensive service for establishing all types of companies, from choosing the legal form to final registration.', ar: 'خدمة شاملة لتأسيس كافة أنواع الشركات، بدءًا من اختيار الشكل القانوني وحتى التسجيل النهائي.' },
      category: ServiceCategory.CorporateAndCompliance,
      subCategory: { en: 'Company Establishment & Structuring', ar: 'تأسيس وهيكلة الشركات' },
      icon: 'Building2',
      geminiModel: 'gemini-2.5-flash',
      formInputs: [
        { name: 'company_name_proposal', label: { en: 'Proposed Company Name', ar: 'اسم الشركة المقترح' }, type: 'text' },
        { name: 'business_activity', label: { en: 'Business Activity', ar: 'النشاط التجاري' }, type: 'textarea' }
      ],
      usageCount: 0
    },
    {
      id: 'draft-articles-of-association',
      title: { en: 'Drafting Articles of Association', ar: 'صياغة عقد التأسيس' },
      description: { en: 'Drafting and reviewing the articles of association and bylaws to align with the company\'s goals and legal requirements.', ar: 'صياغة ومراجعة عقد التأسيس والنظام الأساسي للشركة بما يتوافق مع أهدافها والمتطلبات القانونية.' },
      category: ServiceCategory.CorporateAndCompliance,
      subCategory: { en: 'Company Establishment & Structuring', ar: 'تأسيس وهيكلة الشركات' },
      icon: 'FileText',
      geminiModel: 'gemini-2.5-flash',
      formInputs: [
        { name: 'company_type', label: { en: 'Company Type', ar: 'نوع الشركة' }, type: 'text' },
        { name: 'shareholder_details', label: { en: 'Shareholder Details', ar: 'تفاصيل الشركاء' }, type: 'textarea' }
      ],
      usageCount: 0
    },
    // 2) Legal Compliance & Governance
    {
      id: 'legal-compliance-audit',
      title: { en: 'Legal Compliance Audit', ar: 'تدقيق الامتثال القانوني' },
      description: { en: 'Reviewing company operations to ensure full compliance with Saudi laws and regulations.', ar: 'مراجعة عمليات الشركة لضمان الامتثال الكامل للقوانين واللوائح السعودية.' },
      category: ServiceCategory.CorporateAndCompliance,
      subCategory: { en: 'Legal Compliance & Governance', ar: 'الامتثال القانوني والحوكمة' },
      icon: 'ShieldCheck',
      geminiModel: 'gemini-3-pro-preview',
      formInputs: [
        { name: 'company_documents', label: { en: 'Upload Company Policies & Procedures', ar: 'رفع سياسات وإجراءات الشركة' }, type: 'file' }
      ],
      usageCount: 0
    },
    {
      id: 'board-meeting-minutes',
      title: { en: 'Drafting Board of Directors and Shareholder Meeting Minutes', ar: 'صياغة محاضر اجتماعات مجلس الإدارة والجمعيات' },
      description: { en: 'Preparing legally sound minutes for board and shareholder meetings.', ar: 'إعداد محاضر سليمة قانونياً لاجتماعات مجلس الإدارة وجمعيات الشركاء.' },
      category: ServiceCategory.CorporateAndCompliance,
      subCategory: { en: 'Legal Compliance & Governance', ar: 'الامتثال القانوني والحوكمة' },
      icon: 'ClipboardCheck',
      geminiModel: 'gemini-2.5-flash',
      formInputs: [
        { name: 'meeting_date', label: { en: 'Meeting Date', ar: 'تاريخ الاجتماع' }, type: 'date' },
        { name: 'meeting_agenda', label: { en: 'Meeting Agenda/Topics', ar: 'جدول أعمال/مواضيع الاجتماع' }, type: 'textarea' }
      ],
      usageCount: 0
    },
    // 3) Intellectual Property
    {
      id: 'trademark-registration',
      title: { en: 'Trademark Registration', ar: 'تسجيل العلامات التجارية' },
      description: { en: 'Protecting your brand by registering trademarks locally and internationally.', ar: 'حماية علامتك التجارية من خلال تسجيلها محلياً ودولياً.' },
      category: ServiceCategory.CorporateAndCompliance,
      // FIX: Added missing 'ar' translation for subCategory.
      subCategory: { en: 'Intellectual Property', ar: 'الملكية الفكرية' },
      icon: 'Tag',
      geminiModel: 'gemini-2.5-flash',
      formInputs: [
        { name: 'trademark_name', label: { en: 'Trademark Name', ar: 'اسم العلامة التجارية' }, type: 'text' },
        { name: 'trademark_logo', label: { en: 'Trademark Logo (if any)', ar: 'شعار العلامة التجارية (إن وجد)' }, type: 'file' }
      ],
      usageCount: 0
    },
    {
      id: 'copyright-protection',
      title: { en: 'Copyright Protection', ar: 'حماية حقوق المؤلف' },
      description: { en: 'Advisory on copyright law, registration of works, and handling infringement cases.', ar: 'استشارات حول قانون حقوق المؤلف، تسجيل المصنفات، والتعامل مع حالات التعدي.' },
      category: ServiceCategory.CorporateAndCompliance,
      subCategory: { en: 'Intellectual Property', ar: 'الملكية الفكرية' },
      icon: 'Copyright',
      geminiModel: 'gemini-2.5-flash',
      formInputs: [
        { name: 'work_description', label: { en: 'Description of the Work', ar: 'وصف المصنف' }, type: 'textarea' }
      ],
      usageCount: 0
    },
    // 4) Contracts & Agreements
    {
      id: 'draft-commercial-contracts',
      title: { en: 'Drafting Commercial Contracts', ar: 'صياغة العقود التجارية' },
      description: { en: 'Drafting various commercial contracts such as supply, distribution, and agency agreements.', ar: 'صياغة مختلف العقود التجارية كاتفاقيات التوريد والتوزيع والوكالة.' },
      category: ServiceCategory.CorporateAndCompliance,
      subCategory: { en: 'Contracts & Agreements', ar: 'العقود والاتفاقيات' },
      icon: 'Handshake',
      geminiModel: 'gemini-2.5-flash',
      formInputs: [
        { name: 'contract_type', label: { en: 'Type of Contract', ar: 'نوع العقد' }, type: 'text' },
        { name: 'key_terms', label: { en: 'Key Terms and Conditions', ar: 'الشروط والأحكام الرئيسية' }, type: 'textarea' }
      ],
      usageCount: 0
    }
];
