import { BaseRepository } from './base.repository';
import { TicketNote, CreateTicketNoteDto, NoteType } from '@/lib/types';

export class TicketNoteRepository extends BaseRepository<TicketNote> {
  constructor(useServiceRole = false) {
    super('ticket_notes', useServiceRole);
  }

  async findByTicket(ticketId: string): Promise<TicketNote[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        user:users!user_id (
          full_name,
          role
        )
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch notes for ticket: ${error.message}`);
    }

    return data as any[];
  }

  async findImportantNotes(ticketId?: string): Promise<TicketNote[]> {
    const filters: any = { is_important: true };
    if (ticketId) {
      filters.ticket_id = ticketId;
    }

    const client = await this.getClient();
    let query = client.from(this.tableName).select('*').eq('is_important', true);
    
    if (ticketId) {
      query = query.eq('ticket_id', ticketId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch important notes: ${error.message}`);
    }

    return data as TicketNote[];
  }

  async findByType(ticketId: string, noteType: NoteType): Promise<TicketNote[]> {
    return this.findAll({ 
      ticket_id: ticketId, 
      note_type: noteType 
    });
  }

  async createNote(data: CreateTicketNoteDto, userId?: string): Promise<TicketNote> {
    const noteData = {
      ...data,
      user_id: userId,
      is_important: data.is_important || false
    };

    return this.create(noteData);
  }

  async markAsImportant(noteId: string, important: boolean = true): Promise<TicketNote> {
    return this.update(noteId, { is_important: important });
  }

  async getRecentNotes(limit: number = 10): Promise<TicketNote[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select(`
        *,
        ticket:repair_tickets!ticket_id (
          ticket_number,
          device_brand,
          device_model
        ),
        user:users!user_id (
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch recent notes: ${error.message}`);
    }

    return data as any[];
  }
}