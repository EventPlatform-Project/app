export interface Schedule {
  id?: number;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  speaker: string;
}

export interface Event {
  id?: number;
  title: string;
  description: string;
  category: string;
  maxPlaces: number;
  availablePlaces: number;
  organizerId: string;
  status: string;
  schedules?: Schedule[];
}