// setup-collections.js
import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL);

// Login as superuser
await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD);

// Helper function to get or create collection
async function getOrCreateCollection(name, schema) {
    try {
        // Try to get existing collection
        const collections = await pb.collections.getFullList({ filter: `name = "${name}"` });
        if (collections.length > 0) {
            console.log(`Collection "${name}" already exists, updating...`);
            // Delete existing collection to recreate with correct schema
            await pb.collections.delete(collections[0].id);
        }
    } catch (error) {
        // Collection doesn't exist, which is fine
    }
    
    // Create collection without rules first
    return await pb.collections.create({
        name,
        type: 'base',
        schema
    });
}

// Define tags schema
const tagsSchema = [
    {
        name: 'name',
        type: 'text',
        required: true,
        options: { max: 100 }
    },
    {
        name: 'color',
        type: 'text',
        options: { max: 7 }
    },
    {
        name: 'user',
        type: 'relation',
        required: true,
        options: {
            collectionId: '_pb_users_auth_',
            maxSelect: 1
        }
    }
];

// Create tags collection (without rules first)
let tagsCollection = await getOrCreateCollection('tags', tagsSchema);

// Wait a bit to ensure collection is fully initialized
await new Promise(resolve => setTimeout(resolve, 1000));

// Fetch the collection to get the schema with field IDs
const fullTagsCollection = await pb.collections.getOne(tagsCollection.id);

// Use the fetched schema (which has field IDs) or fall back to original
const tagsSchemaWithIds = fullTagsCollection.schema || tagsSchema;

console.log('Updating tags collection with rules...');

// Now update with schema and rules together
try {
    await pb.collections.update(tagsCollection.id, {
        schema: tagsSchemaWithIds,
        listRule: '@request.auth.id != "" && user = @request.auth.id',
        viewRule: '@request.auth.id != "" && user = @request.auth.id',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != "" && user = @request.auth.id',
        deleteRule: '@request.auth.id != "" && user = @request.auth.id'
    });
    
    console.log('Rules updated successfully, adding indexes...');
    
    // Add indexes separately
    await pb.collections.update(tagsCollection.id, {
        indexes: [
            'CREATE UNIQUE INDEX idx_unique_tag_per_user ON tags (name, user)'
        ]
    });
} catch (error) {
    console.error('Error updating tags collection rules:', error);
    // Log the full error details
    if (error.response?.data) {
        console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
}

console.log('Created/updated tags collection:', tagsCollection.id);

// Define links schema
const linksSchema = [
    {
        name: 'url',
        type: 'url',
        required: true
    },
    {
        name: 'title',
        type: 'text',
        options: { max: 500 }
    },
    {
        name: 'description',
        type: 'text',
        options: { max: 2000 }
    },
    {
        name: 'og_image',
        type: 'url'
    },
    {
        name: 'og_site_name',
        type: 'text',
        options: { max: 200 }
    },
    {
        name: 'og_type',
        type: 'text',
        options: { max: 100 }
    },
    {
        name: 'favicon',
        type: 'url'
    },
    {
        name: 'notes',
        type: 'editor'
    },
    {
        name: 'tags',
        type: 'relation',
        options: {
            collectionId: tagsCollection.id,
            maxSelect: null
        }
    },
    {
        name: 'user',
        type: 'relation',
        required: true,
        options: {
            collectionId: '_pb_users_auth_',
            maxSelect: 1
        }
    },
    {
        name: 'is_favorite',
        type: 'bool'
    },
    {
        name: 'archived',
        type: 'bool'
    }
];

// Create links collection (without rules first)
let linksCollection = await getOrCreateCollection('links', linksSchema);

// Wait a bit to ensure collection is fully initialized
await new Promise(resolve => setTimeout(resolve, 1000));

// Fetch the collection to get the schema with field IDs
const fullLinksCollection = await pb.collections.getOne(linksCollection.id);

// Use the fetched schema (which has field IDs) or fall back to original
const linksSchemaWithIds = fullLinksCollection.schema || linksSchema;

console.log('Updating links collection with rules...');

// Now update with schema and rules together
try {
    await pb.collections.update(linksCollection.id, {
        schema: linksSchemaWithIds,
        listRule: '@request.auth.id != "" && user = @request.auth.id',
        viewRule: '@request.auth.id != "" && user = @request.auth.id',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != "" && user = @request.auth.id',
        deleteRule: '@request.auth.id != "" && user = @request.auth.id'
    });
} catch (error) {
    console.error('Error updating links collection rules:', error);
    // Log the full error details
    if (error.response?.data) {
        console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
}

console.log('Created/updated links collection:', linksCollection.id);
console.log('Setup complete!');