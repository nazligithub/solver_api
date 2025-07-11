const supabase = require('../config/supabase');

class SimpleApp {
  static async findById(id) {
    const { data, error } = await supabase
      .from('apps')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async findAll() {
    const { data, error } = await supabase
      .from('apps')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) throw error;
    return data;
  }
  
  static async create({ name, status }) {
    const { data, error } = await supabase
      .from('apps')
      .insert([{ name, status }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async update(id, { name, status }) {
    const { data, error } = await supabase
      .from('apps')
      .update({ name, status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async delete(id) {
    const { data, error } = await supabase
      .from('apps')
      .delete()
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data;
  }
}

module.exports = SimpleApp;