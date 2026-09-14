export type Person = {
  name: string;
  role: string;
  parents?: string;
  photo: string;
};

export type WeddingEvent = {
  id: string;
  type: string;
  dateLabel: string;
  countdownDate?: string;
  startDateTime?: string;
  endDateTime?: string;
  time: string;
  venue?: string;
  address?: string;
  mapUrl?: string;
  mapLabel?: string;
  mapEmbedUrl?: string;
  venueImage?: string;
  venueImageAlt?: string;
  calendarTitle?: string;
  calendarDescription?: string;
};

export type GalleryPhoto =
  | string
  | {
      src: string;
      alt?: string;
      caption?: string;
    };

export type WeddingConfig = {
  couple: {
    bride: Person;
    groom: Person;
  };
  invitation: {
    eyebrow: string;
    introTitle: string;
    introText: string;
  };
  events: WeddingEvent[];
  hero: {
    image: string;
    overlay?: number;
    showMusicButton?: boolean;
    pageCount?: number;
  };
  gallery: {
    title: string;
    subtitle: string;
    photos: GalleryPhoto[];
  };
  music: {
    enabled: boolean;
    file: string;
    label?: string;
  };
  rsvp: {
    enabled: boolean;
    title: string;
    subtitle: string;
    attendanceOptions: string[];
    guestOptions: number[];
  };
  footer: {
    message: string;
  };
};
