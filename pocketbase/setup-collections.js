import PocketBase from 'pocketbase';
import dotenv from 'dotenv';
dotenv.config();

// Get configuration from environment variables or use defaults
const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://localhost:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || 'admin123456789';

const pb = new PocketBase(POCKETBASE_URL);

async function setupCollections() {
    try {
        console.log(`Connecting to PocketBase at ${POCKETBASE_URL}...`);

        // Authenticate as admin
        console.log('Authenticating as admin...');
        await pb.collection("_superusers").authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('✓ Authenticated successfully');

        // Get users collection ID
        const existingCollections = await pb.collections.getFullList();
        const usersCollection = existingCollections.find(c => c.name === 'users');
        if (!usersCollection) {
            throw new Error('Users collection not found. Make sure PocketBase is properly initialized.');
        }
        const usersCollectionId = usersCollection.id;
        console.log(`✓ Found users collection: ${usersCollectionId}`);

        const collectionNames = existingCollections.map(c => c.name);

        // Create Tags collection
        let tagsCollectionId;
        if (collectionNames.includes('tags')) {
            console.log('⚠ Tags collection already exists, skipping...');
            const tagsCollection = existingCollections.find(c => c.name === 'tags');
            tagsCollectionId = tagsCollection.id;
        } else {
            console.log('Creating tags collection...');
            const tagsCollection = await pb.collections.create({
                name: 'tags',
                type: 'base',
                fields: [
                    {
                        name: 'name',
                        type: 'text',
                        required: true,
                        min: 1,
                        max: 100
                    },
                    {
                        name: 'color',
                        type: 'text',
                        required: false,
                        min: 0,
                        max: 50
                    },
                    {
                        name: 'user',
                        type: 'relation',
                        required: true,
                        options: {
                            collectionId: usersCollectionId,
                            cascadeDelete: true,
                            minSelect: null,
                            maxSelect: 1,
                            displayFields: ['email'],
                        },
                    },
                ],
                indexes: [
                    {
                        name: 'idx_user_name',
                        columns: ['user', 'name'],
                        unique: true,
                    },
                ],
            });
            tagsCollectionId = tagsCollection.id;
            console.log('✓ Tags collection created');

            // Set collection rules
            await pb.collections.update('tags', {
                listRule: 'user = @request.auth.id',
                viewRule: 'user = @request.auth.id',
                createRule: 'user = @request.auth.id',
                updateRule: 'user = @request.auth.id',
                deleteRule: 'user = @request.auth.id',
            });
            console.log('✓ Tags collection rules set');
        }

        // Create Links collection
        if (collectionNames.includes('links')) {
            console.log('⚠ Links collection already exists, skipping...');
        } else {
            console.log('Creating links collection...');
            const linksCollection = await pb.collections.create({
                name: 'links',
                type: 'base',
                fields: [
                    {
                        name: 'url',
                        type: 'url',
                        required: true,
                        options: {},
                    },
                    {
                        name: 'title',
                        type: 'text',
                        required: false,
                        options: {
                            min: 0,
                            max: 500,
                        },
                    },
                    {
                        name: 'description',
                        type: 'text',
                        required: false,
                        options: {
                            min: 0,
                            max: 2000,
                        },
                    },
                    {
                        name: 'notes',
                        type: 'text',
                        required: false,
                        options: {
                            min: 0,
                            max: 5000,
                        },
                    },
                    {
                        name: 'tags',
                        type: 'relation',
                        required: false,
                        options: {
                            collectionId: tagsCollectionId,
                            cascadeDelete: false,
                            minSelect: null,
                            maxSelect: null,
                            displayFields: ['name', 'color'],
                        },
                    },
                    {
                        name: 'user',
                        type: 'relation',
                        required: true,
                        options: {
                            collectionId: usersCollectionId,
                            cascadeDelete: true,
                            minSelect: null,
                            maxSelect: 1,
                            displayFields: ['email'],
                        },
                    },
                    {
                        name: 'is_favorite',
                        type: 'bool',
                        required: false,
                        options: {},
                    },
                    {
                        name: 'archived',
                        type: 'bool',
                        required: false,
                        options: {},
                    },
                ],
                indexes: [
                    {
                        name: 'idx_user_created',
                        columns: ['user', '-created'],
                    },
                    {
                        name: 'idx_user_url',
                        columns: ['user', 'url'],
                    },
                ],
            });
            console.log('✓ Links collection created');

            // Set collection rules
            await pb.collections.update('links', {
                listRule: 'user = @request.auth.id',
                viewRule: 'user = @request.auth.id',
                createRule: 'user = @request.auth.id',
                updateRule: 'user = @request.auth.id',
                deleteRule: 'user = @request.auth.id',
            });
            console.log('✓ Links collection rules set');
        }

        console.log('\n✅ All collections setup completed successfully!');
    } catch (error) {
        console.error('❌ Error setting up collections:', error);
        if (error.response) {
            console.error('Response:', error.response);
        }
        process.exit(1);
    }
}

// Run the setup
setupCollections();
