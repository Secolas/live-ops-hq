/* Demo sources. Each one is a different real-world format with its own
   quirk, and each one describes things that exist somewhere on a site. */
window.HQ_SAMPLES = {

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
