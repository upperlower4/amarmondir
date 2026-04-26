export const DIVISIONS = [
  'Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'
];

export const DISTRICTS: Record<string, string[]> = {
  'Dhaka': ['Dhaka', 'Faridpur', 'Gazipur', 'Gopalganj', 'Kishoreganj', 'Madaripur', 'Manikganj', 'Munshiganj', 'Narayanganj', 'Narsingdi', 'Rajbari', 'Shariatpur', 'Tangail'],
  'Chattogram': ['Bandarban', 'Brahmanbaria', 'Chandpur', 'Chattogram', "Cox's Bazar", 'Cumilla', 'Feni', 'Khagrachhari', 'Lakshmipur', 'Noakhali', 'Rangamati'],
  'Rajshahi': ['Bogura', 'Chapai Nawabganj', 'Joypurhat', 'Naogaon', 'Natore', 'Pabna', 'Rajshahi', 'Sirajganj'],
  'Khulna': ['Bagerhat', 'Chuadanga', 'Jashore', 'Jhenaidah', 'Khulna', 'Kushtia', 'Magura', 'Meherpur', 'Narail', 'Satkhira'],
  'Barishal': ['Barguna', 'Barishal', 'Bhola', 'Jhalokati', 'Patuakhali', 'Pirojpur'],
  'Sylhet': ['Habiganj', 'Moulvibazar', 'Sunamganj', 'Sylhet'],
  'Rangpur': ['Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Rangpur', 'Thakurgaon'],
  'Mymensingh': ['Jamalpur', 'Mymensingh', 'Netrokona', 'Sherpur']
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
