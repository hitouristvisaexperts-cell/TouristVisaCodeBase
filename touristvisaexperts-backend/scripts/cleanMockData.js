require('dotenv').config();
const mongoose = require('mongoose');

async function cleanMockData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // 1. Identify mock user emails
    const mockEmails = [
      'sarah@finalvisa.com',
      'ravi@finalvisa.com',
      'priya@example.com',
      'james@example.com',
      'aisha@example.com',
    ];

    // Find all users matching mock emails or testclient pattern
    const mockUsers = await db.collection('users').find({
      $or: [
        { email: { $in: mockEmails } },
        { email: { $regex: /testclient/i } },
        { name: 'Test Client' }
      ]
    }).toArray();

    const mockUserIds = mockUsers.map(u => u._id);
    console.log(`Found ${mockUsers.length} mock users to remove:`, mockUsers.map(u => u.email));

    // 2. Identify mock client records
    const mockClients = await db.collection('clients').find({
      $or: [
        { userId: { $in: mockUserIds } },
        { user: { $in: mockUserIds } },
        { email: { $in: mockEmails } }
      ]
    }).toArray();

    const mockClientIds = mockClients.map(c => c._id);
    console.log(`Found ${mockClients.length} mock client records to remove`);

    // 3. Delete mock documents
    const docResult = await db.collection('documents').deleteMany({
      $or: [
        { client: { $in: mockClientIds } },
        { uploadedBy: { $in: mockUserIds } },
        { originalName: { $regex: /test/i } }
      ]
    });
    console.log(`Deleted ${docResult.deletedCount} mock documents`);

    // 4. Delete mock payments
    const payResult = await db.collection('paymentrecords').deleteMany({
      $or: [
        { user: { $in: mockUserIds } },
        { paymentId: { $regex: /^pay_mock/i } },
        { orderId: { $regex: /^order_mock/i } }
      ]
    });
    console.log(`Deleted ${payResult.deletedCount} mock payment records`);

    // 5. Delete mock notifications
    const notifResult = await db.collection('notifications').deleteMany({
      $or: [
        { user: { $in: mockUserIds } },
        { title: { $regex: /Test Client/i } }
      ]
    });
    console.log(`Deleted ${notifResult.deletedCount} mock notifications`);

    // 6. Delete mock consent logs
    const consentResult = await db.collection('consentlogs').deleteMany({
      $or: [
        { user: { $in: mockUserIds } },
        { user: null }
      ]
    });
    console.log(`Deleted ${consentResult.deletedCount} mock consent logs`);

    // 7. Delete mock audit logs
    const auditResult = await db.collection('auditlogs').deleteMany({
      $or: [
        { user: { $in: mockUserIds } },
        { 'details.clientId': { $in: mockClientIds } },
        { action: { $regex: /seed/i } }
      ]
    });
    console.log(`Deleted ${auditResult.deletedCount} mock audit logs`);

    // 8. Delete mock clients
    const clientResult = await db.collection('clients').deleteMany({
      _id: { $in: mockClientIds }
    });
    console.log(`Deleted ${clientResult.deletedCount} mock clients`);

    // 9. Delete mock users
    const userResult = await db.collection('users').deleteMany({
      _id: { $in: mockUserIds }
    });
    console.log(`Deleted ${userResult.deletedCount} mock users`);

    console.log('\n--- VERIFYING REAL DATA REMAINING ---');
    const remainingUsers = await db.collection('users').find({}, { projection: { name: 1, email: 1, role: 1 } }).toArray();
    console.log('Real Users Remaining:', remainingUsers);

    const remainingClients = await db.collection('clients').find({}).toArray();
    console.log('Real Clients Remaining:', remainingClients.length);

    const remainingArticles = await db.collection('articles').countDocuments();
    console.log('Articles Remaining:', remainingArticles);

    const remainingFaqs = await db.collection('faqs').countDocuments();
    console.log('FAQs Remaining:', remainingFaqs);

    process.exit(0);
  } catch (err) {
    console.error('Error during cleanup:', err);
    process.exit(1);
  }
}

cleanMockData();
