/**
 * Multilingual Test Set for UrbanMind.
 * Exactly 3 realistic sample complaints per language across the 8 required Indic languages:
 * English, Tamil, Hindi, Telugu, Malayalam, Kannada, Bengali, Marathi.
 * All entries are synthetic, verified for cultural & civic authenticity, and labeled as Synthetic demo data.
 */

export interface MultilingualSample {
  id: string;
  language: string;
  languageCode: string;
  text: string;
  expectedSector: 'water' | 'roads' | 'sanitation' | 'electricity' | 'health' | 'education' | 'public_safety' | 'agriculture' | 'transport';
  expectedCategory: string;
  district: string;
  state: string;
}

export const MULTILINGUAL_TEST_SET: MultilingualSample[] = [
  // ── 1. English ──
  {
    id: 'en-1',
    language: 'English',
    languageCode: 'en',
    text: 'Main drinking water pipeline burst near Ward 4 market. Contaminated sewer water mixing with supply for 48 hours.',
    expectedSector: 'water',
    expectedCategory: 'Water Supply',
    district: 'Chennai',
    state: 'Tamil Nadu',
  },
  {
    id: 'en-2',
    language: 'English',
    languageCode: 'en',
    text: 'Massive potholes on national highway feeder road near industrial estate causing multiple two-wheeler accidents.',
    expectedSector: 'roads',
    expectedCategory: 'Road Infrastructure',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
  },
  {
    id: 'en-3',
    language: 'English',
    languageCode: 'en',
    text: 'Distribution transformer burnt down in residential colony. Complete power blackout affecting 250 families in peak heat.',
    expectedSector: 'electricity',
    expectedCategory: 'Electricity',
    district: 'Hyderabad',
    state: 'Telangana',
  },

  // ── 2. Tamil (தமிழ்) ──
  {
    id: 'ta-1',
    language: 'Tamil',
    languageCode: 'ta',
    text: 'எங்கள் வார்டில் கடந்த நான்கு நாட்களாக குடிநீர் விநியோகம் முற்றிலும் நின்றுவிட்டது. கைக்குழந்தைகள் உள்ள குடும்பங்கள் மிகவும் தவிக்கின்றனர்.',
    expectedSector: 'water',
    expectedCategory: 'Water Supply',
    district: 'Madurai',
    state: 'Tamil Nadu',
  },
  {
    id: 'ta-2',
    language: 'Tamil',
    languageCode: 'ta',
    text: 'பள்ளிக்குச் செல்லும் பிரதான சாலையில் பெரிய பள்ளங்கள் உள்ளன. மழைக்காலத்தில் தண்ணீர் தேங்கி விபத்துகள் ஏற்படுகின்றன.',
    expectedSector: 'roads',
    expectedCategory: 'Road Infrastructure',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
  },
  {
    id: 'ta-3',
    language: 'Tamil',
    languageCode: 'ta',
    text: 'தெருவிளக்குகள் எரியாததால் இரவு நேரங்களில் பெண்கள் நடந்து செல்ல அச்சப்படுகின்றனர். உடனடியாக சரிசெய்ய வேண்டும்.',
    expectedSector: 'public_safety',
    expectedCategory: 'Public Safety',
    district: 'Tiruchirappalli',
    state: 'Tamil Nadu',
  },

  // ── 3. Hindi (हिन्दी) ──
  {
    id: 'hi-1',
    language: 'Hindi',
    languageCode: 'hi',
    text: 'मोहल्ले में मुख्य नाली बंद होने से गंदा पानी सड़कों पर बह रहा है। बदबू और मच्छरों से डेंगू का खतरा बढ़ गया है।',
    expectedSector: 'sanitation',
    expectedCategory: 'Sanitation & Waste',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
  },
  {
    id: 'hi-2',
    language: 'Hindi',
    languageCode: 'hi',
    text: 'प्राथमिक स्वास्थ्य केंद्र में पिछले दो सप्ताह से कोई डॉक्टर उपलब्ध नहीं है और आवश्यक दवाइयों की कमी है।',
    expectedSector: 'health',
    expectedCategory: 'Health & Medical',
    district: 'Patna',
    state: 'Bihar',
  },
  {
    id: 'hi-3',
    language: 'Hindi',
    languageCode: 'hi',
    text: 'गांव की मुख्य सड़क पर बना पुलिया टूट गया है, जिससे किसानों का अनाज मंडी तक पहुंचना बंद हो गया है।',
    expectedSector: 'roads',
    expectedCategory: 'Road Infrastructure',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
  },

  // ── 4. Telugu (తెలుగు) ──
  {
    id: 'te-1',
    language: 'Telugu',
    languageCode: 'te',
    text: 'గ్రామంలో తాగునీటి బోరు మోటారు కాలిపోయింది. గత వారం రోజులుగా మహిళలు తాగునీటి కోసం తీవ్ర ఇబ్బందులు పడుతున్నారు.',
    expectedSector: 'water',
    expectedCategory: 'Water Supply',
    district: 'Visakhapatnam',
    state: 'Andhra Pradesh',
  },
  {
    id: 'te-2',
    language: 'Telugu',
    languageCode: 'te',
    text: 'మా వార్డులో చెత్త సేకరణ వాహనం పది రోజులుగా రావడం లేదు. రోడ్లపై చెత్త పేరుకుపోయి దుర్గంధం వస్తోంది.',
    expectedSector: 'sanitation',
    expectedCategory: 'Sanitation & Waste',
    district: 'Vijayawada',
    state: 'Andhra Pradesh',
  },
  {
    id: 'te-3',
    language: 'Telugu',
    languageCode: 'te',
    text: 'ప్రధాన రహదారిపై వీధి దీపాలు వెలగడం లేదు. రాత్రి వేళల్లో చోరీలు మరియు ప్రమాదాలు జరుగుతున్నాయి.',
    expectedSector: 'public_safety',
    expectedCategory: 'Public Safety',
    district: 'Guntur',
    state: 'Andhra Pradesh',
  },

  // ── 5. Malayalam (മലയാളം) ──
  {
    id: 'ml-1',
    language: 'Malayalam',
    languageCode: 'ml',
    text: 'ഞങ്ങളുടെ പഞ്ചായത്തിൽ ശുദ്ധജല പൈപ്പ് പൊട്ടി കുടിവെള്ള വിതരണം മുടങ്ങിയിട്ട് മൂന്ന് ദിവസമായി. അടിയന്തര പരിഹാരം വേണം.',
    expectedSector: 'water',
    expectedCategory: 'Water Supply',
    district: 'Ernakulam',
    state: 'Kerala',
  },
  {
    id: 'ml-2',
    language: 'Malayalam',
    languageCode: 'ml',
    text: 'തീരദേശ റോഡിലെ കലുങ്ക് തകർന്ന് യാത്രാ തടസ്സം നേരിടുന്നു. സ്കൂൾ ബസുകൾക്ക് ഇതുവഴി പോകാൻ സാധിക്കുന്നില്ല.',
    expectedSector: 'roads',
    expectedCategory: 'Road Infrastructure',
    district: 'Thiruvananthapuram',
    state: 'Kerala',
  },
  {
    id: 'ml-3',
    language: 'Malayalam',
    languageCode: 'ml',
    text: 'കമ്മ്യൂണിറ്റി ഹെൽത്ത് സെന്ററിൽ ആന്റിവെനം മരുന്നുകളോ പ്രഥമശുശ്രൂഷാ സൗകര്യങ്ങളോ ലഭ്യമല്ല.',
    expectedSector: 'health',
    expectedCategory: 'Health & Medical',
    district: 'Kozhikode',
    state: 'Kerala',
  },

  // ── 6. Kannada (ಕನ್ನಡ) ──
  {
    id: 'kn-1',
    language: 'Kannada',
    languageCode: 'kn',
    text: 'ನಮ್ಮ ಬಡಾವಣೆಯಲ್ಲಿ ಕುಡಿಯುವ ನೀರಿನ ಪೈಪ್‌ಲೈನ್ ಒಡೆದು ಚರಂಡಿ ನೀರು ಮಿಶ್ರಣವಾಗುತ್ತಿದೆ. ಕೂಡಲೇ ದುರಸ್ತಿ ಮಾಡಬೇಕಾಗಿ ವಿನಂತಿ.',
    expectedSector: 'water',
    expectedCategory: 'Water Supply',
    district: 'Mysuru',
    state: 'Karnataka',
  },
  {
    id: 'kn-2',
    language: 'Kannada',
    languageCode: 'kn',
    text: 'ಗ್ರಾಮ ಪಂಚಾಯತಿ ವ್ಯಾಪ್ತಿಯ ರಸ್ತೆಯಲ್ಲಿ ಬೃಹತ್ ಗುಂಡಿಗಳು ಬಿದ್ದಿದ್ದು ವಾಹನ ಸವಾರರು ದಿನನಿತ್ಯ ಅಪಘಾತಕ್ಕೆ ಈಡಾಗುತ್ತಿದ್ದಾರೆ.',
    expectedSector: 'roads',
    expectedCategory: 'Road Infrastructure',
    district: 'Belagavi',
    state: 'Karnataka',
  },
  {
    id: 'kn-3',
    language: 'Kannada',
    languageCode: 'kn',
    text: 'ಸರ್ಕಾರಿ ಪ್ರಾಥಮಿಕ ಶಾಲೆಯ ಛಾವಣಿ ಸೋರುತ್ತಿದ್ದು ಮಕ್ಕಳಿಗೆ ಕುಳಿತುಕೊಳ್ಳಲು ಕೊಠಡಿಗಳಿಲ್ಲ.',
    expectedSector: 'education',
    expectedCategory: 'Education',
    district: 'Hubballi',
    state: 'Karnataka',
  },

  // ── 7. Bengali (বাংলা) ──
  {
    id: 'bn-1',
    language: 'Bengali',
    languageCode: 'bn',
    text: 'ওয়ার্ডের টিউবওয়েলটি দীর্ঘদিন ধরে অচল হয়ে পড়ে আছে। পরিস্রুত পানীয় জলের তীব্র সংকট দেখা দিয়েছে।',
    expectedSector: 'water',
    expectedCategory: 'Water Supply',
    district: 'Kolkata',
    state: 'West Bengal',
  },
  {
    id: 'bn-2',
    language: 'Bengali',
    languageCode: 'bn',
    text: 'হাসপাতালে যাওয়ার প্রধান রাস্তার অবস্থা অত্যন্ত বেহাল। সামান্য বৃষ্টিতেই হাঁটু জল জমে রাস্তা বন্ধ হয়ে যায়।',
    expectedSector: 'roads',
    expectedCategory: 'Road Infrastructure',
    district: 'Howrah',
    state: 'West Bengal',
  },
  {
    id: 'bn-3',
    language: 'Bengali',
    languageCode: 'bn',
    text: 'খোলা ড্রেন থেকে মারাত্মক দুর্গন্ধ ও মশার উপদ্রব বৃদ্ধি পেয়েছে। পুরসভার সাফাই কর্মীরা আবর্জনা পরিষ্কার করছে না।',
    expectedSector: 'sanitation',
    expectedCategory: 'Sanitation & Waste',
    district: 'North 24 Parganas',
    state: 'West Bengal',
  },

  // ── 8. Marathi (मराठी) ──
  {
    id: 'mr-1',
    language: 'Marathi',
    languageCode: 'mr',
    text: 'गावातील मुख्य पाणीपुरवठा वाहिनी फुटल्याने गेल्या चार दिवसांपासून पिण्याचे पाणी येत नाही. टँकरची तातडीने सोय करावी.',
    expectedSector: 'water',
    expectedCategory: 'Water Supply',
    district: 'Pune',
    state: 'Maharashtra',
  },
  {
    id: 'mr-2',
    language: 'Marathi',
    languageCode: 'mr',
    text: 'शेताकडे जाणाऱ्या रस्त्यावर प्रचंड खड्डे पडले आहेत. पावसामुळे चिखल झाल्याने शेतमाल बाजारात नेणे अशक्य झाले आहे.',
    expectedSector: 'roads',
    expectedCategory: 'Road Infrastructure',
    district: 'Nashik',
    state: 'Maharashtra',
  },
  {
    id: 'mr-3',
    language: 'Marathi',
    languageCode: 'mr',
    text: 'रात्रीच्या वेळी पथदिवे बंद असल्याने मुख्य चौकात अंधार असतो. महिलांच्या सुरक्षिततेसाठी दिवे तातडीने सुरू करावेत.',
    expectedSector: 'public_safety',
    expectedCategory: 'Public Safety',
    district: 'Nagpur',
    state: 'Maharashtra',
  },
];
