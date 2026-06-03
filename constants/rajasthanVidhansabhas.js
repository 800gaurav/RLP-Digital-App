export const RAJASTHAN_VIDHANSABHA_BY_DISTRICT = {
  Ajmer: ['Kishangarh', 'Pushkar', 'Ajmer North', 'Ajmer South (SC)', 'Nasirabad', 'Masuda'],
  Alwar: ['Behror', 'Alwar Rural (SC)', 'Alwar Urban', 'Ramgarh', 'Rajgarh Laxmangarh (ST)'],
  Anupgarh: ['Raisinghnagar (SC)', 'Khajuwala (SC)'],
  Balotra: ['Baytoo', 'Pachpadra', 'Siwana'],
  Banswara: ['Sagwara (ST)', 'Chorasi (ST)', 'Ghatol (ST)', 'Garhi (ST)', 'Banswara (ST)', 'Bagidora (ST)', 'Kushalgarh (ST)'],
  Baran: ['Anta', 'Kishanganj (ST)', 'Baran Atru (SC)', 'Chhabra'],
  Barmer: ['Sheo', 'Barmer', 'Gudha Malani', 'Chohtan (SC)'],
  Beawar: ['Beawar'],
  Bharatpur: ['Kathumar (SC)', 'Bharatpur', 'Nadbai', 'Weir (SC)', 'Bayana (SC)'],
  Bhilwara: ['Asind', 'Mandal', 'Sahara', 'Bhilwara', 'Mandalgarh'],
  Bikaner: ['Anupgarh (SC)', 'Bikaner West', 'Bikaner East', 'Kolayat', 'Lunkaransar', 'Dungargarh', 'Nokha'],
  Bundi: ['Hindoli', 'Bundi'],
  Chittorgarh: ['Mavli', 'Kapasan (SC)', 'Begun', 'Chittorgarh', 'Nimbahera', 'Bari Sadri'],
  Churu: ['Nohar', 'Bhadra', 'Sadulpur', 'Taranagar', 'Sardarshahar', 'Churu', 'Ratangarh', 'Sujangarh (SC)'],
  Dausa: ['Bassi (ST)', 'Chaksu (SC)', 'Thanagazi', 'Bandikui', 'Mahuwa', 'Sikrai (SC)', 'Dausa', 'Lalsot (ST)'],
  Deeg: ['Kaman', 'Nagar', 'Deeg-Kumher'],
  Dholpur: ['Baseri (SC)', 'Bari', 'Dholpur', 'Rajakhera'],
  'Didwana-Kuchaman': ['Ladnun', 'Deedwana', 'Makrana'],
  Dudu: ['Dudu (SC)'],
  Dungarpur: ['Dungarpur (ST)'],
  Ganganagar: ['Sadulshahar', 'Ganganagar', 'Karanpur', 'Suratgarh'],
  'Gangapur City': ['Gangapur', 'Bamanwas (ST)'],
  Hanumangarh: ['Sangaria', 'Hanumangarh', 'Pilibanga (SC)'],
  Jaipur: ['Shahpura', 'Jhotwara', 'Amber', 'Hawa Mahal', 'Vidhyadhar Nagar', 'Civil Lines', 'Kishanpole', 'Adarsh Nagar', 'Malviya Nagar', 'Sanganer'],
  'Jaipur Rural': ['Chomu', 'Phulera', 'Jamwa Ramgarh (ST)', 'Bagru (SC)', 'Bansur'],
  Jaisalmer: ['Jaisalmer'],
  Jalore: ['Ahore', 'Jalore (SC)', 'Bhinmal'],
  Jhalawar: ['Dag (SC)', 'Jhalrapatan', 'Khanpur'],
  Jhunjhunu: ['Pilani (SC)', 'Surajgarh', 'Jhunjhunu', 'Mandawa', 'Nawalgarh', 'Udaipurwati', 'Khetri'],
  Jodhpur: ['Bhopalgarh (SC)', 'Sardarpura', 'Jodhpur', 'Soorsagar', 'Pokaran'],
  'Jodhpur Rural': ['Shergarh', 'Luni'],
  Karauli: ['Todabhim (ST)', 'Hindaun (SC)', 'Karauli', 'Sapotra (ST)'],
  Kekri: ['Kekri'],
  'Khairthal-Tijara': ['Tijara', 'Kishangarh Bas', 'Mundawar'],
  Kota: ['Keshoraipatan (SC)', 'Pipalda', 'Sangod', 'Kota North', 'Kota South', 'Ladpura', 'Ramganj Mandi (SC)'],
  'Kotputli-Behror': ['Kotputli', 'Viratnagar'],
  Nagaur: ['Jayal (SC)', 'Nagaur', 'Khinwsar', 'Parbatsar', 'Nawan'],
  'Neem Ka Thana': ['Neem Ka Thana'],
  Pali: ['Jaitaran', 'Sojat (SC)', 'Pali', 'Marwar Junction', 'Bali', 'Sumerpur', 'Osian', 'Bilara (SC)'],
  Phalodi: ['Phalodi', 'Lohawat'],
  Pratapgarh: ['Dhariawad (ST)', 'Pratapgarh (ST)'],
  Rajsamand: ['Merta (SC)', 'Bhim', 'Kumbhalgarh', 'Rajsamand', 'Nathdwara'],
  Salumbar: ['Salumber (ST)'],
  Sanchore: ['Sanchore', 'Raniwara'],
  'Sawai Madhopur': ['Sawai Madhopur', 'Khandar (SC)'],
  Shahpura: ['Shahpura (SC)', 'Jahazpur'],
  Sikar: ['Fatehpur', 'Lachhmangarh', 'Dhod (SC)', 'Sikar', 'Danta Ramgarh', 'Khandela', 'Srimadhopur'],
  Sirohi: ['Sirohi', 'Pindwara-Abu (ST)', 'Reodar (SC)'],
  Tonk: ['Malpura', 'Niwai (SC)', 'Tonk', 'Deoli-Uniara'],
  Udaipur: ['Gogunda (ST)', 'Jhadol (ST)', 'Kherwara (ST)', 'Udaipur Rural (ST)', 'Udaipur', 'Aspur'],
};

export const RAJASTHAN_VIDHANSABHAS = Array.from(
  new Set(Object.values(RAJASTHAN_VIDHANSABHA_BY_DISTRICT).flat()),
).sort((a, b) => a.localeCompare(b));

export function getVidhansabhasForDistrict(district) {
  return RAJASTHAN_VIDHANSABHA_BY_DISTRICT[String(district || '').trim()] || [];
}

export function isKnownRajasthanVidhansabha(value) {
  return RAJASTHAN_VIDHANSABHAS.includes(String(value || '').trim());
}
