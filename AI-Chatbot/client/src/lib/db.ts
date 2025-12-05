import Dexie, { type Table } from 'dexie';

export interface Chat {
  id?: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id?: number;
  chatId: number;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
}

export class ChatDatabase extends Dexie {
  chats!: Table<Chat>;
  messages!: Table<Message>;

  constructor() {
    super('AIChatProDB');
    this.version(1).stores({
      chats: '++id, title, createdAt, updatedAt',
      messages: '++id, chatId, role, createdAt'
    });
  }
}

export const db = new ChatDatabase();

export async function createChat(title: string = 'New Chat') {
  const id = await db.chats.add({
    title,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return id;
}

export async function addMessage(chatId: number, content: string, role: 'user' | 'assistant') {
  await db.messages.add({
    chatId,
    content,
    role,
    createdAt: new Date()
  });
  
  // Update chat timestamp
  await db.chats.update(chatId, { updatedAt: new Date() });
}
