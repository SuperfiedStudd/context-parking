// DB operations for ai_second_opinions table
import { supabase } from '@/integrations/supabase/client';

export interface SecondOpinionRecord {
  id: string;
  project_id: string;
  compiled_context: string;
  instruction: string | null;
  response: string;
  ai_provider: string;
  ai_model: string;
  created_at: string;
}

export async function fetchSecondOpinions(projectId: string): Promise<SecondOpinionRecord[]> {
  const { data, error } = await supabase
    .from('ai_second_opinions' as any)
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as SecondOpinionRecord[];
}

export async function insertSecondOpinion(record: Omit<SecondOpinionRecord, 'id' | 'created_at'>): Promise<SecondOpinionRecord> {
  const { data, error } = await supabase
    .from('ai_second_opinions' as any)
    .insert(record as any)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as SecondOpinionRecord;
}

export async function deleteSecondOpinion(id: string): Promise<void> {
  const { error } = await supabase
    .from('ai_second_opinions' as any)
    .delete()
    .eq('id', id);

  if (error) throw error;
}
