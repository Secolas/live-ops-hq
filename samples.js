/* Demo sources. Each one is a different real-world format with its own
   quirk, and each one describes things that exist somewhere on a site. */
var AIRFIELD = {

  csv: {
    label:'📄 CSV export', chip:'csv', name:'staff_roster.csv',
    note:'plain comma CSV, quoted names',
    text:
'employee,role,area,status,shift,badge\n'+
'"Alvarez, R.",Instructor,Classrooms,on-site,Day,B-1042\n'+
'"Okafor, D.",Student,Classrooms,on-site,Day,B-1043\n'+
'"Brennan, K.",Mechanic,Hangar,on-site,Day,B-1044\n'+
'"Vu, T.",Dispatch,Ops office,on-site,Day,B-1045\n'+
'"Sorensen, M.",Mechanic,Hangar,idle,Day,B-1046\n'+
'"Iqbal, S.",Instructor,Apron,in transit,Day,B-1047\n'+
'"Reyes, L.",Student,Apron,on-site,Day,B-1048\n'+
'"Haddad, N.",Student,Classrooms,on-site,Day,B-1049\n'+
'"Tanaka, Y.",Line crew,Apron,on-site,Day,B-1050\n'+
'"Novak, P.",Line crew,Parking lot,idle,Day,B-1051\n'+
'"Ferreira, C.",Dispatch,Ops office,on-site,Night,B-1052\n'+
'"Kowalski, M.",Mechanic,Hangar,on-site,Night,B-1053\n'+
'"Boateng, A.",Student,Classrooms,on-site,Day,B-1054\n'+
'"Lindqvist, E.",Instructor,Ops office,idle,Day,B-1055\n'+
'"Marquez, J.",Line crew,Apron,in transit,Day,B-1056\n'+
'"Petrov, I.",Mechanic,Hangar,needs attention,Night,B-1057\n'
  },

  ftp: {
    label:'🗄️ FTP / SFTP drop', chip:'pipe-delimited', name:'assets_20261024.txt',
    note:'nightly pipe-delimited drop with NULL markers and currency symbols',
    text:
'asset_tag|description|location|condition|value_usd|last_checked\n'+
'AST-1042|Tow tractor|Hangar|in service|$ 18,400.00|2026-10-23\n'+
'AST-1043|Tug, electric|Hangar|in service|$ 12,900.00|2026-10-22\n'+
'AST-1044|Ground power unit|Apron|in service|$ 7,250.00|2026-10-23\n'+
'AST-1045|Fuel bowser|Apron|out of service|$ 44,000.00|NULL\n'+
'AST-1046|Tool chest A|Hangar|in service|$ 2,100.00|2026-10-20\n'+
'AST-1047|Jack set|Hangar|low|$ 5,600.00|2026-10-18\n'+
'AST-1048|Chock pallet|Apron|in service|$ 410.00|2026-10-24\n'+
'AST-1049|De-ice cart|Parking lot|idle|$ 9,800.00|NULL\n'+
'AST-1050|Air compressor|Hangar|in service|$ 3,350.00|2026-10-21\n'+
'AST-1051|Baggage cart 1|Apron|in service|$ 1,250.00|2026-10-24\n'+
'AST-1052|Baggage cart 2|Apron|needs attention|$ 1,250.00|2026-10-12\n'+
'AST-1053|Spill kit|Run-up area|in service|$ 380.00|2026-10-19\n'+
'AST-1054|Headset locker|Classrooms|in service|$ 940.00|2026-10-17\n'+
'AST-1055|Oxygen trolley|Hangar|low|$ 6,700.00|2026-10-09\n'
  },

  sheet: {
    label:'📊 Spreadsheet', chip:'semicolon csv', name:'fleet_sheet.csv',
    note:'semicolon-separated export with thousands separators and percentages',
    text:
'unit;type;base;state;odometer_km;fuel_pct;driver\n'+
'VH-101;Van;Parking lot;at base;142,880;62%;Vu, T.\n'+
'VH-102;Van;Parking lot;at base;98,720;41%;Novak, P.\n'+
'VH-103;Truck;Run-up area;in transit;210,455;78%;Marquez, J.\n'+
'VH-104;Tug;Hangar;at base;18,340;55%;Tanaka, Y.\n'+
'VH-105;Truck;Parking lot;in transit;176,200;29%;Boateng, A.\n'+
'VH-106;Van;Parking lot;at base;66,110;88%;Reyes, L.\n'+
'VH-107;Tug;Hangar;idle;9,870;34%;Petrov, I.\n'+
'VH-108;Truck;Parking lot;out of service;233,900;17%;NULL\n'+
'VH-109;Van;Ops office;at base;51,430;73%;Ferreira, C.\n'+
'VH-110;Forklift;Hangar;at base;4,210;91%;Kowalski, M.\n'+
'VH-111;Truck;Run-up area;in transit;188,640;46%;Iqbal, S.\n'+
'VH-112;Van;Parking lot;idle;77,905;58%;Lindqvist, E.\n'
  },

  report: {
    label:'🧾 Vendor report', chip:'report', name:'avfuel_parts_wk43.csv',
    note:'supplier report with three title lines above the real header',
    text:
'SKYLINE AVIATION SUPPLY — WEEKLY DELIVERY SUMMARY\n'+
'Generated: 2026-10-26 03:00 UTC\n'+
'Account: FA-20931   Period: Week 43\n'+
'\n'+
'tracking,carrier,destination,item,status,weight_kg,cost_usd\n'+
'SKY-6601,AvFuel,Apron,100LL fuel 2000 L,delivered,1420,14210.00\n'+
'SKY-6602,AeroParts,Hangar,Cylinder kit C172,delivered,18.4,2140.50\n'+
'SKY-6603,AeroParts,Hangar,Magneto pair,in transit,6.1,1890.00\n'+
'SKY-6604,AvFuel,Apron,Jet A 1000 L,scheduled,810,6120.00\n'+
'SKY-6605,PilotShop,Ops office,Headsets (6),delivered,4.2,1380.00\n'+
'SKY-6606,AeroParts,Hangar,Tyres 6.00-6 (4),delayed,28.0,640.00\n'+
'SKY-6607,PilotShop,Classrooms,Training manuals,delivered,22.5,415.00\n'+
'SKY-6608,AeroParts,Hangar,Vacuum pump,in transit,3.3,720.00\n'+
'SKY-6609,AvFuel,Run-up area,Oil 15W-50 case,delivered,11.8,210.00\n'+
'SKY-6610,AeroParts,Parking lot,Tow bar,delayed,9.6,365.00\n'+
'\n'+
'END OF REPORT\n'
  },

  api: {
    label:'🔌 JSON API', chip:'json', name:'GET /api/aircraft',
    note:'nested JSON payload, flattened automatically',
    text: JSON.stringify({ generated_at:'2026-10-24T14:02:00Z', count:11, data:[
      {tail:'N4412T', model:'C172', area:'Apron',       status:'airborne',       hours:4821.4, position:{lat:28.411,lon:-81.302}, lesson:'DUAL'},
      {tail:'N7720K', model:'C172', area:'Apron',       status:'airborne',       hours:3990.2, position:{lat:28.414,lon:-81.299}, lesson:'SOLO'},
      {tail:'N1180R', model:'PA28', area:'Hangar',      status:'in service',     hours:6102.8, position:{lat:28.409,lon:-81.305}, lesson:'—'},
      {tail:'N9934B', model:'C152', area:'Run-up area', status:'in transit',     hours:7340.1, position:{lat:28.410,lon:-81.301}, lesson:'DUAL'},
      {tail:'N2256V', model:'C172', area:'Hangar',      status:'out of service', hours:5218.6, position:{lat:28.408,lon:-81.306}, lesson:'—'},
      {tail:'N6601D', model:'PA28', area:'Apron',       status:'in service',     hours:2884.0, position:{lat:28.412,lon:-81.300}, lesson:'SOLO'},
      {tail:'N3345L', model:'C152', area:'Apron',       status:'idle',           hours:8105.9, position:{lat:28.413,lon:-81.303}, lesson:'—'},
      {tail:'N8871G', model:'SR20', area:'Hangar',      status:'in service',     hours:1442.3, position:{lat:28.407,lon:-81.304}, lesson:'DUAL'},
      {tail:'N5509W', model:'C172', area:'Run-up area', status:'in transit',     hours:4677.5, position:{lat:28.411,lon:-81.298}, lesson:'DUAL'},
      {tail:'N7013P', model:'PA28', area:'Apron',       status:'needs attention',hours:6933.7, position:{lat:28.415,lon:-81.302}, lesson:'—'},
      {tail:'N1127C', model:'C152', area:'Hangar',      status:'in service',     hours:3501.8, position:{lat:28.406,lon:-81.307}, lesson:'SOLO'}
    ]}, null, 1)
  },

  sql: {
    label:'🗃️ SQL export', chip:'tab-separated', name:'training_hours.tsv',
    note:'tab-separated database dump with NULLs and ISO timestamps',
    text:
'student_id\tstudent\tsite\tcourse\tstage\tlesson_hours\tcompleted_at\n'+
'S-0041\tOkafor, D.\tClassrooms\tPrivate\tactive\t38.5\t2026-10-21T16:40:00Z\n'+
'S-0042\tReyes, L.\tApron\tPrivate\tactive\t22.0\tNULL\n'+
'S-0043\tHaddad, N.\tClassrooms\tInstrument\tactive\t61.25\t2026-10-19T11:05:00Z\n'+
'S-0044\tLindqvist, E.\tClassrooms\tPrivate\tidle\t15.75\tNULL\n'+
'S-0045\tMarquez, J.\tApron\tCommercial\tin transit\t104.0\t2026-10-23T09:20:00Z\n'+
'S-0046\tTanaka, Y.\tClassrooms\tInstrument\tactive\t57.5\t2026-10-18T15:55:00Z\n'+
'S-0047\tBoateng, A.\tOps office\tPrivate\tidle\t29.25\tNULL\n'+
'S-0048\tNovak, P.\tClassrooms\tCommercial\tactive\t88.75\t2026-10-22T13:10:00Z\n'+
'S-0049\tFerreira, C.\tApron\tInstrument\tactive\t44.0\tNULL\n'+
'S-0050\tKowalski, M.\tRun-up area\tCommercial\tin transit\t97.5\t2026-10-20T10:45:00Z\n'+
'S-0051\tPetrov, I.\tClassrooms\tPrivate\tinactive\t8.5\tNULL\n'+
'S-0052\tAlvarez, R.\tOps office\tInstrument\tactive\t71.0\t2026-10-24T08:30:00Z\n'
  }
};

/* ------------------------------ warehouse ------------------------------- */
var WAREHOUSE = {
  csv: {
    label:'📄 CSV export', chip:'csv', name:'shift_roster.csv',
    note:'plain comma CSV, quoted names',
    text:
'employee,role,area,status,shift,badge\n'+
'"Okoye, A.",Shift supervisor,Office,on-site,Day,W-2201\n'+
'"Lindgren, P.",Picker,Aisle A,on-site,Day,W-2202\n'+
'"Mensah, K.",Picker,Aisle A,on-site,Day,W-2203\n'+
'"Duarte, R.",Picker,Aisle B,idle,Day,W-2204\n'+
'"Hayes, J.",Forklift operator,Aisle C,on-site,Day,W-2205\n'+
'"Nakamura, S.",Packer,Packing,on-site,Day,W-2206\n'+
'"Ivanova, M.",Packer,Packing,on-site,Day,W-2207\n'+
'"Abara, T.",Receiver,Receiving,on-site,Day,W-2208\n'+
'"Costa, L.",Receiver,Receiving,idle,Day,W-2209\n'+
'"Byrne, D.",Loader,Loading dock,on-site,Day,W-2210\n'+
'"Farouk, H.",Loader,Loading dock,needs attention,Day,W-2211\n'+
'"Pereira, V.",Yard driver,Yard,in transit,Day,W-2212\n'+
'"Walsh, E.",Inventory clerk,Office,on-site,Day,W-2213\n'+
'"Kim, J.",Picker,Aisle B,off shift,Night,W-2214\n'
  },
  ftp: {
    label:'🗄️ FTP / SFTP drop', chip:'pipe-delimited', name:'pallets_20261024.txt',
    note:'nightly WMS pipe-delimited drop with NULL markers and currency symbols',
    text:
'pallet_id|sku|description|location|condition|value_usd|last_scanned\n'+
'PLT-30411|SKU-88213|Bottled water 24pk|Aisle A|in stock|$ 1,240.00|2026-10-24\n'+
'PLT-30412|SKU-88214|Paper towels 12pk|Aisle A|in stock|$ 890.50|2026-10-24\n'+
'PLT-30413|SKU-51007|Dish soap case|Aisle A|low|$ 410.00|2026-10-23\n'+
'PLT-30420|SKU-61220|Canned tomatoes|Aisle B|in stock|$ 1,075.00|2026-10-24\n'+
'PLT-30421|SKU-61221|Pasta 20kg|Aisle B|damaged|$ 655.00|2026-10-22\n'+
'PLT-30422|SKU-61230|Rice 25kg|Aisle B|in stock|$ 920.00|2026-10-24\n'+
'PLT-30430|SKU-70112|Laundry pods|Aisle C|on hold|$ 1,480.00|NULL\n'+
'PLT-30431|SKU-70113|Bleach 4x5L|Aisle C|in stock|$ 512.75|2026-10-23\n'+
'PLT-30440|SKU-90001|Mixed inbound|Receiving|in stock|$ 2,300.00|2026-10-24\n'+
'PLT-30441|SKU-90002|Mixed inbound|Receiving|on hold|$ 1,860.00|NULL\n'+
'PLT-30450|SKU-40450|Outbound wave 12|Loading dock|in stock|$ 3,120.00|2026-10-24\n'+
'PLT-30451|SKU-40451|Outbound wave 12|Loading dock|in stock|$ 2,780.00|2026-10-24\n'+
'PLT-30460|SKU-33010|Returns|Overflow|low|$ 340.00|2026-10-18\n'
  },
  sheet: {
    label:'📊 Spreadsheet', chip:'semicolon csv', name:'mhe_fleet.csv',
    note:'equipment sheet, semicolon-separated, with thousands separators and percentages',
    text:
'unit;type;zone;state;hours;battery_pct;operator\n'+
'FL-01;Forklift;Aisle A;in use;4,812;76%;Hayes, J.\n'+
'FL-02;Forklift;Aisle B;in use;3,905;58%;Mensah, K.\n'+
'FL-03;Reach truck;Aisle C;in use;2,410;81%;Lindgren, P.\n'+
'FL-04;Forklift;Receiving;idle;5,630;34%;NULL\n'+
'FL-05;Forklift;Loading dock;in use;4,120;66%;Byrne, D.\n'+
'FL-06;Forklift;Loading dock;charging;6,002;12%;NULL\n'+
'PJ-01;Pallet jack;Packing;in use;1,288;90%;Nakamura, S.\n'+
'PJ-02;Pallet jack;Receiving;out of service;2,940;0%;NULL\n'+
'YT-01;Yard tractor;Yard;in transit;8,410;—;Pereira, V.\n'+
'YT-02;Yard tractor;Yard;idle;7,955;—;NULL\n'+
'VN-01;Van;Yard;at base;61,230;—;Walsh, E.\n'
  },
  report: {
    label:'🧾 Vendor report', chip:'report', name:'carrier_shipments_wk43.csv',
    note:'carrier report with three title lines above the real header',
    text:
'ACME LOGISTICS — WEEKLY SHIPMENT SUMMARY\n'+
'Generated: 2026-10-26 03:00 UTC\n'+
'Account: 88-40192   Period: Week 43\n'+
'\n'+
'tracking,carrier,destination,status,weight_kg,transit_days,cost_usd\n'+
'TRK88401,Northline,Receiving,delivered,18.4,2,64.20\n'+
'TRK88402,Northline,Loading dock,delivered,42.1,3,118.75\n'+
'TRK88403,Seabridge,Yard,in transit,7.9,4,39.90\n'+
'TRK88404,Vertex,Receiving,delivered,96.3,1,241.00\n'+
'TRK88405,Northline,Loading dock,delayed,23.7,6,88.40\n'+
'TRK88406,Seabridge,Packing,delivered,11.2,3,45.60\n'+
'TRK88407,Vertex,Yard,in transit,64.8,2,172.30\n'+
'TRK88408,Northline,Receiving,delivered,31.5,2,96.10\n'+
'TRK88409,Vertex,Loading dock,delayed,8.6,7,41.25\n'+
'TRK88410,Seabridge,Yard,delivered,129.4,4,310.80\n'+
'TRK88411,Northline,Packing,delivered,15.0,3,52.40\n'+
'TRK88412,Vertex,Receiving,in transit,74.2,1,198.65\n'+
'TRK88413,Seabridge,Loading dock,in transit,55.1,2,149.00\n'+
'TRK88414,Northline,Yard,delivered,9.3,5,37.80\n'+
'\n'+
'END OF REPORT\n'
  },
  api: {
    label:'🔌 JSON API', chip:'json', name:'GET /api/yard/trucks',
    note:'yard-management JSON, trailers nested, flattened automatically',
    text: JSON.stringify({ generated_at:'2026-10-24T14:02:00Z', site:'DC-East', data:[
      {unit:'TRK-201', carrier:'Northline', area:'Loading dock', door:'D1', status:'at door',  trailer:{id:'TRL-5531', load_pct:80}, eta_min:0},
      {unit:'TRK-202', carrier:'Vertex',    area:'Loading dock', door:'D2', status:'loading',  trailer:{id:'TRL-5540', load_pct:45}, eta_min:0},
      {unit:'TRK-203', carrier:'Seabridge', area:'Loading dock', door:'D3', status:'delayed',  trailer:{id:'TRL-5512', load_pct:10}, eta_min:0},
      {unit:'TRK-204', carrier:'Northline', area:'Yard',         door:null, status:'waiting',  trailer:{id:'TRL-5563', load_pct:100}, eta_min:0},
      {unit:'TRK-205', carrier:'Vertex',    area:'Yard',         door:null, status:'waiting',  trailer:{id:'TRL-5571', load_pct:100}, eta_min:0},
      {unit:'TRK-206', carrier:'Northline', area:'Yard',         door:null, status:'at base',  trailer:{id:'TRL-5502', load_pct:0},   eta_min:0},
      {unit:'TRK-207', carrier:'Seabridge', area:'Gate road',    door:null, status:'en route', trailer:{id:'TRL-5588', load_pct:100}, eta_min:12},
      {unit:'TRK-208', carrier:'Vertex',    area:'Gate road',    door:null, status:'departed', trailer:{id:'TRL-5590', load_pct:95},  eta_min:0},
      {unit:'TRK-209', carrier:'Northline', area:'Gate road',    door:null, status:'en route', trailer:{id:'TRL-5594', load_pct:100}, eta_min:27}
    ]}, null, 1)
  },
  sql: {
    label:'🗃️ SQL export', chip:'tab-separated', name:'pick_tasks.tsv',
    note:'tab-separated WMS dump with NULLs and ISO timestamps',
    text:
'task_id\tpicker\tzone\twave\tstatus\tlines_picked\tcompleted_at\n'+
'T-90411\tLindgren, P.\tAisle A\tW12\tpicking\t42\tNULL\n'+
'T-90412\tMensah, K.\tAisle A\tW12\tpicking\t38\tNULL\n'+
'T-90413\tDuarte, R.\tAisle B\tW12\twaiting\t0\tNULL\n'+
'T-90414\tKim, J.\tAisle B\tW11\tcomplete\t61\t2026-10-24T09:20:00Z\n'+
'T-90415\tHayes, J.\tAisle C\tW12\tpicking\t27\tNULL\n'+
'T-90416\tNakamura, S.\tPacking\tW11\tcomplete\t55\t2026-10-24T10:05:00Z\n'+
'T-90417\tIvanova, M.\tPacking\tW12\tpicking\t19\tNULL\n'+
'T-90418\tAbara, T.\tReceiving\tW12\tblocked\t4\tNULL\n'+
'T-90419\tByrne, D.\tLoading dock\tW12\tloading\t33\tNULL\n'+
'T-90420\tCosta, L.\tReceiving\tW12\tnot started\t0\tNULL\n'
  }
};

/* ----------------------------- construction ----------------------------- */
var CONSTRUCTION = {
  csv: {
    label:'📄 CSV export', chip:'csv', name:'site_crew.csv',
    note:'plain comma CSV, quoted names',
    text:
'employee,trade,area,status,shift,badge\n'+
'"Moreno, G.",Site foreman,Site office,on-site,Day,C-501\n'+
'"Adeyemi, F.",Safety officer,Site office,on-site,Day,C-502\n'+
'"Brook, T.",Carpenter,Block A,on-site,Day,C-503\n'+
'"Sato, H.",Carpenter,Block A,on-site,Day,C-504\n'+
'"Novak, J.",Electrician,Block B,on-site,Day,C-505\n'+
'"Quinn, R.",Labourer,Block B,idle,Day,C-506\n'+
'"Haddad, O.",Rigger,Crane pad,on-site,Day,C-507\n'+
'"Petrov, A.",Crane operator,Crane pad,on-site,Day,C-508\n'+
'"Lund, M.",Plant operator,Plant & tools,on-site,Day,C-509\n'+
'"Diallo, S.",Labourer,Material yard,on-site,Day,C-510\n'+
'"Ortiz, C.",Labourer,Material yard,needs attention,Day,C-511\n'+
'"Fenn, B.",Delivery driver,Site gate,in transit,Day,C-512\n'
  },
  ftp: {
    label:'🗄️ FTP / SFTP drop', chip:'pipe-delimited', name:'materials_20261024.txt',
    note:'supplier pipe-delimited drop with NULL markers and currency symbols',
    text:
'item_id|material|location|condition|value_usd|delivered\n'+
'MAT-1101|Steel beams (12)|Material yard|in stock|$ 18,400.00|2026-10-21\n'+
'MAT-1102|Rebar bundle|Material yard|in stock|$ 6,250.00|2026-10-22\n'+
'MAT-1103|Cement pallet|Material yard|low|$ 1,120.00|2026-10-18\n'+
'MAT-1104|Timber formwork|Block A|in stock|$ 3,400.00|2026-10-20\n'+
'MAT-1105|Scaffold tubes|Block A|in stock|$ 2,980.00|2026-10-19\n'+
'MAT-1106|Drywall sheets|Block B|on hold|$ 2,150.00|NULL\n'+
'MAT-1107|Cable drums|Block B|in stock|$ 4,700.00|2026-10-23\n'+
'MAT-1108|Precast slab|Crane pad|in stock|$ 9,800.00|2026-10-24\n'+
'MAT-1109|Window units|Laydown area|damaged|$ 7,300.00|2026-10-17\n'+
'MAT-1110|Insulation rolls|Block B|in stock|$ 1,640.00|2026-10-22\n'
  },
  sheet: {
    label:'📊 Spreadsheet', chip:'semicolon csv', name:'plant_register.csv',
    note:'plant register, semicolon-separated, with thousands separators and percentages',
    text:
'unit;type;location;state;engine_hours;fuel_pct;operator\n'+
'EX-01;Excavator;Block A;working;6,410;64%;Lund, M.\n'+
'EX-02;Excavator;Block B;idle;5,120;38%;NULL\n'+
'WL-01;Wheel loader;Material yard;working;3,980;71%;Diallo, S.\n'+
'TH-01;Telehandler;Block A;working;2,760;55%;Brook, T.\n'+
'MC-01;Mobile crane;Crane pad;working;7,330;49%;Petrov, A.\n'+
'RL-01;Roller;Plant & tools;out of service;4,005;20%;NULL\n'+
'DT-01;Dumper truck;Site gate;in transit;5,880;62%;Fenn, B.\n'+
'MX-01;Concrete mixer;Site gate;en route;9,210;80%;NULL\n'+
'PU-01;Pickup;Site office;at base;48,300;67%;Moreno, G.\n'
  },
  report: {
    label:'🧾 Vendor report', chip:'report', name:'supplier_deliveries_wk43.csv',
    note:'supplier report with title lines above the real header',
    text:
'BUILDMART SUPPLY — SITE DELIVERY SCHEDULE\n'+
'Generated: 2026-10-26 05:00 UTC\n'+
'Project: Riverside Block A/B   Week 43\n'+
'\n'+
'delivery_note,supplier,drop_zone,status,weight_t,eta_min\n'+
'DN-7701,Buildmart,Material yard,delivered,4.2,0\n'+
'DN-7702,SteelCo,Crane pad,delivered,11.5,0\n'+
'DN-7703,Buildmart,Block A,in transit,2.1,18\n'+
'DN-7704,ReadyMix,Block B,en route,8.0,25\n'+
'DN-7705,SteelCo,Material yard,delayed,6.4,0\n'+
'DN-7706,Buildmart,Block B,delivered,1.3,0\n'+
'DN-7707,GlassWorks,Laydown area,scheduled,3.0,0\n'+
'DN-7708,ReadyMix,Block A,in transit,8.0,9\n'+
'\n'+
'END OF REPORT\n'
  },
  api: {
    label:'🔌 JSON API', chip:'json', name:'GET /api/plant/telematics',
    note:'plant telematics JSON, GPS nested, flattened automatically',
    text: JSON.stringify({ generated_at:'2026-10-24T14:02:00Z', project:'Riverside', data:[
      {unit:'EX-01', type:'Excavator',    area:'Block A',       status:'working',        engine:{hours:6410, fuel_pct:64}, gps:{lat:28.502,lon:-81.188}},
      {unit:'EX-02', type:'Excavator',    area:'Block B',       status:'idle',           engine:{hours:5120, fuel_pct:38}, gps:{lat:28.503,lon:-81.186}},
      {unit:'EX-03', type:'Excavator',    area:'Block B',       status:'working',        engine:{hours:1890, fuel_pct:82}, gps:{lat:28.503,lon:-81.187}},
      {unit:'WL-01', type:'Wheel loader', area:'Material yard', status:'working',        engine:{hours:3980, fuel_pct:71}, gps:{lat:28.501,lon:-81.190}},
      {unit:'MC-01', type:'Mobile crane', area:'Crane pad',     status:'working',        engine:{hours:7330, fuel_pct:49}, gps:{lat:28.504,lon:-81.189}},
      {unit:'TH-01', type:'Telehandler',  area:'Block A',       status:'fault',          engine:{hours:2760, fuel_pct:55}, gps:{lat:28.502,lon:-81.187}},
      {unit:'DT-01', type:'Dumper truck', area:'Site gate',     status:'driving',        engine:{hours:5880, fuel_pct:62}, gps:{lat:28.500,lon:-81.191}},
      {unit:'DT-02', type:'Dumper truck', area:'Plant & tools', status:'idle',           engine:{hours:6620, fuel_pct:41}, gps:{lat:28.505,lon:-81.185}}
    ]}, null, 1)
  },
  sql: {
    label:'🗃️ SQL export', chip:'tab-separated', name:'timesheets.tsv',
    note:'tab-separated timesheet dump with NULLs and ISO timestamps',
    text:
'worker_id\tworker\tblock\ttrade\tstatus\thours_today\tclocked_in\n'+
'W-301\tBrook, T.\tBlock A\tCarpenter\ton shift\t6.5\t2026-10-24T06:30:00Z\n'+
'W-302\tSato, H.\tBlock A\tCarpenter\ton shift\t6.5\t2026-10-24T06:30:00Z\n'+
'W-303\tNovak, J.\tBlock B\tElectrician\ton shift\t6.0\t2026-10-24T07:00:00Z\n'+
'W-304\tQuinn, R.\tBlock B\tLabourer\tidle\t5.5\t2026-10-24T07:00:00Z\n'+
'W-305\tHaddad, O.\tCrane pad\tRigger\ton shift\t7.0\t2026-10-24T06:00:00Z\n'+
'W-306\tDiallo, S.\tMaterial yard\tLabourer\ton shift\t6.0\t2026-10-24T07:00:00Z\n'+
'W-307\tOrtiz, C.\tMaterial yard\tLabourer\toff shift\t0\tNULL\n'+
'W-308\tLund, M.\tPlant & tools\tPlant operator\ton shift\t6.5\t2026-10-24T06:30:00Z\n'+
'W-309\tMoreno, G.\tSite office\tSite foreman\ton shift\t7.5\t2026-10-24T06:00:00Z\n'
  }
};

/* ------------------------------ fleet depot ----------------------------- */
var DEPOT = {
  csv: {
    label:'📄 CSV export', chip:'csv', name:'depot_staff.csv',
    note:'plain comma CSV, quoted names',
    text:
'employee,role,area,status,shift,badge\n'+
'"Grant, L.",Dispatcher,Parts store,on-site,Day,D-701\n'+
'"Osei, T.",Depot supervisor,Parts store,on-site,Day,D-702\n'+
'"Rossi, M.",Technician,Service bays,on-site,Day,D-703\n'+
'"Iqbal, N.",Technician,Service bays,on-site,Day,D-704\n'+
'"Murphy, K.",Technician,Service bays,idle,Day,D-705\n'+
'"Santos, P.",Washer,Wash,on-site,Day,D-706\n'+
'"Chen, W.",Fuel attendant,Fuel island,on-site,Day,D-707\n'+
'"Hale, M.",Driver,Access road,in transit,Day,D-708\n'+
'"Park, J.",Driver,Vehicle lot,on-site,Day,D-709\n'+
'"Brandt, L.",Driver,Vehicle lot,off shift,Night,D-710\n'+
'"Silva, K.",Driver,Access road,in transit,Day,D-711\n'+
'"Novak, E.",Parts clerk,Parts store,needs attention,Day,D-712\n'
  },
  ftp: {
    label:'🗄️ FTP / SFTP drop', chip:'pipe-delimited', name:'parts_20261024.txt',
    note:'nightly parts-stock pipe-delimited drop with NULL markers and currency symbols',
    text:
'part_no|description|location|condition|value_usd|last_received\n'+
'PN-1042|Brake pad set|Parts store|in stock|$ 32.40|2026-10-18\n'+
'PN-2277|Hydraulic hose|Parts store|low|$ 118.00|2026-10-21\n'+
'PN-3310|Oil filter|Parts store|in stock|$ 11.75|2026-10-22\n'+
'PN-4005|Tyre 295/80R22.5|Service bays|in stock|$ 640.00|2026-10-11\n'+
'PN-4411|Headlamp unit|Service bays|on hold|$ 212.50|NULL\n'+
'PN-5120|Air dryer cartridge|Parts store|in stock|$ 88.90|2026-10-23\n'+
'PN-5533|Alternator belt|Parts store|in stock|$ 44.00|2026-10-19\n'+
'PN-6018|Battery, 24V|Service bays|damaged|$ 389.00|2026-10-09\n'+
'PN-6690|AdBlue drum|Fuel island|in stock|$ 215.00|2026-10-20\n'+
'PN-7702|Wash chemical|Wash|low|$ 96.75|2026-10-20\n'
  },
  sheet: {
    label:'📊 Spreadsheet', chip:'semicolon csv', name:'fleet_sheet.csv',
    note:'semicolon-separated export with thousands separators and percentages',
    text:
'unit;type;base;state;odometer_km;fuel_pct;driver\n'+
'VH-101;Van;Vehicle lot;at base;142,880;62%;Park, J.\n'+
'VH-102;Van;Vehicle lot;at base;98,720;41%;NULL\n'+
'VH-103;Box truck;Access road;in transit;210,455;78%;Hale, M.\n'+
'VH-104;Van;Service bays;maintenance;18,340;55%;NULL\n'+
'VH-105;Box truck;Access road;in transit;176,200;29%;Silva, K.\n'+
'VH-106;Van;Wash;idle;66,110;88%;NULL\n'+
'VH-107;Tractor unit truck;Fuel island;idle;309,870;34%;NULL\n'+
'VH-108;Box truck;Service bays;out of service;233,900;17%;NULL\n'+
'VH-109;Van;Vehicle lot;at base;51,430;73%;NULL\n'+
'VH-110;Pickup;Vehicle lot;at base;24,210;91%;Osei, T.\n'+
'VH-111;Tractor unit truck;Access road;en route;188,640;46%;NULL\n'+
'VH-112;Van;Fuel island;at base;77,905;58%;Brandt, L.\n'
  },
  report: {
    label:'🧾 Vendor report', chip:'report', name:'route_report_wk43.csv',
    note:'telematics vendor report with title lines above the real header',
    text:
'FLEETLINK — DAILY ROUTE SUMMARY\n'+
'Generated: 2026-10-26 04:00 UTC\n'+
'Depot: North   Routes: 9\n'+
'\n'+
'route,unit,vehicle,driver,status,stops_done,stops_total,location\n'+
'R-04,VH-101,Van,"Park, J.",returned,18,18,Vehicle lot\n'+
'R-07,VH-112,Van,"Brandt, L.",returned,22,22,Fuel island\n'+
'R-09,VH-103,Box truck,"Hale, M.",en route,9,15,Access road\n'+
'R-11,VH-105,Box truck,"Silva, K.",en route,4,12,Access road\n'+
'R-12,VH-111,Tractor unit truck,NULL,delayed,2,6,Access road\n'+
'R-14,VH-109,Van,NULL,scheduled,0,14,Vehicle lot\n'+
'R-15,VH-106,Van,NULL,idle,0,10,Wash\n'+
'R-21,VH-108,Box truck,NULL,out of service,0,11,Service bays\n'+
'\n'+
'END OF REPORT\n'
  },
  api: {
    label:'🔌 JSON API', chip:'json', name:'GET /api/telematics/vehicles',
    note:'telematics JSON, GPS nested, flattened automatically',
    text: JSON.stringify({ generated_at:'2026-10-24T14:02:00Z', depot:'North', data:[
      {unit:'VH-101', type:'Van',       area:'Vehicle lot',  status:'parked',   gps:{lat:28.411,lon:-81.302,speed_kmh:0},  fuel_pct:62},
      {unit:'VH-103', type:'Box truck', area:'Access road',  status:'driving',  gps:{lat:28.221,lon:-81.410,speed_kmh:54}, fuel_pct:78},
      {unit:'VH-104', type:'Van',       area:'Service bays', status:'in service',gps:{lat:28.412,lon:-81.304,speed_kmh:0}, fuel_pct:55},
      {unit:'VH-105', type:'Box truck', area:'Access road',  status:'driving',  gps:{lat:28.502,lon:-81.188,speed_kmh:61}, fuel_pct:29},
      {unit:'VH-106', type:'Van',       area:'Wash',         status:'idling',   gps:{lat:28.219,lon:-81.407,speed_kmh:0},  fuel_pct:88},
      {unit:'VH-107', type:'Tractor unit truck', area:'Fuel island', status:'idling', gps:{lat:28.501,lon:-81.190,speed_kmh:0}, fuel_pct:34},
      {unit:'VH-108', type:'Box truck', area:'Service bays', status:'fault',    gps:{lat:28.414,lon:-81.300,speed_kmh:0},  fuel_pct:17},
      {unit:'VH-110', type:'Pickup',    area:'Vehicle lot',  status:'parked',   gps:{lat:28.410,lon:-81.301,speed_kmh:0},  fuel_pct:91},
      {unit:'VH-111', type:'Tractor unit truck', area:'Access road', status:'driving', gps:{lat:28.300,lon:-81.350,speed_kmh:72}, fuel_pct:46}
    ]}, null, 1)
  },
  sql: {
    label:'🗃️ SQL export', chip:'tab-separated', name:'workshop_jobs.tsv',
    note:'tab-separated workshop dump with NULLs and ISO timestamps',
    text:
'job_id\ttechnician\tbay\tunit\tstatus\thours_logged\topened_at\n'+
'J-5501\tRossi, M.\tService bays\tVH-104\tin progress\t3.5\t2026-10-24T07:10:00Z\n'+
'J-5502\tIqbal, N.\tService bays\tVH-108\twaiting parts\t1.0\t2026-10-23T15:40:00Z\n'+
'J-5503\tMurphy, K.\tService bays\tVH-102\tidle\t0\tNULL\n'+
'J-5504\tSantos, P.\tWash\tVH-106\tin progress\t0.5\t2026-10-24T11:00:00Z\n'+
'J-5505\tChen, W.\tFuel island\tVH-107\tcomplete\t0.3\t2026-10-24T09:45:00Z\n'+
'J-5506\tRossi, M.\tService bays\tVH-111\tcomplete\t2.0\t2026-10-24T06:30:00Z\n'+
'J-5507\tIqbal, N.\tParts store\tVH-109\tnot started\t0\tNULL\n'
  }
};

window.HQ_SITE_SAMPLES = { airfield: AIRFIELD, warehouse: WAREHOUSE, construction: CONSTRUCTION, depot: DEPOT };
window.HQ_SAMPLES = AIRFIELD;      /* the airfield set, kept under its old name */
