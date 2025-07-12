const supabase = require('./supabase');

// SQL Query Parser and Executor for Supabase
const db = {
  query: async (text, params = []) => {
    try {
      const query = text.trim();
      const lowerQuery = query.toLowerCase();
      
      // Simple log for query type
      const queryType = query.split(' ')[0].toUpperCase();
      console.log(`\ud83d\uddff DB: ${queryType}`);
      
      // Detect query type
      if (lowerQuery.startsWith('select')) {
        return await executeSelect(query, params);
      } else if (lowerQuery.startsWith('insert')) {
        return await executeInsert(query, params);
      } else if (lowerQuery.startsWith('update')) {
        return await executeUpdate(query, params);
      } else if (lowerQuery.startsWith('delete')) {
        return await executeDelete(query, params);
      } else {
        throw new Error(`Unsupported query type: ${query.split(' ')[0]}`);
      }
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }
};

// Execute SELECT queries
async function executeSelect(query, params) {
  try {
    // Parse the query
    const tableMatch = query.match(/FROM\s+(\w+)/i);
    if (!tableMatch) throw new Error('Could not parse table name from SELECT query');
    
    const tableName = tableMatch[1];
    let queryBuilder = supabase.from(tableName);
    
    // Handle SELECT columns
    const selectMatch = query.match(/SELECT\s+([\s\S]+?)\s+FROM/i);
    if (selectMatch) {
      const columns = selectMatch[1].trim();
      if (columns !== '*') {
        // Parse column list (handle aliases, functions, etc.)
        const columnList = columns.split(',').map(col => col.trim());
        const simpleColumns = columnList.filter(col => !col.includes('(') && !col.includes(' as '));
        if (simpleColumns.length > 0) {
          queryBuilder = queryBuilder.select(simpleColumns.join(','));
        } else {
          queryBuilder = queryBuilder.select('*');
        }
      } else {
        queryBuilder = queryBuilder.select('*');
      }
    } else {
      queryBuilder = queryBuilder.select('*');
    }
    
    // Handle WHERE clause
    const whereMatch = query.match(/WHERE\s+([\s\S]+?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|$)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1].trim();
      const conditions = parseWhereClause(whereClause, params);
      
      for (const condition of conditions) {
        if (condition.operator === '=') {
          queryBuilder = queryBuilder.eq(condition.column, condition.value);
        } else if (condition.operator === '!=') {
          queryBuilder = queryBuilder.neq(condition.column, condition.value);
        } else if (condition.operator === '>') {
          queryBuilder = queryBuilder.gt(condition.column, condition.value);
        } else if (condition.operator === '<') {
          queryBuilder = queryBuilder.lt(condition.column, condition.value);
        } else if (condition.operator === '>=') {
          queryBuilder = queryBuilder.gte(condition.column, condition.value);
        } else if (condition.operator === '<=') {
          queryBuilder = queryBuilder.lte(condition.column, condition.value);
        } else if (condition.operator === 'LIKE' || condition.operator === 'like') {
          queryBuilder = queryBuilder.like(condition.column, condition.value);
        } else if (condition.operator === 'IN' || condition.operator === 'in') {
          queryBuilder = queryBuilder.in(condition.column, condition.value);
        }
      }
    }
    
    // Handle ORDER BY
    const orderMatch = query.match(/ORDER\s+BY\s+([\s\S]+?)(?:\s+LIMIT|$)/i);
    if (orderMatch) {
      const orderClause = orderMatch[1].trim();
      const orderParts = orderClause.split(',').map(part => part.trim());
      
      for (const part of orderParts) {
        const [columnPart, direction] = part.split(/\s+/);
        // Remove table alias if present (e.g., "hs.created_at" -> "created_at")
        const column = columnPart.includes('.') ? columnPart.split('.').pop() : columnPart;
        const ascending = !direction || direction.toUpperCase() === 'ASC';
        queryBuilder = queryBuilder.order(column, { ascending });
      }
    }
    
    // Handle LIMIT
    const limitMatch = query.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      queryBuilder = queryBuilder.limit(parseInt(limitMatch[1]));
    }
    
    const { data, error } = await queryBuilder;
    if (error) throw error;
    
    return { rows: data || [] };
  } catch (error) {
    console.error('SELECT query error:', error);
    throw error;
  }
}

// Execute INSERT queries
async function executeInsert(query, params) {
  try {
    // Parse table name
    const tableMatch = query.match(/INSERT\s+INTO\s+(\w+)/i);
    if (!tableMatch) throw new Error('Could not parse table name from INSERT query');
    
    const tableName = tableMatch[1];
    
    // Parse columns
    const columnsMatch = query.match(/\(([^)]+)\)\s+VALUES/i);
    const columns = columnsMatch ? 
      columnsMatch[1].split(',').map(col => col.trim()) : 
      [];
    
    // Parse values
    const valuesMatch = query.match(/VALUES\s*\(([^)]+)\)/i);
    if (!valuesMatch) throw new Error('Could not parse values from INSERT query');
    
    const valuePlaceholders = valuesMatch[1].split(',').map(v => v.trim());
    
    // Build insert object
    const insertData = {};
    let paramIndex = 0;
    
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      const placeholder = valuePlaceholders[i];
      
      if (placeholder.startsWith('$')) {
        insertData[column] = params[paramIndex++];
      } else if (placeholder === 'DEFAULT' || placeholder === 'CURRENT_TIMESTAMP') {
        // Skip default values
        continue;
      } else {
        // Handle literal values
        insertData[column] = placeholder.replace(/^'|'$/g, '');
      }
    }
    
    // Check if RETURNING clause exists
    const returning = query.includes('RETURNING');
    
    const { data, error } = await supabase
      .from(tableName)
      .insert(insertData)
      .select(returning ? '*' : undefined);
    
    if (error) throw error;
    
    return { rows: data || [] };
  } catch (error) {
    console.error('INSERT query error:', error);
    throw error;
  }
}

// Execute UPDATE queries
async function executeUpdate(query, params) {
  try {
    // Parse table name
    const tableMatch = query.match(/UPDATE\s+(\w+)\s+SET/i);
    if (!tableMatch) throw new Error('Could not parse table name from UPDATE query');
    
    const tableName = tableMatch[1];
    
    // Parse SET clause
    const setMatch = query.match(/SET\s+([\s\S]+?)(?:\s+WHERE|$)/i);
    if (!setMatch) throw new Error('Could not parse SET clause from UPDATE query');
    
    const setClause = setMatch[1];
    const updates = parseSetClause(setClause, params);
    
    let queryBuilder = supabase.from(tableName).update(updates.data);
    
    // Handle WHERE clause
    const whereMatch = query.match(/WHERE\s+([\s\S]+?)(?:\s+RETURNING|$)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1].trim();
      const conditions = parseWhereClause(whereClause, params, updates.usedParams);
      
      for (const condition of conditions) {
        if (condition.operator === '=') {
          queryBuilder = queryBuilder.eq(condition.column, condition.value);
        } else if (condition.operator === '!=') {
          queryBuilder = queryBuilder.neq(condition.column, condition.value);
        }
      }
    }
    
    // Check if RETURNING clause exists
    const returning = query.includes('RETURNING');
    if (returning) {
      queryBuilder = queryBuilder.select();
    }
    
    const { data, error } = await queryBuilder;
    if (error) throw error;
    
    return { rows: data || [] };
  } catch (error) {
    console.error('UPDATE query error:', error);
    throw error;
  }
}

// Execute DELETE queries
async function executeDelete(query, params) {
  try {
    // Parse table name
    const tableMatch = query.match(/DELETE\s+FROM\s+(\w+)/i);
    if (!tableMatch) throw new Error('Could not parse table name from DELETE query');
    
    const tableName = tableMatch[1];
    let queryBuilder = supabase.from(tableName).delete();
    
    // Handle WHERE clause
    const whereMatch = query.match(/WHERE\s+([\s\S]+?)(?:\s+RETURNING|$)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1].trim();
      const conditions = parseWhereClause(whereClause, params);
      
      for (const condition of conditions) {
        if (condition.operator === '=') {
          queryBuilder = queryBuilder.eq(condition.column, condition.value);
        }
      }
    }
    
    // Check if RETURNING clause exists
    const returning = query.includes('RETURNING');
    if (returning) {
      queryBuilder = queryBuilder.select();
    }
    
    const { data, error } = await queryBuilder;
    if (error) throw error;
    
    return { rows: data || [] };
  } catch (error) {
    console.error('DELETE query error:', error);
    throw error;
  }
}

// Parse WHERE clause conditions
function parseWhereClause(whereClause, params, startIndex = 0) {
  const conditions = [];
  let paramIndex = startIndex;
  
  // Simple parser for basic conditions
  const conditionPattern = /(\w+)\s*(=|!=|>|<|>=|<=|LIKE|IN)\s*(\$\d+|'[^']*'|\d+)/gi;
  const matches = whereClause.matchAll(conditionPattern);
  
  for (const match of matches) {
    const column = match[1];
    const operator = match[2];
    let value = match[3];
    
    if (value.startsWith('$')) {
      value = params[paramIndex++];
    } else if (value.startsWith("'")) {
      value = value.slice(1, -1);
    } else if (!isNaN(value)) {
      value = Number(value);
    }
    
    conditions.push({ column, operator, value });
  }
  
  return conditions;
}

// Parse SET clause for UPDATE queries
function parseSetClause(setClause, params) {
  const data = {};
  let paramIndex = 0;
  
  // Split by comma but respect values that might contain commas
  const assignments = setClause.split(/,(?![^(]*\))/);
  
  for (const assignment of assignments) {
    const [column, value] = assignment.split('=').map(s => s.trim());
    
    if (value.startsWith('$')) {
      data[column] = params[paramIndex++];
    } else if (value === 'DEFAULT' || value === 'CURRENT_TIMESTAMP') {
      // Skip default values
      continue;
    } else if (value.startsWith("'")) {
      data[column] = value.slice(1, -1);
    } else if (value === 'NULL' || value === 'null') {
      data[column] = null;
    } else if (value === 'true' || value === 'false') {
      data[column] = value === 'true';
    } else if (!isNaN(value)) {
      data[column] = Number(value);
    } else {
      data[column] = value;
    }
  }
  
  return { data, usedParams: paramIndex };
}

module.exports = db;