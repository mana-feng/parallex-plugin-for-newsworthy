import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DB_PATH || join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

const currentPageSize = db.pragma('page_size', { simple: true });

if (currentPageSize < 8192) {
  console.log(`Current page_size: ${currentPageSize}, changing to 8192...`);
  db.pragma('page_size = 8192');
  console.log('Running VACUUM to apply page_size change...');
  db.exec('VACUUM');
  console.log('VACUUM completed, page_size updated');
}

db.pragma('cache_size = -10000');
db.pragma('mmap_size = 268435456');
db.pragma('journal_mode = WAL');
db.pragma('max_page_count = 2147483646');

console.log('SQLite configuration:');
console.log('  - page_size:', db.pragma('page_size', { simple: true }));
console.log('  - cache_size:', db.pragma('cache_size', { simple: true }));
console.log('  - mmap_size:', db.pragma('mmap_size', { simple: true }));
console.log('  - journal_mode:', db.pragma('journal_mode', { simple: true }));
console.log('  - max_page_count:', db.pragma('max_page_count', { simple: true }));

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      color TEXT DEFAULT '#3b82f6',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      filename TEXT NOT NULL,
      github_url TEXT UNIQUE,
      group_id INTEGER,
      sort_order INTEGER DEFAULT 0,
      html_content TEXT NOT NULL,
      sections_data TEXT,
      preview_image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
    )
  `);

  try {
    const columns = db.pragma('table_info(pages)');
    const hasSectionsData = columns.some(col => col.name === 'sections_data');
    
    if (!hasSectionsData) {
      console.log('Migrating database: Adding sections_data column...');
      db.exec('ALTER TABLE pages ADD COLUMN sections_data TEXT');
      console.log('Migration complete: sections_data column added');
    }
  } catch (error) {
    console.log('Database migration check:', error.message);
  }

  try {
    const columns = db.pragma('table_info(pages)');
    const hasLastUploadedAt = columns.some(col => col.name === 'last_uploaded_at');
    
    if (!hasLastUploadedAt) {
      console.log('Migrating database: Adding last_uploaded_at column...');
      db.exec('ALTER TABLE pages ADD COLUMN last_uploaded_at DATETIME');
      console.log('Migration complete: last_uploaded_at column added');
    }
  } catch (error) {
    console.log('Database migration check for last_uploaded_at:', error.message);
  }

  try {
    const columns = db.pragma('table_info(pages)');
    const indexes = db.pragma('index_list(pages)');
    
    const needsMigration = indexes.some(idx => {
      const indexInfo = db.pragma(`index_info(${idx.name})`);
      return indexInfo.some(col => col.name === 'filename');
    });
    
    if (needsMigration) {
      console.log('Migrating database: Changing UNIQUE constraint from filename to github_url...');
      
      db.exec(`
        CREATE TABLE pages_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          filename TEXT NOT NULL,
          github_url TEXT UNIQUE,
          group_id INTEGER,
          sort_order INTEGER DEFAULT 0,
          html_content TEXT NOT NULL,
          sections_data TEXT,
          preview_image TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
        );
        
        INSERT INTO pages_new (id, title, filename, github_url, group_id, sort_order, html_content, sections_data, preview_image, created_at, updated_at)
        SELECT id, title, filename, github_url, group_id, sort_order, html_content, sections_data, preview_image, created_at, updated_at
        FROM pages;
        
        DROP TABLE pages;
        ALTER TABLE pages_new RENAME TO pages;
      `);
      
      console.log('Migration complete: filename UNIQUE constraint removed, github_url UNIQUE constraint added');
      console.log('You can now create pages with same filename in different months!');
    }
  } catch (error) {
    console.log('Unique constraint migration check:', error.message);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS temp_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_id TEXT NOT NULL UNIQUE,
      filename TEXT NOT NULL,
      image_data TEXT NOT NULL,
      mime_type TEXT DEFAULT 'image/jpeg',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_pages_group_id ON pages(group_id);
    CREATE INDEX IF NOT EXISTS idx_pages_sort_order ON pages(sort_order);
    CREATE INDEX IF NOT EXISTS idx_temp_images_image_id ON temp_images(image_id);
  `);

  console.log('Database initialized successfully');
}

initDatabase();

export const groupOperations = {
  create: db.prepare(`
    INSERT INTO groups (name, description, color)
    VALUES (@name, @description, @color)
  `),
  
  getAll: db.prepare(`
    SELECT g.*, COUNT(p.id) as page_count
    FROM groups g
    LEFT JOIN pages p ON g.id = p.group_id
    GROUP BY g.id
    ORDER BY g.name
  `),
  
  getById: db.prepare(`
    SELECT g.*, COUNT(p.id) as page_count
    FROM groups g
    LEFT JOIN pages p ON g.id = p.group_id
    WHERE g.id = ?
    GROUP BY g.id
  `),
  
  update: db.prepare(`
    UPDATE groups 
    SET name = @name, description = @description, color = @color, updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `),
  
  delete: db.prepare(`
    DELETE FROM groups WHERE id = ?
  `)
};

// Page operations
export const pageOperations = {
  create: db.prepare(`
    INSERT INTO pages (title, filename, github_url, group_id, sort_order, html_content, sections_data, preview_image)
    VALUES (@title, @filename, @github_url, @group_id, @sort_order, @html_content, @sections_data, @preview_image)
  `),
  
  getAll: db.prepare(`
    SELECT p.*, g.name as group_name, g.color as group_color
    FROM pages p
    LEFT JOIN groups g ON p.group_id = g.id
    ORDER BY p.sort_order ASC, p.created_at DESC
  `),
  
  getById: db.prepare(`
    SELECT p.*, g.name as group_name
    FROM pages p
    LEFT JOIN groups g ON p.group_id = g.id
    WHERE p.id = ?
  `),
  
  getByFilename: db.prepare(`
    SELECT p.*, g.name as group_name
    FROM pages p
    LEFT JOIN groups g ON p.group_id = g.id
    WHERE p.filename = ?
  `),
  
  getByGroup: db.prepare(`
    SELECT * FROM pages
    WHERE group_id = ?
    ORDER BY sort_order ASC, created_at DESC
  `),
  
  update: db.prepare(`
    UPDATE pages
    SET title = @title, filename = @filename, github_url = @github_url, 
        group_id = @group_id, sort_order = @sort_order, 
        html_content = @html_content, sections_data = @sections_data, preview_image = @preview_image,
        last_uploaded_at = @last_uploaded_at,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `),
  
  updateSortOrder: db.prepare(`
    UPDATE pages SET sort_order = @sort_order, updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `),
  
  delete: db.prepare(`
    DELETE FROM pages WHERE id = ?
  `),
  
  search: db.prepare(`
    SELECT p.*, g.name as group_name
    FROM pages p
    LEFT JOIN groups g ON p.group_id = g.id
    WHERE p.title LIKE @query OR p.filename LIKE @query
    ORDER BY p.updated_at DESC
  `),
  
  findEmptyContent: db.prepare(`
    SELECT id, title, filename FROM pages
    WHERE html_content IS NULL OR html_content = '' OR TRIM(html_content) = ''
  `),
  
  deleteEmptyContent: db.prepare(`
    DELETE FROM pages
    WHERE html_content IS NULL OR html_content = '' OR TRIM(html_content) = ''
  `),
  
  deleteAll: db.prepare(`
    DELETE FROM pages
  `),
  
  resetAutoIncrement: db.prepare(`
    DELETE FROM sqlite_sequence WHERE name = 'pages'
  `)
};

export const groupsJsonOperations = {
  exportToJson: () => {
    const groups = groupOperations.getAll.all();
    const cleanGroups = groups.map(({ page_count, ...group }) => group);
    
    return {
      version: '1.0',
      exported_at: new Date().toISOString(),
      groups: cleanGroups
    };
  },

  importFromJson: (jsonData) => {
    if (!jsonData || !jsonData.groups || !Array.isArray(jsonData.groups)) {
      throw new Error('Invalid JSON format: missing groups array');
    }

    const stats = {
      total: jsonData.groups.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    const transaction = db.transaction((groups) => {
      for (const group of groups) {
        try {
          const existing = db.prepare('SELECT * FROM groups WHERE name = ?').get(group.name);
          
          if (existing) {
            groupOperations.update.run({
              id: existing.id,
              name: group.name,
              description: group.description || null,
              color: group.color || '#3b82f6'
            });
            stats.updated++;
          } else {
            groupOperations.create.run({
              name: group.name,
              description: group.description || null,
              color: group.color || '#3b82f6'
            });
            stats.created++;
          }
        } catch (error) {
          stats.errors.push({ group: group.name, error: error.message });
          stats.skipped++;
        }
      }
    });

    transaction(jsonData.groups);
    
    return stats;
  },

  exportToJsonString: () => {
    return JSON.stringify(groupsJsonOperations.exportToJson(), null, 2);
  },

  importFromJsonString: (jsonString) => {
    try {
      const jsonData = JSON.parse(jsonString);
      return groupsJsonOperations.importFromJson(jsonData);
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
  }
};

export const tempImageOperations = {
  save: db.prepare(`
    INSERT INTO temp_images (image_id, filename, image_data, mime_type)
    VALUES (@image_id, @filename, @image_data, @mime_type)
    ON CONFLICT(image_id) DO UPDATE SET
      filename = @filename,
      image_data = @image_data,
      mime_type = @mime_type,
      created_at = CURRENT_TIMESTAMP
  `),
  
  getById: db.prepare(`
    SELECT * FROM temp_images WHERE image_id = ?
  `),
  
  getAll: db.prepare(`
    SELECT * FROM temp_images ORDER BY created_at DESC
  `),
  
  delete: db.prepare(`
    DELETE FROM temp_images WHERE image_id = ?
  `),
  
  deleteAll: db.prepare(`
    DELETE FROM temp_images
  `),
  
  deleteOlderThan: db.prepare(`
    DELETE FROM temp_images 
    WHERE datetime(created_at) < datetime('now', '-' || ? || ' hours')
  `),
  
  countOlderThan: db.prepare(`
    SELECT COUNT(*) as count FROM temp_images
    WHERE datetime(created_at) < datetime('now', '-' || ? || ' hours')
  `),
  
  count: db.prepare(`
    SELECT COUNT(*) as count FROM temp_images
  `)
};

export default db;

