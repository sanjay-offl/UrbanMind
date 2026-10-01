/**
 * Interface localization dictionary for English, Tamil, and Hindi.
 * Built for 100% UI coverage across Navigation, Dashboard, Grievances,
 * Map, Trends, Reports, Submit, Upload, Settings, and Data Sources.
 */

export type SupportedLocale = 'en' | 'ta' | 'hi' | 'bn';

export const UI_STRINGS = {
  en: {
    appName: 'UrbanMind',
    tagline: 'From Citizen Voice to National Priorities',
    // 10 Canonical Page Names
    dashboard: 'Dashboard',
    grievances: 'Grievances',
    submit: 'Submit',
    upload: 'Upload',
    map: 'Ward Map',
    trends: 'Trends',
    assistant: 'AI Assistant',
    reports: 'Reports',
    dataSources: 'Data Sources',
    settings: 'Settings',

    // Geography & Hierarchy
    allWards: 'All Wards',
    allDistricts: 'All Districts',
    allStates: 'All States',
    nationalScope: 'National (India)',

    // KPIs & Metrics
    totalComplaints: 'Total Complaints',
    openGrievances: 'Open Grievances',
    criticalIssues: 'Critical Issues',
    avgPriorityScore: 'Avg Priority Score',
    highUrgency: 'High Urgency / Pending',
    currentDataset: 'Current dataset',

    // Section Titles & Subtitles
    overviewTitle: 'Civic Intelligence Overview',
    overviewSubtitle:
      'Understand citizen demand, infrastructure gaps and priority issues across your selected geography.',
    categoryChartTitle: 'Complaints by Sector',
    priorityTrendTitle: 'Priority Distribution Trend',
    topCriticalTitle: 'Top Critical Grievances',
    geographicSummaryTitle: 'Geographic Infrastructure Summary',
    recentActivityTitle: 'Recent Intake Activity',

    // Table Headers
    idHeader: 'Complaint ID',
    timestampHeader: 'Timestamp',
    stateHeader: 'State',
    districtHeader: 'District',
    cityHeader: 'City',
    wardHeader: 'Ward',
    languageHeader: 'Language',
    categoryHeader: 'Category',
    descriptionHeader: 'Description',
    severityHeader: 'Severity',
    urgencyHeader: 'Urgency',
    scoreHeader: 'Score',
    priorityHeader: 'Priority',
    statusHeader: 'Status',
    sourceHeader: 'Source',
    actionHeader: 'Actions',

    // States & Feedback
    loading: 'Loading civic intelligence...',
    error: 'Unable to load civic intelligence',
    retry: 'Retry',
    empty: 'No grievance data available for this scope.',

    // Data Source Tags
    publicData: 'Public data',
    syntheticData: 'Synthetic demo data',
    derivedAnalytics: 'Derived UrbanMind analytics',
    aiInterpretation: 'AI generated interpretation',

    // Filters & Search
    searchPlaceholder: 'Search complaints by keyword, ward, or sector...',
    filterCategory: 'Category',
    filterPriority: 'Priority',
    filterStatus: 'Status',
    filterLanguage: 'Language',
    moreFilters: 'More filters',

    // Priority Levels
    critical: 'Critical',
    high: 'High',
    moderate: 'Moderate',
    low: 'Low',
    notScored: 'Not scored',

    // Statuses
    statusOpen: 'Open',
    statusInProgress: 'In Progress',
    statusResolved: 'Resolved',
    statusClosed: 'Closed',

    // Actions & Form
    submitButton: 'Submit Grievance',
    generateReport: 'Generate Report',
    downloadPdf: 'Download PDF',
    recordVoice: 'Record Voice Note',
    stopRecording: 'Stop Recording',
    transcribing: 'Processing voice audio...',
    selectLanguage: 'Language',
    signOut: 'Sign out',
  },
  ta: {
    appName: 'அர்பன்மைண்ட் (UrbanMind)',
    tagline: 'குடிமக்கள் குரலிலிருந்து தேசிய முன்னுரிமைகள் வரை',
    // 10 Canonical Page Names
    dashboard: 'முகப்பு பலகை',
    grievances: 'குறைதீர்ப்புகள்',
    submit: 'புகார் பதிவு',
    upload: 'CSV பதிவேற்றம்',
    map: 'வார்டு வரைபடம்',
    trends: 'போக்குகள்',
    assistant: 'AI உதவியாளர்',
    reports: 'அறிக்கைகள்',
    dataSources: 'தரவு மூலங்கள்',
    settings: 'அமைப்புகள்',

    // Geography & Hierarchy
    allWards: 'அனைத்து வார்டுகள்',
    allDistricts: 'அனைத்து மாவட்டங்கள்',
    allStates: 'அனைத்து மாநிலங்கள்',
    nationalScope: 'தேசிய அளவில் (இந்தியா)',

    // KPIs & Metrics
    totalComplaints: 'மொத்த புகார்கள்',
    openGrievances: 'நிலுவையில் உள்ளவை',
    criticalIssues: 'முக்கிய அவசர சிக்கல்கள்',
    avgPriorityScore: 'சராசரி முன்னுரிமை எண்',
    highUrgency: 'அதி அவசரம் / நிலுவை',
    currentDataset: 'தற்போதைய தரவுத்தொகுப்பு',

    // Section Titles & Subtitles
    overviewTitle: 'குடிமை நுண்ணறிவு மேலோட்டம்',
    overviewSubtitle:
      'தேர்ந்தெடுக்கப்பட்ட புவியியல் பகுதியில் குடிமக்களின் தேவைகள் மற்றும் உட்கட்டமைப்பு இடைவெளிகளைப் புரிந்து கொள்ளுங்கள்.',
    categoryChartTitle: 'துறை வாரியான புகார்கள்',
    priorityTrendTitle: 'முன்னுரிமை போக்கு',
    topCriticalTitle: 'முக்கிய அவசர சிக்கல்கள்',
    geographicSummaryTitle: 'புவியியல் உள்கட்டமைப்பு சுருக்கம்',
    recentActivityTitle: 'சமீபத்திய நடவடிக்கைகள்',

    // Table Headers
    idHeader: 'புகார் எண்',
    timestampHeader: 'நேரம்',
    stateHeader: 'மாநிலம்',
    districtHeader: 'மாவட்டம்',
    cityHeader: 'நகரம்',
    wardHeader: 'வார்டு',
    languageHeader: 'மொழி',
    categoryHeader: 'துறை',
    descriptionHeader: 'விளக்கம்',
    severityHeader: 'தீவிரம்',
    urgencyHeader: 'அவசரம்',
    scoreHeader: 'மதிப்பெண்',
    priorityHeader: 'முன்னுரிமை',
    statusHeader: 'நிலை',
    sourceHeader: 'மூலம்',
    actionHeader: 'செயல்',

    // States & Feedback
    loading: 'குடிமைத் தகவல்கள் ஏற்றப்படுகின்றன...',
    error: 'குடிமைத் தகவல்களை ஏற்றுவதில் பிழை',
    retry: 'மீண்டும் முயற்சிக்க',
    empty: 'இந்த எல்லைக்கு குறைதீர்ப்பு தகவல்கள் இல்லை.',

    // Data Source Tags
    publicData: 'பொதுத் தரவு',
    syntheticData: 'மாதிரி டெமோ தரவு',
    derivedAnalytics: 'கணக்கிடப்பட்ட பகுப்பாய்வு',
    aiInterpretation: 'AI பகுப்பாய்வு விளக்கம்',

    // Filters & Search
    searchPlaceholder: 'வார்த்தை, வார்டு அல்லது துறை மூலம் தேடவும்...',
    filterCategory: 'துறை',
    filterPriority: 'முன்னுரிமை',
    filterStatus: 'நிலை',
    filterLanguage: 'மொழி',
    moreFilters: 'கூடுதல் வடிகட்டிகள்',

    // Priority Levels
    critical: 'மிக அவசரம்',
    high: 'அதிகம்',
    moderate: 'நடுத்தரம்',
    low: 'குறைவு',
    notScored: 'மதிப்பிடப்படவில்லை',

    // Statuses
    statusOpen: 'திறந்தவை',
    statusInProgress: 'செயல்பாட்டில்',
    statusResolved: 'தீர்க்கப்பட்டது',
    statusClosed: 'மூடப்பட்டது',

    // Actions & Form
    submitButton: 'புகாரை அனுப்பவும்',
    generateReport: 'அறிக்கை உருவாக்குக',
    downloadPdf: 'PDF பதிவிறக்குக',
    recordVoice: 'குரல் பதிவு செய்க',
    stopRecording: 'பதிவை நிறுத்துக',
    transcribing: 'குரல் பதிவு செயலாக்கப்படுகிறது...',
    selectLanguage: 'மொழி',
    signOut: 'வெளியேறுக',
  },
  hi: {
    appName: 'अर्बनमाइंड (UrbanMind)',
    tagline: 'नागरिकों की आवाज़ से राष्ट्रीय प्राथमिकताओं तक',
    // 10 Canonical Page Names
    dashboard: 'डैशबोर्ड',
    grievances: 'शिकायतें',
    submit: 'शिकायत दर्ज करें',
    upload: 'CSV अपलोड',
    map: 'वार्ड मानचित्र',
    trends: 'रुझान',
    assistant: 'एआई सहायक',
    reports: 'रिपोर्ट',
    dataSources: 'डेटा स्रोत',
    settings: 'सेटिंग्स',

    // Geography & Hierarchy
    allWards: 'सभी वार्ड',
    allDistricts: 'सभी ज़िले',
    allStates: 'सभी राज्य',
    nationalScope: 'राष्ट्रीय स्तर (भारत)',

    // KPIs & Metrics
    totalComplaints: 'कुल शिकायतें',
    openGrievances: 'लंबित शिकायतें',
    criticalIssues: 'अति-गंभीर मुद्दे',
    avgPriorityScore: 'औसत प्राथमिकता स्कोर',
    highUrgency: 'अति-अतिआवश्यक / लंबित',
    currentDataset: 'वर्तमान डेटासेट',

    // Section Titles & Subtitles
    overviewTitle: 'नागरिक बुद्धिमत्ता अवलोकन',
    overviewSubtitle:
      'चयनित भौगोलिक क्षेत्र में नागरिकों की मांग, बुनियादी ढांचे की कमी और प्राथमिकता वाले मुद्दों को समझें।',
    categoryChartTitle: 'क्षेत्रवार शिकायतें',
    priorityTrendTitle: 'प्राथमिकता वितरण रुझान',
    topCriticalTitle: 'शीर्ष अति-गंभीर शिकायतें',
    geographicSummaryTitle: 'भौगोलिक बुनियादी ढांचा सारांश',
    recentActivityTitle: 'हाल की गतिविधियां',

    // Table Headers
    idHeader: 'शिकायत संख्या',
    timestampHeader: 'समय',
    stateHeader: 'राज्य',
    districtHeader: 'ज़िला',
    cityHeader: 'शहर',
    wardHeader: 'वार्ड',
    languageHeader: 'भाषा',
    categoryHeader: 'श्रेणी',
    descriptionHeader: 'विवरण',
    severityHeader: 'तीव्रता',
    urgencyHeader: 'अतिआवश्यकता',
    scoreHeader: 'स्कोर',
    priorityHeader: 'प्राथमिकता',
    statusHeader: 'स्थिति',
    sourceHeader: 'स्रोत',
    actionHeader: 'कार्रवाई',

    // States & Feedback
    loading: 'नागरिक बुद्धिमत्ता लोड हो रही है...',
    error: 'नागरिक डेटा लोड करने में असमर्थ',
    retry: 'पुनः प्रयास करें',
    empty: 'इस क्षेत्र के लिए कोई शिकायत उपलब्ध नहीं है।',

    // Data Source Tags
    publicData: 'सार्वजनिक डेटा',
    syntheticData: 'सिंथेटिक डेमो डेटा',
    derivedAnalytics: 'अर्बनमाइंड व्युत्पन्न विश्लेषण',
    aiInterpretation: 'एआई-जनरेटेड व्याख्या',

    // Filters & Search
    searchPlaceholder: 'कीवर्ड, वार्ड या क्षेत्र द्वारा खोजें...',
    filterCategory: 'श्रेणी',
    filterPriority: 'प्राथमिकता',
    filterStatus: 'स्थिति',
    filterLanguage: 'भाषा',
    moreFilters: 'अतिरिक्त फ़िल्टर',

    // Priority Levels
    critical: 'अति-गंभीर',
    high: 'उच्च',
    moderate: 'मध्यम',
    low: 'सामान्य',
    notScored: 'मूल्यांकन नहीं हुआ',

    // Statuses
    statusOpen: 'लंबित',
    statusInProgress: 'प्रगति पर',
    statusResolved: 'हल किया गया',
    statusClosed: 'बंद',

    // Actions & Form
    submitButton: 'शिकायत भेजें',
    generateReport: 'रिपोर्ट बनाएं',
    downloadPdf: 'PDF डाउनलोड करें',
    recordVoice: 'वॉइस नोट रिकॉर्ड करें',
    stopRecording: 'रिकॉर्डिंग रोकें',
    transcribing: 'आवाज़ का विश्लेषण जारी है...',
    selectLanguage: 'भाषा',
    signOut: 'लॉग आउट',
  },
  bn: {
    appName: 'আরবানমাইন্ড (UrbanMind)',
    tagline: 'নাগরিকের কণ্ঠস্বর থেকে জাতীয় অগ্রাধিকার পর্যন্ত',
    // 10 Canonical Page Names
    dashboard: 'ড্যাশবোর্ড',
    grievances: 'অভিযোগসমূহ',
    submit: 'অভিযোগ দায়ের',
    upload: 'CSV আপলোড',
    map: 'ওয়ার্ড মানচিত্র',
    trends: 'প্রবণতা',
    assistant: 'এআই সহায়ক',
    reports: 'প্রতিবেদন',
    dataSources: 'উপাত্তের উৎস',
    settings: 'সেটিংস',

    // Geography & Hierarchy
    allWards: 'সকল ওয়ার্ড',
    allDistricts: 'সকল জেলা',
    allStates: 'সকল রাজ্য',
    nationalScope: 'জাতীয় ক্ষেত্র (ভারত)',

    // KPIs & Metrics
    totalComplaints: 'মোট অভিযোগ',
    openGrievances: 'অমীমাংসিত অভিযোগ',
    criticalIssues: 'জরুরি সমস্যা',
    avgPriorityScore: 'গড় অগ্রাধিকার স্কোর',
    highUrgency: 'উচ্চ অগ্রাধিকার / মুলতবি',
    currentDataset: 'বর্তমান উপাত্ত',

    // Section Titles & Subtitles
    overviewTitle: 'নাগরিক বুদ্ধিমত্তা পর্যালোচনা',
    overviewSubtitle:
      'আপনার নির্বাচিত ভৌগোলিক অঞ্চলের নাগরিক চাহিদা, অবকাঠামোগত ঘাটতি এবং অগ্রাধিকারমূলক সমস্যাগুলি পর্যালোচনা করুন।',
    categoryChartTitle: 'বিভাগ অনুযায়ী অভিযোগ',
    priorityTrendTitle: 'অগ্রাধিকার বণ্টন প্রবণতা',
    topCriticalTitle: 'শীর্ষ জরুরি অভিযোগ',
    geographicSummaryTitle: 'ভৌগোলিক অবকাঠামো সারাংশ',
    recentActivityTitle: 'সাম্প্রতিক কার্যক্রম',

    // Table Headers
    idHeader: 'অভিযোগ নম্বর',
    timestampHeader: 'সময়',
    stateHeader: 'রাজ্য',
    districtHeader: 'জেলা',
    cityHeader: 'শহর',
    wardHeader: 'ওয়ার্ড',
    languageHeader: 'ভাষা',
    categoryHeader: 'বিভাগ',
    descriptionHeader: 'বিবরণ',
    severityHeader: 'তীব্রতা',
    urgencyHeader: 'জরুরিতা',
    scoreHeader: 'স্কোর',
    priorityHeader: 'অগ্রাধিকার',
    statusHeader: 'অবস্থা',
    sourceHeader: 'উৎস',
    actionHeader: 'পদক্ষেপ',

    // States & Feedback
    loading: 'নাগরিক বুদ্ধিমত্তা লোড হচ্ছে...',
    error: 'নাগরিক উপাত্ত লোড করতে ব্যর্থ',
    retry: 'পুনরায় চেষ্টা করুন',
    empty: 'এই অঞ্চলের জন্য কোনো অভিযোগ পাওয়া যায়নি।',

    // Data Source Tags
    publicData: 'সরকারি উপাত্ত',
    syntheticData: 'নমুনা উপাত্ত',
    derivedAnalytics: 'আরবানমাইন্ড বিশ্লেষণ',
    aiInterpretation: 'এআই বিশ্লেষণ',

    // Filters & Search
    searchPlaceholder: 'কীওয়ার্ড, ওয়ার্ড বা বিভাগ দিয়ে খুঁজুন...',
    filterCategory: 'বিভাগ',
    filterPriority: 'অগ্রাধিকার',
    filterStatus: 'অবস্থা',
    filterLanguage: 'ভাষা',
    moreFilters: 'আরও ফিল্টার',

    // Priority Levels
    critical: 'জরুরি',
    high: 'উচ্চ',
    moderate: 'মাঝারি',
    low: 'নিম্ন',
    notScored: 'অমূল্যায়িত',

    // Statuses
    statusOpen: 'উন্মুক্ত',
    statusInProgress: 'প্রক্রিয়াধীন',
    statusResolved: 'সমাধানকৃত',
    statusClosed: 'বন্ধ',

    // Actions & Form
    submitButton: 'অভিযোগ জমা দিন',
    generateReport: 'প্রতিবেদন তৈরি করুন',
    downloadPdf: 'PDF ডাউনলোড করুন',
    recordVoice: 'ভয়েস রেকর্ড করুন',
    stopRecording: 'রেকর্ডিং বন্ধ করুন',
    transcribing: 'ভয়েস প্রক্রিয়াকরণ হচ্ছে...',
    selectLanguage: 'ভাষা',
    signOut: 'লগ আউট',
  },
} as const;

export type TranslationKey = keyof typeof UI_STRINGS['en'];

export function getTranslation(locale: SupportedLocale, key: TranslationKey): string {
  const table = UI_STRINGS[locale] ?? UI_STRINGS.en;
  return (table as Record<string, string>)[key] ?? UI_STRINGS.en[key] ?? key;
}
