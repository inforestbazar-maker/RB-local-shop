export interface BangladeshLocationData {
  division: string;
  districts: {
    name: string;
    thanas: string[];
  }[];
}

export const BANGLADESH_LOCATIONS: BangladeshLocationData[] = [
  {
    division: "Dhaka (ঢাকা)",
    districts: [
      {
        name: "ঢাকা (Dhaka)",
        thanas: [
          "ধানমন্ডি (Dhanmondi)",
          "মোহাম্মদপুর (Mohammadpur)",
          "মিরপুর (Mirpur)",
          "তেজগাঁও (Tejgaon)",
          "গুলশান (Gulshan)",
          "উত্তরা (Uttara)",
          "মতিঝিল (Motijheel)",
          "পল্টন (Paltan)",
          "লালবাগ (Lalbagh)",
          "খিলগাঁও (Khilgaon)",
          "বাড্ডা (Badda)",
          "রামপুরা (Rampura)",
          "কাফরুল (Kafrul)",
          "কেরানীগঞ্জ (Keraniganj)",
          "সাভার (Savar)",
          "ধামরাই (Dhamrai)",
          "নবাবগঞ্জ (Nawabganj)",
          "দোহার (Dohar)"
        ]
      },
      {
        name: "গাজীপুর (Gazipur)",
        thanas: [
          "গাজীপুর সদর (Gazipur Sadar)",
          "টঙ্গী (Tongi)",
          "কালিয়াকৈর (Kaliakair)",
          "শ্রীপুর (Sreepur)",
          "কাপাসিয়া (Kapasia)",
          "কালীগঞ্জ (Kaliganj)"
        ]
      },
      {
        name: "নারায়ণগঞ্জ (Narayanganj)",
        thanas: [
          "নারায়ণগঞ্জ সদর (Narayanganj Sadar)",
          "সোনারগাঁও (Sonargaon)",
          "রূপগঞ্জ (Rupganj)",
          "আড়াইহাজার (Araihazar)",
          "বন্দর (Bandar)",
          "সিদ্ধিরগঞ্জ (Siddhirganj)"
        ]
      },
      {
        name: "টাঙ্গাইল (Tangail)",
        thanas: [
          "টাঙ্গাইল সদর (Tangail Sadar)",
          "মির্জাপুর (Mirzapur)",
          "দেলদুয়ার (Delduar)",
          "নাগরপুর (Nagarpur)",
          "বাসাইল (Basail)",
          "কালীহাতী (Kalihati)",
          "ঘাটাইল (Ghatail)",
          "গোপালপুর (Gopalpur)",
          "মধুপুর (Madhupur)",
          "ধনবাড়ী (Dhanbari)",
          "ভূঞাপুর (Buapur)",
          "সখিপুর (Sakhipur)"
        ]
      },
      {
        name: "ফরিদপুর (Faridpur)",
        thanas: [
          "ফরিদপুর সদর (Faridpur Sadar)",
          "বোয়ালমারী (Boalmari)",
          "আলফাডাঙ্গা (Alfadanga)",
          "মধুখালী (Madhukhali)",
          "নগরকান্দা (Nagarkanda)",
          "সালথা (Saltha)",
          "ভাঙ্গা (Bhanga)",
          "সদরপুর (Sadarpur)",
          "চরভদ্রাসন (Charbhadrasan)"
        ]
      },
      {
        name: "মানিকগঞ্জ (Manikganj)",
        thanas: [
          "মানিকগঞ্জ সদর (Manikganj Sadar)",
          "সিংগাইর (Singair)",
          "সাটুরিয়া (Saturia)",
          "শিবালয় (Shibalaya)",
          "ঘিওর (Ghior)",
          "দৌলতপুর (Daulatpur)",
          "হরিরামপুর (Harirampur)"
        ]
      },
      {
        name: "মুন্সীগঞ্জ (Munshiganj)",
        thanas: [
          "মুন্সীগঞ্জ সদর (Munshiganj Sadar)",
          "শ্রীনগর (Sreenagar)",
          "সিরাজদিখান (Sirajdikhan)",
          "লৌহজং (Louhajang)",
          "টংগীবাড়ী (Tongibari)",
          "গজারিয়া (Garia)"
        ]
      },
      {
        name: "নরসিংদী (Narsingdi)",
        thanas: [
          "নরসিংদী সদর (Narsingdi Sadar)",
          "পলাশ (Palash)",
          "শিবপুর (Shibpur)",
          "মনোহরদী (Monohardi)",
          "বেলাবো (Belabo)",
          "রায়পুরা (Raipura)"
        ]
      },
      {
        name: "রাজবাড়ী (Rajbari)",
        thanas: [
          "রাজবাড়ী সদর (Rajbari Sadar)",
          "পাংশা (Pangsha)",
          "কালুখালী (Kalukhali)",
          "বালিয়াকান্দি (Baliakandi)",
          "গোয়ালন্দ (Goalanda)"
        ]
      },
      {
        name: "গোপালগঞ্জ (Gopalganj)",
        thanas: [
          "গোপালগঞ্জ সদর (Gopalganj Sadar)",
          "টুঙ্গিপাড়া (Tungipara)",
          "কোটালীপাড়া (Kotalipara)",
          "মুকসুদপুর (Muksudpur)",
          "কাসিয়ানী (Kashiani)"
        ]
      },
      {
        name: "মাদারীপুর (Madaripur)",
        thanas: [
          "মাদারীপুর সদর (Madaripur Sadar)",
          "শিবচর (Shivchar)",
          "কালকিনি (Kalkini)",
          "রাজৈর (Rajoir)",
          "ডাসার (Dasar)"
        ]
      },
      {
        name: "শরীয়তপুর (Shariatpur)",
        thanas: [
          "শরীয়তপুর সদর (Shariatpur Sadar)",
          "জাজিরা (Zajira)",
          "নড়িয়া (Naria)",
          "ভেদেরগঞ্জ (Bhedarganj)",
          "ডামুড্যা (Damudya)",
          "গোসাইরহাট (Gosairhat)"
        ]
      },
      {
        name: "কিশোরগঞ্জ (Kishoreganj)",
        thanas: [
          "কিশোরগঞ্জ সদর (Kishoreganj Sadar)",
          "ভৈরব (Bhairab)",
          "বাজিতপুর (Bajitpur)",
          "কুলিয়ারচর (Kuliarchar)",
          "পাকুন্দিয়া (Pakundia)",
          "হোসেনপুর (Hossainpur)",
          "করিমগঞ্জ (Karimganj)",
          "তাড়াইল (Tarail)",
          "ইটনা (Itna)",
          "মিঠামইন (Mithamain)",
          "অস্টগ্রাম (Austagram)",
          "নিকলী (Nikli)",
          "কটিয়াদী (Katiadi)"
        ]
      }
    ]
  },
  {
    division: "Chattogram (চট্টগ্রাম)",
    districts: [
      {
        name: "চট্টগ্রাম (Chattogram)",
        thanas: [
          "পাঁচলাইশ (Panchlaish)",
          "ডবলমুরিং (Double Mooring)",
          "হালিশহর (Halishahar)",
          "কোতোয়ালী (Kotwali)",
          "খুলশী (Khulshi)",
          "বায়েজিদ (Bayezid)",
          "পতেঙ্গা (Patenga)",
          "পাহাড়তলী (Pahartali)",
          "সীতাকুণ্ড (Sitakunda)",
          "মীরসরাই (Mirsharai)",
          "হাটহাজারী (Hathazari)",
          "পটিয়া (Patiya)",
          "বোয়ালখালী (Boalkhali)",
          "আনোয়ারা (Anwara)",
          "বাঁশখালী (Banshkhali)",
          "চন্দনাইশ (Chandanaiish)",
          "রাউজান (Raozan)",
          "রাঙ্গুনিয়া (Rangunia)",
          "সাতকানিয়া (Satkania)",
          "লোহাগাড়া (Lohagara)",
          "সন্দ্বীপ (Sandwip)"
        ]
      },
      {
        name: "কক্সবাজার (Cox's Bazar)",
        thanas: [
          "কক্সবাজার সদর (Cox's Bazar Sadar)",
          "উখিয়া (Ukhia)",
          "টেকনাফ (Teknaf)",
          "রামু (Ramu)",
          "চকরিয়া (Chakaria)",
          "পেকুয়া (Pekua)",
          "মহেশখালী (Maheshkhali)",
          "কুতুবদিয়া (Kutubdia)"
        ]
      },
      {
        name: "কুমিল্লা (Comilla)",
        thanas: [
          "কুমিল্লা সদর (Comilla Sadar)",
          "চান্দিনা (Chandina)",
          "দাউদকান্দি (Daudkandi)",
          "দেবীদ্বার (Debidwar)",
          "মুরাদনগর (Muradnagar)",
          "চৌদ্দগ্রাম (Chauddagram)",
          "লাকসাম (Laksam)",
          "বরুড়া (Barura)",
          "বুড়িচং (Burichang)",
          "ব্রাহ্মণপাড়া (Brahmanpara)",
          "মনোহরগঞ্জ (Monohargonj)",
          "মেঘনা (Meghna)",
          "তিতাস (Titas)",
          "হোমনা (Homna)",
          "নাঙ্গলকোট (Nangalkot)"
        ]
      },
      {
        name: "ফেনী (Feni)",
        thanas: [
          "ফেনী সদর (Feni Sadar)",
          "দাগনভূঞা (Daganbhuiyan)",
          "সোনাগাজী (Sonagazi)",
          "ছাগলনাইয়া (Chhagalnaiya)",
          "পরশুরাম (Parshuram)",
          "ফুলগাজী (Fulgazi)"
        ]
      },
      {
        name: "নোয়াখালী (Noakhali)",
        thanas: [
          "নোয়াখালী সদর (Noakhali Sadar)",
          "বেগমগঞ্জ (Begumganj)",
          "চাটখিল (Chatkhil)",
          "সেনবাগ (Senbagh)",
          "কোম্পানীগঞ্জ (Companiganj)",
          "হাতিয়া (Hatiya)",
          "কবিরহাট (Kabirhat)",
          "সোনাইমুড়ী (Sonaimuri)",
          "সুবর্ণচর (Subarnachar)"
        ]
      },
      {
        name: "লক্ষ্মীপুর (Lakshmipur)",
        thanas: [
          "লক্ষ্মীপুর সদর (Lakshmipur Sadar)",
          "রায়পুর (Raipur)",
          "রামগঞ্জ (Ramganj)",
          "রামগতি (Ramgati)",
          "কমলনগর (Kamalnagar)"
        ]
      },
      {
        name: "চাঁদপুর (Chandpur)",
        thanas: [
          "চাঁদপুর সদর (Chandpur Sadar)",
          "হাজীগঞ্জ (Hajiganj)",
          "শাহরাস্তি (Shahrasti)",
          "মতলব উত্তর (Matlab North)",
          "মতলব দক্ষিণ (Matlab South)",
          "ফরিদগঞ্জ (Faridganj)",
          "হাইমচর (Haimchar)",
          "কচুয়া (Kachua)"
        ]
      },
      {
        name: "রাঙ্গামাটি (Rangamati)",
        thanas: [
          "রাঙ্গামাটি সদর (Rangamati Sadar)",
          "কাপ্তাই (Kaptai)",
          "কাউখালী (Kawkhali)",
          "বাঘাইছড়ি (Baghaichhari)",
          "লংগদু (Langadu)",
          "নানিয়ারচর (Naniarchar)",
          "জুরাছড়ি (Jurachhari)",
          "বরকল (Barkal)",
          "রাজস্থলী (Rajasthali)"
        ]
      },
      {
        name: "খাগড়াছড়ি (Khagrachhari)",
        thanas: [
          "খাগড়াছড়ি সদর (Khagrachhari Sadar)",
          "দিঘীनाला (Dighinala)",
          "পানছড়ি (Panchhari)",
          "মাটিরাঙ্গা (Matiranga)",
          "মহালছড়ি (Mahalchhari)",
          "মানিকছড়ি (Manikchhari)",
          "রামগড় (Ramgarh)",
          "লক্ষ্মীছড়ি (Laxmichhari)",
          "গুইমারা (Guimara)"
        ]
      },
      {
        name: "বান্দরবান (Bandarban)",
        thanas: [
          "বান্দরবান সদর (Bandarban Sadar)",
          "রুমা (Ruma)",
          "থানচি (Thanchi)",
          "রোয়াংছড়ি (Rowangchhari)",
          "লামা (Lama)",
          "আলীকদম (Alikadam)",
          "নাইক্ষ্যংছড়ি (Naikhongchhari)"
        ]
      },
      {
        name: "ব্রাহ্মণবাড়িয়া (Brahmanbaria)",
        thanas: [
          "ব্রাহ্মণবাড়িয়া সদর (Brahmanbaria Sadar)",
          "আশুগঞ্জ (Ashuganj)",
          "সরাইল (Sarail)",
          "কসবা (Kasba)",
          "আখাউড়া (Akhaura)",
          "নবীনগর (Nabinagar)",
          "বাঞ্ছারামপুর (Bancharampur)",
          "বিজয়নগর (Bijoynagar)"
        ]
      }
    ]
  },
  {
    division: "Rajshahi (রাজশাহী)",
    districts: [
      {
        name: "রাজশাহী (Rajshahi)",
        thanas: [
          "বোয়ালিয়া (Boalia)",
          "মতিহার (Motihar)",
          "রাজপাড়া (Rajpara)",
          "শাহ মখদুম (Shah Makhdum)",
          "পবা (Paba)",
          "বাঘমারা (Bagmara)",
          "গোদাগাড়ী (Godagari)",
          "তানোর (Tanor)",
          "পুঠিয়া (Puthia)",
          "চারঘাট (Charghat)",
          "বাঘা (Bagha)",
          "দুর্গাপুর (Durgapur)",
          "মোহনপুর (Mohanpur)"
        ]
      },
      {
        name: "বগুড়া (Bogura)",
        thanas: [
          "বগুড়া সদর (Bogura Sadar)",
          "শেরপুর (Sherpur)",
          "শাজাহানপুর (Shajahanpur)",
          "দুপচাঁচিয়া (Dupchanchia)",
          "শিবগঞ্জ (Shibganj)",
          "ধুনট (Dhunat)",
          "গাবতলী (Gabtali)",
          "কাহালু (Kahalu)",
          "নন্দীগ্রাম (Nandigram)",
          "সারিয়াকান্দি (Sariakandi)",
          "সোনাতলা (Sonatola)",
          "আদমদীঘি (Adamdighi)"
        ]
      },
      {
        name: "পাবনা (Pabna)",
        thanas: [
          "পাবনা সদর (Pabna Sadar)",
          "ঈশ্বরদী (Ishwardi)",
          "আটঘরিয়া (Atgharia)",
          "চাটমোহর (Chatmohar)",
          "ভাঙ্গুড়া (Bhangura)",
          "ফরিদপুর (Faridpur)",
          "বেড়া (Bera)",
          "সাঁথিয়া (Santhia)",
          "সুজানগর (Sujanagar)"
        ]
      },
      {
        name: "নাটোর (Natore)",
        thanas: [
          "নাটোর সদর (Natore Sadar)",
          "সিংড়া (Singra)",
          "বড়াইগ্রাম (Baraigram)",
          "গুরুদাসপুর (Gurudaspur)",
          "লালপুর (Lalpur)",
          "বাগাতীপাড়া (Bagatipara)",
          "নলডাঙ্গা (Naldanga)"
        ]
      },
      {
        name: "নওগাঁ (Naogaon)",
        thanas: [
          "নওগাঁ সদর (Naogaon Sadar)",
          "রানীনগর (Raninagar)",
          "আত্রাই (Atrai)",
          "মহাদেবপুর (Mahadevpur)",
          "মান্দা (Manda)",
          "বদলগাছী (Badalgachhi)",
          "পত্নীতলা (Patnitala)",
          "ধামইরহাট (Dhamoirhat)",
          "নিয়ামতপুর (Niamatpur)",
          "সাপাহার (Sapahar)",
          "পোরশা (Porsha)"
        ]
      },
      {
        name: "জয়পুরহাট (Joypurhat)",
        thanas: [
          "জয়পুরহাট সদর (Joypurhat Sadar)",
          "পাঁচবিবি (Panchbibi)",
          "ক্ষেতলাল (Khetlal)",
          "কালাই (Kalai)",
          "আক্কেলপুর (Akkelpur)"
        ]
      },
      {
        name: "চাঁপাইনবাবগঞ্জ (Chapainawabganj)",
        thanas: [
          "চাঁপাইনবাবগঞ্জ সদর (Chapainawabganj Sadar)",
          "শিবগঞ্জ (Shibganj)",
          "গোমস্তাপুর (Gomastapur)",
          "নাচোল (Nachole)",
          "ভোলাহাট (Bholahat)"
        ]
      },
      {
        name: "সিরাজগঞ্জ (Sirajganj)",
        thanas: [
          "সিরাজগঞ্জ সদর (Sirajganj Sadar)",
          "শাহজাদপুর (Shahjadpur)",
          "উল্লাপাড়া (Ullapara)",
          "রায়গঞ্জ (Raiganj)",
          "তাড়াশ (Tarash)",
          "কাজীপুর (Kazipur)",
          "বেলকুচি (Belkuchi)",
          "চৌহালী (Chauhali)",
          "কামারখন্দ (Kamarkhanda)"
        ]
      }
    ]
  },
  {
    division: "Khulna (খুলনা)",
    districts: [
      {
        name: "খুলনা (Khulna)",
        thanas: [
          "খুলনা সদর (Khulna Sadar)",
          "সোনাডাঙ্গা (Sonadanga)",
          "খালিশপুর (Khalishpur)",
          "দৌলতপুর (Daulatpur)",
          "ফুলতলা (Phultala)",
          "বটিয়াঘাটা (Batiaghata)",
          "দিঘলিয়া (Dighalia)",
          "ডুমুরিয়া (Dumuria)",
          "পাইকগাছা (Paikgachha)",
          "কয়রা (Koyra)",
          "রূপসা (Rupsha)",
          "তেরখাদা (Terokhada)"
        ]
      },
      {
        name: "যশোর (Jessore)",
        thanas: [
          "যশোর সদর (Jessore Sadar)",
          "ঝিকরগাছা (Jhikargachha)",
          "শার্শা (Sharsha)",
          "মণিরামপুর (Manirampur)",
          "কেশবপুর (Keshabpur)",
          "বাঘারপাড়া (Bagherpara)",
          "অভয়নগর (Abhaynagar)",
          "চৌগাছা (Chaugachha)"
        ]
      },
      {
        name: "বাগেরহাট (Bagerhat)",
        thanas: [
          "বাগেরহাট সদর (Bagerhat Sadar)",
          "মংলা (Mongla)",
          "ফকীরহাট (Fakirhat)",
          "রামপাল (Rampal)",
          "চিতলমারী (Chitalmari)",
          "মোল্লাহাট (Mollahat)",
          "কচুয়া (Kachua)",
          "মোড়েলগঞ্জ (Morelganj)",
          "শরণখোলা (Sarankhola)"
        ]
      },
      {
        name: "চুয়াডাঙ্গা (Chuadanga)",
        thanas: [
          "চুয়াডাঙ্গা সদর (Chuadanga Sadar)",
          "আলমডাঙ্গা (Alamdanga)",
          "দামুড়হুদা (Damurhuda)",
          "জীবননগর (Jibannagar)"
        ]
      },
      {
        name: "ঝিনাইদহ (Jhenaidah)",
        thanas: [
          "ঝিনাইদহ সদর (Jhenaidah Sadar)",
          "কালীগঞ্জ (Kaliganj)",
          "শৈলকূপা (Shailkupa)",
          "কোটচাঁদপুর (Kotchandpur)",
          "মহেশপুর (Maheshpur)",
          "হরিণাকুণ্ডু (Harinakunda)"
        ]
      },
      {
        name: "কুষ্টিয়া (Kushtia)",
        thanas: [
          "কুষ্টিয়া সদর (Kushtia Sadar)",
          "কুমারখালী (Kumarkhali)",
          "খোকসা (Khoksa)",
          "ভেড়ামারা (Bheramara)",
          "মিরপুর (Mirpur)",
          "দৌলতপুর (Daulatpur)"
        ]
      },
      {
        name: "মাগুরা (Magura)",
        thanas: [
          "মাগুরা সদর (Magura Sadar)",
          "শ্রীপুর (Sreepur)",
          "শালিখা (Shalikha)",
          "মোহাম্মাদপুর (Mohammadpur)"
        ]
      },
      {
        name: "মেহেরপুর (Meherpur)",
        thanas: [
          "মেহেরপুর সদর (Meherpur Sadar)",
          "মুজিবনগর (Mujibnagar)",
          "গাংনী (Gangni)"
        ]
      },
      {
        name: "নড়াইল (Narail)",
        thanas: [
          "নড়াইল সদর (Narail Sadar)",
          "লোহাগড়া (Lohagara)",
          "কালিয়া (Kalia)"
        ]
      },
      {
        name: "সাতক্ষীরা (Satkhira)",
        thanas: [
          "সাতক্ষীরা সদর (Satkhira Sadar)",
          "কলারোয়া (Kalaroa)",
          "তালা (Tala)",
          "দেবহাটা (Debhata)",
          "калиগঞ্জ (Kaliganj)",
          "আশাশুনি (Assasuni)",
          "শ্যামনগর (Shyamnagar)"
        ]
      }
    ]
  },
  {
    division: "Sylhet (সিলেট)",
    districts: [
      {
        name: "সিলেট (Sylhet)",
        thanas: [
          "কোতোয়ালী (Kotwali)",
          "সিলেট সদর (Sylhet Sadar)",
          "বিয়ানীবাজার (Beanibazar)",
          "গোলাপগঞ্জ (Golapganj)",
          "ফেঞ্চুগঞ্জ (Fenchuganj)",
          "দক্ষিণ সুরমা (South Surma)",
          "জাইন্তাপুর (Jaintiapur)",
          "কানাইঘাট (Kanaighat)",
          "কোম্পানীগঞ্জ (Companiganj)",
          "গোয়াইনঘাট (Gowainghat)",
          "জকিগঞ্জ (Zakiganj)",
          "বিশ্বনাথ (Bishwanath)",
          "বালাগঞ্জ (Balaganj)"
        ]
      },
      {
        name: "মৌলভীবাজার (Moulvibazar)",
        thanas: [
          "মৌলভীবাজার সদর (Moulvibazar Sadar)",
          "শ্রীমঙ্গল (Sreemangal)",
          "কমলগঞ্জ (Kamalganj)",
          "কুলাউড়া (Kulaura)",
          "বড়লেখা (Barlekha)",
          "জুড়ী (Juri)",
          "রাজনগর (Rajnagar)"
        ]
      },
      {
        name: "হবিগঞ্জ (Habiganj)",
        thanas: [
          "হবিগঞ্জ সদর (Habiganj Sadar)",
          "মাধবপুর (Madhabpur)",
          "চুনারুঘাট (Chunarughat)",
          "বাহুবল (Bahubal)",
          "নবীগঞ্জ (Nabiganj)",
          "বানিয়াচং (Baniachong)",
          "আজমিরীগঞ্জ (Ajmiriganj)",
          "লাখাই (Lakhai)",
          "শায়েস্তাগঞ্জ (Shayestaganj)"
        ]
      },
      {
        name: "সুনামগঞ্জ (Sunamganj)",
        thanas: [
          "সুনামগঞ্জ সদর (Sunamganj Sadar)",
          "ছাতক (Chhatak)",
          "দোয়ারাবাজার (Dowarabazar)",
          "জগন্নাথপুর (Jagannathpur)",
          "দিরাই (Derai)",
          "শাল্লা (Shalla)",
          "ধর্মপাশা (Dharmapasha)",
          "জামালগঞ্জ (Jamalganj)",
          "তাহিরপুর (Tahirpur)",
          "বিশ্বম্ভরপুর (Bishwamambharpur)",
          "শান্তিগঞ্জ (Shantiganj)"
        ]
      }
    ]
  },
  {
    division: "Barishal (বরিশাল)",
    districts: [
      {
        name: "বরিশাল (Barishal)",
        thanas: [
          "বরিশাল সদর (Barishal Sadar)",
          "বাকেরগঞ্জ (Bakerganj)",
          "গৌরনদী (Gournadi)",
          "উজিরপুর (Ujirpur)",
          "বাবুগঞ্জ (Babuganj)",
          "মুলাদী (Muladi)",
          "হিজলা (Hijla)",
          "মেহেন্দিগঞ্জ (Mehendiganj)",
          "বানারীপাড়া (Banaripara)",
          "আগৈলঝাড়া (Agailjhara)"
        ]
      },
      {
        name: "বরগুনা (Barguna)",
        thanas: [
          "বরগুনা সদর (Barguna Sadar)",
          "আমতলী (Amtali)",
          "পাথরঘাটা (Patharghata)",
          "বেতাগী (Betagi)",
          "বামনা (Bamna)",
          "তালতলী (Taltali)"
        ]
      },
      {
        name: "ভোলা (Bhola)",
        thanas: [
          "ভোলা সদর (Bhola Sadar)",
          "দৌলতখান (Daulatkhan)",
          "বোরহানউদ্দিন (Borhanuddin)",
          "তজুমদ্দিন (Tajumuddin)",
          "লালমোহন (Lalmohan)",
          "চরফ্যাশন (Char Fasson)",
          "মনপুরা (Manpura)"
        ]
      },
      {
        name: "ঝালকাঠি (Jhalokati)",
        thanas: [
          "ঝালকাঠি সদর (Jhalokati Sadar)",
          "নলছিটি (Nalchity)",
          "রাজাপুর (Rajapur)",
          "কাঁঠালিয়া (Kathalia)"
        ]
      },
      {
        name: "পটুয়াখালী (Patuakhali)",
        thanas: [
          "পটুয়াখালী সদর (Patuakhali Sadar)",
          "গলাচিপা (Galachipa)",
          "দশমিনা (Dashmina)",
          "বাউফল (Bauphal)",
          "মির্জাগঞ্জ (Mirzaganj)",
          "কলাপাড়া (Kalapara)",
          "দুমকি (Dumki)",
          "রাঙ্গাবালী (Rangabali)"
        ]
      },
      {
        name: "পিরোজপুর (Pirojpur)",
        thanas: [
          "পিরোজপুর সদর (Pirojpur Sadar)",
          "নেছারাবাদ (Nesarabad)",
          "ভান্ডারিয়া (Bhandaria)",
          "মঠবাড়িয়া (Mathbaria)",
          "কাউখালী (Kawkhali)",
          "নাজিরপুর (Nazirpur)",
          "ইন্দুরকানী (Indurkani)"
        ]
      }
    ]
  },
  {
    division: "Rangpur (রংপুর)",
    districts: [
      {
        name: "রংপুর (Rangpur)",
        thanas: [
          "রংপুর সদর (Rangpur Sadar)",
          "মিঠাপুকুর (Mithapukur)",
          "পীরগঞ্জ (Pirganj)",
          "পীরগাছা (Pirgachha)",
          "কাউনিয়া (Kaunia)",
          "গঙ্গাচড়া (Gangachhara)",
          "বদরগঞ্জ (Badarganj)",
          "তারাগঞ্জ (Taraganj)"
        ]
      },
      {
        name: "দিনাজপুর (Dinajpur)",
        thanas: [
          "দিনাজপুর সদর (Dinajpur Sadar)",
          "বিরামপুর (Birampur)",
          "বীরগঞ্জ (Birganj)",
          "বোচাগঞ্জ (Bochaganj)",
          "ফুলবাড়ী (Phulbari)",
          "ঘোড়াঘাট (Ghoraghat)",
          "হাকিমপুর (Hakirpur)",
          "কাহারোল (Kaharole)",
          "খানসামা (Khansama)",
          "নওয়াবগঞ্জ (Nawabganj)",
          "পার্বতীপুর (Parbatipur)",
          "বিরল (Biral)"
        ]
      },
      {
        name: "গাইবান্ধা (Gaibandha)",
        thanas: [
          "গাইবান্ধা সদর (Gaibandha Sadar)",
          "গোবিন্দগঞ্জ (Gobindaganj)",
          "সুন্দরগঞ্জ (Sundarganj)",
          "পলাশবাড়ী (Palashbari)",
          "সাদুল্লাপুর (Sadullapur)",
          "সাঘাটা (Saghata)",
          "ফুলছড়ি (Phulchhari)"
        ]
      },
      {
        name: "কুড়িগ্রাম (Kurigram)",
        thanas: [
          "কুড়িগ্রাম সদর (Kurigram Sadar)",
          "নাগেশ্বরী (Nageshwari)",
          "ভূরুঙ্গামারী (Bhurungamari)",
          "ফুলবাড়ী (Phulbari)",
          "রাজারহাট (Rajarhat)",
          "উলিপুর (Ulipur)",
          "চিলমারী (Chilmari)",
          "রৌমারী (Roumari)",
          "রাজীবপুর (Rajibpur)"
        ]
      },
      {
        name: "লালমনিরহাট (Lalmonirhat)",
        thanas: [
          "লালমনিরহাট সদর (Lalmonirhat Sadar)",
          "আদীতমারী (Aditmari)",
          "কালীগঞ্জ (Kaliganj)",
          "হাতীবান্ধা (Hatibandha)",
          "পাটগ্রাম (Patgram)"
        ]
      },
      {
        name: "নীলফামারী (Nilphamari)",
        thanas: [
          "নীলফামারী সদর (Nilphamari Sadar)",
          "সৈয়দপুর (Saidpur)",
          "ডোমার (Domar)",
          "ডিমলা (Dimla)",
          "জলঢাকা (Jaldhaka)",
          "কিশোরগঞ্জ (Kishoreganj)"
        ]
      },
      {
        name: "পঞ্চগড় (Panchagarh)",
        thanas: [
          "পঞ্চগড় সদর (Panchagarh Sadar)",
          "তেঁতুলিয়া (Tetulia)",
          "বোদা (Boda)",
          "দেবীগঞ্জ (Debiganj)",
          "আটোয়ারী (Atwari)"
        ]
      },
      {
        name: "ঠাকুরগাঁও (Thakurgaon)",
        thanas: [
          "ঠাকুরগাঁও সদর (Thakurgaon Sadar)",
          "পীরগঞ্জ (Pirganj)",
          "বালীয়াডাঙ্গী (Baliadangi)",
          "হরিপুর (Haripur)",
          "রানীশংকৈল (Ranisankail)"
        ]
      }
    ]
  },
  {
    division: "Mymensingh (ময়মনসিংহ)",
    districts: [
      {
        name: "ময়মনসিংহ (Mymensingh)",
        thanas: [
          "ময়মনসিংহ সদর (Mymensingh Sadar)",
          "ভালুকা (Bhaluka)",
          "ত্রিশাল (Trishal)",
          "মুক্তাগাছা (Muktagachha)",
          "গফরগাঁও (Gafargaon)",
          "ঈশ্বরগঞ্জ (Ishwarganj)",
          "নান্দাইল (Nandail)",
          "ফুলবাড়ীয়া (Phulbaria)",
          "ধোবাউড়া (Dhobaura)",
          "ফুলপুর (Phulpur)",
          "হালুয়াঘাট (Haluaghat)",
          "তারাকান্দা (Tarakanda)"
        ]
      },
      {
        name: "জামালপুর (Jamalpur)",
        thanas: [
          "জামালপুর সদর (Jamalpur Sadar)",
          "সরিষাবাড়ী (Sarishabari)",
          "মেলান্দহ (Melandaha)",
          "ইসলামপুর (Islampur)",
          "দেওয়ানগঞ্জ (Dewanganj)",
          "মাদারগঞ্জ (Madarganj)",
          "বকশীগঞ্জ (Bakshiganj)"
        ]
      },
      {
        name: "নেত্রকোণা (Netrokona)",
        thanas: [
          "নেত্রকোণা সদর (Netrokona Sadar)",
          "পূর্বধলা (Purbadhala)",
          "মোহনগঞ্জ (Mohanganj)",
          "কলমাকান্দা (Kalmakanda)",
          "দুর্গাপুর (Durgapur)",
          "বারহাট্টা (Barhatta)",
          "আটপাড়া (Atpara)",
          "কেন্দুয়া (Kendua)",
          "মদন (Madan)",
          "খালিয়াজুড়ি (Khaliajuri)"
        ]
      },
      {
        name: "শেরপুর (Sherpur)",
        thanas: [
          "শেরপুর সদর (Sherpur Sadar)",
          "নালীতাবাড়ী (Nalitabari)",
          "শ্রীবরদী (Sreebardi)",
          "ঝিনাইগাতী (Jhenaigati)",
          "নকলা (Nakla)"
        ]
      }
    ]
  }
];

export const getAllDivisions = (): string[] => {
  return BANGLADESH_LOCATIONS.map(loc => loc.division);
};

/**
 * Normalizes any division input string ("Dhaka", "ঢাকা", "Dhaka (ঢাকা)", "Dhaka Division")
 * to match the exact division option in BANGLADESH_LOCATIONS or returns empty string if unmapped.
 */
export const normalizeDivisionName = (divisionInput?: string): string => {
  if (!divisionInput || !divisionInput.trim()) return '';
  const clean = divisionInput.trim().toLowerCase();

  for (const loc of BANGLADESH_LOCATIONS) {
    const locDiv = loc.division.toLowerCase();
    if (locDiv === clean) return loc.division;
  }

  for (const loc of BANGLADESH_LOCATIONS) {
    const locDiv = loc.division.toLowerCase();
    if (locDiv.includes(clean) || clean.includes(locDiv)) {
      return loc.division;
    }
  }

  const cleanTokens = clean.replace(/[(),.\-\/]/g, ' ').split(/\s+/).filter(t => t.length >= 2);
  for (const loc of BANGLADESH_LOCATIONS) {
    const locTokens = loc.division.toLowerCase().replace(/[(),.\-\/]/g, ' ').split(/\s+/).filter(t => t.length >= 2);
    if (cleanTokens.some(ct => locTokens.some(lt => ct === lt || ct.includes(lt) || lt.includes(ct)))) {
      return loc.division;
    }
  }

  return '';
};

export const getDistrictsForDivision = (divisionName: string) => {
  if (!divisionName) return [];
  const normalized = normalizeDivisionName(divisionName);
  if (normalized) {
    const matched = BANGLADESH_LOCATIONS.find(loc => loc.division === normalized);
    if (matched) return matched.districts;
  }

  const clean = divisionName.trim().toLowerCase();
  const matchedDiv = BANGLADESH_LOCATIONS.find((loc) => {
    const locClean = loc.division.toLowerCase();
    return locClean === clean || locClean.includes(clean) || clean.includes(locClean);
  });
  if (matchedDiv) return matchedDiv.districts;

  // Token matching fallback
  const cleanTokens = clean.replace(/[()]/g, ' ').split(/\s+/).filter(Boolean);
  for (const loc of BANGLADESH_LOCATIONS) {
    const locTokens = loc.division.toLowerCase().replace(/[()]/g, ' ').split(/\s+/).filter(Boolean);
    if (cleanTokens.some(ct => ct.length >= 2 && locTokens.some(lt => lt === ct || lt.includes(ct) || ct.includes(lt)))) {
      return loc.districts;
    }
  }

  return [];
};

/**
 * Normalizes any district input string to match the exact district option in BANGLADESH_LOCATIONS.
 * Checks for district match OR thana match (mapping thana input to its district if user had thana in district field).
 */
export const normalizeDistrictName = (divisionName: string, districtInput?: string): string => {
  if (!districtInput || !districtInput.trim()) return '';
  const cleanDist = districtInput.trim().toLowerCase();

  // Try inside specified division first
  const districts = getDistrictsForDivision(divisionName);
  for (const d of districts) {
    const dName = d.name.toLowerCase();
    if (dName === cleanDist || dName.includes(cleanDist) || cleanDist.includes(dName)) {
      return d.name;
    }
    for (const t of d.thanas) {
      const tClean = t.toLowerCase();
      if (tClean === cleanDist || tClean.includes(cleanDist) || cleanDist.includes(tClean)) {
        return d.name;
      }
    }
  }

  // Fallback search all divisions
  for (const loc of BANGLADESH_LOCATIONS) {
    for (const d of loc.districts) {
      const dName = d.name.toLowerCase();
      if (dName === cleanDist || dName.includes(cleanDist) || cleanDist.includes(dName)) {
        return d.name;
      }
      for (const t of d.thanas) {
        const tClean = t.toLowerCase();
        if (tClean === cleanDist || tClean.includes(cleanDist) || cleanDist.includes(tClean)) {
          return d.name;
        }
      }
    }
  }

  return '';
};

export const getThanasForDistrict = (divisionName: string, districtName: string) => {
  if (!districtName) return [];
  const normalizedDist = normalizeDistrictName(divisionName, districtName);
  const targetDist = normalizedDist || districtName.trim();

  // Search in division's districts
  const districts = divisionName ? getDistrictsForDivision(divisionName) : [];
  if (districts.length > 0) {
    const matchedDist = districts.find((d) => d.name === targetDist || isLocationMatch(d.name, targetDist));
    if (matchedDist) return matchedDist.thanas;
  }

  // Fallback: search ALL divisions
  for (const loc of BANGLADESH_LOCATIONS) {
    for (const d of loc.districts) {
      if (d.name === targetDist || isLocationMatch(d.name, targetDist)) {
        return d.thanas;
      }
    }
  }

  return [];
};

/**
 * Normalizes any thana input string to match the exact thana option in BANGLADESH_LOCATIONS.
 */
export const normalizeThanaName = (divisionName: string, districtName: string, thanaInput?: string): string => {
  if (!thanaInput || !thanaInput.trim()) return '';
  const cleanThana = thanaInput.trim().toLowerCase();

  const thanas = getThanasForDistrict(divisionName, districtName);
  for (const t of thanas) {
    const tClean = t.toLowerCase();
    if (tClean === cleanThana || tClean.includes(cleanThana) || cleanThana.includes(tClean)) {
      return t;
    }
  }

  // Fallback search across all thanas
  for (const loc of BANGLADESH_LOCATIONS) {
    for (const d of loc.districts) {
      for (const t of d.thanas) {
        const tClean = t.toLowerCase();
        if (tClean === cleanThana || tClean.includes(cleanThana) || cleanThana.includes(tClean)) {
          return t;
        }
      }
    }
  }

  return '';
};

/**
 * Flexible location string matching function.
 * Matches division/district/thana regardless of language (Bengali/English) or formatting like "Dhaka (ঢাকা)" vs "Dhaka".
 */
export const isLocationMatch = (locA?: string, locB?: string): boolean => {
  if (!locA || !locB) return true; // Empty strings/filters match everything
  const a = locA.trim().toLowerCase();
  const b = locB.trim().toLowerCase();
  if (!a || !b) return true;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  // Clean special characters and split into individual word tokens
  const tokensA = a.replace(/[(),.\-\/]/g, ' ').split(/\s+/).filter(t => t.length >= 2);
  const tokensB = b.replace(/[(),.\-\/]/g, ' ').split(/\s+/).filter(t => t.length >= 2);

  return tokensA.some(tA => tokensB.some(tB => tA === tB || tA.includes(tB) || tB.includes(tA)));
};

/**
 * Get approximate geographic coordinates (Lat, Lng) for any Bangladesh district.
 */
export const getDistrictCoordinates = (districtName: string): { lat: number; lng: number } => {
  if (!districtName) return { lat: 23.734, lng: 90.378 }; // Default to Dhaka center

  const clean = districtName.toLowerCase();

  const COORDS_MAP: { [key: string]: { lat: number; lng: number } } = {
    'dhaka': { lat: 23.8103, lng: 90.4125 },
    'ঢাকা': { lat: 23.8103, lng: 90.4125 },
    'chattogram': { lat: 22.3569, lng: 91.7832 },
    'chittagong': { lat: 22.3569, lng: 91.7832 },
    'চট্টগ্রাম': { lat: 22.3569, lng: 91.7832 },
    'cumilla': { lat: 23.4607, lng: 91.1809 },
    'comilla': { lat: 23.4607, lng: 91.1809 },
    'কুমিল্লা': { lat: 23.4607, lng: 91.1809 },
    'rajshahi': { lat: 24.3745, lng: 88.6042 },
    'রাজশাহী': { lat: 24.3745, lng: 88.6042 },
    'khulna': { lat: 22.8456, lng: 89.5403 },
    'খুলনা': { lat: 22.8456, lng: 89.5403 },
    'sylhet': { lat: 24.8949, lng: 91.8687 },
    'সিলেট': { lat: 24.8949, lng: 91.8687 },
    'barishal': { lat: 22.7010, lng: 90.3535 },
    'বরিশাল': { lat: 22.7010, lng: 90.3535 },
    'rangpur': { lat: 25.7439, lng: 89.2752 },
    'রংপুর': { lat: 25.7439, lng: 89.2752 },
    'mymensingh': { lat: 24.7471, lng: 90.4203 },
    'ময়মনসিংহ': { lat: 24.7471, lng: 90.4203 },
    'gazipur': { lat: 23.9999, lng: 90.4203 },
    'গাজীপুর': { lat: 23.9999, lng: 90.4203 },
    'narayanganj': { lat: 23.6238, lng: 90.5000 },
    'নারায়ণগঞ্জ': { lat: 23.6238, lng: 90.5000 },
    'bogra': { lat: 24.8481, lng: 89.3730 },
    'bogura': { lat: 24.8481, lng: 89.3730 },
    'বগুড়া': { lat: 24.8481, lng: 89.3730 },
    'pabna': { lat: 24.0125, lng: 89.2500 },
    'পাবনা': { lat: 24.0125, lng: 89.2500 },
    'natore': { lat: 24.4102, lng: 89.0076 },
    'নাটোর': { lat: 24.4102, lng: 89.0076 },
    'jessore': { lat: 23.1667, lng: 89.2167 },
    'jhasore': { lat: 23.1667, lng: 89.2167 },
    'যশোর': { lat: 23.1667, lng: 89.2167 },
    'cox': { lat: 21.4272, lng: 92.0058 },
    'কক্সবাজার': { lat: 21.4272, lng: 92.0058 },
    'dinajpur': { lat: 25.6217, lng: 88.6354 },
    'দিনাজপুর': { lat: 25.6217, lng: 88.6354 }
  };

  for (const key in COORDS_MAP) {
    if (clean.includes(key)) return COORDS_MAP[key];
  }

  return { lat: 23.734, lng: 90.378 }; // Default to Dhaka
};

/**
 * Parse address or reverse-geocoded string to match Division, District, Thana
 */
export const parseLocationFromAddress = (address: string): { division?: string; district?: string; thana?: string } => {
  if (!address) return {};
  const clean = address.toLowerCase();

  let matchedDivision: string | undefined;
  let matchedDistrict: string | undefined;
  let matchedThana: string | undefined;

  for (const loc of BANGLADESH_LOCATIONS) {
    if (isLocationMatch(clean, loc.division)) {
      matchedDivision = loc.division;
    }
    for (const dist of loc.districts) {
      if (isLocationMatch(clean, dist.name)) {
        matchedDistrict = dist.name;
        if (!matchedDivision) matchedDivision = loc.division;

        for (const thana of dist.thanas) {
          if (isLocationMatch(clean, thana)) {
            matchedThana = thana;
            break;
          }
        }
        break;
      }
    }
  }

  // Fallback: If no district matched directly from address, check if address matches any thana directly
  if (!matchedDistrict) {
    for (const loc of BANGLADESH_LOCATIONS) {
      for (const dist of loc.districts) {
        for (const thana of dist.thanas) {
          if (isLocationMatch(clean, thana)) {
            matchedThana = thana;
            matchedDistrict = dist.name;
            matchedDivision = loc.division;
            break;
          }
        }
        if (matchedThana) break;
      }
      if (matchedThana) break;
    }
  }

  return {
    division: matchedDivision,
    district: matchedDistrict,
    thana: matchedThana
  };
};
