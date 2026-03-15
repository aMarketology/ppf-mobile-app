import { supabase } from '../lib/supabase';
import type { Conversation, Message } from '../lib/types';

export const messagesService = {
  // Get all conversations created by this user
  async getMyConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*, company:company_profiles(id, company_name, city, state, is_verified)')
      .eq('created_by', userId)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  // Create a new conversation
  async createConversation(params: {
    created_by: string;
    subject: string;
    company_id?: string;
    product_id?: string;
    order_id?: string;
  }): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .insert({ ...params, status: 'active' })
      .select('*, company:company_profiles(id, company_name)')
      .single();
    if (error) throw error;
    return data;
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles(id, full_name, email)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
  ): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, content })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  subscribeToMessages(
    conversationId: string,
    callback: (message: Message) => void,
  ) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        payload => callback(payload.new as Message),
      )
      .subscribe();
  },
};
