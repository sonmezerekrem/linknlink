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
                        collectionId: usersCollectionId,
                        cascadeDelete: true,
                        maxSelect: 1,
                        minSelect: 0,
                        displayFields: ['email'],
                    },
                ],
                indexes: [
                    "CREATE INDEX `idx_SeddfTuzIt` ON `tags` (\n  `user`,\n  `name`\n)"
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
                    },
                    {
                        name: 'title',
                        type: 'text',
                        required: false,
                        min: 0,
                        max: 1000,
                    },
                    {
                        name: 'description',
                        type: 'text',
                        required: false,
                        min: 0,
                        max: 5000,
                    },
                    {
                        name: 'og_image',
                        type: 'url'
                    },
                    {
                        name: 'og_site_name',
                        type: 'text',
                        max: 200
                    },
                    {
                        name: 'og_type',
                        type: 'text',
                        max: 100
                    },
                    {
                        name: 'favicon',
                        type: 'url'
                    },
                    {
                        name: 'notes',
                        type: 'text',
                        required: false,
                        min: 0,
                        max: 5000,
                    },
                    {
                        name: 'tags',
                        type: 'relation',
                        required: false,
                        collectionId: tagsCollectionId,
                        cascadeDelete: false,
                        displayFields: ['name', 'color'],
                    },
                    {
                        name: 'user',
                        type: 'relation',
                        required: true,
                        collectionId: usersCollectionId,
                        cascadeDelete: true,
                        maxSelect: 1,
                        displayFields: ['email'],
                    },
                    {
                        name: 'is_favorite',
                        type: 'bool',
                        required: false,
                    },
                    {
                        name: 'archived',
                        type: 'bool',
                        required: false,
                    },
                ],
                indexes: [
                    "CREATE INDEX `idx_user_url` ON `links` (\n  `user`,\n  `url`\n)",
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
