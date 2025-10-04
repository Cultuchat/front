export type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  price: string;
  category: string;
  image: string;
  organizer?: string;
  capacity?: number;
  duration?: string;
  registered?: boolean;
};
