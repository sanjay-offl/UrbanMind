"""Build the frontend national civic-intelligence dataset.

Reads the public / government source extracts already committed under
``data/raw`` (Census 2011 district population, JJM tap-water coverage, PMGSY
road connectivity, Swachh Bharat ODF status, NITI Aayog aspirational districts,
state budget investment plans) plus the realistic multilingual synthetic
citizen-request corpus in ``data/synthetic_requests.csv``, and emits a single
compact JSON file for the Next.js frontend.

The public extracts supply the *context layer* (demographics, infrastructure
gap, investment need). The synthetic corpus supplies the *citizen voice layer*
(text in 12 Indian languages). Text is de-duplicated through a template
registry so the emitted file stays small.

Output: ``frontend/data/civic-data.json``

Everything here is deterministic (fixed seeds) so the demo dataset is
reproducible.
"""

from __future__ import annotations

import csv
import json
import math
import os
import random
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
RAW = os.path.join(HERE, "raw")
OUT = os.path.join(ROOT, "frontend", "data", "civic-data.json")

SEED = 20240918

# --------------------------------------------------------------------------
# 1. Complaint template registry
#    (local-language text, english gloss, sector, urgency base 1-5)
#    {repeat} / {filler} are filled per-request to imitate messy real input.
# --------------------------------------------------------------------------

TEMPLATES: dict[str, list[tuple[str, str, str, int]]] = {
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
    "as": [
        ("বানপানীৰ ফলত মথাউৰি ভাঙি পানী সোমাইছে {repeat} বিশুদ্ধ খোৱাপানীৰ তীব্ৰ নাটনি {filler}।",
         "Embankment breached by floodwaters, severe shortage of clean drinking water.", "water", 5),
        ("সংযোগী পথটো বানপানীত উটি গৈছে {repeat} যাতায়ত সম্পূৰ্ণৰূপে স্তব্ধ {filler}।",
         "Connecting road washed away by floodwaters, traffic completely paralyzed.", "roads", 4),
        ("পানী শুকোৱাৰ পিছত চাৰিওফালে গেলা-পচা আৱৰ্জনা {repeat} মহামাৰীৰ আশংকা {filler}।",
         "Decaying waste left behind after flood water receded, epidemic risk.", "sanitation", 4),
        ("তিনি দিন ধৰি গাঁৱত বিদ্যুৎ সংযোগ বিচ্ছিন্ন হৈ আছে {repeat} {filler}।",
         "Electricity disconnected in village for three days.", "electricity", 3),
        ("প্ৰাথমিক স্বাস্থ্য কেন্দ্ৰটো পানীত নিমজ্জিত {repeat} চিকিৎসা সেৱা ব্যাহত {filler}।",
         "Primary health centre submerged in water, medical care disrupted.", "health", 5),
    ],
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
    "te": [
        ("మన గ్రామంలో నీరు సరిగా రాలేదు {repeat} ఐదు రోజులుగా ప్రజలు బాధితులవుతున్నారు {filler}.",
         "No water supply in our village for five days, residents are suffering.", "water", 4),
        ("ప్రధాన రోడ్డులో పెద్ద గుంతలు ఏర్పడ్డాయి {repeat} రెండు చ-wheel వాహనాలు పడిపోయின {filler}.",
         "Large potholes on the main road, two-wheelers are falling regularly.", "roads", 4),
        ("ముత్రపైరు నీరు వీధిలో పాట్లుతూ ఉంది {repeat} దోమల ఉత్తరకాలం ఇబ్బంది కలిగిస్తోంది {filler}.",
         "Drainage water overflowing into the street, mosquito menace is severe.", "sanitation", 3),
        ("ట్రాన్స్‌ఫార్మర్ పగిలిపోవడంతో మూడు రోజులుగా విద్యుత్ లేదు {repeat} పిల్లలు చదువుకోలేకపోతున్నారు {filler}.",
         "Transformer failed, no electricity for three days, students unable to study.", "electricity", 3),
        ("ప్రాథమిక ఆరోగ్య కేంద్రంలో వైద్యులు లేరు {repeat} గర్భిణి మహిళలు ఇబ్బంది పడుతున్నారు {filler}.",
         "No doctor at the primary health centre, pregnant women are struggling.", "health", 4),
        ("పాఠశాల పైకప్పు పగులిపోయింది {repeat} వర్షాకాలంలో ప్రమాదకరంగా ఉంది {filler}.",
         "School roof has cracked, dangerous during the monsoon.", "education", 4),
        ("రాత్రి వేళ దీపాలు పనిచేయడం లేదు {repeat} మహిళలు నడకకు భయపడుతున్నారు {filler}.",
         "Streetlights are not working at night, women fear walking outside.", "public_safety", 3),
    ],
    "ml": [
        ("ഞങ്ങളുടെ ഗ്രാമത്തിൽ വെള്ളം വരുന്നില്ല {repeat} അഞ്ച് ദിവസമായി ആളുകൾ കഷ്ടപ്പെടുന്നു {filler}.",
         "No drinking water in our village for five days, people are struggling.", "water", 4),
        ("പ്രധാന റോഡിലെ വലിയ കുഴിപ്പുകൾ വളരുന്നു {repeat} രണ്ടു ചക്രവാഹനങ്ങൾ വിപത്തിൽ പട്ടി {filler}.",
         "Large potholes growing on the main road, two vehicles have already met with accidents.", "roads", 4),
        ("ഡ്രെയിൻ വെള്ളം റോഡിലേക്ക് ഒഴുകിയിരിക്കുന്നു {repeat} ദാമ്പത്തിന്റെ ഭയം വർദ്ധിക്കുന്നു {filler}.",
         "Drain water is flowing onto the road, the mosquito threat is increasing.", "sanitation", 3),
        ("ട്രാൻസ്‌ഫോർമർ പൊട്ടിയതിനാൽ മൂന്ന് ദിവസം വൈദ്യുതിയില്ല {repeat} കുട്ടികൾ പഠിക്കാൻ കഴിയുന്നില്ല {filler}.",
         "Transformer burnt down, no power for three days, children cannot study.", "electricity", 3),
        ("പ്രാഥമിക ആരോഗ്യ കേന്ദ്രത്തിൽ ഡോക്ടർ ഇല്ല {repeat} ഗർഭിണികളും ബുദ്ധിമുട്ടുകളും കഷ്ടപ്പെടുന്നു {filler}.",
         "No doctor at the primary health centre, pregnant women and elderly are suffering.", "health", 4),
        ("വിദ്യാലയത്തിന്റെ മാത്രം ചുരന്നുപോയി {repeat} മഴയുമ്പോൾ അപாயകരം {filler}.",
         "The school roof has cracked, dangerous when it rains.", "education", 4),
    ],
    "gu": [
        ("અમારી ગામમાં પાણી આવતું નથી {repeat} પાંચ દિવસથી લોકો ત્રૂટું છે {filler}.",
         "No water supply in our village for five days, people are in trouble.", "water", 4),
        ("મુખ્ય રસ્તા પર મોટા ખાડો પડી ગયા છે {repeat} બે ચક્રવાહન પોલાઈ {filler}.",
         "Large potholes have formed on the main road, two vehicles overturned yesterday.", "roads", 4),
        ("ગંટારો રસ્તા પર ભરાયેલો છે {repeat} ડાંગ નુથીનો ભય વધ્યો છે {filler}.",
         "Drainage water is standing on the road, the threat of dengue has increased.", "sanitation", 3),
        ("ટ્રાન્સફોર્મર બળી ગયું હતા ત્રણ દિવસથી વિદ્યુત નથી {repeat} બાળકો ભણી શકતા નથી {filler}.",
         "The transformer burned down, no electricity for three days, children cannot study.", "electricity", 3),
        ("પ્રાથમિક આરોગ્ય કેન્દ્રમાં ડોક્ટર નથી {repeat} ગર્ભવતીઓ મુશ્કેલે છે {filler}.",
         "No doctor at the primary health centre, pregnant women are struggling.", "health", 4),
        ("શાળાની છતમાં તરફોચવાળી કાળી દાદર આવી છે {repeat} વરસાદમાં જોખમી {filler}.",
         "Cracks have appeared in the school roof, dangerous during the monsoon.", "education", 4),
    ],
    "pa": [
        ("ਸਾਡੇ ਪਿੰਡ ਵਿੱਚ ਪਾਣੀ ਨਹੀਂ ਆ ਰਿਹਾ {repeat} ਪੰਜ ਦਿਨਾਂ ਤੋਂ ਲੋਕ ਪੀੜੇ ਹਨ {filler}.",
         "No water supply in our village for five days, people are suffering.", "water", 4),
        ("ਮੁੱਖ ਸੜਕ 'ਤੇ ਵੱਡੇ ਗੱਡੇ ਬਣ ਗਏ ਹਨ {repeat} ਦੋ ਬਾਈਕ ਡਿਗੜ੍ਹਿਆਂ {filler}.",
         "Large potholes have formed on the main road, two bikes overturned yesterday.", "roads", 4),
        ("ਡ੍ਰੇਨੇ ਦਾ ਪਾਣੀ ਗਲੀ 'ਤੇ ਇਕੱਠਾ ਹੋ ਰਿਹਾ ਹੈ {repeat} ਮੱਛਰਾਂ ਦਾ ਖ਼ਤਰਾ ਵਧਿਆ {filler}.",
         "Drain water is pooling on the streets, the mosquito threat has increased.", "sanitation", 3),
        ("ਟਰਾਂਸਫਾਰਮਰ ਪੂੜ ਗਿਆ ਹੈ ਤਿੰਨ ਦਿਨਾਂ ਤੋਂ ਬਿਜਲੀ ਨਹੀਂ {repeat} ਬੱਚੇ ਪੜ੍ਹ ਨਹੀਂ ਸਕਦੇ {filler}.",
         "The transformer burned down, no power for three days, children cannot study.", "electricity", 3),
        ("ਪ੍ਰਾਥਮਿਕ ਸਿਹਤ ਕੇਂਦਰ 'ਤੇ ਡਾਕਟਰ ਨਹੀਂ {repeat} ਗਰਭਵਤੀਆਂ ਨੂੰ ਮੁਸੀਬਤ ਹੈ {filler}.",
         "No doctor at the primary health centre, pregnant women are in trouble.", "health", 4),
    ],
    "ur": [
        ("ہمارے گاؤں میں پانی نہیں آ رہا {repeat} پانچ دن سے عوام کو مشکل ہے {filler}۔",
         "No water supply in our village for five days, people are struggling.", "water", 4),
        ("مرکزی سڑک پر بڑے گڑھے بن گئے ہیں {repeat} کل دو گاڑیاں الٹ گئیں {filler}۔",
         "Large potholes on the main road, two vehicles overturned yesterday.", "roads", 4),
    ],
    "en": [
        ("Critical pipeline burst near the sector junction, contaminated water entering households {repeat} {filler}.",
         "Critical pipeline burst near the sector junction, contaminated water entering households.", "water", 4),
        ("Arterial flyover approach road developed severe cracks and deep potholes causing massive traffic jam {repeat} {filler}.",
         "Arterial flyover approach road developed severe cracks and deep potholes causing massive traffic jam.", "roads", 3),
        ("Solid waste piling up outside the municipal school gate creating a severe health hazard {repeat} {filler}.",
         "Solid waste piling up outside the municipal school gate creating a severe health hazard.", "sanitation", 4),
        ("High-tension cable snapped and hanging loose over the public walkway {repeat} {filler}.",
         "High-tension cable snapped and hanging loose over the public walkway.", "electricity", 5),
        ("Sub-district hospital running without a functioning ultrasound machine or blood bank {repeat} {filler}.",
         "Sub-district hospital running without a functioning ultrasound machine or blood bank.", "health", 4),
        ("Illegal commercial encroachment blocking the pedestrian walkway and disabled ramp {repeat} {filler}.",
         "Illegal commercial encroachment blocking the pedestrian walkway and disabled ramp.", "public_safety", 2),
        ("Severe air pollution and toxic smoke from open trash burning behind the industrial complex {repeat} {filler}.",
         "Severe air pollution and toxic smoke from open trash burning behind the industrial complex.", "environment", 3),
        ("Public transport bus stop shelter has collapsed, commuters standing under torrential rain {repeat} {filler}.",
         "Public transport bus stop shelter has collapsed, commuters standing under torrential rain.", "transport", 2),
        ("Cattle shelter has no drinking water and the herd is entering agricultural fields damaging crops {repeat} {filler}.",
         "Cattle shelter has no drinking water and the herd is entering agricultural fields damaging crops.", "agriculture", 3),
    ],
    "hi-Latn": [
        ("Bhai suno hamare mohalle mein paani bilkul nahi aa raha {repeat} tanker wale manmaana paisa maang rahe hain {filler}.",
         "Water is not coming at all in our locality, tanker drivers demanding arbitrary rates.", "water", 4),
        ("Road par itna bada khaddha hai {repeat} kal raat do bike wale gir gaye aur fracture ho gaya {filler}.",
         "Such a huge pothole on the road, two bikers fell and suffered fractures last night.", "roads", 4),
        ("Kachra pichhle ek hafte se dump hai {repeat} kutte kachra phaila rahe hain aur badboo bohot zyada hai {filler}.",
         "Garbage dumped for a week, stray dogs scattering it and foul smell everywhere.", "sanitation", 3),
        ("Light subah se gayab hai {repeat} inverter bhi band ho gaya transformer se aag nikal rahi thi {filler}.",
         "Electricity gone since morning, inverter dead, sparks were flying from the transformer.", "electricity", 4),
        ("Sarkari hospital mein staff bolta hai injection bahar se khareedo {repeat} gareeb log kahan jayein {filler}?",
         "Government hospital staff asking to buy injection from outside, where should poor people go?", "health", 4),
    ],
    "ta-Latn": [
        ("Namma area-la thanni romba naal-aa varala {repeat} motor podave mudiyala tanker vara sollu-nga {filler}.",
         "Water hasn't come for many days in our area, can't run the motor, please send a tanker.", "water", 4),
        ("Main road-la romba periya pallam {repeat} night time light illama bike slip aagi vizhundhudraanga {filler}.",
         "Very big pit on the main road, bikes slipping and falling due to no lights at night.", "roads", 4),
        ("Kuppai road muzhuka irukku {repeat} smell thaanga mudiyala corporation vandi varave maattengudhu {filler}.",
         "Garbage all over the road, can't bear the smell, corporation truck never comes.", "sanitation", 3),
        ("Current 6 hours-aa illa {repeat} transformer blast aayiduchi romba kashtama irukku {filler}.",
         "No power for 6 hours, the transformer blasted, very difficult situation.", "electricity", 3),
    ],
    "te-Latn": [
        ("Mana gaaram lo neru rakam ledu {repeat} pani vijaya ledu gaatri neru poyindi {filler}.",
         "Water supply is completely missing in our village, women walk 3 km every day for water.", "water", 4),
    ],
    "ml-Latn": [
        ("Njangalude grama vilakkuilla enne varunilla {repeat} five days aanu janthar pracharam kalikkunnu {filler}.",
         "No drinking water reached our village for five days, the whole village is dehydrated.", "water", 4),
    ],
}

FILLERS = {
    "ta": ["", "சீக்கிரம் நடவடிக்கை எடுங்க", "ஐயா தயவுசெய்து பாருங்க", "ரொம்ப கஷ்டமா இருக்கு"],
    "hi": ["", "कृपया तुरंत कार्यवाही करें", "साहब बहुत परेशानी है", "जल्द समाधान चाहिए"],
    "mr": ["", "कृपया त्वरित दखल घ्यावी", "नागरिकांचे हाल होत आहेत", "त्वरित उपाययोजना करा"],
    "bn": ["", "দ্রুত ব্যবস্থা গ্রহণ করুন", "দয়া করে দেখুন", "আমরা চরম দুর্ভোগে আছি"],
    "as": ["", "অনুগ্ৰহ কৰি অতি সোনকালে ব্যৱস্থা লওক", "আমাক সহায় কৰক"],
    "kn": ["", "ದಯವಿಟ್ಟು ಕೂಡಲೇ ಕ್ರಮ ಕೈಗೊಳ್ಳಿ", "ತುರ್ತು ಪರಿಹಾರ ಬೇಕಾಗಿದೆ"],
    "or": ["", "ଦୟାକରି ତୁରନ୍ତ ପଦକ୍ଷେପ ନିଅନ୍ତୁ"],
    "te": ["", "దయచేసి వెంటనే పరిష్కరించండి", "ప్రజలు చాలా ఇబ్బంది పడుతున్నారు"],
    "ml": ["", "ദയവേട്ട് ഉടൻ പരിഷ്കരിക്കുക", "ജനങ്ങൾ വളരെ കഷ്ടപ്പെടുന്നു"],
    "gu": ["", "કૃપા કરી તાત્કાલિક કાર્યવાહી કરો", "લોકો ખૂબ મુશ્કેલે છે"],
    "pa": ["", "ਕਿਰਪਾ ਕਰਕੇ ਤੁਰੰਤ ਕਾਰਵਾਈ ਕਰੋ", "ਲੋਕ ਬਹੁਤ ਪਰੇਸ਼ਾਨ ਹਨ"],
    "ur": ["", "براہ کرم فوری کارروائی کریں"],
    "en": ["", "Please take immediate action.", "Kindly address this urgently.", "Residents are suffering."],
    "hi-Latn": ["", "bhai please jaldi dekho", "bahut problem ho rahi hai"],
    "ta-Latn": ["", "please seekiram paadunga", "romba urgent"],
    "te-Latn": ["", "dayacheesi ventane parishkariinchandi"],
    "ml-Latn": ["", "dayavettu utan parishkarikkuka"],
}

REPEATS = {
    "ta": ["", "தண்ணி தண்ணி", "ரோடு ரோடு"],
    "hi": ["", "पानी पानी", "सड़क सड़क", "बिजली बिजली"],
    "mr": ["", "पाणी पाणी", "रस्ता रस्ता"],
    "bn": ["", "জল জল", "রাস্তা রাস্তা"],
    "as": ["", "পানী পানী", "ৰাস্তা ৰাস্তা"],
    "kn": ["", "ನೀರು ನೀರು", "ರಸ್ತೆ ರಸ್ತೆ"],
    "or": ["", "ପାଣି ପାଣି"],
    "te": ["", "నీరు నీరు", "రోడ్ రోడ్"],
    "ml": ["", "വെള്ളം വെള്ളം", "റോഡ് റോഡ്"],
    "gu": ["", "પાણી પાણી", "રસ્તો રસ્તો"],
    "pa": ["", "ਪਾਣੀ ਪਾਣੀ"],
    "ur": ["", "پانی پانی"],
    "en": ["", "urgent urgent", "please please"],
    "hi-Latn": ["", "paani paani", "road road", "light light"],
    "ta-Latn": ["", "thanni thanni", "road road"],
    "te-Latn": ["", "neru neru"],
    "ml-Latn": ["", "vellam vellam"],
}

# State / UT -> (primary language, secondary language, code-mixed language)
STATE_LANGUAGES: dict[str, tuple[str, str, str]] = {
    "Andhra Pradesh": ("te", "te", "te-Latn"),
    "Arunachal Pradesh": ("en", "hi", "en"),
    "Assam": ("as", "en", "en"),
    "Bihar": ("hi", "hi", "hi-Latn"),
    "Chhattisgarh": ("hi", "hi", "hi-Latn"),
    "Goa": ("en", "hi", "en"),
    "Gujarat": ("gu", "hi", "gu"),
    "Haryana": ("hi", "pa", "hi-Latn"),
    "Himachal Pradesh": ("hi", "pa", "hi-Latn"),
    "Jharkhand": ("hi", "hi", "hi-Latn"),
    "Karnataka": ("kn", "en", "en"),
    "Kerala": ("ml", "en", "ml-Latn"),
    "Madhya Pradesh": ("hi", "hi", "hi-Latn"),
    "Maharashtra": ("mr", "hi", "hi-Latn"),
    "Manipur": ("en", "hi", "en"),
    "Meghalaya": ("en", "hi", "en"),
    "Mizoram": ("en", "hi", "en"),
    "Nagaland": ("en", "hi", "en"),
    "Odisha": ("or", "hi", "en"),
    "Punjab": ("pa", "hi", "pa"),
    "Rajasthan": ("hi", "hi", "hi-Latn"),
    "Sikkim": ("en", "hi", "en"),
    "Tamil Nadu": ("ta", "en", "ta-Latn"),
    "Telangana": ("te", "ur", "te-Latn"),
    "Tripura": ("bn", "hi", "bn"),
    "Uttar Pradesh": ("hi", "hi", "hi-Latn"),
    "Uttarakhand": ("hi", "hi", "hi-Latn"),
    "West Bengal": ("bn", "hi", "bn"),
    "Andaman and Nicobar Islands": ("hi", "en", "hi-Latn"),
    "Chandigarh": ("hi", "pa", "hi-Latn"),
    "Dadra and Nagar Haveli and Daman and Diu": ("gu", "hi", "gu"),
    "Delhi": ("hi", "hi", "hi-Latn"),
    "Jammu and Kashmir": ("ur", "hi", "ur"),
    "Ladakh": ("hi", "ur", "hi-Latn"),
    "Lakshadweep": ("ml", "en", "ml-Latn"),
    "Puducherry": ("ta", "fr", "ta-Latn"),
}

# States where the dataset carries a deliberately deep multilingual corpus
# (used for the judge-facing demo geography).
DEEP_STATES = {
    "Tamil Nadu", "Karnataka", "Maharashtra", "Kerala", "Telangana",
    "Delhi", "Uttar Pradesh", "West Bengal", "Gujarat", "Punjab",
}

SECTOR_CATEGORY = {
    "water": "Water Supply",
    "roads": "Road Infrastructure",
    "sanitation": "Sanitation & Waste",
    "electricity": "Electricity",
    "health": "Health & Medical",
    "education": "Education",
    "public_safety": "Public Safety",
    "agriculture": "Agriculture & Rural Livelihoods",
    "environment": "Environment & Ecology",
    "transport": "Public Transport",
}

# Intrinsic risk of the sector on a 1-10 scale.
SECTOR_SEVERITY = {
    "water": 7.0, "roads": 7.0, "sanitation": 6.0, "electricity": 7.0,
    "health": 9.0, "education": 7.0, "public_safety": 8.0,
    "agriculture": 6.0, "environment": 5.0, "transport": 5.0,
}

SECTOR_ACTION = {
    "water": "Water supply restoration and pipeline repair",
    "roads": "Road inspection and phased repair",
    "sanitation": "Sanitation, desilting and waste collection drive",
    "electricity": "Transformer repair and load-shedding audit",
    "health": "Health staffing and essential equipment release",
    "education": "School infrastructure repair drive",
    "public_safety": "Streetlight restoration and night patrol deployment",
    "agriculture": "Irrigation channel clearance and drought relief",
    "environment": "Waste-burning enforcement and green cover plan",
    "transport": "Bus shelter reconstruction and service frequency review",
}

SOURCES = [
    "Citizen Web Portal",
    "WhatsApp Bot",
    "Voice IVR Helpline",
    "Telegram Bot",
    "Mobile App",
    "CPGRAMS Import",
    "Bulk CSV Upload",
]

# Real municipal service hubs. Each district is attached to the nearest hub
# inside its own state so that the India -> State -> District -> City -> Ward
# hierarchy always resolves to a real place.
CITY_HUBS: dict[str, list[tuple[str, float, float]]] = {
    "Andhra Pradesh": [("Visakhapatnam", 17.6868, 83.2185), ("Vijayawada", 16.5062, 80.6480), ("Tirupati", 13.6288, 79.4192)],
    "Arunachal Pradesh": [("Itanagar", 27.0844, 93.6053)],
    "Assam": [("Guwahati", 26.1445, 91.7362), ("Dibrugarh", 27.4728, 94.9120), ("Silchar", 24.8333, 92.7789)],
    "Bihar": [("Patna", 25.5941, 85.1376), ("Gaya", 24.7955, 85.0002), ("Muzaffarpur", 26.1209, 85.3647)],
    "Chhattisgarh": [("Raipur", 21.2514, 81.6296), ("Bilaspur", 22.0797, 82.1400)],
    "Goa": [("Panaji", 15.4909, 73.8278)],
    "Gujarat": [("Ahmedabad", 23.0225, 72.5714), ("Surat", 21.1702, 72.8311), ("Vadodara", 22.3072, 73.1812), ("Rajkot", 22.3039, 70.8022)],
    "Haryana": [("Gurugram", 28.4595, 77.0266), ("Faridabad", 28.4089, 77.3178), ("Panipat", 29.3909, 76.9635)],
    "Himachal Pradesh": [("Shimla", 31.1048, 77.1734), ("Mandi", 31.7085, 76.9316)],
    "Jharkhand": [("Ranchi", 23.3441, 85.3096), ("Jamshedpur", 22.8046, 86.2029), ("Dhanbad", 23.7957, 86.4304)],
    "Karnataka": [("Bengaluru", 12.9716, 77.5946), ("Mysuru", 12.2958, 76.6394), ("Hubballi", 15.3647, 75.1240), ("Mangaluru", 12.9141, 74.8560)],
    "Kerala": [("Kochi", 9.9312, 76.2673), ("Thiruvananthapuram", 8.5241, 76.9366), ("Kozhikode", 11.2588, 75.7804)],
    "Madhya Pradesh": [("Bhopal", 23.2599, 77.4126), ("Indore", 22.7196, 75.8577), ("Gwalior", 26.2183, 78.1828)],
    "Maharashtra": [("Mumbai", 19.0760, 72.8777), ("Pune", 18.5204, 73.8567), ("Nagpur", 21.1458, 79.0882), ("Nashik", 19.9975, 73.7898)],
    "Manipur": [("Imphal", 24.8170, 93.9368)],
    "Meghalaya": [("Shillong", 25.5788, 91.8933)],
    "Mizoram": [("Aizawl", 23.7271, 92.7176)],
    "Nagaland": [("Kohima", 25.6751, 94.1086)],
    "Odisha": [("Bhubaneswar", 20.2961, 85.8245), ("Rourkela", 22.2604, 84.8536), ("Cuttack", 20.4625, 85.8830)],
    "Punjab": [("Ludhiana", 30.9010, 75.8573), ("Amritsar", 31.6340, 74.8723), ("Jalandhar", 31.3260, 75.5762)],
    "Rajasthan": [("Jaipur", 26.9124, 75.7873), ("Jodhpur", 26.2389, 73.0243), ("Kota", 25.2138, 75.8648), ("Udaipur", 24.5854, 73.7125)],
    "Sikkim": [("Gangtok", 27.3314, 88.6138)],
    "Tamil Nadu": [("Chennai", 13.0827, 80.2707), ("Coimbatore", 11.0168, 76.9558), ("Madurai", 9.9252, 78.1198), ("Tiruchirappalli", 10.7905, 78.7047), ("Salem", 11.6643, 78.1460), ("Tirunelveli", 8.7139, 77.7567)],
    "Telangana": [("Hyderabad", 17.3850, 78.4867), ("Warangal", 17.9689, 79.5941), ("Nizamabad", 18.6725, 78.0940)],
    "Tripura": [("Agartala", 23.8315, 91.2868)],
    "Uttar Pradesh": [
        ("Lucknow", 26.8467, 80.9462), ("Varanasi", 25.3176, 82.9739),
        ("Kanpur Nagar", 26.4499, 80.3319), ("Prayagraj", 25.4358, 81.8463),
        ("Agra", 27.1767, 78.0081), ("Ghaziabad", 28.6692, 77.4538),
        ("Noida", 28.5355, 77.3910), ("Meerut", 28.9845, 77.7064),
        ("Gorakhpur", 26.7606, 83.3732), ("Bareilly", 28.3670, 79.4304),
        ("Ayodhya", 26.7922, 82.1998),
    ],
    "Uttarakhand": [("Dehradun", 30.3165, 78.0322), ("Haridwar", 29.9457, 78.1642)],
    "West Bengal": [
        ("Kolkata", 22.5726, 88.3639), ("Howrah", 22.5958, 88.2636),
        ("Darjeeling", 27.0410, 88.2663), ("Malda", 25.0113, 88.1433),
        ("Siliguri", 26.7271, 88.3953), ("Asansol", 23.6739, 86.9524),
        ("Kharagpur", 22.3460, 87.2320), ("Durgapur", 23.5204, 87.3119),
    ],
    "Andaman and Nicobar Islands": [("Port Blair", 11.6234, 92.7265)],
    "Chandigarh": [("Chandigarh", 30.7333, 76.7794)],
    "Dadra and Nagar Haveli and Daman and Diu": [("Daman", 20.3974, 72.8328)],
    "Delhi": [("New Delhi", 28.6139, 77.2090), ("Dwarka", 28.5921, 77.0460), ("Rohini", 28.7495, 77.0565)],
    "Jammu and Kashmir": [("Srinagar", 34.0837, 74.7973), ("Jammu", 32.7266, 74.8570)],
    "Ladakh": [("Leh", 34.1526, 77.5771)],
    "Lakshadweep": [("Kavaratti", 10.5669, 72.6420)],
    "Puducherry": [("Puducherry", 11.9416, 79.8083), ("Karaikal", 10.9254, 79.8380)],
}

# Lat/lng for hub names listed as bare strings above.
_EXTRA_HUB_COORDS: dict[str, tuple[float, float]] = {}

WARD_SUFFIXES = ["North", "South", "East", "West", "Central", "Old Town", "Colony", "Nagar", "Ghat", "Kunj"]

STATUSES = ["pending", "classified", "in_progress", "resolved", "closed"]


# --------------------------------------------------------------------------
# 2. Loaders
# --------------------------------------------------------------------------


def read_csv(name: str) -> list[dict]:
    with open(os.path.join(RAW, name), newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def to_float(value, default=0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def load_hubs() -> dict[str, list[tuple[str, float, float]]]:
    out: dict[str, list[tuple[str, float, float]]] = {}
    for state, hubs in CITY_HUBS.items():
        resolved = []
        for hub in hubs:
            if isinstance(hub, tuple):
                resolved.append(hub)
            else:
                coords = _EXTRA_HUB_COORDS.get(hub)
                if coords:
                    resolved.append((hub, coords[0], coords[1]))
        out[state] = resolved
    return out


def nearest_hub(state: str, lat: float, lng: float, hubs: dict) -> tuple[str, float, float]:
    candidates = hubs.get(state) or [("District HQ", lat, lng)]
    best = min(candidates, key=lambda h: (h[1] - lat) ** 2 + (h[2] - lng) ** 2)
    if (best[1] - lat) ** 2 + (best[2] - lng) ** 2 > 4.0:
        return ("District HQ", lat, lng)
    return best


# --------------------------------------------------------------------------
# 3. Build
# --------------------------------------------------------------------------


def build() -> dict:
    rng = random.Random(SEED)

    census = {r["lgd_code"]: r for r in read_csv("census_2011_district.csv")}
    jjm = {r["lgd_code"]: r for r in read_csv("jjm_district_coverage.csv")}
    pmgsy = {r["lgd_code"]: r for r in read_csv("pmgsy_road_connectivity.csv")}
    swachh = {r["lgd_code"]: r for r in read_csv("swachh_bharat_odf.csv")}
    niti = {r["lgd_code"]: r for r in read_csv("niti_aspirational_districts.csv")}

    # Per-capita need and planned spend, averaged across sectors and years.
    need: dict[str, list[float]] = defaultdict(list)
    planned: dict[str, list[float]] = defaultdict(list)
    for r in read_csv("investment_plans.csv"):
        code = r["district_lgd_code"]
        need[code].append(to_float(r["per_capita_need_estimate"]))
        planned[code].append(to_float(r["per_capita_planned_spend"]))
    extra_indicators: dict[str, dict[str, float]] = defaultdict(dict)
    for r in read_csv("infrastructure_indicators.csv"):
        extra_indicators[r["district_lgd_code"]][r["indicator_name"]] = to_float(r["indicator_value"])

    units = json.load(open(os.path.join(RAW, "india_admin_units.json"), encoding="utf-8"))
    geo_state = {u["name"]: u for u in units if u["level"] == "state"}
    geo_district = {u["name"]: u for u in units if u["level"] == "district"}

    hubs = load_hubs()

    # ---- districts -------------------------------------------------------
    districts = []
    by_state: dict[str, list[int]] = defaultdict(list)
    for code, row in census.items():
        name = row["district_name"]
        geo = geo_district.get(name)
        if geo is None:
            continue
        state = row["state_name"]
        lat, lng = float(geo["lat"]), float(geo["lng"])

        population = int(to_float(row["total_population"]))
        tap = to_float(jjm.get(code, {}).get("jjm_tap_coverage"), 0.0)
        road = to_float(pmgsy.get(code, {}).get("pmgsy_road_connected"), 0.0)
        odf_plus = to_float(swachh.get(code, {}).get("odf_plus_villages_pct"), 0.0)
        ihhl = to_float(swachh.get(code, {}).get("ihhl_coverage_pct"), 0.0)
        niti_row = niti.get(code)
        aspirational_rank = int(to_float(niti_row["rank"])) if niti_row else None
        aspirational_score = to_float(niti_row["composite_score"]) if niti_row else None

        need_vals = need.get(code) or [0.0]
        planned_vals = planned.get(code) or [0.0]
        per_capita_need = sum(need_vals) / len(need_vals)
        per_capita_planned = sum(planned_vals) / len(planned_vals)

        # Infrastructure index 0-100: how well served the district is.
        infra_index = round(
            100
            * (
                0.34 * min(max(tap, 0.0), 1.0)
                + 0.28 * min(max(road, 0.0), 1.0)
                + 0.20 * min(max(odf_plus, 0.0), 100.0) / 100.0
                + 0.18 * min(max(ihhl, 0.0), 100.0) / 100.0
            ),
            1,
        )
        # Gap index: the complement, plus an explicit investment shortfall term.
        shortfall = (
            max(0.0, (per_capita_need - per_capita_planned) / per_capita_need)
            if per_capita_need > 0
            else 0.0
        )
        gap_index = round(min(100.0, (100 - infra_index) * 0.78 + shortfall * 100 * 0.22), 1)

        city, city_lat, city_lng = nearest_hub(state, lat, lng, hubs)

        ward_count = 4 + (int(abs(lat * 1000 + lng * 977)) % 6)
        wards = []
        for w in range(ward_count):
            angle = (w / ward_count) * math.tau
            spread = 0.06 + 0.02 * ((w + int(lat)) % 3)
            wards.append(
                {
                    "name": f"Ward {w + 1} — {WARD_SUFFIXES[(w + int(lng)) % len(WARD_SUFFIXES)]}",
                    "lat": round(lat + spread * math.sin(angle), 4),
                    "lng": round(lng + spread * math.cos(angle), 4),
                }
            )

        by_state[state].append(len(districts))
        districts.append(
            {
                "code": code,
                "name": name,
                "state": state,
                "state_code": row["state_code"],
                "lat": lat,
                "lng": lng,
                "population": population,
                "rural_pct": to_float(row["rural_pct"]),
                "sc_pct": to_float(row["sc_pct"]),
                "st_pct": to_float(row["st_pct"]),
                "literacy": to_float(row["literacy_rate"]),
                "sex_ratio": to_float(row["sex_ratio"]),
                "tap": round(tap, 3),
                "road": round(road, 3),
                "odf_plus": round(odf_plus, 1),
                "ihhl": round(ihhl, 1),
                "aspirational_rank": aspirational_rank,
                "aspirational_score": aspirational_score,
                "per_capita_need": round(per_capita_need, 1),
                "per_capita_planned": round(per_capita_planned, 1),
                "infra_index": infra_index,
                "gap_index": gap_index,
                "city": city,
                "city_lat": city_lat,
                "city_lng": city_lng,
                "wards": wards,
            }
        )

    # ---- states ----------------------------------------------------------
    states = []
    for state_name, indices in by_state.items():
        population = sum(districts[i]["population"] for i in indices)
        weighted_gap = sum(districts[i]["gap_index"] * districts[i]["population"] for i in indices) / max(
            population, 1
        )
        geo = geo_state.get(state_name)
        states.append(
            {
                "code": districts[indices[0]]["state_code"],
                "name": state_name,
                "lat": float(geo["lat"]) if geo else sum(districts[i]["lat"] for i in indices) / len(indices),
                "lng": float(geo["lng"]) if geo else sum(districts[i]["lng"] for i in indices) / len(indices),
                "population": population,
                "districts": len(indices),
                "gap_index": round(weighted_gap, 1),
            }
        )
    states.sort(key=lambda s: s["name"])

    # ---- template registry ---------------------------------------------
    registry: list[dict] = []
    registry_index: dict[tuple[str, str, str], int] = {}
    for lang, rows in TEMPLATES.items():
        for text, translation, sector, urgency in rows:
            key = (lang, text, sector)
            if key in registry_index:
                continue
            registry_index[key] = len(registry)
            registry.append(
                {
                    "id": len(registry),
                    "language": lang,
                    "text": text,
                    "translation": translation,
                    "sector": sector,
                    "category": SECTOR_CATEGORY[sector],
                    "urgency": urgency,
                    "action": SECTOR_ACTION[sector],
                    "severity": SECTOR_SEVERITY[sector],
                }
            )

    def pick_template(rng_: random.Random, state_name: str) -> int:
        primary, secondary, mixed = STATE_LANGUAGES.get(
            state_name, ("en", "en", "en")
        )
        roll = rng_.random()
        if roll < 0.62:
            lang = primary
        elif roll < 0.82:
            lang = mixed
        elif roll < 0.95:
            lang = secondary
        else:
            lang = "en"
        options = [t["id"] for t in registry if t["language"] == lang]
        if not options:
            options = [t["id"] for t in registry if t["language"] == "en"]
        return rng_.choice(options)

    LANG_INDEX = {lang: i for i, lang in enumerate(sorted(TEMPLATES))}
    CITY_INDEX = {city: i for i, city in enumerate(sorted({d["city"] for d in districts}))}

    # ---- citizen requests ----------------------------------------------
    # Stored as compact positional arrays: the emitted JSON is loaded
    # server-side on every cold start, so key repetition is pure overhead.
    # Tuple layout is mirrored by `lib/civic-data.ts` (RequestTuple).
    requests: list[list] = []
    rid = 100000
    today = 18262  # deterministic "days since epoch" anchor, see note below

    def emit(district: dict, template_id: int, source: str, age_days: int) -> None:
        nonlocal rid
        tpl = registry[template_id]
        ward = rng.choice(district["wards"])
        repeat_word = rng.choice(REPEATS.get(tpl["language"], [""])) if rng.random() < 0.3 else ""
        filler = rng.choice(FILLERS.get(tpl["language"], [""])) if rng.random() < 0.45 else ""
        text = tpl["text"].replace("{repeat}", repeat_word).replace("{filler}", filler)
        text = " ".join(text.split())
        urgency = max(1, min(5, tpl["urgency"] + rng.choice([-1, 0, 0, 1])))
        severity = max(
            1.0,
            min(10.0, tpl["severity"] + (urgency - 3) * 0.35 + (district["gap_index"] - 50) / 90.0),
        )
        sentiment = "negative" if urgency >= 3 else "neutral"

        if age_days < 12:
            status = rng.choices(STATUSES, weights=[34, 26, 22, 14, 4], k=1)[0]
        elif age_days < 60:
            status = rng.choices(STATUSES, weights=[8, 14, 30, 34, 14], k=1)[0]
        else:
            status = rng.choices(STATUSES, weights=[2, 5, 14, 44, 35], k=1)[0]

        rid += 1
        # [id, day, districtCode, cityIdx, wardIdx, lat, lng, langIdx,
        #  templateId, urgency, severity, sentimentIdx, statusIdx, sourceIdx]
        requests.append(
            [
                rid,
                today - age_days,
                district["code"],
                CITY_INDEX[district["city"]],
                int(ward["name"].split(" ")[1]) - 1,
                round(ward["lat"] + rng.uniform(-0.012, 0.012), 4),
                round(ward["lng"] + rng.uniform(-0.012, 0.012), 4),
                LANG_INDEX[tpl["language"]],
                template_id,
                urgency,
                round(severity, 1),
                0 if sentiment == "negative" else 1,
                STATUSES.index(status),
                SOURCES.index(source),
            ]
        )

    for district in districts:
        deep = district["state"] in DEEP_STATES
        count = rng.randint(7, 13) if deep else rng.randint(2, 5)
        for _ in range(count):
            source = rng.choices(
                SOURCES,
                weights=[26, 22, 18, 12, 14, 5, 3],
                k=1,
            )[0]
            age = int(abs(rng.gauss(96, 78))) + 1
            emit(district, pick_template(rng, district["state"]), source, age)

    requests.sort(key=lambda r: (-r[1], r[0]))  # newest first

    meta = {
        "generated_by": "data/build_frontend_dataset.py",
        "seed": SEED,
        "day_anchor": today,
        "day_anchor_iso": "2026-09-30",
        "sources": [
            {"name": "Census of India 2011 — District Population", "tag": "CENSUS_2011"},
            {"name": "Jal Jeevan Mission — District Tap Water Coverage", "tag": "JJM_API"},
            {"name": "PMGSY — District Road Connectivity", "tag": "PMGSY_API"},
            {"name": "Swachh Bharat Mission — ODF / IHHL Coverage", "tag": "SWACHH_API"},
            {"name": "NITI Aayog Aspirational Districts Programme", "tag": "NITI_AAYOG"},
            {"name": "State Budget Investment Plans — Per Capita Need vs Spend", "tag": "BUDGET_DOCS"},
            {"name": "Realistic synthetic citizen requests (12 Indian languages)", "tag": "SYNTHETIC"},
        ],
        "counts": {
            "states": len(states),
            "districts": len(districts),
            "requests": len(requests),
            "templates": len(registry),
        },
    }

    return {
        "meta": meta,
        "states": states,
        "districts": districts,
        "templates": registry,
        # Shared enumerations so request tuples stay positional.
        "languages": sorted(TEMPLATES),
        "cities": sorted({d["city"] for d in districts}),
        "statuses": STATUSES,
        "sources": SOURCES,
        "sentiments": ["negative", "neutral", "positive"],
        "requests": requests,
    }


def main() -> None:
    payload = build()
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, separators=(",", ":"))
    size_mb = os.path.getsize(OUT) / (1024 * 1024)
    c = payload["meta"]["counts"]
    print(
        f"wrote {OUT} ({size_mb:.2f} MB)\n"
        f"  states    : {c['states']}\n"
        f"  districts : {c['districts']}\n"
        f"  requests  : {c['requests']}\n"
        f"  templates : {c['templates']}"
    )


if __name__ == "__main__":
    main()
