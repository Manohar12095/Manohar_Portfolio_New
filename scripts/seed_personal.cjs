const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://sqbrczfojykfhfugbisr.supabase.co',
  'sb_publishable_2sr3UUxFtn5ypkr8tCHWpA_Oxr6FMdl'
);

const personalDocs = [
  { id: '1sf9Czqtl8Zshiv-6s8CfVOZxdLuCOhT3', title: 'Aadhaar Card', type: 'document', category: 'Identity', desc: 'Government of India - National Identity Card' },
  { id: '1zrH6_O8Y1lty6ANUD1wikqZOfl-PDtej', title: 'PAN Card', type: 'document', category: 'Identity', desc: 'Income Tax Department Permanent Account Number' },
  { id: '18PylIai5Z83LrLbCXAqF75evMfiZuI3X', title: 'Passport', type: 'document', category: 'Identity', desc: 'Republic of India Official Passport Document' },
  { id: '1Hj-9fjl0QO99YT6dSnqTYw-K_ErwZCeU', title: 'Driving Licence', type: 'document', category: 'Identity', desc: 'Motor Vehicles Department Driving Licence' },
  { id: '1mHqSWbiKlV8PiqU-afYIG1Rp38LxquPg', title: 'College ID Card', type: 'document', category: 'Identity', desc: 'Official College Identity Verification Card' },
  { id: '1uIveGAUxbwU5uCfBa83WubHacPeMIKRH', title: 'Birth Certificate', type: 'document', category: 'Civil', desc: 'Government Registration of Birth Certificate' },
  { id: '1_YxxKbgUl1df79oI9zEk1mU6OoUcpMXN', title: 'Community Certificate', type: 'document', category: 'Civil', desc: 'Official Revenue Administration Community Certificate' },
  { id: '1jzxeOI4pORhw9y0smj3wy-PNrPAKMvyt', title: 'Bank Account Passbook / Statement', type: 'document', category: 'Financial', desc: 'Official Bank Account Verification & Statement' },
  { id: '1SYNNkOzp_YbDpol9LuHf9Y-JMKPinKeV', title: '10th Standard Marksheet', type: 'document', category: 'Academic', desc: 'Secondary School Leaving Certificate (SSLC) Examination Marksheet' },
  { id: '1BBsnPy5ZTB_rMN1cMRY-TSGI2rWPbPFr', title: '11th Standard Marksheet', type: 'document', category: 'Academic', desc: 'Higher Secondary First Year Examination Marksheet' },
  { id: '1Mg4lwfokRNpT-2trOef636rl_0ZyXa-8', title: '12th Standard Marksheet', type: 'document', category: 'Academic', desc: 'Higher Secondary School Certificate (HSC) Examination Marksheet' },
  { id: '1L3DEs07tb-i1m1cVnA9aR0K-6oigkzmj', title: 'B.E. Semester 1 Grade Sheet', type: 'document', category: 'Academic', desc: 'Bachelor of Engineering - Semester 1 Official Grade Sheet' },
  { id: '1c_3l47ft6e3kiT2btR2tuzar7AbUcOiU', title: 'B.E. Semester 3 Grade Sheet', type: 'document', category: 'Academic', desc: 'Bachelor of Engineering - Semester 3 Official Grade Sheet' },
  { id: '1ZuN3UQ7e86jmQtMwNpCI-DywNZroGfEW', title: 'Transfer Certificate (TC)', type: 'document', category: 'Academic', desc: 'Official Institutional Transfer & Conduct Certificate' },
];

async function seed() {
  console.log('Seeding personal items into Supabase...');
  for (let i = 0; i < personalDocs.length; i++) {
    const doc = personalDocs[i];
    const mediaUrl = `https://drive.google.com/file/d/${doc.id}/view?usp=sharing`;
    const payload = {
      title: doc.title,
      type: doc.type,
      content: doc.desc,
      media_url: mediaUrl,
      sort_order: i + 1,
      updated_at: new Date().toISOString()
    };
    
    // Check if exists
    const { data: existing } = await supabase.from('personal_items').select('id').eq('title', doc.title).maybeSingle();
    if (existing) {
      const { error } = await supabase.from('personal_items').update(payload).eq('id', existing.id);
      if (error) console.error('Error updating', doc.title, error.message);
      else console.log('Updated:', doc.title);
    } else {
      const { error } = await supabase.from('personal_items').insert(payload);
      if (error) console.error('Error inserting', doc.title, error.message);
      else console.log('Inserted:', doc.title);
    }
  }

  const { data: all } = await supabase.from('personal_items').select('*');
  console.log('Total personal_items in table:', all ? all.length : 0);
}

seed().catch(console.error);
