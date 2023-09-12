import { PrismaClient } from '@prisma/client';
import * as moment from 'moment-timezone';
import { HashPassword, genKey } from '../src/helpers/util.helper';

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {
      updated_at: moment().toDate(),
    },
    create: {
      name: 'Admin',
      access_level: 'Full',
      created_at: moment().toDate(),
    },
  });
  const appOwner = await prisma.role.upsert({
    where: { name: 'AppOwner' },
    update: {
      updated_at: moment().toDate(),
    },
    create: {
      name: 'AppOwner',
      access_level: 'Dashboard_App',
      created_at: moment().toDate(),
    },
  });

  const appUser = await prisma.role.upsert({
    where: { name: 'AppUser' },
    update: {
      updated_at: moment().toDate(),
    },
    create: {
      name: 'AppUser',
      access_level: 'App',
      created_at: moment().toDate(),
    },
  });

  const salesPersonRole = await prisma.role.upsert({
    where: { name: 'Salesperson' },
    update: {
      updated_at: moment().toDate(),
    },
    create: {
      name: 'Salesperson',
      access_level: 'Sales_Dash',
      created_at: moment().toDate(),
    },
  });

  // const salesPerson = await prisma.user.upsert({
  //   where: { email: 'salesman@gmail.com' },
  //   update: {
  //     updated_at: moment().toDate(),
  //     email: 'salesman@gmail.com',
  //     name: 'Sales Man',
  //     password: await HashPassword('Apprabbit!'),
  //   },
  //   create: {
  //     email: 'salesman@gmail.com',
  //     name: 'Sales Man',
  //     password: await HashPassword('Apprabbit!'),
  //     created_at: moment().toDate(),
  //     role_id: salesPersonRole.id,
  //   },
  // });

  // await prisma.stripeConnect.upsert({
  //   where: { userId: salesPerson.id },
  //   update: {
  //     updated_at: moment().toDate(),
  //     userId: salesPerson.id,
  //     stripeAccountId: 'acct_1KEJ9i2S1rM6xP7j',
  //     stripeConnectUrl: 'http://stripe.com',
  //     connectStatus: true,
  //   },
  //   create: {
  //     userId: salesPerson.id,
  //     stripeAccountId: 'acct_1KEJ9i2S1rM6xP7j',
  //     stripeConnectUrl: 'http://stripe.com',
  //     connectStatus: true,
  //     created_at: moment().toDate(),
  //     updated_at: moment().toDate(),
  //   },
  // });

  // await prisma.commissions.upsert({
  //   where: { salesperson_id: salesPerson.id },
  //   update: {
  //     updated_at: moment().toDate(),
  //     identifier: await genKey([salesPerson.id, salesPerson.name].toString()),
  //     salesperson_id: salesPerson.id,
  //     first_commission: {
  //       percentage: 100,
  //       amount: null,
  //       time: 3,
  //       time_type: 'month',
  //     },
  //     second_commission: {
  //       percentage: 100,
  //       amount: null,
  //       time: 100,
  //       time_type: 'year',
  //     },
  //   },
  //   create: {
  //     identifier: await genKey([salesPerson.id, salesPerson.name].toString()),
  //     salesperson_id: salesPerson.id,
  //     first_commission: {
  //       percentage: 100,
  //       amount: null,
  //       time: 3,
  //       time_type: 'month',
  //     },
  //     second_commission: {
  //       percentage: 100,
  //       amount: null,
  //       time: 100,
  //       time_type: 'year',
  //     },
  //   },
  // });

  const appOwnerTestUser = await prisma.user.upsert({
    where: { email: 'appowner@gmail.com' },
    update: {
      updated_at: moment().toDate(),
      name: 'Test App Owner',
      password: '$2a$10$ydxrElEay/wrN8z1jvbO1epQjP5dwcAY5eRvsWQvrDJ9EEU2NaXV.',
    },
    create: {
      email: 'appowner@gmail.com',
      name: 'Test App Owner',
      password: '$2a$10$ydxrElEay/wrN8z1jvbO1epQjP5dwcAY5eRvsWQvrDJ9EEU2NaXV.',
      created_at: moment().toDate(),
      role_id: appOwner.id,
    },
  });

  const adminTestUser = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {
      updated_at: moment().toDate(),
      name: 'Test Admin',
      password: '$2a$10$ydxrElEay/wrN8z1jvbO1epQjP5dwcAY5eRvsWQvrDJ9EEU2NaXV.',
    },
    create: {
      email: 'admin@gmail.com',
      name: 'Test Admin',
      password: '$2a$10$ydxrElEay/wrN8z1jvbO1epQjP5dwcAY5eRvsWQvrDJ9EEU2NaXV.',
      created_at: moment().toDate(),
      role_id: adminRole.id,
    },
  });

  const appOwnerTestApp = await prisma.app.create({
    data: {
      bussinessName: 'Test App Owner App',
      industryId: '90210076-dafa-4ef0-93db-6497dead0baf',
      industryOther: '',
      website: 'appowner.com',
      mgpCommission: 0,
      logo: 'https://via.placeholder.com/150',
      showLogo: true,
      firebase_app_id: 'GnoXR02dnODXwcSd4iFK',
      appName: 'Test App',
      appIcon: 'https://via.placeholder.com/150',
      appBanner: 'https://via.placeholder.com/150',
      socialMedia: 'Instagram',
      socialMediaHandler: 'kittyplays',
      checklist: '',
      iosAppLink: '',
      andriodAppLink: '',
      webAppLink: '',
      userId: appOwnerTestUser.id,
      created_at: moment().toDate(),
    },
  });

  await prisma.stripeConnect.upsert({
    where: { userId: appOwnerTestUser.id },
    update: {
      updated_at: moment().toDate(),
      userId: appOwnerTestUser.id,
      stripeAccountId: 'acct_1KEJ9i2S1rM6xP7j',
      stripeConnectUrl: 'http://stripe.com',
      connectStatus: true,
    },
    create: {
      userId: appOwnerTestUser.id,
      stripeAccountId: 'acct_1KEJ9i2S1rM6xP7j',
      stripeConnectUrl: 'http://stripe.com',
      connectStatus: true,
      created_at: moment().toDate(),
      updated_at: moment().toDate(),
    },
  });

  const appOwnerTestUser1 = await prisma.user.upsert({
    where: { email: 'appowner1@gmail.com' },
    update: {
      updated_at: moment().toDate(),
      name: 'Test App Owner',
      password: '$2a$10$ydxrElEay/wrN8z1jvbO1epQjP5dwcAY5eRvsWQvrDJ9EEU2NaXV.',
    },
    create: {
      email: 'appowner1@gmail.com',
      name: 'Test App Owner',
      password: '$2a$10$ydxrElEay/wrN8z1jvbO1epQjP5dwcAY5eRvsWQvrDJ9EEU2NaXV.',
      created_at: moment().toDate(),
      role_id: appOwner.id,
    },
  });

  await prisma.stripeConnect.upsert({
    where: { userId: appOwnerTestUser1.id },
    update: {
      updated_at: moment().toDate(),
      userId: appOwnerTestUser1.id,
      stripeAccountId: 'acct_1KEJ9i2S1rM6xP7j',
      stripeConnectUrl: 'http://stripe.com',
      connectStatus: true,
    },
    create: {
      userId: appOwnerTestUser1.id,
      stripeAccountId: 'acct_1KEJ9i2S1rM6xP7j',
      stripeConnectUrl: 'http://stripe.com',
      connectStatus: true,
      created_at: moment().toDate(),
      updated_at: moment().toDate(),
    },
  });

  const salesPerson = await prisma.user.upsert({
    where: { email: 'lloydmiller@outlook.com' },
    update: {
      updated_at: moment().toDate(),
      name: 'Lloyd Miller',
      password: '$2a$10$ydxrElEay/wrN8z1jvbO1epQjP5dwcAY5eRvsWQvrDJ9EEU2NaXV.',
    },
    create: {
      email: 'lloydmiller@outlook.com',
      name: 'Lloyd Miller',
      password: '$2a$10$ydxrElEay/wrN8z1jvbO1epQjP5dwcAY5eRvsWQvrDJ9EEU2NaXV.',
      created_at: moment().toDate(),
      role_id: salesPersonRole.id,
    },
  });

  await prisma.stripeConnect.upsert({
    where: { userId: salesPerson.id },
    update: {
      updated_at: moment().toDate(),
      userId: salesPerson.id,
      stripeAccountId: 'acct_1KEJ9i2S1rM6xP7j',
      stripeConnectUrl: 'http://stripe.com',
      connectStatus: true,
    },
    create: {
      userId: salesPerson.id,
      stripeAccountId: 'acct_1KEJ9i2S1rM6xP7j',
      stripeConnectUrl: 'http://stripe.com',
      connectStatus: true,
      created_at: moment().toDate(),
      updated_at: moment().toDate(),
    },
  });

  await prisma.commissions.upsert({
    where: { salesperson_id: salesPerson.id },
    update: {
      updated_at: moment().toDate(),
      identifier: await genKey([salesPerson.id, salesPerson.name].toString()),
      salesperson_id: salesPerson.id,
      first_commission: {
        percentage: 15,
        amount: null,
        time: 3,
        time_type: 'month',
      },
      second_commission: {
        percentage: 0,
        amount: null,
        time: 100,
        time_type: 'year',
      },
    },
    create: {
      identifier: await genKey([salesPerson.id, salesPerson.name].toString()),
      salesperson_id: salesPerson.id,
      first_commission: {
        percentage: 15,
        amount: null,
        time: 3,
        time_type: 'month',
      },
      second_commission: {
        percentage: 0,
        amount: null,
        time: 100,
        time_type: 'year',
      },
    },
  });

  const salesPerson1 = await prisma.user.upsert({
    where: { email: 'jackson@nyc.com' },
    update: {
      updated_at: moment().toDate(),
      name: 'Jackson Avenue',
      password: '$2a$10$ydxrElEay/wrN8z1jvbO1epQjP5dwcAY5eRvsWQvrDJ9EEU2NaXV.',
    },
    create: {
      email: 'jackson@nyc.com',
      name: 'Jackson Avenue',
      password: '$2a$10$ydxrElEay/wrN8z1jvbO1epQjP5dwcAY5eRvsWQvrDJ9EEU2NaXV.',
      created_at: moment().toDate(),
      role_id: salesPersonRole.id,
    },
  });

  await prisma.stripeConnect.upsert({
    where: { userId: salesPerson1.id },
    update: {
      updated_at: moment().toDate(),
      userId: salesPerson1.id,
      stripeAccountId: 'acct_1KEJ9i2S1rM6xP7j',
      stripeConnectUrl: 'http://stripe.com',
      connectStatus: true,
    },
    create: {
      userId: salesPerson1.id,
      stripeAccountId: 'acct_1KEJ9i2S1rM6xP7j',
      stripeConnectUrl: 'http://stripe.com',
      connectStatus: true,
      created_at: moment().toDate(),
      updated_at: moment().toDate(),
    },
  });

  await prisma.commissions.upsert({
    where: { salesperson_id: salesPerson1.id },
    update: {
      updated_at: moment().toDate(),
      identifier: await genKey([salesPerson1.id, salesPerson1.name].toString()),
      salesperson_id: salesPerson1.id,
      first_commission: {
        percentage: 15,
        amount: null,
        time: 3,
        time_type: 'month',
      },
      second_commission: {
        percentage: 0,
        amount: null,
        time: 100,
        time_type: 'year',
      },
    },
    create: {
      identifier: await genKey([salesPerson1.id, salesPerson1.name].toString()),
      salesperson_id: salesPerson1.id,
      first_commission: {
        percentage: 15,
        amount: null,
        time: 3,
        time_type: 'month',
      },
      second_commission: {
        percentage: 0,
        amount: null,
        time: 100,
        time_type: 'year',
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
