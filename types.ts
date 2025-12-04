
export interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration?: string;
  isFree?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  discounted_price?: number; // Prezzo per chi ha già acquistato
  image: string;
  features: string[];
  lessons: number;
  duration: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzato';
  videoUrl?: string; // Preview video
  lessons_content?: Lesson[]; // Nuova struttura dati
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  is_admin: boolean;
  purchased_courses: string[]; // Array of Course IDs
}

export interface PlatformSettings {
  id: number;
  logo_height: number;
  home_hero_title?: string;
  home_hero_subtitle?: string;
  meta_pixel_id?: string;
}

export enum AuthState {
  LOADING,
  AUTHENTICATED,
  UNAUTHENTICATED
}
