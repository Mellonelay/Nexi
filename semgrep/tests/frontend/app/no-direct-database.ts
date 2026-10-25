// ruleid: nexi.browser-surfaces-no-database-client
import { PrismaClient } from '@prisma/client';

// ok: browser surfaces use the Backend API.
const loadWallet = () => fetch('/wallet/overview');

void PrismaClient;
void loadWallet;
