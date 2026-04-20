export const DIVISIONS = [
  'Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'
];

export const DISTRICTS: Record<string, string[]> = {
  'Dhaka': ['Dhaka', 'Gazipur', 'Narayanganj', 'Tangail', 'Faridpur', 'Madaripur', 'Manikganj', 'Munshiganj', 'Narsingdi', 'Rajbari', 'Shariatpur', 'Gopalganj', 'Kishoreganj'],
  'Chattogram': ['Chattogram', "Cox's Bazar", 'Brahmanbaria', 'Chandpur', 'Cumilla', 'Feni', 'Khagrachhari', 'Lakshmipur', 'Noakhali', 'Rangamati', 'Bandarban'],
  'Rajshahi': ['Rajshahi', 'Bogura', 'Joypurhat', 'Naogaon', 'Natore', 'Chapai Nawabganj', 'Pabna', 'Sirajganj'],
  'Khulna': ['Khulna', 'Bagherhat', 'Chuadanga', 'Jessore', 'Jhenaidah', 'Kushtia', 'Magura', 'Meherpur', 'Narail', 'Satkhira'],
  'Barishal': ['Barishal', 'Barguna', 'Bhola', 'Jhalokati', 'Patuakhali', 'Pirojpur'],
  'Sylhet': ['Sylhet', 'Habiganj', 'Moulvibazar', 'Sunamganj'],
  'Rangpur': ['Rangpur', 'Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Thakurgaon'],
  'Mymensingh': ['Mymensingh', 'Jamalpur', 'Netrokona', 'Sherpur']
};

export const TEMPLE_TYPES = [
  'Hindu Temple',
  'Buddhist Monastery',
  'Jagannath Temple',
  'Kali Temple',
  'Shiva Temple',
  'Radha Krishna Temple',
  'Durga Bari',
  'Ashram',
  'Other'
];

export const BADGE_STATS: Record<string, { label: string, min: number }> = {
  'NEWBIE': { label: 'নতুন অবদানকারী', min: 1 },
  'RISING': { label: 'উদীয়মান অবদানকারী', min: 2 },
  'DEDICATED': { label: 'নিবেদিত অবদানকারী', min: 5 },
  'GUARDIAN': { label: 'মন্দির রক্ষক', min: 10 }
};

export const CLOUDINARY_FOLDERS = {
  COVERS: 'amarmondir/covers',
  GALLERY: 'amarmondir/gallery',
  AVATARS: 'amarmondir/avatars'
};
