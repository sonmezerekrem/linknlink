// setup-collections.js
import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL);

// Login as superuser
await pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD);

// Create tags collection first (since links references it)
const tagsCollection = await pb.collections.create({
  name: 'tags',
  type: 'base',
  schema: [
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
  ],
  indexes: [
    'CREATE UNIQUE INDEX idx_unique_tag_per_user ON tags (name, user)'
  ],
  listRule: '@request.auth.id != "" && user = @request.auth.id',
  viewRule: '@request.auth.id != "" && user = @request.auth.id',
  createRule: '@request.auth.id != ""',
  updateRule: '@request.auth.id != "" && user = @request.auth.id',
  deleteRule: '@request.auth.id != "" && user = @request.auth.id'
});

console.log('Created tags collection:', tagsCollection.id);

// Create links collection
const linksCollection = await pb.collections.create({
  name: 'links',
  type: 'base',
  schema: [
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
        maxSelect: null  // allows multiple tags
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
  ],
  listRule: '@request.auth.id != "" && user = @request.auth.id',
  viewRule: '@request.auth.id != "" && user = @request.auth.id',
  createRule: '@request.auth.id != ""',
  updateRule: '@request.auth.id != "" && user = @request.auth.id',
  deleteRule: '@request.auth.id != "" && user = @request.auth.id'
});

console.log('Created links collection:', linksCollection.id);
console.log('Setup complete!');