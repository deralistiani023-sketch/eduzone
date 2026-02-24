import { Subject } from './types';

export const SUBJECTS: Subject[] = [
  {
    id: 'pola-bilangan',
    title: 'Pola Bilangan',
    description: 'Mainkan Food Swap dan pecahkan pola bilangan!',
    icon: 'Hash',
    color: 'bg-pink-400',
    material: [
      'Pola bilangan adalah susunan angka yang memiliki aturan tertentu.',
      'Contoh: 2, 4, 6, 8 (Aturannya adalah ditambah 2).',
      'Ada pola bilangan ganjil, genap, persegi, dan lainnya.'
    ],
    questions: [
      { id: 1, text: 'Lanjutkan pola ini: 3, 6, 9, ...', options: ['10', '11', '12', '15'], correctAnswer: '12' },
      { id: 2, text: 'Apa aturan dari pola: 20, 15, 10, 5?', options: ['Tambah 5', 'Kurang 5', 'Kali 2', 'Bagi 2'], correctAnswer: 'Kurang 5' }
    ]
  },
  {
    id: 'rasio',
    title: 'Sky Hop (Rasio)',
    description: 'Bantu tikus lucu melompat di awan rasio!',
    icon: 'Scale',
    color: 'bg-blue-400',
    material: [
      'Rasio adalah perbandingan antara dua jumlah.',
      'Ditulis dengan tanda ":" atau sebagai pecahan.',
      'Contoh: Jika ada 2 apel dan 3 jeruk, rasionya adalah 2:3.'
    ],
    questions: [
      { id: 1, text: 'Rasio 4:8 jika disederhanakan menjadi...', options: ['1:2', '2:4', '1:4', '4:1'], correctAnswer: '1:2' },
      { id: 2, text: 'Ada 5 buku biru dan 10 buku merah. Rasio biru ke merah?', options: ['1:2', '2:1', '5:1', '1:5'], correctAnswer: '1:2' }
    ]
  },
  {
    id: 'pecahan-desimal',
    title: 'Pecahan & Desimal',
    description: 'Mengenal angka di balik koma.',
    icon: 'Percent',
    color: 'bg-green-400',
    material: [
      'Pecahan bisa diubah menjadi desimal dengan pembagian.',
      'Contoh: 1/2 sama dengan 0,5.',
      '0,25 sama dengan 1/4.'
    ],
    questions: [
      { id: 1, text: 'Bentuk desimal dari 3/4 adalah...', options: ['0,34', '0,75', '0,50', '0,25'], correctAnswer: '0,75' },
      { id: 2, text: '0,2 jika dijadikan pecahan biasa adalah...', options: ['1/2', '1/5', '2/5', '1/10'], correctAnswer: '1/5' }
    ]
  },
  {
    id: 'kubus-balok',
    title: 'Kubus & Balok',
    description: 'Menghitung volume bangun ruang.',
    icon: 'Box',
    color: 'bg-orange-400',
    material: [
      'Kubus memiliki 6 sisi yang sama besar.',
      'Volume Kubus = sisi x sisi x sisi.',
      'Volume Balok = panjang x lebar x tinggi.'
    ],
    questions: [
      { id: 1, text: 'Volume kubus dengan sisi 3 cm adalah...', options: ['9 cm³', '18 cm³', '27 cm³', '12 cm³'], correctAnswer: '27 cm³' },
      { id: 2, text: 'Balok dengan p=5, l=2, t=3 memiliki volume...', options: ['10 cm³', '15 cm³', '30 cm³', '25 cm³'], correctAnswer: '30 cm³' }
    ]
  },
  {
    id: 'peluang',
    title: 'Peluang',
    description: 'Seberapa mungkin sesuatu terjadi?',
    icon: 'Dices',
    color: 'bg-purple-400',
    material: [
      'Peluang adalah kemungkinan terjadinya suatu kejadian.',
      'Nilai peluang berkisar antara 0 sampai 1.',
      'Peluang = (Jumlah kejadian yang diinginkan) / (Total semua kemungkinan).'
    ],
    questions: [
      { id: 1, text: 'Peluang muncul angka genap pada dadu adalah...', options: ['1/2', '1/3', '1/6', '2/3'], correctAnswer: '1/2' },
      { id: 2, text: 'Melempar koin, peluang muncul "Gambar" adalah...', options: ['1', '0', '1/2', '1/4'], correctAnswer: '1/2' }
    ]
  }
];
