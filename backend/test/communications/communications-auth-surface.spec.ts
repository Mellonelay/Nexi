import { GUARDS_METADATA } from '@nestjs/common/constants';
import { CommunicationsController } from '../../src/communications/communications.controller';
import { AuthSurfaceGuard } from '../../src/auth/auth-surface.guard';
import { AUTH_SURFACE_METADATA } from '../../src/auth/auth-surface.decorator';
import { AuthSurface } from '../../src/auth/auth.types';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';

const expectedSurface: Record<string, AuthSurface> = {
  supportThread: 'PUBLIC',
  supportMessage: 'PUBLIC',
  uploadSupportAttachment: 'PUBLIC',
  getSupportAttachment: 'PUBLIC',
  message: 'PUBLIC',
  readMessage: 'PUBLIC',
  messages: 'PUBLIC',
  conversations: 'PUBLIC',
  reportConversation: 'PUBLIC',
  notifications: 'PUBLIC',
  read: 'PUBLIC',
  createAnnouncement: 'ADMIN',
  updateAnnouncement: 'ADMIN',
  publishAnnouncement: 'ADMIN',
  adminMessages: 'ADMIN',
  markAdminMessageRead: 'ADMIN',
  adminMessageModeration: 'ADMIN',
  resolveMessageModeration: 'ADMIN',
  adminNotifications: 'ADMIN',
  sendAdminNotification: 'ADMIN',
  adminLearnArticles: 'ADMIN',
  adminLearnCategories: 'ADMIN',
  createLearnCategory: 'ADMIN',
  updateLearnCategoryStatus: 'ADMIN',
  createLearn: 'ADMIN',
  updateLearn: 'ADMIN',
  publishLearn: 'ADMIN',
};

describe('CommunicationsController authentication surfaces', () => {
  const controller = CommunicationsController.prototype;

  it('declares an expected surface for every JWT-protected handler', () => {
    const jwtHandlers = Object.getOwnPropertyNames(controller).filter((name) => {
      const handler = controller[name as keyof typeof controller];
      return typeof handler === 'function'
        && (Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[] | undefined)?.includes(JwtAuthGuard);
    });

    expect(jwtHandlers.sort()).toEqual(Object.keys(expectedSurface).sort());
  });

  it.each(Object.entries(expectedSurface))('%s requires the %s surface', (name, surface) => {
    const handler = controller[name as keyof typeof controller];
    const guards = Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[] | undefined;

    expect(guards).toContain(JwtAuthGuard);
    expect(guards).toContain(AuthSurfaceGuard);
    expect(Reflect.getMetadata(AUTH_SURFACE_METADATA, handler)).toBe(surface);
  });
});
