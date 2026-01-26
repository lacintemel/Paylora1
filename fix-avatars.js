import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAvatars() {
  try {
    // Tüm çalışanları çek
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, name, avatar');

    if (error) throw error;

    console.log(`Toplam çalışan: ${employees.length}`);

    // Avatar'ı soru işareti veya boş olan çalışanları göster
    const needsFix = employees.filter(emp => 
      emp.avatar === '?' || emp.avatar === '' || emp.avatar === null || !emp.avatar
    );

    console.log(`\n⚠️  Avatar'ı boş/hatalı olan çalışanlar (${needsFix.length}):`);
    needsFix.forEach(emp => {
      console.log(`  - ${emp.name} (ID: ${emp.id}) - Avatar: "${emp.avatar}"`);
    });

    // Avatar'ı olan çalışanları göster
    const hasAvatar = employees.filter(emp => emp.avatar && emp.avatar !== '?' && emp.avatar !== '');
    console.log(`\n✅ Avatar'ı olan çalışanlar (${hasAvatar.length}):`);
    hasAvatar.slice(0, 5).forEach(emp => {
      console.log(`  - ${emp.name}: ${emp.avatar}`);
    });

  } catch (error) {
    console.error('Hata:', error.message);
  }
}

fixAvatars();
