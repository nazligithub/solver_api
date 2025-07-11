const supabase = require('./supabase');

const db = {
  query: async (text, params = []) => {
    try {
      const { data, error } = await supabase.rpc('sql_query', {
        query: text,
        params: params
      });
      
      if (error) {
        // If RPC doesn't exist, use direct table access
        if (error.message.includes('sql_query')) {
          // For SELECT queries, we'll need to parse and use Supabase's query builder
          // This is a simplified implementation
          if (text.toLowerCase().includes('select')) {
            const tableName = extractTableName(text);
            const { data, error: selectError } = await supabase
              .from(tableName)
              .select('*');
            
            if (selectError) throw selectError;
            return { rows: data || [] };
          }
        }
        throw error;
      }
      
      return { rows: data || [] };
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }
};

// Helper function to extract table name from SQL query
function extractTableName(query) {
  const match = query.match(/from\s+(\w+)/i);
  return match ? match[1] : null;
}

module.exports = db;