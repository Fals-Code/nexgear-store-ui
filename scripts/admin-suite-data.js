window.NEXGEAR_ADMIN_DATA={products:[{id:'NX-KB-001',name:'Vortex VX Pro Mechanical',category:'Control',brand:'NEXGEAR',price:1599000,stock:18,status:'active',updated:'2026-06-25',image:'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=320&q=85'},{id:'NX-HS-014',name:'Arctis Nova Pro Wireless',category:'Sound',brand:'SteelSeries',price:4299000,stock:3,status:'low',updated:'2026-06-24',image:'https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=320&q=85'},{id:'NX-MS-008',name:'HyperX Pulsefire Haste',category:'Control',brand:'HyperX',price:899000,stock:24,status:'active',updated:'2026-06-22',image:'https://images.unsplash.com/photo-1615663245857-ac93bb7c3c9c?auto=format&fit=crop&w=320&q=85'},{id:'NX-MN-021',name:'NEX Ultrawide 34 QHD',category:'Machines',brand:'NEXGEAR',price:7499000,stock:0,status:'out',updated:'2026-06-20',image:'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=320&q=85'},{id:'NX-MP-003',name:'Artisan Zero FX XL',category:'Control',brand:'Artisan',price:1100000,stock:2,status:'low',updated:'2026-06-18',image:'https://images.unsplash.com/photo-1629429408209-1f912961dbd8?auto=format&fit=crop&w=320&q=85'},{id:'NX-LP-031',name:'ROG Zephyrus G14',category:'Machines',brand:'ASUS',price:28999000,stock:7,status:'draft',updated:'2026-06-16',image:'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=320&q=85'}],users:[{id:'USR-1001',name:'John Doe',email:'john.doe@example.com',role:'customer',status:'active',orders:12,spent:18450000,last:'Hari ini, 15.42',joined:'2026-01-12'},{id:'USR-1002',name:'Nadia Putri',email:'nadia.putri@example.com',role:'customer',status:'verified',orders:8,spent:11240000,last:'Hari ini, 13.18',joined:'2026-02-04'},{id:'USR-1003',name:'Raka Fajar',email:'raka.fajar@example.com',role:'editor',status:'active',orders:2,spent:2498000,last:'Kemarin, 20.10',joined:'2025-12-18'},{id:'USR-1004',name:'Admin NEXGEAR',email:'admin@nexgear.id',role:'admin',status:'active',orders:0,spent:0,last:'Online',joined:'2025-10-01'},{id:'USR-1005',name:'Dimas Kurnia',email:'dimas.k@example.com',role:'customer',status:'inactive',orders:3,spent:4697000,last:'12 Jun 2026',joined:'2026-03-14'},{id:'USR-1006',name:'Alya Nirmala',email:'alya.n@example.com',role:'support',status:'blocked',orders:1,spent:899000,last:'01 Jun 2026',joined:'2026-04-21'}],transactions:[{id:'NEX-88392019A',customer:'John Doe',email:'john.doe@example.com',date:'2026-06-05',items:1,payment:'VA BCA',paymentStatus:'paid',status:'shipping',total:1599000,courier:'JNE Reguler',resi:'88392019A123'},{id:'NEX-88271018C',customer:'Nadia Putri',email:'nadia.putri@example.com',date:'2026-06-03',items:1,payment:'VA Mandiri',paymentStatus:'waiting',status:'waiting',total:4299000,courier:'-',resi:'-'},{id:'NEX-88192072B',customer:'Raka Fajar',email:'raka.fajar@example.com',date:'2026-05-29',items:2,payment:'GoPay',paymentStatus:'paid',status:'processing',total:2398000,courier:'J&T',resi:'-'},{id:'NEX-77281920B',customer:'John Doe',email:'john.doe@example.com',date:'2026-05-12',items:1,payment:'Kartu Kredit',paymentStatus:'paid',status:'completed',total:899000,courier:'SiCepat',resi:'SC77281920'},{id:'NEX-68192011D',customer:'Dimas Kurnia',email:'dimas.k@example.com',date:'2026-03-18',items:1,payment:'QRIS',paymentStatus:'refund',status:'refund',total:1100000,courier:'JNE',resi:'JNE68192011'},{id:'NEX-55182771E',customer:'Alya Nirmala',email:'alya.n@example.com',date:'2026-01-08',items:1,payment:'VA BNI',paymentStatus:'cancelled',status:'cancelled',total:7499000,courier:'-',resi:'-'}]};
(() => {
  const loadEnhancements = async () => {
    const assets = [
      ['scripts/admin-action-menu.js?v=2', 'admin-action-menu'],
      ['scripts/admin-crud-modern.js?v=1', 'admin-crud-modern'],
      ['scripts/admin-crud-theme-sync.js?v=1', 'admin-crud-theme-sync'],
    ];

    for (const [src, key] of assets) {
      const path = src.split('?')[0];
      if (document.querySelector(`script[src^="${path}"]`)) continue;
      await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = src;
        script.dataset[key] = 'true';
        script.addEventListener('load', resolve, { once: true });
        script.addEventListener('error', resolve, { once: true });
        document.body.appendChild(script);
      });
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadEnhancements, { once: true });
  else loadEnhancements();
})();
