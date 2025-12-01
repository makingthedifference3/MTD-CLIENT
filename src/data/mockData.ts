// Mock data for CSR Portal - No Supabase required

export interface CSRPartner {
  id: string;
  name: string;
  company_name: string;
  website: string;
  logo_url?: string;
  primary_color: string;
}

export interface User {
  id: string;
  email: string;
  password: string;
  full_name: string;
  role: string;
  csr_partner_id: string;
}

export interface Project {
  id: string;
  csr_partner_id: string;
  name: string;
  code: string;
  description?: string;
  status: string;
  location?: string;
  state?: string;
  start_date: string;
  end_date?: string;
  total_budget: number;
  utilized_budget: number;
  beneficiaries_current: number;
  beneficiaries_target: number;
  // Project-specific metrics
  project_metrics?: {
    // LAJJA specific
    pads_donated?: { current: number; target: number };
    sessions_conducted?: { current: number; target: number };
    // GYANDAAN specific
    students_enrolled?: { current: number; target: number };
    schools_renovated?: { current: number; target: number };
    libraries_setup?: { current: number; target: number };
    scholarships_given?: { current: number; target: number };
    // KILL HUNGER specific
    meals_distributed?: { current: number; target: number };
    ration_kits_distributed?: { current: number; target: number };
    families_fed?: { current: number; target: number };
    // SHOONYA specific
    waste_collected_kg?: { current: number; target: number };
    trees_planted?: { current: number; target: number };
    plastic_recycled_kg?: { current: number; target: number };
    communities_covered?: { current: number; target: number };
  };
}

export interface Timeline {
  id: string;
  project_id: string;
  title: string;
  start_date: string;
  end_date: string;
  completion_percentage: number;
  is_critical_path: boolean;
  color: string;
}

export interface Report {
  id: string;
  project_id: string;
  title: string;
  date: string;
  drive_link: string;
}

export interface Media {
  id: string;
  project_id: string;
  title: string;
  type: 'photo' | 'video';
  date: string;
  is_geo_tagged: boolean;
  drive_link: string;
}

export interface Article {
  id: string;
  project_id: string;
  title: string;
  date: string;
  is_featured: boolean;
  drive_link: string;
}

export interface RealTimeUpdate {
  id: string;
  project_id: string;
  title: string;
  date: string;
  description: string;
  is_downloadable: boolean;
  drive_link: string;
}

// CSR Partners - Complete List
export const csrPartners: CSRPartner[] = [
  { id: '1', name: 'Interise', company_name: 'Interise Solutions', website: 'interiseworld.com', primary_color: '#059669' },
  { id: '2', name: 'Tata Mumbai Marathon', company_name: 'Tata Consultancy Services', website: 'tcs.com', primary_color: '#1a1a1a' },
  { id: '3', name: 'Amazon', company_name: 'Amazon', website: 'amazon.com', primary_color: '#ff9900' },
  { id: '4', name: 'HDFC Bank', company_name: 'HDFC Bank', website: 'hdfcbank.com', primary_color: '#004c8f' },
  { id: '5', name: 'Aditya Birla Capital', company_name: 'Aditya Birla Capital Foundation', website: 'adityabirla.com', primary_color: '#8b0000' },
  { id: '6', name: 'Inorbit', company_name: 'Inorbit Malls', website: 'inorbit.in', primary_color: '#e31837' },
  { id: '7', name: 'Fiserv', company_name: 'Fiserv', website: 'fiserv.com', primary_color: '#ff6600' },
  { id: '8', name: 'Bureau Veritas', company_name: 'Bureau Veritas', website: 'bureauveritas.com', primary_color: '#003d7a' },
  { id: '9', name: 'Enter10 TV Network', company_name: 'Enter10 TV Network', website: 'sonypicturesnetworks.com', primary_color: '#000000' },
  { id: '10', name: 'KASEZ', company_name: 'Kandla Special Economic Zone', website: 'kasez.gov.in', primary_color: '#ff6600' },
  { id: '11', name: 'J.P. Morgan', company_name: 'J.P. Morgan', website: 'jpmorgan.com', primary_color: '#0070ba' },
  { id: '12', name: 'Decathlon', company_name: 'Decathlon', website: 'decathlon.in', primary_color: '#0082c3' },
  { id: '13', name: 'Dahisar Sunteck', company_name: 'Sunteck Realty', website: 'sunteckrealty.com', primary_color: '#e31e24' },
  { id: '14', name: 'PPFAS Mutual Fund', company_name: 'PPFAS Mutual Fund', website: 'ppfas.com', primary_color: '#003d79' },
  { id: '15', name: 'Paytm Insider', company_name: 'Paytm Insider', website: 'insider.in', primary_color: '#002970' },
  { id: '16', name: 'ACE Pipeline', company_name: 'ACE Pipeline', website: 'acepipeline.com', primary_color: '#1a5490' },
  { id: '17', name: 'JMC Projects', company_name: 'JMC Projects India Limited', website: 'jmcprojects.com', primary_color: '#ed1c24' },
  { id: '18', name: 'United Way', company_name: 'United Way Mumbai', website: 'unitedwaymumbai.org', primary_color: '#ff5a00' },
  { id: '19', name: 'Kalpataru', company_name: 'Kalpataru Limited', website: 'kalpataru.com', primary_color: '#8b0304' },
  { id: '20', name: 'Yash Johar Foundation', company_name: 'Yash Johar Foundation', website: 'dharmaproductions.com', primary_color: '#000000' },
  { id: '21', name: 'Ocean Fruit Drink', company_name: 'Ocean Fruit Drink', website: 'oceanspray.com', primary_color: '#c8102e' },
  { id: '22', name: 'HDFC ERGO', company_name: 'HDFC ERGO', website: 'hdfcergo.com', primary_color: '#ed1c24' },
  { id: '23', name: 'Go Dharmic', company_name: 'Go Dharmic', website: 'godharmic.com', primary_color: '#ff6600' },
  { id: '24', name: 'CIAN Agro', company_name: 'CIAN Agro Industries & Infrastructure Ltd', website: 'cianagro.com', primary_color: '#228b22' },
  { id: '25', name: 'Dabbawala', company_name: 'Mumbai Dabbawala', website: 'mydabbawala.com', primary_color: '#ffffff' },
  { id: '26', name: 'Metro Wholesale', company_name: 'Metro Cash & Carry', website: 'metro.co.in', primary_color: '#003d7a' },
  { id: '27', name: 'Kiva.ai', company_name: 'Kiva.ai', website: 'kiva.ai', primary_color: '#6c3' },
  { id: '28', name: 'Sunteck Saathi', company_name: 'Sunteck Realty', website: 'sunteckrealty.com', primary_color: '#e31e24' },
  { id: '29', name: 'Seven Eleven', company_name: 'Seven Eleven', website: '7-eleven.com', primary_color: '#ee3124' },
  { id: '30', name: 'Scholastic School', company_name: 'Scholastic', website: 'scholastic.com', primary_color: '#ed1c24' },
  { id: '31', name: 'CRISIL', company_name: 'CRISIL Limited', website: 'crisil.com', primary_color: '#0066cc' },
  { id: '32', name: 'TARZ Distribution', company_name: 'TARZ Distribution India Pvt Ltd', website: 'tarz.in', primary_color: '#000000' },
  { id: '33', name: 'Raheja Realty', company_name: 'Raheja Developers', website: 'rahejadevelopers.com', primary_color: '#8b0000' },
  { id: '34', name: 'Donatekart', company_name: 'Donatekart', website: 'donatekart.com', primary_color: '#ff6600' },
  { id: '35', name: 'Dreamz Group', company_name: 'Dreamz Group', website: 'dreamz.co.in', primary_color: '#4169e1' },
  { id: '36', name: 'Jeebr', company_name: 'Jeebr Internet Services', website: 'jeebr.com', primary_color: '#00a859' },
  { id: '37', name: 'Voice of Slum', company_name: 'Voice of Slum', website: 'voiceofslum.org', primary_color: '#ff6600' },
  { id: '38', name: 'CryptoRelief', company_name: 'CryptoRelief', website: 'cryptorelief.in', primary_color: '#f7931a' },
  { id: '39', name: 'Ryder Cycles', company_name: 'Ryder Cycles', website: 'rydercycles.com', primary_color: '#000000' },
  { id: '40', name: 'Hero Cycles', company_name: 'Hero Cycles', website: 'herocycles.com', primary_color: '#ed1c24' },
  { id: '41', name: 'Praja', company_name: 'Praja Foundation', website: 'praja.org', primary_color: '#ff6600' },
  { id: '42', name: 'AVNI', company_name: 'AVNI', website: 'avniproject.org', primary_color: '#4a90e2' },
  { id: '43', name: 'Indinfravit', company_name: 'India Infrastructure Trust', website: 'indinfravit.com', primary_color: '#003d79' },
  { id: '44', name: 'Total Sports & Fitness', company_name: 'Total Sports & Fitness', website: 'totalsportsfitness.com', primary_color: '#ed1c24' },
  { id: '45', name: 'MarketPlace', company_name: 'The Daily Convenience Store', website: 'marketplace.in', primary_color: '#228b22' },
  { id: '46', name: 'eClerx', company_name: 'eClerx Services Limited', website: 'eclerx.com', primary_color: '#0066cc' },
];

// Demo Users - All 46 companies
export const users: User[] = [
  { id: 'u1', email: 'client@interise.com', password: 'demo123', full_name: 'Interise Client', role: 'client', csr_partner_id: '1' },
  { id: 'u2', email: 'client@tcs.com', password: 'demo123', full_name: 'TCS Marathon Team', role: 'client', csr_partner_id: '2' },
  { id: 'u3', email: 'client@amazon.com', password: 'demo123', full_name: 'Amazon CSR', role: 'client', csr_partner_id: '3' },
  { id: 'u4', email: 'client@hdfcbank.com', password: 'demo123', full_name: 'HDFC Bank CSR', role: 'client', csr_partner_id: '4' },
  { id: 'u5', email: 'client@adityabirla.com', password: 'demo123', full_name: 'Birla Foundation', role: 'client', csr_partner_id: '5' },
  { id: 'u6', email: 'client@inorbit.in', password: 'demo123', full_name: 'Inorbit Malls CSR', role: 'client', csr_partner_id: '6' },
  { id: 'u7', email: 'client@fiserv.com', password: 'demo123', full_name: 'Fiserv CSR', role: 'client', csr_partner_id: '7' },
  { id: 'u8', email: 'client@bureauveritas.com', password: 'demo123', full_name: 'Bureau Veritas CSR', role: 'client', csr_partner_id: '8' },
  { id: 'u9', email: 'client@sonypicturesnetworks.com', password: 'demo123', full_name: 'Sony Network CSR', role: 'client', csr_partner_id: '9' },
  { id: 'u10', email: 'client@kasez.gov.in', password: 'demo123', full_name: 'KASEZ CSR', role: 'client', csr_partner_id: '10' },
  { id: 'u11', email: 'client@jpmorgan.com', password: 'demo123', full_name: 'JP Morgan CSR', role: 'client', csr_partner_id: '11' },
  { id: 'u12', email: 'client@decathlon.in', password: 'demo123', full_name: 'Decathlon India CSR', role: 'client', csr_partner_id: '12' },
  { id: 'u13', email: 'client@sunteckrealty.com', password: 'demo123', full_name: 'Sunteck Dahisar CSR', role: 'client', csr_partner_id: '13' },
  { id: 'u14', email: 'client@ppfas.com', password: 'demo123', full_name: 'PPFAS MF Team', role: 'client', csr_partner_id: '14' },
  { id: 'u15', email: 'client@insider.in', password: 'demo123', full_name: 'Paytm Insider CSR', role: 'client', csr_partner_id: '15' },
  { id: 'u16', email: 'client@acepipeline.com', password: 'demo123', full_name: 'ACE Pipeline CSR', role: 'client', csr_partner_id: '16' },
  { id: 'u17', email: 'client@jmcprojects.com', password: 'demo123', full_name: 'JMC Projects CSR', role: 'client', csr_partner_id: '17' },
  { id: 'u18', email: 'client@unitedwaymumbai.org', password: 'demo123', full_name: 'United Way Team', role: 'client', csr_partner_id: '18' },
  { id: 'u19', email: 'client@kalpataru.com', password: 'demo123', full_name: 'Kalpataru CSR', role: 'client', csr_partner_id: '19' },
  { id: 'u20', email: 'client@dharmaproductions.com', password: 'demo123', full_name: 'Yash Johar Foundation', role: 'client', csr_partner_id: '20' },
  { id: 'u21', email: 'client@oceanspray.com', password: 'demo123', full_name: 'Ocean Fruit CSR', role: 'client', csr_partner_id: '21' },
  { id: 'u22', email: 'client@hdfcergo.com', password: 'demo123', full_name: 'HDFC ERGO CSR', role: 'client', csr_partner_id: '22' },
  { id: 'u23', email: 'client@godharmic.com', password: 'demo123', full_name: 'Go Dharmic Team', role: 'client', csr_partner_id: '23' },
  { id: 'u24', email: 'client@cianagro.com', password: 'demo123', full_name: 'CIAN Agro CSR', role: 'client', csr_partner_id: '24' },
  { id: 'u25', email: 'client@mydabbawala.com', password: 'demo123', full_name: 'Dabbawala Team', role: 'client', csr_partner_id: '25' },
  { id: 'u26', email: 'client@metro.co.in', password: 'demo123', full_name: 'Metro Wholesale CSR', role: 'client', csr_partner_id: '26' },
  { id: 'u27', email: 'client@kiva.ai', password: 'demo123', full_name: 'Kiva.ai Team', role: 'client', csr_partner_id: '27' },
  { id: 'u28', email: 'client@suntecksaathi.com', password: 'demo123', full_name: 'Sunteck Saathi CSR', role: 'client', csr_partner_id: '28' },
  { id: 'u29', email: 'client@7-eleven.com', password: 'demo123', full_name: 'Seven Eleven CSR', role: 'client', csr_partner_id: '29' },
  { id: 'u30', email: 'client@scholastic.com', password: 'demo123', full_name: 'Scholastic Team', role: 'client', csr_partner_id: '30' },
  { id: 'u31', email: 'client@crisil.com', password: 'demo123', full_name: 'CRISIL CSR', role: 'client', csr_partner_id: '31' },
  { id: 'u32', email: 'client@tarz.in', password: 'demo123', full_name: 'TARZ Distribution CSR', role: 'client', csr_partner_id: '32' },
  { id: 'u33', email: 'client@rahejadevelopers.com', password: 'demo123', full_name: 'Raheja Realty CSR', role: 'client', csr_partner_id: '33' },
  { id: 'u34', email: 'client@donatekart.com', password: 'demo123', full_name: 'Donatekart Team', role: 'client', csr_partner_id: '34' },
  { id: 'u35', email: 'client@dreamz.co.in', password: 'demo123', full_name: 'Dreamz Group CSR', role: 'client', csr_partner_id: '35' },
  { id: 'u36', email: 'client@jeebr.com', password: 'demo123', full_name: 'Jeebr Team', role: 'client', csr_partner_id: '36' },
  { id: 'u37', email: 'client@voiceofslum.org', password: 'demo123', full_name: 'Voice of Slum Team', role: 'client', csr_partner_id: '37' },
  { id: 'u38', email: 'client@cryptorelief.in', password: 'demo123', full_name: 'CryptoRelief Team', role: 'client', csr_partner_id: '38' },
  { id: 'u39', email: 'client@rydercycles.com', password: 'demo123', full_name: 'Ryder Cycles CSR', role: 'client', csr_partner_id: '39' },
  { id: 'u40', email: 'client@herocycles.com', password: 'demo123', full_name: 'Hero Cycles CSR', role: 'client', csr_partner_id: '40' },
  { id: 'u41', email: 'client@praja.org', password: 'demo123', full_name: 'Praja Foundation', role: 'client', csr_partner_id: '41' },
  { id: 'u42', email: 'client@avniproject.org', password: 'demo123', full_name: 'AVNI Team', role: 'client', csr_partner_id: '42' },
  { id: 'u43', email: 'client@indinfravit.com', password: 'demo123', full_name: 'Indinfravit CSR', role: 'client', csr_partner_id: '43' },
  { id: 'u44', email: 'client@totalsportsfitness.com', password: 'demo123', full_name: 'Total Sports Team', role: 'client', csr_partner_id: '44' },
  { id: 'u45', email: 'client@marketplace.in', password: 'demo123', full_name: 'MarketPlace CSR', role: 'client', csr_partner_id: '45' },
  { id: 'u46', email: 'client@eclerx.com', password: 'demo123', full_name: 'eClerx CSR Team', role: 'client', csr_partner_id: '46' },
];

// Projects - Complete data for all 46 companies
export const projects: Project[] = [
  // Interise Solutions (1)
  { 
    id: 'p1', 
    csr_partner_id: '1', 
    name: 'LAJJA', 
    code: 'LAJJA-2025', 
    description: 'Women Hygiene - Period Stigma ko Dena hai Maat, Toh Lajja ki kya Baat...!!!', 
    status: 'active', 
    location: 'Mumbai', 
    state: 'Maharashtra', 
    start_date: '2025-01-01', 
    end_date: '2025-12-31', 
    total_budget: 5000000, 
    utilized_budget: 2725000, 
    beneficiaries_current: 12000, 
    beneficiaries_target: 15000,
    project_metrics: {
      pads_donated: { current: 11000, target: 15000 },
      sessions_conducted: { current: 120, target: 150 }
    }
  },
  { 
    id: 'p2', 
    csr_partner_id: '1', 
    name: 'SHOONYA', 
    code: 'SHOONYA-2025', 
    description: 'Zero waste management - Recycling, Reusing & Regenerating for a cleaner India', 
    status: 'active', 
    location: 'Pune', 
    state: 'Maharashtra', 
    start_date: '2025-02-01', 
    end_date: '2025-11-30', 
    total_budget: 3000000, 
    utilized_budget: 1200000, 
    beneficiaries_current: 8500, 
    beneficiaries_target: 12000,
    project_metrics: {
      waste_collected_kg: { current: 62000, target: 100000 },
      trees_planted: { current: 3500, target: 5000 },
      plastic_recycled_kg: { current: 15000, target: 25000 },
      communities_covered: { current: 25, target: 40 }
    }
  },
  { 
    id: 'p3', 
    csr_partner_id: '1', 
    name: 'GYANDAAN', 
    code: 'GYAAN-2025', 
    description: 'Education - Providing knowledge to the underprivileged through open schools, libraries & scholarships', 
    status: 'active', 
    location: 'Lucknow', 
    state: 'Uttar Pradesh', 
    start_date: '2025-03-01', 
    end_date: '2025-12-31', 
    total_budget: 4000000, 
    utilized_budget: 1600000, 
    beneficiaries_current: 2800, 
    beneficiaries_target: 5000,
    project_metrics: {
      students_enrolled: { current: 2800, target: 5000 },
      schools_renovated: { current: 8, target: 15 },
      libraries_setup: { current: 12, target: 20 },
      scholarships_given: { current: 45, target: 100 }
    }
  },
  { 
    id: 'p3a', 
    csr_partner_id: '1', 
    name: 'KILL HUNGER', 
    code: 'KH-2025', 
    description: 'Health & Hunger - If you can\'t feed 100 people then feed just 1', 
    status: 'active', 
    location: 'Mumbai', 
    state: 'Maharashtra', 
    start_date: '2025-01-15', 
    end_date: '2025-12-31', 
    total_budget: 6000000, 
    utilized_budget: 3200000, 
    beneficiaries_current: 8500, 
    beneficiaries_target: 15000,
    project_metrics: {
      meals_distributed: { current: 125000, target: 200000 },
      ration_kits_distributed: { current: 10000, target: 15000 },
      families_fed: { current: 8500, target: 15000 }
    }
  },
  
  // TCS Marathon (2)
  { id: 'p4', csr_partner_id: '2', name: 'Marathon Training Program', code: 'MTP-2025', description: 'Community running and fitness initiative', status: 'active', location: 'Mumbai', state: 'Maharashtra', start_date: '2025-01-15', end_date: '2025-12-15', total_budget: 8000000, utilized_budget: 4500000, beneficiaries_current: 1200, beneficiaries_target: 5000 },
  { id: 'p5', csr_partner_id: '2', name: 'Digital Literacy Drive', code: 'DLD-2025', description: 'IT skills training for underprivileged youth', status: 'active', location: 'Bangalore', state: 'Karnataka', start_date: '2025-02-01', end_date: '2025-11-30', total_budget: 6000000, utilized_budget: 3200000, beneficiaries_current: 800, beneficiaries_target: 3000 },
  
  // Amazon (3)
  { id: 'p6', csr_partner_id: '3', name: 'Amazon Future Engineer', code: 'AFE-2025', description: 'STEM education for rural students', status: 'active', location: 'Hyderabad', state: 'Telangana', start_date: '2025-01-10', end_date: '2025-12-20', total_budget: 10000000, utilized_budget: 5500000, beneficiaries_current: 2000, beneficiaries_target: 10000 },
  { id: 'p7', csr_partner_id: '3', name: 'Saheli Program', code: 'SAH-2025', description: 'Women entrepreneurship development', status: 'active', location: 'Delhi', state: 'Delhi', start_date: '2025-02-15', end_date: '2025-12-31', total_budget: 7500000, utilized_budget: 3800000, beneficiaries_current: 600, beneficiaries_target: 2500 },
  
  // HDFC Bank (4)
  { id: 'p8', csr_partner_id: '4', name: 'Parivartan', code: 'PAR-2025', description: 'Holistic rural development program', status: 'active', location: 'Pune', state: 'Maharashtra', start_date: '2025-01-01', end_date: '2025-12-31', total_budget: 12000000, utilized_budget: 6800000, beneficiaries_current: 3000, beneficiaries_target: 15000 },
  { id: 'p9', csr_partner_id: '4', name: 'Financial Literacy', code: 'FINLIT-2025', description: 'Banking and finance education', status: 'active', location: 'Ahmedabad', state: 'Gujarat', start_date: '2025-02-01', end_date: '2025-11-30', total_budget: 5000000, utilized_budget: 2600000, beneficiaries_current: 1500, beneficiaries_target: 8000 },
  
  // Aditya Birla (5)
  { id: 'p10', csr_partner_id: '5', name: 'Aditya Vidyalaya', code: 'AV-2025', description: 'Quality education in tribal areas', status: 'active', location: 'Nagda', state: 'Madhya Pradesh', start_date: '2025-01-05', end_date: '2025-12-25', total_budget: 9000000, utilized_budget: 4700000, beneficiaries_current: 1800, beneficiaries_target: 7000 },
  { id: 'p11', csr_partner_id: '5', name: 'Healthcare Mission', code: 'HCM-2025', description: 'Mobile health clinics in rural areas', status: 'active', location: 'Renukoot', state: 'Uttar Pradesh', start_date: '2025-02-10', end_date: '2025-12-20', total_budget: 8500000, utilized_budget: 4200000, beneficiaries_current: 2500, beneficiaries_target: 12000 },
  
  // Inorbit Malls (6)
  { id: 'p12', csr_partner_id: '6', name: 'Community Skilling Hub', code: 'CSH-2025', description: 'Retail and hospitality training', status: 'active', location: 'Hyderabad', state: 'Telangana', start_date: '2025-01-20', end_date: '2025-12-15', total_budget: 4000000, utilized_budget: 2100000, beneficiaries_current: 500, beneficiaries_target: 2000 },
  { id: 'p13', csr_partner_id: '6', name: 'Green Spaces Initiative', code: 'GSI-2025', description: 'Urban gardening and sustainability', status: 'active', location: 'Mumbai', state: 'Maharashtra', start_date: '2025-03-01', end_date: '2025-11-30', total_budget: 3000000, utilized_budget: 1400000, beneficiaries_current: 300, beneficiaries_target: 1500 },
  
  // Fiserv (7)
  { id: 'p14', csr_partner_id: '7', name: 'FinTech Education', code: 'FTE-2025', description: 'Digital payment literacy program', status: 'active', location: 'Pune', state: 'Maharashtra', start_date: '2025-01-15', end_date: '2025-12-10', total_budget: 5500000, utilized_budget: 2900000, beneficiaries_current: 900, beneficiaries_target: 4000 },
  
  // Bureau Veritas (8)
  { id: 'p15', csr_partner_id: '8', name: 'Safety First', code: 'SF-2025', description: 'Workplace safety training', status: 'active', location: 'Chennai', state: 'Tamil Nadu', start_date: '2025-02-01', end_date: '2025-11-30', total_budget: 4500000, utilized_budget: 2300000, beneficiaries_current: 700, beneficiaries_target: 3000 },
  
  // Enter10 TV (9)
  { id: 'p16', csr_partner_id: '9', name: 'Media Literacy Program', code: 'MLP-2025', description: 'Digital content creation training', status: 'active', location: 'Mumbai', state: 'Maharashtra', start_date: '2025-01-10', end_date: '2025-12-20', total_budget: 3500000, utilized_budget: 1800000, beneficiaries_current: 400, beneficiaries_target: 1800 },
  
  // KASEZ (10)
  { id: 'p17', csr_partner_id: '10', name: 'Skill Development Zone', code: 'SDZ-2025', description: 'Industrial training for youth', status: 'active', location: 'Kandla', state: 'Gujarat', start_date: '2025-02-15', end_date: '2025-12-15', total_budget: 6000000, utilized_budget: 3100000, beneficiaries_current: 1100, beneficiaries_target: 5000 },
  
  // J.P. Morgan (11)
  { id: 'p18', csr_partner_id: '11', name: 'Career Pathways', code: 'CP-2025', description: 'Employment readiness program', status: 'active', location: 'Mumbai', state: 'Maharashtra', start_date: '2025-01-05', end_date: '2025-12-25', total_budget: 8000000, utilized_budget: 4300000, beneficiaries_current: 1500, beneficiaries_target: 6000 },
  { id: 'p19', csr_partner_id: '11', name: 'Financial Inclusion', code: 'FI-2025', description: 'Microfinance and banking access', status: 'active', location: 'Bangalore', state: 'Karnataka', start_date: '2025-02-20', end_date: '2025-12-10', total_budget: 7000000, utilized_budget: 3600000, beneficiaries_current: 1200, beneficiaries_target: 5500 },
  
  // Decathlon (12)
  { id: 'p20', csr_partner_id: '12', name: 'Sports For All', code: 'SFA-2025', description: 'Community sports development', status: 'active', location: 'Bangalore', state: 'Karnataka', start_date: '2025-01-15', end_date: '2025-12-15', total_budget: 5000000, utilized_budget: 2700000, beneficiaries_current: 1000, beneficiaries_target: 4500 },
  { id: 'p21', csr_partner_id: '12', name: 'Cycling Initiative', code: 'CI-2025', description: 'Promote cycling culture and fitness', status: 'active', location: 'Chennai', state: 'Tamil Nadu', start_date: '2025-02-01', end_date: '2025-11-30', total_budget: 3500000, utilized_budget: 1800000, beneficiaries_current: 600, beneficiaries_target: 2500 },
  
  // Sunteck Realty (13)
  { id: 'p22', csr_partner_id: '13', name: 'Affordable Housing Support', code: 'AHS-2025', description: 'Housing for underprivileged families', status: 'active', location: 'Mumbai', state: 'Maharashtra', start_date: '2025-01-10', end_date: '2025-12-20', total_budget: 15000000, utilized_budget: 8200000, beneficiaries_current: 500, beneficiaries_target: 2000 },
  
  // PPFAS (14)
  { id: 'p23', csr_partner_id: '14', name: 'Investment Literacy', code: 'IL-2025', description: 'Financial planning education', status: 'active', location: 'Mumbai', state: 'Maharashtra', start_date: '2025-02-01', end_date: '2025-11-30', total_budget: 3000000, utilized_budget: 1500000, beneficiaries_current: 400, beneficiaries_target: 2000 },
  
  // Paytm Insider (15)
  { id: 'p24', csr_partner_id: '15', name: 'Arts & Culture Program', code: 'ACP-2025', description: 'Supporting local artists and performers', status: 'active', location: 'Delhi', state: 'Delhi', start_date: '2025-01-20', end_date: '2025-12-15', total_budget: 4000000, utilized_budget: 2100000, beneficiaries_current: 300, beneficiaries_target: 1500 },
  
  // ACE Pipeline (16)
  { id: 'p25', csr_partner_id: '16', name: 'Infrastructure Training', code: 'IT-2025', description: 'Technical skills for construction', status: 'active', location: 'Jaipur', state: 'Rajasthan', start_date: '2025-02-10', end_date: '2025-12-10', total_budget: 5000000, utilized_budget: 2600000, beneficiaries_current: 800, beneficiaries_target: 3500 },
  
  // JMC Projects (17)
  { id: 'p26', csr_partner_id: '17', name: 'Builder Training Academy', code: 'BTA-2025', description: 'Construction skills development', status: 'active', location: 'Ahmedabad', state: 'Gujarat', start_date: '2025-01-15', end_date: '2025-12-15', total_budget: 6000000, utilized_budget: 3200000, beneficiaries_current: 1000, beneficiaries_target: 4000 },
  
  // United Way Mumbai (18)
  { id: 'p27', csr_partner_id: '18', name: 'Community Care', code: 'CC-2025', description: 'Integrated community development', status: 'active', location: 'Mumbai', state: 'Maharashtra', start_date: '2025-01-01', end_date: '2025-12-31', total_budget: 10000000, utilized_budget: 5500000, beneficiaries_current: 2500, beneficiaries_target: 10000 },
  { id: 'p28', csr_partner_id: '18', name: 'Education Excellence', code: 'EE-2025', description: 'Quality education in slums', status: 'active', location: 'Mumbai', state: 'Maharashtra', start_date: '2025-02-01', end_date: '2025-11-30', total_budget: 7000000, utilized_budget: 3700000, beneficiaries_current: 1800, beneficiaries_target: 7000 },
  
  // Kalpataru (19)
  { id: 'p29', csr_partner_id: '19', name: 'Green Building Initiative', code: 'GBI-2025', description: 'Sustainable construction practices', status: 'active', location: 'Pune', state: 'Maharashtra', start_date: '2025-01-20', end_date: '2025-12-20', total_budget: 8000000, utilized_budget: 4200000, beneficiaries_current: 600, beneficiaries_target: 2500 },
  
  // Yash Johar Foundation (20)
  { id: 'p30', csr_partner_id: '20', name: 'Film & Entertainment Training', code: 'FET-2025', description: 'Entertainment industry skills', status: 'active', location: 'Mumbai', state: 'Maharashtra', start_date: '2025-02-15', end_date: '2025-12-10', total_budget: 5000000, utilized_budget: 2600000, beneficiaries_current: 500, beneficiaries_target: 2000 },
  
  // Ocean Fruit Drink (21)
  { id: 'p31', csr_partner_id: '21', name: 'Nutrition Awareness', code: 'NA-2025', description: 'Health and nutrition education', status: 'active', location: 'Kolkata', state: 'West Bengal', start_date: '2025-01-10', end_date: '2025-12-15', total_budget: 3500000, utilized_budget: 1800000, beneficiaries_current: 700, beneficiaries_target: 3000 },
  
  // HDFC ERGO (22)
  { id: 'p32', csr_partner_id: '22', name: 'Health Insurance Awareness', code: 'HIA-2025', description: 'Insurance literacy program', status: 'active', location: 'Mumbai', state: 'Maharashtra', start_date: '2025-02-01', end_date: '2025-11-30', total_budget: 4000000, utilized_budget: 2100000, beneficiaries_current: 900, beneficiaries_target: 4000 },
  
  // Go Dharmic (23)
  { id: 'p33', csr_partner_id: '23', name: 'Cultural Heritage Program', code: 'CHP-2025', description: 'Preserving traditional arts', status: 'active', location: 'Varanasi', state: 'Uttar Pradesh', start_date: '2025-01-15', end_date: '2025-12-20', total_budget: 3000000, utilized_budget: 1500000, beneficiaries_current: 400, beneficiaries_target: 1800 },
  
  // CIAN Agro (24)
  { id: 'p34', csr_partner_id: '24', name: 'Farmer Empowerment', code: 'FE-2025', description: 'Agricultural training and support', status: 'active', location: 'Nashik', state: 'Maharashtra', start_date: '2025-02-10', end_date: '2025-12-15', total_budget: 6000000, utilized_budget: 3100000, beneficiaries_current: 1500, beneficiaries_target: 6000 },
  
  // Mumbai Dabbawala (25)
  { id: 'p35', csr_partner_id: '25', name: 'Food Service Training', code: 'FST-2025', description: 'Logistics and delivery skills', status: 'active', location: 'Mumbai', state: 'Maharashtra', start_date: '2025-01-05', end_date: '2025-12-25', total_budget: 2500000, utilized_budget: 1300000, beneficiaries_current: 300, beneficiaries_target: 1200 },
  
  // Metro Wholesale (26)
  { id: 'p36', csr_partner_id: '26', name: 'Retail Excellence', code: 'RE-2025', description: 'Modern retail training', status: 'active', location: 'Bangalore', state: 'Karnataka', start_date: '2025-02-01', end_date: '2025-11-30', total_budget: 5000000, utilized_budget: 2600000, beneficiaries_current: 800, beneficiaries_target: 3500 },
  
  // Kiva.ai (27)
  { id: 'p37', csr_partner_id: '27', name: 'AI For Good', code: 'AI4G-2025', description: 'Artificial intelligence education', status: 'active', location: 'Hyderabad', state: 'Telangana', start_date: '2025-01-20', end_date: '2025-12-15', total_budget: 7000000, utilized_budget: 3700000, beneficiaries_current: 600, beneficiaries_target: 2500 },
  
  // Sunteck Saathi (28)
  { id: 'p38', csr_partner_id: '28', name: 'Community Building', code: 'CB-2025', description: 'Neighborhood development program', status: 'active', location: 'Mumbai', state: 'Maharashtra', start_date: '2025-02-15', end_date: '2025-12-10', total_budget: 4500000, utilized_budget: 2300000, beneficiaries_current: 500, beneficiaries_target: 2000 },
  
  // Seven Eleven (29)
  { id: 'p39', csr_partner_id: '29', name: 'Quick Commerce Training', code: 'QCT-2025', description: 'Convenience store operations', status: 'active', location: 'Delhi', state: 'Delhi', start_date: '2025-01-10', end_date: '2025-12-20', total_budget: 3500000, utilized_budget: 1800000, beneficiaries_current: 400, beneficiaries_target: 1600 },
  
  // Scholastic (30)
  { id: 'p40', csr_partner_id: '30', name: 'Reading For All', code: 'RFA-2025', description: 'Literacy and library program', status: 'active', location: 'Pune', state: 'Maharashtra', start_date: '2025-02-01', end_date: '2025-11-30', total_budget: 4000000, utilized_budget: 2100000, beneficiaries_current: 1000, beneficiaries_target: 4500 },
  
  // CRISIL (31)
  { id: 'p41', csr_partner_id: '31', name: 'Rating & Analysis Skills', code: 'RAS-2025', description: 'Financial analysis training', status: 'active', location: 'Mumbai', state: 'Maharashtra', start_date: '2025-01-15', end_date: '2025-12-15', total_budget: 5000000, utilized_budget: 2600000, beneficiaries_current: 500, beneficiaries_target: 2000 },
  
  // TARZ Distribution (32)
  { id: 'p42', csr_partner_id: '32', name: 'Supply Chain Academy', code: 'SCA-2025', description: 'Logistics and distribution training', status: 'active', location: 'Ahmedabad', state: 'Gujarat', start_date: '2025-02-10', end_date: '2025-12-10', total_budget: 3500000, utilized_budget: 1800000, beneficiaries_current: 600, beneficiaries_target: 2500 },
  
  // Raheja Developers (33)
  { id: 'p43', csr_partner_id: '33', name: 'Smart City Skills', code: 'SCS-2025', description: 'Urban planning education', status: 'active', location: 'Mumbai', state: 'Maharashtra', start_date: '2025-01-05', end_date: '2025-12-25', total_budget: 8000000, utilized_budget: 4200000, beneficiaries_current: 700, beneficiaries_target: 3000 },
  
  // Donatekart (34)
  { id: 'p44', csr_partner_id: '34', name: 'Charity & Giving Program', code: 'CGP-2025', description: 'Social entrepreneurship training', status: 'active', location: 'Bangalore', state: 'Karnataka', start_date: '2025-02-01', end_date: '2025-11-30', total_budget: 3000000, utilized_budget: 1500000, beneficiaries_current: 400, beneficiaries_target: 1800 },
  
  // Dreamz Group (35)
  { id: 'p45', csr_partner_id: '35', name: 'Innovation Lab', code: 'IL-2025', description: 'Startup and innovation ecosystem', status: 'active', location: 'Hyderabad', state: 'Telangana', start_date: '2025-01-20', end_date: '2025-12-15', total_budget: 6000000, utilized_budget: 3100000, beneficiaries_current: 500, beneficiaries_target: 2000 },
  
  // Jeebr (36)
  { id: 'p46', csr_partner_id: '36', name: 'Digital Services Training', code: 'DST-2025', description: 'Internet services and e-commerce', status: 'active', location: 'Pune', state: 'Maharashtra', start_date: '2025-02-15', end_date: '2025-12-10', total_budget: 4000000, utilized_budget: 2100000, beneficiaries_current: 600, beneficiaries_target: 2500 },
  
  // Voice of Slum (37)
  { id: 'p47', csr_partner_id: '37', name: 'Slum Development', code: 'SD-2025', description: 'Community development in slums', status: 'active', location: 'Mumbai', state: 'Maharashtra', start_date: '2025-01-10', end_date: '2025-12-20', total_budget: 5000000, utilized_budget: 2600000, beneficiaries_current: 1500, beneficiaries_target: 6000 },
  
  // CryptoRelief (38)
  { id: 'p48', csr_partner_id: '38', name: 'Blockchain Education', code: 'BE-2025', description: 'Cryptocurrency and blockchain training', status: 'active', location: 'Bangalore', state: 'Karnataka', start_date: '2025-02-01', end_date: '2025-11-30', total_budget: 7000000, utilized_budget: 3700000, beneficiaries_current: 400, beneficiaries_target: 1500 },
  
  // Ryder Cycles (39)
  { id: 'p49', csr_partner_id: '39', name: 'Cycling For Health', code: 'CFH-2025', description: 'Promoting cycling and fitness', status: 'active', location: 'Chennai', state: 'Tamil Nadu', start_date: '2025-01-15', end_date: '2025-12-15', total_budget: 3000000, utilized_budget: 1500000, beneficiaries_current: 500, beneficiaries_target: 2000 },
  
  // Hero Cycles (40)
  { id: 'p50', csr_partner_id: '40', name: 'Cycle Manufacturing Training', code: 'CMT-2025', description: 'Technical skills for cycle industry', status: 'active', location: 'Ludhiana', state: 'Punjab', start_date: '2025-02-10', end_date: '2025-12-10', total_budget: 4500000, utilized_budget: 2300000, beneficiaries_current: 700, beneficiaries_target: 3000 },
  
  // Praja Foundation (41)
  { id: 'p51', csr_partner_id: '41', name: 'Civic Engagement', code: 'CE-2025', description: 'Citizen participation and governance', status: 'active', location: 'Mumbai', state: 'Maharashtra', start_date: '2025-01-05', end_date: '2025-12-25', total_budget: 3500000, utilized_budget: 1800000, beneficiaries_current: 600, beneficiaries_target: 2500 },
  
  // AVNI (42)
  { id: 'p52', csr_partner_id: '42', name: 'Healthcare Data Management', code: 'HDM-2025', description: 'Digital health records training', status: 'active', location: 'Pune', state: 'Maharashtra', start_date: '2025-02-01', end_date: '2025-11-30', total_budget: 5000000, utilized_budget: 2600000, beneficiaries_current: 400, beneficiaries_target: 1600 },
  
  // Indinfravit (43)
  { id: 'p53', csr_partner_id: '43', name: 'Infrastructure Academy', code: 'IA-2025', description: 'Civil engineering training', status: 'active', location: 'Delhi', state: 'Delhi', start_date: '2025-01-20', end_date: '2025-12-15', total_budget: 9000000, utilized_budget: 4700000, beneficiaries_current: 800, beneficiaries_target: 3500 },
  
  // Total Sports & Fitness (44)
  { id: 'p54', csr_partner_id: '44', name: 'Fitness For Everyone', code: 'FFE-2025', description: 'Community fitness program', status: 'active', location: 'Mumbai', state: 'Maharashtra', start_date: '2025-02-15', end_date: '2025-12-10', total_budget: 4000000, utilized_budget: 2100000, beneficiaries_current: 900, beneficiaries_target: 4000 },
  
  // MarketPlace (45)
  { id: 'p55', csr_partner_id: '45', name: 'Grocery & Retail Skills', code: 'GRS-2025', description: 'Modern grocery retail training', status: 'active', location: 'Bangalore', state: 'Karnataka', start_date: '2025-01-10', end_date: '2025-12-20', total_budget: 3500000, utilized_budget: 1800000, beneficiaries_current: 500, beneficiaries_target: 2000 },
  
  // eClerx (46)
  { id: 'p56', csr_partner_id: '46', name: 'Data Analytics Training', code: 'DAT-2025', description: 'Data science and analytics skills', status: 'active', location: 'Pune', state: 'Maharashtra', start_date: '2025-02-01', end_date: '2025-11-30', total_budget: 6000000, utilized_budget: 3100000, beneficiaries_current: 700, beneficiaries_target: 3000 },
];

// Timelines
export const timelines: Timeline[] = [
  // LAJJA Project (p1)
  {
    id: 't1',
    project_id: 'p1',
    title: 'Phase 1: Menstrual Awareness Survey',
    start_date: '2025-01-01',
    end_date: '2025-03-31',
    completion_percentage: 100,
    is_critical_path: true,
    color: '#10b981',
  },
  {
    id: 't2',
    project_id: 'p1',
    title: 'Phase 2: Doctor Sessions & Education',
    start_date: '2025-04-01',
    end_date: '2025-07-31',
    completion_percentage: 65,
    is_critical_path: true,
    color: '#8b5cf6',
  },
  {
    id: 't3',
    project_id: 'p1',
    title: 'Phase 3: Hygiene Kit Distribution',
    start_date: '2025-08-01',
    end_date: '2025-12-31',
    completion_percentage: 20,
    is_critical_path: false,
    color: '#8b5cf6',
  },
  {
    id: 't4',
    project_id: 'p1',
    title: 'Menstrupedia Guidebook Publication',
    start_date: '2025-02-15',
    end_date: '2025-06-30',
    completion_percentage: 80,
    is_critical_path: false,
    color: '#8b5cf6',
  },
  {
    id: 't5',
    project_id: 'p1',
    title: 'Women Helpline Setup & Monitoring',
    start_date: '2025-05-01',
    end_date: '2025-10-31',
    completion_percentage: 45,
    is_critical_path: false,
    color: '#8b5cf6',
  },
  
  // SHOONYA Project (p2)
  {
    id: 't6',
    project_id: 'p2',
    title: 'Waste Audit & Baseline Study',
    start_date: '2025-02-01',
    end_date: '2025-03-31',
    completion_percentage: 100,
    is_critical_path: true,
    color: '#10b981',
  },
  {
    id: 't7',
    project_id: 'p2',
    title: 'Segregation Infrastructure Setup',
    start_date: '2025-04-01',
    end_date: '2025-06-30',
    completion_percentage: 70,
    is_critical_path: true,
    color: '#8b5cf6',
  },
  {
    id: 't8',
    project_id: 'p2',
    title: 'Community Awareness Campaign',
    start_date: '2025-03-15',
    end_date: '2025-08-31',
    completion_percentage: 55,
    is_critical_path: false,
    color: '#8b5cf6',
  },
  {
    id: 't9',
    project_id: 'p2',
    title: 'Composting Units Installation',
    start_date: '2025-07-01',
    end_date: '2025-11-30',
    completion_percentage: 30,
    is_critical_path: true,
    color: '#8b5cf6',
  },
  
  // GYANDAAN Project (p3)
  {
    id: 't10',
    project_id: 'p3',
    title: 'Open School Program Launch',
    start_date: '2025-03-01',
    end_date: '2025-04-30',
    completion_percentage: 100,
    is_critical_path: true,
    color: '#10b981',
  },
  {
    id: 't11',
    project_id: 'p3',
    title: 'School Renovation & Infrastructure',
    start_date: '2025-05-01',
    end_date: '2025-07-31',
    completion_percentage: 60,
    is_critical_path: true,
    color: '#8b5cf6',
  },
  {
    id: 't12',
    project_id: 'p3',
    title: 'Library Setup & Book Distribution',
    start_date: '2025-06-01',
    end_date: '2025-09-30',
    completion_percentage: 40,
    is_critical_path: false,
    color: '#8b5cf6',
  },
  {
    id: 't13',
    project_id: 'p3',
    title: 'Student Enrollment & Scholarship',
    start_date: '2025-04-01',
    end_date: '2025-06-30',
    completion_percentage: 100,
    is_critical_path: true,
    color: '#10b981',
  },
  {
    id: 't14',
    project_id: 'p3',
    title: 'Sports Quota & Skill Training',
    start_date: '2025-08-01',
    end_date: '2025-12-31',
    completion_percentage: 25,
    is_critical_path: false,
    color: '#8b5cf6',
  },

  // KILL HUNGER Project (p3a)
  {
    id: 't15',
    project_id: 'p3a',
    title: 'Ration Kit Preparation & Distribution',
    start_date: '2025-01-15',
    end_date: '2025-04-30',
    completion_percentage: 100,
    is_critical_path: true,
    color: '#10b981',
  },
  {
    id: 't16',
    project_id: 'p3a',
    title: 'Community Kitchen Setup',
    start_date: '2025-02-01',
    end_date: '2025-05-31',
    completion_percentage: 75,
    is_critical_path: true,
    color: '#8b5cf6',
  },
  {
    id: 't17',
    project_id: 'p3a',
    title: 'Food Distribution Network',
    start_date: '2025-03-01',
    end_date: '2025-08-31',
    completion_percentage: 60,
    is_critical_path: false,
    color: '#8b5cf6',
  },
  {
    id: 't18',
    project_id: 'p3a',
    title: 'Disaster Relief Operations',
    start_date: '2025-06-01',
    end_date: '2025-12-31',
    completion_percentage: 30,
    is_critical_path: false,
    color: '#8b5cf6',
  },
];

// Generate additional timelines for all projects (p4 to p56)
const additionalTimelines: Timeline[] = [];
for (let i = 4; i <= 56; i++) {
  const projectId = `p${i}`;
  const project = projects.find(p => p.id === projectId);
  if (project) {
    const baseId = i * 10;
    additionalTimelines.push(
      {
        id: `t${baseId + 1}`,
        project_id: projectId,
        title: `${project.name} - Phase 1: Initiation`,
        start_date: '2025-01-15',
        end_date: '2025-04-30',
        completion_percentage: 85,
        is_critical_path: true,
        color: '#10b981',
      },
      {
        id: `t${baseId + 2}`,
        project_id: projectId,
        title: `${project.name} - Phase 2: Execution`,
        start_date: '2025-05-01',
        end_date: '2025-09-30',
        completion_percentage: 50,
        is_critical_path: true,
        color: '#8b5cf6',
      },
      {
        id: `t${baseId + 3}`,
        project_id: projectId,
        title: `${project.name} - Phase 3: Closure`,
        start_date: '2025-10-01',
        end_date: '2025-12-31',
        completion_percentage: 20,
        is_critical_path: false,
        color: '#f59e0b',
      }
    );
  }
}

// Combine all timelines
export const allTimelines: Timeline[] = [...timelines, ...additionalTimelines];

// Reports
export const reports: Report[] = [
  // LAJJA Project (p1)
  {
    id: 'r1',
    project_id: 'p1',
    title: 'LAJJA - PROJECT REPORT Q1 2025',
    date: '2025-03-31',
    drive_link: 'https://drive.google.com/file/lajja-q1',
  },
  {
    id: 'r2',
    project_id: 'p1',
    title: 'LAJJA - PROJECT REPORT Q2 2025',
    date: '2025-06-30',
    drive_link: 'https://drive.google.com/file/lajja-q2',
  },
  {
    id: 'r3',
    project_id: 'p1',
    title: 'LAJJA - IMPACT ASSESSMENT REPORT',
    date: '2025-07-15',
    drive_link: 'https://drive.google.com/file/lajja-impact',
  },
  {
    id: 'r4',
    project_id: 'p1',
    title: 'LAJJA - TRAINING COMPLETION REPORT',
    date: '2025-08-01',
    drive_link: 'https://drive.google.com/file/lajja-training',
  },
  
  // SHOONYA Project (p2)
  {
    id: 'r5',
    project_id: 'p2',
    title: 'SHOONYA - BASELINE WASTE AUDIT REPORT',
    date: '2025-03-31',
    drive_link: 'https://drive.google.com/file/shoonya-audit',
  },
  {
    id: 'r6',
    project_id: 'p2',
    title: 'SHOONYA - QUARTERLY PROGRESS Q1',
    date: '2025-04-30',
    drive_link: 'https://drive.google.com/file/shoonya-q1',
  },
  {
    id: 'r7',
    project_id: 'p2',
    title: 'SHOONYA - QUARTERLY PROGRESS Q2',
    date: '2025-07-31',
    drive_link: 'https://drive.google.com/file/shoonya-q2',
  },
  {
    id: 'r8',
    project_id: 'p2',
    title: 'SHOONYA - COMMUNITY ENGAGEMENT REPORT',
    date: '2025-08-15',
    drive_link: 'https://drive.google.com/file/shoonya-engagement',
  },
  
  // EDUCATION FOR ALL Project (p3)
  {
    id: 'r9',
    project_id: 'p3',
    title: 'EFA - SCHOOL INFRASTRUCTURE ASSESSMENT',
    date: '2025-04-30',
    drive_link: 'https://drive.google.com/file/efa-infra',
  },
  {
    id: 'r10',
    project_id: 'p3',
    title: 'EFA - TEACHER TRAINING COMPLETION REPORT',
    date: '2025-07-31',
    drive_link: 'https://drive.google.com/file/efa-teacher',
  },
  {
    id: 'r11',
    project_id: 'p3',
    title: 'EFA - STUDENT ENROLLMENT DATA Q1',
    date: '2025-06-30',
    drive_link: 'https://drive.google.com/file/efa-enrollment',
  },
  {
    id: 'r12',
    project_id: 'p3',
    title: 'EFA - MID-TERM PROGRESS REPORT',
    date: '2025-08-31',
    drive_link: 'https://drive.google.com/file/efa-midterm',
  },
];

// Generate additional reports for all projects (p4 to p56)
const additionalReports: Report[] = [];
for (let i = 4; i <= 56; i++) {
  const projectId = `p${i}`;
  const project = projects.find(p => p.id === projectId);
  if (project) {
    const baseId = i * 10;
    additionalReports.push(
      { id: `r${baseId + 1}`, project_id: projectId, title: `${project.name} - Q1 Progress Report 2025`, date: '2025-03-31', drive_link: `https://drive.google.com/file/${projectId}-q1` },
      { id: `r${baseId + 2}`, project_id: projectId, title: `${project.name} - Q2 Progress Report 2025`, date: '2025-06-30', drive_link: `https://drive.google.com/file/${projectId}-q2` },
      { id: `r${baseId + 3}`, project_id: projectId, title: `${project.name} - Impact Assessment Report`, date: '2025-09-15', drive_link: `https://drive.google.com/file/${projectId}-impact` }
    );
  }
}

// Combine all reports
export const allReports: Report[] = [...reports, ...additionalReports];

// Real Time Updates
export const realTimeUpdates: RealTimeUpdate[] = [
  // LAJJA Project (p1)
  {
    id: 'rtu1',
    project_id: 'p1',
    title: 'LAJJA - WOMEN EMPOWERMENT WORKSHOP - 05/11/2025',
    date: '2025-11-05',
    description: 'Conducted entrepreneurship workshop at Mumbai center',
    is_downloadable: true,
    drive_link: 'https://drive.google.com/file/lajja-update1',
  },
  {
    id: 'rtu2',
    project_id: 'p1',
    title: 'LAJJA - SKILL TRAINING SESSION - 28/10/2025',
    date: '2025-10-28',
    description: 'Vocational training for 50 beneficiaries completed',
    is_downloadable: true,
    drive_link: 'https://drive.google.com/file/lajja-update2',
  },
  {
    id: 'rtu3',
    project_id: 'p1',
    title: 'LAJJA - DIGITAL LITERACY PROGRAM - 15/10/2025',
    date: '2025-10-15',
    description: 'Digital skills training session for women',
    is_downloadable: true,
    drive_link: 'https://drive.google.com/file/lajja-update3',
  },
  {
    id: 'rtu4',
    project_id: 'p1',
    title: 'LAJJA - MICROFINANCE DISTRIBUTION - 01/10/2025',
    date: '2025-10-01',
    description: 'Distributed microloans to 30 women entrepreneurs',
    is_downloadable: true,
    drive_link: 'https://drive.google.com/file/lajja-update4',
  },
  {
    id: 'rtu5',
    project_id: 'p1',
    title: 'LAJJA - HEALTH & HYGIENE AWARENESS - 20/09/2025',
    date: '2025-09-20',
    description: 'Health awareness session conducted',
    is_downloadable: true,
    drive_link: 'https://drive.google.com/file/lajja-update5',
  },
  
  // SHOONYA Project (p2)
  {
    id: 'rtu6',
    project_id: 'p2',
    title: 'SHOONYA - COMPOSTING UNIT INAUGURATION - 03/11/2025',
    date: '2025-11-03',
    description: 'New composting facility launched in Pune',
    is_downloadable: true,
    drive_link: 'https://drive.google.com/file/shoonya-update1',
  },
  {
    id: 'rtu7',
    project_id: 'p2',
    title: 'SHOONYA - WASTE SEGREGATION DRIVE - 25/10/2025',
    date: '2025-10-25',
    description: 'Community waste segregation awareness campaign',
    is_downloadable: true,
    drive_link: 'https://drive.google.com/file/shoonya-update2',
  },
  {
    id: 'rtu8',
    project_id: 'p2',
    title: 'SHOONYA - RECYCLING WORKSHOP - 10/10/2025',
    date: '2025-10-10',
    description: 'Workshop on plastic recycling techniques',
    is_downloadable: true,
    drive_link: 'https://drive.google.com/file/shoonya-update3',
  },
  {
    id: 'rtu9',
    project_id: 'p2',
    title: 'SHOONYA - ZERO WASTE EVENT - 28/09/2025',
    date: '2025-09-28',
    description: 'Organized zero waste community event',
    is_downloadable: true,
    drive_link: 'https://drive.google.com/file/shoonya-update4',
  },
  
  // EDUCATION FOR ALL Project (p3)
  {
    id: 'rtu10',
    project_id: 'p3',
    title: 'EFA - SMART CLASSROOM INAUGURATION - 07/11/2025',
    date: '2025-11-07',
    description: 'New smart classroom inaugurated at Govt School Jaipur',
    is_downloadable: true,
    drive_link: 'https://drive.google.com/file/efa-update1',
  },
  {
    id: 'rtu11',
    project_id: 'p3',
    title: 'EFA - TEACHER TRAINING BATCH 2 - 30/10/2025',
    date: '2025-10-30',
    description: 'Second batch of teacher training completed',
    is_downloadable: true,
    drive_link: 'https://drive.google.com/file/efa-update2',
  },
  {
    id: 'rtu12',
    project_id: 'p3',
    title: 'EFA - LIBRARY BOOKS DISTRIBUTION - 18/10/2025',
    date: '2025-10-18',
    description: 'Distributed 500+ books to rural schools',
    is_downloadable: true,
    drive_link: 'https://drive.google.com/file/efa-update3',
  },
  {
    id: 'rtu13',
    project_id: 'p3',
    title: 'EFA - STUDENT SCHOLARSHIP AWARD - 05/10/2025',
    date: '2025-10-05',
    description: 'Merit scholarships awarded to 100 students',
    is_downloadable: true,
    drive_link: 'https://drive.google.com/file/efa-update4',
  },
  {
    id: 'rtu14',
    project_id: 'p3',
    title: 'EFA - COMPUTER LAB SETUP - 22/09/2025',
    date: '2025-09-22',
    description: 'Computer lab with 25 systems set up',
    is_downloadable: true,
    drive_link: 'https://drive.google.com/file/efa-update5',
  },
];

// Generate additional updates for all projects (p4 to p56)
const additionalUpdates: RealTimeUpdate[] = [];
for (let i = 4; i <= 56; i++) {
  const projectId = `p${i}`;
  const project = projects.find(p => p.id === projectId);
  if (project) {
    const baseId = i * 10;
    additionalUpdates.push(
      { id: `rtu${baseId + 1}`, project_id: projectId, title: `${project.name} - Activity Update - 05/11/2025`, date: '2025-11-05', description: `Latest progress on ${project.name}`, is_downloadable: true, drive_link: `https://drive.google.com/file/${projectId}-update1` },
      { id: `rtu${baseId + 2}`, project_id: projectId, title: `${project.name} - Training Session - 25/10/2025`, date: '2025-10-25', description: `Training completed for ${project.name}`, is_downloadable: true, drive_link: `https://drive.google.com/file/${projectId}-update2` },
      { id: `rtu${baseId + 3}`, project_id: projectId, title: `${project.name} - Community Event - 10/10/2025`, date: '2025-10-10', description: `Community engagement for ${project.name}`, is_downloadable: true, drive_link: `https://drive.google.com/file/${projectId}-update3` }
    );
  }
}

// Combine all updates
export const allRealTimeUpdates: RealTimeUpdate[] = [...realTimeUpdates, ...additionalUpdates];

// Media - Photos
export const mediaPhotos: Media[] = [
  // LAJJA Project (p1)
  {
    id: 'mp1',
    project_id: 'p1',
    title: 'LAJJA - WORKSHOP GEO TAGGED PHOTO',
    type: 'photo',
    date: '2025-11-05',
    is_geo_tagged: true,
    drive_link: 'https://drive.google.com/file/lajja-photo1',
  },
  {
    id: 'mp2',
    project_id: 'p1',
    title: 'LAJJA - TRAINING SESSION GEO TAGGED',
    type: 'photo',
    date: '2025-10-28',
    is_geo_tagged: true,
    drive_link: 'https://drive.google.com/file/lajja-photo2',
  },
  {
    id: 'mp3',
    project_id: 'p1',
    title: 'LAJJA - BENEFICIARY GROUP PHOTO',
    type: 'photo',
    date: '2025-10-15',
    is_geo_tagged: false,
    drive_link: 'https://drive.google.com/file/lajja-photo3',
  },
  {
    id: 'mp4',
    project_id: 'p1',
    title: 'LAJJA - SKILL TRAINING EVENT',
    type: 'photo',
    date: '2025-09-20',
    is_geo_tagged: true,
    drive_link: 'https://drive.google.com/file/lajja-photo4',
  },
  {
    id: 'mp5',
    project_id: 'p1',
    title: 'LAJJA - CERTIFICATE DISTRIBUTION',
    type: 'photo',
    date: '2025-08-30',
    is_geo_tagged: false,
    drive_link: 'https://drive.google.com/file/lajja-photo5',
  },
  
  // SHOONYA Project (p2)
  {
    id: 'mp6',
    project_id: 'p2',
    title: 'SHOONYA - COMPOSTING UNIT GEO TAGGED',
    type: 'photo',
    date: '2025-11-03',
    is_geo_tagged: true,
    drive_link: 'https://drive.google.com/file/shoonya-photo1',
  },
  {
    id: 'mp7',
    project_id: 'p2',
    title: 'SHOONYA - WASTE SEGREGATION DEMO',
    type: 'photo',
    date: '2025-10-25',
    is_geo_tagged: true,
    drive_link: 'https://drive.google.com/file/shoonya-photo2',
  },
  {
    id: 'mp8',
    project_id: 'p2',
    title: 'SHOONYA - RECYCLING WORKSHOP',
    type: 'photo',
    date: '2025-10-10',
    is_geo_tagged: false,
    drive_link: 'https://drive.google.com/file/shoonya-photo3',
  },
  {
    id: 'mp9',
    project_id: 'p2',
    title: 'SHOONYA - COMMUNITY EVENT GEO TAGGED',
    type: 'photo',
    date: '2025-09-28',
    is_geo_tagged: true,
    drive_link: 'https://drive.google.com/file/shoonya-photo4',
  },
  {
    id: 'mp10',
    project_id: 'p2',
    title: 'SHOONYA - AWARENESS CAMPAIGN',
    type: 'photo',
    date: '2025-09-15',
    is_geo_tagged: false,
    drive_link: 'https://drive.google.com/file/shoonya-photo5',
  },
  
  // EDUCATION FOR ALL Project (p3)
  {
    id: 'mp11',
    project_id: 'p3',
    title: 'EFA - SMART CLASSROOM GEO TAGGED',
    type: 'photo',
    date: '2025-11-07',
    is_geo_tagged: true,
    drive_link: 'https://drive.google.com/file/efa-photo1',
  },
  {
    id: 'mp12',
    project_id: 'p3',
    title: 'EFA - TEACHER TRAINING SESSION',
    type: 'photo',
    date: '2025-10-30',
    is_geo_tagged: true,
    drive_link: 'https://drive.google.com/file/efa-photo2',
  },
  {
    id: 'mp13',
    project_id: 'p3',
    title: 'EFA - LIBRARY INAUGURATION',
    type: 'photo',
    date: '2025-10-18',
    is_geo_tagged: false,
    drive_link: 'https://drive.google.com/file/efa-photo3',
  },
  {
    id: 'mp14',
    project_id: 'p3',
    title: 'EFA - SCHOLARSHIP CEREMONY GEO TAGGED',
    type: 'photo',
    date: '2025-10-05',
    is_geo_tagged: true,
    drive_link: 'https://drive.google.com/file/efa-photo4',
  },
  {
    id: 'mp15',
    project_id: 'p3',
    title: 'EFA - COMPUTER LAB SETUP',
    type: 'photo',
    date: '2025-09-22',
    is_geo_tagged: true,
    drive_link: 'https://drive.google.com/file/efa-photo5',
  },
  {
    id: 'mp16',
    project_id: 'p3',
    title: 'EFA - STUDENTS IN CLASSROOM',
    type: 'photo',
    date: '2025-09-10',
    is_geo_tagged: false,
    drive_link: 'https://drive.google.com/file/efa-photo6',
  },
];

// Generate additional photos for all projects (p4 to p56)
const additionalPhotos: Media[] = [];
for (let i = 4; i <= 56; i++) {
  const projectId = `p${i}`;
  const project = projects.find(p => p.id === projectId);
  if (project) {
    const baseId = i * 10;
    additionalPhotos.push(
      { id: `mp${baseId + 1}`, project_id: projectId, title: `${project.name} - Activity Photo 1`, type: 'photo', date: '2025-11-05', is_geo_tagged: true, drive_link: `https://drive.google.com/file/${projectId}-photo1` },
      { id: `mp${baseId + 2}`, project_id: projectId, title: `${project.name} - Activity Photo 2`, type: 'photo', date: '2025-10-25', is_geo_tagged: true, drive_link: `https://drive.google.com/file/${projectId}-photo2` },
      { id: `mp${baseId + 3}`, project_id: projectId, title: `${project.name} - Activity Photo 3`, type: 'photo', date: '2025-10-10', is_geo_tagged: false, drive_link: `https://drive.google.com/file/${projectId}-photo3` }
    );
  }
}

// Combine all photos
export const allMediaPhotos: Media[] = [...mediaPhotos, ...additionalPhotos];

// Media - Videos
export const mediaVideos: Media[] = [
  // LAJJA Project (p1)
  {
    id: 'mv1',
    project_id: 'p1',
    title: 'LAJJA - EMPOWERMENT WORKSHOP VIDEO',
    type: 'video',
    date: '2025-11-05',
    is_geo_tagged: true,
    drive_link: 'https://drive.google.com/file/lajja-video1',
  },
  {
    id: 'mv2',
    project_id: 'p1',
    title: 'LAJJA - SKILL TRAINING SESSION VIDEO',
    type: 'video',
    date: '2025-10-28',
    is_geo_tagged: true,
    drive_link: 'https://drive.google.com/file/lajja-video2',
  },
  {
    id: 'mv3',
    project_id: 'p1',
    title: 'LAJJA - BENEFICIARY TESTIMONIALS',
    type: 'video',
    date: '2025-10-15',
    is_geo_tagged: false,
    drive_link: 'https://drive.google.com/file/lajja-video3',
  },
  {
    id: 'mv4',
    project_id: 'p1',
    title: 'LAJJA - SUCCESS STORIES',
    type: 'video',
    date: '2025-09-20',
    is_geo_tagged: false,
    drive_link: 'https://drive.google.com/file/lajja-video4',
  },
  
  // SHOONYA Project (p2)
  {
    id: 'mv5',
    project_id: 'p2',
    title: 'SHOONYA - COMPOSTING PROCESS VIDEO',
    type: 'video',
    date: '2025-11-03',
    is_geo_tagged: true,
    drive_link: 'https://drive.google.com/file/shoonya-video1',
  },
  {
    id: 'mv6',
    project_id: 'p2',
    title: 'SHOONYA - WASTE SEGREGATION GUIDE',
    type: 'video',
    date: '2025-10-25',
    is_geo_tagged: true,
    drive_link: 'https://drive.google.com/file/shoonya-video2',
  },
  {
    id: 'mv7',
    project_id: 'p2',
    title: 'SHOONYA - RECYCLING WORKSHOP HIGHLIGHTS',
    type: 'video',
    date: '2025-10-10',
    is_geo_tagged: false,
    drive_link: 'https://drive.google.com/file/shoonya-video3',
  },
  {
    id: 'mv8',
    project_id: 'p2',
    title: 'SHOONYA - COMMUNITY ENGAGEMENT',
    type: 'video',
    date: '2025-09-28',
    is_geo_tagged: false,
    drive_link: 'https://drive.google.com/file/shoonya-video4',
  },
  
  // EDUCATION FOR ALL Project (p3)
  {
    id: 'mv9',
    project_id: 'p3',
    title: 'EFA - SMART CLASSROOM DEMO',
    type: 'video',
    date: '2025-11-07',
    is_geo_tagged: true,
    drive_link: 'https://drive.google.com/file/efa-video1',
  },
  {
    id: 'mv10',
    project_id: 'p3',
    title: 'EFA - TEACHER TRAINING HIGHLIGHTS',
    type: 'video',
    date: '2025-10-30',
    is_geo_tagged: true,
    drive_link: 'https://drive.google.com/file/efa-video2',
  },
  {
    id: 'mv11',
    project_id: 'p3',
    title: 'EFA - STUDENT LEARNING JOURNEY',
    type: 'video',
    date: '2025-10-18',
    is_geo_tagged: false,
    drive_link: 'https://drive.google.com/file/efa-video3',
  },
  {
    id: 'mv12',
    project_id: 'p3',
    title: 'EFA - SCHOLARSHIP AWARD CEREMONY',
    type: 'video',
    date: '2025-10-05',
    is_geo_tagged: false,
    drive_link: 'https://drive.google.com/file/efa-video4',
  },
  {
    id: 'mv13',
    project_id: 'p3',
    title: 'EFA - COMPUTER LAB INAUGURATION',
    type: 'video',
    date: '2025-09-22',
    is_geo_tagged: true,
    drive_link: 'https://drive.google.com/file/efa-video5',
  },
];

// Generate additional videos for all projects (p4 to p56)
const additionalVideos: Media[] = [];
for (let i = 4; i <= 56; i++) {
  const projectId = `p${i}`;
  const project = projects.find(p => p.id === projectId);
  if (project) {
    const baseId = i * 10;
    additionalVideos.push(
      { id: `mv${baseId + 1}`, project_id: projectId, title: `${project.name} - Activity Video 1`, type: 'video', date: '2025-11-05', is_geo_tagged: true, drive_link: `https://drive.google.com/file/${projectId}-video1` },
      { id: `mv${baseId + 2}`, project_id: projectId, title: `${project.name} - Activity Video 2`, type: 'video', date: '2025-10-25', is_geo_tagged: false, drive_link: `https://drive.google.com/file/${projectId}-video2` }
    );
  }
}

// Combine all videos
export const allMediaVideos: Media[] = [...mediaVideos, ...additionalVideos];

// Articles / Newspaper Cuttings
export const articles: Article[] = [
  // LAJJA Project (p1)
  {
    id: 'a1',
    project_id: 'p1',
    title: 'LAJJA EMPOWERS 500 WOMEN IN MUMBAI - TIMES OF INDIA',
    date: '2025-11-05',
    is_featured: true,
    drive_link: 'https://drive.google.com/file/lajja-article1',
  },
  {
    id: 'a2',
    project_id: 'p1',
    title: 'WOMEN ENTREPRENEURS SHINE AT LAJJA EVENT - MAHARASHTRA TIMES',
    date: '2025-10-28',
    is_featured: true,
    drive_link: 'https://drive.google.com/file/lajja-article2',
  },
  {
    id: 'a3',
    project_id: 'p1',
    title: 'DIGITAL LITERACY TRANSFORMS RURAL WOMEN - INDIAN EXPRESS',
    date: '2025-10-15',
    is_featured: false,
    drive_link: 'https://drive.google.com/file/lajja-article3',
  },
  {
    id: 'a4',
    project_id: 'p1',
    title: 'LAJJA PROJECT WINS STATE AWARD - HINDUSTAN TIMES',
    date: '2025-09-20',
    is_featured: true,
    drive_link: 'https://drive.google.com/file/lajja-article4',
  },
  {
    id: 'a5',
    project_id: 'p1',
    title: 'MICROFINANCE BOOSTS WOMEN BUSINESSES - ECONOMIC TIMES',
    date: '2025-09-01',
    is_featured: false,
    drive_link: 'https://drive.google.com/file/lajja-article5',
  },
  
  // SHOONYA Project (p2)
  {
    id: 'a6',
    project_id: 'p2',
    title: 'PUNE GOES ZERO WASTE WITH SHOONYA - PUNE MIRROR',
    date: '2025-11-03',
    is_featured: true,
    drive_link: 'https://drive.google.com/file/shoonya-article1',
  },
  {
    id: 'a7',
    project_id: 'p2',
    title: 'COMPOSTING REVOLUTION IN PUNE - TIMES OF INDIA',
    date: '2025-10-25',
    is_featured: true,
    drive_link: 'https://drive.google.com/file/shoonya-article2',
  },
  {
    id: 'a8',
    project_id: 'p2',
    title: 'SHOONYA REDUCES 50% WASTE IN 6 MONTHS - INDIAN EXPRESS',
    date: '2025-10-10',
    is_featured: false,
    drive_link: 'https://drive.google.com/file/shoonya-article3',
  },
  {
    id: 'a9',
    project_id: 'p2',
    title: 'COMMUNITY JOINS ZERO WASTE MOVEMENT - MAHARASHTRA TIMES',
    date: '2025-09-28',
    is_featured: false,
    drive_link: 'https://drive.google.com/file/shoonya-article4',
  },
  {
    id: 'a10',
    project_id: 'p2',
    title: 'GREEN INITIATIVE WINS NATIONAL RECOGNITION - HINDUSTAN TIMES',
    date: '2025-09-15',
    is_featured: true,
    drive_link: 'https://drive.google.com/file/shoonya-article5',
  },
  
  // EDUCATION FOR ALL Project (p3)
  {
    id: 'a11',
    project_id: 'p3',
    title: 'SMART CLASSROOMS TRANSFORM RURAL EDUCATION - RAJASTHAN PATRIKA',
    date: '2025-11-07',
    is_featured: true,
    drive_link: 'https://drive.google.com/file/efa-article1',
  },
  {
    id: 'a12',
    project_id: 'p3',
    title: '100 TEACHERS TRAINED IN JAIPUR - TIMES OF INDIA',
    date: '2025-10-30',
    is_featured: true,
    drive_link: 'https://drive.google.com/file/efa-article2',
  },
  {
    id: 'a13',
    project_id: 'p3',
    title: 'EDUCATION FOR ALL REACHES 2000 STUDENTS - INDIAN EXPRESS',
    date: '2025-10-18',
    is_featured: false,
    drive_link: 'https://drive.google.com/file/efa-article3',
  },
  {
    id: 'a14',
    project_id: 'p3',
    title: 'MERIT SCHOLARSHIPS CHANGE LIVES - HINDUSTAN TIMES',
    date: '2025-10-05',
    is_featured: true,
    drive_link: 'https://drive.google.com/file/efa-article4',
  },
  {
    id: 'a15',
    project_id: 'p3',
    title: 'DIGITAL DIVIDE NARROWED IN RURAL RAJASTHAN - ECONOMIC TIMES',
    date: '2025-09-22',
    is_featured: false,
    drive_link: 'https://drive.google.com/file/efa-article5',
  },
  {
    id: 'a16',
    project_id: 'p3',
    title: 'EFA PROJECT IMPACTS 350 BENEFICIARIES - DAINIK BHASKAR',
    date: '2025-09-10',
    is_featured: false,
    drive_link: 'https://drive.google.com/file/efa-article6',
  },
];

// Generate additional articles for all projects (p4 to p56)
const additionalArticles: Article[] = [];
for (let i = 4; i <= 56; i++) {
  const projectId = `p${i}`;
  const project = projects.find(p => p.id === projectId);
  if (project) {
    const baseId = i * 10;
    const newspapers = ['Times of India', 'Indian Express', 'Hindustan Times', 'Economic Times'];
    additionalArticles.push(
      { id: `a${baseId + 1}`, project_id: projectId, title: `${project.name.toUpperCase()} MAKES IMPACT - ${newspapers[i % 4]}`, date: '2025-11-05', is_featured: true, drive_link: `https://drive.google.com/file/${projectId}-article1` },
      { id: `a${baseId + 2}`, project_id: projectId, title: `${project.name.toUpperCase()} SUCCESS STORY - ${newspapers[(i+1) % 4]}`, date: '2025-10-25', is_featured: false, drive_link: `https://drive.google.com/file/${projectId}-article2` },
      { id: `a${baseId + 3}`, project_id: projectId, title: `${project.name.toUpperCase()} BENEFITS COMMUNITY - ${newspapers[(i+2) % 4]}`, date: '2025-10-10', is_featured: true, drive_link: `https://drive.google.com/file/${projectId}-article3` }
    );
  }
}

// Combine all articles
export const allArticles: Article[] = [...articles, ...additionalArticles];

// Dashboard Card Data
export const getDashboardMetrics = (partnerId: string, projectId?: string, state?: string) => {
  let filteredProjects = projects.filter(p => p.csr_partner_id === partnerId);
  
  if (projectId && projectId !== 'all') {
    filteredProjects = filteredProjects.filter(p => p.id === projectId);
  }
  
  if (state && state !== 'all') {
    filteredProjects = filteredProjects.filter(p => p.state === state);
  }

  const totalBeneficiaries = filteredProjects.reduce((sum, p) => sum + p.beneficiaries_current, 0);
  const targetBeneficiaries = filteredProjects.reduce((sum, p) => sum + p.beneficiaries_target, 0);
  const totalBudget = filteredProjects.reduce((sum, p) => sum + p.total_budget, 0);
  const utilizedBudget = filteredProjects.reduce((sum, p) => sum + p.utilized_budget, 0);

  // Aggregate project-specific metrics
  const aggregatedMetrics: Record<string, { current: number; target: number }> = {
    beneficiaries: { current: totalBeneficiaries, target: targetBeneficiaries },
    budget: { current: utilizedBudget, target: totalBudget },
    projects_active: { current: filteredProjects.filter(p => p.status === 'active').length, target: filteredProjects.length },
  };

  // Aggregate all project metrics
  filteredProjects.forEach(project => {
    if (project.project_metrics) {
      Object.entries(project.project_metrics).forEach(([key, value]) => {
        if (!aggregatedMetrics[key]) {
          aggregatedMetrics[key] = { current: 0, target: 0 };
        }
        aggregatedMetrics[key].current += value.current;
        aggregatedMetrics[key].target += value.target;
      });
    }
  });

  return aggregatedMetrics;
};
