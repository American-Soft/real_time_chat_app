import { OnEvent } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import { MailService } from '../../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { User } from '../user.entity';
import { join } from 'path';
import { promises as fs } from 'fs';

@Injectable()
export class UserEventsListener {
    constructor(
        private readonly mailService: MailService,
        private readonly config: ConfigService
    ) { }

    @OnEvent('user.registered', { async: true })
    async handleUserRegistered(payload: { user: User }) {
        const { user } = payload;
        const verifyLink = `${this.config.get('DOMAIN')}/user/verify-email/${user.id}/${user.verificationToken}`;
        await this.mailService.sendVerifyEmailTemplate(user.email, verifyLink);
    }

    @OnEvent('user.deleted', { async: true })
    async handleUserDeleted(payload: { user: User }) {
        const { user } = payload;

        if (user.profileImage) {
            const imagePath = join(process.cwd(), 'profile-images', user.profileImage);
            try {
                await fs.unlink(imagePath);
            } catch (err) {
                console.warn(`Failed to delete profile image: ${err.message}`);

            }

        }
    }
}