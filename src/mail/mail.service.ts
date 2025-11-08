import { MailerService } from "@nestjs-modules/mailer";
import {
    Injectable,
    Logger,
    RequestTimeoutException,
    InternalServerErrorException,
} from "@nestjs/common";

interface MailTemplateOptions {
    to: string;
    subject: string;
    template: string;
    context: Record<string, any>;
}

@Injectable()
export class MailService {
    private readonly defaultSender = '"AmericanSoft" <americansoft@gmail.com>';

    constructor(private readonly mailerService: MailerService) { }

    private async sendTemplate({
        to,
        subject,
        template,
        context,
    }: MailTemplateOptions) {
        try {
            await this.mailerService.sendMail({
                to,
                from: this.defaultSender,
                subject,
                template,
                context,
            });
        } catch (error) {
            if (error.code === 'ETIMEDOUT') {
                throw new RequestTimeoutException('Email sending timed out.');
            }

            throw new InternalServerErrorException(
                'Something went wrong while sending the email.',
            );
        }
    }

    /**
     * Send verification email
     */
    public sendVerifyEmailTemplate(email: string, link: string) {
        return this.sendTemplate({
            to: email,
            subject: 'Verify your account',
            template: 'verify-email',
            context: { link },
        });
    }

    /**
     * Send reset password email
     */
    public sendResetPasswordTemplate(email: string, resetPasswordLink: string) {
        return this.sendTemplate({
            to: email,
            subject: 'Reset your password',
            template: 'reset-password',
            context: { resetPasswordLink },
        });
    }
}
