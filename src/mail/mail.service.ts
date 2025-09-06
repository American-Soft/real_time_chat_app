import { MailerService } from "@nestjs-modules/mailer";
import { Injectable, RequestTimeoutException } from "@nestjs/common";

@Injectable()
export class MailService {
    constructor(private readonly mailerService: MailerService) { }

    /**
   * Sending verify email template
   * @param email email of the registered user
   * @param link link with id of the user and verification token
   */

    public async sendVerifyEmailTemplate(email: string, link: string) {
        try {
            await this.mailerService.sendMail({
                to: email,
                from: `<americansoft@gmai.com>`,
                subject: 'Verify your account',
                template: 'verify-email',
                context: { link }
            })
        } catch (error) {
            throw new RequestTimeoutException();
        }
    }

    /**
     * Sending reset password template
     * @param email email of the user
     * @param resetPasswordLink link with id of the user and reset password token
     */
    public async sendResetPasswordTemplate(email: string, resetPasswordLink: string) {
        try {
            await this.mailerService.sendMail({
                to: email,
                from: `<americansoft@gmail.com>`,
                subject: 'Reset password',
                template: 'reset-password',
                context: { resetPasswordLink }
            })
        } catch (error) {
            throw new RequestTimeoutException();
        }
    }


}