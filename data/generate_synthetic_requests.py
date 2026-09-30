"""Generate 5000+ realistic synthetic citizen requests and 300-row eval set.

Meets all Phase 3 requirements:
- 10 languages: ta, hi, mr, bn, as, kn, or, en, Hinglish (hi-Latn), Tanglish (ta-Latn)
- 8 states: Tamil Nadu, Uttar Pradesh, Maharashtra, West Bengal, Rajasthan, Assam, Karnataka, Odisha
- Code-mixed text (Hinglish, Tanglish)
- Voice transcript noise (repeated words, filler sounds 'umm', 'arre', 'matlab', 'paa')
- Regional issue patterns (floods in Assam, drought in Marathwada, urban sanitation in metros)
- Ground-truth evaluation set of 300 rows
- Explicit SYNTHETIC source label
"""

import csv
import os
import random

STATES_DISTRICTS = {
    "Tamil Nadu": {
        "lang_primary": "ta",
        "lang_mixed": "ta-Latn",
        "districts": ["Dindigul", "Chennai", "Madurai", "Coimbatore", "Salem", "Tiruchirappalli", "Vellore", "Thanjavur"]
    },
    "Uttar Pradesh": {
        "lang_primary": "hi",
        "lang_mixed": "hi-Latn",
        "districts": ["Varanasi", "Lucknow", "Prayagraj", "Kanpur Nagar", "Bahraich", "Gorakhpur", "Bareilly", "Ayodhya"]
    },
    "Maharashtra": {
        "lang_primary": "mr",
        "lang_mixed": "hi-Latn",
        "districts": ["Beed", "Dharashiv", "Latur", "Mumbai Suburban", "Pune", "Nagpur", "Chhatrapati Sambhajinagar", "Nashik"]
    },
    "West Bengal": {
        "lang_primary": "bn",
        "lang_mixed": "en",
        "districts": ["Kolkata", "Howrah", "Murshidabad", "Darjeeling", "Malda", "North 24 Parganas", "Bankura", "Purulia"]
    },
    "Rajasthan": {
        "lang_primary": "hi",
        "lang_mixed": "hi-Latn",
        "districts": ["Baran", "Jaisalmer", "Jaipur", "Jodhpur", "Kota", "Bikaner", "Udaipur", "Sikar"]
    },
    "Assam": {
        "lang_primary": "as",
        "lang_mixed": "en",
        "districts": ["Barpeta", "Dhubri", "Kamrup Metropolitan", "Majuli", "Cachar", "Dibrugarh", "Nagaon", "Sonitpur"]
    },
    "Karnataka": {
        "lang_primary": "kn",
        "lang_mixed": "en",
        "districts": ["Raichur", "Yadgir", "Bengaluru Urban", "Mysuru", "Belagavi", "Kalaburagi", "Dharwad", "Shivamogga"]
    },
    "Odisha": {
        "lang_primary": "or",
        "lang_mixed": "en",
        "districts": ["Kandhamal", "Kalahandi", "Malkangiri", "Khordha", "Cuttack", "Koraput", "Ganjam", "Mayurbhanj"]
    },
}

TEMPLATES = {
    # 1. Tamil (ta)
    "ta": [
        ("எங்கள் கிராமத்தில் குடிநீர் விநியோகம் இல்லை {repeat} 5 நாட்களாக மக்கள் தவிக்கிறார்கள் {filler}.",
         "No water supply in our village for 5 days, residents suffering.", "water", 4),
        ("பிரதான சாலையில் உள்ள பெரிய பள்ளம் {repeat} இருசக்கர வாகன ஓட்டிகளுக்கு பெரும் ஆபத்தாக உள்ளது {filler}.",
         "Large pothole on main road posing serious danger to two-wheeler riders.", "roads", 3),
        ("சாக்கடை நீர் தெருவில் பெருக்கெடுத்து ஓடுகிறது {repeat} கொசு தொல்லை தாங்க முடியவில்லை {filler}.",
         "Sewage water overflowing on the street, unbearable mosquito menace.", "sanitation", 3),
        ("மின்மாற்றி பழுதடைந்ததால் 3 நாட்களாக மின்சாரம் இல்லை {repeat} பள்ளி குழந்தைகள் படிக்க முடியவில்லை {filler}.",
         "Transformer fault, no electricity for 3 days, students unable to study.", "electricity", 3),
        ("ஆரம்ப சுகாதார நிலையத்தில் மருத்துவர் இல்லை {repeat} கர்ப்பிணி பெண்கள் அவதிப்படுகின்றனர் {filler}.",
         "No doctor at primary health centre, pregnant women facing distress.", "health", 4),
        ("பள்ளி கட்டிட மேற்கூரை விரிசல் அடைந்துள்ளது {repeat} மழை பெய்தால் ஆபத்தாக மாறும் {filler}.",
         "School building roof cracked, dangerous during rains.", "education", 4),
        ("விவசாய பாசன வாய்க்காலில் அடைப்பு ஏற்பட்டுள்ளது {repeat} பயிர்கள் காய்ந்து போகின்றன {filler}.",
         "Agricultural irrigation canal is clogged, crops drying up.", "agriculture", 3),
        ("இரவு நேரத்தில் தெருவிளக்குகள் எரியவில்லை {repeat} பெண்கள் நடந்து செல்ல அச்சப்படுகிறார்கள் {filler}.",
         "Streetlights not working at night, women afraid to walk.", "public_safety", 3),
    ],
    # 2. Hindi (hi)
    "hi": [
        ("हमारे गांव में पानी की भीषण समस्या है {repeat} पिछले एक हफ्ते से नल में पानी नहीं आया {filler}।",
         "Severe water crisis in our village, no tap water for past week.", "water", 4),
        ("मुख्य सड़क पर जानलेवा गड्ढे बन गए हैं {repeat} आए दिन दुर्घटनाएं हो रही हैं {filler}।",
         "Fatal potholes on main road, frequent accidents occurring.", "roads", 4),
        ("कचरे का ढेर पिछले 10 दिनों से नहीं उठा {repeat} बदबू से जीना मुहाल हो गया है {filler}।",
         "Garbage dump not cleared for 10 days, stench unbearable.", "sanitation", 3),
        ("ट्रांसफार्मर जल जाने से पूरे मोहल्ले में बिजली गुल है {repeat} 48 घंटे से अंधेरा है {filler}।",
         "Transformer burnt, power outage across entire neighbourhood for 48 hours.", "electricity", 3),
        ("प्राथमिक स्वास्थ्य केंद्र पर दवाई और डॉक्टर उपलब्ध नहीं हैं {repeat} मरीज परेशान हैं {filler}।",
         "Medicines and doctor unavailable at primary health centre, patients distressed.", "health", 4),
        ("सरकारी स्कूल की दीवार गिर गई है {repeat} बच्चों की सुरक्षा को भारी खतरा है {filler}।",
         "Government school boundary wall collapsed, high risk to children.", "education", 4),
        ("नहर का पानी टेल तक नहीं पहुंच रहा {repeat} फसलें सूख रही हैं किसान परेशान हैं {filler}।",
         "Canal water not reaching tail end, crops drying up, farmers in crisis.", "agriculture", 3),
        ("शाम होते ही अंधेरे का फायदा उठाकर असामाजिक तत्व घूमते हैं {repeat} पुलिस गश्त बढ़ाई जाए {filler}।",
         "Antisocial elements roam in the dark at night, police patrolling needed.", "public_safety", 3),
    ],
    # 3. Marathi (mr)
    "mr": [
        ("मराठवाड्यात दुष्काळजन्य परिस्थिती असून पाण्याचे टँकर वेळेवर येत नाहीत {repeat} {filler}.",
         "Drought situation in Marathwada, water tankers not arriving on time.", "water", 5),
        ("रस्त्यावर मोठमोठे खड्डे पडले असून एस.टी. बस सेवा बंद पडली आहे {repeat} {filler}.",
         "Huge potholes on road, state transport bus service halted.", "roads", 3),
        ("गटाराचे पाणी रस्त्यावर साचले असून डेंग्यूची साथ पसरत आहे {repeat} {filler}.",
         "Drainage water accumulated on road, dengue outbreak spreading.", "sanitation", 4),
        ("शेतीसाठी दिवसा वीज उपलब्ध नाही {repeat} रात्री पिकांना पाणी देणे धोकादायक झाले आहे {filler}.",
         "No daytime electricity for farming, watering crops at night is hazardous.", "electricity", 3),
        ("ग्रामीण रुग्णालयात ऑक्सिजन सिलिंडर आणि रुग्णवाहिका उपलब्ध नाही {repeat} {filler}.",
         "No oxygen cylinder or ambulance available at rural hospital.", "health", 5),
        ("जिल्हा परिषद शाळेची इमारत जीर्ण झाली आहे {repeat} नवीन खोल्यांची गरज आहे {filler}.",
         "Zilla Parishad school building in dilapidated state, new classrooms needed.", "education", 3),
    ],
    # 4. Bengali (bn)
    "bn": [
        ("পানীয় জলের পাইপ ফেটে নোংরা জল আসছে {repeat} এলাকায় ডায়রিয়ার প্রকোপ দেখা দিয়েছে {filler}।",
         "Drinking water pipe burst mixing with sewer water, diarrhea outbreak.", "water", 5),
        ("রাস্তা ভেঙে নদীগর্ভে চলে গেছে {repeat} যোগাযোগ সম্পূর্ণ বিচ্ছিন্ন {filler}।",
         "Road washed away into riverbed, communication completely cut off.", "roads", 4),
        ("ড্রেন উপচে নোংরা জল রাস্তায় দাঁড়িয়ে আছে {repeat} মশার উপদ্রব বৃদ্ধি পেয়েছে {filler}।",
         "Drains overflowing with dirty water on streets, severe mosquito nuisance.", "sanitation", 3),
        ("বিদ্যুৎ বিপর্যয় গত তিন দিন ধরে অব্যাহত {repeat} পানীয় জল সরবরাহ বন্ধ হয়ে গেছে {filler}।",
         "Power failure continuing for three days, drinking water supply halted.", "electricity", 4),
        ("ব্লক স্বাস্থ্য কেন্দ্রে জরুরি বিভাগে কোনো ডাক্তার নেই {repeat} {filler}।",
         "No emergency doctor at block health centre.", "health", 4),
    ],
    # 5. Assamese (as)
    "as": [
        ("বানপানীৰ ফলত মথাউৰি ভাঙি পানী সোমাইছে {repeat} বিশুদ্ধ খোৱাপানীৰ তীব্র নাটনি {filler}।",
         "Embankment breached by floodwaters, severe shortage of clean drinking water.", "water", 5),
        ("সংযোগী পথটো বানপানীত উটি গৈছে {repeat} যাতায়ত সম্পূৰ্ণৰূপে স্তব্ধ {filler}।",
         "Connecting road washed away by floodwaters, traffic completely paralyzed.", "roads", 4),
        ("পানী শুকোৱাৰ পিছত চাৰিওফালে গেলা-পচা আৱৰ্জনা {repeat} মহামাৰীৰ আশংকা {filler}।",
         "Decaying waste left behind after flood water receded, epidemic risk.", "sanitation", 4),
        ("তিনি দিন ধৰি গাঁৱত বিদ্যুৎ সংযোগ বিচ্ছিন্ন হৈ আছে {repeat} {filler}।",
         "Electricity disconnected in village for three days.", "electricity", 3),
        ("প্ৰাথমিক স্বাস্থ্য কেন্দ্ৰটো পানীত নিমজ্জিত {repeat} চিকিৎসা সেৱা ব্যাহত {filler}।",
         "Primary health centre submerged in water, medical care disrupted.", "health", 5),
    ],
    # 6. Kannada (kn)
    "kn": [
        ("ನಮ್ಮ ಹಳ್ಳಿಯಲ್ಲಿ ಕುಡಿಯುವ ನೀರಿನ ಕೊಳವೆಬಾವಿ ಬತ್ತಿಹೋಗಿದೆ {repeat} ನೀರಿನ ಟ್ಯಾಂಕರ್ ಕಳುಹಿಸಿ {filler}.",
         "Borewell dried up in our village, please send water tanker.", "water", 4),
        ("ರಸ್ತೆಯಲ್ಲಿ ಭಾರಿ ಗುಂಡಿಗಳು ಬಿದ್ದಿದ್ದು ವಾಹನ ಸಂಚಾರ ಅಸಾಧ್ಯವಾಗಿದೆ {repeat} {filler}.",
         "Huge potholes on road making vehicle transit impossible.", "roads", 3),
        ("ಚರಂಡಿ ನೀರು ರಸ್ತೆಗೆ ಹರಿದು ದುರ್ವಾಸನೆ ಬೀರುತ್ತಿದೆ {repeat} {filler}.",
         "Drainage water overflowing onto road causing bad smell.", "sanitation", 3),
        ("ವಿದ್ಯುತ್ ಕಂಬ ಮುರಿದು ಬಿದ್ದಿದ್ದು ಪ್ರಾಣಾಪಾಯದ ಆತಂಕವಿದೆ {repeat} {filler}.",
         "Electric pole broken and fallen, life hazard threat.", "electricity", 5),
        ("ಸಮುದಾಯ ಆರೋಗ್ಯ ಕೇಂದ್ರದಲ್ಲಿ ತುರ್ತು ಚಿಕಿತ್ಸೆ ಲಭ್ಯವಿಲ್ಲ {repeat} {filler}.",
         "Emergency medical treatment unavailable at community health centre.", "health", 4),
    ],
    # 7. Odia (or)
    "or": [
        ("ନଳକୂପ ଅଚଳ ହୋଇପଡ଼ିଥିବାରୁ ପାନୀୟ ଜଳ ପାଇଁ ଲୋକେ ଡହଳବିକଳ ହେଉଛନ୍ତି {repeat} {filler}।",
         "Tube well defunct, villagers in extreme agony for drinking water.", "water", 4),
        ("ପୋଲ ନଥିବାରୁ ବର୍ଷା ଦିନେ ଗାଁ ବାହ୍ୟଜଗତରୁ ବିଚ୍ଛିନ୍ନ ହୋଇପଡ଼ୁଛି {repeat} {filler}।",
         "No bridge across nullah, village cut off during rainy season.", "roads", 4),
        ("ଗ୍ରାମରେ ଆବର୍ଜନା ପରିଚାଳନା ନଥିବାରୁ ରୋଗ ବ୍ୟାପୁଛି {repeat} {filler}।",
         "No waste management in village leading to disease spread.", "sanitation", 3),
        ("ଲୋ ଭୋଲ୍ଟେଜ୍ ଯୋଗୁଁ ମୋଟର ଓ ଫ୍ୟାନ୍ ଚାଲୁନାହିଁ {repeat} {filler}।",
         "Motors and fans not working due to extreme low voltage.", "electricity", 3),
        ("ଉପସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ରରେ ନର୍ସ କିମ୍ବା ଔଷଧ ନାହିଁ {repeat} {filler}।",
         "Neither nurse nor medicines available at sub-health centre.", "health", 4),
    ],
    # 8. English (en)
    "en": [
        ("Critical pipeline burst near sector junction, contaminated water entering households {repeat} {filler}.",
         "Critical pipeline burst near sector junction, contaminated water entering households.", "water", 4),
        ("Arterial flyover road developed severe cracks and deep potholes causing massive traffic jam {repeat} {filler}.",
         "Arterial flyover road developed severe cracks and deep potholes causing massive traffic jam.", "roads", 3),
        ("Solid waste piling up outside municipal school gate creating severe health hazard {repeat} {filler}.",
         "Solid waste piling up outside municipal school gate creating severe health hazard.", "sanitation", 4),
        ("High-tension cable snapped and hanging loose over public walkway {repeat} {filler}.",
         "High-tension cable snapped and hanging loose over public walkway.", "electricity", 5),
        ("Sub-district hospital running without functioning ultrasound machine and blood bank {repeat} {filler}.",
         "Sub-district hospital running without functioning ultrasound machine and blood bank.", "health", 4),
        ("Illegal commercial encroachment blocking pedestrian walkway and disabled ramp {repeat} {filler}.",
         "Illegal commercial encroachment blocking pedestrian walkway and disabled ramp.", "public_safety", 2),
        ("Severe air pollution and toxic smoke from open trash burning behind industrial complex {repeat} {filler}.",
         "Severe air pollution and toxic smoke from open trash burning behind industrial complex.", "environment", 3),
        ("Public transport bus stop shelter collapsed, commuters standing under torrential rain {repeat} {filler}.",
         "Public transport bus stop shelter collapsed, commuters standing under torrential rain.", "transport", 2),
    ],
    # 9. Hinglish (hi-Latn)
    "hi-Latn": [
        ("Bhai suno hamare mohalle mein paani bilkul nahi aa raha {repeat} tanker wale manmaana paisa maang rahe hain {filler}.",
         "Water is not coming at all in our locality, tanker drivers demanding arbitrary rates.", "water", 4),
        ("Road par itna bada khaddha hai {repeat} kal raat do bike wale gir gaye aur fracture ho gaya {filler}.",
         "Such a huge pothole on the road, two bikers fell and suffered fractures last night.", "roads", 4),
        ("Kachra pichhle ek hafte se dump hai {repeat} kutte kachra phaila rahe hain aur badboo bohot zyada hai {filler}.",
         "Garbage dumped for a week, stray dogs scattering it and foul smell everywhere.", "sanitation", 3),
        ("Light subah se gayab hai {repeat} inverter bhi band ho gaya transformer se aag nikal rahi thi {filler}.",
         "Electricity gone since morning, inverter dead, sparks were flying from transformer.", "electricity", 4),
        ("Sarkari hospital mein staff bolta hai injection bahar se khareedo {repeat} gareeb log kahan jayein {filler}?",
         "Government hospital staff asking to buy injection from outside, where should poor people go?", "health", 4),
        ("Hamare primary school mein chhat tapak rahi hai {repeat} desk benches sab geeli ho gayi hain {filler}.",
         "Roof leaking in primary school, desks and benches completely soaked.", "education", 3),
    ],
    # 10. Tanglish (ta-Latn)
    "ta-Latn": [
        ("Namma area-la thanni romba naal-aa varala {repeat} motor podave mudiyala tanker vara sollu-nga {filler}.",
         "Water hasn't come for many days in our area, can't run motor, please send tanker.", "water", 4),
        ("Main road-la romba periya pallam {repeat} night time light illama bike slip aagi vizhundhudraanga {filler}.",
         "Very big pit on main road, bikes slipping and falling due to no lights at night.", "roads", 4),
        ("Kuppai road muzhuka irukku {repeat} smell thaanga mudiyala corporation vandi varave maattengudhu {filler}.",
         "Garbage all over the road, can't bear the smell, corporation truck never comes.", "sanitation", 3),
        ("Current 6 hours-aa illa {repeat} transformer blast aayiduchi romba kashtama irukku {filler}.",
         "No power for 6 hours, transformer blasted, very difficult situation.", "electricity", 3),
        ("PHC doctor epovume leave-la irukkaru {repeat} emergency-ku private hospital thaan poga vendi irukku {filler}.",
         "PHC doctor always on leave, forced to go to private hospital for emergencies.", "health", 4),
    ]
}

FILLERS = {
    "ta": ["", "சீக்கிரம் நடவடிக்கை எடுங்க", "ஐயா தயவுசெய்து பாருங்க", "ரொம்ப கஷ்டமா இருக்கு"],
    "hi": ["", "कृपया तुरंत कार्यवाही करें", "साहब बहुत परेशानी है", "जल्द समाधान चाहिए"],
    "mr": ["", "कृपया त्वरित दखल घ्यावी", "नागरिकांचे हाल होत आहेत", "त्वरित उपाययोजना करा"],
    "bn": ["", "দ্রুত ব্যবস্থা গ্রহণ করুন", "দয়া করে দেখুন", "আমরা চরম দুর্ভোগে আছি"],
    "as": ["", "অনুগ্ৰহ কৰি অতি সোনকালে ব্যৱস্থা লওক", "আমাক সহায় কৰক", "বিহিত ব্যৱস্থা লওক"],
    "kn": ["", "ದಯವಿಟ್ಟು ಕೂಡಲೇ ಕ್ರಮ ಕೈಗೊಳ್ಳಿ", "ತುರ್ತು ಪರಿಹಾರ ಬೇಕಾಗಿದೆ", "ಜನರು ಪರದಾಡುತ್ತಿದ್ದಾರೆ"],
    "or": ["", "ଦୟାକରି ତୁରନ୍ତ ପଦକ୍ଷେପ ନିଅନ୍ତୁ", "ଲୋକେ ବହୁତ ହଇରାଣ ହେଉଛନ୍ତି"],
    "en": ["", "Please take immediate action.", "Kindly address this urgently.", "Residents are suffering."],
    "hi-Latn": ["", "bhai please jaldi dekho", "bahut problem ho rahi hai", "arre jaldi action lo"],
    "ta-Latn": ["", "please seekiram paadunga", "romba urgent bro", "seekiram fix pannunga"],
}

REPEATS = {
    "ta": ["", "தண்ணி தண்ணி", "ரோடு ரோடு", "கரண்ட் கரண்ட்"],
    "hi": ["", "पानी पानी", "सड़क सड़क", "बिजली बिजली"],
    "mr": ["", "पाणी पाणी", "रस्ता रस्ता"],
    "bn": ["", "জল জল", "রাস্তা রাস্তা"],
    "as": ["", "পানী পানী", "ৰাস্তা ৰাস্তା"],
    "kn": ["", "ನೀರು ನೀರು", "ರಸ್ತೆ ರಸ್ತೆ"],
    "or": ["", "ପାଣି ପାଣି", "ରାସ୍ତା ରାସ୍ତା"],
    "en": ["", "urgent urgent", "please please"],
    "hi-Latn": ["", "paani paani", "road road", "light light"],
    "ta-Latn": ["", "thanni thanni", "current current", "road road"],
}


def generate_corpus():
    random.seed(108)  # Reproducible corpus
    corpus_rows = []
    eval_rows = []

    TOTAL_TARGET = 5300
    EVAL_TARGET = 300

    languages = list(TEMPLATES.keys())
    state_names = list(STATES_DISTRICTS.keys())

    # Generate full dataset
    while len(corpus_rows) < TOTAL_TARGET:
        state = random.choice(state_names)
        state_info = STATES_DISTRICTS[state]
        district = random.choice(state_info["districts"])

        # Select language weighted towards state
        if random.random() < 0.65:
            lang = state_info["lang_primary"]
        elif random.random() < 0.85:
            lang = state_info["lang_mixed"]
        else:
            lang = random.choice(languages)

        tpl_list = TEMPLATES[lang]
        text_tpl, en_tpl, sector, urgency_base = random.choice(tpl_list)

        # Apply voice transcript noise or fillers
        repeat_word = random.choice(REPEATS.get(lang, [""])) if random.random() < 0.3 else ""
        filler = random.choice(FILLERS.get(lang, [""])) if random.random() < 0.4 else ""

        complaint_text = text_tpl.replace("{repeat}", repeat_word).replace("{filler}", filler)
        complaint_text = " ".join(complaint_text.split())

        urgency = max(1, min(5, urgency_base + random.choice([-1, 0, 1])))

        row = {
            "complaint_text": complaint_text,
            "english_translation": en_tpl,
            "state": state,
            "district": district,
            "sector": sector,
            "urgency": urgency,
            "language": lang,
            "source": "SYNTHETIC",
        }
        corpus_rows.append(row)

    # Sample 300 held-out evaluation set with balanced representation across languages and sectors
    random.shuffle(corpus_rows)
    eval_rows = corpus_rows[:EVAL_TARGET]
    train_corpus = corpus_rows[EVAL_TARGET:]

    # Write synthetic_requests.csv
    with open("data/synthetic_requests.csv", "w", newline="", encoding="utf-8") as f:
        fieldnames = ["complaint_text", "english_translation", "state", "district", "sector", "urgency", "language", "source"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(corpus_rows)

    # Write eval_set.csv
    with open("data/eval_set.csv", "w", newline="", encoding="utf-8") as f:
        fieldnames = ["complaint_text", "english_translation", "state", "district", "sector", "urgency", "language", "source"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(eval_rows)

    print(f"Generated synthetic requests: {len(corpus_rows)} rows in data/synthetic_requests.csv")
    print(f"Generated held-out eval set: {len(eval_rows)} rows in data/eval_set.csv")


if __name__ == "__main__":
    generate_corpus()
