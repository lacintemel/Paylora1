/**
 * Çalışanın adından avatar baş harflerini oluşturur
 * Örnek: "Ali Yılmaz" -> "AY"
 */
export const getInitials = (name) => {
  if (!name || name === '?' || name === '') return '?';
  
  const parts = name.trim().split(/\s+/).filter(p => p.length > 0);
  if (parts.length === 0) return '?';
  
  // İlk kelime ve son kelimeden baş harf al
  const firstInitial = parts[0].charAt(0).toUpperCase();
  const lastInitial = parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : '';
  
  return (firstInitial + lastInitial).substring(0, 2);
};

/**
 * Avatar değerinin geçerli resim URL'si olup olmadığını kontrol eder
 */
export const isValidImageUrl = (avatar) => {
  return avatar && 
         typeof avatar === 'string' && 
         avatar.startsWith('http') && 
         avatar !== '?' && 
         avatar !== '';
};

/**
 * Avatar gösterimi için helper function
 * URL ise img gösterir, yoksa baş harfleri gösterir
 */
export const renderAvatar = (employee) => {
  // Eğer avatar resim URL'si ise (http ile başlıyorsa)
  if (isValidImageUrl(employee?.avatar)) {
    return {
      type: 'image',
      src: employee.avatar
    };
  }
  
  // Yoksa baş harfleri göster
  return {
    type: 'initials',
    text: getInitials(employee?.name || 'Bilinmiyor')
  };
};
