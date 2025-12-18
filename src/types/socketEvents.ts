export interface Note {
  id: number;
  boardId: number;
  title: string;
  content: string;
  x: number;
  y: number;
  zIndex: number;
  color: string;
  updatedBy: number | null;
  updatedByUsername: string | null;
  comments: NoteComment[];
}

export interface NoteComment {
  id: string;
  user: string;
  text: string;
  timestamp: number;
}

// Server - Client events
export interface ServerToClientEvents {
  initialNotes: (notes: Note[]) => void;
  'note:created': (note: Note) => void;
  'note:updated': (note: Note) => void;
  'note:deleted': (data: { noteId: number }) => void;
  'note:commented': (data: { noteId: number; newComment: NoteComment }) => void;
  'presence:users': (users: string[]) => void;
  'server:error': (error: { message: string }) => void;
  'note:edit:started': (data: { noteId: number; editedBy: string }) => void;
  'note:edit:ended': (data: { noteId: number }) => void;
  'note:edit:locked': (data: { noteId: number; editedBy: string }) => void;
}

// Client - Server events
export interface ClientToServerEvents {
  joinBoard: (boardId: number) => void;
  leaveBoard: (boardId: number) => void;
  'note:create': (note: Partial<Note> & { boardId: number }) => void;
  'note:update': (note: Partial<Note> & { id: number; boardId: number }) => void;
  'note:delete': (data: { noteId: number; boardId: number }) => void;
  'note:comment': (data: { noteId: number; boardId: number; text: string }) => void;
  'note:edit:start': (data: { noteId: number; boardId: number }) => void;
  'note:edit:end': (data: { noteId: number; boardId: number }) => void;
}
