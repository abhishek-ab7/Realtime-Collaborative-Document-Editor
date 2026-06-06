import { PrismaClient, DocumentStatus, CollaboratorRole, ActivityAction } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean database in dependency order
  await prisma.activityLog.deleteMany();
  await prisma.collaborator.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.documentSnapshot.deleteMany();
  await prisma.shareLink.deleteMany();
  await prisma.document.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  const john = await prisma.user.create({
    data: {
      email: 'john@example.com',
      name: 'John Doe',
      avatarUrl: 'https://lh3.googleusercontent.com/a/mock-john',
    },
  });

  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice Lee',
      avatarUrl: 'https://lh3.googleusercontent.com/a/mock-alice',
    },
  });

  console.log(`👤 Users created: ${john.name} (${john.email}), ${alice.name} (${alice.email})`);

  // Create document
  const doc = await prisma.document.create({
    data: {
      ownerId: john.id,
      title: 'Q3 Product Planning',
      status: DocumentStatus.ACTIVE,
      isStarred: true,
      wordCount: 150,
      lastAccessedAt: new Date(),
    },
  });

  console.log(`📄 Document created: "${doc.title}" owned by ${john.name}`);

  // Create public demo document
  const demoDoc = await prisma.document.create({
    data: {
      id: 'demo-document',
      ownerId: john.id,
      title: 'Public Demo Document',
      status: DocumentStatus.ACTIVE,
      isStarred: false,
      wordCount: 120,
      lastAccessedAt: new Date(),
    },
  });

  const demoTokenHash = createHash('sha256').update('demo-token').digest('hex');

  await prisma.shareLink.create({
    data: {
      id: 'demo-share-link',
      documentId: demoDoc.id,
      createdBy: john.id,
      tokenHash: demoTokenHash,
      permission: 'VIEW',
      isActive: true,
    },
  });

  console.log(`📄 Public Demo Document created with ID "demo-document" and token "demo-token"`);

  // Add collaborator
  const collab = await prisma.collaborator.create({
    data: {
      documentId: doc.id,
      userId: alice.id,
      role: CollaboratorRole.EDITOR,
      invitedBy: john.id,
    },
  });

  console.log(`👥 Collaborator added: ${alice.name} set as ${collab.role} on the document`);

  // Log activity
  await prisma.activityLog.create({
    data: {
      documentId: doc.id,
      userId: john.id,
      action: ActivityAction.DOCUMENT_CREATED,
      metadata: { source: 'database_seed' },
      ipAddress: '127.0.0.1',
    },
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
